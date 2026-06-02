// bin/propose.ts — the WORKER. Replaces verify.ts's commit-to-main behavior.
//
// Flow (decision logic lives in src/propose.ts, fully unit-tested):
//   1. Run the suite. Fail -> discard branch, print {proposed:false,tests_failed}.
//   2. At the 3-PR cap -> print {proposed:false,pr_cap}, open nothing.
//   3. Else push the branch + open a PR against main, record it in state.
//
// Usage: bun bin/propose.ts <branch> "<title>" "<body>"
// The token is read from env and passed to git via an in-memory extraheader;
// it is NEVER printed and never written to disk.
import { $ } from "bun";
import { loadConfig, requireGithub } from "../src/config";
import { runTests, revertToLastKnownGood } from "../src/git";
import { makeGithub } from "../src/github";
import { proposeChange } from "../src/propose";
import { loadState, saveState, recordProposedPr } from "../src/state";

const branch = process.argv[2];
const title = process.argv[3];
const body = process.argv[4] ?? "";
if (!branch || !title) {
  console.log(JSON.stringify({ proposed: false, reason: "bad_args" }));
  process.exit(1);
}

const dir = process.cwd();
const cfg = loadConfig();
const { repo, token } = requireGithub(cfg);
const gh = makeGithub({ repo, token, fetch: globalThis.fetch as any });

// Push using a per-invocation auth header so the token never lands in a remote
// URL, the reflog, or stdout. `git -c` keeps it in process memory only.
async function pushBranch(b: string): Promise<void> {
  const authHeader = `AUTHORIZATION: basic ${Buffer.from(`x-access-token:${token}`).toString("base64")}`;
  const remote = `https://github.com/${repo}.git`;
  await $`git -C ${dir} -c ${`http.extraheader=${authHeader}`} push -q ${remote} ${`${b}:${b}`}`.quiet();
}

const result = await proposeChange(
  {
    runTests: () => runTests(dir),
    countOpenPullRequests: () => gh.countOpenPullRequests(),
    pushBranch,
    openPullRequest: (i) => gh.openPullRequest(i),
    discardBranch: () => revertToLastKnownGood(dir),
  },
  { branch, title, body },
);

if (result.proposed) {
  let state = loadState(cfg.statePath);
  state = recordProposedPr(state, { number: result.number, branch, url: result.url, title });
  saveState(cfg.statePath, state);
}

console.log(JSON.stringify(result));
