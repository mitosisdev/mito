// src/portfolio.test.ts — TDD for portfolio table generation and placeholder injection.
import { test, expect } from "bun:test";
import {
  buildProjectsTable,
  injectProjectsTable,
  PROJECTS_TABLE_PLACEHOLDER,
  type ProjectMeta,
  fetchProjectMeta,
} from "./portfolio";
import type { Project } from "./registry";

// Fixture projects.
const gitstory: Project = {
  repo: "mitosisdev/gitstory",
  name: "gitstory",
  description: "Turn any git repo's history into a shareable, animated commit timeline.",
  createdAt: "2026-06-02T21:27:20.302Z",
};

const widget: Project = {
  repo: "mitosisdev/widget",
  name: "widget",
  description: "A tiny widget library.",
  createdAt: "2026-06-03T00:00:00.000Z",
};

// ---------------------------------------------------------------------------
// buildProjectsTable
// ---------------------------------------------------------------------------

test("buildProjectsTable returns empty tbody for no projects", () => {
  const html = buildProjectsTable([]);
  expect(html).toContain("<table");
  expect(html).toContain("<thead>");
  expect(html).toContain("<tbody>");
  // No data rows.
  expect(html).not.toContain("<td>");
});

test("buildProjectsTable renders one row per project", () => {
  const meta: ProjectMeta[] = [
    { project: gitstory, stars: 3, openPrs: 1, mergedPrs: 5 },
    { project: widget, stars: 0, openPrs: 0, mergedPrs: 2 },
  ];
  const html = buildProjectsTable(meta);
  expect(html).toContain("gitstory");
  expect(html).toContain("widget");
  expect(html).toContain("mitosisdev/gitstory");
  expect(html).toContain("mitosisdev/widget");
});

test("buildProjectsTable links project name to GitHub", () => {
  const meta: ProjectMeta[] = [
    { project: gitstory, stars: 0, openPrs: 0, mergedPrs: 0 },
  ];
  const html = buildProjectsTable(meta);
  expect(html).toContain('href="https://github.com/mitosisdev/gitstory"');
  expect(html).toContain(">gitstory<");
});

test("buildProjectsTable shows description from registry", () => {
  const meta: ProjectMeta[] = [
    { project: gitstory, stars: 7, openPrs: 2, mergedPrs: 10 },
  ];
  const html = buildProjectsTable(meta);
  expect(html).toContain("Turn any git repo");
});

test("buildProjectsTable shows numeric columns", () => {
  const meta: ProjectMeta[] = [
    { project: gitstory, stars: 42, openPrs: 3, mergedPrs: 17 },
  ];
  const html = buildProjectsTable(meta);
  expect(html).toContain("42");
  expect(html).toContain("3");
  expect(html).toContain("17");
});

test("buildProjectsTable includes correct table headers", () => {
  const html = buildProjectsTable([]);
  expect(html).toContain("Project");
  expect(html).toContain("Description");
  expect(html).toContain("PRs merged");
  expect(html).toContain("Open PRs");
  expect(html).toContain("Stars");
});

// ---------------------------------------------------------------------------
// injectProjectsTable
// ---------------------------------------------------------------------------

test("injectProjectsTable replaces placeholder with table HTML", () => {
  const tableHtml = "<table>...</table>";
  const html = `<h2>Projects</h2>\n${PROJECTS_TABLE_PLACEHOLDER}\n<p>footer</p>`;
  const result = injectProjectsTable(html, tableHtml);
  expect(result).toContain("<table>...</table>");
  expect(result).not.toContain(PROJECTS_TABLE_PLACEHOLDER);
  expect(result).toContain("<h2>Projects</h2>");
  expect(result).toContain("<p>footer</p>");
});

test("injectProjectsTable leaves HTML unchanged when placeholder is absent", () => {
  const html = "<p>no placeholder here</p>";
  const result = injectProjectsTable(html, "<table/>");
  expect(result).toBe(html);
});

test("injectProjectsTable handles empty table string", () => {
  const html = `before\n${PROJECTS_TABLE_PLACEHOLDER}\nafter`;
  const result = injectProjectsTable(html, "");
  expect(result).toBe("before\n\nafter");
});

// ---------------------------------------------------------------------------
// fetchProjectMeta (graceful fallback when API fails)
// ---------------------------------------------------------------------------

test("fetchProjectMeta falls back to zeros when fetch throws", async () => {
  const failFetch = async (_url: string, _init?: unknown) => {
    throw new Error("network error");
  };
  const result = await fetchProjectMeta(gitstory, failFetch as never, "tok");
  expect(result.project).toBe(gitstory);
  expect(result.stars).toBe(0);
  expect(result.openPrs).toBe(0);
  expect(result.mergedPrs).toBe(0);
});

test("fetchProjectMeta falls back to zeros when API returns non-ok", async () => {
  const badFetch = async (_url: string, _init?: unknown) => ({
    ok: false,
    status: 403,
    json: async () => ({}),
    text: async () => "Forbidden",
  });
  const result = await fetchProjectMeta(gitstory, badFetch as never, "tok");
  expect(result.stars).toBe(0);
  expect(result.openPrs).toBe(0);
  expect(result.mergedPrs).toBe(0);
});

test("fetchProjectMeta parses API response correctly", async () => {
  const mockFetch = async (url: string, _init?: unknown) => {
    // Repo endpoint — stars.
    if (url.endsWith("/repos/mitosisdev/gitstory") && !url.includes("pulls")) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ stargazers_count: 99, description: "desc" }),
        text: async () => "",
      };
    }
    // Open PRs.
    if (url.includes("pulls?state=open")) {
      return {
        ok: true,
        status: 200,
        json: async () => [{ number: 1 }, { number: 2 }],
        text: async () => "",
      };
    }
    // Closed PRs (with merged_at).
    if (url.includes("pulls?state=closed")) {
      return {
        ok: true,
        status: 200,
        json: async () => [
          { number: 1, merged_at: "2026-01-01" },
          { number: 2, merged_at: "2026-01-02" },
          { number: 3, merged_at: null },
        ],
        text: async () => "",
      };
    }
    return { ok: false, status: 404, json: async () => ({}), text: async () => "" };
  };

  const result = await fetchProjectMeta(gitstory, mockFetch as never, "tok");
  expect(result.stars).toBe(99);
  expect(result.openPrs).toBe(2);
  expect(result.mergedPrs).toBe(2); // only those with merged_at
});
