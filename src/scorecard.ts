// src/scorecard.ts — shipping quality scorecard.
//
// One question: "did the AI ship?" computeScorecard reduces the PR array
// from mito-state.json into hard numbers — merge rate, time-to-merge, and
// PR counts. It is pure: takes data, returns a Scorecard, does no I/O.
//
// CI first-pass rate is intentionally null until the state file carries
// per-PR retry/revert history. We return null rather than fabricate a
// number from data we do not have.

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * The subset of a state PullRequestRecord that the scorecard reads. Kept
 * structurally compatible with src/state.ts PullRequestRecord so callers can
 * pass state.pullRequests directly without mapping.
 */
export interface PullRequest {
  number: number;
  title: string;
  status: "open" | "merged" | "closed";
  proposedAt: string; // ISO-8601
  resolvedAt?: string; // ISO-8601, absent while open or if never recorded
}

export interface Scorecard {
  /** Fraction of all PRs that merged, as a 0-1 float. 0 when there are no PRs. */
  mergeRate: number;
  /**
   * Mean (resolvedAt - proposedAt) in milliseconds across merged PRs that have
   * a valid resolvedAt. null when no such PR exists (nothing to average).
   */
  avgTimeToMergeMs: number | null;
  /**
   * Fraction of merged PRs that passed CI on the first try. null when the
   * state file carries no CI/retry history — the honest answer is N/A, not 1.
   */
  ciFirstPassRate: number | null;
  totalPRs: number;
  mergedPRs: number;
  closedPRs: number;
}

// ---------------------------------------------------------------------------
// Computation — pure, no I/O
// ---------------------------------------------------------------------------

/**
 * Parse an ISO-8601 timestamp into epoch milliseconds, or null if the input
 * is missing or unparseable. We never trust an external timestamp blindly —
 * a malformed resolvedAt must not poison the average with NaN.
 */
function parseEpochMs(iso: string | undefined): number | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  return Number.isNaN(ms) ? null : ms;
}

export function computeScorecard(prs: PullRequest[]): Scorecard {
  const totalPRs = prs.length;
  const merged = prs.filter((pr) => pr.status === "merged");
  const mergedPRs = merged.length;
  const closedPRs = prs.filter((pr) => pr.status === "closed").length;

  // mergeRate: guard the 0/0 case so we return 0, never NaN.
  const mergeRate = totalPRs === 0 ? 0 : mergedPRs / totalPRs;

  // avgTimeToMergeMs: only merged PRs with a parseable resolvedAt strictly
  // after proposedAt contribute. A merged PR missing resolvedAt is excluded
  // from the average (but still counts toward mergedPRs above).
  const durations: number[] = [];
  for (const pr of merged) {
    const proposed = parseEpochMs(pr.proposedAt);
    const resolved = parseEpochMs(pr.resolvedAt);
    if (proposed === null || resolved === null) continue;
    const delta = resolved - proposed;
    // Negative or zero deltas indicate clock skew or bad data; skip them
    // rather than letting them drag the mean below zero.
    if (delta <= 0) continue;
    durations.push(delta);
  }
  const avgTimeToMergeMs =
    durations.length === 0
      ? null
      : Math.round(durations.reduce((sum, d) => sum + d, 0) / durations.length);

  // ciFirstPassRate: null until per-PR CI history exists in state. The
  // PullRequest shape carries no retry/revert field today, so there is nothing
  // to compute from — null is the honest answer.
  const ciFirstPassRate: number | null = null;

  return {
    mergeRate,
    avgTimeToMergeMs,
    ciFirstPassRate,
    totalPRs,
    mergedPRs,
    closedPRs,
  };
}

// ---------------------------------------------------------------------------
// Formatting helpers — pure
// ---------------------------------------------------------------------------

/** Format a 0-1 fraction as a whole-percent string, e.g. 0.6 → "60%". */
export function formatPercent(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}

/**
 * Format a duration in ms as a human-readable string. null → "N/A".
 * Picks the largest sensible unit (days / hours / minutes / seconds).
 */
export function formatDuration(ms: number | null): string {
  if (ms === null) return "N/A";
  const sec = ms / 1000;
  if (sec < 60) return `${Math.round(sec)}s`;
  const min = sec / 60;
  if (min < 60) return `${min.toFixed(1)}m`;
  const hr = min / 60;
  if (hr < 24) return `${hr.toFixed(1)}h`;
  const days = hr / 24;
  return `${days.toFixed(1)}d`;
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

function metricCard(label: string, value: string, accent: string): string {
  return `    <div class="card">
      <div class="value" style="color: ${accent};">${esc(value)}</div>
      <div class="label">${esc(label)}</div>
    </div>`;
}

/**
 * Render a self-contained dark-themed scorecard page. generatedAt is injected
 * (not read from the clock here) so the output is deterministic and testable.
 */
export function buildScorecardHtml(card: Scorecard, generatedAt: string): string {
  const ciDisplay =
    card.ciFirstPassRate === null ? "N/A" : formatPercent(card.ciFirstPassRate);

  const cards = [
    metricCard("merge rate", formatPercent(card.mergeRate), "#68d391"),
    metricCard("avg time to merge", formatDuration(card.avgTimeToMergeMs), "#fbd38d"),
    metricCard("CI first-pass rate", ciDisplay, "#63b3ed"),
    metricCard("total PRs", String(card.totalPRs), "#e2e8f0"),
    metricCard("merged", String(card.mergedPRs), "#68d391"),
    metricCard("closed", String(card.closedPRs), "#FF6B35"),
  ].join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>mito — shipping scorecard</title>
  <style>
    body { background: #0d1117; color: #e2e8f0; font-family: 'Courier New', monospace; max-width: 800px; margin: 40px auto; padding: 20px; }
    h1 { color: #8A2BE2; margin-bottom: 4px; }
    .subtitle { color: #a0aec0; margin-top: 0; font-size: 1.1em; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin: 32px 0; }
    .card { border: 1px solid #2d3748; border-radius: 8px; padding: 20px; background: #161b22; text-align: center; }
    .card .value { font-size: 2em; font-weight: bold; }
    .card .label { color: #a0aec0; font-size: 0.85em; margin-top: 8px; text-transform: uppercase; letter-spacing: 0.05em; }
    footer { color: #4a5568; font-size: 0.8em; border-top: 1px solid #2d3748; padding-top: 12px; margin-top: 24px; }
  </style>
</head>
<body>
  <h1>mito</h1>
  <p class="subtitle">did the AI ship?</p>
  <section class="grid">
${cards}
  </section>
  <footer>Generated ${esc(generatedAt)}</footer>
</body>
</html>`;
}
