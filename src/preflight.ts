// src/preflight.ts — pure function for building preflight output
import { parseBacklog, type BacklogTask } from "./backlog";
import { spendMode, type Ledger } from "./spend";
import type { State } from "./state";

export interface PreflightResult {
  proceed: true;
  spendMode: "full" | "degraded";
  cycles: number;
  pendingTasks: BacklogTask[];
  rejectedIdeas: string[];
}

/**
 * Build the preflight output object from runtime state + backlog markdown.
 *
 * @param state       - Loaded State (may optionally carry a ledger field)
 * @param backlogMarkdown - Raw BACKLOG.md contents (empty string if file absent)
 * @param nowIso      - Current ISO timestamp (for spend-mode calculation)
 * @param spendCapUsd - Monthly spend cap in USD
 */
export function buildPreflight(
  state: State & { ledger?: Ledger },
  backlogMarkdown: string,
  nowIso: string,
  spendCapUsd: number,
): PreflightResult {
  const ledger: Ledger = state.ledger ?? { entries: [] };
  const mode = spendMode(ledger, nowIso, spendCapUsd);

  const allTasks = parseBacklog(backlogMarkdown);
  const pendingTasks = allTasks.filter((t) => !t.done);

  const rejectedIdeas = state.rejectedIdeas.map((r) => r.title);

  return {
    proceed: true,
    spendMode: mode,
    cycles: state.cycles.length,
    pendingTasks,
    rejectedIdeas,
  };
}
