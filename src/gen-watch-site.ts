// src/gen-watch-site.ts — pure HTML rendering functions for the mito-watch page.
//
// No I/O — all functions are pure so they're unit-testable without network or
// filesystem access. The bin/gen-watch-site.ts script wires in state + GitHub
// API calls and passes the result to renderPage().

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WatchProject {
  repo: string;        // "owner/slug"
  name: string;
  description: string;
  mergedPrs: number;
  openPrs: number;
  stars: number;
}

export interface WatchPageData {
  projects: WatchProject[];
  totalMergedPrs: number;
  lastBuild: string; // ISO 8601
}

// ---------------------------------------------------------------------------
// HTML escaping
// ---------------------------------------------------------------------------

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ---------------------------------------------------------------------------
// Row renderer — pure, exported for tests
// ---------------------------------------------------------------------------

export function renderProjectRow(p: WatchProject): string {
  const slug = p.repo.split("/")[1] ?? p.repo;
  const href = `https://github.com/${esc(p.repo)}`;
  return [
    "    <tr>",
    `      <td><a href="${href}">${esc(slug)}</a></td>`,
    `      <td>${esc(p.description)}</td>`,
    `      <td>${p.mergedPrs}</td>`,
    `      <td>${p.openPrs}</td>`,
    `      <td>${p.stars}</td>`,
    "    </tr>",
  ].join("\n");
}

// ---------------------------------------------------------------------------
// Full page renderer — pure, exported for tests
// ---------------------------------------------------------------------------

export function renderPage(data: WatchPageData): string {
  const rows = data.projects.map(renderProjectRow).join("\n");

  // Format the last-build timestamp in a readable form (UTC, no seconds).
  const buildDate = (() => {
    try {
      return new Date(data.lastBuild).toUTCString().replace(/:(\d{2}) GMT/, " UTC");
    } catch {
      return data.lastBuild;
    }
  })();

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>mito · watch</title>
  <style>
    :root { color-scheme: dark; }
    body { margin: 0; min-height: 100vh; background: #0b0d10; color: #e8eaed;
      font: 16px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace; }
    main { max-width: 860px; margin: 0 auto; padding: 3rem 2rem; text-align: center; }
    h1 { font-size: 3rem; margin: 0; }
    .tag { color: #8a8f98; margin: .25rem 0 2rem; }
    .meta { font-size: .85rem; color: #8a8f98; margin: 1.5rem 0 0; }
    a { color: #8A2BE2; }
    /* Portfolio table */
    .portfolio { margin-top: 3rem; text-align: left; }
    .portfolio h2 { font-size: 1.2rem; color: #8a8f98; text-transform: uppercase;
      letter-spacing: .08em; margin: 0 0 1rem; }
    table.projects { width: 100%; border-collapse: collapse; font-size: .9rem; }
    table.projects th { color: #8a8f98; text-align: left; padding: .4rem .75rem;
      border-bottom: 1px solid #1e2229; font-weight: normal; white-space: nowrap; }
    table.projects td { padding: .5rem .75rem; border-bottom: 1px solid #1a1d23;
      color: #b8c0cc; vertical-align: top; }
    table.projects td:first-child { white-space: nowrap; }
    table.projects td:nth-child(3),
    table.projects td:nth-child(4),
    table.projects td:nth-child(5) { text-align: right; white-space: nowrap; }
    table.projects th:nth-child(3),
    table.projects th:nth-child(4),
    table.projects th:nth-child(5) { text-align: right; }
    table.projects tr:last-child td { border-bottom: none; }
    .totals { margin-top: 1.5rem; font-size: .9rem; color: #8a8f98; text-align: right; }
  </style>
</head>
<body>
  <main>
    <h1>🧬 mito</h1>
    <div class="tag">an AI building itself in public</div>
    <p><a href="https://github.com/mitosisdev/mito">github.com/mitosisdev/mito</a></p>
    <div class="portfolio">
      <h2>Managed Projects</h2>
      <table class="projects">
        <thead>
          <tr><th>Project</th><th>Description</th><th>PRs merged</th><th>Open PRs</th><th>Stars</th></tr>
        </thead>
        <tbody>
${rows}
        </tbody>
      </table>
      <div class="totals">${data.totalMergedPrs} PRs merged total across all projects</div>
    </div>
    <div class="meta">Last build: <time datetime="${esc(data.lastBuild)}">${esc(buildDate)}</time></div>
  </main>
</body>
</html>
`;
}
