import { test, expect } from "bun:test";
import { diagnose, isHealthy } from "../src/doctor";

const criticalsOk = { MITO_GITHUB_REPO: "mitosisdev/mito", GITHUB_TOKEN: "tok" };

test("healthy when all critical checks pass, even with no X creds", () => {
  const checks = diagnose({ env: criticalsOk, hasOriginRemote: true, killSwitchPresent: false });
  expect(isHealthy(checks)).toBe(true);
  expect(checks.find((c) => c.name === "x_credentials")!.ok).toBe(false);
});

test("full env including X reports x_credentials ok", () => {
  const env = { ...criticalsOk, X_API_KEY: "a", X_API_SECRET: "b", X_ACCESS_TOKEN: "c", X_ACCESS_SECRET: "d" };
  const checks = diagnose({ env, hasOriginRemote: true, killSwitchPresent: false });
  expect(checks.find((c) => c.name === "x_credentials")!.ok).toBe(true);
});

test("unhealthy when a critical (token) is missing", () => {
  const checks = diagnose({ env: { MITO_GITHUB_REPO: "o/r" }, hasOriginRemote: true, killSwitchPresent: false });
  expect(isHealthy(checks)).toBe(false);
});

test("unhealthy when the kill switch is engaged", () => {
  const checks = diagnose({ env: criticalsOk, hasOriginRemote: true, killSwitchPresent: true });
  expect(isHealthy(checks)).toBe(false);
});

test("unhealthy with no origin remote", () => {
  const checks = diagnose({ env: criticalsOk, hasOriginRemote: false, killSwitchPresent: false });
  expect(isHealthy(checks)).toBe(false);
});
