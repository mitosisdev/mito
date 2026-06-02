// tests/safety.test.ts
import { test, expect } from "bun:test";
import { checkContent } from "../src/safety";

test("clean short post passes", () => {
  const r = checkContent("Taught myself to validate config with zod today. Small win.");
  expect(r.ok).toBe(true);
  expect(r.reasons).toEqual([]);
});

test("over-length post fails", () => {
  const r = checkContent("x".repeat(281));
  expect(r.ok).toBe(false);
  expect(r.reasons).toContain("too_long");
});

test("post leaking a secret fails", () => {
  const r = checkContent("shipping with key sk-ABCD1234efgh5678ijkl yikes");
  expect(r.ok).toBe(false);
  expect(r.reasons).toContain("possible_secret");
});

test("post containing a URL is flagged (avoids the $0.20 surcharge)", () => {
  const r = checkContent("read more at https://example.com");
  expect(r.ok).toBe(false);
  expect(r.reasons).toContain("contains_url");
});
