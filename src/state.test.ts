// src/state.test.ts — tests for rejected-idea helpers
import { test, expect } from "bun:test";
import { emptyState, addRejectedIdea, wasRejected } from "./state";

test("addRejectedIdea appends an entry to rejectedIdeas", () => {
  const state = emptyState();
  const updated = addRejectedIdea(state, "feat: my idea", "reviewer closed it");
  expect(updated.rejectedIdeas).toHaveLength(1);
  expect(updated.rejectedIdeas[0].title).toBe("feat: my idea");
  expect(updated.rejectedIdeas[0].reason).toBe("reviewer closed it");
  expect(updated.rejectedIdeas[0].closedAt).toBeTruthy();
});

test("addRejectedIdea does not mutate original state", () => {
  const state = emptyState();
  addRejectedIdea(state, "feat: my idea", "reason");
  expect(state.rejectedIdeas).toHaveLength(0);
});

test("wasRejected returns true for a title that was rejected", () => {
  let state = emptyState();
  state = addRejectedIdea(state, "feat: rejected feature", "not wanted");
  expect(wasRejected(state, "feat: rejected feature")).toBe(true);
});

test("wasRejected returns false for a title not in rejectedIdeas", () => {
  let state = emptyState();
  state = addRejectedIdea(state, "feat: rejected feature", "not wanted");
  expect(wasRejected(state, "feat: different feature")).toBe(false);
});

test("wasRejected returns false on empty state", () => {
  const state = emptyState();
  expect(wasRejected(state, "feat: anything")).toBe(false);
});

test("addRejectedIdea accumulates multiple entries", () => {
  let state = emptyState();
  state = addRejectedIdea(state, "feat: idea one", "not useful");
  state = addRejectedIdea(state, "feat: idea two", "out of scope");
  expect(state.rejectedIdeas).toHaveLength(2);
  expect(wasRejected(state, "feat: idea one")).toBe(true);
  expect(wasRejected(state, "feat: idea two")).toBe(true);
});
