// src/config.ts
import { z } from "zod";
import { DEFAULT_MAX_FILES, DEFAULT_MAX_LINES } from "./diffsize";

const Schema = z.object({
  X_API_KEY: z.string().min(1),
  X_API_SECRET: z.string().min(1),
  X_ACCESS_TOKEN: z.string().min(1),
  X_ACCESS_SECRET: z.string().min(1),
  MITO_STATE_PATH: z.string().default("./mito-state.json"),
  MITO_KILLSWITCH_PATH: z.string().default("./STOP"),
  MITO_SPEND_CAP_USD: z.coerce.number().positive().default(30),
  // GitHub PR flow. Optional in base config so the X-only flow still loads;
  // requireGithub() below asserts both at the point of use (propose/review).
  MITO_GITHUB_REPO: z.string().min(1).optional(),
  GITHUB_TOKEN: z.string().min(1).optional(),
  // Diff-size guard — caps the blast radius of a single autonomous change.
  MITO_MAX_PR_FILES: z.coerce.number().int().positive().default(DEFAULT_MAX_FILES),
  MITO_MAX_PR_LINES: z.coerce.number().int().positive().default(DEFAULT_MAX_LINES),
});

export interface Config {
  x: { apiKey: string; apiSecret: string; accessToken: string; accessSecret: string };
  github: { repo?: string; token?: string };
  statePath: string;
  killswitchPath: string;
  spendCapUsd: number;
  maxPrFiles: number;
  maxPrLines: number;
}

export function parseConfig(env: Record<string, string | undefined>): Config {
  const e = Schema.parse(env);
  return {
    x: { apiKey: e.X_API_KEY, apiSecret: e.X_API_SECRET, accessToken: e.X_ACCESS_TOKEN, accessSecret: e.X_ACCESS_SECRET },
    github: { repo: e.MITO_GITHUB_REPO, token: e.GITHUB_TOKEN },
    statePath: e.MITO_STATE_PATH,
    killswitchPath: e.MITO_KILLSWITCH_PATH,
    spendCapUsd: e.MITO_SPEND_CAP_USD,
    maxPrFiles: e.MITO_MAX_PR_FILES,
    maxPrLines: e.MITO_MAX_PR_LINES,
  };
}

// Assert the GitHub config the PR flow needs, returning narrowed values.
// Throws a clear error when either is missing so propose/review fail loudly
// rather than making a malformed API call.
export function requireGithub(cfg: Config): { repo: string; token: string } {
  if (!cfg.github.repo) throw new Error("MITO_GITHUB_REPO is required for the PR flow");
  if (!cfg.github.token) throw new Error("GITHUB_TOKEN is required for the PR flow");
  return { repo: cfg.github.repo, token: cfg.github.token };
}

export function loadConfig(): Config {
  return parseConfig(process.env);
}
