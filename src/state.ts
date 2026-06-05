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

export interface RejectedIdea {
  title: string;
  reason: string;
  closedAt: string;
}

export interface BuildSession {
  id: string;        // ISO timestamp slug, e.g. "2026-06-05T01:00:00.000Z"
  startedAt: string; // ISO timestamp
  prsOpened: number; // how many PRs this session opened (default 0 on start)
}

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
  files?: string[];
}

export interface State {
  cycles: CycleRecord[];
  backlog: BacklogItem[];
  lastKnownGood: string | null;
  pullRequests: PullRequestRecord[];
  rejectedIdeas: RejectedIdea[];
  buildSessions: BuildSession[];
}

export function emptyState(): State { return { cycles: [], backlog: [], lastKnownGood: null, pullRequests: [], rejectedIdeas: [], buildSessions: [] }; }

export function loadState(path: string): State {
  if (!existsSync(path)) return emptyState();
  const raw = JSON.parse(readFileSync(path, "utf8")) as Partial<State>;
  // Backfill fields older state files predate, so callers always get arrays.
  return { ...emptyState(), ...raw, pullRequests: raw.pullRequests ?? [], rejectedIdeas: raw.rejectedIdeas ?? [], buildSessions: raw.buildSessions ?? [] };
}

export function saveState(path: string, state: State): void {
  writeFileSync(path, JSON.stringify(state, null, 2) + "\n");
}

export function addCycle(state: State, c: Omit<CycleRecord, "id" | "timestamp">): State {
  const id = (state.cycles.at(-1)?.id ?? 0) + 1;
  const record: CycleRecord = { id, timestamp: new Date().toISOString(), ...c };
  return { ...state, cycles: [...state.cycles, record] };
}

export function startBuildSession(state: State, startedAt: string): State {
  const session: BuildSession = { id: startedAt, startedAt, prsOpened: 0 };
  return { ...state, buildSessions: [...state.buildSessions, session] };
}

export function setLastKnownGood(state: State, commit: string): State {
  return { ...state, lastKnownGood: commit };
}

export function recordProposedPr(
  state: State,
  pr: { number: number; branch: string; url: string; title: string; files?: string[] },
): State {
  const record: PullRequestRecord = {
    number: pr.number,
    branch: pr.branch,
    url: pr.url,
    title: pr.title,
    status: "open",
    proposedAt: new Date().toISOString(),
    ...(pr.files ? { files: pr.files } : {}),
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

export function addRejectedIdea(state: State, title: string, reason: string): State {
  const entry: RejectedIdea = { title, reason, closedAt: new Date().toISOString() };
  return { ...state, rejectedIdeas: [...state.rejectedIdeas, entry] };
}

export function wasRejected(state: State, title: string): boolean {
  return state.rejectedIdeas.some((r) => r.title === title);
}
