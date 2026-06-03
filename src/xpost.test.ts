// src/xpost.test.ts — tests for draftMergeMessage
import { test, expect } from "bun:test";
import { draftMergeMessage } from "./xpost.js";
import type { PullRequestRecord } from "./state.js";

function makePr(overrides: Partial<PullRequestRecord> = {}): PullRequestRecord {
  return {
    number: 42,
    branch: "feat/foo",
    url: "https://github.com/owner/repo/pull/42",
    title: "feat: foo",
    status: "merged",
    proposedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

test("draftMergeMessage: normal pr contains title, url, and hashtag", () => {
  const pr = makePr({ title: "feat: foo", url: "https://github.com/owner/repo/pull/42" });
  const msg = draftMergeMessage(pr);
  expect(msg).toContain("feat: foo");
  expect(msg).toContain("https://github.com/owner/repo/pull/42");
  expect(msg).toContain("#buildinpublic");
  expect(msg.length).toBeLessThanOrEqual(280);
});

test("draftMergeMessage: long title is truncated so result is ≤280 chars", () => {
  const longTitle = `feat: ${"a".repeat(220)}`;
  const pr = makePr({ title: longTitle, url: "https://github.com/owner/repo/pull/99" });
  const msg = draftMergeMessage(pr);
  expect(msg.length).toBeLessThanOrEqual(280);
  expect(msg).toContain("#buildinpublic");
  expect(msg).toContain("…");
});

test("draftMergeMessage: pr with no url still returns a valid string", () => {
  const pr = makePr({ url: "" });
  const msg = draftMergeMessage(pr);
  expect(typeof msg).toBe("string");
  expect(msg.length).toBeGreaterThan(0);
  expect(msg.length).toBeLessThanOrEqual(280);
  expect(msg).toContain("#buildinpublic");
});

test("draftMergeMessage: always includes #buildinpublic hashtag", () => {
  const pr = makePr();
  expect(draftMergeMessage(pr)).toContain("#buildinpublic");
});
