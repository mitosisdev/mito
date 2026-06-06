// bin/cycle-report.ts — print a formatted history report of build sessions.
//
// Reads mito-state.json (via MITO_STATE_PATH or ./mito-state.json default),
// then prints a session-by-session breakdown of PRs and aggregate totals.
//
// Usage:
//   bun bin/cycle-report.ts           # human-readable output
//   bun bin/cycle-report.ts --json    # machine-readable JSON
import { loadState } from "../src/state";
import { buildCycleReport, formatCycleReport, formatCycleReportJson } from "../src/cycle-report";

const jsonMode = process.argv.includes("--json");
const statePath = process.env.MITO_STATE_PATH ?? "./mito-state.json";
const state = loadState(statePath);
const data = buildCycleReport(state);

process.stdout.write(jsonMode ? formatCycleReportJson(data) : formatCycleReport(data));
