// bin/gen-scorecard.ts — generate site/scorecard.html from live mito state.
//
// Reads MITO_STATE_PATH (env, default ./mito-state.json), computes the
// shipping quality scorecard, writes a self-contained dark-themed HTML page
// to site/scorecard.html, and prints a summary to stdout.
//
// One question: "did the AI ship?"
//
// Usage: bun bin/gen-scorecard.ts
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { loadState } from "../src/state.js";
import {
  buildScorecardHtml,
  computeScorecard,
  formatDuration,
  formatPercent,
  type PullRequest,
} from "../src/scorecard.js";

const statePath = process.env.MITO_STATE_PATH ?? "./mito-state.json";
const outPath = new URL("../site/scorecard.html", import.meta.url).pathname;

const state = loadState(statePath);

// state.pullRequests is structurally compatible with PullRequest; the extra
// fields (branch, url, mergeSha, ...) are simply ignored by computeScorecard.
const prs: PullRequest[] = state.pullRequests;
const card = computeScorecard(prs);

const generatedAt = new Date().toISOString();
const html = buildScorecardHtml(card, generatedAt);

// Ensure the site/ directory exists before writing.
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, html, "utf8");

// Human-readable summary to stdout.
console.log("mito scorecard — did the AI ship?");
console.log(`  merge rate:          ${formatPercent(card.mergeRate)}`);
console.log(`  avg time to merge:   ${formatDuration(card.avgTimeToMergeMs)}`);
console.log(
  `  CI first-pass rate:  ${
    card.ciFirstPassRate === null ? "N/A" : formatPercent(card.ciFirstPassRate)
  }`,
);
console.log(`  total PRs:           ${card.totalPRs}`);
console.log(`  merged:              ${card.mergedPRs}`);
console.log(`  closed:              ${card.closedPRs}`);
console.log(`  written:             ${outPath}`);
