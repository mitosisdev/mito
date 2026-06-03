import { test, expect } from "bun:test";
import { categorizeIssue, buildTriageComment } from "../src/triage";

// ─── categorizeIssue ─────────────────────────────────────────────────────────

test("classifies crash reports as bug", () => {
  expect(categorizeIssue("App crash on startup", "Getting an error when I run it")).toBe("bug");
});

test("classifies broken behaviour as bug", () => {
  expect(categorizeIssue("Something is broken", "This doesn't work anymore")).toBe("bug");
});

test("classifies feature requests as feature", () => {
  expect(categorizeIssue("Feature request: add dark mode", "Would be nice to have a dark theme")).toBe("feature");
});

test("classifies enhancement requests as feature", () => {
  expect(categorizeIssue("Enhancement: improve logging", "Could you add structured logs?")).toBe("feature");
});

test("classifies how-to questions as question", () => {
  expect(categorizeIssue("How to configure timeout", "How do I set the spend cap?")).toBe("question");
});

test("classifies title-ending question mark as question", () => {
  expect(categorizeIssue("Is there a Docker image?", "")).toBe("question");
});

test("defaults to feedback for unclassifiable input", () => {
  expect(categorizeIssue("Great project!", "Really enjoying using this")).toBe("feedback");
});

// ─── buildTriageComment ──────────────────────────────────────────────────────

test("comment contains mito-triage marker", () => {
  const c = buildTriageComment("some issue", "bug");
  expect(c).toContain("<!-- mito-triage -->");
});

test("comment names the category", () => {
  const c = buildTriageComment("some issue", "feature");
  expect(c).toContain("**feature**");
});

test("comment varies by category", () => {
  const bugComment = buildTriageComment("title", "bug");
  const featureComment = buildTriageComment("title", "feature");
  expect(bugComment).not.toBe(featureComment);
});

test("comment mentions mito as author", () => {
  const c = buildTriageComment("test", "question");
  expect(c.toLowerCase()).toContain("mito");
});
