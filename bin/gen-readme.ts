// bin/gen-readme.ts — reads live state + project registry, writes README.md
//
// Usage: bun bin/gen-readme.ts
//
// Reads:  data/state.json (or MITO_STATE_PATH from env) + projects/registry.json
// Writes: README.md at the repo root
import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { loadState } from "../src/state";
import { generateReadme, type Registry } from "../src/readme-gen";

const root = process.cwd();

// State — prefer MITO_STATE_PATH env, then data/state.json, then mito-state.json
const statePath =
  process.env.MITO_STATE_PATH ??
  (existsSync(join(root, "data/state.json"))
    ? join(root, "data/state.json")
    : join(root, "mito-state.json"));

const state = loadState(statePath);

// Registry
const registryPath = join(root, "projects/registry.json");
if (!existsSync(registryPath)) {
  console.error(`projects/registry.json not found at ${registryPath}`);
  process.exit(1);
}

const registry: Registry = JSON.parse(readFileSync(registryPath, "utf8")) as Registry;

// Generate and write
const readme = generateReadme(state, registry);
const outPath = join(root, "README.md");
writeFileSync(outPath, readme);

console.log(`README.md written (${readme.length} bytes) — ${registry.projects.length} projects, ${state.pullRequests.filter((p) => p.status === "merged").length} merged PRs, ${state.buildSessions.length} sessions`);
