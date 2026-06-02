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

test("parseConfig surfaces github repo + token when present", () => {
  const cfg = parseConfig({
    X_API_KEY: "k", X_API_SECRET: "s",
    X_ACCESS_TOKEN: "t", X_ACCESS_SECRET: "ts",
    MITO_GITHUB_REPO: "mitosisdev/mito",
    GITHUB_TOKEN: "ghp_xxx",
  });
  expect(cfg.github.repo).toBe("mitosisdev/mito");
  expect(cfg.github.token).toBe("ghp_xxx");
});

test("parseConfig leaves github fields undefined when absent (X-only flow still works)", () => {
  const cfg = parseConfig({
    X_API_KEY: "k", X_API_SECRET: "s",
    X_ACCESS_TOKEN: "t", X_ACCESS_SECRET: "ts",
  });
  expect(cfg.github.repo).toBeUndefined();
  expect(cfg.github.token).toBeUndefined();
});

test("parseConfig defaults the PR-size caps to 12 files / 600 lines", () => {
  const cfg = parseConfig({
    X_API_KEY: "k", X_API_SECRET: "s",
    X_ACCESS_TOKEN: "t", X_ACCESS_SECRET: "ts",
  });
  expect(cfg.maxPrFiles).toBe(12);
  expect(cfg.maxPrLines).toBe(600);
});

test("parseConfig reads the PR-size caps from env when set", () => {
  const cfg = parseConfig({
    X_API_KEY: "k", X_API_SECRET: "s",
    X_ACCESS_TOKEN: "t", X_ACCESS_SECRET: "ts",
    MITO_MAX_PR_FILES: "5", MITO_MAX_PR_LINES: "120",
  });
  expect(cfg.maxPrFiles).toBe(5);
  expect(cfg.maxPrLines).toBe(120);
});
