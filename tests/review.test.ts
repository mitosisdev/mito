// tests/review.test.ts — reviewer-side logic: gather PR review data + merge gate.
import { test, expect } from "bun:test";
import { reviewList, mergeIfGreen, type ReviewDeps } from "../src/review";

function deps(over: Partial<ReviewDeps>): ReviewDeps {
  return {
    listOpenPullRequests: async () => [
      { number: 1, head: "mito/1", headSha: "sha1", title: "a", url: "u1" },
    ],
    getPullRequestFiles: async () => [
      { filename: "src/a.ts", status: "modified", additions: 2, deletions: 1 },
    ],
    getCombinedStatus: async () => "success",
    getPullRequest: async () => ({ state: "open" }),
    mergePullRequest: async () => ({ merged: true, sha: "sha1" }),
    deleteBranch: async () => {},
    ...over,
  };
}

test("reviewList returns each open PR with its files + CI status", async () => {
  const list = await reviewList(deps({}));
  expect(list).toHaveLength(1);
  expect(list[0]!.number).toBe(1);
  expect(list[0]!.head).toBe("mito/1");
  expect(list[0]!.ci).toBe("success");
  expect(list[0]!.files).toEqual([{ filename: "src/a.ts", status: "modified", additions: 2, deletions: 1 }]);
});

test("reviewList queries CI against the PR head SHA, not branch name", async () => {
  let askedRef = "";
  await reviewList(deps({ getCombinedStatus: async (ref) => { askedRef = ref; return "pending"; } }));
  expect(askedRef).toBe("sha1");
});

test("mergeIfGreen merges + deletes branch when CI is success", async () => {
  let deleted = "";
  let merged = false;
  const r = await mergeIfGreen(deps({
    getCombinedStatus: async () => "success",
    mergePullRequest: async () => { merged = true; return { merged: true, sha: "abc" }; },
    deleteBranch: async (b) => { deleted = b; },
  }), 1, "mito/1", "sha1");
  expect(r).toEqual({ merged: true, sha: "abc" });
  expect(merged).toBe(true);
  expect(deleted).toBe("mito/1");
});

test("mergeIfGreen refuses to merge when CI is pending", async () => {
  let merged = false;
  const r = await mergeIfGreen(deps({
    getCombinedStatus: async () => "pending",
    mergePullRequest: async () => { merged = true; return { merged: true }; },
  }), 1, "mito/1", "sha1");
  expect(r.merged).toBe(false);
  expect(r.reason).toBe("ci_not_green");
  expect(r.ci).toBe("pending");
  expect(merged).toBe(false);
});

test("mergeIfGreen refuses to merge when CI failed", async () => {
  const r = await mergeIfGreen(deps({ getCombinedStatus: async () => "failure" }), 1, "mito/1", "sha1");
  expect(r.merged).toBe(false);
  expect(r.reason).toBe("ci_not_green");
  expect(r.ci).toBe("failure");
});

test("mergeIfGreen returns already_closed when PR state is closed", async () => {
  let merged = false;
  const r = await mergeIfGreen(deps({
    getPullRequest: async () => ({ state: "closed" }),
    mergePullRequest: async () => { merged = true; return { merged: true }; },
  }), 1, "mito/1", "sha1");
  expect(r.merged).toBe(false);
  expect(r.reason).toBe("already_closed");
  expect(merged).toBe(false);
});

test("mergeIfGreen returns already_closed when PR state is merged", async () => {
  let merged = false;
  const r = await mergeIfGreen(deps({
    getPullRequest: async () => ({ state: "merged" }),
    mergePullRequest: async () => { merged = true; return { merged: true }; },
  }), 1, "mito/1", "sha1");
  expect(r.merged).toBe(false);
  expect(r.reason).toBe("already_closed");
  expect(merged).toBe(false);
});

test("mergeIfGreen proceeds normally when PR state is open", async () => {
  let merged = false;
  const r = await mergeIfGreen(deps({
    getPullRequest: async () => ({ state: "open" }),
    getCombinedStatus: async () => "success",
    mergePullRequest: async () => { merged = true; return { merged: true, sha: "xyz" }; },
  }), 1, "mito/1", "sha1");
  expect(r.merged).toBe(true);
  expect(merged).toBe(true);
});
