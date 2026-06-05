import { test, expect } from "bun:test";
import { parseBacklog, loadBacklog } from "./backlog";
import { join } from "node:path";
import { writeFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";

const FIXTURE = `
# Backlog

## Safety
- Scan every code diff for secrets before opening a PR.
- Cap the size of a single autonomous change.

## Get better, not just busy
- ~~Add a linter (Biome) and test coverage.~~
- **[mito]** Add \`src/backlog.ts\` — parse BACKLOG.md into a typed task queue.
- **[gitstory]** Parse \`git log\` into a typed Commit[] data model.

## Later
- Public live dashboard.
- **[mito + gitstory]** Run mito's build loop against gitstory.
`.trim();

test("parseBacklog returns the correct number of tasks", () => {
  const tasks = parseBacklog(FIXTURE);
  expect(tasks.length).toBe(7);
});

test("done tasks (strikethrough ~~text~~) set done:true", () => {
  const tasks = parseBacklog(FIXTURE);
  const done = tasks.filter((t) => t.done);
  expect(done.length).toBe(1);
  expect(done[0].text).toContain("Add a linter (Biome)");
});

test("non-done tasks set done:false", () => {
  const tasks = parseBacklog(FIXTURE);
  const notDone = tasks.filter((t) => !t.done);
  expect(notDone.length).toBe(6);
});

test("section headings correctly assigned to tasks beneath them", () => {
  const tasks = parseBacklog(FIXTURE);

  const safety = tasks.filter((t) => t.section === "Safety");
  expect(safety.length).toBe(2);

  const better = tasks.filter((t) => t.section === "Get better, not just busy");
  expect(better.length).toBe(3);

  const later = tasks.filter((t) => t.section === "Later");
  expect(later.length).toBe(2);
});

test("[mito] prefix sets project='mito'", () => {
  const tasks = parseBacklog(FIXTURE);
  const mito = tasks.filter((t) => t.project === "mito");
  expect(mito.length).toBe(1);
  expect(mito[0].text).toContain("parse BACKLOG.md");
});

test("[gitstory] prefix sets project='gitstory'", () => {
  const tasks = parseBacklog(FIXTURE);
  const gitstory = tasks.filter((t) => t.project === "gitstory");
  expect(gitstory.length).toBe(1);
  expect(gitstory[0].text).toContain("git log");
});

test("no prefix sets project=''", () => {
  const tasks = parseBacklog(FIXTURE);
  const noProject = tasks.filter((t) => t.project === "");
  // Safety: 2, Get better (done linter): 1, Later (dashboard): 1, Later (compound [mito + gitstory]): 1 = 5
  expect(noProject.length).toBe(5);
});

test("compound project tag [mito + gitstory] leaves project=''", () => {
  const tasks = parseBacklog(FIXTURE);
  const compound = tasks.find((t) => t.text.includes("Run mito's build loop"));
  expect(compound).toBeDefined();
  expect(compound?.project).toBe("");
});

test("text strips the **[project]** prefix but keeps full task text", () => {
  const tasks = parseBacklog(FIXTURE);
  const mito = tasks.find((t) => t.project === "mito");
  expect(mito?.text).not.toMatch(/^\*\*\[mito\]\*\*/);
  expect(mito?.text).toContain("Add `src/backlog.ts`");
});

test("parseBacklog on empty string returns empty array", () => {
  expect(parseBacklog("")).toEqual([]);
});

test("task text is trimmed of surrounding whitespace", () => {
  const tasks = parseBacklog(FIXTURE);
  for (const t of tasks) {
    expect(t.text).toBe(t.text.trim());
  }
});

test("loadBacklog reads a file and returns parsed tasks", async () => {
  const path = join(tmpdir(), `backlog-test-${Date.now()}.md`);
  await writeFile(path, FIXTURE, "utf8");
  try {
    const tasks = await loadBacklog(path);
    expect(tasks.length).toBe(7);
    expect(tasks.some((t) => t.project === "mito")).toBe(true);
  } finally {
    await unlink(path);
  }
});

test("loadBacklog returns empty array for missing file", async () => {
  const tasks = await loadBacklog("/tmp/this-file-does-not-exist-mito-backlog.md");
  expect(tasks).toEqual([]);
});

// --- Inline completion marker tests ---

test("'text ✓ shipped' inline marker sets done:true", () => {
  const md = `
## Shipped
- Scan every code diff for secrets before opening a PR — never let a key reach a public commit. ✓ shipped
`.trim();
  const tasks = parseBacklog(md);
  expect(tasks.length).toBe(1);
  expect(tasks[0].done).toBe(true);
  expect(tasks[0].text).toBe(
    "Scan every code diff for secrets before opening a PR — never let a key reach a public commit."
  );
});

test("'text ✓ PR #N' inline marker sets done:true", () => {
  const md = `
## Shipped
- Add secret scanning ✓ PR #42
`.trim();
  const tasks = parseBacklog(md);
  expect(tasks.length).toBe(1);
  expect(tasks[0].done).toBe(true);
  expect(tasks[0].text).toBe("Add secret scanning");
});

test("'~~text~~ ✓ PR #N' strikethrough + PR reference sets done:true", () => {
  const md = `
## Shipped
- ~~Add a linter (Biome) and test coverage.~~ ✓ PR #7
`.trim();
  const tasks = parseBacklog(md);
  expect(tasks.length).toBe(1);
  expect(tasks[0].done).toBe(true);
  expect(tasks[0].text).toContain("Add a linter (Biome)");
});

test("plain task without ✓ marker stays done:false", () => {
  const md = `
## Pending
- Build something cool
`.trim();
  const tasks = parseBacklog(md);
  expect(tasks[0].done).toBe(false);
});
