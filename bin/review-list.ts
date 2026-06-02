// bin/review-list.ts — REVIEWER input. Prints JSON: every open PR with its
// file/diff summary and CI status, for the reviewer routine to read and judge.
//
// Usage: bun bin/review-list.ts
import { loadConfig, requireGithub } from "../src/config";
import { makeGithub } from "../src/github";
import { reviewList } from "../src/review";

const cfg = loadConfig();
const { repo, token } = requireGithub(cfg);
const gh = makeGithub({ repo, token, fetch: globalThis.fetch as any });

const items = await reviewList({
  listOpenPullRequests: () => gh.listOpenPullRequests(),
  getPullRequestFiles: (n) => gh.getPullRequestFiles(n),
  getCombinedStatus: (ref) => gh.getCombinedStatus(ref),
  mergePullRequest: (n, o) => gh.mergePullRequest(n, o),
  deleteBranch: (b) => gh.deleteBranch(b),
});

console.log(JSON.stringify({ open: items.length, pullRequests: items }, null, 2));
