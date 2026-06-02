// bin/publish.ts — safety-check text, post to X, record spend + mark cycle posted
import { loadConfig } from "../src/config";
import { makeXPoster } from "../src/x-poster";
import { postUpdate } from "../src/xpost";
import { loadState, saveState } from "../src/state";
import { canSpend, recordSpend, type Ledger } from "../src/spend";

const text = process.argv[2];
if (!text) { console.log(JSON.stringify({ posted: false, reason: "no_text" })); process.exit(1); }

const cfg = loadConfig();
const COST = 0.02;
const state = loadState(cfg.statePath) as ReturnType<typeof loadState> & { ledger?: Ledger };
const ledger: Ledger = state.ledger ?? { entries: [] };
const now = new Date().toISOString();
if (!canSpend(ledger, now, cfg.spendCapUsd, COST)) {
  console.log(JSON.stringify({ posted: false, reason: "spend_cap" }));
  process.exit(0);
}
const result = await postUpdate(makeXPoster(cfg), text);
if (result.posted) {
  const next = recordSpend(ledger, { timestamp: now, amountUsd: COST, provider: "x" });
  const last = state.cycles.at(-1);
  if (last) { last.posted = true; last.postUrl = result.url; }
  saveState(cfg.statePath, { ...state, ledger: next });
}
console.log(JSON.stringify(result));
