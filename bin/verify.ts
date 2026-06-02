// bin/verify.ts — run tests; pass => commit + tag last-good; fail => revert branch
import { loadConfig } from "../src/config";
import { runTests, commitAll, tagLastKnownGood, revertToLastKnownGood } from "../src/git";
import { loadState, saveState, addCycle, setLastKnownGood } from "../src/state";

const message = process.argv[2] ?? "mito: cycle change";
const dir = process.cwd();
const cfg = loadConfig();

const passed = await runTests(dir);
if (!passed) {
  await revertToLastKnownGood(dir);
  console.log(JSON.stringify({ committed: false, reverted: true }));
  process.exit(0);
}
const commit = await commitAll(dir, message);
await tagLastKnownGood(dir, commit);
let state = loadState(cfg.statePath);
state = setLastKnownGood(state, commit);
state = addCycle(state, { action: message, branch: "main", testsPassed: true, committed: true, posted: false });
saveState(cfg.statePath, state);
console.log(JSON.stringify({ committed: true, commit }));
