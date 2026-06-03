import { test, expect } from "bun:test";
import { parseBacklog, markTaskDone } from "../src/backlog";

const FIXTURE = `# Backlog

What mito plans.

## Safety
- Scan every diff for secrets. ✓ shipped
- Cap the diff size. ✓ shipped
- Detect thrash — don't keep churning.

## Get better, not just busy
- ~~Add a linter.~~ ✓ PR #4
- **[mito]** Add \`src/backlog.ts\` — parse BACKLOG.md.
- **[gitstory]** Parse git log into Commit[].

## Later
- Public live dashboard.
`;

test("returns empty array for empty string", () => {
  expect(parseBacklog("")).toEqual([]);
});

test("returns empty array for markdown with no list items", () => {
  expect(parseBacklog("# Title\n\nSome prose.")).toEqual([]);
});

test("struck-through items are marked done", () => {
  const tasks = parseBacklog(FIXTURE);
  const linter = tasks.find((t) => t.text.includes("linter"));
  expect(linter).toBeDefined();
  expect(linter?.done).toBe(true);
});

test("non-struck items are not done", () => {
  const tasks = parseBacklog(FIXTURE);
  const thrash = tasks.find((t) => t.text.includes("thrash"));
  expect(thrash).toBeDefined();
  expect(thrash?.done).toBe(false);
});

test("extracts project tag from [mito] prefix", () => {
  const tasks = parseBacklog(FIXTURE);
  const backlogTask = tasks.find((t) => t.text.includes("src/backlog.ts"));
  expect(backlogTask?.project).toBe("mito");
});

test("extracts project tag from [gitstory] prefix", () => {
  const tasks = parseBacklog(FIXTURE);
  const gitstory = tasks.find((t) => t.text.includes("Commit"));
  expect(gitstory?.project).toBe("gitstory");
});

test("items without project tag have empty project string", () => {
  const tasks = parseBacklog(FIXTURE);
  const thrash = tasks.find((t) => t.text.includes("thrash"));
  expect(thrash?.project).toBe("");
});

test("section is the heading under which the item appears", () => {
  const tasks = parseBacklog(FIXTURE);
  const thrash = tasks.find((t) => t.text.includes("thrash"));
  expect(thrash?.section).toBe("Safety");
  const backlogTask = tasks.find((t) => t.text.includes("src/backlog.ts"));
  expect(backlogTask?.section).toBe("Get better, not just busy");
});

test("text does not include the project tag prefix", () => {
  const tasks = parseBacklog(FIXTURE);
  const backlogTask = tasks.find((t) => t.text.includes("src/backlog.ts"));
  expect(backlogTask?.text.startsWith("[mito]")).toBe(false);
  expect(backlogTask?.text.startsWith("**[mito]**")).toBe(false);
});

test("text does not include strikethrough markers", () => {
  const tasks = parseBacklog(FIXTURE);
  const linter = tasks.find((t) => t.done);
  expect(linter?.text.includes("~~")).toBe(false);
});

test("returns one task per bullet point", () => {
  const tasks = parseBacklog(FIXTURE);
  // FIXTURE has 8 bullet points (3 Safety + 3 Get better + 1 Later)
  expect(tasks).toHaveLength(7);
});

// markTaskDone tests
test("markTaskDone wraps matching item in strikethrough", () => {
  const md = "## Safety\n- Detect thrash — don't keep churning.\n- Other item.";
  const result = markTaskDone(md, "thrash");
  expect(result).toContain("~~Detect thrash");
  expect(result).not.toContain("~~Other item");
});

test("markTaskDone is case-insensitive", () => {
  const md = "## Safety\n- Detect Thrash — something.";
  const result = markTaskDone(md, "THRASH");
  expect(result).toContain("~~Detect Thrash");
});

test("markTaskDone is idempotent on already-done items", () => {
  const md = "## Safety\n- ~~Detect thrash — something.~~";
  const result = markTaskDone(md, "thrash");
  // Should not double-wrap
  expect(result).not.toContain("~~~~");
  expect(result).toContain("~~Detect thrash");
});

test("markTaskDone returns unchanged markdown when no match", () => {
  const md = "## Safety\n- Some unrelated item.";
  const result = markTaskDone(md, "totally missing");
  expect(result).toBe(md);
});

test("markTaskDone handles [project] prefixed items", () => {
  const md = "## Get better\n- **[mito]** Add `src/backlog.ts` — parse into typed queue.";
  const result = markTaskDone(md, "backlog.ts");
  expect(result).toContain("~~**[mito]** Add");
});
