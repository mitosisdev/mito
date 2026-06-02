// src/config.ts
import { z } from "zod";

const Schema = z.object({
  X_API_KEY: z.string().min(1),
  X_API_SECRET: z.string().min(1),
  X_ACCESS_TOKEN: z.string().min(1),
  X_ACCESS_SECRET: z.string().min(1),
  MITO_STATE_PATH: z.string().default("./mito-state.json"),
  MITO_KILLSWITCH_PATH: z.string().default("./STOP"),
  MITO_SPEND_CAP_USD: z.coerce.number().positive().default(30),
});

export interface Config {
  x: { apiKey: string; apiSecret: string; accessToken: string; accessSecret: string };
  statePath: string;
  killswitchPath: string;
  spendCapUsd: number;
}

export function parseConfig(env: Record<string, string | undefined>): Config {
  const e = Schema.parse(env);
  return {
    x: { apiKey: e.X_API_KEY, apiSecret: e.X_API_SECRET, accessToken: e.X_ACCESS_TOKEN, accessSecret: e.X_ACCESS_SECRET },
    statePath: e.MITO_STATE_PATH,
    killswitchPath: e.MITO_KILLSWITCH_PATH,
    spendCapUsd: e.MITO_SPEND_CAP_USD,
  };
}

export function loadConfig(): Config {
  return parseConfig(process.env);
}
