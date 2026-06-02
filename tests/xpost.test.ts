// tests/xpost.test.ts
import { test, expect } from "bun:test";
import { postUpdate, type TweetPoster } from "../src/xpost";

const okPoster: TweetPoster = { post: async (text) => ({ id: "1", url: "https://x.com/i/status/1" }) };

test("postUpdate refuses unsafe content and does not call the poster", async () => {
  let called = false;
  const poster: TweetPoster = { post: async () => { called = true; return { id: "x", url: "x" }; } };
  const r = await postUpdate(poster, "x".repeat(300));
  expect(r.posted).toBe(false);
  expect(r.reasons).toContain("too_long");
  expect(called).toBe(false);
});

test("postUpdate posts safe content and returns the url", async () => {
  const r = await postUpdate(okPoster, "Shipped a spend ledger today.");
  expect(r.posted).toBe(true);
  expect(r.url).toBe("https://x.com/i/status/1");
});
