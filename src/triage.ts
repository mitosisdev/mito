// src/triage.ts — categorize GitHub issues and draft triage comments.
// Pure functions only; no I/O.

import type { GithubIssue } from "./github";

export type IssueCategory = "bug" | "feature" | "question" | "feedback";

// An issue is worth a first-response triage comment only when nobody (not even
// mito) has replied yet. Conservative on purpose: any existing comment means
// hands off, which also doubles as the re-run guard for the bin.
export function shouldTriage(issue: Pick<GithubIssue, "comments">): boolean {
  return issue.comments === 0;
}

const BUG_WORDS = ["bug", "error", "broken", "crash", "fail", "doesn't work", "not work", "wrong output", "regression", "exception", "traceback", "TypeError", "ReferenceError"];
const FEATURE_WORDS = ["feature", "add support", "add option", "enhancement", "request", "would be nice", "could you", "wish", "suggestion", "improve"];
const QUESTION_WORDS = ["how to", "how do", "how does", "what is", "why does", "why is", "when will", "does it", "is there a way", "can i", "can you", "is it possible"];

export function categorizeIssue(title: string, body: string): IssueCategory {
  const text = `${title} ${body}`.toLowerCase();

  if (BUG_WORDS.some((w) => text.includes(w.toLowerCase()))) return "bug";
  if (FEATURE_WORDS.some((w) => text.includes(w.toLowerCase()))) return "feature";
  if (QUESTION_WORDS.some((w) => text.includes(w.toLowerCase())) || title.trim().endsWith("?")) return "question";
  return "feedback";
}

const CATEGORY_RESPONSE: Record<IssueCategory, string> = {
  bug: "This looks like a bug. I'll add it to the build queue and address it in an upcoming cycle.",
  feature: "This sounds like a useful improvement. I'll review it in the next think session and add it to the backlog if it fits the roadmap.",
  question: "Let me look into this. If the answer isn't already in the docs, I'll update them.",
  feedback: "Thanks for the feedback — I'll factor this in during the next think session.",
};

// Two call shapes, one implementation:
//   buildTriageComment(title, category)  — explicit category (used by the bin
//     after categorizeIssue, and by the existing tests).
//   buildTriageComment(issue)            — pass a whole GithubIssue and let the
//     function categorize from title + body itself.
export function buildTriageComment(title: string, category: IssueCategory): string;
export function buildTriageComment(issue: Pick<GithubIssue, "title" | "body">): string;
export function buildTriageComment(
  arg: string | Pick<GithubIssue, "title" | "body">,
  category?: IssueCategory,
): string {
  const resolved: IssueCategory =
    typeof arg === "string"
      ? (category ?? categorizeIssue(arg, ""))
      : categorizeIssue(arg.title, arg.body ?? "");

  const intro = "Hi! I'm mito, the AI that builds and maintains this repo.";
  const label = `I've filed this as a **${resolved}**.`;
  const response = CATEGORY_RESPONSE[resolved];
  const footer = "<!-- mito-triage -->";
  return `${intro}\n\n${label} ${response}\n\n${footer}`;
}
