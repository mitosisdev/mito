// bin/gen-watch-site.ts — generate projects/status-site/index.html from live data.
//
// Reads projects/registry.json for the managed project list, reads mito-state.json
// for total merged PR count, fetches open PR counts + star counts per project from
// the GitHub REST API, then writes a self-contained HTML page.
//
// Usage: bun bin/gen-watch-site.ts
// Env:
//   GITHUB_TOKEN     — GitHub PAT or Actions token for API calls (optional; zeros if absent)
//   MITO_STATE_PATH  — path to mito-state.json (default: ./mito-state.json)
//   MITO_GITHUB_REPO — home repo slug, e.g. "mitosisdev/mito" (used for self-reference)

import { writeFileSync } from "node:fs";
import { loadState } from "../src/state";
import { loadRegistry } from "../src/registry";
import { nativeFetch } from "../src/github";
import type { FetchLike } from "../src/github";
import { renderPage, type WatchProject, type WatchPageData } from "../src/gen-watch-site";
import { fetchAllProjectMeta } from "../src/portfolio";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const statePath = process.env.MITO_STATE_PATH ?? "./mito-state.json";
const env = process.env;
const ghCred: string = env.GITHUB_TOKEN ?? "";

// ---------------------------------------------------------------------------
// Load state for totalMergedPrs
// ---------------------------------------------------------------------------

const state = loadState(statePath);
const totalMergedPrs = state.pullRequests.filter((pr) => pr.status === "merged").length;

// ---------------------------------------------------------------------------
// Load registry
// ---------------------------------------------------------------------------

const registryPath = new URL("../projects/registry.json", import.meta.url).pathname;
const registry = loadRegistry(registryPath);

// ---------------------------------------------------------------------------
// Fetch GitHub metadata per project
// ---------------------------------------------------------------------------

let projects: WatchProject[];

if (registry.projects.length === 0) {
  projects = [];
} else if (!ghCred) {
  // No credential — render zeros without hitting the API.
  projects = registry.projects.map((p) => ({
    repo: p.repo,
    name: p.name,
    description: p.description,
    mergedPrs: 0,
    openPrs: 0,
    stars: 0,
  }));
} else {
  const fetch: FetchLike = nativeFetch();
  const meta = await fetchAllProjectMeta(registry.projects, fetch, ghCred);
  projects = meta.map(({ project, stars, openPrs, mergedPrs }) => ({
    repo: project.repo,
    name: project.name,
    description: project.description,
    mergedPrs,
    openPrs,
    stars,
  }));
}

// ---------------------------------------------------------------------------
// Render and write
// ---------------------------------------------------------------------------

const data: WatchPageData = {
  projects,
  totalMergedPrs,
  lastBuild: new Date().toISOString(),
};

const html = renderPage(data);

const outPath = new URL("../projects/status-site/index.html", import.meta.url).pathname;
writeFileSync(outPath, html);

console.log(
  JSON.stringify({
    generated: true,
    output: outPath,
    projects: projects.length,
    totalMergedPrs,
    lastBuild: data.lastBuild,
  }),
);
