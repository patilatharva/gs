/**
 * For example, "7" for PR #7 on GitHub.
 */
export type PRNumber = string;

export type BranchName = string;

/**
 * Path relative to repository root dir. Generally, most paths should be RepoRelativePaths,
 * and only convert to CwdRelativePath or basenames or AbsolutePath when needed.
 */
export type RepoRelativePath = string;
