// src/changelog.ts
const HEADER = "# Changelog";

// Insert the newest entry as the first bullet directly under the "# Changelog"
// header, separated from the header by a single blank line, preserving any
// existing entries below it. Output always ends with a trailing newline.
export function addChangelogEntry(existing: string, entry: string, dateIso: string): string {
  const bullet = `- ${dateIso} — ${entry}`;

  // Lines that are not the header and not blank — i.e. the existing body content.
  const priorLines = existing
    .split("\n")
    .filter((l) => l.trim().length > 0 && !l.startsWith(HEADER));

  const body = [HEADER, "", bullet, ...priorLines].join("\n");
  return body + "\n";
}

// Parse a changelog back into structured data, newest first.
// Returns an empty array for empty or header-only files.
export function parseChangelog(text: string): Array<{ date: string; entry: string }> {
  const bulletRe = /^- (\d{4}-\d{2}-\d{2}) — (.+)$/;
  const results: Array<{ date: string; entry: string }> = [];

  for (const line of text.split("\n")) {
    const m = bulletRe.exec(line.trim());
    if (m) {
      results.push({ date: m[1], entry: m[2] });
    }
  }

  return results;
}
