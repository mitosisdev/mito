import { test, expect } from "bun:test";
import { parseFrontmatter, generateIndex, generatePost } from "./devlog";

// --- parseFrontmatter ---

test("parseFrontmatter extracts title, date, slug from valid frontmatter", () => {
  const md = `---
title: How mito decides what to build
date: 2026-06-07
slug: how-mito-decides
---

Some body content here.
`;
  const result = parseFrontmatter(md);
  expect(result.title).toBe("How mito decides what to build");
  expect(result.date).toBe("2026-06-07");
  expect(result.slug).toBe("how-mito-decides");
});

test("parseFrontmatter returns body without frontmatter block", () => {
  const md = `---
title: Test Post
date: 2026-01-01
slug: test-post
---

This is the body.
`;
  const result = parseFrontmatter(md);
  expect(result.body.trim()).toBe("This is the body.");
});

test("parseFrontmatter handles frontmatter with extra whitespace around values", () => {
  const md = `---
title:   Spaced Out
date:  2026-03-15
slug:  spaced-out
---
Body.
`;
  const result = parseFrontmatter(md);
  expect(result.title).toBe("Spaced Out");
  expect(result.date).toBe("2026-03-15");
  expect(result.slug).toBe("spaced-out");
});

// --- generateIndex ---

test("generateIndex produces HTML containing each post title", () => {
  const posts = [
    { title: "First Post", date: "2026-06-07", slug: "first-post" },
    { title: "Second Post", date: "2026-06-08", slug: "second-post" },
  ];
  const html = generateIndex(posts);
  expect(html).toContain("First Post");
  expect(html).toContain("Second Post");
});

test("generateIndex links to correct slug HTML files", () => {
  const posts = [
    { title: "My Post", date: "2026-06-07", slug: "my-post" },
  ];
  const html = generateIndex(posts);
  expect(html).toContain('href="my-post.html"');
});

test("generateIndex includes post dates", () => {
  const posts = [
    { title: "Dated Post", date: "2026-06-07", slug: "dated-post" },
  ];
  const html = generateIndex(posts);
  expect(html).toContain("2026-06-07");
});

test("generateIndex is self-contained — no external CSS or JS links", () => {
  const posts = [
    { title: "Post", date: "2026-06-07", slug: "post" },
  ];
  const html = generateIndex(posts);
  // Must not load any external stylesheet or script resources
  expect(html).not.toMatch(/<link[^>]+href=["']https?:\/\//);
  expect(html).not.toMatch(/src=["']https?:\/\//);
  expect(html).not.toMatch(/<link[^>]+stylesheet[^>]+>/);
  expect(html).not.toMatch(/<script[^>]+src=/);
});

// --- generatePost ---

test("generatePost puts post title in <title> tag", () => {
  const post = {
    title: "How mito decides what to build",
    date: "2026-06-07",
    slug: "how-mito-decides",
    body: "Some content here.",
  };
  const html = generatePost(post);
  expect(html).toContain("<title>How mito decides what to build");
});

test("generatePost renders body content in HTML", () => {
  const post = {
    title: "Test",
    date: "2026-06-07",
    slug: "test",
    body: "This is the body content.",
  };
  const html = generatePost(post);
  expect(html).toContain("This is the body content.");
});

test("generatePost converts markdown headings to HTML", () => {
  const post = {
    title: "Test",
    date: "2026-06-07",
    slug: "test",
    body: "## A heading\n\nSome text.",
  };
  const html = generatePost(post);
  expect(html).toContain("<h2>");
  expect(html).toContain("A heading");
});

test("generatePost converts **bold** to <strong>", () => {
  const post = {
    title: "Test",
    date: "2026-06-07",
    slug: "test",
    body: "This is **bold** text.",
  };
  const html = generatePost(post);
  expect(html).toContain("<strong>bold</strong>");
});

test("generatePost is self-contained — no external CSS or JS links", () => {
  const post = {
    title: "Test",
    date: "2026-06-07",
    slug: "test",
    body: "Body.",
  };
  const html = generatePost(post);
  // Must not load any external stylesheet or script resources
  expect(html).not.toMatch(/<link[^>]+href=["']https?:\/\//);
  expect(html).not.toMatch(/src=["']https?:\/\//);
  expect(html).not.toMatch(/<link[^>]+stylesheet[^>]+>/);
  expect(html).not.toMatch(/<script[^>]+src=/);
});
