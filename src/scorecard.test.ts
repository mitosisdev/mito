// src/scorecard.test.ts — unit tests for scorecard metric computation.
// All fixture data; no file I/O.
import { test, expect } from "bun:test";
import type { State } from "./state";
import { computeMetrics } from "./scorecard";

function emptyState(): State {
  return {
    cycles: [],
    backlog: [],
    lastKnownGood: null,
    pullRequests: [],
    rejectedIdeas: [],
    buildSessions: [],
  };
}

// ---------------------------------------------------------------------------
// computeMetrics — empty state
// ---------------------------------------------------------------------------

test("empty state returns zero/null metrics", () => {
  const m = computeMetrics(emptyState());
  expect(m.totalPrsOpened).toBe(0);
  expect(m.totalPrsMerged).toBe(0);
  expect(m.totalPrsClosed).toBe(0);
  expect(m.buildSessions).toBe(0);
  expect(m.mergeRate).toBeNull();
  expect(m.avgTimeToMergeHours).toBeNull();
  expect(m.ciFirstPassRate).toBeNull();
  expect(m.revertRate).toBeNull();
});

// ---------------------------------------------------------------------------
// mergeRate
// ---------------------------------------------------------------------------

test("mergeRate is null when no PRs", () => {
  expect(computeMetrics(emptyState()).mergeRate).toBeNull();
});

test("mergeRate is 1.0 when all PRs merged", () => {
  const state: State = {
    ...emptyState(),
    pullRequests: [
      { number: 1, branch: "a", url: "u", title: "A", status: "merged", proposedAt: "2026-01-01T00:00:00.000Z" },
      { number: 2, branch: "b", url: "u", title: "B", status: "merged", proposedAt: "2026-01-01T00:00:00.000Z" },
    ],
  };
  expect(computeMetrics(state).mergeRate).toBe(1.0);
});

test("mergeRate is 0 when no PRs merged (all closed)", () => {
  const state: State = {
    ...emptyState(),
    pullRequests: [
      { number: 1, branch: "a", url: "u", title: "A", status: "closed", proposedAt: "2026-01-01T00:00:00.000Z" },
    ],
  };
  expect(computeMetrics(state).mergeRate).toBe(0);
});

test("mergeRate is 0.5 for 1 merged 1 closed", () => {
  const state: State = {
    ...emptyState(),
    pullRequests: [
      { number: 1, branch: "a", url: "u", title: "A", status: "merged", proposedAt: "2026-01-01T00:00:00.000Z" },
      { number: 2, branch: "b", url: "u", title: "B", status: "closed", proposedAt: "2026-01-01T00:00:00.000Z" },
    ],
  };
  expect(computeMetrics(state).mergeRate).toBe(0.5);
});

test("mergeRate ignores open PRs in denominator", () => {
  // 1 merged, 1 open — denominator is total PRs = 2
  const state: State = {
    ...emptyState(),
    pullRequests: [
      { number: 1, branch: "a", url: "u", title: "A", status: "merged", proposedAt: "2026-01-01T00:00:00.000Z" },
      { number: 2, branch: "b", url: "u", title: "B", status: "open", proposedAt: "2026-01-01T00:00:00.000Z" },
    ],
  };
  expect(computeMetrics(state).mergeRate).toBe(0.5);
});

// ---------------------------------------------------------------------------
// avgTimeToMergeHours
// ---------------------------------------------------------------------------

test("avgTimeToMergeHours is null when no merged PRs", () => {
  const state: State = {
    ...emptyState(),
    pullRequests: [
      { number: 1, branch: "a", url: "u", title: "A", status: "closed", proposedAt: "2026-01-01T00:00:00.000Z" },
    ],
  };
  expect(computeMetrics(state).avgTimeToMergeHours).toBeNull();
});

test("avgTimeToMergeHours is null when merged PR has no resolvedAt", () => {
  const state: State = {
    ...emptyState(),
    pullRequests: [
      { number: 1, branch: "a", url: "u", title: "A", status: "merged", proposedAt: "2026-01-01T00:00:00.000Z" },
    ],
  };
  expect(computeMetrics(state).avgTimeToMergeHours).toBeNull();
});

test("avgTimeToMergeHours computes 11 hours for single PR", () => {
  const state: State = {
    ...emptyState(),
    pullRequests: [
      {
        number: 1, branch: "a", url: "u", title: "A", status: "merged",
        proposedAt: "2026-01-01T00:00:00.000Z",
        resolvedAt: "2026-01-01T11:00:00.000Z",
      },
    ],
  };
  expect(computeMetrics(state).avgTimeToMergeHours).toBe(11);
});

test("avgTimeToMergeHours averages across multiple merged PRs", () => {
  const state: State = {
    ...emptyState(),
    pullRequests: [
      {
        number: 1, branch: "a", url: "u", title: "A", status: "merged",
        proposedAt: "2026-01-01T00:00:00.000Z",
        resolvedAt: "2026-01-01T10:00:00.000Z", // 10h
      },
      {
        number: 2, branch: "b", url: "u", title: "B", status: "merged",
        proposedAt: "2026-01-01T00:00:00.000Z",
        resolvedAt: "2026-01-01T20:00:00.000Z", // 20h
      },
    ],
  };
  expect(computeMetrics(state).avgTimeToMergeHours).toBe(15);
});

test("avgTimeToMergeHours skips merged PRs without resolvedAt", () => {
  const state: State = {
    ...emptyState(),
    pullRequests: [
      {
        number: 1, branch: "a", url: "u", title: "A", status: "merged",
        proposedAt: "2026-01-01T00:00:00.000Z",
        resolvedAt: "2026-01-01T06:00:00.000Z", // 6h
      },
      {
        number: 2, branch: "b", url: "u", title: "B", status: "merged",
        proposedAt: "2026-01-01T00:00:00.000Z",
        // no resolvedAt — skip
      },
    ],
  };
  expect(computeMetrics(state).avgTimeToMergeHours).toBe(6);
});

// ---------------------------------------------------------------------------
// ciFirstPassRate
// ---------------------------------------------------------------------------

test("ciFirstPassRate is null when no cycles", () => {
  expect(computeMetrics(emptyState()).ciFirstPassRate).toBeNull();
});

test("ciFirstPassRate is 1.0 when all cycles pass on first attempt", () => {
  const state: State = {
    ...emptyState(),
    cycles: [
      { id: 1, timestamp: "2026-01-01T00:00:00.000Z", action: "build", branch: "a", testsPassed: true, committed: true, posted: false },
      { id: 2, timestamp: "2026-01-01T01:00:00.000Z", action: "build", branch: "b", testsPassed: true, committed: true, posted: false },
    ],
  };
  expect(computeMetrics(state).ciFirstPassRate).toBe(1.0);
});

test("ciFirstPassRate is 0 when all cycles fail", () => {
  const state: State = {
    ...emptyState(),
    cycles: [
      { id: 1, timestamp: "2026-01-01T00:00:00.000Z", action: "build", branch: "a", testsPassed: false, committed: false, posted: false },
    ],
  };
  expect(computeMetrics(state).ciFirstPassRate).toBe(0);
});

test("ciFirstPassRate computes ratio of passing cycles", () => {
  const state: State = {
    ...emptyState(),
    cycles: [
      { id: 1, timestamp: "2026-01-01T00:00:00.000Z", action: "build", branch: "a", testsPassed: true, committed: true, posted: false },
      { id: 2, timestamp: "2026-01-01T01:00:00.000Z", action: "build", branch: "b", testsPassed: false, committed: false, posted: false },
      { id: 3, timestamp: "2026-01-01T02:00:00.000Z", action: "build", branch: "c", testsPassed: true, committed: true, posted: false },
      { id: 4, timestamp: "2026-01-01T03:00:00.000Z", action: "build", branch: "d", testsPassed: false, committed: false, posted: false },
    ],
  };
  expect(computeMetrics(state).ciFirstPassRate).toBe(0.5);
});

// ---------------------------------------------------------------------------
// revertRate
// ---------------------------------------------------------------------------

test("revertRate is null when no PRs and no cycles", () => {
  expect(computeMetrics(emptyState()).revertRate).toBeNull();
});

test("revertRate detects PR closeReason containing revert", () => {
  const state: State = {
    ...emptyState(),
    pullRequests: [
      { number: 1, branch: "a", url: "u", title: "A", status: "closed", proposedAt: "2026-01-01T00:00:00.000Z", closeReason: "revert" },
      { number: 2, branch: "b", url: "u", title: "B", status: "merged", proposedAt: "2026-01-01T00:00:00.000Z" },
    ],
  };
  const m = computeMetrics(state);
  expect(m.revertRate).toBe(0.5);
});

test("revertRate detects cycle action containing revert", () => {
  const state: State = {
    ...emptyState(),
    cycles: [
      { id: 1, timestamp: "2026-01-01T00:00:00.000Z", action: "revert-build", branch: "a", testsPassed: false, committed: false, posted: false },
      { id: 2, timestamp: "2026-01-01T01:00:00.000Z", action: "build", branch: "b", testsPassed: true, committed: true, posted: false },
    ],
    pullRequests: [
      { number: 1, branch: "b", url: "u", title: "B", status: "merged", proposedAt: "2026-01-01T00:00:00.000Z" },
    ],
  };
  const m = computeMetrics(state);
  // 1 revert event out of 3 total (2 cycles + 1 PR) = 1/3
  expect(m.revertRate).toBeCloseTo(1 / 3, 5);
});

test("revertRate is 0 when no reverts", () => {
  const state: State = {
    ...emptyState(),
    pullRequests: [
      { number: 1, branch: "a", url: "u", title: "A", status: "merged", proposedAt: "2026-01-01T00:00:00.000Z" },
    ],
  };
  expect(computeMetrics(state).revertRate).toBe(0);
});

test("revertRate closeReason match is case-insensitive substring", () => {
  const state: State = {
    ...emptyState(),
    pullRequests: [
      { number: 1, branch: "a", url: "u", title: "A", status: "closed", proposedAt: "2026-01-01T00:00:00.000Z", closeReason: "auto-Revert of #12" },
      { number: 2, branch: "b", url: "u", title: "B", status: "merged", proposedAt: "2026-01-01T00:00:00.000Z" },
    ],
  };
  expect(computeMetrics(state).revertRate).toBe(0.5);
});

// ---------------------------------------------------------------------------
// counts and buildSessions
// ---------------------------------------------------------------------------

test("buildSessions count matches state.buildSessions length", () => {
  const state: State = {
    ...emptyState(),
    buildSessions: [
      { id: "2026-01-01T00:00:00.000Z", startedAt: "2026-01-01T00:00:00.000Z", prsOpened: 0 },
      { id: "2026-01-02T00:00:00.000Z", startedAt: "2026-01-02T00:00:00.000Z", prsOpened: 1 },
    ],
  };
  expect(computeMetrics(state).buildSessions).toBe(2);
});

test("PR status counts are correct", () => {
  const state: State = {
    ...emptyState(),
    pullRequests: [
      { number: 1, branch: "a", url: "u", title: "A", status: "merged", proposedAt: "2026-01-01T00:00:00.000Z" },
      { number: 2, branch: "b", url: "u", title: "B", status: "merged", proposedAt: "2026-01-01T00:00:00.000Z" },
      { number: 3, branch: "c", url: "u", title: "C", status: "closed", proposedAt: "2026-01-01T00:00:00.000Z" },
      { number: 4, branch: "d", url: "u", title: "D", status: "open", proposedAt: "2026-01-01T00:00:00.000Z" },
    ],
  };
  const m = computeMetrics(state);
  expect(m.totalPrsOpened).toBe(4);
  expect(m.totalPrsMerged).toBe(2);
  expect(m.totalPrsClosed).toBe(1);
});
