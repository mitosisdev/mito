// src/state.ts
import { readFileSync, writeFileSync, existsSync } from "node:fs";

export interface CycleRecord {
  id: number;
  timestamp: string;
  action: string;
  branch: string;
  testsPassed: boolean;
  committed: boolean;
  posted: boolean;
  postUrl?: string;
}
export interface BacklogItem { id: number; idea: string; status: "pending" | "done" | "dropped"; }

export interface PullRequestRecord {
  number: number;
  branch: string;
  url: string;
  title: string;
  status: "open" | "merged" | "closed";
  proposedAt: string;
  resolvedAt?: string;
  mergeSha?: string;
  closeReason?: string;
}

export interface State {
  cycles: CycleRecord[];
  backlog: BacklogItem[];
  lastKnownGood: string | null;
  pullRequests: PullRequestRecord[];
}

export function emptyState(): State { return { cycles: [], backlog: [], lastKnownGood: null, pullRequests: [] }; }

export function loadState(path: string): State {
  if (!existsSync(path)) return emptyState();
  const raw = JSON.parse(readFileSync(path, "utf8")) as Partial<State>;
  // Backfill fields older state files predate, so callers always get arrays.
  return { ...emptyState(), ...raw, pullRequests: raw.pullRequests ?? [] };
}

export function saveState(path: string, state: State): void {
  writeFileSync(path, JSON.stringify(state, null, 2) + "\n");
}

export function addCycle(state: State, c: Omit<CycleRecord, "id" | "timestamp">): State {
  const id = (state.cycles.at(-1)?.id ?? 0) + 1;
  const record: CycleRecord = { id, timestamp: new Date().toISOString(), ...c };
  return { ...state, cycles: [...state.cycles, record] };
}

export function setLastKnownGood(state: State, commit: string): State {
  return { ...state, lastKnownGood: commit };
}

export function recordProposedPr(
  state: State,
  pr: { number: number; branch: string; url: string; title: string },
): State {
  const record: PullRequestRecord = {
    number: pr.number,
    branch: pr.branch,
    url: pr.url,
    title: pr.title,
    status: "open",
    proposedAt: new Date().toISOString(),
  };
  return { ...state, pullRequests: [...state.pullRequests, record] };
}

function updatePr(state: State, number: number, patch: Partial<PullRequestRecord>): State {
  return {
    ...state,
    pullRequests: state.pullRequests.map((p) =>
      p.number === number ? { ...p, ...patch } : p,
    ),
  };
}

export function markPrMerged(state: State, number: number, mergeSha?: string): State {
  return updatePr(state, number, { status: "merged", mergeSha, resolvedAt: new Date().toISOString() });
}

export function markPrClosed(state: State, number: number, reason?: string): State {
  return updatePr(state, number, { status: "closed", closeReason: reason, resolvedAt: new Date().toISOString() });
}
