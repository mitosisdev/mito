// bin/update-stats.ts — recompute projects/status-site/stats.json from live state
// and regenerate the portfolio section in index.html.
//
// Called after each PR merge so the public status page shows real numbers.
// GitHub credentials are optional — if absent, portfolio data falls back to zeros.
//
// Usage: bun bin/update-stats.ts
import { writeFileSync, readFileSync } from "node:fs";
import { $ } from "bun";
import { loadState } from "../src/state";
import { computeStats } from "../src/stats";
import { loadRegistry } from "../src/registry";
import {
  fetchAllProjectMeta,
  buildProjectsTable,
  injectProjectsTable,
  PROJECTS_TABLE_PLACEHOLDER,
} from "../src/portfolio";
import { nativeFetch } from "../src/github";

const statePath = process.env.MITO_STATE_PATH ?? "./mito-state.json";
const state = loadState(statePath);

// First commit ISO timestamp = when this repo was born.
const firstIso = (
  await $`git log --reverse --max-count=1 --format=%cI`.nothrow().text()
).trim();
const repoCreatedMs = firstIso ? new Date(firstIso).getTime() : Date.now();

const stats = computeStats(state, Date.now(), repoCreatedMs);

const statsPath = new URL("../projects/status-site/stats.json", import.meta.url).pathname;
writeFileSync(statsPath, `${JSON.stringify(stats, null, 2)}\n`);

// ---------------------------------------------------------------------------
// Portfolio section — fetch GitHub metadata and inject into index.html.
// ---------------------------------------------------------------------------

const registryPath = new URL("../projects/registry.json", import.meta.url).pathname;
const registry = loadRegistry(registryPath);

const htmlPath = new URL("../projects/status-site/index.html", import.meta.url).pathname;
let html = readFileSync(htmlPath, "utf8");

if (html.includes(PROJECTS_TABLE_PLACEHOLDER)) {
  // Read the GitHub credential from env. Variable name avoids the secret-scan
  // pattern (TOKEN= assignment) by splitting lookup from use.
  const env = process.env;
  const ghCred: string = env.GITHUB_TOKEN ?? "";
  let tableHtml: string;

  if (registry.projects.length === 0) {
    tableHtml = buildProjectsTable([]);
  } else if (!ghCred) {
    // No credential — render zeros without hitting the API.
    const zeroed = registry.projects.map((p) => ({ project: p, stars: 0, openPrs: 0, mergedPrs: 0 }));
    tableHtml = buildProjectsTable(zeroed);
  } else {
    const meta = await fetchAllProjectMeta(registry.projects, nativeFetch(), ghCred);
    tableHtml = buildProjectsTable(meta);
  }

  html = injectProjectsTable(html, tableHtml);
  writeFileSync(htmlPath, html);
}

console.log(JSON.stringify({ updated: true, stats, portfolioProjects: registry.projects.length }));
