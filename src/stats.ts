// src/stats.ts — compute the status-site Stats snapshot from live state.
import type { State } from "./state";

export interface Stats {
  cyclesRun: number;
  prsMerged: number;
  daysAlive: number;
  lastChange: string;
}

// Pure — no I/O. Pass nowMs and repoCreatedMs from the caller so tests don't
// depend on the clock or git, and the logic is fully deterministic.
export function computeStats(
  state: State,
  nowMs: number,
  repoCreatedMs: number,
): Stats {
  const merged = state.pullRequests.filter((pr) => pr.status === "merged");

  // Every PR ever proposed = one cycle (open + merged + closed).
  const cyclesRun = state.pullRequests.length;
  const prsMerged = merged.length;
  const daysAlive = Math.max(0, Math.floor((nowMs - repoCreatedMs) / 86_400_000));

  // Most-recently-resolved merged PR as "what last changed".
  const lastMerged = [...merged].sort((a, b) =>
    (a.resolvedAt ?? "") < (b.resolvedAt ?? "") ? 1 : -1,
  )[0];
  const lastChange = lastMerged?.title ?? "";

  return { cyclesRun, prsMerged, daysAlive, lastChange };
}
