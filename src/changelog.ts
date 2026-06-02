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
