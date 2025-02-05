import type { RepoRelativePath } from './common';

export type ChangedFileType =
  | `${'TRACKED' | 'PARTIALLY_TRACKED' | 'UNTRACKED'}_${
      | 'ADD'
      | 'MODIFY'
      | 'REMOVE'
      | 'COPY'
      | 'RENAME'}`
  | 'UNRESOLVED'
  | 'RESOLVED';
export type ChangedFile = {
  path: RepoRelativePath;
  status: ChangedFileType;
  /**
   * If this file is copied from another, this is the path of the original file
   * If this file is renamed from another, this is the path of the original file, and another change of type 'R' will exist.
   * */
  copy?: RepoRelativePath;
};

export type ChangedFiles = {
  files: ChangedFile[];
  total: number;
};
