// bin/gen-watch-site.ts — generate site/index.html from live mito state.
//
// Reads MITO_STATE_PATH (env, default ./mito-state.json) and
// GITHUB_TOKEN / MITO_GITHUB_REPO for GitHub API access.
// Writes a self-contained HTML file to site/index.html.
//
// Usage: bun bin/gen-watch-site.ts
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { loadConfig } from "../src/config.js";
import { loadState } from "../src/state.js";
import { nativeFetch } from "../src/github.js";
import { buildWatchSiteHtml, fetchWatchSiteData } from "../src/gen-watch-site.js";

const cfg = loadConfig();
const statePath = process.env.MITO_STATE_PATH ?? "./mito-state.json";
const registryPath = new URL("../projects/registry.json", import.meta.url).pathname;
const outPath = new URL("../site/index.html", import.meta.url).pathname;

const state = loadState(statePath);
const data = await fetchWatchSiteData(cfg, state, nativeFetch(), registryPath);
const html = buildWatchSiteHtml(data);

// Ensure the site/ directory exists.
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, html, "utf8");

console.log(JSON.stringify({ written: outPath, repos: data.repos.length, sessions: data.sessions, prsMerged: data.prsMerged }));
