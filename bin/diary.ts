// bin/diary.ts — generate a session build diary entry and write it to docs/sessions/.
//
// Usage:
//   bun bin/diary.ts [--tasks-considered "task1" "task2" ...] [--tasks-picked "task1" ...]
//
// Env:
//   MITO_STATE_PATH   — path to state file (default: ./mito-state.json)
//   ANTHROPIC_KEY     — Anthropic key; if set, uses AI generation; otherwise uses template
//
// Writes: docs/sessions/YYYY-MM-DD-N.md
// Prints: the written file path to stdout
// Does NOT commit.

import { $ } from "bun";
import { mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { loadState } from "../src/state";
import { generateDiaryEntry, sessionFilename } from "../src/diary";

// Parse CLI args: --tasks-considered "a" "b" --tasks-picked "a"
function parseArgs(argv: string[]): { tasksConsidered: string[]; tasksPicked: string[] } {
  const tasksConsidered: string[] = [];
  const tasksPicked: string[] = [];
  let mode: "considered" | "picked" | null = null;

  for (const arg of argv) {
    if (arg === "--tasks-considered") {
      mode = "considered";
    } else if (arg === "--tasks-picked") {
      mode = "picked";
    } else if (arg.startsWith("--")) {
      mode = null;
    } else if (mode === "considered") {
      tasksConsidered.push(arg);
    } else if (mode === "picked") {
      tasksPicked.push(arg);
    }
  }

  return { tasksConsidered, tasksPicked };
}

// Determine the session date (YYYY-MM-DD) and N (count of existing files for today + 1)
function resolveSession(docsSessionsDir: string, today: string): { sessionDate: string; sessionN: number } {
  let existingToday = 0;
  try {
    const files = readdirSync(docsSessionsDir);
    for (const f of files) {
      if (f.startsWith(today) && f.endsWith(".md")) {
        existingToday++;
      }
    }
  } catch {
    // Dir doesn't exist yet — 0 existing files
  }
  return { sessionDate: today, sessionN: existingToday + 1 };
}

const statePath = process.env.MITO_STATE_PATH ?? "./mito-state.json";
const anthropicKey = process.env.ANTHROPIC_KEY;

const { tasksConsidered, tasksPicked } = parseArgs(process.argv.slice(2));

// Load state
const state = loadState(statePath);

// Get recent git log
let gitLog = "";
try {
  const result = await $`git log --oneline -20`.quiet();
  gitLog = result.stdout.toString().trim();
} catch {
  gitLog = "";
}

// Resolve docs/sessions/ path relative to cwd
const docsSessionsDir = join(process.cwd(), "docs", "sessions");

// Determine today's date in ISO format (YYYY-MM-DD)
const today = new Date().toISOString().slice(0, 10);
const { sessionDate, sessionN } = resolveSession(docsSessionsDir, today);

// Generate diary content
const content = await generateDiaryEntry({
  state,
  gitLog,
  tasksConsidered,
  tasksPicked,
  sessionDate,
  sessionN,
  anthropicKey,
});

// Ensure directory exists
mkdirSync(docsSessionsDir, { recursive: true });

// Write the file
const filename = sessionFilename(sessionDate, sessionN);
const outPath = join(docsSessionsDir, filename);
writeFileSync(outPath, content + "\n");

// Print the output path to stdout (caller decides whether to commit)
console.log(outPath);
