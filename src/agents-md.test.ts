// src/agents-md.test.ts — tests for generateAgentsMd
import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { generateAgentsMd } from "./agents-md";

// ---------------------------------------------------------------------------
// Helpers — create/tear down a temporary fake project directory.
// ---------------------------------------------------------------------------

let tempDir: string;

function mktemp(suffix: string): string {
  const dir = join(tmpdir(), `agents-md-test-${suffix}-${Date.now()}`);
  mkdirSync(dir, { recursive: true });
  return dir;
}

// ---------------------------------------------------------------------------
// Full project — has package.json, README.md, tsconfig.json, src/, .github/
// ---------------------------------------------------------------------------

describe("generateAgentsMd — full project", () => {
  let dir: string;
  let result: string;

  beforeAll(async () => {
    dir = mktemp("full");
    mkdirSync(join(dir, "src"), { recursive: true });
    mkdirSync(join(dir, ".github", "workflows"), { recursive: true });
    mkdirSync(join(dir, "bin"), { recursive: true });

    writeFileSync(
      join(dir, "package.json"),
      JSON.stringify({
        name: "my-cool-tool",
        description: "A handy CLI for doing things",
        scripts: {
          test: "bun test",
          build: "bun build src/index.ts",
          start: "bun src/index.ts",
        },
      }),
    );

    writeFileSync(
      join(dir, "README.md"),
      "# my-cool-tool\n\nThis is the project README with some content describing what it does.\n",
    );

    writeFileSync(
      join(dir, "tsconfig.json"),
      JSON.stringify({ compilerOptions: { strict: true, target: "ESNext" } }),
    );

    writeFileSync(join(dir, "src", "index.ts"), "export function main() {}");
    writeFileSync(join(dir, "src", "utils.ts"), "export function util() {}");
    writeFileSync(join(dir, ".github", "workflows", "ci.yml"), "name: CI");

    result = await generateAgentsMd(dir);
  });

  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it("contains a Project Overview section", () => {
    expect(result).toContain("## Project Overview");
  });

  it("includes the package name in the output", () => {
    expect(result).toContain("my-cool-tool");
  });

  it("includes the package description", () => {
    expect(result).toContain("A handy CLI for doing things");
  });

  it("contains a Getting Started section", () => {
    expect(result).toContain("## Getting Started");
  });

  it("includes the test command", () => {
    expect(result).toContain("bun test");
  });

  it("contains a Key Files section", () => {
    expect(result).toContain("## Key Files");
  });

  it("contains a Conventions section", () => {
    expect(result).toContain("## Conventions");
  });

  it("mentions TypeScript when tsconfig.json present", () => {
    expect(result).toContain("TypeScript");
  });

  it("mentions CI when .github/workflows present", () => {
    expect(result).toMatch(/CI|GitHub Actions|workflow/i);
  });

  it("includes README excerpt", () => {
    expect(result).toContain("project README with some content");
  });

  it("mentions src/ directory", () => {
    expect(result).toContain("src/");
  });

  it("mentions bin/ directory", () => {
    expect(result).toContain("bin/");
  });
});

// ---------------------------------------------------------------------------
// Minimal project — only package.json, nothing else
// ---------------------------------------------------------------------------

describe("generateAgentsMd — minimal project (package.json only)", () => {
  let dir: string;
  let result: string;

  beforeAll(async () => {
    dir = mktemp("minimal");
    writeFileSync(
      join(dir, "package.json"),
      JSON.stringify({ name: "tiny", description: "Tiny project" }),
    );
    result = await generateAgentsMd(dir);
  });

  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it("still contains Project Overview section", () => {
    expect(result).toContain("## Project Overview");
  });

  it("still contains Getting Started section", () => {
    expect(result).toContain("## Getting Started");
  });

  it("still contains Key Files section", () => {
    expect(result).toContain("## Key Files");
  });

  it("still contains Conventions section", () => {
    expect(result).toContain("## Conventions");
  });

  it("includes package name", () => {
    expect(result).toContain("tiny");
  });
});

// ---------------------------------------------------------------------------
// Bare directory — no files at all
// ---------------------------------------------------------------------------

describe("generateAgentsMd — empty directory", () => {
  let dir: string;
  let result: string;

  beforeAll(async () => {
    dir = mktemp("empty");
    result = await generateAgentsMd(dir);
  });

  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it("returns a string without throwing", () => {
    expect(typeof result).toBe("string");
    expect(result.length).toBeGreaterThan(0);
  });

  it("still has all four expected sections", () => {
    expect(result).toContain("## Project Overview");
    expect(result).toContain("## Getting Started");
    expect(result).toContain("## Key Files");
    expect(result).toContain("## Conventions");
  });
});

// ---------------------------------------------------------------------------
// README truncation — long README should only surface the first 500 chars
// ---------------------------------------------------------------------------

describe("generateAgentsMd — README truncation", () => {
  let dir: string;
  let result: string;
  const longLine = "x".repeat(200);

  beforeAll(async () => {
    dir = mktemp("readme");
    writeFileSync(
      join(dir, "README.md"),
      `# Title\n${longLine}\n${longLine}\n${longLine}\nSHOULD_NOT_APPEAR_IN_OUTPUT\n`,
    );
    result = await generateAgentsMd(dir);
  });

  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it("does not include text beyond the 500 char limit", () => {
    expect(result).not.toContain("SHOULD_NOT_APPEAR_IN_OUTPUT");
  });
});

// ---------------------------------------------------------------------------
// Scripts section — custom scripts show up in Getting Started
// ---------------------------------------------------------------------------

describe("generateAgentsMd — scripts", () => {
  let dir: string;
  let result: string;

  beforeAll(async () => {
    dir = mktemp("scripts");
    writeFileSync(
      join(dir, "package.json"),
      JSON.stringify({
        name: "scripty",
        scripts: {
          test: "bun test",
          lint: "eslint .",
          dev: "bun --watch src/index.ts",
        },
      }),
    );
    result = await generateAgentsMd(dir);
  });

  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it("shows test script", () => {
    expect(result).toContain("bun test");
  });

  it("shows lint script", () => {
    expect(result).toContain("eslint");
  });
});
