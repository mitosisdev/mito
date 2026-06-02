// src/diffsize.ts — bound the blast radius of a single autonomous change.
// A runaway worker could otherwise propose a thousand-line, fifty-file PR; the
// cap stops that at the door. Pure: counts + caps in, allowed/blocked out.

export const DEFAULT_MAX_FILES = 12;
export const DEFAULT_MAX_LINES = 600;

export interface DiffStats { files: number; lines: number; }
export interface DiffCaps { maxFiles: number; maxLines: number; }
export interface DiffSizeResult { allowed: boolean; files: number; lines: number; }

// Parse `git diff --numstat` output. Each line is `<added>\t<deleted>\t<path>`.
// Binary files appear as `-\t-\t<path>` (counted as a file, zero lines).
export function parseNumstat(numstat: string): DiffStats {
  let files = 0;
  let lines = 0;
  for (const raw of numstat.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const parts = line.split("\t");
    if (parts.length < 3) continue;
    files += 1;
    const added = Number(parts[0]);
    const deleted = Number(parts[1]);
    if (Number.isFinite(added)) lines += added;
    if (Number.isFinite(deleted)) lines += deleted;
  }
  return { files, lines };
}

// Caps are inclusive: exactly at the limit is still allowed; one over blocks.
export function checkDiffSize(stats: DiffStats, caps: DiffCaps): DiffSizeResult {
  const allowed = stats.files <= caps.maxFiles && stats.lines <= caps.maxLines;
  return { allowed, files: stats.files, lines: stats.lines };
}
