// tests/newproject.test.ts
import { test, expect } from "bun:test";
import {
  slugifyRepoName,
  starterReadme,
  starterPackageJson,
  starterGitignore,
  starterSampleSource,
  starterSampleTest,
  starterFiles,
} from "../src/newproject";

test("slugifyRepoName lowercases and replaces spaces with hyphens", () => {
  expect(slugifyRepoName("My Cool Project")).toBe("my-cool-project");
});

test("slugifyRepoName strips disallowed characters", () => {
  expect(slugifyRepoName("Hello, World! (v2)")).toBe("hello-world-v2");
});

test("slugifyRepoName keeps allowed separators . _ -", () => {
  expect(slugifyRepoName("my.repo_name-1")).toBe("my.repo_name-1");
});

test("slugifyRepoName collapses runs of separators", () => {
  expect(slugifyRepoName("a   b---c")).toBe("a-b-c");
});

test("slugifyRepoName trims leading/trailing separators", () => {
  expect(slugifyRepoName("  -hello-  ")).toBe("hello");
  expect(slugifyRepoName("...edges...")).toBe("edges");
});

test("slugifyRepoName caps length at 80 with no trailing separator", () => {
  const long = "a".repeat(90);
  expect(slugifyRepoName(long)).toBe("a".repeat(80));

  // A slug that hits the cap on a separator must not end on one.
  const capOnSep = "a".repeat(79) + " bbb";
  const s = slugifyRepoName(capOnSep);
  expect(s.length).toBeLessThanOrEqual(80);
  expect(s.endsWith("-")).toBe(false);
});

test("slugifyRepoName throws on empty / all-separator input", () => {
  expect(() => slugifyRepoName("")).toThrow();
  expect(() => slugifyRepoName("   ")).toThrow();
  expect(() => slugifyRepoName("---")).toThrow();
  expect(() => slugifyRepoName("!!!")).toThrow();
});

test("starterReadme names the project and credits mito + home repo", () => {
  const r = starterReadme("Widget", "A small widget.");
  expect(r).toContain("# Widget");
  expect(r).toContain("A small widget.");
  expect(r).toContain("a project by mito 🧬");
  expect(r).toContain("mitosisdev/mito");
});

test("starterPackageJson is valid JSON with bun test script and the slug name", () => {
  const raw = starterPackageJson("my-repo");
  const pkg = JSON.parse(raw);
  expect(pkg.name).toBe("my-repo");
  expect(pkg.scripts.test).toBe("bun test");
  expect(raw.endsWith("\n")).toBe(true);
});

test("starterGitignore ignores node_modules and .env", () => {
  const g = starterGitignore();
  expect(g).toContain("node_modules/");
  expect(g).toContain(".env");
});

test("sample source and test reference the same hello export", () => {
  expect(starterSampleSource()).toContain("export function hello");
  expect(starterSampleTest()).toContain('import { hello } from "../src/hello"');
});

test("starterFiles returns the full scaffold keyed by relative path", () => {
  const files = starterFiles("Widget", "A small widget.", "widget");
  expect(Object.keys(files).sort()).toEqual(
    [".gitignore", "README.md", "package.json", "src/hello.ts", "tests/hello.test.ts"].sort(),
  );
  // package.json carries the slug, README carries the human name.
  expect(JSON.parse(files["package.json"]!).name).toBe("widget");
  expect(files["README.md"]).toContain("# Widget");
});
