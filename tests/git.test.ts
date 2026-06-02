// tests/git.test.ts
import { test, expect } from "bun:test";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { $ } from "bun";
import { createBranch, commitAll, currentCommit, tagLastKnownGood, revertToLastKnownGood } from "../src/git";

async function tmpRepo(): Promise<string> {
  const dir = mkdtempSync(join(tmpdir(), "mito-git-"));
  await $`git -C ${dir} init -q`;
  await $`git -C ${dir} config user.email t@t.t`;
  await $`git -C ${dir} config user.name t`;
  writeFileSync(join(dir, "a.txt"), "1");
  await $`git -C ${dir} add -A`;
  await $`git -C ${dir} commit -q -m init`;
  return dir;
}

test("branch, commit, tag last-good, then revert restores the good tree", async () => {
  const dir = await tmpRepo();
  const good = await currentCommit(dir);
  await tagLastKnownGood(dir, good);

  await createBranch(dir, "mito/1");
  writeFileSync(join(dir, "a.txt"), "BROKEN");
  await commitAll(dir, "break it");
  expect(await currentCommit(dir)).not.toBe(good);

  await revertToLastKnownGood(dir);
  const restored = (await $`git -C ${dir} show HEAD:a.txt`.text()).trim();
  expect(restored).toBe("1");
  rmSync(dir, { recursive: true, force: true });
});
