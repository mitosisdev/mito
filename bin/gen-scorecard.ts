// bin/gen-scorecard.ts — generate site/scorecard.html from mito state.
//
// Reads MITO_STATE_PATH (env, default ./mito-state.json), computes shipping
// metrics, and writes a self-contained HTML scorecard to site/scorecard.html
// (or the path specified via --out <path>).
//
// Usage:
//   bun bin/gen-scorecard.ts                   # writes site/scorecard.html
//   bun bin/gen-scorecard.ts --out /tmp/sc.html
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { loadState } from "../src/state.js";
import { computeMetrics } from "../src/scorecard.js";
import { buildScorecardHtml } from "../src/gen-scorecard.js";

// Resolve output path (--out <path> overrides default).
const outArgIdx = process.argv.indexOf("--out");
const outPath = outArgIdx !== -1 && process.argv[outArgIdx + 1]
  ? resolve(process.argv[outArgIdx + 1])
  : new URL("../site/scorecard.html", import.meta.url).pathname;

const statePath = process.env.MITO_STATE_PATH ?? "./mito-state.json";
const state = loadState(statePath);
const metrics = computeMetrics(state);
const html = buildScorecardHtml(metrics);

// Ensure destination directory exists.
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, html, "utf8");

console.log(JSON.stringify({
  written: outPath,
  mergeRate: metrics.mergeRate,
  avgTimeToMergeHours: metrics.avgTimeToMergeHours,
  ciFirstPassRate: metrics.ciFirstPassRate,
  revertRate: metrics.revertRate,
  totalPrsOpened: metrics.totalPrsOpened,
  totalPrsMerged: metrics.totalPrsMerged,
  totalPrsClosed: metrics.totalPrsClosed,
  buildSessions: metrics.buildSessions,
}));
