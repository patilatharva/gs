import yargs from 'yargs';
import { submitAction } from '../actions/submit/submit_action';
import { SCOPE } from '../lib/engine/scope_spec';
import { graphite } from '../lib/runner';

/**
 * Primary interaction patterns:
 *
 * # (default) allows user to edit PR fields inline and then submits stack as a draft
 * gs stack submit
 *
 * # skips editing PR fields inline, submits stack as a draft
 * gs stack submit --no-edit
 *
 * # allows user to edit PR fields inline, then opens as draft
 * gs stack submit --draft
 *
 * # allows user to edit PR fields inline, then publishes
 * gs stack submit --publish
 *
 * # same as gs stack submit --no-edit
 * gs stack submit --no-interactive
 *
 */
export const args = {
  draft: {
    describe:
      'If set, marks PR as draft. If --no-interactive is true, new PRs will be created in draft mode.',
    type: 'boolean',
    default: false,
    alias: 'd',
  },
  publish: {
    describe:
      'If set, publishes PR. If --no-interactive is true, new PRs will be created in draft mode.',
    type: 'boolean',
    default: false,
    alias: 'p',
  },
  edit: {
    describe:
      'Edit PR fields inline. If --no-interactive is true, this is automatically set to false.',
    type: 'boolean',
    alias: 'e',
  },
  'no-edit': {
    type: 'boolean',
    describe: "Don't edit PR fields inline. Takes precedence over --edit",
    demandOption: false,
    default: false,
    alias: 'n',
  },
  reviewers: {
    describe:
      'If set without an argument, prompt to manually set reviewers. Alternatively, accepts a comma separated string of reviewers',
    type: 'string',
    alias: 'r',
  },
  'dry-run': {
    describe:
      'Reports the PRs that would be submitted and terminates. No branches are pushed and no PRs are opened or updated.',
    type: 'boolean',
    default: false,
  },
  confirm: {
    describe:
      'Reports the PRs that would be submitted and asks for confirmation before pushing branches and opening/updating PRs. If either of --no-interactive or --dry-run is passed, this flag is ignored.',
    type: 'boolean',
    default: false,
    alias: 'c',
  },
  select: {
    describe:
      'Reports the PRs that would be submitted and asks the user to select which should be updated/created. If either of --no-interactive or --dry-run is passed, this flag is ignored.',
    type: 'boolean',
    default: false,
    alias: 's',
  },
  'update-only': {
    describe: 'Only update the PRs that have been already been submitted.',
    type: 'boolean',
    default: false,
    alias: 'u',
  },
  force: {
    describe:
      'Force push: overwrites the remote branch with your local branch. Otherwise defaults to --force-with-lease.',
    type: 'boolean',
    default: false,
    alias: 'f',
  },
  always: {
    describe:
      'Always push updates, even if the branch has not changed. Can be helpful for fixing an inconsistent gs stack view on Web/GitHub resulting from downtime/a bug.',
    type: 'boolean',
    default: false,
  },
  branch: {
    describe: 'Which branch to run this command from (default: current branch)',
    type: 'string',
  },
  'merge-when-ready': {
    describe:
      'If set, marks the PRs are merge when ready, which will let them automatically merge as soon as all merge requirements are met.',
    type: 'boolean',
    default: false,
    alias: 'm',
  },
  downstack: {
    describe: 'only submit all branches from trunk to the current branch.',
    type: 'boolean',
    default: false,
    alias: 'd',
  },
} as const;

export const builder = args;
export const aliases = ['s'];
export const command = 'submit';
export type argsT = yargs.Arguments<yargs.InferredOptionTypes<typeof args>>;

export const canonical = 'submit';
export const description =
  'Idempotently force push all branches in the current stack to GitHub, creating or updating distinct pull requests for each.';

export const handler = async (argv: argsT): Promise<void> => {
  await graphite(argv, canonical, async (context) => {
    await submitAction(
      {
        scope: argv.downstack ? SCOPE.DOWNSTACK : SCOPE.STACK,
        editPRFieldsInline: !argv['no-edit'] && argv.edit,
        draft: argv.draft,
        publish: argv.publish,
        dryRun: argv['dry-run'],
        updateOnly: argv['update-only'],
        reviewers: argv.reviewers,
        confirm: argv.confirm,
        forcePush: argv.force,
        select: argv.select,
        always: argv.always,
        branch: argv.branch,
        mergeWhenReady: argv['merge-when-ready'],
      },
      context
    );
  });
};
