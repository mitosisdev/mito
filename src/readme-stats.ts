import type { State } from "./state.js";

export function formatReadmeStats(state: State): string {
  const cycles = state.cycles.length;

  const merged = state.pullRequests.filter((p) => p.status === "merged");
  const prsCount = merged.length;

  const lastMerged =
    merged.length > 0
      ? merged
          .map((p) => p.resolvedAt ?? p.proposedAt)
          .sort()
          .at(-1)
          ?.slice(0, 10) ?? "—"
      : "—";

  return [
    "| Metric | Value |",
    "|--------|-------|",
    `| Build cycles | ${cycles} |`,
    `| PRs merged | ${prsCount} |`,
    `| Last merged | ${lastMerged} |`,
  ].join("\n");
}
