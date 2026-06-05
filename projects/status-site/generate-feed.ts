#!/usr/bin/env bun
// projects/status-site/generate-feed.ts
// Run with: bun projects/status-site/generate-feed.ts
// Reads projects/registry.json, fetches merged PRs via gh cli, writes feed.html.

import { execSync } from "node:child_process";
import { writeFileSync, readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { generateFeedHtml, type PrEntry } from "./feed.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const registryPath = resolve(__dirname, "../../projects/registry.json");
const feedPath = resolve(__dirname, "feed.html");

interface RegistryProject {
  repo: string;
  name: string;
  description: string;
  createdAt: string;
}

interface GhPr {
  number: number;
  title: string;
  merged_at: string | null;
  html_url: string;
  state: string;
}

function fetchMergedPrs(repo: string): PrEntry[] {
  try {
    const raw = execSync(
      `gh api "repos/${repo}/pulls?state=closed&per_page=20&sort=updated" --paginate`,
      { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }
    );
    const prs: GhPr[] = JSON.parse(raw);
    return prs
      .filter((pr) => pr.merged_at !== null)
      .map((pr) => ({
        number: pr.number,
        title: pr.title,
        repo,
        mergedAt: pr.merged_at as string,
        url: pr.html_url,
      }));
  } catch (err) {
    console.warn(`Warning: could not fetch PRs for ${repo}:`, (err as Error).message);
    return [];
  }
}

const registry = JSON.parse(readFileSync(registryPath, "utf8")) as {
  projects: RegistryProject[];
};

console.log(`Fetching PRs for ${registry.projects.length} repos…`);

const allPrs: PrEntry[] = [];
for (const project of registry.projects) {
  const prs = fetchMergedPrs(project.repo);
  console.log(`  ${project.repo}: ${prs.length} merged PRs`);
  allPrs.push(...prs);
}

// Sort descending by mergedAt, take top 20
allPrs.sort((a, b) => new Date(b.mergedAt).getTime() - new Date(a.mergedAt).getTime());
const top20 = allPrs.slice(0, 20);

const html = generateFeedHtml(top20);
writeFileSync(feedPath, html, "utf8");

console.log(`Wrote ${feedPath} (${top20.length} PRs)`);
