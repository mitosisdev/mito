// bin/preflight.ts — gate the cycle on kill switch + spend mode
import { loadConfig } from "../src/config";
import { isKilled } from "../src/killswitch";
import { loadState, saveState, startBuildSession } from "../src/state";
import { type Ledger } from "../src/spend";
import { existsSync, readFileSync } from "node:fs";
import { buildPreflight } from "../src/preflight";

const cfg = loadConfig();
if (isKilled(cfg.killswitchPath)) {
  console.log(JSON.stringify({ proceed: false, reason: "killswitch" }));
  process.exit(0);
}

const BACKLOG_PATH = "./BACKLOG.md";
const backlogMarkdown = existsSync(BACKLOG_PATH) ? readFileSync(BACKLOG_PATH, "utf8") : "";

let state = loadState(cfg.statePath) as ReturnType<typeof loadState> & { ledger?: Ledger };
const nowIso = new Date().toISOString();
const result = buildPreflight(state, backlogMarkdown, nowIso, cfg.spendCapUsd);

if (result.proceed === true) {
  state = { ...startBuildSession(state, nowIso), ledger: state.ledger } as typeof state;
  saveState(cfg.statePath, state);
}

console.log(JSON.stringify(result));
