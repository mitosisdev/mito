// src/gen-digest.ts — pure Markdown generation for the mito weekly digest.
// No I/O. Takes a State + options (reference time, parsed backlog tasks),
// returns a self-contained Markdown string summarising the week's activity.
import type { State, PullRequestRecord } from "./state";
import type { BacklogTask } from "./backlog";

export interface DigestOptions {
  /** Reference "now". Defaults to the current time. */
  now?: Date;
  /** Parsed backlog tasks (from src/backlog.ts). Drives the "What's Next" section. */
  backlog?: BacklogTask[];
  /** Length of the digest window in days. Defaults to 7. */
  windowDays?: number;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const NEXT_LIMIT = 5;

/** Format a Date as YYYY-MM-DD (UTC). */
function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * A PR is "in the window" when it has been resolved (merged or closed) and its
 * resolvedAt timestamp falls within [windowStart, now]. PRs without a
 * resolvedAt are excluded — we can't place them in time.
 */
function resolvedInWindow(pr: PullRequestRecord, windowStart: number, now: number): boolean {
  if (!pr.resolvedAt) return false;
  const t = new Date(pr.resolvedAt).getTime();
  return t >= windowStart && t <= now;
}

/** One bullet for a PR in a list section. */
function prBullet(pr: PullRequestRecord): string {
  return `- ${pr.title} (#${pr.number})`;
}

/** One bullet for a closed PR, including the close reason. */
function closedBullet(pr: PullRequestRecord): string {
  const reason = (pr.closeReason ?? "").trim() || "no reason recorded";
  return `- ${pr.title} (#${pr.number}) — reason: ${reason}`;
}

/** Render a section: heading + bullets, or a placeholder line if empty. */
function section(heading: string, bullets: string[], emptyLine: string): string {
  const body = bullets.length > 0 ? bullets.join("\n") : emptyLine;
  return `## ${heading}\n\n${body}\n`;
}

export function generateDigest(state: State, opts: DigestOptions = {}): string {
  const now = opts.now ?? new Date();
  const windowDays = opts.windowDays ?? 7;
  const backlog = opts.backlog ?? [];

  const nowMs = now.getTime();
  const windowStart = nowMs - windowDays * MS_PER_DAY;
  const weekOf = ymd(new Date(windowStart));

  // Partition PRs resolved within the window.
  const inWindow = state.pullRequests.filter((p) => resolvedInWindow(p, windowStart, nowMs));
  const merged = inWindow.filter((p) => p.status === "merged");
  const closed = inWindow.filter((p) => p.status === "closed");

  // What's Next — first N not-done backlog items.
  const nextTasks = backlog.filter((t) => !t.done).slice(0, NEXT_LIMIT);
  const nextBullets = nextTasks.map((t) => {
    const tag = t.project ? `[${t.project}] ` : "";
    return `- ${tag}${t.text}`;
  });

  const sections = [
    `# Mito Weekly Digest — week of ${weekOf}\n`,
    section(
      "PRs Merged This Week",
      merged.map(prBullet),
      "_No PRs merged this week._",
    ),
    section(
      "PRs Closed Without Merge",
      closed.map(closedBullet),
      "_No PRs closed without merge this week._",
    ),
    section(
      "Features Shipped",
      merged.map((p) => `- ${p.title}`),
      "_No features shipped this week._",
    ),
    section(
      "What Failed",
      closed.map((p) => {
        const reason = (p.closeReason ?? "").trim() || "no reason recorded";
        return `- ${p.title} — ${reason}`;
      }),
      "_Nothing failed this week._",
    ),
    section(
      "What's Next",
      nextBullets,
      "_Backlog is clear._",
    ),
  ];

  return sections.join("\n");
}
