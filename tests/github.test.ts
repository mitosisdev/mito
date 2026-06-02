// tests/github.test.ts
import { test, expect } from "bun:test";
import { makeGithub, type FetchLike } from "../src/github";

// A fake fetch that records the last call and replies from a queued script.
// Mirrors the injected-client pattern used for TweetPoster in xpost.ts.
interface Call { url: string; method: string; headers: Record<string, string>; body?: unknown; }
function fakeFetch(replies: Array<{ status?: number; json?: unknown; text?: string }>): {
  fetch: FetchLike;
  calls: Call[];
} {
  const calls: Call[] = [];
  let i = 0;
  const fetch: FetchLike = async (url, init) => {
    const headers = (init?.headers ?? {}) as Record<string, string>;
    const body = init?.body ? JSON.parse(init.body as string) : undefined;
    calls.push({ url: String(url), method: init?.method ?? "GET", headers, body });
    const r = replies[i++] ?? { status: 200, json: {} };
    const status = r.status ?? 200;
    return {
      ok: status >= 200 && status < 300,
      status,
      async json() { return r.json ?? {}; },
      async text() { return r.text ?? JSON.stringify(r.json ?? {}); },
    };
  };
  return { fetch, calls };
}

const REPO = "mitosisdev/mito";
const TOKEN = "ghp_test";

test("openPullRequest POSTs to the pulls endpoint with head/base/title/body and parses number+url", async () => {
  const { fetch, calls } = fakeFetch([
    { status: 201, json: { number: 7, html_url: "https://github.com/mitosisdev/mito/pull/7" } },
  ]);
  const gh = makeGithub({ repo: REPO, token: TOKEN, fetch });
  const res = await gh.openPullRequest({ head: "mito/3", base: "main", title: "t", body: "b" });
  expect(res).toEqual({ number: 7, url: "https://github.com/mitosisdev/mito/pull/7" });
  expect(calls[0]!.method).toBe("POST");
  expect(calls[0]!.url).toBe("https://api.github.com/repos/mitosisdev/mito/pulls");
  expect(calls[0]!.body).toEqual({ head: "mito/3", base: "main", title: "t", body: "b" });
  expect(calls[0]!.headers.Authorization).toBe("Bearer ghp_test");
  expect(calls[0]!.headers.Accept).toBe("application/vnd.github+json");
});

test("listOpenPullRequests GETs open pulls and maps fields", async () => {
  const { fetch, calls } = fakeFetch([
    { json: [
      { number: 1, title: "a", html_url: "u1", head: { ref: "mito/1" } },
      { number: 2, title: "b", html_url: "u2", head: { ref: "mito/2" } },
    ] },
  ]);
  const gh = makeGithub({ repo: REPO, token: TOKEN, fetch });
  const list = await gh.listOpenPullRequests();
  expect(calls[0]!.method).toBe("GET");
  expect(calls[0]!.url).toBe("https://api.github.com/repos/mitosisdev/mito/pulls?state=open");
  expect(list).toEqual([
    { number: 1, head: "mito/1", title: "a", url: "u1" },
    { number: 2, head: "mito/2", title: "b", url: "u2" },
  ]);
});

test("countOpenPullRequests reflects list length", async () => {
  const { fetch } = fakeFetch([
    { json: [{ number: 1, title: "a", html_url: "u", head: { ref: "x" } }, { number: 2, title: "b", html_url: "u", head: { ref: "y" } }, { number: 3, title: "c", html_url: "u", head: { ref: "z" } }] },
  ]);
  const gh = makeGithub({ repo: REPO, token: TOKEN, fetch });
  expect(await gh.countOpenPullRequests()).toBe(3);
});

test("getPullRequestFiles maps filename/status/additions/deletions/patch", async () => {
  const { fetch, calls } = fakeFetch([
    { json: [{ filename: "src/a.ts", status: "modified", additions: 3, deletions: 1, patch: "@@ -1 +1 @@" }] },
  ]);
  const gh = makeGithub({ repo: REPO, token: TOKEN, fetch });
  const files = await gh.getPullRequestFiles(7);
  expect(calls[0]!.url).toBe("https://api.github.com/repos/mitosisdev/mito/pulls/7/files");
  expect(files).toEqual([{ filename: "src/a.ts", status: "modified", additions: 3, deletions: 1, patch: "@@ -1 +1 @@" }]);
});

test("getCombinedStatus returns success when all check-runs succeed", async () => {
  const { fetch, calls } = fakeFetch([
    { json: { check_runs: [
      { status: "completed", conclusion: "success" },
      { status: "completed", conclusion: "success" },
    ] } },
  ]);
  const gh = makeGithub({ repo: REPO, token: TOKEN, fetch });
  expect(await gh.getCombinedStatus("abc123")).toBe("success");
  expect(calls[0]!.url).toBe("https://api.github.com/repos/mitosisdev/mito/commits/abc123/check-runs");
});

test("getCombinedStatus returns pending while a check-run is still running", async () => {
  const { fetch } = fakeFetch([
    { json: { check_runs: [
      { status: "completed", conclusion: "success" },
      { status: "in_progress", conclusion: null },
    ] } },
  ]);
  const gh = makeGithub({ repo: REPO, token: TOKEN, fetch });
  expect(await gh.getCombinedStatus("abc")).toBe("pending");
});

test("getCombinedStatus returns failure when any completed check-run did not succeed", async () => {
  const { fetch } = fakeFetch([
    { json: { check_runs: [
      { status: "completed", conclusion: "success" },
      { status: "completed", conclusion: "failure" },
    ] } },
  ]);
  const gh = makeGithub({ repo: REPO, token: TOKEN, fetch });
  expect(await gh.getCombinedStatus("abc")).toBe("failure");
});

test("getCombinedStatus returns pending when there are no check-runs yet", async () => {
  const { fetch } = fakeFetch([{ json: { check_runs: [] } }]);
  const gh = makeGithub({ repo: REPO, token: TOKEN, fetch });
  expect(await gh.getCombinedStatus("abc")).toBe("pending");
});

test("mergePullRequest PUTs the merge endpoint with squash method and parses result", async () => {
  const { fetch, calls } = fakeFetch([
    { json: { merged: true, sha: "deadbeef" } },
  ]);
  const gh = makeGithub({ repo: REPO, token: TOKEN, fetch });
  const res = await gh.mergePullRequest(7);
  expect(calls[0]!.method).toBe("PUT");
  expect(calls[0]!.url).toBe("https://api.github.com/repos/mitosisdev/mito/pulls/7/merge");
  expect(calls[0]!.body).toEqual({ merge_method: "squash" });
  expect(res).toEqual({ merged: true, sha: "deadbeef" });
});

test("closePullRequest PATCHes the pull with state closed", async () => {
  const { fetch, calls } = fakeFetch([{ json: {} }]);
  const gh = makeGithub({ repo: REPO, token: TOKEN, fetch });
  await gh.closePullRequest(7);
  expect(calls[0]!.method).toBe("PATCH");
  expect(calls[0]!.url).toBe("https://api.github.com/repos/mitosisdev/mito/pulls/7");
  expect(calls[0]!.body).toEqual({ state: "closed" });
});

test("addComment POSTs to the issues comments endpoint", async () => {
  const { fetch, calls } = fakeFetch([{ status: 201, json: {} }]);
  const gh = makeGithub({ repo: REPO, token: TOKEN, fetch });
  await gh.addComment(7, "looks good");
  expect(calls[0]!.method).toBe("POST");
  expect(calls[0]!.url).toBe("https://api.github.com/repos/mitosisdev/mito/issues/7/comments");
  expect(calls[0]!.body).toEqual({ body: "looks good" });
});

test("deleteBranch DELETEs the heads ref", async () => {
  const { fetch, calls } = fakeFetch([{ status: 204 }]);
  const gh = makeGithub({ repo: REPO, token: TOKEN, fetch });
  await gh.deleteBranch("mito/3");
  expect(calls[0]!.method).toBe("DELETE");
  expect(calls[0]!.url).toBe("https://api.github.com/repos/mitosisdev/mito/git/refs/heads/mito/3");
});

test("deleteBranch swallows 422/404 (already gone) instead of throwing", async () => {
  const { fetch } = fakeFetch([{ status: 422, json: { message: "Reference does not exist" } }]);
  const gh = makeGithub({ repo: REPO, token: TOKEN, fetch });
  await expect(gh.deleteBranch("mito/gone")).resolves.toBeUndefined();
});

test("a non-2xx response on a required call throws with status + body", async () => {
  const { fetch } = fakeFetch([{ status: 401, text: "Bad credentials" }]);
  const gh = makeGithub({ repo: REPO, token: TOKEN, fetch });
  await expect(gh.openPullRequest({ head: "h", base: "main", title: "t", body: "b" })).rejects.toThrow(/401/);
});

test("makeGithub rejects a malformed repo string", () => {
  const { fetch } = fakeFetch([]);
  expect(() => makeGithub({ repo: "not-a-repo", token: TOKEN, fetch })).toThrow();
});
