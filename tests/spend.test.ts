// tests/spend.test.ts
import { test, expect } from "bun:test";
import { monthlySpend, canSpend, recordSpend, spendMode, type Ledger } from "../src/spend";

const NOW = "2026-06-15T12:00:00.000Z";
function ledger(entries: Array<[string, number]>): Ledger {
  return { entries: entries.map(([timestamp, amountUsd]) => ({ timestamp, amountUsd, provider: "x" })) };
}

test("monthlySpend only counts the current calendar month", () => {
  const l = ledger([["2026-05-31T23:00:00.000Z", 10], ["2026-06-02T00:00:00.000Z", 4]]);
  expect(monthlySpend(l, NOW)).toBe(4);
});

test("canSpend is false once the month's total would exceed the cap", () => {
  const l = ledger([["2026-06-01T00:00:00.000Z", 29.99]]);
  expect(canSpend(l, NOW, 30, 0.02)).toBe(true);
  expect(canSpend(l, NOW, 30, 0.5)).toBe(false);
});

test("spendMode degrades at 90% of cap", () => {
  expect(spendMode(ledger([["2026-06-01T00:00:00.000Z", 10]]), NOW, 30)).toBe("full");
  expect(spendMode(ledger([["2026-06-01T00:00:00.000Z", 27]]), NOW, 30)).toBe("degraded");
});

test("recordSpend appends an entry", () => {
  const l = recordSpend({ entries: [] }, { timestamp: NOW, amountUsd: 0.02, provider: "x" });
  expect(l.entries).toHaveLength(1);
});
