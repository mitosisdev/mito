// src/safety.ts
export interface SafetyResult { ok: boolean; reasons: string[]; }

const MAX_LEN = 280;

const SECRET_PATTERNS: RegExp[] = [
  /sk-[A-Za-z0-9]{16,}/,                      // OpenAI-style
  /ghp_[A-Za-z0-9]{20,}/,                     // GitHub PAT
  /AKIA[0-9A-Z]{16}/,                         // AWS access key id
  /xox[baprs]-[A-Za-z0-9-]{10,}/,             // Slack token
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,       // PEM private key
];

const BLOCKLIST: string[] = ["nigger", "faggot", "kike", "retard"]; // hard slur backstop

export function checkContent(text: string): SafetyResult {
  const reasons: string[] = [];
  if (text.trim().length === 0) reasons.push("empty");
  if (text.length > MAX_LEN) reasons.push("too_long");
  if (SECRET_PATTERNS.some((re) => re.test(text))) reasons.push("possible_secret");
  if (/https?:\/\//i.test(text)) reasons.push("contains_url");
  const lower = text.toLowerCase();
  if (BLOCKLIST.some((w) => lower.includes(w))) reasons.push("blocklisted_term");
  return { ok: reasons.length === 0, reasons };
}
