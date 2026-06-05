// projects/status-site/feed.ts
// Generates a static HTML page showing the last N merged PRs across registered repos.
// Pure function — no I/O. Used by generate-feed.ts and tested by feed.test.ts.

export interface PrEntry {
  number: number;
  title: string;
  repo: string;
  mergedAt: string; // ISO 8601
  url: string;
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}d ago`;
}

function formatDate(iso: string): string {
  return new Date(iso).toISOString().replace("T", " ").slice(0, 16) + " UTC";
}

export function generateFeedHtml(prs: PrEntry[]): string {
  const rows =
    prs.length === 0
      ? `<li class="empty">No recent PRs — nothing merged yet.</li>`
      : prs
          .map(
            (pr) => `
    <li class="pr-item">
      <span class="repo">${escHtml(pr.repo)}</span>
      <a class="pr-title" href="${escHtml(pr.url)}">#${pr.number} ${escHtml(pr.title)}</a>
      <span class="meta">
        <span class="rel-time" title="${escHtml(formatDate(pr.mergedAt))}">${relativeTime(pr.mergedAt)}</span>
        <span class="abs-time">${escHtml(formatDate(pr.mergedAt))}</span>
      </span>
    </li>`
          )
          .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>mito build feed</title>
  <style>
    :root { color-scheme: dark; }
    body {
      margin: 0;
      min-height: 100vh;
      background: #0b0d10;
      color: #e8eaed;
      font: 15px/1.6 ui-monospace, SFMono-Regular, Menlo, monospace;
    }
    main { max-width: 860px; margin: 0 auto; padding: 3rem 2rem; }
    header { text-align: center; margin-bottom: 3rem; }
    h1 { font-size: 2.5rem; margin: 0; }
    .tag { color: #8a8f98; margin: .25rem 0 .75rem; }
    .back { color: #8A2BE2; font-size: .85rem; }
    h2 { font-size: 1rem; color: #8a8f98; text-transform: uppercase;
      letter-spacing: .08em; margin: 0 0 1rem; }
    ul.feed { list-style: none; margin: 0; padding: 0; }
    li.pr-item {
      display: grid;
      grid-template-columns: 180px 1fr auto;
      gap: .5rem 1rem;
      align-items: baseline;
      padding: .6rem .75rem;
      border-bottom: 1px solid #1a1d23;
    }
    li.pr-item:last-child { border-bottom: none; }
    li.empty { color: #8a8f98; padding: 2rem .75rem; font-style: italic; }
    .repo { color: #8a8f98; font-size: .8rem; white-space: nowrap; overflow: hidden;
      text-overflow: ellipsis; }
    .pr-title { color: #b8c0cc; text-decoration: none; word-break: break-word; }
    .pr-title:hover { color: #e8eaed; text-decoration: underline; }
    .meta { text-align: right; white-space: nowrap; }
    .rel-time { color: #8A2BE2; font-size: .85rem; }
    .abs-time { display: none; color: #8a8f98; font-size: .75rem; margin-left: .4rem; }
    @media (max-width: 600px) {
      li.pr-item { grid-template-columns: 1fr; }
      .abs-time { display: none; }
    }
  </style>
</head>
<body>
  <main>
    <header>
      <h1>🧬 mito build feed</h1>
      <div class="tag">recent merged PRs across all mito-managed repos</div>
      <a class="back" href="index.html">← back to status</a>
    </header>
    <section>
      <h2>Recent activity</h2>
      <ul class="feed">
        ${rows}
      </ul>
    </section>
  </main>
</body>
</html>`;
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
