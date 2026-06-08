// bin/portfolio-diff.ts — print a Markdown summary of what changed across the
// portfolio since the last reviewer pass.
//
// Reads mito-state.json (via MITO_STATE_PATH or ./mito-state.json default) and
// emits Markdown to stdout: PRs merged (grouped by repo), per-repo activity,
// and the net open-PR delta. The output feeds the digest generator.
//
// Usage:
//   bun bin/portfolio-diff.ts                       # since last build session
//   bun bin/portfolio-diff.ts --since 2026-06-01    # explicit ISO cutoff
//   bun bin/portfolio-diff.ts --json                # machine-readable JSON
import { loadState } from "../src/state";
import { buildPortfolioDiff, formatPortfolioDiff } from "../src/portfolio-diff";

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  if (i === -1) return undefined;
  return process.argv[i + 1];
}

const jsonMode = process.argv.includes("--json");
const since = argValue("--since");
const statePath = process.env.MITO_STATE_PATH ?? "./mito-state.json";

const state = loadState(statePath);
const diff = buildPortfolioDiff(state, since);

process.stdout.write(
  jsonMode ? JSON.stringify(diff, null, 2) + "\n" : formatPortfolioDiff(diff),
);
