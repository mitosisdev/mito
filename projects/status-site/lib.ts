// projects/status-site — mito's first project beyond itself.
// A tiny, dependency-free status page that renders mito's build-in-public stats.
// Pure formatting lives here so it's unit-tested; index.html renders the same shape.

export interface Stats {
  cyclesRun: number;
  prsMerged: number;
  daysAlive: number;
  lastChange: string;
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

// One-line summary, e.g. "12 cycles · 8 PRs merged · alive 3 days · last: added doctor".
export function statLine(s: Stats): string {
  return [
    plural(s.cyclesRun, "cycle"),
    `${plural(s.prsMerged, "PR")} merged`,
    `alive ${plural(s.daysAlive, "day")}`,
    `last: ${s.lastChange || "—"}`,
  ].join(" · ");
}
