// src/portfolio-diff.ts — pure computation and formatting for portfolio-diff.
// No I/O. The bin/ entry-point injects all deps (fetch, state, registry)
// so this file is fully unit-testable without hitting the network or disk.
//
// For each managed repo, we:
//   1. Fetch PRs merged since the last reviewer session timestamp.
//   2. Fetch the current open PR count.
//   3. Fetch the latest commit on main (SHA + message + date).

import type { FetchLike } from "./github";
import type { Registry } from "./registry";
import type { State } from "./state";

// ---------------------------------------------------------------------------
// Data shapes
// ---------------------------------------------------------------------------

export interface MergedPrEntry {
  number: number;
  title: string;
  mergedAt: string; // ISO 8601
  url: string;
}

export interface LatestCommit {
  sha: string;    // short (7-char) SHA
  message: string;
  date: string;   // YYYY-MM-DD
}

export interface RepoDiff {
  repo: string;
  mergedPrs: MergedPrEntry[];
  openCount: number;
  latestCommit: LatestCommit | null;
}

export interface PortfolioDiffData {
  sinceDate: string; // YYYY-MM-DD derived from last reviewer session, or "epoch" if none
  sinceIso: string;  // ISO 8601 — used for API filtering
  repos: RepoDiff[];
}

// ---------------------------------------------------------------------------
// GitHub API fetchers (one per repo, injected fetch)
// ---------------------------------------------------------------------------

export interface RepoDiffFetcher {
  /** PRs merged after `since` (ISO 8601 string). */
  fetchMergedPrs(repo: string, since: string): Promise<MergedPrEntry[]>;
  /** Current count of open PRs. */
  fetchOpenPrCount(repo: string): Promise<number>;
  /** Latest commit on `main` branch. */
  fetchLatestCommit(repo: string): Promise<LatestCommit | null>;
}

export function makeRepoDiffFetcher(token: string, fetch: FetchLike): RepoDiffFetcher {
  const API = "https://api.github.com";

  const headers = (): Record<string, string> => ({
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "Content-Type": "application/json",
    "User-Agent": "mito",
  });

  async function get(url: string): Promise<unknown> {
    const res = await fetch(url, { method: "GET", headers: headers() });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`GitHub GET ${url} -> ${res.status} ${detail}`);
    }
    return res.json();
  }

  return {
    async fetchMergedPrs(repo, since) {
      // GitHub's pulls API doesn't filter by merge date directly.
      // We query closed PRs sorted by updated time and filter client-side.
      const url = `${API}/repos/${repo}/pulls?state=closed&sort=updated&direction=desc&per_page=50`;
      const prs = (await get(url)) as Array<{
        number: number;
        title: string;
        merged_at: string | null;
        html_url: string;
      }>;
      return prs
        .filter((p) => p.merged_at !== null && p.merged_at > since)
        .map((p) => ({
          number: p.number,
          title: p.title,
          mergedAt: p.merged_at as string,
          url: p.html_url,
        }));
    },

    async fetchOpenPrCount(repo) {
      const url = `${API}/repos/${repo}/pulls?state=open&per_page=1`;
      // We only need the count; use the Link header trick — but simpler: fetch
      // up to 100 and count. For small portfolios this is fine.
      const url100 = `${API}/repos/${repo}/pulls?state=open&per_page=100`;
      const prs = (await get(url100)) as Array<unknown>;
      // suppress unused warning
      void url;
      return prs.length;
    },

    async fetchLatestCommit(repo) {
      const url = `${API}/repos/${repo}/commits/main`;
      try {
        const data = (await get(url)) as {
          sha: string;
          commit: {
            message: string;
            committer: { date: string } | null;
            author: { date: string } | null;
          };
        };
        const rawDate =
          data.commit.committer?.date ?? data.commit.author?.date ?? "";
        const date = rawDate.slice(0, 10); // YYYY-MM-DD
        const sha = data.sha.slice(0, 7);
        // First line of commit message only.
        const message = data.commit.message.split("\n")[0] ?? "";
        return { sha, message, date };
      } catch {
        // Branch may not exist or be named differently — return null gracefully.
        return null;
      }
    },
  };
}

// ---------------------------------------------------------------------------
// "Last reviewer session" — derived from state.buildSessions
// We use the last session's startedAt as the baseline "since" timestamp.
// ---------------------------------------------------------------------------

export function lastReviewerTimestamp(state: State): string {
  // Use the most recent build session start as the "since" boundary.
  // If there are no sessions yet, fall back to the Unix epoch so the diff
  // covers everything.
  const sessions = state.buildSessions;
  if (sessions.length === 0) return "1970-01-01T00:00:00.000Z";
  return sessions[sessions.length - 1]!.startedAt;
}

// ---------------------------------------------------------------------------
// Data builder — fetches all repos in parallel
// ---------------------------------------------------------------------------

export async function buildPortfolioDiff(
  state: State,
  registry: Registry,
  homeRepo: string,
  fetcher: RepoDiffFetcher,
): Promise<PortfolioDiffData> {
  const sinceIso = lastReviewerTimestamp(state);
  const sinceDate = sinceIso.slice(0, 10);

  // Home repo + all registered project repos (deduplicated).
  const allRepos = [homeRepo];
  for (const project of registry.projects) {
    if (!allRepos.includes(project.repo)) allRepos.push(project.repo);
  }

  const repos = await Promise.all(
    allRepos.map(async (repo): Promise<RepoDiff> => {
      const [mergedPrs, openCount, latestCommit] = await Promise.all([
        fetcher.fetchMergedPrs(repo, sinceIso).catch((): MergedPrEntry[] => []),
        fetcher.fetchOpenPrCount(repo).catch(() => 0),
        fetcher.fetchLatestCommit(repo).catch(() => null),
      ]);
      return { repo, mergedPrs, openCount, latestCommit };
    }),
  );

  return { sinceDate, sinceIso, repos };
}

// ---------------------------------------------------------------------------
// Relative time helper — "2h ago", "3d ago", etc.
// ---------------------------------------------------------------------------

export function relativeTime(iso: string, now: Date = new Date()): string {
  const diffMs = now.getTime() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
}

// ---------------------------------------------------------------------------
// Markdown formatter
// ---------------------------------------------------------------------------

export function formatPortfolioDiff(data: PortfolioDiffData, now: Date = new Date()): string {
  const lines: string[] = [];

  lines.push(`# Portfolio Diff — since ${data.sinceDate}`);
  lines.push("");

  for (const repo of data.repos) {
    lines.push(`## ${repo.repo}`);

    // Merged PRs
    if (repo.mergedPrs.length === 0) {
      lines.push("- ✅ Merged: none");
    } else {
      for (const pr of repo.mergedPrs) {
        const rel = relativeTime(pr.mergedAt, now);
        lines.push(`- ✅ Merged: #${pr.number} ${pr.title} (${rel})`);
      }
    }

    // Open PR count
    lines.push(`- 📬 Open: ${repo.openCount} PR${repo.openCount === 1 ? "" : "s"}`);

    // Latest commit on main
    if (repo.latestCommit === null) {
      lines.push("- 🔀 Latest: (not available)");
    } else {
      const c = repo.latestCommit;
      lines.push(`- 🔀 Latest: ${c.sha} ${c.message} (${c.date})`);
    }

    lines.push("");
  }

  return lines.join("\n");
}
