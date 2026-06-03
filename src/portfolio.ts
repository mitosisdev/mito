// src/portfolio.ts — fetch GitHub metadata for managed projects + render the
// portfolio table injected into the status-site HTML.
//
// Pure functions (buildProjectsTable, injectProjectsTable) are unit-tested
// without network access. fetchProjectMeta uses an injected FetchLike so tests
// use a stub — same pattern as src/github.ts.

import type { FetchLike } from "./github";
import type { Project } from "./registry";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ProjectMeta {
  project: Project;
  stars: number;
  openPrs: number;
  mergedPrs: number;
}

// ---------------------------------------------------------------------------
// Placeholder
// ---------------------------------------------------------------------------

export const PROJECTS_TABLE_PLACEHOLDER = "<!-- PROJECTS_TABLE -->";

// ---------------------------------------------------------------------------
// GitHub API helpers
// ---------------------------------------------------------------------------

const API = "https://api.github.com";

function githubHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "mito",
  };
}

// Fetch a single repo's GitHub metadata: stars, open PR count, merged PR count.
// Falls back to zeros on any failure so the stats update never crashes.
export async function fetchProjectMeta(
  project: Project,
  fetch: FetchLike,
  token: string,
): Promise<ProjectMeta> {
  const [owner, name] = project.repo.split("/") as [string, string];
  const base = `${API}/repos/${owner}/${name}`;
  const headers = githubHeaders(token);

  try {
    // Fire the three requests in parallel.
    const [repoRes, openPrsRes, closedPrsRes] = await Promise.all([
      fetch(base, { method: "GET", headers }),
      fetch(`${base}/pulls?state=open&per_page=100`, { method: "GET", headers }),
      fetch(`${base}/pulls?state=closed&per_page=100`, { method: "GET", headers }),
    ]);

    if (!repoRes.ok || !openPrsRes.ok || !closedPrsRes.ok) {
      return zeroed(project);
    }

    const repoJson = (await repoRes.json()) as { stargazers_count?: number };
    const openJson = (await openPrsRes.json()) as Array<unknown>;
    const closedJson = (await closedPrsRes.json()) as Array<{ merged_at?: string | null }>;

    const stars = repoJson.stargazers_count ?? 0;
    const openPrs = openJson.length;
    const mergedPrs = closedJson.filter((p) => p.merged_at != null).length;

    return { project, stars, openPrs, mergedPrs };
  } catch {
    return zeroed(project);
  }
}

function zeroed(project: Project): ProjectMeta {
  return { project, stars: 0, openPrs: 0, mergedPrs: 0 };
}

// Fetch metadata for a list of projects in parallel (limited concurrency).
export async function fetchAllProjectMeta(
  projects: Project[],
  fetch: FetchLike,
  token: string,
): Promise<ProjectMeta[]> {
  return Promise.all(projects.map((p) => fetchProjectMeta(p, fetch, token)));
}

// ---------------------------------------------------------------------------
// HTML generation
// ---------------------------------------------------------------------------

// Escape minimal HTML special chars so descriptions/names are safe.
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Build the <table class="projects"> HTML from a list of ProjectMeta.
export function buildProjectsTable(meta: ProjectMeta[]): string {
  const rows = meta
    .map(({ project, stars, openPrs, mergedPrs }) => {
      const slug = project.repo.split("/")[1] ?? project.repo;
      const href = `https://github.com/${esc(project.repo)}`;
      return [
        "    <tr>",
        `      <td><a href="${href}">${esc(slug)}</a></td>`,
        `      <td>${esc(project.description)}</td>`,
        `      <td>${mergedPrs}</td>`,
        `      <td>${openPrs}</td>`,
        `      <td>${stars}</td>`,
        "    </tr>",
      ].join("\n");
    })
    .join("\n");

  return [
    '<table class="projects">',
    "  <thead>",
    "    <tr><th>Project</th><th>Description</th><th>PRs merged</th><th>Open PRs</th><th>Stars</th></tr>",
    "  </thead>",
    "  <tbody>",
    rows,
    "  </tbody>",
    "</table>",
  ].join("\n");
}

// Replace the PROJECTS_TABLE placeholder in an HTML string with rendered table.
// Returns the original string unchanged if the placeholder is not found.
export function injectProjectsTable(html: string, tableHtml: string): string {
  if (!html.includes(PROJECTS_TABLE_PLACEHOLDER)) return html;
  return html.replace(PROJECTS_TABLE_PLACEHOLDER, tableHtml);
}
