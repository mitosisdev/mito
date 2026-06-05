// src/backlog.ts — parse BACKLOG.md into a typed task queue.
import { readFileSync, existsSync } from "node:fs";
import { readFile } from "node:fs/promises";

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
// Inline completion markers: ✓ shipped, ✓ PR #N, ✓ <anything>
const INLINE_DONE_RE = /\s+✓\s*\S.*/;
// Only match single-word project tags like [mito] or [gitstory].
// Compound tags like [mito + gitstory] are intentionally NOT matched (project stays "").
const PROJECT_RE = /^\*\*\[([A-Za-z0-9_-]+)\]\*\*\s*/;

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
    const inlineDone = INLINE_DONE_RE.test(raw);
    const done = doneMatch !== null || inlineDone;

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

export function loadBacklogSync(path: string): BacklogTask[] {
  if (!existsSync(path)) return [];
  return parseBacklog(readFileSync(path, "utf8"));
}

export async function loadBacklog(path: string): Promise<BacklogTask[]> {
  try {
    const content = await readFile(path, "utf8");
    return parseBacklog(content);
  } catch {
    return [];
  }
}

/**
 * Marks the first backlog item whose raw text contains `pattern` (case-insensitive)
 * as done by wrapping the item content in strikethrough (`~~...~~`).
 * Returns the markdown unchanged if no match is found.
 * Idempotent: already-struck items are left as-is.
 */
export function markTaskDone(markdown: string, pattern: string): string {
  const lowerPattern = pattern.toLowerCase();
  const lines = markdown.split("\n");
  let matched = false;

  const result = lines.map((line) => {
    if (matched) return line;

    // Only process list items
    const itemMatch = /^(-\s+)(.+)$/.exec(line);
    if (!itemMatch) return line;

    const leader = itemMatch[1]!;
    const content = itemMatch[2]!;

    // Check if this item (stripped of existing strikethrough) matches
    const stripped = content.replace(/~~(.+?)~~/g, "$1");
    if (!stripped.toLowerCase().includes(lowerPattern)) return line;

    // Already struck through — leave as-is
    if (/^~~.+~~$/.test(content.trim())) {
      matched = true;
      return line;
    }

    matched = true;
    return `${leader}~~${content}~~`;
  });

  return result.join("\n");
}
