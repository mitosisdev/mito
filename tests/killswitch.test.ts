// tests/killswitch.test.ts
import { test, expect } from "bun:test";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeFileSync, rmSync } from "node:fs";
import { isKilled } from "../src/killswitch";

test("isKilled is false when flag file is absent", () => {
  expect(isKilled(join(tmpdir(), `mito-stop-absent-${process.pid}`))).toBe(false);
});

test("isKilled is true when flag file exists", () => {
  const p = join(tmpdir(), `mito-stop-${process.pid}`);
  writeFileSync(p, "stop");
  expect(isKilled(p)).toBe(true);
  rmSync(p, { force: true });
});
