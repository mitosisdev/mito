// src/newproject.ts — pure helpers for scaffolding a brand-new mito project repo.
//
// No IO here. Everything is a pure function of its inputs so it can be unit
// tested without a network or a filesystem. bin/new-project.ts does the IO
// (GitHub API call, git init/commit/push) and uses these to produce content.

// A GitHub repo name must be a safe slug: lowercase, only [a-z0-9._-], no
// leading/trailing separators, and bounded in length. GitHub itself replaces
// spaces and disallowed characters with `-`, so we mirror that and then clean
// up the result. Throws on an input that reduces to nothing.
export function slugifyRepoName(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    // Anything outside the allowed set becomes a hyphen.
    .replace(/[^a-z0-9._-]+/g, "-")
    // Collapse runs of separators into a single hyphen.
    .replace(/[-_.]{2,}/g, "-")
    // Trim leading/trailing separators (GitHub rejects those).
    .replace(/^[-_.]+|[-_.]+$/g, "")
    .slice(0, 80)
    // A length cap can re-expose a trailing separator — trim once more.
    .replace(/[-_.]+$/g, "");

  if (!slug) {
    throw new Error(`slugifyRepoName: "${name}" produced an empty slug`);
  }
  return slug;
}

// README for a fresh project. Mentions that it's a mito project and points
// back to the home repo so the lineage is discoverable from any project.
export function starterReadme(name: string, desc: string): string {
  return `# ${name}

${desc}

---

This is a project by mito 🧬, see [mitosisdev/mito](https://github.com/mitosisdev/mito).

mito is an openly-AI agent that builds in public — it started this repo, writes
the code, opens its own pull requests, and reviews them. Everything here was
proposed and merged by mito itself.
`;
}

// package.json for a fresh bun project. Kept deliberately tiny: a name, the
// bun test script, and nothing else to maintain. `slug` is the already-safe
// repo slug from slugifyRepoName.
export function starterPackageJson(slug: string): string {
  const pkg = {
    name: slug,
    version: "0.0.1",
    private: false,
    type: "module",
    scripts: {
      test: "bun test",
    },
  };
  return JSON.stringify(pkg, null, 2) + "\n";
}

// A minimal .gitignore for a fresh bun project.
export function starterGitignore(): string {
  return ["node_modules/", ".env", "*.log", "dist/"].join("\n") + "\n";
}

// A tiny sample source module so the new repo isn't empty and its CI has
// something real to run against from the very first commit.
export function starterSampleSource(): string {
  return `// src/hello.ts — the first thing mito wrote in this repo.
export function hello(name = "world"): string {
  return \`hello, \${name}\`;
}
`;
}

// The matching test for the sample source, so \`bun test\` is green on commit one.
export function starterSampleTest(): string {
  return `// tests/hello.test.ts
import { test, expect } from "bun:test";
import { hello } from "../src/hello";

test("hello greets the world by default", () => {
  expect(hello()).toBe("hello, world");
});

test("hello greets a given name", () => {
  expect(hello("mito")).toBe("hello, mito");
});
`;
}

// The full set of starter files keyed by their relative path. bin/new-project.ts
// writes each into the scaffold dir. Centralised here so the layout is one
// pure, testable description rather than scattered writes.
export function starterFiles(
  name: string,
  desc: string,
  slug: string,
): Record<string, string> {
  return {
    "README.md": starterReadme(name, desc),
    "package.json": starterPackageJson(slug),
    ".gitignore": starterGitignore(),
    "src/hello.ts": starterSampleSource(),
    "tests/hello.test.ts": starterSampleTest(),
  };
}
