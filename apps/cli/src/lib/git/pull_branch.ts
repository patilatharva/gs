import { CommandFailedError, runGitCommand } from './runner';

/**
 * Fast-forwards a local branch ref to match remote without switching branches.
 * Returns OK if the branch was fast-forwarded successfully.
 * Returns CONFLICT if it could not be fast-forwarded.
 */
export function fetchTrunk(
  remote: string,
  branchName: string
): 'OK' | 'CONFLICT' {
  try {
    runGitCommand({
      args: [`fetch`, remote, `${branchName}:${branchName}`],
      options: { stdio: 'pipe' },
      onError: 'throw',
      resource: 'fetchTrunk',
    });
    return 'OK';
  } catch (e: unknown) {
    if (e instanceof CommandFailedError) {
      return 'CONFLICT';
    }
    throw e;
  }
}

/**
 * Returns OK if the branch was fast-forwarded successfully
 * Returns CONFLICT if it could not be fast-forwarded
 */
export function pullBranch(
  remote: string,
  branchName: string
): 'OK' | 'CONFLICT' {
  try {
    runGitCommand({
      args: [`pull`, `--ff-only`, remote, branchName],
      options: { stdio: 'pipe' },
      onError: 'throw',
      resource: 'pullBranch',
    });
    return 'OK';
  } catch (e: unknown) {
    if (
      e instanceof CommandFailedError &&
      e.message.includes('fatal: Not possible to fast-forward, aborting.')
    ) {
      return 'CONFLICT';
    }
    throw e;
  }
}
