// tests/changelog.test.ts
import { test, expect } from "bun:test";
import { addChangelogEntry } from "../src/changelog";

test("addChangelogEntry prepends a dated bullet under the header", () => {
  const existing = "# Changelog\n\n- 2026-06-01 — first thing\n";
  const out = addChangelogEntry(existing, "second thing", "2026-06-02");
  const lines = out.split("\n").filter((l) => l.startsWith("- "));
  expect(lines[0]).toBe("- 2026-06-02 — second thing");
  expect(lines[1]).toBe("- 2026-06-01 — first thing");
});

test("addChangelogEntry seeds a header when input is empty", () => {
  const out = addChangelogEntry("", "first", "2026-06-02");
  expect(out.startsWith("# Changelog")).toBe(true);
  expect(out).toContain("- 2026-06-02 — first");
});

test("addChangelogEntry formats a merged-PR entry correctly", () => {
  const existing = "# Changelog\n";
  const entry = "feat: some title";
  const out = addChangelogEntry(existing, entry, "2026-06-03");
  const lines = out.split("\n").filter((l) => l.startsWith("- "));
  expect(lines[0]).toBe("- 2026-06-03 — feat: some title");
});

test("addChangelogEntry formats a closed-PR entry correctly", () => {
  const existing = "# Changelog\n";
  const entry = "Closed #5: some title — reason text";
  const out = addChangelogEntry(existing, entry, "2026-06-03");
  const lines = out.split("\n").filter((l) => l.startsWith("- "));
  expect(lines[0]).toBe("- 2026-06-03 — Closed #5: some title — reason text");
});
