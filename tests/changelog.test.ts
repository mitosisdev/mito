// tests/changelog.test.ts
import { test, expect } from "bun:test";
import { addChangelogEntry, parseChangelog } from "../src/changelog";

// ── addChangelogEntry ──────────────────────────────────────────────────────

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

test("addChangelogEntry entry format is '- YYYY-MM-DD — <text>'", () => {
  const out = addChangelogEntry("", "my entry", "2026-06-03");
  expect(out).toContain("- 2026-06-03 — my entry");
});

test("addChangelogEntry always ends with a trailing newline", () => {
  const out1 = addChangelogEntry("", "e", "2026-01-01");
  expect(out1.endsWith("\n")).toBe(true);

  const out2 = addChangelogEntry("# Changelog\n\n- 2026-06-01 — old\n", "new", "2026-06-02");
  expect(out2.endsWith("\n")).toBe(true);
});

test("addChangelogEntry produces no double blank lines", () => {
  const existing = "# Changelog\n\n- 2026-06-01 — first\n";
  const out = addChangelogEntry(existing, "second", "2026-06-02");
  expect(out).not.toContain("\n\n\n");
});

test("addChangelogEntry preserves multiple existing entries in order (newest first after insert)", () => {
  const existing = [
    "# Changelog",
    "",
    "- 2026-06-03 — third",
    "- 2026-06-02 — second",
    "- 2026-06-01 — first",
    "",
  ].join("\n");

  const out = addChangelogEntry(existing, "fourth", "2026-06-04");
  const bullets = out.split("\n").filter((l) => l.startsWith("- "));
  expect(bullets[0]).toBe("- 2026-06-04 — fourth");
  expect(bullets[1]).toBe("- 2026-06-03 — third");
  expect(bullets[2]).toBe("- 2026-06-02 — second");
  expect(bullets[3]).toBe("- 2026-06-01 — first");
});

// ── parseChangelog ─────────────────────────────────────────────────────────

test("parseChangelog returns empty array for empty file", () => {
  expect(parseChangelog("")).toEqual([]);
});

test("parseChangelog returns empty array for header-only file", () => {
  expect(parseChangelog("# Changelog\n")).toEqual([]);
});

test("parseChangelog parses a single entry", () => {
  const text = "# Changelog\n\n- 2026-06-02 — my entry\n";
  const entries = parseChangelog(text);
  expect(entries).toHaveLength(1);
  expect(entries[0]).toEqual({ date: "2026-06-02", entry: "my entry" });
});

test("parseChangelog parses multiple entries in order (newest first)", () => {
  const text = [
    "# Changelog",
    "",
    "- 2026-06-03 — third entry",
    "- 2026-06-02 — second entry",
    "- 2026-06-01 — first entry",
    "",
  ].join("\n");

  const entries = parseChangelog(text);
  expect(entries).toHaveLength(3);
  expect(entries[0]).toEqual({ date: "2026-06-03", entry: "third entry" });
  expect(entries[1]).toEqual({ date: "2026-06-02", entry: "second entry" });
  expect(entries[2]).toEqual({ date: "2026-06-01", entry: "first entry" });
});

test("parseChangelog handles entries with em-dash in the text", () => {
  const text = "# Changelog\n\n- 2026-06-02 — feat: something — with extras\n";
  const entries = parseChangelog(text);
  expect(entries).toHaveLength(1);
  // Only split on the first em-dash separator after the date
  expect(entries[0].date).toBe("2026-06-02");
  expect(entries[0].entry).toContain("feat: something");
});
