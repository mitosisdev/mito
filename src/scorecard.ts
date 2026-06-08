// src/scorecard.ts — pure metric computation for the mito scorecard.
// No I/O. Accepts a State object, returns a typed ScorecardMetrics object.
import type { State } from "./state";

export interface ScorecardMetrics {
  // Counts
  totalPrsOpened: number;
  totalPrsMerged: number;
  totalPrsClosed: number;
  buildSessions: number;

  // Rates — null means "not enough data"
  /** merged / total PRs (0–1). Null if no PRs. */
  mergeRate: number | null;
  /** Average hours from proposedAt → resolvedAt for merged PRs. Null if none. */
  avgTimeToMergeHours: number | null;
  /** Fraction of CycleRecords where testsPassed === true. Null if no cycles. */
  ciFirstPassRate: number | null;
  /**
   * Fraction of total "units" (PRs + cycles) that are reverts.
   * A PR counts as a revert if its closeReason contains "revert" (case-insensitive).
   * A CycleRecord counts as a revert if its action contains "revert" (case-insensitive).
   * Null if no PRs and no cycles exist.
   */
  revertRate: number | null;
}

export function computeMetrics(state: State): ScorecardMetrics {
  const { pullRequests, cycles, buildSessions } = state;

  // --- counts ---
  const totalPrsOpened = pullRequests.length;
  const totalPrsMerged = pullRequests.filter((p) => p.status === "merged").length;
  const totalPrsClosed = pullRequests.filter((p) => p.status === "closed").length;

  // --- merge rate: merged / total PRs ---
  const mergeRate = totalPrsOpened === 0
    ? null
    : totalPrsMerged / totalPrsOpened;

  // --- avg time to merge (hours) ---
  const mergedWithTimestamps = pullRequests.filter(
    (p) => p.status === "merged" && p.resolvedAt != null,
  );
  let avgTimeToMergeHours: number | null = null;
  if (mergedWithTimestamps.length > 0) {
    const totalMs = mergedWithTimestamps.reduce((sum, p) => {
      const proposed = new Date(p.proposedAt).getTime();
      const resolved = new Date(p.resolvedAt!).getTime();
      return sum + (resolved - proposed);
    }, 0);
    avgTimeToMergeHours = Math.round(totalMs / mergedWithTimestamps.length / 3_600_000);
  }

  // --- CI first-pass rate: testsPassed true / total cycles ---
  let ciFirstPassRate: number | null = null;
  if (cycles.length > 0) {
    const passed = cycles.filter((c) => c.testsPassed).length;
    ciFirstPassRate = passed / cycles.length;
  }

  // --- revert rate ---
  // Count revert events across both PRs (by closeReason) and cycles (by action).
  const total = pullRequests.length + cycles.length;
  let revertRate: number | null = null;
  if (total > 0) {
    const prReverts = pullRequests.filter(
      (p) => p.closeReason != null && p.closeReason.toLowerCase().includes("revert"),
    ).length;
    const cycleReverts = cycles.filter(
      (c) => c.action.toLowerCase().includes("revert"),
    ).length;
    revertRate = (prReverts + cycleReverts) / total;
  }

  return {
    totalPrsOpened,
    totalPrsMerged,
    totalPrsClosed,
    buildSessions: buildSessions.length,
    mergeRate,
    avgTimeToMergeHours,
    ciFirstPassRate,
    revertRate,
  };
}
