// src/status.test.ts — unit tests for the status dashboard formatting logic.
// Fixture data only — no GitHub API or disk I/O.
import { test, expect } from "bun:test";
import {
  formatStatus,
  buildLastMerged,
  buildNextBacklog,
  buildStatusData,
  fmtDate,
  type StatusData,
  type RepoPrSummary,
} from "./status";
import type { State } from "./state";
import type { BacklogTask } from "./backlog";

// ---------------------------------------------------------------------------
// Helpers / fixtures
// ---------------------------------------------------------------------------

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

const MERGED_PRS = [
  {
    number: 5,
    branch: "mito/5",
    url: "https://github.com/mitosisdev/mito/pull/5",
    title: "feat: add portfolio page",
    status: "merged" as const,
    proposedAt: "2026-01-01T00:00:00Z",
    resolvedAt: "2026-01-03T12:00:00Z",
  },
  {
    number: 3,
    branch: "mito/3",
    url: "https://github.com/mitosisdev/mito/pull/3",
    title: "fix: broken deploy",
    status: "merged" as const,
    proposedAt: "2025-12-20T00:00:00Z",
    resolvedAt: "2025-12-21T08:00:00Z",
  },
  {
    number: 1,
    branch: "mito/1",
    url: "https://github.com/mitosisdev/mito/pull/1",
    title: "chore: initial scaffold",
    status: "merged" as const,
    proposedAt: "2025-12-01T00:00:00Z",
    resolvedAt: "2025-12-02T00:00:00Z",
  },
  {
    number: 7,
    branch: "mito/7",
    url: "https://github.com/mitosisdev/mito/pull/7",
    title: "feat: status command",
    status: "open" as const,
    proposedAt: "2026-06-05T00:00:00Z",
  },
];

const BACKLOG_TASKS: BacklogTask[] = [
  { project: "mito", section: "Now", text: "Add status command", done: false },
  { project: "mito", section: "Now", text: "Write test suite", done: false },
  { project: "mito", section: "Later", text: "Publish to npm", done: false },
  { project: "mito", section: "Later", text: "~~Already shipped~~", done: true },
  { project: "", section: "Later", text: "Untagged backlog item", done: false },
];

const REPO_SUMMARIES: RepoPrSummary[] = [
  {
    repo: "mitosisdev/mito",
    openCount: 1,
    openPrs: [{ number: 7, title: "feat: status command", url: "https://github.com/mitosisdev/mito/pull/7" }],
  },
  {
    repo: "mitosisdev/gitstory",
    openCount: 0,
    openPrs: [],
  },
];

// ---------------------------------------------------------------------------
// fmtDate
// ---------------------------------------------------------------------------

test("fmtDate returns YYYY-MM-DD slice", () => {
  expect(fmtDate("2026-01-15T10:30:00Z")).toBe("2026-01-15");
  expect(fmtDate("2025-12-31T23:59:59.000Z")).toBe("2025-12-31");
});

// ---------------------------------------------------------------------------
// buildLastMerged
// ---------------------------------------------------------------------------

test("buildLastMerged returns only merged PRs sorted newest first", () => {
  const result = buildLastMerged(MERGED_PRS);
  // Should be 3 (limit) and all merged
  expect(result).toHaveLength(3);
  expect(result[0]!.number).toBe(5);  // resolvedAt 2026-01-03 — newest
  expect(result[1]!.number).toBe(3);
  expect(result[2]!.number).toBe(1);
});

test("buildLastMerged excludes open/closed PRs", () => {
  const result = buildLastMerged(MERGED_PRS);
  const numbers = result.map((r) => r.number);
  expect(numbers).not.toContain(7); // PR 7 is open
});

test("buildLastMerged respects custom limit", () => {
  const result = buildLastMerged(MERGED_PRS, 1);
  expect(result).toHaveLength(1);
  expect(result[0]!.number).toBe(5);
});

test("buildLastMerged returns empty array when no merged PRs", () => {
  const result = buildLastMerged([]);
  expect(result).toHaveLength(0);
});

test("buildLastMerged includes title and url", () => {
  const result = buildLastMerged(MERGED_PRS, 1);
  expect(result[0]!.title).toBe("feat: add portfolio page");
  expect(result[0]!.url).toContain("github.com");
  expect(result[0]!.mergedAt).toBe("2026-01-03T12:00:00Z");
});

// ---------------------------------------------------------------------------
// buildNextBacklog
// ---------------------------------------------------------------------------

test("buildNextBacklog returns only undone tasks", () => {
  const result = buildNextBacklog(BACKLOG_TASKS);
  expect(result.every((t) => !t.done)).toBe(true);
});

test("buildNextBacklog respects default limit of 3", () => {
  const result = buildNextBacklog(BACKLOG_TASKS);
  expect(result).toHaveLength(3);
});

test("buildNextBacklog respects custom limit", () => {
  const result = buildNextBacklog(BACKLOG_TASKS, 1);
  expect(result).toHaveLength(1);
  expect(result[0]!.text).toBe("Add status command");
});

test("buildNextBacklog returns empty array when all tasks done", () => {
  const allDone: BacklogTask[] = [
    { project: "mito", section: "Now", text: "done thing", done: true },
  ];
  expect(buildNextBacklog(allDone)).toHaveLength(0);
});

// ---------------------------------------------------------------------------
// buildStatusData
// ---------------------------------------------------------------------------

test("buildStatusData computes cycleCount from buildSessions", () => {
  const state: State = {
    ...emptyState(),
    buildSessions: [
      { id: "2026-01-01T00:00:00Z", startedAt: "2026-01-01T00:00:00Z", prsOpened: 0 },
      { id: "2026-01-02T00:00:00Z", startedAt: "2026-01-02T00:00:00Z", prsOpened: 1 },
    ],
  };
  const data = buildStatusData(state, [], []);
  expect(data.cycleCount).toBe(2);
});

test("buildStatusData passes through repoPrSummaries unchanged", () => {
  const data = buildStatusData(emptyState(), [], REPO_SUMMARIES);
  expect(data.repoPrSummaries).toBe(REPO_SUMMARIES);
});

test("buildStatusData returns max 3 backlog items", () => {
  const data = buildStatusData(emptyState(), BACKLOG_TASKS, []);
  expect(data.nextBacklog.length).toBeLessThanOrEqual(3);
});

// ---------------------------------------------------------------------------
// formatStatus — output shape
// ---------------------------------------------------------------------------

function makeData(overrides: Partial<StatusData> = {}): StatusData {
  return {
    repoPrSummaries: REPO_SUMMARIES,
    lastMerged: buildLastMerged(MERGED_PRS),
    cycleCount: 5,
    nextBacklog: buildNextBacklog(BACKLOG_TASKS),
    ...overrides,
  };
}

test("formatStatus includes header text", () => {
  const out = formatStatus(makeData());
  expect(out).toContain("mito");
  expect(out).toContain("status dashboard");
});

test("formatStatus includes Open PRs section", () => {
  const out = formatStatus(makeData());
  expect(out).toContain("Open PRs");
  expect(out).toContain("mitosisdev/mito");
  expect(out).toContain("feat: status command");
});

test("formatStatus shows repo with zero open PRs", () => {
  const out = formatStatus(makeData());
  expect(out).toContain("mitosisdev/gitstory");
  expect(out).toContain("0 open");
});

test("formatStatus includes Last 3 merged PRs section", () => {
  const out = formatStatus(makeData());
  expect(out).toContain("Last 3 merged PRs");
  expect(out).toContain("feat: add portfolio page");
  expect(out).toContain("2026-01-03");
});

test("formatStatus includes cycle count", () => {
  const out = formatStatus(makeData());
  expect(out).toContain("5");
  expect(out).toContain("Build cycles run");
});

test("formatStatus includes next backlog items", () => {
  const out = formatStatus(makeData());
  expect(out).toContain("Next backlog items");
  expect(out).toContain("Add status command");
  expect(out).toContain("Write test suite");
});

test("formatStatus does not include done backlog items", () => {
  const out = formatStatus(makeData());
  expect(out).not.toContain("Already shipped");
});

test("formatStatus shows placeholder when no repos configured", () => {
  const out = formatStatus(makeData({ repoPrSummaries: [] }));
  expect(out).toContain("no repos configured");
});

test("formatStatus shows placeholder when no merged PRs", () => {
  const out = formatStatus(makeData({ lastMerged: [] }));
  expect(out).toContain("none yet");
});

test("formatStatus shows placeholder when backlog is empty", () => {
  const out = formatStatus(makeData({ nextBacklog: [] }));
  expect(out).toContain("backlog is empty");
});

test("formatStatus shows project tag for tagged backlog items", () => {
  const out = formatStatus(makeData());
  expect(out).toContain("[mito]");
});

test("formatStatus zero cycles displays 0", () => {
  const out = formatStatus(makeData({ cycleCount: 0 }));
  expect(out).toContain("Build cycles run:  0");
});
