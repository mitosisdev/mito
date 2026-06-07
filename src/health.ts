// src/health.ts — pure functions for the portfolio health check tool.
//
// `checkReadme`, `checkCiWorkflow`, `getOpenPrCount`, `getCiStatus` each take
// an injected FetchLike so unit tests never hit the network — same pattern as
// src/portfolio.ts. `formatHealthTable` is fully pure and directly unit-tested.

import type { FetchLike } from "./github";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CiHealthStatus = "passing" | "failing" | "pending" | "unknown";

export interface RepoHealth {
  repo: string; // "owner/slug"
  hasReadme: boolean;
  hasCi: boolean;
  openPrs: number;
  ciStatus: CiHealthStatus;
}

// ---------------------------------------------------------------------------
// GitHub API helpers (injected fetch — never import directly in tests)
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

// Check whether a repo has a README.md at the root.
export async function checkReadme(
  repo: string,
  fetch: FetchLike,
  token: string,
): Promise<boolean> {
  try {
    const res = await fetch(`${API}/repos/${repo}/contents/README.md`, {
      method: "GET",
      headers: githubHeaders(token),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Check whether a repo has at least one CI workflow file under .github/workflows/.
export async function checkCiWorkflow(
  repo: string,
  fetch: FetchLike,
  token: string,
): Promise<boolean> {
  try {
    const res = await fetch(`${API}/repos/${repo}/contents/.github/workflows`, {
      method: "GET",
      headers: githubHeaders(token),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as unknown;
    if (!Array.isArray(data)) return false;
    // At least one .yml or .yaml file in the workflows directory.
    return data.some(
      (f: unknown) =>
        typeof f === "object" &&
        f !== null &&
        "name" in f &&
        typeof (f as { name: unknown }).name === "string" &&
        /\.ya?ml$/i.test((f as { name: string }).name),
    );
  } catch {
    return false;
  }
}

// Return the count of currently open pull requests.
export async function getOpenPrCount(
  repo: string,
  fetch: FetchLike,
  token: string,
): Promise<number> {
  try {
    // GitHub returns up to 100 per page. For a portfolio tool 100 is a safe
    // upper bound — if it ever exceeds that, we cap at "100+".
    const res = await fetch(
      `${API}/repos/${repo}/pulls?state=open&per_page=100`,
      { method: "GET", headers: githubHeaders(token) },
    );
    if (!res.ok) return 0;
    const data = (await res.json()) as unknown;
    if (!Array.isArray(data)) return 0;
    return data.length;
  } catch {
    return 0;
  }
}

// Return the combined CI status of the latest commit on the default branch.
export async function getCiStatus(
  repo: string,
  fetch: FetchLike,
  token: string,
): Promise<CiHealthStatus> {
  try {
    const res = await fetch(`${API}/repos/${repo}/commits/main/status`, {
      method: "GET",
      headers: githubHeaders(token),
    });
    if (!res.ok) return "unknown";
    const data = (await res.json()) as unknown;
    if (
      typeof data !== "object" ||
      data === null ||
      !("state" in data)
    )
      return "unknown";
    const state = (data as { state: string }).state;
    if (state === "success") return "passing";
    if (state === "failure" || state === "error") return "failing";
    if (state === "pending") return "pending";
    return "unknown";
  } catch {
    return "unknown";
  }
}

// ---------------------------------------------------------------------------
// Table formatter (pure — no I/O, fully unit-tested)
// ---------------------------------------------------------------------------

const COL_WIDTHS = {
  repo: 14,
  readme: 8,
  ci: 9,
  openPrs: 10,
  ciStatus: 11,
} as const;

function pad(s: string, width: number): string {
  return s.length >= width ? s.slice(0, width) : s + " ".repeat(width - s.length);
}

function ciStatusLabel(s: CiHealthStatus, hasCi: boolean): string {
  if (!hasCi) return "–";
  if (s === "passing") return "✓ passing";
  if (s === "failing") return "✗ failing";
  if (s === "pending") return "⏳ pending";
  return "–";
}

export function formatHealthTable(results: RepoHealth[]): string {
  const header = [
    pad("REPO", COL_WIDTHS.repo),
    pad("README", COL_WIDTHS.readme),
    pad("CI", COL_WIDTHS.ci),
    pad("OPEN PRS", COL_WIDTHS.openPrs),
    "CI STATUS",
  ].join("  ");

  const divider = [
    "-".repeat(COL_WIDTHS.repo),
    "-".repeat(COL_WIDTHS.readme),
    "-".repeat(COL_WIDTHS.ci),
    "-".repeat(COL_WIDTHS.openPrs),
    "-".repeat(COL_WIDTHS.ciStatus),
  ].join("  ");

  if (results.length === 0) {
    return [header, divider, "(no repos)"].join("\n");
  }

  const rows = results.map((r) => {
    const slug = r.repo.includes("/") ? (r.repo.split("/")[1] ?? r.repo) : r.repo;
    return [
      pad(slug, COL_WIDTHS.repo),
      pad(r.hasReadme ? "✓" : "✗", COL_WIDTHS.readme),
      pad(r.hasCi ? "✓" : "✗", COL_WIDTHS.ci),
      pad(String(r.openPrs), COL_WIDTHS.openPrs),
      ciStatusLabel(r.ciStatus, r.hasCi),
    ].join("  ");
  });

  return [header, divider, ...rows].join("\n");
}
