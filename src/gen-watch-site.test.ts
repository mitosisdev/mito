// src/gen-watch-site.test.ts — TDD for gen-watch-site HTML generation.
import { test, expect } from "bun:test";
import { buildWatchSiteHtml, type RepoStat } from "./gen-watch-site";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const gitstory: RepoStat = {
  repo: "mitosisdev/gitstory",
  name: "gitstory",
  description: "Turn any git repo's history into a shareable, animated commit timeline.",
  openPrs: 2,
};

const changeloom: RepoStat = {
  repo: "mitosisdev/changeloom",
  name: "changeloom",
  description: "Auto-generate clean changelogs from conventional commits",
  openPrs: 0,
};

const baseOpts = {
  repos: [gitstory, changeloom],
  sessions: 42,
  prsMerged: 17,
  currentlyBuilding: "mito-watch v1",
  lastBuildTime: "2026-06-07T12:00:00.000Z",
};

// ---------------------------------------------------------------------------
// buildWatchSiteHtml
// ---------------------------------------------------------------------------

test("buildWatchSiteHtml returns a string containing <html", () => {
  const html = buildWatchSiteHtml(baseOpts);
  expect(typeof html).toBe("string");
  expect(html).toContain("<html");
});

test("buildWatchSiteHtml output includes each repo name", () => {
  const html = buildWatchSiteHtml(baseOpts);
  expect(html).toContain("gitstory");
  expect(html).toContain("changeloom");
});

test("buildWatchSiteHtml handles 0 open PRs without crashing", () => {
  const opts = {
    ...baseOpts,
    repos: [{ ...changeloom, openPrs: 0 }],
  };
  const html = buildWatchSiteHtml(opts);
  expect(html).toContain("changeloom");
  expect(html).toContain("0");
});

test("buildWatchSiteHtml includes sessions count in output", () => {
  const html = buildWatchSiteHtml(baseOpts);
  expect(html).toContain("42");
});

test("buildWatchSiteHtml includes prsMerged count in output", () => {
  const html = buildWatchSiteHtml(baseOpts);
  expect(html).toContain("17");
});

test("buildWatchSiteHtml output is self-contained (no http:// src= or href= to external)", () => {
  const html = buildWatchSiteHtml(baseOpts);
  // No external CSS/JS/image src links
  const externalSrcMatch = html.match(/src="https?:\/\//);
  expect(externalSrcMatch).toBeNull();
  // No external stylesheet links (link rel=stylesheet pointing to http)
  const externalStylesheetMatch = html.match(/href="https?:\/\/[^"]*\.css/);
  expect(externalStylesheetMatch).toBeNull();
});

test("buildWatchSiteHtml includes currentlyBuilding in output", () => {
  const html = buildWatchSiteHtml(baseOpts);
  expect(html).toContain("mito-watch v1");
});

test("buildWatchSiteHtml includes lastBuildTime in output", () => {
  const html = buildWatchSiteHtml(baseOpts);
  expect(html).toContain("2026-06-07T12:00:00.000Z");
});

test("buildWatchSiteHtml handles empty repos list without crashing", () => {
  const opts = { ...baseOpts, repos: [] };
  const html = buildWatchSiteHtml(opts);
  expect(html).toContain("<html");
});

test("buildWatchSiteHtml shows open PR count per repo", () => {
  const opts = {
    ...baseOpts,
    repos: [{ ...gitstory, openPrs: 5 }],
  };
  const html = buildWatchSiteHtml(opts);
  expect(html).toContain("5");
});

test("buildWatchSiteHtml contains inline <style> block", () => {
  const html = buildWatchSiteHtml(baseOpts);
  expect(html).toContain("<style");
  expect(html).toContain("</style>");
});

test("buildWatchSiteHtml contains DOCTYPE declaration", () => {
  const html = buildWatchSiteHtml(baseOpts);
  expect(html).toContain("<!DOCTYPE html>");
});
