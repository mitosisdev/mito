// tests/state.test.ts
import { test, expect } from "bun:test";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { rmSync } from "node:fs";
import { loadState, saveState, addCycle, emptyState } from "../src/state";

function tmpPath() { return join(tmpdir(), `mito-state-${Math.floor(performance.now())}-${process.pid}.json`); }

test("loadState returns empty state when file is missing", () => {
  const p = tmpPath();
  const s = loadState(p);
  expect(s.cycles).toEqual([]);
  expect(s.lastKnownGood).toBeNull();
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
