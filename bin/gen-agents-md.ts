// bin/gen-agents-md.ts — CLI entry point for the gen-agents-md tool.
//
// Usage:
//   bun bin/gen-agents-md.ts [dir]          — prints AGENTS.md to stdout
//   bun bin/gen-agents-md.ts [dir] --out <file>  — writes to file instead
//
// [dir] defaults to cwd if omitted.

import { writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { generateAgentsMd } from "../src/agents-md";

const args = process.argv.slice(2);

// Parse flags
let dir: string | undefined;
let outFile: string | undefined;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--out" && args[i + 1]) {
    outFile = args[i + 1];
    i++; // skip next arg
  } else if (!args[i].startsWith("--")) {
    dir = args[i];
  }
}

const targetDir = resolve(dir ?? process.cwd());

const content = await generateAgentsMd(targetDir);

if (outFile) {
  writeFileSync(resolve(outFile), content, "utf8");
  console.error(`Wrote AGENTS.md to ${resolve(outFile)}`);
} else {
  process.stdout.write(content);
}
