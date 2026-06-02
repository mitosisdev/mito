// tests/config.test.ts
import { test, expect } from "bun:test";
import { parseConfig } from "../src/config";

test("parseConfig accepts a complete env and applies defaults", () => {
  const cfg = parseConfig({
    X_API_KEY: "k", X_API_SECRET: "s",
    X_ACCESS_TOKEN: "t", X_ACCESS_SECRET: "ts",
  });
  expect(cfg.x.apiKey).toBe("k");
  expect(cfg.statePath).toBe("./mito-state.json");
  expect(cfg.spendCapUsd).toBe(30);
});

test("parseConfig throws when an X credential is missing", () => {
  expect(() => parseConfig({ X_API_KEY: "k" })).toThrow();
});
