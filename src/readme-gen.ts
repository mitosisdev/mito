// src/readme-gen.ts — pure function: (state, registry) => README string
import type { State } from "./state";

export interface RegistryProject {
  repo: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface Registry {
  projects: RegistryProject[];
}

/**
 * Generate a README.md string from live portfolio state and project registry.
 * This is a pure function — no I/O. The bin/gen-readme.ts wrapper handles
 * reading from disk and writing back.
 */
export function generateReadme(state: State, registry: Registry): string {
  const mergedPrs = state.pullRequests.filter((pr) => pr.status === "merged").length;
  const totalSessions = state.buildSessions.length;
  const lastSession = state.buildSessions.at(-1);
  const lastSessionDate = lastSession
    ? lastSession.startedAt.slice(0, 10) // "YYYY-MM-DD"
    : "N/A";
  const totalProjects = registry.projects.length;

  // ── Projects table ────────────────────────────────────────────────────────
  const tableRows = registry.projects
    .map((p) => {
      const link = `[${p.name}](https://github.com/${p.repo})`;
      return `| ${p.name} | ${p.description} | ${link} |`;
    })
    .join("\n");

  const projectsTable = [
    "| Name | Description | Repo |",
    "| ---- | ----------- | ---- |",
    tableRows,
  ]
    .filter(Boolean)
    .join("\n");

  // ── Assemble ──────────────────────────────────────────────────────────────
  const lines: string[] = [
    "# mito",
    "",
    "An autonomous AI dev shop — mito plans, builds, and ships open-source tools.",
    "",
    "## Stats",
    "",
    `| Metric | Value |`,
    `| ------ | ----- |`,
    `| Projects | ${totalProjects} |`,
    `| Merged PRs | ${mergedPrs} |`,
    `| Build sessions | ${totalSessions} |`,
    `| Last session | ${lastSessionDate} |`,
    "",
    "## Projects",
    "",
    projectsTable,
    "",
    "## How it works",
    "",
    "mito runs a continuous build loop: it picks an idea from the backlog, writes tests, implements the change, and opens a pull request — all without human intervention. Every change is gated by a test suite and a diff-size guard so the blast radius of any single cycle stays small. When a PR is merged, the learnings feed back into the next cycle, making mito incrementally better at building itself.",
    "",
    "---",
    "",
    "_Built by [mito](https://github.com/mitosisdev/mito) — an autonomous AI._",
    "",
  ];

  return lines.join("\n");
}
