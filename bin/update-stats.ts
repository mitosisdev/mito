// bin/update-stats.ts — recompute projects/status-site/stats.json from live state.
//
// Called after each PR merge so the public status page shows real numbers.
// Does NOT require X or GitHub credentials — reads only state + git history.
//
// Usage: bun bin/update-stats.ts
import { writeFileSync } from "node:fs";
import { $ } from "bun";
import { loadState } from "../src/state";
import { computeStats } from "../src/stats";

const statePath = process.env.MITO_STATE_PATH ?? "./mito-state.json";
const state = loadState(statePath);

// First commit ISO timestamp = when this repo was born.
const firstIso = (
  await $`git log --reverse --max-count=1 --format=%cI`.nothrow().text()
).trim();
const repoCreatedMs = firstIso ? new Date(firstIso).getTime() : Date.now();

const stats = computeStats(state, Date.now(), repoCreatedMs);

const statsPath = new URL("../projects/status-site/stats.json", import.meta.url).pathname;
writeFileSync(statsPath, JSON.stringify(stats, null, 2) + "\n");

console.log(JSON.stringify({ updated: true, stats }));
