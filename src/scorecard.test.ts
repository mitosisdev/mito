// src/scorecard.test.ts — TDD for the shipping quality scorecard.
//
// computeScorecard reads the PullRequest array from mito-state.json and
// answers one question: "did the AI ship?" — merge rate, time-to-merge,
// and PR counts. CI first-pass rate is null when no cycle data exists.
import { test, expect } from "bun:test";
import { computeScorecard, type PullRequest } from "./scorecard";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

// A merged PR that took exactly 60_000 ms (1 minute) to resolve.
const mergedFast: PullRequest = {
  number: 1,
  title: "Add doctor.ts",
  status: "merged",
  proposedAt: "2026-06-02T18:56:00.000Z",
  resolvedAt: "2026-06-02T18:57:00.000Z", // +60_000 ms
};

// A merged PR that took exactly 180_000 ms (3 minutes) to resolve.
const mergedSlow: PullRequest = {
  number: 2,
  title: "Add scorecard.ts",
  status: "merged",
  proposedAt: "2026-06-02T19:00:00.000Z",
  resolvedAt: "2026-06-02T19:03:00.000Z", // +180_000 ms
};

// A merged PR with no resolvedAt — must be excluded from the time average,
// but still counted as merged.
const mergedNoResolved: PullRequest = {
  number: 3,
  title: "Add stats.ts",
  status: "merged",
  proposedAt: "2026-06-02T20:00:00.000Z",
  // resolvedAt intentionally omitted
};

const closed: PullRequest = {
  number: 4,
  title: "Rejected experiment",
  status: "closed",
  proposedAt: "2026-06-02T21:00:00.000Z",
  resolvedAt: "2026-06-02T21:05:00.000Z",
};

// ---------------------------------------------------------------------------
// mergeRate
// ---------------------------------------------------------------------------

test("computeScorecard mergeRate is fraction of merged PRs as a 0-1 float", () => {
  // 2 merged out of 4 total = 0.5
  const card = computeScorecard([mergedFast, mergedSlow, closed, closed]);
  expect(card.mergeRate).toBeCloseTo(0.5, 10);
});

test("computeScorecard mergeRate is 1 when every PR is merged", () => {
  const card = computeScorecard([mergedFast, mergedSlow]);
  expect(card.mergeRate).toBeCloseTo(1, 10);
});

// ---------------------------------------------------------------------------
// avgTimeToMergeMs
// ---------------------------------------------------------------------------

test("computeScorecard avgTimeToMergeMs averages merged PR durations", () => {
  // (60_000 + 180_000) / 2 = 120_000
  const card = computeScorecard([mergedFast, mergedSlow]);
  expect(card.avgTimeToMergeMs).toBe(120_000);
});

test("computeScorecard excludes merged PRs without resolvedAt from the average", () => {
  // Only mergedFast (60_000) counts; mergedNoResolved is excluded from the
  // average but still counts toward mergedPRs.
  const card = computeScorecard([mergedFast, mergedNoResolved]);
  expect(card.avgTimeToMergeMs).toBe(60_000);
  expect(card.mergedPRs).toBe(2);
});

// ---------------------------------------------------------------------------
// counts + mixed statuses
// ---------------------------------------------------------------------------

test("computeScorecard counts total, merged, and closed PRs in a mixed set", () => {
  const card = computeScorecard([mergedFast, mergedSlow, mergedNoResolved, closed]);
  expect(card.totalPRs).toBe(4);
  expect(card.mergedPRs).toBe(3);
  expect(card.closedPRs).toBe(1);
});

// ---------------------------------------------------------------------------
// empty input
// ---------------------------------------------------------------------------

test("computeScorecard handles an empty PR array gracefully", () => {
  const card = computeScorecard([]);
  expect(card.totalPRs).toBe(0);
  expect(card.mergedPRs).toBe(0);
  expect(card.closedPRs).toBe(0);
  expect(card.mergeRate).toBe(0); // 0 merged / 0 total → 0, never NaN
  expect(card.avgTimeToMergeMs).toBeNull(); // no merged PRs → no average
  expect(card.ciFirstPassRate).toBeNull();
});

// ---------------------------------------------------------------------------
// ciFirstPassRate null fallback
// ---------------------------------------------------------------------------

test("computeScorecard ciFirstPassRate is null when no CI data is present", () => {
  // The state file has no per-PR CI/retry history, so the metric is N/A.
  const card = computeScorecard([mergedFast, mergedSlow, closed]);
  expect(card.ciFirstPassRate).toBeNull();
});
