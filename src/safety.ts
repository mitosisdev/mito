// src/safety.ts
export interface SafetyResult { ok: boolean; reasons: string[]; }

const MAX_LEN = 280;

// Labelled secret signatures, the single source of truth shared with the
// code-diff scanner (src/secretscan.ts) so the two never drift apart.
export interface SecretPattern { label: string; re: RegExp; }

export const SECRET_PATTERNS: SecretPattern[] = [
  { label: "openai_key", re: /sk-[A-Za-z0-9]{16,}/ },                     // OpenAI-style
  { label: "github_pat", re: /github_pat_[A-Za-z0-9_]{20,}/ },           // GitHub fine-grained PAT
  { label: "github_pat", re: /ghp_[A-Za-z0-9]{20,}/ },                   // GitHub classic PAT
  { label: "aws_access_key", re: /AKIA[0-9A-Z]{16}/ },                   // AWS access key id
  { label: "slack_token", re: /xox[baprs]-[A-Za-z0-9-]{10,}/ },          // Slack token
  { label: "pem_private_key", re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },// PEM private key
];

const BLOCKLIST: string[] = ["nigger", "faggot", "kike", "retard"]; // hard slur backstop

export function checkContent(text: string): SafetyResult {
  const reasons: string[] = [];
  if (text.trim().length === 0) reasons.push("empty");
  if (text.length > MAX_LEN) reasons.push("too_long");
  if (SECRET_PATTERNS.some(({ re }) => re.test(text))) reasons.push("possible_secret");
  if (/https?:\/\//i.test(text)) reasons.push("contains_url");
  const lower = text.toLowerCase();
  if (BLOCKLIST.some((w) => lower.includes(w))) reasons.push("blocklisted_term");
  return { ok: reasons.length === 0, reasons };
}
