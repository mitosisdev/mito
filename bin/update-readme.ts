// bin/update-readme.ts — replace the stats block in README.md between marker comments.
//
// Does NOT require X credentials — reads only MITO_STATE_PATH (env, with default).
// Safe to call in any environment that has a readable state file (or no file at all).
//
// Usage: bun bin/update-readme.ts
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { loadState } from "../src/state.js";
import { formatReadmeStats, injectStats } from "../src/readme-stats.js";

const statePath = process.env.MITO_STATE_PATH ?? "./mito-state.json";
const state = loadState(statePath);
const stats = formatReadmeStats(state);

const readmePath = new URL("../README.md", import.meta.url).pathname;
if (!existsSync(readmePath)) {
  console.error("README.md not found at", readmePath);
  process.exit(1);
}

const readme = readFileSync(readmePath, "utf8");
const updated = injectStats(readme, stats);

if (updated === readme) {
  console.log(JSON.stringify({ updated: false, reason: "no_markers" }));
} else {
  writeFileSync(readmePath, updated, "utf8");
  console.log(JSON.stringify({ updated: true }));
}
