// bin/gen-digest.ts — generate a weekly Markdown digest from mito state.
//
// Reads MITO_STATE_PATH (env, default ./mito-state.json) for PR/build activity
// and BACKLOG.md for the "What's Next" section, then prints a self-contained
// Markdown digest to stdout. Pass --out <path> to write to a file instead.
//
// Usage:
//   bun bin/gen-digest.ts                  # prints digest to stdout
//   bun bin/gen-digest.ts --out digest.md  # writes to a file
//   bun bin/gen-digest.ts --days 14        # use a 14-day window
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { loadState } from "../src/state.js";
import { loadBacklogSync } from "../src/backlog.js";
import { generateDigest } from "../src/gen-digest.js";

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i !== -1 ? process.argv[i + 1] : undefined;
}

const statePath = process.env.MITO_STATE_PATH ?? "./mito-state.json";
const backlogPath = process.env.MITO_BACKLOG_PATH
  ?? new URL("../BACKLOG.md", import.meta.url).pathname;

const daysArg = argValue("--days");
const windowDays = daysArg ? Number(daysArg) : 7;

const state = loadState(statePath);
const backlog = loadBacklogSync(backlogPath);

const markdown = generateDigest(state, { backlog, windowDays });

const outArg = argValue("--out");
if (outArg) {
  const outPath = resolve(outArg);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, markdown, "utf8");
  console.log(JSON.stringify({ written: outPath, windowDays }));
} else {
  process.stdout.write(markdown);
}
