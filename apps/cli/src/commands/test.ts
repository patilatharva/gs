import yargs from 'yargs';
import { testStack } from '../actions/test';
import { SCOPE, TScopeSpec } from '../lib/engine/scope_spec';
import { graphite } from '../lib/runner';

const args = {
  command: {
    describe: `The command you'd like to run on each branch of your stack.`,
    type: 'string',
    demandOption: true,
    alias: 'c',
    positional: true,
    hidden: true,
  },
  trunk: {
    describe: `Run the command on the trunk branch in addition to the rest of the stack.`,
    type: 'boolean',
    demandOption: false,
    default: false,
    alias: 't',
  },
  downstack: {
    describe: `Run the command on each branch from the trunk to the current branch.`,
    type: 'boolean',
    demandOption: false,
    alias: 'd',
  },
  upstack: {
    describe: `Run the command for each of the current branch and its descendants.`,
    type: 'boolean',
    demandOption: false,
    alias: 'u',
  },
} as const;
type argsT = yargs.Arguments<yargs.InferredOptionTypes<typeof args>>;

export const command = 'test <command>';
export const canonical = 'stack test';
export const aliases = ['t'];
export const description =
  'Run the provided command on each branch in the current stack and aggregate the results.';
export const builder = args;
export const handler = async (argv: argsT): Promise<void> =>
  graphite(argv, canonical, async (context) => {
    let scope: TScopeSpec;
    if (argv.downstack) {
      scope = SCOPE.DOWNSTACK;
    } else if (argv.upstack) {
      scope = SCOPE.UPSTACK;
    } else {
      scope = SCOPE.STACK;
    }

    testStack(
      { scope, includeTrunk: argv.trunk, command: argv.command },
      context
    );
  });
