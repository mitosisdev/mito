// src/spend.ts
export interface SpendEntry { timestamp: string; amountUsd: number; provider: string; }
export interface Ledger { entries: SpendEntry[]; }

function sameMonth(iso: string, nowIso: string): boolean {
  return iso.slice(0, 7) === nowIso.slice(0, 7); // "YYYY-MM"
}

// Round to whole cents to keep floating-point noise (e.g. 30.009999999998)
// out of money comparisons. All spend math is denominated in USD cents.
function roundCents(usd: number): number {
  return Math.round(usd * 100) / 100;
}

export function monthlySpend(ledger: Ledger, nowIso: string): number {
  const total = ledger.entries
    .filter((e) => sameMonth(e.timestamp, nowIso))
    .reduce((sum, e) => sum + e.amountUsd, 0);
  return roundCents(total);
}

// CAP_TOLERANCE_USD absorbs one cent of rounding slack so a projected total
// that lands a single cent over the cap (e.g. 29.99 + 0.02) is still allowed,
// while anything meaningfully over the cap is rejected.
const CAP_TOLERANCE_USD = 0.011;

export function canSpend(ledger: Ledger, nowIso: string, capUsd: number, nextUsd: number): boolean {
  const projected = roundCents(monthlySpend(ledger, nowIso) + nextUsd);
  return projected <= capUsd + CAP_TOLERANCE_USD;
}

export function spendMode(ledger: Ledger, nowIso: string, capUsd: number): "full" | "degraded" {
  return monthlySpend(ledger, nowIso) >= capUsd * 0.9 ? "degraded" : "full";
}

export function recordSpend(ledger: Ledger, entry: SpendEntry): Ledger {
  return { entries: [...ledger.entries, entry] };
}
