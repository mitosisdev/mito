// src/status.ts — pure formatting logic for the live status dashboard.
// No I/O: all inputs are injected so tests never hit the network or disk.

import type { State, PullRequestRecord } from "./state";
import type { BacklogTask } from "./backlog";

export interface RepoPrSummary {
  repo: string;
  openCount: number;
  openPrs: Array<{ number: number; title: string; url: string }>;
}

export interface MergedPrSummary {
  number: number;
  title: string;
  mergedAt: string; // ISO 8601
  url: string;
}

export interface StatusData {
  repoPrSummaries: RepoPrSummary[];
  lastMerged: MergedPrSummary[];   // up to 3, newest first
  cycleCount: number;
  nextBacklog: BacklogTask[];       // up to 3 undone tasks
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Format an ISO date as "YYYY-MM-DD" for compact display.
export function fmtDate(iso: string): string {
  return iso.slice(0, 10);
}

// Build last-3-merged from state PR list (newest resolvedAt first).
export function buildLastMerged(prs: PullRequestRecord[], limit = 3): MergedPrSummary[] {
  return prs
    .filter((p) => p.status === "merged" && p.resolvedAt)
    .sort((a, b) => ((a.resolvedAt ?? "") < (b.resolvedAt ?? "") ? 1 : -1))
    .slice(0, limit)
    .map((p) => ({
      number: p.number,
      title: p.title,
      mergedAt: p.resolvedAt!,
      url: p.url,
    }));
}

// Build next N undone backlog items.
export function buildNextBacklog(tasks: BacklogTask[], limit = 3): BacklogTask[] {
  return tasks.filter((t) => !t.done).slice(0, limit);
}

// ---------------------------------------------------------------------------
// Dashboard renderer — returns a multi-line string ready for console output.
// Pure: no console calls, no process.exit.
// ---------------------------------------------------------------------------

export function formatStatus(data: StatusData): string {
  const lines: string[] = [];

  lines.push("╔══════════════════════════════════════════════════╗");
  lines.push("║              mito — status dashboard             ║");
  lines.push("╚══════════════════════════════════════════════════╝");
  lines.push("");

  // ── Open PRs ──────────────────────────────────────────────────────────────
  lines.push("▸ Open PRs");
  if (data.repoPrSummaries.length === 0) {
    lines.push("  (no repos configured)");
  } else {
    for (const repo of data.repoPrSummaries) {
      lines.push(`  ${repo.repo}  →  ${repo.openCount} open`);
      for (const pr of repo.openPrs) {
        lines.push(`    #${pr.number}  ${pr.title}`);
        lines.push(`           ${pr.url}`);
      }
    }
  }
  lines.push("");

  // ── Last 3 merged PRs ─────────────────────────────────────────────────────
  lines.push("▸ Last 3 merged PRs");
  if (data.lastMerged.length === 0) {
    lines.push("  (none yet)");
  } else {
    for (const pr of data.lastMerged) {
      lines.push(`  [${fmtDate(pr.mergedAt)}]  #${pr.number}  ${pr.title}`);
    }
  }
  lines.push("");

  // ── Cycle count ───────────────────────────────────────────────────────────
  lines.push(`▸ Build cycles run:  ${data.cycleCount}`);
  lines.push("");

  // ── Next backlog items ────────────────────────────────────────────────────
  lines.push("▸ Next backlog items");
  if (data.nextBacklog.length === 0) {
    lines.push("  (backlog is empty)");
  } else {
    for (const task of data.nextBacklog) {
      const tag = task.project ? `[${task.project}] ` : "";
      lines.push(`  • ${tag}${task.text}`);
    }
  }
  lines.push("");

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Compose StatusData from state + backlog (still pure, no I/O).
// The live bin/ entry-point calls this; tests can call it directly.
// ---------------------------------------------------------------------------

export function buildStatusData(
  state: State,
  backlogTasks: BacklogTask[],
  repoPrSummaries: RepoPrSummary[],
): StatusData {
  return {
    repoPrSummaries,
    lastMerged: buildLastMerged(state.pullRequests),
    cycleCount: state.buildSessions.length,
    nextBacklog: buildNextBacklog(backlogTasks),
  };
}
