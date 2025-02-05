export type RepoInfo = {
  remote?: {
    hostname: string;
    owner: string;
    name: string;
  };
  rootDir: string;
  dotDir: string;
  trunkBranch: string;
};
