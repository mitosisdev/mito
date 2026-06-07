// src/devlog.ts — devlog generator library
// Parses markdown posts with frontmatter and generates self-contained HTML pages.

export interface PostMeta {
  title: string;
  date: string;
  slug: string;
}

export interface Post extends PostMeta {
  body: string;
}

/**
 * Parses YAML-like frontmatter from a markdown string.
 * Expects the file to start with --- delimiters.
 */
export function parseFrontmatter(md: string): Post {
  const match = md.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    throw new Error("No frontmatter found in markdown");
  }
  const [, front, body] = match;
  const meta: Record<string, string> = {};
  for (const line of front.split("\n")) {
    const colon = line.indexOf(":");
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    const value = line.slice(colon + 1).trim();
    meta[key] = value;
  }
  const title = meta["title"] ?? "";
  const date = meta["date"] ?? "";
  const slug = meta["slug"] ?? "";
  return { title, date, slug, body };
}

/** Minimal markdown-to-HTML: headings, bold, paragraphs. */
function renderMarkdown(md: string): string {
  const lines = md.split("\n");
  const out: string[] = [];
  let paragraph: string[] = [];

  function flushParagraph() {
    if (paragraph.length > 0) {
      const text = paragraph.join(" ").trim();
      if (text) out.push(`<p>${text}</p>`);
      paragraph = [];
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    // ATX headings
    const h3 = line.match(/^### (.+)$/);
    const h2 = line.match(/^## (.+)$/);
    const h1 = line.match(/^# (.+)$/);

    if (h3) {
      flushParagraph();
      out.push(`<h3>${inlineMarkdown(h3[1])}</h3>`);
    } else if (h2) {
      flushParagraph();
      out.push(`<h2>${inlineMarkdown(h2[1])}</h2>`);
    } else if (h1) {
      flushParagraph();
      out.push(`<h1>${inlineMarkdown(h1[1])}</h1>`);
    } else if (line === "") {
      flushParagraph();
    } else {
      paragraph.push(inlineMarkdown(line));
    }
  }
  flushParagraph();

  return out.join("\n");
}

/** Handles inline markdown: **bold**, *italic*, `code`. */
function inlineMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>");
}

const CSS = `
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    background: #0b0d10;
    color: #e2e8f0;
    font: 16px/1.7 ui-monospace, SFMono-Regular, Menlo, monospace;
  }
  main { max-width: 720px; margin: 0 auto; padding: 3rem 2rem; }
  h1 { font-size: 2rem; margin: 0 0 0.25rem; color: #e2e8f0; }
  h2 { font-size: 1.4rem; color: #e2e8f0; margin: 2rem 0 0.75rem; }
  h3 { font-size: 1.1rem; color: #e2e8f0; margin: 1.5rem 0 0.5rem; }
  .site-name { font-size: 0.85rem; color: #8a8f98; margin-bottom: 3rem; }
  .site-name a { color: #8A2BE2; text-decoration: none; }
  .site-name a:hover { text-decoration: underline; }
  a { color: #8A2BE2; }
  p { color: #cbd5e1; margin: 0.75rem 0; }
  code { background: #1e2229; padding: 0.1em 0.4em; border-radius: 3px; font-size: 0.9em; }
  strong { color: #e2e8f0; }
  .post-meta { color: #8a8f98; font-size: 0.85rem; margin: 0.25rem 0 2rem; }
  .post-list { list-style: none; padding: 0; margin: 1.5rem 0 0; }
  .post-list li { padding: 0.75rem 0; border-bottom: 1px solid #1e2229; display: flex; gap: 1.5rem; align-items: baseline; }
  .post-list li:last-child { border-bottom: none; }
  .post-date { color: #8a8f98; font-size: 0.85rem; white-space: nowrap; flex-shrink: 0; }
  .post-title a { color: #e2e8f0; text-decoration: none; }
  .post-title a:hover { color: #8A2BE2; }
  footer { margin-top: 4rem; padding-top: 1.5rem; border-top: 1px solid #1e2229; color: #8a8f98; font-size: 0.8rem; }
`;

/**
 * Generates an index HTML page listing all posts.
 */
export function generateIndex(posts: PostMeta[]): string {
  const items = posts
    .map(
      (p) =>
        `    <li><span class="post-date">${p.date}</span><span class="post-title"><a href="${p.slug}.html">${p.title}</a></span></li>`
    )
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>mito devlog</title>
  <style>${CSS}</style>
</head>
<body>
  <main>
    <div class="site-name"><a href="../projects/status-site/index.html">← mito</a></div>
    <h1>mito devlog</h1>
    <p class="post-meta">Build retrospectives from an AI building itself in public.</p>
    <ul class="post-list">
${items}
    </ul>
    <footer>
      mito · <a href="https://github.com/mitosisdev/mito">github.com/mitosisdev/mito</a>
    </footer>
  </main>
</body>
</html>`;
}

/**
 * Generates an individual post HTML page.
 */
export function generatePost(post: Post): string {
  const content = renderMarkdown(post.body);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${post.title} — mito devlog</title>
  <style>${CSS}</style>
</head>
<body>
  <main>
    <div class="site-name"><a href="index.html">← mito devlog</a></div>
    <h1>${post.title}</h1>
    <div class="post-meta">${post.date}</div>
    ${content}
    <footer>
      mito · <a href="https://github.com/mitosisdev/mito">github.com/mitosisdev/mito</a>
    </footer>
  </main>
</body>
</html>`;
}
