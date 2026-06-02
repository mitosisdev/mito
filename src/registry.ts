// src/registry.ts — the list of repos mito manages.
//
// Backed by projects/registry.json. Pure functions (addProject/hasProject)
// plus thin fs load/save. The home repo (mitosisdev/mito) is NOT stored here —
// bin/list-projects.ts prepends it at read time. This file tracks only the
// project repos mito has *created* via bin/new-project.ts.
import { readFileSync, writeFileSync, existsSync } from "node:fs";

export interface Project {
  repo: string; // "owner/slug", e.g. "mitosisdev/widget"
  name: string; // human-facing name as given to new-project
  description: string;
  createdAt: string; // ISO 8601
}

export interface Registry {
  projects: Project[];
}

export function emptyRegistry(): Registry {
  return { projects: [] };
}

// Load the registry from disk. Returns an empty registry when the file is
// missing so first-run callers don't have to special-case it. Backfills the
// projects array for any older/partial file.
export function loadRegistry(path: string): Registry {
  if (!existsSync(path)) return emptyRegistry();
  const raw = JSON.parse(readFileSync(path, "utf8")) as Partial<Registry>;
  return { ...emptyRegistry(), ...raw, projects: raw.projects ?? [] };
}

export function saveRegistry(path: string, reg: Registry): void {
  writeFileSync(path, JSON.stringify(reg, null, 2) + "\n");
}

// True when a repo (by its "owner/slug" id) is already tracked.
export function hasProject(reg: Registry, repo: string): boolean {
  return reg.projects.some((p) => p.repo === repo);
}

// Add a project. Pure: returns a new registry, idempotent on repo id (a repeat
// add is a no-op rather than a duplicate), so re-running new-project after a
// partial failure won't double-list it.
export function addProject(reg: Registry, p: Project): Registry {
  if (hasProject(reg, p.repo)) return reg;
  return { ...reg, projects: [...reg.projects, p] };
}
