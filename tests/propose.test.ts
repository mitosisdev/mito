// tests/propose.test.ts — the worker's propose-a-PR decision logic.
//
// All side effects are injected (tests, cap count, branch push, PR open) so
// the cap / tests-failed / propose branches are exercised with no network/git.
import { test, expect } from "bun:test";
import { proposeChange, type ProposeDeps } from "../src/propose";

function deps(over: Partial<ProposeDeps>): ProposeDeps {
  return {
    runTests: async () => true,
    countOpenPullRequests: async () => 0,
    pushBranch: async () => {},
    openPullRequest: async () => ({ number: 42, url: "https://github.com/mitosisdev/mito/pull/42" }),
    discardBranch: async () => {},
    ...over,
  };
}

const input = { branch: "mito/5", title: "add widget", body: "does a thing" };

test("tests failing -> no PR, branch discarded, reason tests_failed", async () => {
  let discarded = false;
  let pushed = false;
  let opened = false;
  const r = await proposeChange(deps({
    runTests: async () => false,
    discardBranch: async () => { discarded = true; },
    pushBranch: async () => { pushed = true; },
    openPullRequest: async () => { opened = true; return { number: 0, url: "" }; },
  }), input);
  expect(r).toEqual({ proposed: false, reason: "tests_failed" });
  expect(discarded).toBe(true);
  expect(pushed).toBe(false);
  expect(opened).toBe(false);
});

test("at the 3-PR cap -> no PR opened, reason pr_cap", async () => {
  let pushed = false;
  let opened = false;
  const r = await proposeChange(deps({
    countOpenPullRequests: async () => 3,
    pushBranch: async () => { pushed = true; },
    openPullRequest: async () => { opened = true; return { number: 0, url: "" }; },
  }), input);
  expect(r).toEqual({ proposed: false, reason: "pr_cap" });
  expect(pushed).toBe(false);
  expect(opened).toBe(false);
});

test("above the cap (defensive >=) -> still pr_cap", async () => {
  const r = await proposeChange(deps({ countOpenPullRequests: async () => 4 }), input);
  expect(r).toEqual({ proposed: false, reason: "pr_cap" });
});

test("passing tests + under cap -> push branch then open PR, returns number+url", async () => {
  const order: string[] = [];
  const r = await proposeChange(deps({
    runTests: async () => { order.push("test"); return true; },
    countOpenPullRequests: async () => 2,
    pushBranch: async (b) => { order.push(`push:${b}`); },
    openPullRequest: async (i) => { order.push(`open:${i.head}->${i.base}`); return { number: 9, url: "u9" }; },
  }), input);
  expect(r).toEqual({ proposed: true, number: 9, url: "u9" });
  // tests run first, then push, then open — and push happens before opening the PR.
  expect(order).toEqual(["test", "push:mito/5", "open:mito/5->main"]);
});

test("opens the PR with head=branch and base=main", async () => {
  let seen: { head: string; base: string; title: string; body: string } | null = null;
  await proposeChange(deps({
    openPullRequest: async (i) => { seen = i; return { number: 1, url: "u" }; },
  }), input);
  expect(seen).toEqual({ head: "mito/5", base: "main", title: "add widget", body: "does a thing" });
});
