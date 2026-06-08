// src/portfolio-diff.test.ts — unit tests for the portfolio diff computation
// and Markdown rendering. All fixture data; no file I/O.
import { test, expect } from "bun:test";
import type { State } from "./state";
import {
  buildPortfolioDiff,
  resolveCutoff,
  formatPortfolioDiff,
  type PortfolioDiff,
} from "./portfolio-diff";

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
// resolveCutoff — picks the "since last reviewer pass" boundary
// ---------------------------------------------------------------------------

test("resolveCutoff uses explicit since override when provided", () => {
  const state: State = {
    ...emptyState(),
    buildSessions: [
      { id: "2026-01-05T00:00:00.000Z", startedAt: "2026-01-05T00:00:00.000Z", prsOpened: 0 },
    ],
  };
  expect(resolveCutoff(state, "2026-02-02T00:00:00.000Z")).toBe("2026-02-02T00:00:00.000Z");
});

test("resolveCutoff defaults to the most recent build session start", () => {
  const state: State = {
    ...emptyState(),
    buildSessions: [
      { id: "2026-01-01T00:00:00.000Z", startedAt: "2026-01-01T00:00:00.000Z", prsOpened: 0 },
      { id: "2026-01-09T00:00:00.000Z", startedAt: "2026-01-09T00:00:00.000Z", prsOpened: 0 },
    ],
  };
  expect(resolveCutoff(state)).toBe("2026-01-09T00:00:00.000Z");
});

test("resolveCutoff picks the latest session even if array is unordered", () => {
  const state: State = {
    ...emptyState(),
    buildSessions: [
      { id: "2026-01-09T00:00:00.000Z", startedAt: "2026-01-09T00:00:00.000Z", prsOpened: 0 },
      { id: "2026-01-01T00:00:00.000Z", startedAt: "2026-01-01T00:00:00.000Z", prsOpened: 0 },
    ],
  };
  expect(resolveCutoff(state)).toBe("2026-01-09T00:00:00.000Z");
});

test("resolveCutoff returns null when no sessions and no override", () => {
  expect(resolveCutoff(emptyState())).toBeNull();
});

// ---------------------------------------------------------------------------
// buildPortfolioDiff — computation
// ---------------------------------------------------------------------------

function sampleState(): State {
  return {
    ...emptyState(),
    buildSessions: [
      { id: "2026-01-01T00:00:00.000Z", startedAt: "2026-01-01T00:00:00.000Z", prsOpened: 0 },
      { id: "2026-02-01T00:00:00.000Z", startedAt: "2026-02-01T00:00:00.000Z", prsOpened: 0 },
    ],
    pullRequests: [
      // Before cutoff — should be ignored.
      {
        number: 1,
        branch: "mito/old",
        url: "https://github.com/mitosisdev/mito/pull/1",
        title: "feat: old merged",
        status: "merged",
        proposedAt: "2026-01-01T01:00:00.000Z",
        resolvedAt: "2026-01-02T00:00:00.000Z",
      },
      // After cutoff — merged into mito.
      {
        number: 2,
        branch: "mito/new",
        url: "https://github.com/mitosisdev/mito/pull/2",
        title: "feat: new merged",
        status: "merged",
        proposedAt: "2026-02-01T01:00:00.000Z",
        resolvedAt: "2026-02-02T00:00:00.000Z",
      },
      // After cutoff — merged into another repo.
      {
        number: 7,
        branch: "feat/x",
        url: "https://github.com/mitosisdev/other/pull/7",
        title: "feat: other merged",
        status: "merged",
        proposedAt: "2026-02-01T03:00:00.000Z",
        resolvedAt: "2026-02-03T00:00:00.000Z",
      },
      // After cutoff — closed (not merged).
      {
        number: 3,
        branch: "mito/closed",
        url: "https://github.com/mitosisdev/mito/pull/3",
        title: "feat: closed",
        status: "closed",
        proposedAt: "2026-02-01T02:00:00.000Z",
        resolvedAt: "2026-02-02T06:00:00.000Z",
      },
      // Open, proposed after cutoff.
      {
        number: 4,
        branch: "mito/open-new",
        url: "https://github.com/mitosisdev/mito/pull/4",
        title: "feat: open new",
        status: "open",
        proposedAt: "2026-02-01T05:00:00.000Z",
      },
      // Open, proposed before cutoff (still open now).
      {
        number: 5,
        branch: "mito/open-old",
        url: "https://github.com/mitosisdev/mito/pull/5",
        title: "feat: open old",
        status: "open",
        proposedAt: "2026-01-15T00:00:00.000Z",
      },
    ],
  };
}

test("buildPortfolioDiff reports the resolved cutoff", () => {
  const diff = buildPortfolioDiff(sampleState());
  expect(diff.cutoff).toBe("2026-02-01T00:00:00.000Z");
});

test("buildPortfolioDiff lists only PRs merged at/after the cutoff", () => {
  const diff = buildPortfolioDiff(sampleState());
  const numbers = diff.merged.map((m) => m.number).sort((a, b) => a - b);
  expect(numbers).toEqual([2, 7]);
});

test("merged entries carry title, repo and merge time", () => {
  const diff = buildPortfolioDiff(sampleState());
  const m2 = diff.merged.find((m) => m.number === 2)!;
  expect(m2.title).toBe("feat: new merged");
  expect(m2.repo).toBe("mitosisdev/mito");
  expect(m2.mergedAt).toBe("2026-02-02T00:00:00.000Z");
});

test("merged entries are grouped by repo", () => {
  const diff = buildPortfolioDiff(sampleState());
  const repos = diff.repos.map((r) => r.repo).sort();
  expect(repos).toContain("mitosisdev/mito");
  expect(repos).toContain("mitosisdev/other");
  const mito = diff.repos.find((r) => r.repo === "mitosisdev/mito")!;
  expect(mito.mergedCount).toBe(1);
});

test("open PR delta nets new-open minus newly-resolved-from-open", () => {
  // After cutoff: 1 new open PR (#4) opened, and 0 previously-open PRs newly
  // resolved in this window means net delta should reflect newly opened minus
  // resolved-that-were-open-before. We model delta = newlyOpened - resolvedInWindow.
  const diff = buildPortfolioDiff(sampleState());
  // newlyOpened = #4 (proposed after cutoff, still open) = 1
  // resolvedInWindow = #2 merged, #7 merged, #3 closed = 3
  expect(diff.openDelta.newlyOpened).toBe(1);
  expect(diff.openDelta.resolvedInWindow).toBe(3);
  expect(diff.openDelta.net).toBe(1 - 3);
});

test("currentOpen counts all PRs currently open regardless of cutoff", () => {
  const diff = buildPortfolioDiff(sampleState());
  // #4 and #5 are open.
  expect(diff.openDelta.currentOpen).toBe(2);
});

test("explicit since override changes the window", () => {
  // Cut everything off after the second merge — only #7 remains.
  const diff = buildPortfolioDiff(sampleState(), "2026-02-02T12:00:00.000Z");
  const numbers = diff.merged.map((m) => m.number);
  expect(numbers).toEqual([7]);
});

test("empty state yields an empty diff with null cutoff", () => {
  const diff = buildPortfolioDiff(emptyState());
  expect(diff.cutoff).toBeNull();
  expect(diff.merged).toHaveLength(0);
  expect(diff.repos).toHaveLength(0);
  expect(diff.openDelta.net).toBe(0);
});

test("when cutoff is null, everything merged counts (full history)", () => {
  const state: State = {
    ...emptyState(),
    pullRequests: [
      {
        number: 1,
        branch: "mito/a",
        url: "https://github.com/mitosisdev/mito/pull/1",
        title: "feat: A",
        status: "merged",
        proposedAt: "2026-01-01T00:00:00.000Z",
        resolvedAt: "2026-01-02T00:00:00.000Z",
      },
    ],
  };
  const diff = buildPortfolioDiff(state);
  expect(diff.cutoff).toBeNull();
  expect(diff.merged).toHaveLength(1);
});

// ---------------------------------------------------------------------------
// formatPortfolioDiff — Markdown rendering
// ---------------------------------------------------------------------------

function diffOf(state: State, since?: string): PortfolioDiff {
  return buildPortfolioDiff(state, since);
}

test("formatPortfolioDiff renders a top-level heading", () => {
  const md = formatPortfolioDiff(diffOf(sampleState()));
  expect(md).toContain("# Portfolio Diff");
});

test("formatPortfolioDiff shows the cutoff timestamp", () => {
  const md = formatPortfolioDiff(diffOf(sampleState()));
  expect(md).toContain("2026-02-01");
});

test("formatPortfolioDiff lists merged PR titles", () => {
  const md = formatPortfolioDiff(diffOf(sampleState()));
  expect(md).toContain("feat: new merged");
  expect(md).toContain("feat: other merged");
});

test("formatPortfolioDiff groups by repo heading", () => {
  const md = formatPortfolioDiff(diffOf(sampleState()));
  expect(md).toContain("mitosisdev/mito");
  expect(md).toContain("mitosisdev/other");
});

test("formatPortfolioDiff includes an open PR delta line", () => {
  const md = formatPortfolioDiff(diffOf(sampleState()));
  expect(md).toMatch(/Open PR delta/i);
});

test("formatPortfolioDiff signs a negative delta", () => {
  const md = formatPortfolioDiff(diffOf(sampleState()));
  // net is -2 in the sample.
  expect(md).toContain("-2");
});

test("formatPortfolioDiff handles empty state gracefully", () => {
  const md = formatPortfolioDiff(diffOf(emptyState()));
  expect(md).toContain("# Portfolio Diff");
  expect(md).toMatch(/No (changes|merged|build sessions)/i);
});

test("formatPortfolioDiff ends with a newline", () => {
  const md = formatPortfolioDiff(diffOf(sampleState()));
  expect(md.endsWith("\n")).toBe(true);
});

test("formatPortfolioDiff links PR numbers to their URLs", () => {
  const md = formatPortfolioDiff(diffOf(sampleState()));
  expect(md).toContain("https://github.com/mitosisdev/mito/pull/2");
});
