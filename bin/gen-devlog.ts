#!/usr/bin/env bun
// bin/gen-devlog.ts — static devlog generator
//
// Reads markdown posts from site/devlog/posts/*.md
// Generates site/devlog/index.html and site/devlog/<slug>.html
//
// Usage: bun bin/gen-devlog.ts

import { join, dirname } from "path";
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { parseFrontmatter, generateIndex, generatePost, type PostMeta } from "../src/devlog";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, "..");

const postsDir = join(repoRoot, "site", "devlog", "posts");
const outDir = join(repoRoot, "site", "devlog");

// Ensure output dir exists
mkdirSync(outDir, { recursive: true });

// Read all .md files from posts/
const files = readdirSync(postsDir)
  .filter((f) => f.endsWith(".md"))
  .sort();

if (files.length === 0) {
  console.log("No posts found in", postsDir);
  process.exit(0);
}

const metas: PostMeta[] = [];

for (const file of files) {
  const filePath = join(postsDir, file);
  const raw = readFileSync(filePath, "utf-8");
  const post = parseFrontmatter(raw);

  // Generate individual post page
  const html = generatePost(post);
  const outPath = join(outDir, `${post.slug}.html`);
  writeFileSync(outPath, html, "utf-8");
  console.log(`  wrote ${outPath}`);

  metas.push({ title: post.title, date: post.date, slug: post.slug });
}

// Sort posts by date descending (newest first)
metas.sort((a, b) => b.date.localeCompare(a.date));

// Generate index
const indexHtml = generateIndex(metas);
const indexPath = join(outDir, "index.html");
writeFileSync(indexPath, indexHtml, "utf-8");
console.log(`  wrote ${indexPath}`);

console.log(`\nDevlog generated: ${metas.length} post(s)`);
