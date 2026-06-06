// tests/build-feed.test.ts — unit tests for the build-feed HTML generator.
//
// These are pure-function tests — no network, no fs, no GitHub API.
// generateFeedHtml takes an array of PR records and returns an HTML string.
import { test, expect } from "bun:test";
import { generateFeedHtml } from "../scripts/build-feed";

const samplePrs = [
  {
    title: "feat: add leaderboard",
    repo: "mitosisdev/widget",
    mergedAt: "2026-06-05T12:34:56Z",
    url: "https://github.com/mitosisdev/widget/pull/3",
  },
  {
    title: "fix: correct timezone handling",
    repo: "mitosisdev/mito",
    mergedAt: "2026-06-04T08:00:00Z",
    url: "https://github.com/mitosisdev/mito/pull/7",
  },
];

// ── HTML structure ─────────────────────────────────────────────────────────

test("generateFeedHtml returns a string", () => {
  const html = generateFeedHtml(samplePrs);
  expect(typeof html).toBe("string");
});

test("HTML has DOCTYPE declaration", () => {
  const html = generateFeedHtml(samplePrs);
  expect(html.toLowerCase()).toContain("<!doctype html>");
});

test("HTML has <html> tag", () => {
  const html = generateFeedHtml(samplePrs);
  expect(html).toContain("<html");
});

test("HTML has <body> tag", () => {
  const html = generateFeedHtml(samplePrs);
  expect(html).toContain("<body");
});

test("HTML has <table> tag", () => {
  const html = generateFeedHtml(samplePrs);
  expect(html).toContain("<table");
});

// ── PR entries ────────────────────────────────────────────────────────────

test("each PR appears as a <tr> row", () => {
  const html = generateFeedHtml(samplePrs);
  // Count <tr> tags that are data rows (not the header row)
  const trMatches = html.match(/<tr[\s>]/gi) ?? [];
  // At least header + 2 data rows = 3
  expect(trMatches.length).toBeGreaterThanOrEqual(3);
});

test("PR title appears in the HTML", () => {
  const html = generateFeedHtml(samplePrs);
  expect(html).toContain("feat: add leaderboard");
  expect(html).toContain("fix: correct timezone handling");
});

test("PR title is linked to the PR url", () => {
  const html = generateFeedHtml(samplePrs);
  expect(html).toContain('href="https://github.com/mitosisdev/widget/pull/3"');
  expect(html).toContain('href="https://github.com/mitosisdev/mito/pull/7"');
});

test("repo name appears in a <td> cell", () => {
  const html = generateFeedHtml(samplePrs);
  expect(html).toContain("mitosisdev/widget");
  expect(html).toContain("mitosisdev/mito");
});

test("mergedAt timestamp appears in a <td> cell", () => {
  const html = generateFeedHtml(samplePrs);
  // Timestamp may be formatted, but the date portion must be present
  expect(html).toContain("2026-06-05");
  expect(html).toContain("2026-06-04");
});

// ── Empty list ────────────────────────────────────────────────────────────

test("empty PR list returns a valid HTML page", () => {
  const html = generateFeedHtml([]);
  expect(html.toLowerCase()).toContain("<!doctype html>");
  expect(html).toContain("<html");
  expect(html).toContain("<body");
});

test("empty PR list shows 'No recent activity' text", () => {
  const html = generateFeedHtml([]);
  expect(html).toContain("No recent activity");
});

test("empty PR list still has a <table> (just no data rows)", () => {
  const html = generateFeedHtml([]);
  expect(html).toContain("<table");
});

// ── Column headers ─────────────────────────────────────────────────────────

test("table has PR Title column header", () => {
  const html = generateFeedHtml(samplePrs);
  expect(html).toContain("PR Title");
});

test("table has Repo column header", () => {
  const html = generateFeedHtml(samplePrs);
  expect(html).toContain("Repo");
});

test("table has Merged At column header", () => {
  const html = generateFeedHtml(samplePrs);
  expect(html).toContain("Merged At");
});
