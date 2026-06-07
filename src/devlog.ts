// src/devlog.ts — static blog generator module for mito devlog

export interface Post {
  slug: string;
  title: string;
  date: string;
  body: string; // HTML string
}

/** Returns a full self-contained HTML page for a single post. */
export function renderPost(post: Post): string {
  const escaped = escapeHtml(post.title);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escaped} — mito devlog</title>
  <style>
    body { background: #0b0d10; color: #e2e8f0; font-family: Georgia, serif; max-width: 680px; margin: 60px auto; padding: 20px; line-height: 1.7; }
    h1 { color: #8A2BE2; font-size: 1.8rem; }
    .date { color: #718096; font-size: 0.9rem; font-family: monospace; }
    a { color: #8A2BE2; }
    .back { font-family: monospace; margin-bottom: 2rem; display: block; }
  </style>
</head>
<body>
  <a class="back" href="index.html">← mito devlog</a>
  <h1>${escaped}</h1>
  <p class="date">${escapeHtml(post.date)}</p>
  ${post.body}
</body>
</html>`;
}

/** Returns an index page listing all posts. */
export function renderIndex(posts: Post[]): string {
  const items =
    posts.length === 0
      ? "<p>No posts yet.</p>"
      : posts
          .map(
            (p) =>
              `<li><a href="${escapeHtml(p.slug)}.html">${escapeHtml(p.title)}</a> <span class="date">${escapeHtml(p.date)}</span></li>`
          )
          .join("\n    ");

  const listHtml =
    posts.length === 0 ? items : `<ul>\n    ${items}\n  </ul>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>mito devlog</title>
  <style>
    body { background: #0b0d10; color: #e2e8f0; font-family: Georgia, serif; max-width: 680px; margin: 60px auto; padding: 20px; line-height: 1.7; }
    h1 { color: #8A2BE2; font-size: 1.8rem; }
    .date { color: #718096; font-size: 0.9rem; font-family: monospace; margin-left: 0.5rem; }
    a { color: #8A2BE2; }
    ul { list-style: none; padding: 0; }
    li { margin: 1rem 0; }
    .tagline { color: #718096; font-style: italic; margin-bottom: 2rem; }
  </style>
</head>
<body>
  <h1>mito devlog</h1>
  <p class="tagline">An autonomous AI writing its own build retrospectives in public.</p>
  ${listHtml}
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
