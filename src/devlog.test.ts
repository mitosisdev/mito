// src/devlog.test.ts — unit tests for devlog module (TDD: write first, run red, then green)

import { describe, expect, test } from "bun:test";
import { renderIndex, renderPost } from "./devlog";
import type { Post } from "./devlog";

const samplePost: Post = {
  slug: "test-post",
  title: "Test Post Title",
  date: "2026-06-07",
  body: "<p>This is the post body content.</p>",
};

const anotherPost: Post = {
  slug: "second-post",
  title: "Second Post",
  date: "2026-06-08",
  body: "<p>Another post body.</p>",
};

describe("renderPost", () => {
  test("returns a string containing <html", () => {
    const result = renderPost(samplePost);
    expect(result).toContain("<html");
  });

  test("includes the post title in output", () => {
    const result = renderPost(samplePost);
    expect(result).toContain(samplePost.title);
  });

  test("includes the post date in output", () => {
    const result = renderPost(samplePost);
    expect(result).toContain(samplePost.date);
  });

  test("includes the post body HTML in output", () => {
    const result = renderPost(samplePost);
    expect(result).toContain(samplePost.body);
  });

  test("output is self-contained (no external http dependencies)", () => {
    const result = renderPost(samplePost);
    // Must not reference external CDNs or http URLs in link/script/style tags
    expect(result).not.toMatch(/<link[^>]+href=["']https?:\/\//i);
    expect(result).not.toMatch(/<script[^>]+src=["']https?:\/\//i);
  });

  test("output is a complete HTML document", () => {
    const result = renderPost(samplePost);
    expect(result).toContain("<!DOCTYPE html>");
    expect(result).toContain("</html>");
  });
});

describe("renderIndex", () => {
  test("includes the post title for a single post", () => {
    const result = renderIndex([samplePost]);
    expect(result).toContain(samplePost.title);
  });

  test("includes the post slug as a link for a single post", () => {
    const result = renderIndex([samplePost]);
    expect(result).toContain(samplePost.slug);
  });

  test("handles empty array without crashing", () => {
    expect(() => renderIndex([])).not.toThrow();
    const result = renderIndex([]);
    expect(result).toContain("<html");
  });

  test("includes all post titles for multiple posts", () => {
    const result = renderIndex([samplePost, anotherPost]);
    expect(result).toContain(samplePost.title);
    expect(result).toContain(anotherPost.title);
  });

  test("output is self-contained (no external http dependencies)", () => {
    const result = renderIndex([samplePost]);
    expect(result).not.toMatch(/<link[^>]+href=["']https?:\/\//i);
    expect(result).not.toMatch(/<script[^>]+src=["']https?:\/\//i);
  });

  test("output is a complete HTML document", () => {
    const result = renderIndex([samplePost]);
    expect(result).toContain("<!DOCTYPE html>");
    expect(result).toContain("</html>");
  });
});
