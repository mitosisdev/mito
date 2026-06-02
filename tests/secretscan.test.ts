// tests/secretscan.test.ts — scanDiff() must catch secrets in a code diff
// BEFORE the worker can ever open a PR with them. Pure string-in, result-out;
// no git, no network.
import { test, expect } from "bun:test";
import { scanDiff } from "../src/secretscan";

// A realistic unified diff that adds only harmless code.
const cleanDiff = `diff --git a/src/add.ts b/src/add.ts
index 111..222 100644
--- a/src/add.ts
+++ b/src/add.ts
@@ -1,2 +1,3 @@
 export function add(a: number, b: number): number {
-  return a;
+  return a + b;
 }
`;

test("a clean diff passes", () => {
  const r = scanDiff(cleanDiff);
  expect(r.clean).toBe(true);
  expect(r.findings).toEqual([]);
});

test("an empty diff passes", () => {
  const r = scanDiff("");
  expect(r.clean).toBe(true);
  expect(r.findings).toEqual([]);
});

function added(line: string): string {
  return `diff --git a/x b/x\n--- a/x\n+++ b/x\n@@ -0,0 +1 @@\n+${line}\n`;
}

test("catches an OpenAI key", () => {
  const r = scanDiff(added('const k = "sk-ABCD1234efgh5678ijkl9012";'));
  expect(r.clean).toBe(false);
  expect(r.findings.join(" ")).toContain("openai_key");
});

test("catches a GitHub classic PAT (ghp_)", () => {
  const r = scanDiff(added('token=ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'));
  expect(r.clean).toBe(false);
  expect(r.findings.join(" ")).toContain("github_pat");
});

test("catches a GitHub fine-grained PAT (github_pat_)", () => {
  const r = scanDiff(added('GITHUB=github_pat_11ABCDEFG0aBcDeFgHiJ_kLmNoPqRsTuVwXyZ012345'));
  expect(r.clean).toBe(false);
  expect(r.findings.join(" ")).toContain("github_pat");
});

test("catches an AWS access key id", () => {
  const r = scanDiff(added('aws = "AKIAIOSFODNN7EXAMPLE"'));
  expect(r.clean).toBe(false);
  expect(r.findings.join(" ")).toContain("aws_access_key");
});

test("catches a Slack token", () => {
  const r = scanDiff(added('slack = "xoxb-123456789012-abcdefABCDEF"'));
  expect(r.clean).toBe(false);
  expect(r.findings.join(" ")).toContain("slack_token");
});

test("catches a PEM private key header", () => {
  const r = scanDiff(added('-----BEGIN RSA PRIVATE KEY-----'));
  expect(r.clean).toBe(false);
  expect(r.findings.join(" ")).toContain("pem_private_key");
});

test("catches a generic API_KEY assignment with a real-looking value", () => {
  const r = scanDiff(added('API_KEY=abcd1234efgh5678ijkl'));
  expect(r.clean).toBe(false);
  expect(r.findings.join(" ")).toContain("generic_secret_assignment");
});

test("catches a generic SECRET assignment with a real-looking value", () => {
  const r = scanDiff(added('DATABASE_SECRET="s3cr3tValue000111"'));
  expect(r.clean).toBe(false);
  expect(r.findings.join(" ")).toContain("generic_secret_assignment");
});

test("catches a generic TOKEN assignment with a real-looking value", () => {
  const r = scanDiff(added('MY_TOKEN: "tok_9f8e7d6c5b4a3210ffff"'));
  expect(r.clean).toBe(false);
  expect(r.findings.join(" ")).toContain("generic_secret_assignment");
});

test("catches a committed .env-style line with a non-empty secret value", () => {
  const diff = `diff --git a/.env b/.env
new file mode 100644
--- /dev/null
+++ b/.env
@@ -0,0 +1 @@
+OPENAI_SECRET_KEY=hunter2hunter2hunter2hunter2
`;
  const r = scanDiff(diff);
  expect(r.clean).toBe(false);
});

test("does NOT flag a placeholder / empty assignment (.env.example style)", () => {
  const diff = `diff --git a/.env.example b/.env.example
--- a/.env.example
+++ b/.env.example
@@ -0,0 +1,3 @@
+API_KEY=
+GITHUB_TOKEN=
+SECRET=your-secret-here
`;
  const r = scanDiff(diff);
  expect(r.clean).toBe(true);
});

test("only scans added (+) lines, not removed (-) ones", () => {
  // Removing a line that *happens* to contain a key is not leaking it.
  const diff = `diff --git a/x b/x
--- a/x
+++ b/x
@@ -1 +1 @@
-const k = "sk-ABCD1234efgh5678ijkl9012";
+const k = readFromEnv();
`;
  const r = scanDiff(diff);
  expect(r.clean).toBe(true);
});

test("does not flag the +++ file header line as an addition", () => {
  // The unified-diff '+++ b/file' header starts with '+' but is not content.
  const r = scanDiff(cleanDiff);
  expect(r.clean).toBe(true);
});

test("dedupes repeated findings of the same kind", () => {
  const diff = added('a="sk-ABCD1234efgh5678ijkl9012"') +
    added('b="sk-ZZZZ1234efgh5678ijkl9012"');
  const r = scanDiff(diff);
  const openaiFindings = r.findings.filter((f) => f.includes("openai_key"));
  expect(openaiFindings.length).toBe(1);
});
