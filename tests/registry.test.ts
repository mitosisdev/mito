// tests/registry.test.ts
import { test, expect } from "bun:test";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { rmSync } from "node:fs";
import {
  loadRegistry,
  saveRegistry,
  addProject,
  hasProject,
  emptyRegistry,
  type Project,
} from "../src/registry";

function tmpPath() {
  return join(tmpdir(), `mito-registry-${Math.floor(performance.now())}-${process.pid}.json`);
}

function sample(repo: string): Project {
  return { repo, name: repo.split("/")[1]!, description: "d", createdAt: "2026-01-01T00:00:00.000Z" };
}

test("loadRegistry returns empty when the file is missing", () => {
  const p = tmpPath();
  const reg = loadRegistry(p);
  expect(reg.projects).toEqual([]);
});

test("addProject appends; hasProject finds by repo id", () => {
  let reg = emptyRegistry();
  expect(hasProject(reg, "mitosisdev/widget")).toBe(false);
  reg = addProject(reg, sample("mitosisdev/widget"));
  expect(reg.projects).toHaveLength(1);
  expect(hasProject(reg, "mitosisdev/widget")).toBe(true);
});

test("addProject is idempotent on repo id (no duplicates)", () => {
  let reg = emptyRegistry();
  reg = addProject(reg, sample("mitosisdev/widget"));
  reg = addProject(reg, sample("mitosisdev/widget"));
  expect(reg.projects).toHaveLength(1);
});

test("save/load round-trips through a temp file", () => {
  const p = tmpPath();
  let reg = emptyRegistry();
  reg = addProject(reg, sample("mitosisdev/alpha"));
  reg = addProject(reg, sample("mitosisdev/beta"));
  saveRegistry(p, reg);

  const loaded = loadRegistry(p);
  expect(loaded.projects.map((x) => x.repo)).toEqual([
    "mitosisdev/alpha",
    "mitosisdev/beta",
  ]);
  rmSync(p, { force: true });
});

test("loadRegistry backfills projects for a partial file", () => {
  const p = tmpPath();
  // biome-ignore lint/suspicious/noExplicitAny: simulates an older registry file
  saveRegistry(p, {} as any);
  const loaded = loadRegistry(p);
  expect(Array.isArray(loaded.projects)).toBe(true);
  rmSync(p, { force: true });
});
