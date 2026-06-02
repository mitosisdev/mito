// src/review.ts — reviewer-side logic.
//
// reviewList gathers what the reviewer needs to judge each open PR (files +
// CI). mergeIfGreen is the hard merge gate: it merges ONLY when CI is green,
// then deletes the branch. Both are fully injected so the bin tools stay thin
// and the merge gate is unit-tested with no network.
import type { CiStatus, OpenPr, PrFile, MergeResult } from "./github";

export interface ReviewDeps {
  listOpenPullRequests(): Promise<OpenPr[]>;
  getPullRequestFiles(number: number): Promise<PrFile[]>;
  getCombinedStatus(ref: string): Promise<CiStatus>;
  mergePullRequest(number: number, opts?: { method?: "squash" | "merge" | "rebase" }): Promise<MergeResult>;
  deleteBranch(name: string): Promise<void>;
}

export interface ReviewItem extends OpenPr { files: PrFile[]; ci: CiStatus; }

export async function reviewList(deps: ReviewDeps): Promise<ReviewItem[]> {
  const prs = await deps.listOpenPullRequests();
  return Promise.all(
    prs.map(async (pr) => ({
      ...pr,
      files: await deps.getPullRequestFiles(pr.number),
      ci: await deps.getCombinedStatus(pr.head),
    })),
  );
}

export type MergeOutcome =
  | { merged: true; sha?: string }
  | { merged: false; reason: "ci_not_green"; ci: CiStatus };

// The merge gate. Refuses unless CI is green. On success, squash-merges and
// deletes the source branch.
export async function mergeIfGreen(deps: ReviewDeps, number: number, head: string): Promise<MergeOutcome> {
  const ci = await deps.getCombinedStatus(head);
  if (ci !== "success") {
    return { merged: false, reason: "ci_not_green", ci };
  }
  const res = await deps.mergePullRequest(number, { method: "squash" });
  await deps.deleteBranch(head);
  return { merged: res.merged, sha: res.sha };
}
