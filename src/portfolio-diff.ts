// src/portfolio-diff.ts — pure computation + Markdown rendering for the
// "what changed since the last reviewer pass" portfolio diff.
//
// No I/O. All functions take State (or its sub-arrays) directly so tests run
// on fixture data. The bin wrapper (bin/portfolio-diff.ts) handles file reads.
//
// "Since the last reviewer pass" has no explicit marker in mito-state.json, so
// the cutoff is modelled as the start of the most recent build session (each
// reviewer cycle runs inside a build session — same windowing convention used
// by src/cycle-report.ts). Callers may override with an explicit ISO `since`.
import type { State, PullRequestRecord } from "./state";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MergedEntry {
  number: number;
  title: string;
  repo: string;       // owner/name parsed from the PR url
  branch: string;
  url: string;
  mergedAt: string;   // resolvedAt (falls back to proposedAt if absent)
}

export interface RepoGroup {
  repo: string;
  mergedCount: number;
  merged: MergedEntry[];
}

export interface OpenDelta {
  currentOpen: number;      // PRs currently in "open" status (snapshot)
  newlyOpened: number;      // PRs proposed at/after cutoff and still open
  resolvedInWindow: number; // PRs resolved (merged|closed) at/after cutoff
  net: number;              // newlyOpened - resolvedInWindow
}

export interface PortfolioDiff {
  cutoff: string | null;     // ISO timestamp, or null when no window boundary
  merged: MergedEntry[];     // PRs merged at/after cutoff, newest first
  repos: RepoGroup[];        // merged entries grouped by repo, sorted by repo
  openDelta: OpenDelta;
}

// ---------------------------------------------------------------------------
// Cutoff resolution
// ---------------------------------------------------------------------------

// Resolve the "since last reviewer pass" boundary.
// Precedence: explicit `since` override > most recent build session start > null.
export function resolveCutoff(state: State, since?: string): string | null {
  if (since) return since;
  if (state.buildSessions.length === 0) return null;
  // Most recent session start — array order is not guaranteed, so reduce.
  return state.buildSessions.reduce(
    (latest, s) => (s.startedAt > latest ? s.startedAt : latest),
    state.buildSessions[0].startedAt,
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Parse "owner/name" out of a GitHub PR url. Falls back to the raw url tail.
function repoFromUrl(url: string): string {
  const m = url.match(/github\.com\/([^/]+)\/([^/]+)\/pull\//);
  if (m) return `${m[1]}/${m[2]}`;
  return "unknown";
}

function mergeTime(pr: PullRequestRecord): string {
  return pr.resolvedAt ?? pr.proposedAt;
}

// A PR counts as "in window" when its timestamp is at or after the cutoff.
// A null cutoff means no boundary — everything is in window (full history).
function atOrAfter(ts: string, cutoff: string | null): boolean {
  return cutoff === null || ts >= cutoff;
}

// ---------------------------------------------------------------------------
// Computation
// ---------------------------------------------------------------------------

export function buildPortfolioDiff(state: State, since?: string): PortfolioDiff {
  const cutoff = resolveCutoff(state, since);
  const prs = state.pullRequests;

  // Merged PRs whose merge happened at/after the cutoff, newest first.
  const merged: MergedEntry[] = prs
    .filter((p) => p.status === "merged" && atOrAfter(mergeTime(p), cutoff))
    .map((p) => ({
      number: p.number,
      title: p.title,
      repo: repoFromUrl(p.url),
      branch: p.branch,
      url: p.url,
      mergedAt: mergeTime(p),
    }))
    .sort((a, b) => b.mergedAt.localeCompare(a.mergedAt));

  // Group merged entries by repo, sorted by repo name for stable output.
  const byRepo = new Map<string, MergedEntry[]>();
  for (const e of merged) {
    const list = byRepo.get(e.repo) ?? [];
    list.push(e);
    byRepo.set(e.repo, list);
  }
  const repos: RepoGroup[] = [...byRepo.entries()]
    .map(([repo, entries]) => ({ repo, mergedCount: entries.length, merged: entries }))
    .sort((a, b) => a.repo.localeCompare(b.repo));

  // Open PR delta.
  const currentOpen = prs.filter((p) => p.status === "open").length;
  const newlyOpened = prs.filter(
    (p) => p.status === "open" && atOrAfter(p.proposedAt, cutoff),
  ).length;
  const resolvedInWindow = prs.filter(
    (p) =>
      (p.status === "merged" || p.status === "closed") &&
      atOrAfter(mergeTime(p), cutoff),
  ).length;

  return {
    cutoff,
    merged,
    repos,
    openDelta: {
      currentOpen,
      newlyOpened,
      resolvedInWindow,
      net: newlyOpened - resolvedInWindow,
    },
  };
}

// ---------------------------------------------------------------------------
// Markdown rendering
// ---------------------------------------------------------------------------

function fmtDate(iso: string): string {
  try {
    const d = new Date(iso);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(d.getUTCDate()).padStart(2, "0");
    const hh = String(d.getUTCHours()).padStart(2, "0");
    const min = String(d.getUTCMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd} ${hh}:${min} UTC`;
  } catch {
    return iso;
  }
}

function signed(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}

export function formatPortfolioDiff(diff: PortfolioDiff): string {
  const lines: string[] = [];

  lines.push("# Portfolio Diff");
  lines.push("");

  if (diff.cutoff) {
    lines.push(`_Changes since the last reviewer pass (${fmtDate(diff.cutoff)})._`);
  } else {
    lines.push("_No build sessions recorded yet — showing full history._");
  }
  lines.push("");

  // --- PRs merged ---------------------------------------------------------
  lines.push(`## PRs merged (${diff.merged.length})`);
  lines.push("");
  if (diff.merged.length === 0) {
    lines.push("No merged PRs in this window.");
    lines.push("");
  } else {
    for (const group of diff.repos) {
      lines.push(`### ${group.repo} (${group.mergedCount})`);
      lines.push("");
      for (const e of group.merged) {
        lines.push(`- [#${e.number}](${e.url}) ${e.title} — merged ${fmtDate(e.mergedAt)}`);
      }
      lines.push("");
    }
  }

  // --- Activity per repo --------------------------------------------------
  lines.push("## Activity per repo");
  lines.push("");
  if (diff.repos.length === 0) {
    lines.push("No repo activity in this window.");
    lines.push("");
  } else {
    lines.push("| Repo | PRs merged |");
    lines.push("| --- | --- |");
    for (const group of diff.repos) {
      lines.push(`| ${group.repo} | ${group.mergedCount} |`);
    }
    lines.push("");
  }

  // --- Open PR delta ------------------------------------------------------
  const d = diff.openDelta;
  lines.push("## Open PR delta");
  lines.push("");
  lines.push(`- Currently open: ${d.currentOpen}`);
  lines.push(`- Opened in window: ${d.newlyOpened}`);
  lines.push(`- Resolved in window: ${d.resolvedInWindow}`);
  lines.push(`- Net change: ${signed(d.net)}`);
  lines.push("");

  return lines.join("\n");
}
