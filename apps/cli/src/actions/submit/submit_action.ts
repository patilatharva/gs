import chalk from 'chalk';
import { TContext } from '../../lib/context';
import { TScopeSpec } from '../../lib/engine/scope_spec';
import { ExitFailedError, KilledError } from '../../lib/errors';
import { CommandFailedError } from '../../lib/git/runner';
import { getPRInfoForBranches } from './prepare_branches';
import { validateBranchesToSubmit } from './validate_branches';
import { submitPullRequest } from './submit_prs';
import {
  buildLocalPrStack as generateLocalPrStack,
  createPrBodyFooter,
  footerFooter,
  footerTitle,
} from '../create_pr_body_footer';
import { execFileSync, execSync } from 'child_process';
import assert from 'assert';

// eslint-disable-next-line max-lines-per-function
export async function submitAction(
  args: {
    scope: TScopeSpec;
    editPRFieldsInline: boolean | undefined;
    draft: boolean;
    publish: boolean;
    dryRun: boolean;
    updateOnly: boolean;
    reviewers: string | undefined;
    confirm: boolean;
    forcePush: boolean;
    select: boolean;
    always: boolean;
    branch: string | undefined;
    mergeWhenReady: boolean;
  },
  context: TContext
): Promise<void> {
  // Check CLI pre-condition to warn early
  if (args.draft && args.publish) {
    throw new ExitFailedError(
      `Can't use both --publish and --draft flags in one command`
    );
  }
  const populateRemoteShasPromise = context.engine.populateRemoteShas();
  if (args.dryRun) {
    context.splog.info(
      chalk.yellow(
        `Running submit in 'dry-run' mode. No branches will be pushed and no PRs will be opened or updated.`
      )
    );
    context.splog.newline();
    args.editPRFieldsInline = false;
  }

  if (!context.interactive) {
    args.editPRFieldsInline = false;
    args.reviewers = undefined;

    context.splog.info(
      `Running in non-interactive mode. Inline prompts to fill PR fields will be skipped${
        !(args.draft || args.publish)
          ? ' and new PRs will be created in draft mode'
          : ''
      }.`
    );
    context.splog.newline();
  }

  const allBranchNames = context.engine
    .getRelativeStack(context.engine.currentBranchPrecondition, args.scope)
    .filter((branchName) => !context.engine.isTrunk(branchName));

  const branchNames = args.select
    ? await selectBranches(context, allBranchNames)
    : allBranchNames;

  context.splog.info(
    chalk.blueBright(`🥞 Validating that this gs stack is ready to submit...`)
  );
  context.splog.newline();
  await validateBranchesToSubmit(branchNames, context);

  context.splog.info(
    chalk.blueBright('✏️ Preparing to submit PRs for the following branches...')
  );
  await populateRemoteShasPromise;
  const submissionInfos = await getPRInfoForBranches(
    {
      branchNames: branchNames,
      editPRFieldsInline: args.editPRFieldsInline && context.interactive,
      draft: args.draft,
      publish: args.publish,
      updateOnly: args.updateOnly,
      reviewers: args.reviewers,
      dryRun: args.dryRun,
      select: args.select,
      always: args.always,
    },
    context
  );

  if (
    await shouldAbort(
      { ...args, hasAnyPrs: submissionInfos.length > 0 },
      context
    )
  ) {
    return;
  }

  context.splog.info(
    chalk.blueBright('🌎 Pushing to remote and creating/updating PRs...')
  );

  for (const submissionInfo of submissionInfos) {
    try {
      context.engine.pushBranch(submissionInfo.head, args.forcePush);
    } catch (err) {
      if (
        err instanceof CommandFailedError &&
        err.message.includes('stale info')
      ) {
        throw new ExitFailedError(
          [
            `Force-with-lease push of ${chalk.yellow(
              submissionInfo.head
            )} failed due to external changes to the remote branch.`,
            'If you are collaborating on this stack, try `gs downstack get` to pull in changes.',
            'Alternatively, use the `--force` option of this command to bypass the stale info warning.',
          ].join('\n')
        );
      }
      throw err;
    }

    await submitPullRequest(
      {
        submissionInfo: [submissionInfo],
        mergeWhenReady: args.mergeWhenReady,
        trunkBranchName: context.engine.trunk,
      },
      context
    );
  }

  context.splog.info(
    chalk.blueBright('\n📌 Updating dependency stacks in PR bodies...')
  );

  // Get the merged downstack that we'll have to prepend to each stack.
  // We have to infer this from GitHub because the PR info of merged branches
  // gets lost locally.
  const commonMergedDownstack = await getCommonMergedDownstackAsync(
    context,
    branchNames
  );

  for (const branch of branchNames) {
    const prInfo = context.engine.getPrInfo(branch);
    if (!prInfo) {
      throw new Error(`PR info is undefined for branch ${branch}`);
    }

    const newLocalStack = generateLocalPrStack({
      context,
      prBranch: branch,
    });
    let prStackToSubmit: Array<string> | null =
      commonMergedDownstack.concat(newLocalStack);
    // If the stack only has a single branch, don't submit it.
    if (prStackToSubmit.length === 1) {
      prStackToSubmit = null;
    }

    const existingStack = getExistingPrStack(prInfo.body);
    const hasPrFooterChanged =
      JSON.stringify(existingStack) !== JSON.stringify(prStackToSubmit);

    if (hasPrFooterChanged) {
      const newPrFooter = createPrBodyFooter(prStackToSubmit, prInfo.number);
      execFileSync('gh', [
        'pr',
        'edit',
        `${prInfo.number}`,
        '--body',
        updatePrBodyFooter(prInfo.body, newPrFooter),
      ]);
    }
    context.splog.info(
      `${chalk.green(branch)}: ${prInfo.url} (${
        hasPrFooterChanged ? chalk.yellow('updated') : 'no-op'
      })`
    );
  }

  if (!context.interactive) {
    return;
  }
}

function getExistingPrStack(body: string | undefined): Array<string> | null {
  if (!body) {
    return null;
  }

  const prStackPattern = new RegExp(
    // Matches one or more digits.
    `\\d+` +
      // Matches the literal period '.'.
      `\\.` +
      // Matches a space character.
      `\\s` +
      // Matches the # symbol followed by one or more digits.
      `#\\d+`,
    'g'
  );

  const prStack = body.match(prStackPattern);
  return prStack ? Array.from(prStack) : null;
}

async function getCommonMergedDownstackAsync(
  context: TContext,
  branchNames: Array<string>
): Promise<Array<string>> {
  // Generate the local PR stack of an arbitrary branch in the stack.
  assert(branchNames.length > 0);
  const localStack = generateLocalPrStack({
    context,
    prBranch: branchNames[0],
  });

  // Get that branch's last generated PR stack from its GitHub PR body.
  const prInfo = context.engine.getPrInfo(branchNames[0]);
  const existingStack = getExistingPrStack(prInfo?.body);

  if (
    !existingStack ||
    JSON.stringify(localStack) === JSON.stringify(existingStack)
  ) {
    // No merged downstack.
    return [];
  }

  // Find the last merged PR in the existing PR stack on GitHub.
  const nodesInLocalStack = new Set(localStack);
  for (let idx = existingStack.length - 1; idx >= 0; idx--) {
    const existingStackNode = existingStack[idx];

    if (nodesInLocalStack.has(existingStackNode)) {
      // Not merged.
      continue;
    }

    // We know this PR is closed or merged because its branch is missing locally.
    const prId = existingStackNode.split('#')[1]?.trim();
    const closedOrMergedPrInfo = await JSON.parse(
      execSync(`gh pr view ${prId} --json state`).toString()
    );

    // If this PR's merged, the relevant downstack (that's now lost locally),
    // is this PR plus its parents in the PR list.
    if (closedOrMergedPrInfo.state === 'MERGED') {
      const mergedDownstack = existingStack.slice(0, idx + 1);
      return mergedDownstack;
    }
  }

  // No merged downstack.
  return [];
}

export function updatePrBodyFooter(
  body: string | undefined,
  footer: string
): string {
  if (!body) {
    return footer;
  }

  const regex = new RegExp(
    // String value of the footer title, allowing for any surrounding whitespace.
    `\\s*${footerTitle.trim()}\\s*` +
      // Any characters in between.
      `[\\s\\S]*` +
      // String value of the footer footer ("This tree was auto-generated
      // by...") with any special characters escaped + allowing for any
      // surrounding whitespace.
      `\\s*${footerFooter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').trim()}\\s*`
  );

  // If the footer doesn't exist, just append.
  if (!regex.test(body)) {
    return body + footer;
  }

  return body.replace(regex, footer);
}

async function selectBranches(
  context: TContext,
  branchNames: string[]
): Promise<string[]> {
  const result = [];
  for (const branchName of branchNames) {
    const selected = (
      await context.prompts({
        name: 'value',
        initial: true,
        type: 'confirm',
        message: `Would you like to submit ${chalk.cyan(branchName)}?`,
      })
    ).value;
    // Clear the prompt result
    process.stdout.moveCursor(0, -1);
    process.stdout.clearLine(1);
    if (selected) {
      result.push(branchName);
    }
  }
  return result;
}

async function shouldAbort(
  args: { dryRun: boolean; confirm: boolean; hasAnyPrs: boolean },
  context: TContext
): Promise<boolean> {
  if (args.dryRun) {
    context.splog.info(chalk.blueBright('✅ Dry run complete.'));
    return true;
  }

  if (!args.hasAnyPrs) {
    context.splog.info(chalk.blueBright('🆗 All PRs up to date.'));
    return true;
  }

  if (
    context.interactive &&
    args.confirm &&
    !(
      await context.prompts({
        type: 'confirm',
        name: 'value',
        message: 'Continue with this submit operation?',
        initial: true,
      })
    ).value
  ) {
    context.splog.info(chalk.blueBright('🛑 Aborted submit.'));
    throw new KilledError();
  }

  return false;
}
