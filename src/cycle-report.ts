// src/cycle-report.ts — pure computation and formatting for cycle-report.
// No I/O. All functions accept State (or its sub-arrays) directly so tests
// can pass fixture data without touching the filesystem.
import type { State, BuildSession, PullRequestRecord, RejectedIdea } from "./state";

export interface SessionRow {
  sessionId: string;
  startedAt: string;         // ISO timestamp
  prsOpened: number;
  prsMerged: number;
  prsClosed: number;         // closed / rejected (status === "closed")
  rejectedIdeas: string[];   // idea titles from state.rejectedIdeas that occurred in this session window
}

export interface CycleReportData {
  sessions: SessionRow[];
  totalSessions: number;
  totalPrsOpened: number;
  totalPrsMerged: number;
  totalPrsClosed: number;
  successRate: number | null; // null when merged+closed === 0 (avoid div-by-zero)
}

// Associate PRs and rejected ideas with the session that was active when they
// were proposed/closed.  Session windows are [session.startedAt, nextSession.startedAt).
// Items before the first session or without a timestamp fall into session index 0 as a best-effort.
function sessionIndexForTs(sessions: BuildSession[], ts: string): number {
  const t = ts;
  for (let i = sessions.length - 1; i >= 0; i--) {
    if (t >= sessions[i].startedAt) return i;
  }
  return 0;
}

export function buildCycleReport(state: State): CycleReportData {
  const { buildSessions, pullRequests, rejectedIdeas } = state;

  // Build one row per session.
  const rows: SessionRow[] = buildSessions.map((s) => ({
    sessionId: s.id,
    startedAt: s.startedAt,
    prsOpened: s.prsOpened,
    prsMerged: 0,
    prsClosed: 0,
    rejectedIdeas: [],
  }));

  // If there are no sessions yet, produce aggregate-only output from PRs that exist.
  if (rows.length === 0) {
    const merged = pullRequests.filter((p) => p.status === "merged").length;
    const closed = pullRequests.filter((p) => p.status === "closed").length;
    const opened = pullRequests.length;
    const denom = merged + closed;
    return {
      sessions: [],
      totalSessions: 0,
      totalPrsOpened: opened,
      totalPrsMerged: merged,
      totalPrsClosed: closed,
      successRate: denom === 0 ? null : Math.round((merged / denom) * 100),
    };
  }

  // Assign each resolved PR to its session.
  for (const pr of pullRequests) {
    const ts = pr.resolvedAt ?? pr.proposedAt;
    const idx = sessionIndexForTs(buildSessions, ts);
    if (pr.status === "merged") rows[idx].prsMerged++;
    else if (pr.status === "closed") rows[idx].prsClosed++;
    // open PRs don't count toward resolved totals
  }

  // Assign rejected ideas to their session (by closedAt).
  for (const idea of rejectedIdeas) {
    const idx = sessionIndexForTs(buildSessions, idea.closedAt);
    rows[idx].rejectedIdeas.push(idea.title);
  }

  const totalPrsMerged = rows.reduce((s, r) => s + r.prsMerged, 0);
  const totalPrsClosed = rows.reduce((s, r) => s + r.prsClosed, 0);
  const totalPrsOpened = pullRequests.length;
  const denom = totalPrsMerged + totalPrsClosed;

  return {
    sessions: rows,
    totalSessions: rows.length,
    totalPrsOpened,
    totalPrsMerged,
    totalPrsClosed,
    successRate: denom === 0 ? null : Math.round((totalPrsMerged / denom) * 100),
  };
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

function fmtDate(iso: string): string {
  // e.g. "2026-06-05 01:00 UTC"
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

export function formatCycleReport(data: CycleReportData): string {
  const lines: string[] = [];

  lines.push("╔══════════════════════════════════════════════════╗");
  lines.push("║              MITO — CYCLE REPORT                 ║");
  lines.push("╚══════════════════════════════════════════════════╝");
  lines.push("");

  if (data.sessions.length === 0) {
    lines.push("  No build sessions recorded yet.");
    lines.push("");
  } else {
    lines.push("  Sessions");
    lines.push("  ─────────────────────────────────────────────────");

    for (let i = 0; i < data.sessions.length; i++) {
      const s = data.sessions[i];
      const num = String(i + 1).padStart(3, " ");
      lines.push(`  ${num}. ${fmtDate(s.startedAt)}`);
      lines.push(`       PRs opened: ${s.prsOpened}  merged: ${s.prsMerged}  closed: ${s.prsClosed}`);
      if (s.rejectedIdeas.length > 0) {
        lines.push(`       Rejected ideas (${s.rejectedIdeas.length}):`);
        for (const idea of s.rejectedIdeas) {
          lines.push(`         • ${idea}`);
        }
      }
    }

    lines.push("");
  }

  lines.push("  Totals");
  lines.push("  ─────────────────────────────────────────────────");
  lines.push(`  Sessions    : ${data.totalSessions}`);
  lines.push(`  PRs opened  : ${data.totalPrsOpened}`);
  lines.push(`  PRs merged  : ${data.totalPrsMerged}`);
  lines.push(`  PRs closed  : ${data.totalPrsClosed}`);

  if (data.successRate === null) {
    lines.push(`  Success rate: n/a (no resolved PRs)`);
  } else {
    lines.push(`  Success rate: ${data.successRate}%  (merged / merged+closed)`);
  }

  lines.push("");

  return lines.join("\n");
}
