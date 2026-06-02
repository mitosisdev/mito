// tests/state.test.ts
import { test, expect } from "bun:test";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { rmSync } from "node:fs";
import { loadState, saveState, addCycle, emptyState, recordProposedPr, markPrMerged, markPrClosed, addRejectedIdea, wasRejected } from "../src/state";

function tmpPath() { return join(tmpdir(), `mito-state-${Math.floor(performance.now())}-${process.pid}.json`); }

test("loadState returns empty state when file is missing", () => {
  const p = tmpPath();
  const s = loadState(p);
  expect(s.cycles).toEqual([]);
  expect(s.lastKnownGood).toBeNull();
});

test("recordProposedPr tracks an open PR; markPrMerged/markPrClosed update status", () => {
  let s = emptyState();
  s = recordProposedPr(s, { number: 7, branch: "mito/7", url: "u7", title: "add foo" });
  expect(s.pullRequests).toHaveLength(1);
  expect(s.pullRequests[0]!.status).toBe("open");
  expect(s.pullRequests[0]!.number).toBe(7);

  s = markPrMerged(s, 7, "deadbeef");
  expect(s.pullRequests[0]!.status).toBe("merged");
  expect(s.pullRequests[0]!.mergeSha).toBe("deadbeef");

  s = recordProposedPr(s, { number: 8, branch: "mito/8", url: "u8", title: "add bar" });
  s = markPrClosed(s, 8, "out of scope");
  const pr8 = s.pullRequests.find((p) => p.number === 8);
  expect(pr8).toBeDefined();
  expect(pr8?.status).toBe("closed");
  expect(pr8?.closeReason).toBe("out of scope");
});

test("loadState backfills an empty pullRequests array for older state files", () => {
  const p = tmpPath();
  // biome-ignore lint/suspicious/noExplicitAny: intentionally simulates a pre-v2 state file missing pullRequests
  saveState(p, { cycles: [], backlog: [], lastKnownGood: null } as any);
  const loaded = loadState(p);
  expect(Array.isArray(loaded.pullRequests)).toBe(true);
  rmSync(p, { force: true });
});

test("loadState backfills empty rejectedIdeas for older state files", () => {
  const p = tmpPath();
  // biome-ignore lint/suspicious/noExplicitAny: simulates pre-rejectedIdeas state file
  saveState(p, { cycles: [], backlog: [], lastKnownGood: null, pullRequests: [] } as any);
  const loaded = loadState(p);
  expect(Array.isArray(loaded.rejectedIdeas)).toBe(true);
  expect(loaded.rejectedIdeas).toHaveLength(0);
  rmSync(p, { force: true });
});

test("addRejectedIdea records title and reason; wasRejected finds exact match", () => {
  let s = emptyState();
  expect(wasRejected(s, "add foo")).toBe(false);
  s = addRejectedIdea(s, "add foo", "out of scope for now");
  expect(wasRejected(s, "add foo")).toBe(true);
  expect(wasRejected(s, "add bar")).toBe(false);
  expect(s.rejectedIdeas[0]?.title).toBe("add foo");
  expect(s.rejectedIdeas[0]?.reason).toBe("out of scope for now");
  expect(typeof s.rejectedIdeas[0]?.closedAt).toBe("string");
});

test("rejectedIdeas round-trips through saveState/loadState", () => {
  const p = tmpPath();
  let s = emptyState();
  s = addRejectedIdea(s, "bad idea", "not aligned with goals");
  saveState(p, s);
  const loaded = loadState(p);
  expect(loaded.rejectedIdeas).toHaveLength(1);
  expect(loaded.rejectedIdeas[0]?.title).toBe("bad idea");
  rmSync(p, { force: true });
});

test("addCycle appends and saveState/loadState round-trips", () => {
  const p = tmpPath();
  let s = emptyState();
  s = addCycle(s, { action: "added foo", branch: "mito/1", testsPassed: true, committed: true, posted: false });
  saveState(p, s);
  const loaded = loadState(p);
  expect(loaded.cycles).toHaveLength(1);
  expect(loaded.cycles[0]!.action).toBe("added foo");
  expect(typeof loaded.cycles[0]!.id).toBe("number");
  rmSync(p, { force: true });
});
