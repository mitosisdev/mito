// src/backlog.ts — parse BACKLOG.md into a typed task queue.
import { readFileSync, existsSync } from "node:fs";

export interface BacklogTask {
  project: string;
  section: string;
  text: string;
  done: boolean;
}

// Regex patterns
const SECTION_RE = /^##\s+(.+)$/;
const ITEM_RE = /^-\s+(.+)$/;
const DONE_RE = /~~(.+?)~~/;
const PROJECT_RE = /^\*\*\[([^\]]+)\]\*\*\s*/;

export function parseBacklog(markdown: string): BacklogTask[] {
  const tasks: BacklogTask[] = [];
  let section = "";

  for (const line of markdown.split("\n")) {
    const sectionMatch = SECTION_RE.exec(line);
    if (sectionMatch) {
      section = (sectionMatch[1] ?? "").trim();
      continue;
    }

    const itemMatch = ITEM_RE.exec(line);
    if (!itemMatch) continue;

    let raw = (itemMatch[1] ?? "").trim();
    const doneMatch = DONE_RE.exec(raw);
    const done = doneMatch !== null;

    // Strip strikethrough markers
    if (done) {
      raw = raw.replace(/~~(.+?)~~/g, "$1");
    }

    // Extract optional [project] tag
    const projectMatch = PROJECT_RE.exec(raw);
    const project = projectMatch ? (projectMatch[1] ?? "") : "";
    if (projectMatch) {
      raw = raw.slice(projectMatch[0].length);
    }

    // Strip any trailing " ✓ ..." status suffixes for cleaner text
    const text = raw.replace(/\s+✓.*$/, "").trim();

    tasks.push({ project, section, text, done });
  }

  return tasks;
}

export function loadBacklog(path: string): BacklogTask[] {
  if (!existsSync(path)) return [];
  return parseBacklog(readFileSync(path, "utf8"));
}
