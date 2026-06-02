// bin/new-project.ts — start a brand-new project repo under the mito org.
//
// This is how mito spins up a standalone project: create the GitHub repo,
// scaffold a tiny green-from-commit-one bun project locally, push it, and
// record it in projects/registry.json so the thinker/builder/reviewer can find
// and work on it via scripts/in-project.sh.
//
// Usage: bun bin/new-project.ts "<name>" "<description>"
//
// The token is read from env and only ever travels through an in-memory
// git http.extraheader (the same pattern as bin/propose.ts pushBranch) and the
// Authorization header of the create call — never printed, never written.
import { $ } from "bun";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { loadConfig, requireGithub } from "../src/config";
import { slugifyRepoName, starterFiles } from "../src/newproject";
import { loadRegistry, saveRegistry, addProject } from "../src/registry";

const name = process.argv[2];
const description = process.argv[3] ?? "";
if (!name) {
  console.log(JSON.stringify({ created: false, reason: "bad_args" }));
  process.exit(1);
}

const cfg = loadConfig();
const { repo: homeRepo, token } = requireGithub(cfg);
// owner comes from the configured home repo ("owner/repo"); new repos live
// under the same owner so the whole org stays under one account.
const owner = homeRepo.split("/")[0]!;

let slug: string;
try {
  slug = slugifyRepoName(name);
} catch {
  console.log(JSON.stringify({ created: false, reason: "bad_name" }));
  process.exit(0);
}

const repo = `${owner}/${slug}`;
const registryPath = "projects/registry.json";

// 1. Create the repo. Inline fetch (NOT src/github.ts) per the multi-repo spec.
const createRes = await fetch("https://api.github.com/user/repos", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
    "User-Agent": "mito",
  },
  body: JSON.stringify({
    name: slug,
    description,
    private: false,
    auto_init: false,
    has_issues: true,
  }),
});

if (!createRes.ok) {
  const detail = await createRes.text().catch(() => "");
  console.log(
    JSON.stringify({ created: false, reason: "create_failed", status: createRes.status, detail }),
  );
  process.exit(0);
}

const created = (await createRes.json()) as { html_url?: string; clone_url?: string };
const url = created.html_url ?? `https://github.com/${repo}`;

// 2. Scaffold a local dir under .workspace/<slug> and write the starter files.
const dir = join(".workspace", slug);
mkdirSync(dir, { recursive: true });
const files = starterFiles(name, description, slug);
for (const [rel, content] of Object.entries(files)) {
  const abs = join(dir, rel);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content);
}

// 3. git init + commit as mito, set main, push using an in-memory auth header.
await $`git -C ${dir} init -q`;
await $`git -C ${dir} add -A`;
await $`git -C ${dir} -c user.name=mito -c user.email=mito@users.noreply.github.com commit -q -m ${"chore: scaffold project (by mito)"}`;
await $`git -C ${dir} branch -M main`;

const authHeader = `AUTHORIZATION: basic ${Buffer.from(`x-access-token:${token}`).toString("base64")}`;
const remote = `https://github.com/${repo}.git`;
await $`git -C ${dir} -c ${`http.extraheader=${authHeader}`} push -q ${remote} ${"main:main"}`.quiet();

// 4. Record it in the registry.
let reg = loadRegistry(registryPath);
reg = addProject(reg, { repo, name, description, createdAt: new Date().toISOString() });
saveRegistry(registryPath, reg);

console.log(JSON.stringify({ created: true, repo, url }));
