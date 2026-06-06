// src/cycle-report.test.ts — unit tests for cycle-report computation and formatting.
// All fixture data; no file I/O.
import { test, expect } from "bun:test";
import type { State } from "./state";
import { buildCycleReport, formatCycleReport, formatCycleReportJson } from "./cycle-report";

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
// buildCycleReport — computation
// ---------------------------------------------------------------------------

test("empty state returns zero totals and no sessions", () => {
  const data = buildCycleReport(emptyState());
  expect(data.totalSessions).toBe(0);
  expect(data.totalPrsMerged).toBe(0);
  expect(data.totalPrsClosed).toBe(0);
  expect(data.totalPrsOpened).toBe(0);
  expect(data.successRate).toBeNull();
  expect(data.sessions).toHaveLength(0);
});

test("session count matches buildSessions length", () => {
  const state: State = {
    ...emptyState(),
    buildSessions: [
      { id: "2026-01-01T00:00:00.000Z", startedAt: "2026-01-01T00:00:00.000Z", prsOpened: 0 },
      { id: "2026-01-02T00:00:00.000Z", startedAt: "2026-01-02T00:00:00.000Z", prsOpened: 0 },
    ],
  };
  expect(buildCycleReport(state).totalSessions).toBe(2);
});

test("merged PRs are counted per session", () => {
  const state: State = {
    ...emptyState(),
    buildSessions: [
      { id: "2026-01-01T00:00:00.000Z", startedAt: "2026-01-01T00:00:00.000Z", prsOpened: 1 },
      { id: "2026-01-03T00:00:00.000Z", startedAt: "2026-01-03T00:00:00.000Z", prsOpened: 1 },
    ],
    pullRequests: [
      {
        number: 1,
        branch: "mito/a",
        url: "u1",
        title: "feat: A",
        status: "merged",
        proposedAt: "2026-01-01T01:00:00.000Z",
        resolvedAt: "2026-01-01T12:00:00.000Z",
      },
      {
        number: 2,
        branch: "mito/b",
        url: "u2",
        title: "feat: B",
        status: "merged",
        proposedAt: "2026-01-03T01:00:00.000Z",
        resolvedAt: "2026-01-03T12:00:00.000Z",
      },
    ],
  };
  const data = buildCycleReport(state);
  expect(data.sessions[0].prsMerged).toBe(1);
  expect(data.sessions[1].prsMerged).toBe(1);
  expect(data.totalPrsMerged).toBe(2);
});

test("closed PRs are counted per session", () => {
  const state: State = {
    ...emptyState(),
    buildSessions: [
      { id: "2026-01-01T00:00:00.000Z", startedAt: "2026-01-01T00:00:00.000Z", prsOpened: 1 },
    ],
    pullRequests: [
      {
        number: 1,
        branch: "mito/c",
        url: "u",
        title: "feat: C",
        status: "closed",
        proposedAt: "2026-01-01T01:00:00.000Z",
        resolvedAt: "2026-01-01T10:00:00.000Z",
      },
    ],
  };
  const data = buildCycleReport(state);
  expect(data.sessions[0].prsClosed).toBe(1);
  expect(data.totalPrsClosed).toBe(1);
});

test("open PRs do not count as merged or closed", () => {
  const state: State = {
    ...emptyState(),
    buildSessions: [
      { id: "2026-01-01T00:00:00.000Z", startedAt: "2026-01-01T00:00:00.000Z", prsOpened: 1 },
    ],
    pullRequests: [
      {
        number: 1,
        branch: "mito/d",
        url: "u",
        title: "feat: D",
        status: "open",
        proposedAt: "2026-01-01T01:00:00.000Z",
      },
    ],
  };
  const data = buildCycleReport(state);
  expect(data.sessions[0].prsMerged).toBe(0);
  expect(data.sessions[0].prsClosed).toBe(0);
  expect(data.totalPrsOpened).toBe(1);
});

test("success rate is 100% when all resolved PRs are merged", () => {
  const state: State = {
    ...emptyState(),
    buildSessions: [
      { id: "2026-01-01T00:00:00.000Z", startedAt: "2026-01-01T00:00:00.000Z", prsOpened: 2 },
    ],
    pullRequests: [
      { number: 1, branch: "mito/e", url: "u", title: "feat: E", status: "merged", proposedAt: "2026-01-01T01:00:00.000Z", resolvedAt: "2026-01-01T10:00:00.000Z" },
      { number: 2, branch: "mito/f", url: "u", title: "feat: F", status: "merged", proposedAt: "2026-01-01T02:00:00.000Z", resolvedAt: "2026-01-01T11:00:00.000Z" },
    ],
  };
  expect(buildCycleReport(state).successRate).toBe(100);
});

test("success rate is 0% when all resolved PRs are closed", () => {
  const state: State = {
    ...emptyState(),
    buildSessions: [
      { id: "2026-01-01T00:00:00.000Z", startedAt: "2026-01-01T00:00:00.000Z", prsOpened: 1 },
    ],
    pullRequests: [
      { number: 1, branch: "mito/g", url: "u", title: "feat: G", status: "closed", proposedAt: "2026-01-01T01:00:00.000Z", resolvedAt: "2026-01-01T10:00:00.000Z" },
    ],
  };
  expect(buildCycleReport(state).successRate).toBe(0);
});

test("success rate rounds to nearest integer (50%)", () => {
  const state: State = {
    ...emptyState(),
    buildSessions: [
      { id: "2026-01-01T00:00:00.000Z", startedAt: "2026-01-01T00:00:00.000Z", prsOpened: 2 },
    ],
    pullRequests: [
      { number: 1, branch: "mito/h1", url: "u", title: "feat: H1", status: "merged", proposedAt: "2026-01-01T01:00:00.000Z", resolvedAt: "2026-01-01T10:00:00.000Z" },
      { number: 2, branch: "mito/h2", url: "u", title: "feat: H2", status: "closed", proposedAt: "2026-01-01T02:00:00.000Z", resolvedAt: "2026-01-01T11:00:00.000Z" },
    ],
  };
  expect(buildCycleReport(state).successRate).toBe(50);
});

test("success rate is null when no resolved PRs", () => {
  const state: State = {
    ...emptyState(),
    buildSessions: [
      { id: "2026-01-01T00:00:00.000Z", startedAt: "2026-01-01T00:00:00.000Z", prsOpened: 0 },
    ],
  };
  expect(buildCycleReport(state).successRate).toBeNull();
});

test("rejected ideas are assigned to the correct session", () => {
  const state: State = {
    ...emptyState(),
    buildSessions: [
      { id: "2026-01-01T00:00:00.000Z", startedAt: "2026-01-01T00:00:00.000Z", prsOpened: 0 },
      { id: "2026-01-05T00:00:00.000Z", startedAt: "2026-01-05T00:00:00.000Z", prsOpened: 0 },
    ],
    rejectedIdeas: [
      { title: "feat: early idea", reason: "out of scope", closedAt: "2026-01-02T00:00:00.000Z" },
      { title: "feat: late idea", reason: "too complex", closedAt: "2026-01-06T00:00:00.000Z" },
    ],
  };
  const data = buildCycleReport(state);
  expect(data.sessions[0].rejectedIdeas).toContain("feat: early idea");
  expect(data.sessions[1].rejectedIdeas).toContain("feat: late idea");
});

test("no sessions — PRs without sessions produce aggregate-only output", () => {
  const state: State = {
    ...emptyState(),
    pullRequests: [
      { number: 1, branch: "mito/x", url: "u", title: "feat: X", status: "merged", proposedAt: "2026-01-01T00:00:00.000Z" },
      { number: 2, branch: "mito/y", url: "u", title: "feat: Y", status: "closed", proposedAt: "2026-01-01T00:00:00.000Z" },
    ],
  };
  const data = buildCycleReport(state);
  expect(data.totalSessions).toBe(0);
  expect(data.totalPrsMerged).toBe(1);
  expect(data.totalPrsClosed).toBe(1);
  expect(data.successRate).toBe(50);
});

test("totalPrsOpened reflects all PRs regardless of status", () => {
  const state: State = {
    ...emptyState(),
    buildSessions: [
      { id: "2026-01-01T00:00:00.000Z", startedAt: "2026-01-01T00:00:00.000Z", prsOpened: 3 },
    ],
    pullRequests: [
      { number: 1, branch: "mito/1", url: "u", title: "feat: 1", status: "merged", proposedAt: "2026-01-01T01:00:00.000Z", resolvedAt: "2026-01-01T02:00:00.000Z" },
      { number: 2, branch: "mito/2", url: "u", title: "feat: 2", status: "closed", proposedAt: "2026-01-01T01:00:00.000Z", resolvedAt: "2026-01-01T02:00:00.000Z" },
      { number: 3, branch: "mito/3", url: "u", title: "feat: 3", status: "open", proposedAt: "2026-01-01T01:00:00.000Z" },
    ],
  };
  expect(buildCycleReport(state).totalPrsOpened).toBe(3);
});

// ---------------------------------------------------------------------------
// formatCycleReport — output formatting
// ---------------------------------------------------------------------------

test("formatCycleReport includes session date", () => {
  const state: State = {
    ...emptyState(),
    buildSessions: [
      { id: "2026-06-05T01:00:00.000Z", startedAt: "2026-06-05T01:00:00.000Z", prsOpened: 0 },
    ],
  };
  const output = formatCycleReport(buildCycleReport(state));
  expect(output).toContain("2026-06-05");
});

test("formatCycleReport shows totals section", () => {
  const data = buildCycleReport(emptyState());
  const output = formatCycleReport(data);
  expect(output).toContain("Totals");
  expect(output).toContain("Sessions");
});

test("formatCycleReport shows n/a success rate when no resolved PRs", () => {
  const state: State = {
    ...emptyState(),
    buildSessions: [
      { id: "2026-01-01T00:00:00.000Z", startedAt: "2026-01-01T00:00:00.000Z", prsOpened: 0 },
    ],
  };
  const output = formatCycleReport(buildCycleReport(state));
  expect(output).toContain("n/a");
});

test("formatCycleReport shows success rate percentage", () => {
  const state: State = {
    ...emptyState(),
    buildSessions: [
      { id: "2026-01-01T00:00:00.000Z", startedAt: "2026-01-01T00:00:00.000Z", prsOpened: 1 },
    ],
    pullRequests: [
      { number: 1, branch: "mito/a", url: "u", title: "feat: A", status: "merged", proposedAt: "2026-01-01T01:00:00.000Z", resolvedAt: "2026-01-01T10:00:00.000Z" },
    ],
  };
  const output = formatCycleReport(buildCycleReport(state));
  expect(output).toContain("100%");
});

test("formatCycleReport lists rejected ideas under session", () => {
  const state: State = {
    ...emptyState(),
    buildSessions: [
      { id: "2026-01-01T00:00:00.000Z", startedAt: "2026-01-01T00:00:00.000Z", prsOpened: 0 },
    ],
    rejectedIdeas: [
      { title: "feat: bad idea", reason: "reviewer rejected", closedAt: "2026-01-01T12:00:00.000Z" },
    ],
  };
  const output = formatCycleReport(buildCycleReport(state));
  expect(output).toContain("feat: bad idea");
});

test("formatCycleReport empty state message", () => {
  const output = formatCycleReport(buildCycleReport(emptyState()));
  expect(output).toContain("No build sessions recorded yet");
});

// ---------------------------------------------------------------------------
// formatCycleReportJson — machine-readable output
// ---------------------------------------------------------------------------

test("formatCycleReportJson returns valid JSON", () => {
  const data = buildCycleReport(emptyState());
  const raw = formatCycleReportJson(data);
  const parsed = JSON.parse(raw);
  expect(parsed).toHaveProperty("totalSessions");
  expect(parsed).toHaveProperty("sessions");
  expect(parsed).toHaveProperty("totalPrsMerged");
  expect(parsed).toHaveProperty("totalPrsClosed");
  expect(parsed).toHaveProperty("totalPrsOpened");
  expect(parsed).toHaveProperty("successRate");
});

test("formatCycleReportJson preserves all session rows", () => {
  const state: State = {
    ...emptyState(),
    buildSessions: [
      { id: "2026-01-01T00:00:00.000Z", startedAt: "2026-01-01T00:00:00.000Z", prsOpened: 1 },
      { id: "2026-01-02T00:00:00.000Z", startedAt: "2026-01-02T00:00:00.000Z", prsOpened: 0 },
    ],
    pullRequests: [
      { number: 1, branch: "mito/a", url: "u", title: "feat: A", status: "merged", proposedAt: "2026-01-01T01:00:00.000Z", resolvedAt: "2026-01-01T10:00:00.000Z" },
    ],
  };
  const data = buildCycleReport(state);
  const parsed = JSON.parse(formatCycleReportJson(data));
  expect(parsed.sessions).toHaveLength(2);
  expect(parsed.totalPrsMerged).toBe(1);
  expect(parsed.totalSessions).toBe(2);
});

test("formatCycleReportJson ends with newline", () => {
  const raw = formatCycleReportJson(buildCycleReport(emptyState()));
  expect(raw.endsWith("\n")).toBe(true);
});
