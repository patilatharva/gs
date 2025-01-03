import yargs from 'yargs';
import { restackBranches } from '../actions/restack';
import { SCOPE } from '../lib/engine/scope_spec';
import { graphite } from '../lib/runner';

const args = {
  branch: {
    describe: 'Which branch to run this command from (default: current branch)',
    type: 'string',
  },
  only: {
    describe: 'Only restack this branch',
    type: 'boolean',
    demandOption: false,
    alias: 'o',
  },
  downstack: {
    describe:
      'From trunk to the current branch, ensure each is based on its parent, rebasing if necessary.',
    type: 'boolean',
    demandOption: false,
    alias: 'd',
  },
  upstack: {
    describe:
      'Ensure the current branch and each of its descendants is based on its parent, rebasing if necessary.',
    type: 'boolean',
    demandOption: false,
    alias: 'u',
  },
} as const;
type argsT = yargs.Arguments<yargs.InferredOptionTypes<typeof args>>;

export const aliases = ['r', 'fix', 'f'];
export const command = 'restack';
export const canonical = 'restack';
export const description =
  'Ensure each branch in the current stack is based on its parent, rebasing if necessary.';
export const builder = args;
export const handler = async (argv: argsT): Promise<void> =>
  graphite(argv, canonical, async (context) => {
    let branchNames: Array<string>;

    // Only this stack.
    if (argv.only) {
      context.splog.tip(
        [
          `You are restacking a specific branch.`,
          `In common cases, we recommend you use:`,
          `▸ gs restack`,
          `▸ gs restack --upstack`,
          `because these will ensure any upstack branches will be restacked on their restacked parents.`,
          `If this branch has any descendants, they will likely need a restack after this command.`,
        ].join('\n')
      );
      branchNames = [context.engine.currentBranchPrecondition];

      // Downstack.
    } else if (argv.downstack) {
      context.splog.tip(
        [
          `You are restacking with downstack scope.`,
          `In common cases, we recommend you use:`,
          `▸ gs restack`,
          `▸ gs restack --upstack`,
          `because these will ensure any upstack branches will be restacked on their restacked parents.`,
          `If this branch has any descendants, they will likely need a restack after this command.`,
        ].join('\n')
      );
      branchNames = context.engine.getRelativeStack(
        context.engine.currentBranchPrecondition,
        SCOPE.DOWNSTACK
      );

      // Upstack.
    } else if (argv.upstack) {
      branchNames = context.engine.getRelativeStack(
        context.engine.currentBranchPrecondition,
        SCOPE.UPSTACK
      );

      // The entire stack.
    } else {
      branchNames = context.engine.getRelativeStack(
        argv.branch ?? context.engine.currentBranchPrecondition,
        SCOPE.STACK
      );
    }

    return restackBranches(branchNames, context);
  });
