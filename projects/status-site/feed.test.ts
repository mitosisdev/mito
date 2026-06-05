import { test, expect } from "bun:test";
import { generateFeedHtml, type PrEntry } from "./feed";

const mockPrs: PrEntry[] = [
  {
    number: 42,
    title: "feat: add leaderboard endpoint",
    repo: "mitosisdev/gitstory",
    mergedAt: "2026-06-04T10:00:00Z",
    url: "https://github.com/mitosisdev/gitstory/pull/42",
  },
  {
    number: 7,
    title: "fix: handle empty changelog gracefully",
    repo: "mitosisdev/changeloom",
    mergedAt: "2026-06-03T15:30:00Z",
    url: "https://github.com/mitosisdev/changeloom/pull/7",
  },
];

test("generateFeedHtml returns a valid HTML document", () => {
  const html = generateFeedHtml(mockPrs);
  expect(typeof html).toBe("string");
  expect(html).toContain("<!DOCTYPE html>");
});

test("generateFeedHtml includes the page title", () => {
  const html = generateFeedHtml(mockPrs);
  expect(html).toContain("mito build feed");
});

test("generateFeedHtml includes each PR title", () => {
  const html = generateFeedHtml(mockPrs);
  for (const pr of mockPrs) {
    expect(html).toContain(pr.title);
  }
});

test("generateFeedHtml includes each PR URL as an href", () => {
  const html = generateFeedHtml(mockPrs);
  for (const pr of mockPrs) {
    expect(html).toContain(`href="${pr.url}"`);
  }
});

test("generateFeedHtml includes each repo name", () => {
  const html = generateFeedHtml(mockPrs);
  for (const pr of mockPrs) {
    expect(html).toContain(pr.repo);
  }
});

test("generateFeedHtml handles empty array with an empty-state message", () => {
  const html = generateFeedHtml([]);
  expect(html).toContain("<!DOCTYPE html>");
  // Should not error and should include a message indicating no PRs
  expect(html.toLowerCase()).toMatch(/no recent|no prs|nothing|empty/);
});
