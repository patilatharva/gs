import { Argv } from 'yargs';

export const command = 'user <command>';
export const desc =
  "Read or write gs's user configuration settings. Run `gs user --help` to learn more.";

export const builder = function (yargs: Argv): Argv {
  return yargs
    .commandDir('user-commands', {
      extensions: ['js'],
    })
    .strict()
    .demandCommand();
};
