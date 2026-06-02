// bin/preflight.ts — gate the cycle on kill switch + spend mode
import { loadConfig } from "../src/config";
import { isKilled } from "../src/killswitch";
import { loadState } from "../src/state";
import { spendMode, type Ledger } from "../src/spend";

const cfg = loadConfig();
if (isKilled(cfg.killswitchPath)) {
  console.log(JSON.stringify({ proceed: false, reason: "killswitch" }));
  process.exit(0);
}
const state = loadState(cfg.statePath) as ReturnType<typeof loadState> & { ledger?: Ledger };
const ledger: Ledger = state.ledger ?? { entries: [] };
const mode = spendMode(ledger, new Date().toISOString(), cfg.spendCapUsd);
console.log(JSON.stringify({ proceed: true, spendMode: mode, cycles: state.cycles.length }));
