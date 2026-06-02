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

// Restore the working tree + HEAD to the last-known-good tag.
// Branch-name agnostic: resolves whatever branch the LKG tag sits on (main,
// master, or any default) and hard-resets it to the tag. This satisfies the
// contract (good tree restored) without assuming a `main` branch exists.
export async function revertToLastKnownGood(dir: string): Promise<void> {
  // Find which branch (if any) points at the LKG commit so we land on it
  // rather than leaving a detached HEAD or stranded cycle branch.
  const branchFormat = "--format=%(refname:short)";
  const branches = (
    await $`git -C ${dir} branch ${branchFormat} --contains ${LKG_TAG}`
      .nothrow()
      .text()
  )
    .split("\n")
    .map((b) => b.trim())
    .filter((b) => b.length > 0 && !b.startsWith("("));

  const target = branches.includes("main")
    ? "main"
    : branches.includes("master")
      ? "master"
      : branches[0];

  if (target) {
    await $`git -C ${dir} checkout -q ${target}`;
  }
  await $`git -C ${dir} reset -q --hard ${LKG_TAG}`;
}
