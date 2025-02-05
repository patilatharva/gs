import type { PRNumber } from './common';

export type PRInfo = {
  branchName: string;
  title: string;
  state: 'OPEN' | 'MERGED' | 'CLOSED';
  isDraft: boolean;
  number: PRNumber;
  // TODO: Add CI here
};
