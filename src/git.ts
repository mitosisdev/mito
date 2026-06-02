// src/git.ts
import { $ } from "bun";

const LKG_TAG = "mito-last-known-good";

export async function currentCommit(dir: string): Promise<string> {
  return (await $`git -C ${dir} rev-parse HEAD`.text()).trim();
}

export async function createBranch(dir: string, name: string): Promise<void> {
  await $`git -C ${dir} checkout -q -B ${name}`;
}

export async function commitAll(dir: string, message: string): Promise<string> {
  await $`git -C ${dir} add -A`;
  await $`git -C ${dir} commit -q -m ${message}`;
  return currentCommit(dir);
}

export async function runTests(dir: string): Promise<boolean> {
  const res = await $`bun test`.cwd(dir).nothrow().quiet();
  return res.exitCode === 0;
}

export async function tagLastKnownGood(dir: string, commit: string): Promise<void> {
  await $`git -C ${dir} tag -f ${LKG_TAG} ${commit}`;
}

// Return the short name of the branch HEAD currently points at, or "" when
// HEAD is detached (rev-parse prints "HEAD" in that case).
async function currentBranch(dir: string): Promise<string> {
  const name = (
    await $`git -C ${dir} rev-parse --abbrev-ref HEAD`.nothrow().text()
  ).trim();
  return name === "HEAD" ? "" : name;
}

// Resolve the default branch to land on, branch-name agnostic. Prefers main,
// then master, then whatever branch HEAD is currently on (e.g. a repo whose
// default is neither main nor master). Returns "" if none can be determined.
async function defaultBranch(dir: string, current: string): Promise<string> {
  const exists = async (ref: string): Promise<boolean> =>
    (
      await $`git -C ${dir} rev-parse -q --verify ${`refs/heads/${ref}`}`
        .nothrow()
        .quiet()
    ).exitCode === 0;

  if (await exists("main")) return "main";
  if (await exists("master")) return "master";
  return current;
}

// Restore the working tree + HEAD to a known-good state, then clean up the
// abandoned cycle branch.
//
// This MUST be robust on the very first cycle, before bin/verify.ts has ever
// created the mito-last-known-good tag. The can't-brick-itself guarantee means
// a failed change always returns the tree to the committed default-branch state.
//
//   - Tag present:  checkout default branch, then `reset --hard <tag>`.
//   - Tag ABSENT:   checkout default branch, `reset --hard HEAD`, then
//                   `git clean -fd` so the tree returns to the committed
//                   default-branch state regardless.
//
// Branch-name agnostic throughout (this repo defaults to `master`). The
// abandoned `mito/<n>` branch we started on is deleted after we land safely
// on the default branch, guarded so it never errors if already gone.
export async function revertToLastKnownGood(dir: string): Promise<void> {
  // Capture the branch we're abandoning before we move off it.
  const abandoned = await currentBranch(dir);

  const tagExists =
    (
      await $`git -C ${dir} rev-parse -q --verify ${`refs/tags/${LKG_TAG}`}`
        .nothrow()
        .quiet()
    ).exitCode === 0;

  const target = await defaultBranch(dir, abandoned);
  if (target) {
    await $`git -C ${dir} checkout -q ${target}`;
  }

  if (tagExists) {
    await $`git -C ${dir} reset -q --hard ${LKG_TAG}`;
  } else {
    // First-cycle fallback: no tag yet. Reset to the committed default-branch
    // HEAD and scrub any untracked debris so the tree is clean.
    await $`git -C ${dir} reset -q --hard HEAD`;
    await $`git -C ${dir} clean -fdq`.nothrow();
  }

  // Delete the abandoned cycle branch now that we've landed elsewhere.
  // Guarded: -D is force-delete, and we only attempt it if we actually moved
  // off it onto a different branch. .nothrow() keeps it safe if it's gone.
  if (abandoned && abandoned !== target) {
    await $`git -C ${dir} branch -D ${abandoned}`.nothrow().quiet();
  }
}
