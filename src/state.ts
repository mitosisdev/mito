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
export interface State { cycles: CycleRecord[]; backlog: BacklogItem[]; lastKnownGood: string | null; }

export function emptyState(): State { return { cycles: [], backlog: [], lastKnownGood: null }; }

export function loadState(path: string): State {
  if (!existsSync(path)) return emptyState();
  return JSON.parse(readFileSync(path, "utf8")) as State;
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
