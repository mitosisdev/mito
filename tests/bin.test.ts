// tests/bin.test.ts
import { test, expect } from "bun:test";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeFileSync, rmSync } from "node:fs";
import { $ } from "bun";

test("preflight reports killswitch when STOP file present", async () => {
  const stop = join(tmpdir(), `mito-STOP-${process.pid}`);
  writeFileSync(stop, "stop");
  const env = { ...process.env, X_API_KEY: "k", X_API_SECRET: "s", X_ACCESS_TOKEN: "t", X_ACCESS_SECRET: "ts", MITO_KILLSWITCH_PATH: stop };
  const out = await $`bun bin/preflight.ts`.env(env).text();
  expect(JSON.parse(out.trim()).proceed).toBe(false);
  rmSync(stop, { force: true });
});
