// src/health.test.ts — TDD for the portfolio health check tool.
//
// Only formatHealthTable is pure; the gh-API functions are tested via
// injected FetchLike stubs so no network access is needed.
import { test, expect, describe } from "bun:test";
import {
  formatHealthTable,
  checkReadme,
  checkCiWorkflow,
  getOpenPrCount,
  getCiStatus,
  type RepoHealth,
  type CiHealthStatus,
} from "./health";
import type { FetchLike } from "./github";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFetch(
  responses: Array<{ ok: boolean; status?: number; body?: unknown }>,
): FetchLike {
  let i = 0;
  return async (_url, _init) => {
    const r = responses[i++] ?? { ok: false, status: 404 };
    return {
      ok: r.ok,
      status: r.status ?? (r.ok ? 200 : 404),
      async json() {
        return r.body ?? null;
      },
      async text() {
        return JSON.stringify(r.body ?? null);
      },
    };
  };
}

// ---------------------------------------------------------------------------
// formatHealthTable — pure function tests
// ---------------------------------------------------------------------------

describe("formatHealthTable", () => {
  test("empty results shows placeholder row", () => {
    const output = formatHealthTable([]);
    expect(output).toContain("REPO");
    expect(output).toContain("(no repos)");
  });

  test("all passing shows checkmarks and CI status", () => {
    const results: RepoHealth[] = [
      {
        repo: "mitosisdev/gitstory",
        hasReadme: true,
        hasCi: true,
        openPrs: 4,
        ciStatus: "passing",
      },
      {
        repo: "mitosisdev/changeloom",
        hasReadme: true,
        hasCi: true,
        openPrs: 3,
        ciStatus: "passing",
      },
    ];
    const output = formatHealthTable(results);
    expect(output).toContain("gitstory");
    expect(output).toContain("changeloom");
    expect(output).toContain("✓ passing");
    expect(output).toContain("4");
    expect(output).toContain("3");
  });

  test("mixed status renders correctly", () => {
    const results: RepoHealth[] = [
      {
        repo: "mitosisdev/gitstory",
        hasReadme: true,
        hasCi: true,
        openPrs: 2,
        ciStatus: "failing",
      },
      {
        repo: "mitosisdev/dep-drift",
        hasReadme: false,
        hasCi: false,
        openPrs: 1,
        ciStatus: "unknown",
      },
    ];
    const output = formatHealthTable(results);
    expect(output).toContain("✗ failing");
    // No CI → dash for status
    const lines = output.split("\n");
    const depDriftLine = lines.find((l) => l.includes("dep-drift"));
    expect(depDriftLine).toBeDefined();
    expect(depDriftLine).toContain("–");
  });

  test("repo without CI shows dash for CI status regardless of ciStatus value", () => {
    const r: RepoHealth = {
      repo: "owner/noci",
      hasReadme: true,
      hasCi: false,
      openPrs: 0,
      ciStatus: "passing", // should be overridden by hasCi=false
    };
    const output = formatHealthTable([r]);
    // Should not show "✓ passing" for a repo with no CI
    expect(output).not.toContain("✓ passing");
    expect(output).toContain("–");
  });

  test("pending CI status renders hourglass", () => {
    const r: RepoHealth = {
      repo: "owner/pending-repo",
      hasReadme: true,
      hasCi: true,
      openPrs: 0,
      ciStatus: "pending",
    };
    const output = formatHealthTable([r]);
    expect(output).toContain("⏳ pending");
  });

  test("header row contains expected columns", () => {
    const output = formatHealthTable([]);
    expect(output).toContain("REPO");
    expect(output).toContain("README");
    expect(output).toContain("CI");
    expect(output).toContain("OPEN PRS");
    expect(output).toContain("CI STATUS");
  });

  test("slug is extracted from owner/repo string", () => {
    const r: RepoHealth = {
      repo: "mitosisdev/my-project",
      hasReadme: true,
      hasCi: true,
      openPrs: 0,
      ciStatus: "passing",
    };
    const output = formatHealthTable([r]);
    expect(output).toContain("my-project");
    expect(output).not.toContain("mitosisdev/my-project");
  });

  test("repo without slash is shown as-is", () => {
    const r: RepoHealth = {
      repo: "bare-repo",
      hasReadme: false,
      hasCi: false,
      openPrs: 0,
      ciStatus: "unknown",
    };
    const output = formatHealthTable([r]);
    expect(output).toContain("bare-repo");
  });
});

// ---------------------------------------------------------------------------
// checkReadme — stub tests
// ---------------------------------------------------------------------------

describe("checkReadme", () => {
  test("returns true when API responds 200", async () => {
    const fetch = makeFetch([{ ok: true, status: 200, body: { name: "README.md" } }]);
    expect(await checkReadme("owner/repo", fetch, "token")).toBe(true);
  });

  test("returns false when API responds 404", async () => {
    const fetch = makeFetch([{ ok: false, status: 404 }]);
    expect(await checkReadme("owner/repo", fetch, "token")).toBe(false);
  });

  test("returns false when fetch throws", async () => {
    const fetch: FetchLike = async () => {
      throw new Error("network error");
    };
    expect(await checkReadme("owner/repo", fetch, "token")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// checkCiWorkflow — stub tests
// ---------------------------------------------------------------------------

describe("checkCiWorkflow", () => {
  test("returns true when workflows directory has yml files", async () => {
    const fetch = makeFetch([
      {
        ok: true,
        status: 200,
        body: [
          { name: "ci.yml", type: "file" },
          { name: "deploy.yml", type: "file" },
        ],
      },
    ]);
    expect(await checkCiWorkflow("owner/repo", fetch, "token")).toBe(true);
  });

  test("returns false when workflows directory is empty", async () => {
    const fetch = makeFetch([{ ok: true, status: 200, body: [] }]);
    expect(await checkCiWorkflow("owner/repo", fetch, "token")).toBe(false);
  });

  test("returns false when directory has no yml files", async () => {
    const fetch = makeFetch([
      {
        ok: true,
        status: 200,
        body: [{ name: "README.md", type: "file" }],
      },
    ]);
    expect(await checkCiWorkflow("owner/repo", fetch, "token")).toBe(false);
  });

  test("returns false when API responds 404 (no .github/workflows)", async () => {
    const fetch = makeFetch([{ ok: false, status: 404 }]);
    expect(await checkCiWorkflow("owner/repo", fetch, "token")).toBe(false);
  });

  test("returns false when fetch throws", async () => {
    const fetch: FetchLike = async () => {
      throw new Error("network error");
    };
    expect(await checkCiWorkflow("owner/repo", fetch, "token")).toBe(false);
  });

  test("accepts .yaml extension as well", async () => {
    const fetch = makeFetch([
      {
        ok: true,
        status: 200,
        body: [{ name: "ci.yaml", type: "file" }],
      },
    ]);
    expect(await checkCiWorkflow("owner/repo", fetch, "token")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getOpenPrCount — stub tests
// ---------------------------------------------------------------------------

describe("getOpenPrCount", () => {
  test("returns count of open PRs", async () => {
    const fetch = makeFetch([
      {
        ok: true,
        status: 200,
        body: [{ number: 1 }, { number: 2 }, { number: 3 }],
      },
    ]);
    expect(await getOpenPrCount("owner/repo", fetch, "token")).toBe(3);
  });

  test("returns 0 when no open PRs", async () => {
    const fetch = makeFetch([{ ok: true, status: 200, body: [] }]);
    expect(await getOpenPrCount("owner/repo", fetch, "token")).toBe(0);
  });

  test("returns 0 when API fails", async () => {
    const fetch = makeFetch([{ ok: false, status: 403 }]);
    expect(await getOpenPrCount("owner/repo", fetch, "token")).toBe(0);
  });

  test("returns 0 when fetch throws", async () => {
    const fetch: FetchLike = async () => {
      throw new Error("network error");
    };
    expect(await getOpenPrCount("owner/repo", fetch, "token")).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// getCiStatus — stub tests
// ---------------------------------------------------------------------------

describe("getCiStatus", () => {
  const cases: Array<[string, CiHealthStatus]> = [
    ["success", "passing"],
    ["failure", "failing"],
    ["error", "failing"],
    ["pending", "pending"],
  ];

  for (const [ghState, expected] of cases) {
    test(`maps GitHub state "${ghState}" to "${expected}"`, async () => {
      const fetch = makeFetch([
        { ok: true, status: 200, body: { state: ghState, statuses: [] } },
      ]);
      expect(await getCiStatus("owner/repo", fetch, "token")).toBe(expected);
    });
  }

  test("returns unknown when state is unrecognised", async () => {
    const fetch = makeFetch([
      { ok: true, status: 200, body: { state: "some_new_state", statuses: [] } },
    ]);
    expect(await getCiStatus("owner/repo", fetch, "token")).toBe("unknown");
  });

  test("returns unknown when API fails", async () => {
    const fetch = makeFetch([{ ok: false, status: 404 }]);
    expect(await getCiStatus("owner/repo", fetch, "token")).toBe("unknown");
  });

  test("returns unknown when fetch throws", async () => {
    const fetch: FetchLike = async () => {
      throw new Error("network error");
    };
    expect(await getCiStatus("owner/repo", fetch, "token")).toBe("unknown");
  });
});
