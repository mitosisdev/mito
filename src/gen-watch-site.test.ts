// src/gen-watch-site.test.ts — TDD for gen-watch-site pure render functions.
import { test, expect } from "bun:test";
import {
  renderProjectRow,
  renderPage,
  type WatchProject,
  type WatchPageData,
} from "./gen-watch-site";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const gitstory: WatchProject = {
  repo: "mitosisdev/gitstory",
  name: "gitstory",
  description: "Turn any git repo's history into a shareable, animated commit timeline.",
  mergedPrs: 11,
  openPrs: 2,
  stars: 5,
};

const changeloom: WatchProject = {
  repo: "mitosisdev/changeloom",
  name: "changeloom",
  description: "Auto-generate clean changelogs from conventional commits",
  mergedPrs: 7,
  openPrs: 0,
  stars: 0,
};

// ---------------------------------------------------------------------------
// renderProjectRow
// ---------------------------------------------------------------------------

test("renderProjectRow renders project name in a td cell", () => {
  const html = renderProjectRow(gitstory);
  expect(html).toContain(">gitstory<");
});

test("renderProjectRow links project name to GitHub", () => {
  const html = renderProjectRow(gitstory);
  expect(html).toContain('href="https://github.com/mitosisdev/gitstory"');
});

test("renderProjectRow renders description in a td cell", () => {
  const html = renderProjectRow(gitstory);
  expect(html).toContain("Turn any git repo");
});

test("renderProjectRow renders merged PRs count", () => {
  const html = renderProjectRow(gitstory);
  expect(html).toContain("11");
});

test("renderProjectRow renders open PRs count", () => {
  const html = renderProjectRow(gitstory);
  expect(html).toContain("2");
});

test("renderProjectRow renders stars count", () => {
  const html = renderProjectRow(gitstory);
  expect(html).toContain("5");
});

test("renderProjectRow produces a <tr> element", () => {
  const html = renderProjectRow(gitstory);
  expect(html).toContain("<tr>");
  expect(html).toContain("</tr>");
});

test("renderProjectRow escapes HTML in description", () => {
  const xss: WatchProject = {
    ...gitstory,
    description: "<script>alert('xss')</script>",
  };
  const html = renderProjectRow(xss);
  expect(html).not.toContain("<script>");
  expect(html).toContain("&lt;script&gt;");
});

// ---------------------------------------------------------------------------
// renderPage
// ---------------------------------------------------------------------------

const sampleData: WatchPageData = {
  projects: [gitstory, changeloom],
  totalMergedPrs: 42,
  lastBuild: "2026-06-07T10:00:00.000Z",
};

test("renderPage output contains project name", () => {
  const html = renderPage(sampleData);
  expect(html).toContain("gitstory");
});

test("renderPage output contains second project name", () => {
  const html = renderPage(sampleData);
  expect(html).toContain("changeloom");
});

test("renderPage with empty projects still produces valid HTML structure", () => {
  const html = renderPage({ projects: [], totalMergedPrs: 0, lastBuild: "2026-06-07T00:00:00.000Z" });
  expect(html).toContain("<!doctype html>");
  expect(html).toContain("<html");
  expect(html).toContain("<head>");
  expect(html).toContain("<body>");
  expect(html).toContain("</html>");
  expect(html).toContain("<table");
  expect(html).toContain("</table>");
});

test("renderPage contains total merged PRs count", () => {
  const html = renderPage(sampleData);
  expect(html).toContain("42");
});

test("renderPage contains last build timestamp", () => {
  const html = renderPage(sampleData);
  expect(html).toContain("2026-06-07");
});

test("renderPage contains link to mitosisdev/mito", () => {
  const html = renderPage(sampleData);
  expect(html).toContain("github.com/mitosisdev/mito");
});

test("renderPage contains mito branding", () => {
  const html = renderPage(sampleData);
  expect(html).toContain("mito");
});

test("renderPage contains dark background color", () => {
  const html = renderPage(sampleData);
  expect(html).toContain("#0b0d10");
});

test("renderPage contains purple accent color", () => {
  const html = renderPage(sampleData);
  // Accept either case — css hex is often lowercase
  expect(html.toLowerCase()).toContain("#8a2be2");
});

test("renderPage contains Managed Projects heading", () => {
  const html = renderPage(sampleData);
  expect(html).toContain("Managed Projects");
});

test("renderPage contains table headers", () => {
  const html = renderPage(sampleData);
  expect(html).toContain("PRs merged");
  expect(html).toContain("Open PRs");
  expect(html).toContain("Stars");
});
