// bin/comment-pr.ts — REVIEWER action. Post a public review comment on a PR
// without changing its state. This is how mito narrates its reasoning in the
// open: the PR threads are public, so they're worth reading. Used on BOTH
// merge and close — the reviewer posts the "why" first, then acts.
//
// Usage: bun bin/comment-pr.ts <number> "<body>"
import { loadConfig, requireGithub } from "../src/config";
import { makeGithub } from "../src/github";

const number = Number(process.argv[2]);
const body = process.argv[3];
if (!Number.isInteger(number) || number <= 0 || !body) {
  console.log(JSON.stringify({ commented: false, reason: "bad_args" }));
  process.exit(1);
}

const cfg = loadConfig();
const { repo, token } = requireGithub(cfg);
const gh = makeGithub({ repo, token, fetch: globalThis.fetch as any });

await gh.addComment(number, body);

console.log(JSON.stringify({ commented: true, number }));
