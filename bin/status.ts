// bin/status.ts — live status dashboard for the mito build system.
//
// Prints:
//   • Open PRs per registered repo (queried from GitHub API)
//   • Last 3 merged PRs with titles and dates
//   • Current cycle count (build sessions run)
//   • Next 3 unfinished backlog items
//
// Usage: bun bin/status.ts
import { existsSync, readFileSync } from "node:fs";
import { loadConfig, requireGithub } from "../src/config";
import { loadState } from "../src/state";
import { loadBacklog } from "../src/backlog";
import { makeGithub, nativeFetch } from "../src/github";
import { loadRegistry } from "../src/registry";
import { buildStatusData, formatStatus, type RepoPrSummary } from "../src/status";

const cfg = loadConfig();
const state = loadState(cfg.statePath);

const BACKLOG_PATH = "./BACKLOG.md";
const backlogTasks = existsSync(BACKLOG_PATH)
  ? loadBacklog(BACKLOG_PATH)
  : Promise.resolve([]);

// Build per-repo PR summaries by querying GitHub for each managed repo.
async function fetchRepoPrSummaries(): Promise<RepoPrSummary[]> {
  // If GitHub credentials are absent, skip live queries and show a notice.
  let ghCfg: { repo: string; token: string };
  try {
    ghCfg = requireGithub(cfg);
  } catch {
    console.error("  (GitHub credentials not configured — skipping live PR query)");
    return [];
  }

  // Collect repos: home repo + any in the project registry.
  const repos: string[] = [];
  repos.push(ghCfg.repo);

  const reg = loadRegistry("projects/registry.json");
  for (const project of reg.projects) {
    if (!repos.includes(project.repo)) repos.push(project.repo);
  }

  const summaries: RepoPrSummary[] = await Promise.all(
    repos.map(async (repo): Promise<RepoPrSummary> => {
      try {
        const gh = makeGithub({ repo, token: ghCfg.token, fetch: nativeFetch() });
        const openPrs = await gh.listOpenPullRequests();
        return {
          repo,
          openCount: openPrs.length,
          openPrs: openPrs.map((p) => ({ number: p.number, title: p.title, url: p.url })),
        };
      } catch (err) {
        // Surface the error as a zero-count row rather than crashing.
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`  (failed to query ${repo}: ${msg})`);
        return { repo, openCount: 0, openPrs: [] };
      }
    }),
  );

  return summaries;
}

async function main() {
  const [tasks, repoPrSummaries] = await Promise.all([
    backlogTasks,
    fetchRepoPrSummaries(),
  ]);

  const data = buildStatusData(state, tasks, repoPrSummaries);
  console.log(formatStatus(data));
}

main().catch((err) => {
  console.error("status: fatal error:", err);
  process.exit(1);
});
