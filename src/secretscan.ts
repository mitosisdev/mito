// src/secretscan.ts — scan a unified diff for committed secrets BEFORE a PR
// is ever opened. The public-text gate (src/safety.ts) only ever saw the post
// body; nothing scanned the *code* mito commits. This closes that gap.
//
// Pure: a diff string in, a verdict out. No git, no network — bin/propose.ts
// feeds it `git diff main...HEAD`.
import { SECRET_PATTERNS } from "./safety";

export interface ScanResult { clean: boolean; findings: string[]; }

// Generic `NAME=value` / `NAME: "value"` assignments where NAME looks like a
// credential (KEY / SECRET / TOKEN / PASSWORD) and the value is real-looking.
// "Real-looking" = >=12 chars of secret-ish characters, so placeholders like
// `API_KEY=`, `SECRET=your-secret-here`, or `TOKEN=changeme` don't trip it.
const GENERIC_ASSIGNMENT =
  /\b[A-Z0-9_]*(?:API[_-]?KEY|SECRET|TOKEN|PASSWORD|PASSWD|ACCESS[_-]?KEY)[A-Z0-9_]*\s*[:=]\s*["'`]?([A-Za-z0-9_\-./+]{12,})["'`]?/i;

// Values that are obviously not real secrets even when long enough — common
// placeholder words seen in templates and docs.
const PLACEHOLDER = /^(?:your[-_]?|changeme|placeholder|example|xxx+|dummy|todo|none|null|false|true)/i;

function isRealSecretValue(value: string): boolean {
  if (PLACEHOLDER.test(value)) return false;
  // Reject obvious "your-secret-here" style hyphenated english placeholders.
  if (/^(your|the|a|an)[-_]/i.test(value)) return false;
  return true;
}

// Pull just the added content lines out of a unified diff. A line starting with
// a single '+' is an addition; the '+++ b/file' header (starts with '+++') is
// metadata, not content, so it's excluded.
function addedLines(diff: string): string[] {
  return diff
    .split("\n")
    .filter((l) => l.startsWith("+") && !l.startsWith("+++"))
    .map((l) => l.slice(1));
}

export function scanDiff(diff: string): ScanResult {
  const found = new Set<string>();

  for (const line of addedLines(diff)) {
    for (const { label, re } of SECRET_PATTERNS) {
      if (re.test(line)) found.add(label);
    }
    const m = GENERIC_ASSIGNMENT.exec(line);
    if (m && m[1] && isRealSecretValue(m[1])) {
      found.add("generic_secret_assignment");
    }
  }

  const findings = [...found];
  return { clean: findings.length === 0, findings };
}
