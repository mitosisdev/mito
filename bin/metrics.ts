// bin/metrics.ts — portfolio metrics snapshot for the mito dev shop.
//
// Prints a table of open/merged PR counts and last-activity dates for every
// repo mito manages. Uses `gh` CLI for PR data and projects/registry.json for
// the repo list. Does NOT require Twitter/X credentials — reads only what it
// needs (repo list + optional state path) directly from the environment.
//
// Usage:
//   bun bin/metrics.ts           # formatted table
//   bun bin/metrics.ts --json    # machine-readable JSON
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { loadRegistry } from "../src/registry";
import { loadState } from "../src/state";
import { $ } from "bun";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RepoMetrics {
  repo: string;
  openPrs: number;
  mergedPrs: number;
  lastActivity: string; // ISO date string (YYYY-MM-DD) or "n/a"
}

export interface MetricsSnapshot {
  repos: RepoMetrics[];
  totalOpen: number;
  totalMerged: number;
  sessionCount: number | "n/a";
  generatedAt: string;
}

// ---------------------------------------------------------------------------
// gh CLI helpers
// ---------------------------------------------------------------------------

// Run `gh pr list` for a repo and return PR count. Returns 0 on any failure.
async function countPrs(repo: string, state: "open" | "merged"): Promise<number> {
  try {
    const ghState = state === "merged" ? "merged" : "open";
    const result = await $`gh pr list --repo ${repo} --state ${ghState} --json number --limit 500`
      .quiet()
      .nothrow();
    if (result.exitCode !== 0) return 0;
    const arr = JSON.parse(result.stdout.toString().trim()) as Array<unknown>;
    return arr.length;
  } catch {
    return 0;
  }
}

// Get the last push date for a repo via gh api. Returns "n/a" on failure.
async function lastActivity(repo: string): Promise<string> {
  try {
    const result = await $`gh api repos/${repo} --jq .pushed_at`.quiet().nothrow();
    if (result.exitCode !== 0) return "n/a";
    const raw = result.stdout.toString().trim();
    if (!raw || raw === "null") return "n/a";
    // Convert ISO timestamp → YYYY-MM-DD
    return raw.slice(0, 10);
  } catch {
    return "n/a";
  }
}

// ---------------------------------------------------------------------------
// Session count from diary directory or state
// ---------------------------------------------------------------------------

function readSessionCount(): number | "n/a" {
  // Try diary directory first (one file per session)
  const diaryDir = join(process.cwd(), "diary");
  if (existsSync(diaryDir)) {
    try {
      const files = readdirSync(diaryDir).filter((f) => f.endsWith(".md"));
      if (files.length > 0) return files.length;
    } catch {
      // fall through
    }
  }

  // Fall back to state.buildSessions via MITO_STATE_PATH (default ./mito-state.json)
  try {
    const statePath = process.env.MITO_STATE_PATH ?? "./mito-state.json";
    const state = loadState(statePath);
    if (state.buildSessions.length > 0) return state.buildSessions.length;
  } catch {
    // fall through
  }

  return "n/a";
}

// ---------------------------------------------------------------------------
// Collect all repos (home + registry)
// ---------------------------------------------------------------------------

function collectRepos(): string[] {
  const repos: string[] = [];

  const home = process.env.MITO_GITHUB_REPO;
  if (home) repos.push(home);

  try {
    const reg = loadRegistry("projects/registry.json");
    for (const project of reg.projects) {
      if (!repos.includes(project.repo)) repos.push(project.repo);
    }
  } catch {
    // registry missing is fine — home repo only
  }

  return repos;
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

function formatTable(snap: MetricsSnapshot): string {
  const lines: string[] = [];

  lines.push("mito portfolio metrics");
  lines.push("═".repeat(39));
  lines.push("");

  // Column headers
  const col1 = "repo";
  const col2 = "open PRs";
  const col3 = "merged PRs";
  const col4 = "last activity";

  // Determine column widths
  const w1 = Math.max(col1.length, ...snap.repos.map((r) => r.repo.split("/")[1]?.length ?? r.repo.length));
  const w2 = col2.length;
  const w3 = col3.length;
  const w4 = col4.length;

  const pad = (s: string, w: number): string => s.padEnd(w);
  const padLeft = (s: string, w: number): string => s.padStart(w);

  lines.push(
    `${pad(col1, w1)}  ${pad(col2, w2)}  ${pad(col3, w3)}  ${col4}`,
  );
  lines.push("─".repeat(w1 + 2 + w2 + 2 + w3 + 2 + w4));

  for (const r of snap.repos) {
    const slug = r.repo.split("/")[1] ?? r.repo;
    lines.push(
      `${pad(slug, w1)}  ${padLeft(String(r.openPrs), w2)}  ${padLeft(String(r.mergedPrs), w3)}  ${r.lastActivity}`,
    );
  }

  lines.push("");
  lines.push(`total open: ${snap.totalOpen}  |  total merged: ${snap.totalMerged}`);
  lines.push(`session count: ${snap.sessionCount}`);
  lines.push("");

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const useJson = process.argv.includes("--json");

  const repos = collectRepos();

  // Fetch metrics for all repos in parallel
  const repoMetrics = await Promise.all(
    repos.map(async (repo): Promise<RepoMetrics> => {
      const [openPrs, mergedPrs, activity] = await Promise.all([
        countPrs(repo, "open"),
        countPrs(repo, "merged"),
        lastActivity(repo),
      ]);
      return { repo, openPrs, mergedPrs, lastActivity: activity };
    }),
  );

  const totalOpen = repoMetrics.reduce((s, r) => s + r.openPrs, 0);
  const totalMerged = repoMetrics.reduce((s, r) => s + r.mergedPrs, 0);
  const sessionCount = readSessionCount();

  const snap: MetricsSnapshot = {
    repos: repoMetrics,
    totalOpen,
    totalMerged,
    sessionCount,
    generatedAt: new Date().toISOString(),
  };

  if (useJson) {
    console.log(JSON.stringify(snap, null, 2));
  } else {
    console.log(formatTable(snap));
  }
}

main().catch((err) => {
  console.error("metrics: fatal error:", err);
  process.exit(1);
});
