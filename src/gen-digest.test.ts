// src/gen-digest.test.ts — unit tests for the weekly Markdown digest generator.
// All fixture data; no file I/O.
import { test, expect } from "bun:test";
import type { State, PullRequestRecord } from "./state";
import type { BacklogTask } from "./backlog";
import { generateDigest } from "./gen-digest";

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

// Fixed reference "now" so date filtering is deterministic.
const NOW = new Date("2026-06-09T12:00:00.000Z");

function pr(p: Partial<PullRequestRecord> & { number: number }): PullRequestRecord {
  return {
    branch: `mito/${p.number}`,
    url: `https://github.com/mitosisdev/mito/pull/${p.number}`,
    title: `PR ${p.number}`,
    status: "open",
    proposedAt: "2026-06-05T00:00:00.000Z",
    ...p,
  };
}

function backlogItem(text: string, project = ""): BacklogTask {
  return { project, section: "Tier 1", text, done: false };
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

test("empty state produces all sections with no-activity placeholders", () => {
  const md = generateDigest(emptyState(), { now: NOW, backlog: [] });

  // Heading with the week-of date.
  expect(md).toContain("# Mito Weekly Digest — week of ");

  // All five required sections present.
  expect(md).toContain("## PRs Merged This Week");
  expect(md).toContain("## PRs Closed Without Merge");
  expect(md).toContain("## Features Shipped");
  expect(md).toContain("## What Failed");
  expect(md).toContain("## What's Next");

  // Sensible no-activity messaging.
  expect(md.toLowerCase()).toContain("no prs merged");
});

// ---------------------------------------------------------------------------
// Merged PRs
// ---------------------------------------------------------------------------

test("merged PR within the week appears in the Merged section", () => {
  const state: State = {
    ...emptyState(),
    pullRequests: [
      pr({
        number: 12,
        title: "feat: some feature",
        status: "merged",
        resolvedAt: "2026-06-08T00:00:00.000Z",
      }),
    ],
  };
  const md = generateDigest(state, { now: NOW, backlog: [] });

  const mergedSection = md.split("## PRs Merged This Week")[1]!.split("##")[0]!;
  expect(mergedSection).toContain("feat: some feature");
  expect(mergedSection).toContain("#12");
});

test("merged PR title appears in Features Shipped", () => {
  const state: State = {
    ...emptyState(),
    pullRequests: [
      pr({ number: 12, title: "feat: shiny thing", status: "merged", resolvedAt: "2026-06-08T00:00:00.000Z" }),
    ],
  };
  const md = generateDigest(state, { now: NOW, backlog: [] });

  const shipped = md.split("## Features Shipped")[1]!.split("##")[0]!;
  expect(shipped).toContain("feat: shiny thing");
});

// ---------------------------------------------------------------------------
// Closed PRs
// ---------------------------------------------------------------------------

test("closed PR within the week appears in Closed Without Merge with reason", () => {
  const state: State = {
    ...emptyState(),
    pullRequests: [
      pr({
        number: 11,
        title: "feat: failed thing",
        status: "closed",
        resolvedAt: "2026-06-07T00:00:00.000Z",
        closeReason: "duplicate",
      }),
    ],
  };
  const md = generateDigest(state, { now: NOW, backlog: [] });

  const closedSection = md.split("## PRs Closed Without Merge")[1]!.split("##")[0]!;
  expect(closedSection).toContain("feat: failed thing");
  expect(closedSection).toContain("#11");
  expect(closedSection).toContain("duplicate");

  // And it shows up in What Failed too.
  const failed = md.split("## What Failed")[1]!.split("##")[0]!;
  expect(failed).toContain("feat: failed thing");
  expect(failed).toContain("duplicate");
});

test("closed PR without a closeReason still renders with a fallback reason", () => {
  const state: State = {
    ...emptyState(),
    pullRequests: [
      pr({ number: 11, title: "feat: no reason", status: "closed", resolvedAt: "2026-06-07T00:00:00.000Z" }),
    ],
  };
  const md = generateDigest(state, { now: NOW, backlog: [] });
  const closedSection = md.split("## PRs Closed Without Merge")[1]!.split("##")[0]!;
  expect(closedSection).toContain("feat: no reason");
  // Some non-empty reason text (fallback) must be present.
  expect(closedSection.toLowerCase()).toMatch(/reason:/);
});

// ---------------------------------------------------------------------------
// Date filtering
// ---------------------------------------------------------------------------

test("PRs resolved before the week window are excluded", () => {
  const state: State = {
    ...emptyState(),
    pullRequests: [
      // 20 days ago — outside the 7-day window.
      pr({ number: 1, title: "feat: old merge", status: "merged", resolvedAt: "2026-05-20T00:00:00.000Z" }),
      // inside window
      pr({ number: 2, title: "feat: new merge", status: "merged", resolvedAt: "2026-06-08T00:00:00.000Z" }),
    ],
  };
  const md = generateDigest(state, { now: NOW, backlog: [] });

  expect(md).toContain("feat: new merge");
  expect(md).not.toContain("feat: old merge");
});

test("open PRs are never listed as merged or closed", () => {
  const state: State = {
    ...emptyState(),
    pullRequests: [
      pr({ number: 5, title: "feat: still open", status: "open" }),
    ],
  };
  const md = generateDigest(state, { now: NOW, backlog: [] });
  expect(md).not.toContain("feat: still open");
});

test("merged PR without resolvedAt is excluded from the week window", () => {
  const state: State = {
    ...emptyState(),
    pullRequests: [
      pr({ number: 9, title: "feat: undated merge", status: "merged" }),
    ],
  };
  // Strip resolvedAt explicitly.
  state.pullRequests[0]!.resolvedAt = undefined;
  const md = generateDigest(state, { now: NOW, backlog: [] });
  expect(md).not.toContain("feat: undated merge");
});

// ---------------------------------------------------------------------------
// What's Next (backlog)
// ---------------------------------------------------------------------------

test("What's Next shows the first 5 not-done backlog items", () => {
  const backlog: BacklogTask[] = [
    backlogItem("ship thing A", "mito"),
    backlogItem("ship thing B", "gitstory"),
    backlogItem("ship thing C"),
    backlogItem("ship thing D"),
    backlogItem("ship thing E"),
    backlogItem("ship thing F"),
  ];
  const md = generateDigest(emptyState(), { now: NOW, backlog });
  const next = md.split("## What's Next")[1]!;

  expect(next).toContain("ship thing A");
  expect(next).toContain("ship thing E");
  // Sixth item must be excluded.
  expect(next).not.toContain("ship thing F");
});

test("What's Next skips already-done backlog items", () => {
  const backlog: BacklogTask[] = [
    { project: "", section: "Tier 1", text: "already shipped", done: true },
    backlogItem("still pending"),
  ];
  const md = generateDigest(emptyState(), { now: NOW, backlog });
  const next = md.split("## What's Next")[1]!;
  expect(next).toContain("still pending");
  expect(next).not.toContain("already shipped");
});

// ---------------------------------------------------------------------------
// Full integration
// ---------------------------------------------------------------------------

test("full digest renders every section with mixed activity", () => {
  const state: State = {
    ...emptyState(),
    pullRequests: [
      pr({ number: 12, title: "feat: some feature", status: "merged", resolvedAt: "2026-06-08T00:00:00.000Z" }),
      pr({ number: 13, title: "fix: a bug", status: "merged", resolvedAt: "2026-06-06T00:00:00.000Z" }),
      pr({ number: 11, title: "feat: failed thing", status: "closed", resolvedAt: "2026-06-07T00:00:00.000Z", closeReason: "duplicate" }),
      pr({ number: 99, title: "feat: ancient", status: "merged", resolvedAt: "2026-04-01T00:00:00.000Z" }),
    ],
  };
  const backlog: BacklogTask[] = [backlogItem("next big thing", "mito")];

  const md = generateDigest(state, { now: NOW, backlog });

  // Valid markdown heading first line.
  expect(md.startsWith("# Mito Weekly Digest — week of ")).toBe(true);

  // Merged section: both in-window merges, not the ancient one.
  const merged = md.split("## PRs Merged This Week")[1]!.split("##")[0]!;
  expect(merged).toContain("feat: some feature");
  expect(merged).toContain("fix: a bug");
  expect(merged).not.toContain("feat: ancient");

  // Closed section.
  const closed = md.split("## PRs Closed Without Merge")[1]!.split("##")[0]!;
  expect(closed).toContain("feat: failed thing");
  expect(closed).toContain("duplicate");

  // What's Next.
  expect(md).toContain("next big thing");

  // Sections appear in the documented order.
  const iMerged = md.indexOf("## PRs Merged This Week");
  const iClosed = md.indexOf("## PRs Closed Without Merge");
  const iShipped = md.indexOf("## Features Shipped");
  const iFailed = md.indexOf("## What Failed");
  const iNext = md.indexOf("## What's Next");
  expect(iMerged).toBeLessThan(iClosed);
  expect(iClosed).toBeLessThan(iShipped);
  expect(iShipped).toBeLessThan(iFailed);
  expect(iFailed).toBeLessThan(iNext);
});
