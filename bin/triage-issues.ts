// bin/triage-issues.ts — acknowledge unresponded GitHub issues in mito's voice.
//
// Iterates the default repo PLUS every managed repo in projects/registry.json,
// fetches open issues with 0 comments, and posts a triage comment categorizing
// each one (bug / feature / question / feedback). Skips issues that already
// have any comment (including mito's own; the <!-- mito-triage --> marker
// prevents double-posting if this script is re-run before comments appear).
//
// makeGithub() pins one default repo per instance, so multi-repo triage builds
// a fresh client per repo rather than threading a repo arg through every call.
//
// Does NOT require X credentials — needs only GITHUB_TOKEN + MITO_GITHUB_REPO.
//
// Usage: bun bin/triage-issues.ts [--dry-run]
import { readFileSync } from "node:fs";
import { loadConfig, requireGithub } from "../src/config.js";
import { makeGithub, nativeFetch } from "../src/github.js";
import { categorizeIssue, buildTriageComment, shouldTriage } from "../src/triage.js";

const dryRun = process.argv.includes("--dry-run");

const cfg = loadConfig();
const { repo, token } = requireGithub(cfg);

// The default repo is always triaged; managed repos come from the registry.
const registry = JSON.parse(
  readFileSync(new URL("../projects/registry.json", import.meta.url), "utf8"),
) as { projects: Array<{ repo: string }> };

const repos = [...new Set([repo, ...registry.projects.map((p) => p.repo)])];

type Result = { repo: string; number: number; category: string; posted: boolean };
const results: Result[] = [];
let skipped = 0;

for (const target of repos) {
  const gh = makeGithub({ repo: target, token, fetch: nativeFetch() });

  let issues;
  try {
    issues = await gh.listIssues();
  } catch (err) {
    // A repo we can't read (404/permissions) shouldn't sink the whole run.
    console.error(`Failed to list issues for ${target}:`, err);
    continue;
  }

  for (const issue of issues) {
    if (!shouldTriage(issue)) {
      skipped++;
      continue;
    }

    const category = categorizeIssue(issue.title, issue.body);
    const comment = buildTriageComment(issue.title, category);

    if (dryRun) {
      results.push({ repo: target, number: issue.number, category, posted: false });
      continue;
    }

    try {
      await gh.addComment(issue.number, comment);
      results.push({ repo: target, number: issue.number, category, posted: true });
    } catch (err) {
      console.error(`Failed to comment on ${target}#${issue.number}:`, err);
      results.push({ repo: target, number: issue.number, category, posted: false });
    }
  }
}

console.log(JSON.stringify({ triaged: results.length, skipped, results }));
