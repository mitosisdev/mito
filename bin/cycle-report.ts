// bin/cycle-report.ts — print a formatted history report of build sessions.
//
// Reads mito-state.json (via MITO_STATE_PATH or ./mito-state.json default),
// then prints a session-by-session breakdown of PRs and aggregate totals.
//
// Usage: bun bin/cycle-report.ts
import { loadState } from "../src/state";
import { buildCycleReport, formatCycleReport } from "../src/cycle-report";

const statePath = process.env.MITO_STATE_PATH ?? "./mito-state.json";
const state = loadState(statePath);
const data = buildCycleReport(state);

process.stdout.write(formatCycleReport(data));
