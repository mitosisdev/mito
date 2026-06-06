import { test, expect } from "bun:test";
import { loadBacklog } from "./backlog";
import { join } from "node:path";

const BACKLOG_PATH = join(import.meta.dir, "../BACKLOG.md");

const CHANGELOOM_MARKERS = [
  ".github/workflows/ci.yml",
  "src/parser.ts",
  "src/formatter.ts",
  "src/config.ts",
  "bin/changeloom.ts",
];

test("all 5 changeloom Build-in-public items are marked as done", async () => {
  const tasks = await loadBacklog(BACKLOG_PATH);
  const changeloom = tasks.filter((t) => t.project === "changeloom");

  for (const marker of CHANGELOOM_MARKERS) {
    const task = changeloom.find((t) => t.text.includes(marker));
    expect(task, `task containing "${marker}" should exist`).toBeDefined();
    expect(
      task?.done,
      `task "${marker}" should be done (~~strikethrough~~ or ✓ marker)`
    ).toBe(true);
  }
});
