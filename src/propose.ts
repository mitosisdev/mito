// src/propose.ts — the worker's "propose this change as a PR" decision logic.
//
// Pure and fully injected so the cap / tests-failed / propose branches are
// unit-tested with no network or git. bin/propose.ts wires in the real
// runTests (src/git), a GitHub client (src/github), and a git push.

export interface ProposeInput { branch: string; title: string; body: string; }

export interface ProposeDeps {
  runTests(): Promise<boolean>;
  countOpenPullRequests(): Promise<number>;
  // The branch's diff vs main — fed to the secret scan and size guard before
  // anything is published.
  branchDiff(): Promise<string>;
  scanDiff(diff: string): { clean: boolean; findings: string[] };
  checkDiffSize(diff: string): { allowed: boolean; files: number; lines: number };
  pushBranch(branch: string): Promise<void>;
  openPullRequest(input: { head: string; base: string; title: string; body: string }): Promise<{ number: number; url: string }>;
  discardBranch(): Promise<void>;
}

export type ProposeResult =
  | { proposed: false; reason: "tests_failed" | "pr_cap" }
  | { proposed: false; reason: "secret_detected"; findings: string[] }
  | { proposed: false; reason: "diff_too_large"; files: number; lines: number }
  | { proposed: true; number: number; url: string };

export const PR_CAP = 3;

export async function proposeChange(deps: ProposeDeps, input: ProposeInput): Promise<ProposeResult> {
  // 1. The change must pass the full suite, or it never leaves the worker.
  if (!(await deps.runTests())) {
    await deps.discardBranch();
    return { proposed: false, reason: "tests_failed" };
  }

  // 2. Respect the open-PR cap; never let the worker pile up review debt.
  if ((await deps.countOpenPullRequests()) >= PR_CAP) {
    return { proposed: false, reason: "pr_cap" };
  }

  // 3. Inspect the actual diff before publishing anything.
  const diff = await deps.branchDiff();

  // 3a. Secret scan is a HARD block: a leaked key must never reach a public
  // commit. Discard the branch so the bad work doesn't linger.
  const scan = deps.scanDiff(diff);
  if (!scan.clean) {
    await deps.discardBranch();
    return { proposed: false, reason: "secret_detected", findings: scan.findings };
  }

  // 3b. Bound the blast radius — refuse an oversized change outright.
  const size = deps.checkDiffSize(diff);
  if (!size.allowed) {
    return { proposed: false, reason: "diff_too_large", files: size.files, lines: size.lines };
  }

  // 4. Publish the branch, then open the PR against main.
  await deps.pushBranch(input.branch);
  const pr = await deps.openPullRequest({
    head: input.branch, base: "main", title: input.title, body: input.body,
  });
  return { proposed: true, number: pr.number, url: pr.url };
}
