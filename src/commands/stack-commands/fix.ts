import yargs from "yargs";
import { fixAction } from "../../actions/fix";
import { profiledHandler } from "../../lib/telemetry";

export const command = "fix";
export const description =
  "Rebase any upstream branches onto the latest commit (HEAD) of the current branch.";

const args = {
  silent: {
    describe: `silence output from the command`,
    demandOption: false,
    default: false,
    type: "boolean",
    alias: "s",
  },
  onto: {
    describe: `A branch to restack the current stack onto`,
    demandOption: false,
    optional: true,
    type: "string",
  },
} as const;
type argsT = yargs.Arguments<yargs.InferredOptionTypes<typeof args>>;
export const builder = args;

export const handler = async (argv: argsT): Promise<void> => {
  return profiledHandler(command, async () => {
    await fixAction(argv.silent);
  });
};