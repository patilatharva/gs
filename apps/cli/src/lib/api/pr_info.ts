import { API_ROUTES } from '@withgraphite/graphite-cli-routes';

import t from '@withgraphite/retype';
import { execSync } from 'child_process';

type TBranchNameWithPrNumber = {
  branchName: string;
  prNumber: number | undefined;
};

export type TPRInfoToUpsert = t.UnwrapSchemaMap<
  typeof API_ROUTES.pullRequestInfo.response
>['prs'];

export async function getPrInfoForBranches(
  branchNamesWithExistingPrInfo: TBranchNameWithPrNumber[]
): Promise<TPRInfoToUpsert> {
  // We sync branches without existing PR info by name.  For branches
  // that are already associated with a PR, we only sync if both the
  // the associated PR (keyed by number) if the name matches the headRef.

  const branchesWithoutPrInfo = new Set<string>();
  const existingPrInfo = new Map<number, string>();

  branchNamesWithExistingPrInfo.forEach((branch) => {
    if (branch?.prNumber === undefined) {
      branchesWithoutPrInfo.add(branch.branchName);
    } else {
      existingPrInfo.set(branch.prNumber, branch.branchName);
    }
  });

  try {
    // Gh CLI allows for looking up by pr number or branch name
    const results = await Promise.all(
      [...existingPrInfo.keys(), ...branchesWithoutPrInfo].map(async (prId) => {
        try {
          const pr = JSON.parse(
            execSync(
              `gh pr view ${prId} --json state,url,title,body,number,headRefName,baseRefName,reviewDecision,isDraft`
            ).toString()
          );

          pr.prNumber = pr.number;
          delete pr.number;

          if (pr.reviewDecision === '') {
            pr.reviewDecision = undefined;
          }

          return pr;
        } catch (error) {
          if (
            error instanceof Error &&
            error.message.includes('no pull requests found')
          ) {
            return null;
          }

          throw error;
        }
      })
    );

    const response: TPRInfoToUpsert = results.filter((pr) => pr !== null);

    return response.filter((pr) => {
      const branchNameIfAssociated = existingPrInfo.get(pr.prNumber);

      const shouldAssociatePrWithBranch =
        !branchNameIfAssociated &&
        pr.state === 'OPEN' &&
        branchesWithoutPrInfo.has(pr.headRefName);

      const shouldUpdateExistingBranch =
        branchNameIfAssociated === pr.headRefName;

      return shouldAssociatePrWithBranch || shouldUpdateExistingBranch;
    });
  } catch {
    // Not really sure why this pattern was accepted but when this used the
    // Graphite API they'd just return an empty array if the request failed.
    return [];
  }
}
