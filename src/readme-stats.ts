// src/readme-stats.ts — format mito's live stats for README injection.
// Pure: takes state, returns a markdown string. No I/O.
import type { State } from "./state";

export const STATS_START = "<!-- stats-start -->";
export const STATS_END = "<!-- stats-end -->";

export function formatReadmeStats(state: State): string {
  const cyclesRun = state.cycles.length;
  const merged = state.pullRequests.filter((pr) => pr.status === "merged");
  const prsMerged = merged.length;

  const lastMerged = [...merged].sort((a, b) =>
    (a.resolvedAt ?? "") < (b.resolvedAt ?? "") ? 1 : -1,
  )[0];

  const lastChangePart = lastMerged
    ? ` · last change: _${lastMerged.title}_`
    : "";

  return `**Build stats** — ${cyclesRun} cycles run · ${prsMerged} PRs merged${lastChangePart}`;
}

// Replace the block between marker comments with the new stats line.
// Returns the readme unchanged if markers are missing.
export function injectStats(readme: string, stats: string): string {
  const startIdx = readme.indexOf(STATS_START);
  const endIdx = readme.indexOf(STATS_END);
  if (startIdx === -1 || endIdx === -1) return readme;
  return (
    readme.slice(0, startIdx + STATS_START.length) +
    "\n" +
    stats +
    "\n" +
    readme.slice(endIdx)
  );
}
