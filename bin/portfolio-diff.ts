// bin/portfolio-diff.ts — portfolio diff view across all managed repos.
//
// Shows what changed since the last reviewer pass:
//   • PRs merged per repo
//   • Current open PR count per repo
//   • Latest commit on main per repo
//
// Output: structured Markdown to stdout.
//
// Usage: bun bin/portfolio-diff.ts
import { loadConfig, requireGithub } from "../src/config";
import { loadState } from "../src/state";
import { loadRegistry } from "../src/registry";
import { nativeFetch } from "../src/github";
import {
  buildPortfolioDiff,
  formatPortfolioDiff,
  makeRepoDiffFetcher,
} from "../src/portfolio-diff";

async function main() {
  const cfg = loadConfig();
  const state = loadState(cfg.statePath);
  const registry = loadRegistry("projects/registry.json");

  let githubCfg: { repo: string; token: string };
  try {
    githubCfg = requireGithub(cfg);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`portfolio-diff: ${msg}`);
    process.exit(1);
  }

  const fetcher = makeRepoDiffFetcher(githubCfg.token, nativeFetch());
  const data = await buildPortfolioDiff(state, registry, githubCfg.repo, fetcher);

  process.stdout.write(formatPortfolioDiff(data));
}

main().catch((err) => {
  console.error("portfolio-diff: fatal error:", err);
  process.exit(1);
});
