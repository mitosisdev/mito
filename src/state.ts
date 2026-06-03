// src/state.ts
import { readFileSync, writeFileSync, existsSync } from "node:fs";

export interface BuildCycle {
  id: string;          // e.g. "cycle-2026-06-03T07:01:00Z"
  startedAt: string;   // ISO timestamp when preflight ran
  prsOpened: number;   // how many PRs were opened this session (0 until resolved)
  completedAt?: string; // set when the session ends (optional — sessions can be interrupted)
}

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
  buildCycles: BuildCycle[];
  backlog: BacklogItem[];
  lastKnownGood: string | null;
  pullRequests: PullRequestRecord[];
  rejectedIdeas: RejectedIdea[];
}

export function emptyState(): State { return { cycles: [], buildCycles: [], backlog: [], lastKnownGood: null, pullRequests: [], rejectedIdeas: [] }; }

export function loadState(path: string): State {
  if (!existsSync(path)) return emptyState();
  const raw = JSON.parse(readFileSync(path, "utf8")) as Partial<State>;
  // Backfill fields older state files predate, so callers always get arrays.
  return { ...emptyState(), ...raw, buildCycles: raw.buildCycles ?? [], pullRequests: raw.pullRequests ?? [], rejectedIdeas: raw.rejectedIdeas ?? [] };
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

// --- BuildCycle (session-level tracking) ---

/** Push a new in-progress BuildCycle entry. Call at preflight when proceed=true. */
export function startBuildCycle(state: State): State {
  const startedAt = new Date().toISOString();
  const cycle: BuildCycle = { id: `cycle-${startedAt}`, startedAt, prsOpened: 0 };
  return { ...state, buildCycles: [...state.buildCycles, cycle] };
}

/** Increment prsOpened on the most recent incomplete cycle. No-op if none exists. */
export function incrementCyclePrs(state: State): State {
  const idx = [...state.buildCycles].reverse().findIndex((c) => c.completedAt === undefined);
  if (idx === -1) return state;
  const realIdx = state.buildCycles.length - 1 - idx;
  const updated = state.buildCycles.map((c, i) =>
    i === realIdx ? { ...c, prsOpened: c.prsOpened + 1 } : c,
  );
  return { ...state, buildCycles: updated };
}

/** Mark the most recent incomplete cycle as completed. No-op if none exists. */
export function completeBuildCycle(state: State): State {
  const idx = [...state.buildCycles].reverse().findIndex((c) => c.completedAt === undefined);
  if (idx === -1) return state;
  const realIdx = state.buildCycles.length - 1 - idx;
  const updated = state.buildCycles.map((c, i) =>
    i === realIdx ? { ...c, completedAt: new Date().toISOString() } : c,
  );
  return { ...state, buildCycles: updated };
}
