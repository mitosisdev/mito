// tests/preflight.test.ts — unit tests for buildPreflight pure function
import { test, expect } from "bun:test";
import { buildPreflight } from "../src/preflight";
import type { State } from "../src/state";
import type { Ledger } from "../src/spend";

function makeState(overrides: Partial<State & { ledger?: Ledger }> = {}): State & { ledger?: Ledger } {
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

const NOW = "2026-06-03T12:00:00.000Z";
const CAP = 30;

// Zero state: no cycles, no rejected ideas, empty backlog
test("zero state: proceed true, spendMode full, cycles 0, empty arrays", () => {
  const result = buildPreflight(makeState(), "", NOW, CAP);
  expect(result.proceed).toBe(true);
  expect(result.spendMode).toBe("full");
  expect(result.cycles).toBe(0);
  expect(result.pendingTasks).toEqual([]);
  expect(result.rejectedIdeas).toEqual([]);
});

// cycles equals state.cycles.length
test("cycles equals state.cycles.length", () => {
  const state = makeState({
    cycles: [
      { id: 1, timestamp: NOW, action: "ship", branch: "feat/a", testsPassed: true, committed: true, posted: true },
      { id: 2, timestamp: NOW, action: "ship", branch: "feat/b", testsPassed: true, committed: true, posted: false },
    ],
  });
  const result = buildPreflight(state, "", NOW, CAP);
  expect(result.cycles).toBe(2);
});

// rejectedIdeas contains their titles
test("rejectedIdeas is a list of titles from state.rejectedIdeas", () => {
  const state = makeState({
    rejectedIdeas: [
      { title: "feat: add flying cars", reason: "out of scope", closedAt: NOW },
      { title: "chore: remove everything", reason: "bad idea", closedAt: NOW },
    ],
  });
  const result = buildPreflight(state, "", NOW, CAP);
  expect(result.rejectedIdeas).toEqual(["feat: add flying cars", "chore: remove everything"]);
});

// pendingTasks contains only non-done backlog items
test("pendingTasks filters out done items, keeps pending", () => {
  const backlogMarkdown = `# Backlog

## Safety
- ~~Done item that is finished~~
- Pending item still to do

## Later
- Another pending item
`;
  const result = buildPreflight(makeState(), backlogMarkdown, NOW, CAP);
  expect(result.pendingTasks).toHaveLength(2);
  expect(result.pendingTasks.every((t) => !t.done)).toBe(true);
  expect(result.pendingTasks.some((t) => t.text.includes("Pending item"))).toBe(true);
  expect(result.pendingTasks.some((t) => t.text.includes("Another pending item"))).toBe(true);
});

// Done items are excluded from pendingTasks
test("done items are not included in pendingTasks", () => {
  const backlogMarkdown = `# Backlog

## Get better, not just busy
- ~~Add a linter (Biome) and test coverage; climb the numbers.~~ ✓ PR #4
`;
  const result = buildPreflight(makeState(), backlogMarkdown, NOW, CAP);
  expect(result.pendingTasks).toHaveLength(0);
});

// spendMode is degraded when spend is >= 90% of cap
test("spendMode is degraded when monthly spend is at 90% of cap", () => {
  const state = makeState({
    ledger: {
      entries: [{ timestamp: NOW, amountUsd: 27, provider: "anthropic" }],
    },
  });
  const result = buildPreflight(state, "", NOW, CAP);
  expect(result.spendMode).toBe("degraded");
});

// spendMode is full when spend is below 90% of cap
test("spendMode is full when monthly spend is below 90% of cap", () => {
  const state = makeState({
    ledger: {
      entries: [{ timestamp: NOW, amountUsd: 10, provider: "anthropic" }],
    },
  });
  const result = buildPreflight(state, "", NOW, CAP);
  expect(result.spendMode).toBe("full");
});

// BacklogTask shape is preserved in pendingTasks output
test("pendingTasks items have correct shape (project, section, text, done)", () => {
  const backlogMarkdown = `# Backlog

## Safety
- **[mito]** Fix the thing
`;
  const result = buildPreflight(makeState(), backlogMarkdown, NOW, CAP);
  expect(result.pendingTasks).toHaveLength(1);
  const task = result.pendingTasks[0]!;
  expect(task.project).toBe("mito");
  expect(task.section).toBe("Safety");
  expect(task.text).toBe("Fix the thing");
  expect(task.done).toBe(false);
});

// Mixed backlog: some done, some pending — only pending returned
test("mixed backlog: only non-done tasks in pendingTasks", () => {
  const backlogMarkdown = `# Backlog

## Now
- ~~Completed task~~
- **[mito]** Active task A
- **[mito]** Active task B

## Later
- ~~Another done task~~
- Future task
`;
  const result = buildPreflight(makeState(), backlogMarkdown, NOW, CAP);
  expect(result.pendingTasks).toHaveLength(3);
  expect(result.pendingTasks.every((t) => !t.done)).toBe(true);
});
