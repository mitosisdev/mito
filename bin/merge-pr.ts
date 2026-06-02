// bin/merge-pr.ts — REVIEWER action. Squash-merge a PR, but ONLY if CI is
// green. Deletes the branch and marks the PR merged in state. Exits non-zero
// (and merges nothing) if CI is not success.
//
// Usage: bun bin/merge-pr.ts <number>
import { $ } from "bun";
import { loadConfig, requireGithub } from "../src/config";
import { makeGithub, nativeFetch } from "../src/github";
import { mergeIfGreen } from "../src/review";
import { loadState, saveState, markPrMerged } from "../src/state";

const number = Number(process.argv[2]);
if (!Number.isInteger(number) || number <= 0) {
  console.log(JSON.stringify({ merged: false, reason: "bad_args" }));
  process.exit(1);
}

const cfg = loadConfig();
const { repo, token } = requireGithub(cfg);
const gh = makeGithub({ repo, token, fetch: nativeFetch() });

// Resolve the head ref for this PR (the reviewer passes only the number).
const open = await gh.listOpenPullRequests();
const pr = open.find((p) => p.number === number);
if (!pr) {
  console.log(JSON.stringify({ merged: false, reason: "not_open" }));
  process.exit(1);
}

const outcome = await mergeIfGreen(
  {
    listOpenPullRequests: () => gh.listOpenPullRequests(),
    getPullRequestFiles: (n) => gh.getPullRequestFiles(n),
    getCombinedStatus: (ref) => gh.getCombinedStatus(ref),
    mergePullRequest: (n, o) => gh.mergePullRequest(n, o),
    deleteBranch: (b) => gh.deleteBranch(b),
  },
  number,
  pr.head,
);

if (!outcome.merged) {
  console.log(JSON.stringify(outcome));
  process.exit(1);
}

let state = loadState(cfg.statePath);
state = markPrMerged(state, number, outcome.sha);
saveState(cfg.statePath, state);

// Refresh the status-site stats now that a PR has merged.
await $`bun bin/update-stats.ts`.env({ MITO_STATE_PATH: cfg.statePath }).nothrow().quiet();

// Update README stats and commit to main.
await $`bun bin/update-readme.ts`.env({ MITO_STATE_PATH: cfg.statePath }).nothrow().quiet();
const readmeDiff = await $`git diff --quiet README.md`.nothrow().quiet();
if (readmeDiff.exitCode !== 0) {
  await $`git add README.md`.nothrow().quiet();
  await $`git commit -m "chore: update README stats [skip ci]"`.nothrow().quiet();
  await $`git push`.nothrow().quiet();
}

console.log(JSON.stringify(outcome));
