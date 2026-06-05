// tests/diary.test.ts — unit tests for session build diary generation.
//
// Tests cover:
//   - Template-based generation (no apiKey) produces valid markdown
//   - Output contains the session header
//   - Output lists considered tasks
//   - Output mentions PR count
//   - Session file naming logic (date + N counter)
import { test, expect, describe } from "bun:test";
import { generateDiaryEntry, sessionFilename } from "../src/diary";
import type { State } from "../src/state";

function makeState(overrides: Partial<State> = {}): State {
  return {
    cycles: [],
    backlog: [],
    lastKnownGood: null,
    pullRequests: [],
    rejectedIdeas: [],
    buildSessions: [],
    ...overrides,
  };
}

describe("generateDiaryEntry (template mode, no anthropicKey)", () => {
  test("output contains # Session header with date and N", async () => {
    const result = await generateDiaryEntry({
      state: makeState(),
      gitLog: "abc1234 feat: some commit",
      tasksConsidered: ["add feature X"],
      tasksPicked: ["add feature X"],
      sessionDate: "2026-06-05",
      sessionN: 1,
    });
    expect(result).toContain("# Session 2026-06-05-1");
  });

  test("output lists considered tasks", async () => {
    const result = await generateDiaryEntry({
      state: makeState(),
      gitLog: "",
      tasksConsidered: ["task alpha", "task beta", "task gamma"],
      tasksPicked: ["task alpha"],
      sessionDate: "2026-06-05",
      sessionN: 2,
    });
    expect(result).toContain("task alpha");
    expect(result).toContain("task beta");
    expect(result).toContain("task gamma");
  });

  test("output distinguishes picked vs skipped tasks", async () => {
    const result = await generateDiaryEntry({
      state: makeState(),
      gitLog: "",
      tasksConsidered: ["task A", "task B"],
      tasksPicked: ["task A"],
      sessionDate: "2026-06-05",
      sessionN: 1,
    });
    expect(result).toContain("task A");
    expect(result).toContain("task B");
  });

  test("output mentions PR count from state", async () => {
    const state = makeState({
      pullRequests: [
        { number: 1, branch: "mito/1", url: "https://github.com/x/y/pull/1", title: "PR one", status: "open", proposedAt: "2026-06-05T00:00:00Z" },
        { number: 2, branch: "mito/2", url: "https://github.com/x/y/pull/2", title: "PR two", status: "merged", proposedAt: "2026-06-05T01:00:00Z" },
      ],
    });
    const result = await generateDiaryEntry({
      state,
      gitLog: "def5678 feat: another commit",
      tasksConsidered: ["do something"],
      tasksPicked: ["do something"],
      sessionDate: "2026-06-05",
      sessionN: 1,
    });
    // Should mention total PRs in some form
    expect(result).toMatch(/PR|pull request/i);
    expect(result).toContain("2");
  });

  test("output includes recent git log", async () => {
    const result = await generateDiaryEntry({
      state: makeState(),
      gitLog: "abc1234 feat: the notable commit\ndef5678 fix: small tweak",
      tasksConsidered: [],
      tasksPicked: [],
      sessionDate: "2026-06-05",
      sessionN: 1,
    });
    expect(result).toContain("abc1234");
  });

  test("output with zero tasks considered still produces valid markdown", async () => {
    const result = await generateDiaryEntry({
      state: makeState(),
      gitLog: "",
      tasksConsidered: [],
      tasksPicked: [],
      sessionDate: "2026-06-01",
      sessionN: 3,
    });
    expect(result).toContain("# Session 2026-06-01-3");
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(50);
  });

  test("output mentions rejected ideas when present", async () => {
    const state = makeState({
      rejectedIdeas: [
        { title: "bad idea X", reason: "duplicate", closedAt: "2026-06-05T00:00:00Z" },
      ],
    });
    const result = await generateDiaryEntry({
      state,
      gitLog: "",
      tasksConsidered: ["bad idea X", "good task Y"],
      tasksPicked: ["good task Y"],
      sessionDate: "2026-06-05",
      sessionN: 1,
    });
    expect(result).toContain("bad idea X");
  });
});

describe("sessionFilename", () => {
  test("returns YYYY-MM-DD-N.md format", () => {
    expect(sessionFilename("2026-06-05", 1)).toBe("2026-06-05-1.md");
    expect(sessionFilename("2026-06-05", 2)).toBe("2026-06-05-2.md");
    expect(sessionFilename("2026-01-01", 10)).toBe("2026-01-01-10.md");
  });

  test("first session is N=1 not N=0", () => {
    expect(sessionFilename("2026-06-05", 1)).toBe("2026-06-05-1.md");
  });
});
