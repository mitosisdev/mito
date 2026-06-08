// src/portfolio-diff.test.ts — unit tests for portfolio-diff.
// All fixture data. No I/O, no network. Uses injectable deps throughout.
import { test, expect } from "bun:test";
import type { State } from "./state";
import type { Registry } from "./registry";
import {
  lastReviewerTimestamp,
  relativeTime,
  formatPortfolioDiff,
  buildPortfolioDiff,
  type PortfolioDiffData,
  type RepoDiff,
  type RepoDiffFetcher,
} from "./portfolio-diff";

// ---------------------------------------------------------------------------
// Helpers
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

function emptyRegistry(): Registry {
  return { projects: [] };
}

// Fixed "now" for deterministic relative-time assertions.
const NOW = new Date("2026-06-08T12:00:00.000Z");

// ---------------------------------------------------------------------------
// lastReviewerTimestamp
// ---------------------------------------------------------------------------

test("lastReviewerTimestamp returns epoch when no sessions", () => {
  const ts = lastReviewerTimestamp(emptyState());
  expect(ts).toBe("1970-01-01T00:00:00.000Z");
});

test("lastReviewerTimestamp returns last session startedAt", () => {
  const state: State = {
    ...emptyState(),
    buildSessions: [
      { id: "2026-06-01T00:00:00.000Z", startedAt: "2026-06-01T00:00:00.000Z", prsOpened: 0 },
      { id: "2026-06-05T10:00:00.000Z", startedAt: "2026-06-05T10:00:00.000Z", prsOpened: 2 },
    ],
  };
  expect(lastReviewerTimestamp(state)).toBe("2026-06-05T10:00:00.000Z");
});

test("lastReviewerTimestamp returns single session when only one exists", () => {
  const state: State = {
    ...emptyState(),
    buildSessions: [
      { id: "2026-05-20T08:00:00.000Z", startedAt: "2026-05-20T08:00:00.000Z", prsOpened: 1 },
    ],
  };
  expect(lastReviewerTimestamp(state)).toBe("2026-05-20T08:00:00.000Z");
});

// ---------------------------------------------------------------------------
// relativeTime
// ---------------------------------------------------------------------------

test("relativeTime shows minutes for <1h difference", () => {
  const iso = new Date(NOW.getTime() - 30 * 60_000).toISOString(); // 30min ago
  expect(relativeTime(iso, NOW)).toBe("30m ago");
});

test("relativeTime shows hours for 1-23h difference", () => {
  const iso = new Date(NOW.getTime() - 3 * 60 * 60_000).toISOString(); // 3h ago
  expect(relativeTime(iso, NOW)).toBe("3h ago");
});

test("relativeTime shows days for >=24h difference", () => {
  const iso = new Date(NOW.getTime() - 2 * 24 * 60 * 60_000).toISOString(); // 2d ago
  expect(relativeTime(iso, NOW)).toBe("2d ago");
});

test("relativeTime shows 0m ago for same timestamp", () => {
  expect(relativeTime(NOW.toISOString(), NOW)).toBe("0m ago");
});

// ---------------------------------------------------------------------------
// formatPortfolioDiff — Markdown output shape
// ---------------------------------------------------------------------------

const SAMPLE_DIFF: PortfolioDiffData = {
  sinceDate: "2026-06-05",
  sinceIso: "2026-06-05T10:00:00.000Z",
  repos: [
    {
      repo: "mitosisdev/changeloom",
      mergedPrs: [
        {
          number: 38,
          title: "feat: breaking changes hoisting",
          mergedAt: "2026-06-08T10:00:00.000Z",
          url: "https://github.com/mitosisdev/changeloom/pull/38",
        },
      ],
      openCount: 0,
      latestCommit: {
        sha: "abc1234",
        message: "feat: --types flag",
        date: "2026-06-08",
      },
    },
    {
      repo: "mitosisdev/gitstory",
      mergedPrs: [],
      openCount: 2,
      latestCommit: {
        sha: "def5678",
        message: "fix: timeline padding",
        date: "2026-06-07",
      },
    },
  ],
};

test("formatPortfolioDiff includes header with since date", () => {
  const out = formatPortfolioDiff(SAMPLE_DIFF, NOW);
  expect(out).toContain("# Portfolio Diff — since 2026-06-05");
});

test("formatPortfolioDiff includes a section per repo", () => {
  const out = formatPortfolioDiff(SAMPLE_DIFF, NOW);
  expect(out).toContain("## mitosisdev/changeloom");
  expect(out).toContain("## mitosisdev/gitstory");
});

test("formatPortfolioDiff shows merged PRs with number and title", () => {
  const out = formatPortfolioDiff(SAMPLE_DIFF, NOW);
  expect(out).toContain("#38 feat: breaking changes hoisting");
});

test("formatPortfolioDiff shows relative time for merged PRs", () => {
  const out = formatPortfolioDiff(SAMPLE_DIFF, NOW);
  // PR merged at 2026-06-08T10:00:00Z, NOW is 12:00:00Z — 2h ago
  expect(out).toContain("2h ago");
});

test("formatPortfolioDiff shows 'none' when no merged PRs", () => {
  const out = formatPortfolioDiff(SAMPLE_DIFF, NOW);
  expect(out).toContain("✅ Merged: none");
});

test("formatPortfolioDiff shows open PR count", () => {
  const out = formatPortfolioDiff(SAMPLE_DIFF, NOW);
  expect(out).toContain("📬 Open: 0 PRs");
  expect(out).toContain("📬 Open: 2 PRs");
});

test("formatPortfolioDiff singular PR label when count is 1", () => {
  const diff: PortfolioDiffData = {
    sinceDate: "2026-06-05",
    sinceIso: "2026-06-05T10:00:00.000Z",
    repos: [
      {
        repo: "mitosisdev/test",
        mergedPrs: [],
        openCount: 1,
        latestCommit: null,
      },
    ],
  };
  const out = formatPortfolioDiff(diff, NOW);
  expect(out).toContain("📬 Open: 1 PR");
  expect(out).not.toContain("📬 Open: 1 PRs");
});

test("formatPortfolioDiff shows latest commit sha and message", () => {
  const out = formatPortfolioDiff(SAMPLE_DIFF, NOW);
  expect(out).toContain("abc1234 feat: --types flag (2026-06-08)");
  expect(out).toContain("def5678 fix: timeline padding (2026-06-07)");
});

test("formatPortfolioDiff shows not available when latestCommit is null", () => {
  const diff: PortfolioDiffData = {
    sinceDate: "2026-06-05",
    sinceIso: "2026-06-05T10:00:00.000Z",
    repos: [
      {
        repo: "mitosisdev/test",
        mergedPrs: [],
        openCount: 0,
        latestCommit: null,
      },
    ],
  };
  const out = formatPortfolioDiff(diff, NOW);
  expect(out).toContain("🔀 Latest: (not available)");
});

test("formatPortfolioDiff uses ✅ emoji for merged PR lines", () => {
  const out = formatPortfolioDiff(SAMPLE_DIFF, NOW);
  expect(out).toContain("✅ Merged:");
});

test("formatPortfolioDiff uses 🔀 emoji for latest commit lines", () => {
  const out = formatPortfolioDiff(SAMPLE_DIFF, NOW);
  expect(out).toContain("🔀 Latest:");
});

// ---------------------------------------------------------------------------
// buildPortfolioDiff — integration with injectable fetcher
// ---------------------------------------------------------------------------

function makeFakeFetcher(overrides: Partial<RepoDiffFetcher> = {}): RepoDiffFetcher {
  return {
    fetchMergedPrs: async (_repo, _since) => [],
    fetchOpenPrCount: async (_repo) => 0,
    fetchLatestCommit: async (_repo) => ({
      sha: "abc1234",
      message: "chore: bump version",
      date: "2026-06-08",
    }),
    ...overrides,
  };
}

test("buildPortfolioDiff includes home repo", async () => {
  const data = await buildPortfolioDiff(
    emptyState(),
    emptyRegistry(),
    "mitosisdev/mito",
    makeFakeFetcher(),
  );
  const repos = data.repos.map((r) => r.repo);
  expect(repos).toContain("mitosisdev/mito");
});

test("buildPortfolioDiff includes registry projects", async () => {
  const registry: Registry = {
    projects: [
      { repo: "mitosisdev/changeloom", name: "changeloom", description: "", createdAt: "" },
    ],
  };
  const data = await buildPortfolioDiff(
    emptyState(),
    registry,
    "mitosisdev/mito",
    makeFakeFetcher(),
  );
  const repos = data.repos.map((r) => r.repo);
  expect(repos).toContain("mitosisdev/changeloom");
  expect(repos).toContain("mitosisdev/mito");
});

test("buildPortfolioDiff deduplicates when home repo also in registry", async () => {
  const registry: Registry = {
    projects: [
      { repo: "mitosisdev/mito", name: "mito", description: "", createdAt: "" },
    ],
  };
  const data = await buildPortfolioDiff(
    emptyState(),
    registry,
    "mitosisdev/mito",
    makeFakeFetcher(),
  );
  const repoNames = data.repos.map((r) => r.repo);
  const uniqueNames = [...new Set(repoNames)];
  expect(repoNames).toHaveLength(uniqueNames.length);
});

test("buildPortfolioDiff sinceDate derived from last session", async () => {
  const state: State = {
    ...emptyState(),
    buildSessions: [
      { id: "2026-06-05T10:00:00.000Z", startedAt: "2026-06-05T10:00:00.000Z", prsOpened: 0 },
    ],
  };
  const data = await buildPortfolioDiff(state, emptyRegistry(), "mitosisdev/mito", makeFakeFetcher());
  expect(data.sinceDate).toBe("2026-06-05");
  expect(data.sinceIso).toBe("2026-06-05T10:00:00.000Z");
});

test("buildPortfolioDiff uses epoch when no sessions", async () => {
  const data = await buildPortfolioDiff(emptyState(), emptyRegistry(), "mitosisdev/mito", makeFakeFetcher());
  expect(data.sinceDate).toBe("1970-01-01");
});

test("buildPortfolioDiff merges fetcher results into RepoDiff", async () => {
  const fetcher = makeFakeFetcher({
    fetchMergedPrs: async (_repo, _since) => [
      { number: 42, title: "feat: test", mergedAt: "2026-06-08T09:00:00.000Z", url: "https://github.com/mitosisdev/mito/pull/42" },
    ],
    fetchOpenPrCount: async (_repo) => 3,
    fetchLatestCommit: async (_repo) => ({ sha: "abc1234", message: "fix: something", date: "2026-06-08" }),
  });
  const data = await buildPortfolioDiff(emptyState(), emptyRegistry(), "mitosisdev/mito", fetcher);
  const repo = data.repos[0]!;
  expect(repo.mergedPrs).toHaveLength(1);
  expect(repo.mergedPrs[0]!.number).toBe(42);
  expect(repo.openCount).toBe(3);
  expect(repo.latestCommit?.sha).toBe("abc1234");
});

test("buildPortfolioDiff handles fetcher errors gracefully", async () => {
  const fetcher = makeFakeFetcher({
    fetchMergedPrs: async () => { throw new Error("network error"); },
    fetchOpenPrCount: async () => { throw new Error("network error"); },
    fetchLatestCommit: async () => { throw new Error("network error"); },
  });
  const data = await buildPortfolioDiff(emptyState(), emptyRegistry(), "mitosisdev/mito", fetcher);
  const repo = data.repos[0]!;
  expect(repo.mergedPrs).toHaveLength(0);
  expect(repo.openCount).toBe(0);
  expect(repo.latestCommit).toBeNull();
});
