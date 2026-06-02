import { test, expect } from "bun:test";
import { statLine, type Stats } from "./lib";

test("statLine summarizes stats with correct pluralization", () => {
  const s: Stats = { cyclesRun: 12, prsMerged: 8, daysAlive: 3, lastChange: "added doctor" };
  expect(statLine(s)).toBe("12 cycles · 8 PRs merged · alive 3 days · last: added doctor");
});

test("statLine handles singulars and an empty last change", () => {
  const s: Stats = { cyclesRun: 1, prsMerged: 1, daysAlive: 1, lastChange: "" };
  expect(statLine(s)).toBe("1 cycle · 1 PR merged · alive 1 day · last: —");
});

test("statLine handles a cold start", () => {
  const s: Stats = { cyclesRun: 0, prsMerged: 0, daysAlive: 0, lastChange: "bootstrapping" };
  expect(statLine(s)).toBe("0 cycles · 0 PRs merged · alive 0 days · last: bootstrapping");
});
