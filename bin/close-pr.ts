// bin/close-pr.ts — REVIEWER action. Reject a PR: post the reason as a kind,
// specific comment, close the PR, delete the branch, and mark it closed in
// state. A closed PR is a normal, healthy outcome.
//
// Usage: bun bin/close-pr.ts <number> "<reason>"
import { loadConfig, requireGithub } from "../src/config";
import { makeGithub, nativeFetch } from "../src/github";
import { loadState, saveState, markPrClosed, addRejectedIdea } from "../src/state";

const number = Number(process.argv[2]);
const reason = process.argv[3];
if (!Number.isInteger(number) || number <= 0 || !reason) {
  console.log(JSON.stringify({ closed: false, reason: "bad_args" }));
  process.exit(1);
}

const cfg = loadConfig();
const { repo, token } = requireGithub(cfg);
const gh = makeGithub({ repo, token, fetch: nativeFetch() });

// Find the head ref so we can delete the branch after closing.
const open = await gh.listOpenPullRequests();
const pr = open.find((p) => p.number === number);

await gh.addComment(number, reason);
await gh.closePullRequest(number);
if (pr) await gh.deleteBranch(pr.head);

let state = loadState(cfg.statePath);
state = markPrClosed(state, number, reason);
// Record the rejected idea so future build sessions can skip re-proposals.
const closedPr = state.pullRequests.find((p) => p.number === number);
if (closedPr) state = addRejectedIdea(state, closedPr.title, reason);
saveState(cfg.statePath, state);

console.log(JSON.stringify({ closed: true, number, reason }));
