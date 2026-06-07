// tests/metrics.test.ts — tests for bin/metrics.ts portfolio metrics CLI command.
//
// Tests:
//   1. The bin/metrics.ts file exists and is importable
//   2. --json flag produces valid JSON with the required shape
//   3. The JSON output has repos array, totalOpen, totalMerged fields
import { test, expect, describe } from "bun:test";
import { existsSync } from "node:fs";
import { $ } from "bun";

describe("bin/metrics.ts", () => {
  test("bin/metrics.ts file exists", () => {
    expect(existsSync("bin/metrics.ts")).toBe(true);
  });

  test("--json flag produces valid JSON with required fields", async () => {
    // bin/metrics.ts reads MITO_GITHUB_REPO from env and uses `gh` CLI —
    // no Twitter/X credentials required.
    const env = {
      ...process.env,
      MITO_GITHUB_REPO: "mitosisdev/mito",
    };

    const result = await $`bun bin/metrics.ts --json`.env(env).nothrow().quiet();

    // Exit code 0 expected
    expect(result.exitCode).toBe(0);

    const raw = result.stdout.toString().trim();
    let parsed: unknown;
    expect(() => {
      parsed = JSON.parse(raw);
    }).not.toThrow();

    const data = parsed as Record<string, unknown>;

    // Required top-level fields
    expect(Array.isArray(data.repos)).toBe(true);
    expect(typeof data.totalOpen).toBe("number");
    expect(typeof data.totalMerged).toBe("number");

    // Each repo entry must have the documented shape
    const repos = data.repos as Array<Record<string, unknown>>;
    for (const r of repos) {
      expect(typeof r.repo).toBe("string");
      expect(typeof r.openPrs).toBe("number");
      expect(typeof r.mergedPrs).toBe("number");
      expect(typeof r.lastActivity).toBe("string");
    }
  });

  test("--json totals are consistent with per-repo data", async () => {
    const env = {
      ...process.env,
      MITO_GITHUB_REPO: "mitosisdev/mito",
    };

    const result = await $`bun bin/metrics.ts --json`.env(env).nothrow().quiet();
    expect(result.exitCode).toBe(0);

    const data = JSON.parse(result.stdout.toString().trim()) as {
      repos: Array<{ openPrs: number; mergedPrs: number }>;
      totalOpen: number;
      totalMerged: number;
    };

    const sumOpen = data.repos.reduce((s, r) => s + r.openPrs, 0);
    const sumMerged = data.repos.reduce((s, r) => s + r.mergedPrs, 0);

    expect(data.totalOpen).toBe(sumOpen);
    expect(data.totalMerged).toBe(sumMerged);
  });
});
