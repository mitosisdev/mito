import { describe, expect, it } from "bun:test";
import { formatReadmeStats } from "./readme-stats.js";
import type { State } from "./state.js";
import { emptyState } from "./state.js";

function stateWithCycles(n: number): State {
  const s = emptyState();
  for (let i = 0; i < n; i++) {
    s.cycles.push({
      id: i + 1,
      timestamp: "2026-01-01T00:00:00Z",
      action: "build",
      branch: `mito/${i + 1}`,
      testsPassed: true,
      committed: true,
      posted: false,
    });
  }
  return s;
}

function stateWithPrs(merged: number, open: number): State {
  const s = emptyState();
  for (let i = 0; i < merged; i++) {
    s.pullRequests.push({
      number: i + 1,
      branch: `mito/${i + 1}`,
      url: `https://github.com/mitosisdev/mito/pull/${i + 1}`,
      title: `PR ${i + 1}`,
      status: "merged",
      proposedAt: "2026-01-01T00:00:00Z",
      resolvedAt: `2026-0${(i % 9) + 1}-10T12:00:00Z`,
    });
  }
  for (let i = 0; i < open; i++) {
    s.pullRequests.push({
      number: merged + i + 1,
      branch: `mito/${merged + i + 1}`,
      url: `https://github.com/mitosisdev/mito/pull/${merged + i + 1}`,
      title: `PR open ${i + 1}`,
      status: "open",
      proposedAt: "2026-06-01T00:00:00Z",
    });
  }
  return s;
}

describe("formatReadmeStats", () => {
  it("shows zeros and dashes for empty state", () => {
    const out = formatReadmeStats(emptyState());
    expect(out).toContain("| Build cycles | 0 |");
    expect(out).toContain("| PRs merged | 0 |");
    expect(out).toContain("| Last merged | — |");
  });

  it("shows correct cycle count", () => {
    const out = formatReadmeStats(stateWithCycles(5));
    expect(out).toContain("| Build cycles | 5 |");
  });

  it("counts only merged PRs, ignores open ones", () => {
    const out = formatReadmeStats(stateWithPrs(3, 2));
    expect(out).toContain("| PRs merged | 3 |");
  });

  it("shows YYYY-MM-DD date of last resolved PR", () => {
    const s = stateWithPrs(2, 0);
    // second PR resolvedAt is 2026-02-10
    const out = formatReadmeStats(s);
    expect(out).toContain("| Last merged | 2026-02-10 |");
  });

  it("output is a markdown table with pipe characters", () => {
    const out = formatReadmeStats(emptyState());
    const lines = out.split("\n");
    expect(lines.every((l) => l.startsWith("|") && l.endsWith("|"))).toBe(true);
    expect(lines.length).toBeGreaterThanOrEqual(4); // header + separator + 3 rows
  });

  it("does not hardcode values — reflects actual state data", () => {
    const s1 = stateWithCycles(7);
    const s2 = stateWithCycles(12);
    expect(formatReadmeStats(s1)).toContain("| Build cycles | 7 |");
    expect(formatReadmeStats(s2)).toContain("| Build cycles | 12 |");
  });
});
