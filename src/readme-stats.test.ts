import { test, expect } from "bun:test";
import { formatReadmeStats, injectStats, STATS_START, STATS_END } from "./readme-stats";
import type { State } from "./state";

function emptyState(): State {
  return { cycles: [], backlog: [], lastKnownGood: null, pullRequests: [] };
}

test("zero state produces zero counts", () => {
  const result = formatReadmeStats(emptyState());
  expect(result).toBe("**Build stats** — 0 cycles run · 0 PRs merged");
});

test("counts cycles correctly", () => {
  const state: State = {
    ...emptyState(),
    cycles: [
      { id: 1, timestamp: "2025-01-01T00:00:00Z", action: "build", branch: "mito/1", testsPassed: true, committed: true, posted: false },
      { id: 2, timestamp: "2025-01-02T00:00:00Z", action: "build", branch: "mito/2", testsPassed: true, committed: true, posted: false },
    ],
  };
  const result = formatReadmeStats(state);
  expect(result).toContain("2 cycles run");
});

test("counts only merged PRs", () => {
  const state: State = {
    ...emptyState(),
    pullRequests: [
      { number: 1, branch: "mito/1", url: "u", title: "feat: A", status: "merged", proposedAt: "2025-01-01T00:00:00Z", resolvedAt: "2025-01-02T00:00:00Z" },
      { number: 2, branch: "mito/2", url: "u", title: "feat: B", status: "closed", proposedAt: "2025-01-01T00:00:00Z" },
      { number: 3, branch: "mito/3", url: "u", title: "feat: C", status: "open", proposedAt: "2025-01-01T00:00:00Z" },
    ],
  };
  const result = formatReadmeStats(state);
  expect(result).toContain("1 PRs merged");
});

test("shows last merged PR title", () => {
  const state: State = {
    ...emptyState(),
    pullRequests: [
      { number: 1, branch: "mito/1", url: "u", title: "feat: first", status: "merged", proposedAt: "2025-01-01T00:00:00Z", resolvedAt: "2025-01-01T00:00:00Z" },
      { number: 2, branch: "mito/2", url: "u", title: "feat: second", status: "merged", proposedAt: "2025-01-02T00:00:00Z", resolvedAt: "2025-01-03T00:00:00Z" },
    ],
  };
  const result = formatReadmeStats(state);
  expect(result).toContain("last change: _feat: second_");
  expect(result).not.toContain("first");
});

test("injectStats replaces content between markers", () => {
  const readme = `before\n${STATS_START}\nold stats\n${STATS_END}\nafter`;
  const result = injectStats(readme, "new stats");
  expect(result).toBe(`before\n${STATS_START}\nnew stats\n${STATS_END}\nafter`);
});

test("injectStats leaves readme unchanged when markers missing", () => {
  const readme = "no markers here";
  expect(injectStats(readme, "stats")).toBe("no markers here");
});

test("injectStats handles empty stats block", () => {
  const readme = `${STATS_START}\n${STATS_END}`;
  const result = injectStats(readme, "**Build stats** — 3 cycles run");
  expect(result).toContain("3 cycles run");
  expect(result).toContain(STATS_START);
  expect(result).toContain(STATS_END);
});
