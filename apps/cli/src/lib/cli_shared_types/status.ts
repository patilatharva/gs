import type { ChangedFile } from './changed-file';

export type Status = {
  files: ChangedFile[];
  conflicts: boolean;
};
