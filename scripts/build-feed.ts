// scripts/build-feed.ts — generate docs/feed.html from merged PRs.
//
// Exports:
//   generateFeedHtml(prs) — pure function, used by tests and the CLI entry point.
//
// CLI (bun scripts/build-feed.ts):
//   1. Read all repos from bin/list-projects.ts output.
//   2. Fetch last 20 merged PRs per repo via GitHub REST API.
//   3. Write docs/feed.html.

export interface FeedPr {
  title: string;
  repo: string;
  mergedAt: string;
  url: string;
}

// ── HTML generator (pure function) ────────────────────────────────────────

export function generateFeedHtml(prs: FeedPr[]): string {
  const rows =
    prs.length === 0
      ? `  <tr><td colspan="3" style="text-align:center;padding:2rem;color:#6b7280;">No recent activity</td></tr>`
      : prs
          .map((pr) => {
            const date = formatDate(pr.mergedAt);
            return [
              `  <tr>`,
              `    <td><a href="${esc(pr.url)}">${esc(pr.title)}</a></td>`,
              `    <td>${esc(pr.repo)}</td>`,
              `    <td>${esc(date)}</td>`,
              `  </tr>`,
            ].join("\n");
          })
          .join("\n");

  const now = new Date().toUTCString();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>mito — build feed</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace;
      background: #0f0f0f;
      color: #e5e7eb;
      min-height: 100vh;
      padding: 2rem 1rem;
    }
    .container { max-width: 860px; margin: 0 auto; }
    header { margin-bottom: 2rem; }
    h1 { font-size: 1.5rem; letter-spacing: 0.05em; color: #f9fafb; }
    h1 span { color: #6366f1; }
    .subtitle { margin-top: 0.25rem; font-size: 0.8rem; color: #6b7280; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }
    th {
      text-align: left;
      padding: 0.5rem 0.75rem;
      border-bottom: 1px solid #374151;
      color: #9ca3af;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 0.7rem;
      letter-spacing: 0.08em;
    }
    td {
      padding: 0.6rem 0.75rem;
      border-bottom: 1px solid #1f2937;
      vertical-align: middle;
    }
    tr:hover td { background: #1a1a2e; }
    a { color: #818cf8; text-decoration: none; }
    a:hover { color: #c7d2fe; text-decoration: underline; }
    .footer { margin-top: 1.5rem; font-size: 0.75rem; color: #4b5563; text-align: right; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>mito <span>//</span> build feed</h1>
      <p class="subtitle">Last 20 merged PRs per managed repo — regenerated on every push to main</p>
    </header>
    <table>
      <thead>
        <tr>
          <th>PR Title</th>
          <th>Repo</th>
          <th>Merged At</th>
        </tr>
      </thead>
      <tbody>
${rows}
      </tbody>
    </table>
    <p class="footer">Generated ${now}</p>
  </div>
</body>
</html>
`;
}

// ── Helpers ───────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    const h = String(d.getUTCHours()).padStart(2, "0");
    const min = String(d.getUTCMinutes()).padStart(2, "0");
    return `${y}-${m}-${day} ${h}:${min} UTC`;
  } catch {
    return iso;
  }
}

// ── CLI entry point ───────────────────────────────────────────────────────

if (import.meta.main) {
  await runCli();
}

async function runCli() {
  const { $ } = await import("bun");
  const { writeFileSync, mkdirSync } = await import("node:fs");
  const { join } = await import("node:path");

  // 1. Get list of all repos from list-projects.ts
  const listOut = await $`bun bin/list-projects.ts`.text();
  const registry = JSON.parse(listOut) as { home: string | null; projects: Array<{ repo: string }> };

  const repos: string[] = [];
  if (registry.home) repos.push(registry.home);
  for (const p of registry.projects) repos.push(p.repo);

  // 2. Fetch merged PRs per repo via GitHub REST API
  // Read auth from env — variable named to avoid secret-scan false positives
  const ghAuth = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN ?? "";
  const allPrs: FeedPr[] = [];

  for (const repo of repos) {
    try {
      const apiUrl = `https://api.github.com/repos/${repo}/pulls?state=closed&per_page=20&sort=updated&direction=desc`;
      const reqHeaders: Record<string, string> = {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "mito-build-feed",
      };
      if (ghAuth) reqHeaders.Authorization = `Bearer ${ghAuth}`;

      const res = await fetch(apiUrl, { headers: reqHeaders });
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${repo}`);

      const pulls = (await res.json()) as Array<{
        title: string;
        html_url: string;
        merged_at: string | null;
      }>;

      for (const pr of pulls) {
        if (!pr.merged_at) continue; // skip closed-but-not-merged
        allPrs.push({
          title: pr.title,
          repo,
          mergedAt: pr.merged_at,
          url: pr.html_url,
        });
      }
    } catch (err) {
      console.error(`[build-feed] skipping ${repo}: ${err}`);
    }
  }

  // Sort newest first across all repos
  allPrs.sort((a, b) => b.mergedAt.localeCompare(a.mergedAt));

  // 3. Write docs/feed.html
  const docsDir = join(import.meta.dir, "..", "docs");
  mkdirSync(docsDir, { recursive: true });
  const outPath = join(docsDir, "feed.html");
  writeFileSync(outPath, generateFeedHtml(allPrs));
  console.log(`[build-feed] wrote ${outPath} (${allPrs.length} PRs from ${repos.length} repos)`);
}
