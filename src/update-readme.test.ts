import { describe, expect, it } from "bun:test";
import { injectStats, STATS_START, STATS_END } from "../bin/update-readme.js";

const FAKE_README = `# Title

Some text.

## Stats

${STATS_START}
| Metric | Value |
|--------|-------|
| Build cycles | 0 |
${STATS_END}

More text.
`;

describe("injectStats", () => {
  it("replaces content between markers", () => {
    const stats = "| Metric | Value |\n|--------|-------|\n| Build cycles | 5 |";
    const result = injectStats(FAKE_README, stats);
    expect(result).toContain("| Build cycles | 5 |");
    expect(result).not.toContain("| Build cycles | 0 |");
  });

  it("preserves content before and after markers", () => {
    const result = injectStats(FAKE_README, "new stats");
    expect(result).toContain("# Title");
    expect(result).toContain("More text.");
  });

  it("keeps both markers in the output", () => {
    const result = injectStats(FAKE_README, "stats here");
    expect(result).toContain(STATS_START);
    expect(result).toContain(STATS_END);
  });

  it("returns readme unchanged when start marker is missing", () => {
    const noStart = FAKE_README.replace(STATS_START, "<!-- no-marker -->");
    const result = injectStats(noStart, "new stats");
    expect(result).toBe(noStart);
  });

  it("returns readme unchanged when end marker is missing", () => {
    const noEnd = FAKE_README.replace(STATS_END, "<!-- no-end -->");
    const result = injectStats(noEnd, "new stats");
    expect(result).toBe(noEnd);
  });
});
