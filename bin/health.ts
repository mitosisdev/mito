// bin/health.ts — portfolio health check across all managed repos.
//
// Audits each repo for: README presence, CI workflow, open PR count, CI status.
// Outputs a clean ASCII table to stdout. Requires GITHUB_TOKEN and
// MITO_GITHUB_REPO to be set (reads them via src/config.ts).
//
// Usage: bun bin/health.ts
import { loadConfig, requireGithub } from "../src/config";
import { loadRegistry } from "../src/registry";
import {
  checkReadme,
  checkCiWorkflow,
  getOpenPrCount,
  getCiStatus,
  formatHealthTable,
  type RepoHealth,
} from "../src/health";
import { nativeFetch } from "../src/github";

const cfg = loadConfig();
const { repo: homeRepo, token } = requireGithub(cfg);
const reg = loadRegistry("projects/registry.json");

// Combine home repo + all managed projects.
const allRepos: string[] = [
  homeRepo,
  ...reg.projects.map((p) => p.repo),
];

const fetch = nativeFetch();

// Audit each repo in parallel.
const results: RepoHealth[] = await Promise.all(
  allRepos.map(async (repo): Promise<RepoHealth> => {
    const [hasReadme, hasCi, openPrs, ciStatus] = await Promise.all([
      checkReadme(repo, fetch, token),
      checkCiWorkflow(repo, fetch, token),
      getOpenPrCount(repo, fetch, token),
      getCiStatus(repo, fetch, token),
    ]);
    return { repo, hasReadme, hasCi, openPrs, ciStatus };
  }),
);

console.log(formatHealthTable(results));
