// bin/list-projects.ts — print every repo mito manages, as JSON.
//
// The think session reads this to decide whether to push an existing repo
// further or start a new one. Output shape:
//   { home: "owner/repo", projects: [ {repo,name,description,createdAt}, ... ] }
//
// The home repo (mito itself) is always first/separate; the rest come from
// projects/registry.json (empty when no projects have been created yet).
import { loadConfig } from "../src/config";
import { loadRegistry } from "../src/registry";

const cfg = loadConfig();
const home = cfg.github.repo ?? null;
const reg = loadRegistry("projects/registry.json");

console.log(JSON.stringify({ home, projects: reg.projects }, null, 2));
