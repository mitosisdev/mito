// src/thrash.ts — detect when the worker is churning the same files it already had rejected.
// Pure functions only; no I/O.
import type { PullRequestRecord } from "./state";

export interface ThrashResult {
  thrash: boolean;
  closedPrNumber?: number;
  overlapFiles?: string[];
}

// Extract file paths from `git diff --numstat` output.
// Each line format: `<added>\t<deleted>\t<path>`  (binary: `-\t-\t<path>`)
export function parseNumstatFiles(numstat: string): string[] {
  const files: string[] = [];
  for (const raw of numstat.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const parts = line.split("\t");
    if (parts.length < 3) continue;
    const path = parts.slice(2).join("\t"); // handles tabs in filenames (rare)
    if (path) files.push(path);
  }
  return files;
}

// Returns thrash=true when the current branch is modifying files that were
// already in a closed (rejected) PR — indicating the loop is stuck repeating
// itself. Threshold: >=50% of current files appeared in any single closed PR.
export function checkThrash(
  closedPrs: Pick<PullRequestRecord, "number" | "status" | "files">[],
  currentFiles: string[],
): ThrashResult {
  if (currentFiles.length === 0) return { thrash: false };

  for (const pr of closedPrs) {
    if (pr.status !== "closed") continue;
    if (!pr.files || pr.files.length === 0) continue;

    const prFileSet = new Set(pr.files);
    const overlap = currentFiles.filter((f) => prFileSet.has(f));

    if (overlap.length >= Math.ceil(currentFiles.length / 2)) {
      return { thrash: true, closedPrNumber: pr.number, overlapFiles: overlap };
    }
  }

  return { thrash: false };
}
