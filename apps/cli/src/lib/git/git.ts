import { addAll } from './add_all';
import {
  deleteBranch,
  forceCheckoutNewBranch,
  forceCreateBranch,
  getCurrentBranchName,
  moveBranch,
  switchBranch,
} from './branch_ops';
import { clean } from './clean';
import { commit } from './commit';
import { getCommitAuthor, getCommitDate } from './commit_info';
import { getCommitRange } from './commit_range';
import { getCommitTree } from './commit_tree';
import {
  detectStagedChanges,
  getUnstagedChanges,
  showDiff,
  isDiffEmpty,
  getDiff,
} from './diff';
import {
  fetchBranch,
  readFetchBase,
  readFetchHead,
  writeFetchBase,
} from './fetch_branch';
import { getFilesChanged } from './files_changed';
import { getFileContents } from './file_contents';
import { findRemoteBranch } from './find_remote_branch';
import { getUserEmail } from './get_email';
import { getShaOrThrow, getSha, composeGetRemoteSha } from './get_sha';
import { getGitEditor, getGitPager } from './git_editor';
import { unstagedChanges, trackedUncommittedChanges } from './git_status_utils';
import { isMerged } from './is_merged';
import { logLong } from './log';
import { getMergeBase } from './merge_base';
import { getUnmergedFiles, getRebaseHead } from './merge_conflict_help';
import { pruneRemote } from './prune_remote';
import {
  fetchRemoteTrackingBranch,
  fetchTrunk,
  pullBranch,
} from './pull_branch';
import { pushBranch } from './push_branch';
import {
  rebase,
  rebaseContinue,
  rebaseAbort,
  rebaseInteractive,
} from './rebase';
import { rebaseInProgress } from './rebase_in_progress';
import { hardReset, mixedReset, softReset, trackedReset } from './reset_branch';
import { restoreFile } from './restore_file';
import { setRemoteTracking } from './set_remote_tracking';
import { showCommits } from './show_commits';
import { getBranchNamesAndRevisions } from './sorted_branch_names';
import { getStatus } from './status';

export type TGit = ReturnType<typeof composeGitInternal>;
export function composeGit(): TGit {
  return composeGitInternal();
}

function composeGitInternal() {
  return {
    ...composeGetRemoteSha(),
    addAll,
    getCommitAuthor,
    getCommitDate,
    getFilesChanged,
    getStatus,
    getCurrentBranchName,
    moveBranch,
    deleteBranch,
    switchBranch,
    getDiff,
    forceCheckoutNewBranch,
    forceCreateBranch,
    getCommitRange,
    getCommitTree,
    commit,
    detectStagedChanges,
    getUnstagedChanges,
    showDiff,
    isDiffEmpty,
    fetchBranch,
    readFetchHead,
    readFetchBase,
    writeFetchBase,
    findRemoteBranch,
    getUserEmail,
    getShaOrThrow,
    getSha,
    getGitEditor,
    getGitPager,
    unstagedChanges,
    trackedUncommittedChanges,
    isMerged,
    logLong,
    getMergeBase,
    getUnmergedFiles,
    getRebaseHead,
    pruneRemote,
    showCommits,
    getFileContents,
    fetchTrunk,
    fetchRemoteTrackingBranch,
    pullBranch,
    pushBranch,
    rebaseInProgress,
    rebase,
    rebaseContinue,
    rebaseAbort,
    rebaseInteractive,
    softReset,
    mixedReset,
    hardReset,
    trackedReset,
    setRemoteTracking,
    getBranchNamesAndRevisions,
    clean,
    restoreFile,
  };
}
