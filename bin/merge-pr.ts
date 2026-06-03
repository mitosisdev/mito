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
import { addChangelogEntry } from "../src/changelog";

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
  pr.headSha,
);

if (!outcome.merged) {
  console.log(JSON.stringify(outcome));
  process.exit(1);
}

let state = loadState(cfg.statePath);
state = markPrMerged(state, number, outcome.sha);
saveState(cfg.statePath, state);

// Refresh the status-site stats and README stats now that a PR has merged.
await $`bun bin/update-stats.ts`.env({ MITO_STATE_PATH: cfg.statePath }).nothrow().quiet();
await $`bun bin/update-readme.ts`.env({ MITO_STATE_PATH: cfg.statePath }).nothrow().quiet();

// Append an entry to CHANGELOG.md for this merge.
try {
  const changelogPath = new URL("../CHANGELOG.md", import.meta.url).pathname;
  const existing = await Bun.file(changelogPath).text().catch(() => "");
  const dateIso = new Date().toISOString().slice(0, 10);
  const updated = addChangelogEntry(existing, pr.title, dateIso);
  await Bun.write(changelogPath, updated);
} catch {
  // Non-fatal — changelog update failure must never block a merge.
}

console.log(JSON.stringify(outcome));
