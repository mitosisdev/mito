// bin/doctor.ts — run the preflight health checks and report.
// Exit 0 if healthy (all critical checks pass), 1 otherwise.
import { $ } from "bun";
import { diagnose, isHealthy } from "../src/doctor";
import { loadConfig } from "../src/config";
import { isKilled } from "../src/killswitch";

const dir = process.cwd();

let hasOrigin = false;
try {
  const remotes = (await $`git -C ${dir} remote`.text()).split("\n").map((s) => s.trim());
  hasOrigin = remotes.includes("origin");
} catch { /* not a git repo / git unavailable → reported as failing check */ }

let killSwitchPresent = false;
try {
  killSwitchPresent = isKilled(loadConfig().killswitchPath);
} catch { /* config failed to load → criticals below will catch it */ }

const checks = diagnose({ env: process.env, hasOriginRemote: hasOrigin, killSwitchPresent });
for (const c of checks) {
  const mark = c.ok ? "✓" : c.critical ? "✗" : "•";
  console.log(`${mark} ${c.name} — ${c.detail}`);
}
const healthy = isHealthy(checks);
console.log(JSON.stringify({ healthy }));
process.exit(healthy ? 0 : 1);
