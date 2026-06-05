import { test, expect } from "bun:test";
import { computeStats } from "../src/stats";
import { emptyState } from "../src/state";
import type { State } from "../src/state";

const DAY = 86_400_000;
const base = new Date("2026-06-01T00:00:00Z").getTime();
const now = new Date("2026-06-05T12:00:00Z").getTime();

test("empty state produces zero counts and empty lastChange", () => {
  const s = computeStats(emptyState(), now, base);
  expect(s).toEqual({ cyclesRun: 0, prsMerged: 0, daysAlive: 4, lastChange: "" });
});

test("daysAlive rounds down to whole days", () => {
  const s = computeStats(emptyState(), base + DAY * 2.9, base);
  expect(s.daysAlive).toBe(2);
});

test("daysAlive is 0 when now === repoCreated", () => {
  const s = computeStats(emptyState(), base, base);
  expect(s.daysAlive).toBe(0);
});

test("cyclesRun counts build sessions, not PRs; prsMerged counts only merged PRs", () => {
  const state: State = {
    ...emptyState(),
    buildSessions: [
      { id: "2026-06-05T01:00:00.000Z", startedAt: "2026-06-05T01:00:00.000Z", prsOpened: 0 },
      { id: "2026-06-05T02:00:00.000Z", startedAt: "2026-06-05T02:00:00.000Z", prsOpened: 1 },
    ],
    pullRequests: [
      { number: 1, branch: "mito/1", url: "u", title: "first", status: "merged", proposedAt: "t", resolvedAt: "2026-06-02T10:00:00Z", mergeSha: "abc" },
      { number: 2, branch: "mito/2", url: "u", title: "second", status: "closed", proposedAt: "t", resolvedAt: "2026-06-03T10:00:00Z", closeReason: "bad" },
      { number: 3, branch: "mito/3", url: "u", title: "third", status: "open", proposedAt: "t" },
    ],
  };
  const s = computeStats(state, now, base);
  expect(s.cyclesRun).toBe(2); // 2 build sessions, not 3 PRs
  expect(s.prsMerged).toBe(1);
});

test("cyclesRun is 0 when no build sessions have run even if PRs exist", () => {
  const state: State = {
    ...emptyState(),
    pullRequests: [
      { number: 1, branch: "mito/1", url: "u", title: "pr without cycle", status: "open", proposedAt: "t" },
    ],
  };
  const s = computeStats(state, now, base);
  expect(s.cyclesRun).toBe(0);
});

test("lastChange is the title of the most-recently-merged PR", () => {
  const state: State = {
    ...emptyState(),
    pullRequests: [
      { number: 1, branch: "mito/1", url: "u", title: "older merge", status: "merged", proposedAt: "t", resolvedAt: "2026-06-02T00:00:00Z" },
      { number: 2, branch: "mito/2", url: "u", title: "newer merge", status: "merged", proposedAt: "t", resolvedAt: "2026-06-03T00:00:00Z" },
    ],
  };
  const s = computeStats(state, now, base);
  expect(s.lastChange).toBe("newer merge");
});

test("lastChange ignores closed PRs", () => {
  const state: State = {
    ...emptyState(),
    pullRequests: [
      { number: 1, branch: "mito/1", url: "u", title: "merged one", status: "merged", proposedAt: "t", resolvedAt: "2026-06-02T00:00:00Z" },
      { number: 2, branch: "mito/2", url: "u", title: "closed later", status: "closed", proposedAt: "t", resolvedAt: "2026-06-04T00:00:00Z" },
    ],
  };
  const s = computeStats(state, now, base);
  expect(s.lastChange).toBe("merged one");
});

test("cyclesRun reads buildSessions[], not legacy cycles[] CycleRecords", () => {
  // cycles[] is the old CycleRecord array (addCycle() appends to it).
  // buildSessions[] is the newer per-session tracker (startBuildSession() appends).
  // cyclesRun must reflect buildSessions only — cycles[] must not inflate the count.
  const state: State = {
    ...emptyState(),
    cycles: [
      { id: 1, timestamp: "t", action: "propose", branch: "mito/1", testsPassed: true, committed: true, posted: false },
      { id: 2, timestamp: "t", action: "propose", branch: "mito/2", testsPassed: true, committed: true, posted: true, postUrl: "u" },
      { id: 3, timestamp: "t", action: "propose", branch: "mito/3", testsPassed: false, committed: false, posted: false },
    ],
    buildSessions: [
      { id: "2026-06-05T01:00:00.000Z", startedAt: "2026-06-05T01:00:00.000Z", prsOpened: 1 },
    ],
  };
  const s = computeStats(state, now, base);
  // 3 CycleRecords must not show up — only the 1 BuildSession counts
  expect(s.cyclesRun).toBe(1);
});
