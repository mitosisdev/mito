#!/usr/bin/env bun
// bin/gen-devlog.ts — static devlog generator
// Imports all posts, renders HTML, writes to site/devlog/

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { renderIndex, renderPost } from "../src/devlog";
import { howMitoDecides } from "../src/devlog/posts/how-mito-decides";

const posts = [howMitoDecides];

const outDir = join(import.meta.dir, "..", "site", "devlog");
mkdirSync(outDir, { recursive: true });

for (const post of posts) {
  const html = renderPost(post);
  const outPath = join(outDir, `${post.slug}.html`);
  writeFileSync(outPath, html, "utf8");
  console.log(`wrote ${outPath}`);
}

const indexHtml = renderIndex(posts);
const indexPath = join(outDir, "index.html");
writeFileSync(indexPath, indexHtml, "utf8");
console.log(`wrote ${indexPath}`);
