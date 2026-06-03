// bin/triage-issues.ts — acknowledge unresponded GitHub issues in mito's voice.
//
// Fetches open issues with 0 comments and posts a triage comment categorizing
// each one (bug / feature / question / feedback). Skips issues that already
// have any comment (including mito's own; the <!-- mito-triage --> marker
// prevents double-posting if this script is re-run before comments appear).
//
// Does NOT require X credentials — needs only GITHUB_TOKEN + MITO_GITHUB_REPO.
//
// Usage: bun bin/triage-issues.ts [--dry-run]
import { loadConfig, requireGithub } from "../src/config.js";
import { makeGithub, nativeFetch } from "../src/github.js";
import { categorizeIssue, buildTriageComment } from "../src/triage.js";

const dryRun = process.argv.includes("--dry-run");

const cfg = loadConfig();
const { repo, token } = requireGithub(cfg);
const gh = makeGithub({ repo, token, fetch: nativeFetch() });

const issues = await gh.listIssues();

// Only triage issues with no existing comments (conservative: avoid double-posting).
const untriaged = issues.filter((i) => i.comments === 0);

if (untriaged.length === 0) {
  console.log(JSON.stringify({ triaged: 0, skipped: issues.length, reason: "all_issues_have_comments" }));
  process.exit(0);
}

const results: Array<{ number: number; category: string; posted: boolean }> = [];

for (const issue of untriaged) {
  const category = categorizeIssue(issue.title, issue.body);
  const comment = buildTriageComment(issue.title, category);

  if (!dryRun) {
    await gh.addComment(issue.number, comment);
  }

  results.push({ number: issue.number, category, posted: !dryRun });
}

console.log(JSON.stringify({
  triaged: results.length,
  skipped: issues.length - untriaged.length,
  results,
}));
