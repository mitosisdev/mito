// tests/diffsize.test.ts — the diff-size guard bounds the blast radius of a
// single autonomous change. Pure: given counts + caps, allowed or blocked.
import { test, expect } from "bun:test";
import { checkDiffSize, parseNumstat, DEFAULT_MAX_FILES, DEFAULT_MAX_LINES } from "../src/diffsize";

const caps = { maxFiles: 12, maxLines: 600 };

test("a small diff is allowed", () => {
  const r = checkDiffSize({ files: 3, lines: 80 }, caps);
  expect(r.allowed).toBe(true);
});

test("exactly at the caps is allowed (cap is inclusive)", () => {
  const r = checkDiffSize({ files: 12, lines: 600 }, caps);
  expect(r.allowed).toBe(true);
});

test("too many files is blocked", () => {
  const r = checkDiffSize({ files: 13, lines: 10 }, caps);
  expect(r.allowed).toBe(false);
  expect(r.files).toBe(13);
  expect(r.lines).toBe(10);
});

test("too many lines is blocked", () => {
  const r = checkDiffSize({ files: 2, lines: 601 }, caps);
  expect(r.allowed).toBe(false);
});

test("both over is blocked", () => {
  const r = checkDiffSize({ files: 99, lines: 9999 }, caps);
  expect(r.allowed).toBe(false);
});

test("defaults are 12 files / 600 lines", () => {
  expect(DEFAULT_MAX_FILES).toBe(12);
  expect(DEFAULT_MAX_LINES).toBe(600);
});

test("parseNumstat sums added+deleted lines and counts files", () => {
  // `git diff --numstat` format: <added>\t<deleted>\t<path>
  const numstat = [
    "10\t2\tsrc/a.ts",
    "0\t5\tsrc/b.ts",
    "3\t3\tdocs/c.md",
  ].join("\n");
  const s = parseNumstat(numstat);
  expect(s.files).toBe(3);
  expect(s.lines).toBe(10 + 2 + 0 + 5 + 3 + 3);
});

test("parseNumstat treats binary files (- - path) as 0 lines but counts the file", () => {
  const numstat = "-\t-\tassets/logo.png\n5\t1\tsrc/a.ts";
  const s = parseNumstat(numstat);
  expect(s.files).toBe(2);
  expect(s.lines).toBe(6);
});

test("parseNumstat on empty input is 0 files / 0 lines", () => {
  const s = parseNumstat("");
  expect(s.files).toBe(0);
  expect(s.lines).toBe(0);
});
