// bin/update-readme.ts — replace the stats block in README.md between marker comments.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { loadConfig } from "../src/config.js";
import { loadState } from "../src/state.js";
import { formatReadmeStats } from "../src/readme-stats.js";

export const STATS_START = "<!-- stats-start -->";
export const STATS_END = "<!-- stats-end -->";

export function injectStats(readme: string, stats: string): string {
  const startIdx = readme.indexOf(STATS_START);
  const endIdx = readme.indexOf(STATS_END);
  if (startIdx === -1 || endIdx === -1) return readme;
  return (
    readme.slice(0, startIdx + STATS_START.length) +
    "\n" +
    stats +
    "\n" +
    readme.slice(endIdx)
  );
}

// Bin entry point — runs when called directly.
const cfg = loadConfig();
const state = loadState(cfg.statePath);
const stats = formatReadmeStats(state);

const readmePath = new URL("../README.md", import.meta.url).pathname;
if (!existsSync(readmePath)) {
  console.error("README.md not found");
  process.exit(1);
}

const readme = readFileSync(readmePath, "utf8");
const updated = injectStats(readme, stats);
writeFileSync(readmePath, updated, "utf8");
