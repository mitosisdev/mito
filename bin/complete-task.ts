// bin/complete-task.ts — mark a BACKLOG.md item as done (strikethrough).
// Usage: bun bin/complete-task.ts "<pattern>"
// Output: {"done": true, "item": "<matched item text>"} | {"done": false, "reason": "no_match"}
import { readFileSync, writeFileSync } from "node:fs";
import { markTaskDone } from "../src/backlog";

const pattern = process.argv[2];

if (!pattern) {
  console.error("Usage: bun bin/complete-task.ts \"<pattern>\"");
  process.exit(1);
}

const backlogPath = new URL("../BACKLOG.md", import.meta.url).pathname;

const original = readFileSync(backlogPath, "utf8");
const updated = markTaskDone(original, pattern);

if (updated === original) {
  console.log(JSON.stringify({ done: false, reason: "no_match" }));
  process.exit(0);
}

// Find the matched item text to include in output
const ITEM_RE = /^-\s+(.+)$/m;
const lines = updated.split("\n");
const originalLines = original.split("\n");
let matchedItem = "";

for (let i = 0; i < lines.length; i++) {
  if (lines[i] !== originalLines[i]) {
    const m = ITEM_RE.exec(lines[i]!);
    if (m) matchedItem = m[1]!.replace(/^~~|~~$/g, "");
    break;
  }
}

writeFileSync(backlogPath, updated, "utf8");
console.log(JSON.stringify({ done: true, item: matchedItem }));
