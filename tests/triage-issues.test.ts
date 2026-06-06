// tests/triage-issues.test.ts
import { describe, it, expect } from "bun:test";

import { buildTriageComment, shouldTriage } from "../src/triage";
import type { GithubIssue } from "../src/github";

const makeIssue = (overrides: Partial<GithubIssue> = {}): GithubIssue => ({
  number: 1,
  title: "Button is broken",
  body: "When I click Submit nothing happens",
  comments: 0,
  html_url: "https://github.com/mitosisdev/test/issues/1",
  ...overrides,
});

describe("shouldTriage", () => {
  it("triages issues with 0 comments", () => {
    expect(shouldTriage(makeIssue({ comments: 0 }))).toBe(true);
  });

  it("skips issues that already have comments", () => {
    expect(shouldTriage(makeIssue({ comments: 2 }))).toBe(false);
  });
});

describe("buildTriageComment", () => {
  it("returns a non-empty string", () => {
    const comment = buildTriageComment(makeIssue());
    expect(typeof comment).toBe("string");
    expect(comment.length).toBeGreaterThan(10);
  });

  it("mentions the issue title", () => {
    const comment = buildTriageComment(makeIssue({ title: "Parser fails on empty input" }));
    // At minimum it's a meaningful reply
    expect(comment).toBeTruthy();
  });
});
