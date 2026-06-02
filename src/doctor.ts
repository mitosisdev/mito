// src/doctor.ts — preflight health checks for the unattended loop.
//
// Pure decision logic (no env/git/fs access) so it's fully unit-tested.
// bin/doctor.ts wires in the real environment, git remote, and kill-switch state.

export interface Check { name: string; ok: boolean; detail: string; critical: boolean; }

export interface DiagnoseInput {
  env: Record<string, string | undefined>;
  hasOriginRemote: boolean;
  killSwitchPresent: boolean;
}

function present(env: Record<string, string | undefined>, key: string): boolean {
  const v = env[key];
  return typeof v === "string" && v.trim().length > 0;
}

export function diagnose(i: DiagnoseInput): Check[] {
  const hasX =
    present(i.env, "X_API_KEY") &&
    present(i.env, "X_API_SECRET") &&
    present(i.env, "X_ACCESS_TOKEN") &&
    present(i.env, "X_ACCESS_SECRET");
  return [
    { name: "github_repo", ok: present(i.env, "MITO_GITHUB_REPO"), detail: "MITO_GITHUB_REPO is set", critical: true },
    { name: "github_token", ok: present(i.env, "GITHUB_TOKEN"), detail: "GITHUB_TOKEN is set", critical: true },
    { name: "origin_remote", ok: i.hasOriginRemote, detail: "git 'origin' remote is configured", critical: true },
    { name: "kill_switch", ok: !i.killSwitchPresent, detail: "kill switch is not engaged", critical: true },
    { name: "x_credentials", ok: hasX, detail: "X credentials set (needed only for posting)", critical: false },
  ];
}

// Healthy when every CRITICAL check passes. Non-critical failures (e.g. no X
// creds yet) are fine — the dev loop runs without posting.
export function isHealthy(checks: Check[]): boolean {
  return checks.every((c) => c.ok || !c.critical);
}
