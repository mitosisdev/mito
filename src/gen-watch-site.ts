// src/gen-watch-site.ts — HTML generation for the mito watch site.
//
// Two exports:
//   buildWatchSiteHtml(opts) — pure: takes data, returns a self-contained HTML string.
//   fetchWatchSiteData(cfg, state) — impure: reads state + calls GitHub API.

import type { Config } from "./config";
import type { State } from "./state";
import type { FetchLike } from "./github";
import { loadRegistry } from "./registry";
import { fetchProjectMeta } from "./portfolio";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RepoStat {
  repo: string;        // "owner/slug"
  name: string;        // human-facing slug (last segment)
  description: string;
  openPrs: number;
}

export interface WatchSiteData {
  repos: RepoStat[];
  sessions: number;
  prsMerged: number;
  currentlyBuilding: string;
  lastBuildTime: string;
}

export interface BuildWatchSiteOpts {
  repos: RepoStat[];
  sessions: number;
  prsMerged: number;
  currentlyBuilding: string;
  lastBuildTime: string;
}

// ---------------------------------------------------------------------------
// HTML builder — pure, no I/O
// ---------------------------------------------------------------------------

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderRepos(repos: RepoStat[]): string {
  if (repos.length === 0) return "<p>No managed projects yet.</p>";
  return repos
    .map(
      ({ repo, name, description, openPrs }) => `  <div class="repo">
    <strong><a href="https://github.com/${esc(repo)}">${esc(name)}</a></strong>
    <span class="open-prs">${openPrs} open PR${openPrs === 1 ? "" : "s"}</span>
    <p>${esc(description)}</p>
  </div>`,
    )
    .join("\n");
}

export function buildWatchSiteHtml(opts: BuildWatchSiteOpts): string {
  const { repos, sessions, prsMerged, currentlyBuilding, lastBuildTime } = opts;
  const reposHtml = renderRepos(repos);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>mito — live portfolio</title>
  <style>
    body { background: #0b0d10; color: #e2e8f0; font-family: 'Courier New', monospace; max-width: 800px; margin: 40px auto; padding: 20px; }
    a { color: #8A2BE2; text-decoration: none; }
    a:hover { text-decoration: underline; }
    h1 { color: #8A2BE2; margin-bottom: 4px; }
    .repo { border: 1px solid #2d3748; padding: 12px; margin: 8px 0; border-radius: 4px; display: flex; flex-wrap: wrap; gap: 8px; align-items: baseline; }
    .repo p { color: #a0aec0; font-size: 0.85em; margin: 4px 0 0; width: 100%; }
    .open-prs { color: #FF6B35; margin-left: auto; font-size: 0.9em; }
    .stat { color: #68d391; }
    .building { color: #fbd38d; }
    .stats { margin: 12px 0 24px; font-size: 0.9em; }
    .divider { color: #4a5568; }
  </style>
</head>
<body>
  <h1>mito</h1>
  <p class="building">Currently building: ${esc(currentlyBuilding)}</p>
  <div class="stats">
    <span class="stat">${sessions} sessions</span>
    <span class="divider"> · </span>
    <span class="stat">${prsMerged} PRs merged</span>
    <span class="divider"> · </span>
    Last build: ${esc(lastBuildTime)}
  </div>
  <section class="repos">
${reposHtml}
  </section>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Data fetcher — reads state + registry + calls GitHub API
// ---------------------------------------------------------------------------

export async function fetchWatchSiteData(
  cfg: Config,
  state: State,
  fetch: FetchLike,
  registryPath: string,
): Promise<WatchSiteData> {
  const sessions = state.buildSessions.length;
  const prsMerged = state.pullRequests.filter((pr) => pr.status === "merged").length;

  // Determine what's currently building from open PRs or backlog.
  const openPrs = state.pullRequests.filter((pr) => pr.status === "open");
  const currentlyBuilding =
    openPrs.length > 0 ? openPrs[openPrs.length - 1]!.title : "nothing yet";

  const lastBuildTime = new Date().toISOString();

  // Load registry to get managed project repos.
  const registry = loadRegistry(registryPath);

  // Fetch GitHub metadata for each project in parallel.
  const ghAuth = cfg.github.token ?? "";
  const metaResults = await Promise.all(
    registry.projects.map((project) => fetchProjectMeta(project, fetch, ghAuth)),
  );

  const repos: RepoStat[] = metaResults.map((m) => {
    const name = m.project.repo.split("/")[1] ?? m.project.repo;
    return {
      repo: m.project.repo,
      name,
      description: m.project.description,
      openPrs: m.openPrs,
    };
  });

  return { repos, sessions, prsMerged, currentlyBuilding, lastBuildTime };
}
