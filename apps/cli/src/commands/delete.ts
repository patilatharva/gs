import yargs from 'yargs';
import { deleteBranchAction } from '../actions/delete_branch';
import { graphite } from '../lib/runner';
import { interactiveBranchSelection } from '../actions/log';

const args = {
  branch: {
    describe: 'The name of the branch to delete.',
    type: 'string',
    positional: true,
    demandOption: false,
    hidden: true,
  },
  force: {
    describe: `Delete the branch even if it is not merged or closed.`,
    demandOption: false,
    type: 'boolean',
    alias: 'f',
    default: false,
  },
} as const;
type argsT = yargs.Arguments<yargs.InferredOptionTypes<typeof args>>;

export const aliases = ['dl'];
export const command = 'delete [name]';
export const canonical = 'delete';
export const description =
  'Delete a branch and its corresponding Charcoal metadata.';
export const builder = args;
export const handler = async (argv: argsT): Promise<void> =>
  graphite(argv, canonical, async (context) => {
    const branchToDelete =
      argv.branch ??
      (await interactiveBranchSelection(
        {
          message: `Choose a branch to delete (autocomplete or arrow keys)`,
        },
        context
      ));

    deleteBranchAction(
      { branchName: branchToDelete, force: argv.force },
      context
    );
  });
