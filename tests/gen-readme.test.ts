// tests/gen-readme.test.ts
import { test, expect, describe } from "bun:test";
import { generateReadme } from "../src/readme-gen";
import type { State } from "../src/state";
import type { Registry } from "../src/readme-gen";

// ── Fixtures ──────────────────────────────────────────────────────────────────

const REGISTRY: Registry = {
  projects: [
    {
      repo: "mitosisdev/gitstory",
      name: "gitstory",
      description: "Turn any git repo's history into a shareable, animated commit timeline.",
      createdAt: "2026-06-02T21:27:20.302Z",
    },
    {
      repo: "mitosisdev/changeloom",
      name: "changeloom",
      description: "Auto-generate clean changelogs from conventional commits",
      createdAt: "2026-06-03T07:06:06.063Z",
    },
  ],
};

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

const STATE_WITH_DATA: State = makeState({
  pullRequests: [
    { number: 1, branch: "feat-a", url: "https://github.com/mitosisdev/mito/pull/1", title: "feat A", status: "merged", proposedAt: "2026-06-01T10:00:00.000Z", resolvedAt: "2026-06-01T11:00:00.000Z" },
    { number: 2, branch: "feat-b", url: "https://github.com/mitosisdev/mito/pull/2", title: "feat B", status: "merged", proposedAt: "2026-06-02T10:00:00.000Z", resolvedAt: "2026-06-02T11:00:00.000Z" },
    { number: 3, branch: "feat-c", url: "https://github.com/mitosisdev/mito/pull/3", title: "feat C", status: "open",   proposedAt: "2026-06-03T10:00:00.000Z" },
  ],
  buildSessions: [
    { id: "2026-06-01T00:00:00.000Z", startedAt: "2026-06-01T00:00:00.000Z", prsOpened: 1 },
    { id: "2026-06-02T00:00:00.000Z", startedAt: "2026-06-02T00:00:00.000Z", prsOpened: 1 },
  ],
});

// ── Section presence ──────────────────────────────────────────────────────────

describe("generateReadme — title and tagline", () => {
  test("starts with # mito", () => {
    const out = generateReadme(makeState(), REGISTRY);
    expect(out.startsWith("# mito\n")).toBe(true);
  });

  test("contains the one-liner tagline", () => {
    const out = generateReadme(makeState(), REGISTRY);
    expect(out).toContain("An autonomous AI dev shop");
    expect(out).toContain("mito plans, builds, and ships open-source tools");
  });
});

describe("generateReadme — stats section", () => {
  test("contains a Stats heading", () => {
    const out = generateReadme(STATE_WITH_DATA, REGISTRY);
    expect(out).toMatch(/##\s+Stats/);
  });

  test("total projects matches registry length", () => {
    const out = generateReadme(STATE_WITH_DATA, REGISTRY);
    // 2 projects in fixture
    expect(out).toContain("2");
  });

  test("merged PRs counts only merged status", () => {
    const out = generateReadme(STATE_WITH_DATA, REGISTRY);
    // 2 merged PRs (not the open one)
    expect(out).toMatch(/Merged PRs.*2|2.*Merged PRs/i);
  });

  test("build sessions count matches state", () => {
    const out = generateReadme(STATE_WITH_DATA, REGISTRY);
    expect(out).toMatch(/Build sessions.*2|2.*Build sessions/i);
  });

  test("last session date appears in output", () => {
    const out = generateReadme(STATE_WITH_DATA, REGISTRY);
    // last session startedAt is "2026-06-02T00:00:00.000Z" → date portion
    expect(out).toContain("2026-06-02");
  });

  test("shows N/A when there are no sessions", () => {
    const out = generateReadme(makeState(), REGISTRY);
    expect(out).toContain("N/A");
  });

  test("zero merged PRs when state is empty", () => {
    const out = generateReadme(makeState(), REGISTRY);
    expect(out).toMatch(/Merged PRs.*0|0.*Merged PRs/i);
  });
});

describe("generateReadme — projects table", () => {
  test("contains a Projects heading", () => {
    const out = generateReadme(STATE_WITH_DATA, REGISTRY);
    expect(out).toMatch(/##\s+Projects/);
  });

  test("includes every project name", () => {
    const out = generateReadme(STATE_WITH_DATA, REGISTRY);
    for (const p of REGISTRY.projects) {
      expect(out).toContain(p.name);
    }
  });

  test("includes every project description", () => {
    const out = generateReadme(STATE_WITH_DATA, REGISTRY);
    for (const p of REGISTRY.projects) {
      expect(out).toContain(p.description);
    }
  });

  test("includes GitHub repo links", () => {
    const out = generateReadme(STATE_WITH_DATA, REGISTRY);
    for (const p of REGISTRY.projects) {
      expect(out).toContain(`https://github.com/${p.repo}`);
    }
  });

  test("table has name, description, repo columns", () => {
    const out = generateReadme(STATE_WITH_DATA, REGISTRY);
    const tableHeaderLine = out.split("\n").find((l) => l.includes("Name") && l.includes("Description") && l.includes("Repo"));
    expect(tableHeaderLine).toBeDefined();
  });

  test("empty registry produces empty table body", () => {
    const out = generateReadme(makeState(), { projects: [] });
    // Table header still present; no project rows
    expect(out).toMatch(/##\s+Projects/);
    expect(out).not.toContain("gitstory");
  });
});

describe("generateReadme — how it works section", () => {
  test("contains a How it works heading", () => {
    const out = generateReadme(makeState(), REGISTRY);
    expect(out).toMatch(/##\s+How it works/i);
  });

  test("contains at least 3 sentences", () => {
    const out = generateReadme(makeState(), REGISTRY);
    // Extract section text after the heading
    const match = out.match(/##\s+How it works([\s\S]*?)(?=\n##|\n---|$)/i);
    expect(match).not.toBeNull();
    const sectionText = match![0];
    // Count sentence-ending punctuation
    const sentences = sectionText.match(/[.!?]+/g) ?? [];
    expect(sentences.length).toBeGreaterThanOrEqual(3);
  });
});

describe("generateReadme — footer", () => {
  test("footer contains Built by mito", () => {
    const out = generateReadme(makeState(), REGISTRY);
    expect(out).toContain("Built by");
    expect(out).toContain("mito");
  });

  test("footer links to github.com/mitosisdev/mito", () => {
    const out = generateReadme(makeState(), REGISTRY);
    expect(out).toContain("https://github.com/mitosisdev/mito");
  });

  test("footer mentions autonomous AI", () => {
    const out = generateReadme(makeState(), REGISTRY);
    expect(out.toLowerCase()).toContain("autonomous");
  });
});

describe("generateReadme — output shape", () => {
  test("returns a non-empty string", () => {
    const out = generateReadme(makeState(), REGISTRY);
    expect(typeof out).toBe("string");
    expect(out.length).toBeGreaterThan(0);
  });

  test("ends with a newline", () => {
    const out = generateReadme(makeState(), REGISTRY);
    expect(out.endsWith("\n")).toBe(true);
  });
});
