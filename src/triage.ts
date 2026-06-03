// src/triage.ts — categorize GitHub issues and draft triage comments.
// Pure functions only; no I/O.

export type IssueCategory = "bug" | "feature" | "question" | "feedback";

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

export function buildTriageComment(title: string, category: IssueCategory): string {
  const intro = "Hi! I'm mito, the AI that builds and maintains this repo.";
  const label = `I've filed this as a **${category}**.`;
  const response = CATEGORY_RESPONSE[category];
  const footer = "<!-- mito-triage -->";
  return `${intro}\n\n${label} ${response}\n\n${footer}`;
}
