import { test, expect } from "bun:test";
import { parseNumstatFiles, checkThrash } from "../src/thrash";
import type { PullRequestRecord } from "../src/state";

// ─── parseNumstatFiles ───────────────────────────────────────────────────────

test("parses standard numstat lines", () => {
  const numstat = "10\t2\tsrc/foo.ts\n5\t0\tsrc/bar.ts\n";
  expect(parseNumstatFiles(numstat)).toEqual(["src/foo.ts", "src/bar.ts"]);
});

test("handles binary file lines (- - path)", () => {
  const numstat = "-\t-\tassets/logo.png\n3\t1\tsrc/app.ts";
  expect(parseNumstatFiles(numstat)).toEqual(["assets/logo.png", "src/app.ts"]);
});

test("ignores blank lines", () => {
  const numstat = "\n10\t2\tsrc/foo.ts\n\n";
  expect(parseNumstatFiles(numstat)).toEqual(["src/foo.ts"]);
});

test("returns empty array for empty numstat", () => {
  expect(parseNumstatFiles("")).toEqual([]);
});

// ─── checkThrash ─────────────────────────────────────────────────────────────

function closedPr(number: number, files: string[]): Pick<PullRequestRecord, "number" | "status" | "files"> {
  return { number, status: "closed", files };
}

test("no thrash when no closed PRs have file lists", () => {
  const prs = [{ number: 1, status: "closed" as const, files: undefined }];
  const result = checkThrash(prs, ["src/foo.ts"]);
  expect(result.thrash).toBe(false);
});

test("no thrash when current files are completely new", () => {
  const prs = [closedPr(1, ["src/old.ts"])];
  const result = checkThrash(prs, ["src/new.ts"]);
  expect(result.thrash).toBe(false);
});

test("thrash detected when all current files were in a closed PR", () => {
  const prs = [closedPr(3, ["src/foo.ts", "src/bar.ts"])];
  const result = checkThrash(prs, ["src/foo.ts", "src/bar.ts"]);
  expect(result.thrash).toBe(true);
  expect(result.closedPrNumber).toBe(3);
  expect(result.overlapFiles).toEqual(["src/foo.ts", "src/bar.ts"]);
});

test("thrash detected at >=50% overlap threshold", () => {
  const prs = [closedPr(5, ["src/a.ts", "src/b.ts", "src/c.ts"])];
  // 2 out of 3 current files overlap → 66% → thrash
  const result = checkThrash(prs, ["src/a.ts", "src/b.ts", "src/new.ts"]);
  expect(result.thrash).toBe(true);
});

test("no thrash below 50% overlap threshold", () => {
  const prs = [closedPr(5, ["src/a.ts"])];
  // 1 out of 3 current files overlap → 33% → no thrash
  const result = checkThrash(prs, ["src/a.ts", "src/new1.ts", "src/new2.ts"]);
  expect(result.thrash).toBe(false);
});

test("ignores merged and open PRs, only checks closed ones", () => {
  const prs = [
    { number: 1, status: "merged" as const, files: ["src/foo.ts"] },
    { number: 2, status: "open" as const, files: ["src/foo.ts"] },
    closedPr(3, ["src/foo.ts"]),
  ];
  const result = checkThrash(prs, ["src/foo.ts"]);
  expect(result.thrash).toBe(true);
  expect(result.closedPrNumber).toBe(3);
});

test("no thrash when current files is empty", () => {
  const prs = [closedPr(1, ["src/foo.ts"])];
  expect(checkThrash(prs, []).thrash).toBe(false);
});
