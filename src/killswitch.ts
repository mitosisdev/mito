// src/killswitch.ts
import { existsSync } from "node:fs";

export function isKilled(flagPath: string): boolean {
  return existsSync(flagPath);
}

export function assertNotKilled(flagPath: string): void {
  if (isKilled(flagPath)) throw new Error(`mito halted: kill switch present at ${flagPath}`);
}
