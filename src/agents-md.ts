// src/agents-md.ts — read a project directory and generate an AGENTS.md file.
//
// generateAgentsMd(dir) is pure async: reads files, returns markdown string.
// No side-effects — the caller decides what to do with the output.

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PackageJson {
  name?: string;
  description?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// File-reading helpers — all return null gracefully on missing / parse error.
// ---------------------------------------------------------------------------

function readFileSafe(path: string): string | null {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return null;
  }
}

function readJsonSafe<T>(path: string): T | null {
  const raw = readFileSafe(path);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function dirExists(path: string): boolean {
  try {
    return existsSync(path) && statSync(path).isDirectory();
  } catch {
    return false;
  }
}

function listTopLevel(dir: string): string[] {
  try {
    return readdirSync(dir, { withFileTypes: true }).map((e) =>
      e.isDirectory() ? `${e.name}/` : e.name,
    );
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Section builders — each returns a string ending with a blank line.
// ---------------------------------------------------------------------------

function buildOverview(pkg: PackageJson | null, readmeExcerpt: string | null): string {
  const lines: string[] = ["## Project Overview", ""];

  if (pkg?.name) lines.push(`**Name:** \`${pkg.name}\``);
  if (pkg?.description) lines.push(`**Description:** ${pkg.description}`);

  if (readmeExcerpt) {
    lines.push("");
    lines.push("**From README:**");
    lines.push("");
    // Indent each line so it renders as a blockquote
    for (const line of readmeExcerpt.split("\n")) {
      lines.push(`> ${line}`);
    }
  }

  lines.push("");
  return lines.join("\n");
}

function buildGettingStarted(pkg: PackageJson | null, hasCi: boolean): string {
  const lines: string[] = ["## Getting Started", ""];

  const scripts = pkg?.scripts ?? {};

  // Detect runtime preference from scripts/deps
  const isNode = !!pkg?.dependencies?.["express"] || !!pkg?.devDependencies?.["ts-node"];
  const usesBun =
    Object.values(scripts).some((v) => v.startsWith("bun")) || !!pkg?.devDependencies?.["bun-types"];

  const installCmd = usesBun ? "bun install" : isNode ? "npm install" : "bun install";
  lines.push("**Install dependencies:**");
  lines.push("```");
  lines.push(installCmd);
  lines.push("```");

  const relevantScripts = Object.entries(scripts);
  if (relevantScripts.length > 0) {
    lines.push("");
    lines.push("**Available scripts:**");
    lines.push("");
    lines.push("| Script | Command |");
    lines.push("|--------|---------|");
    for (const [name, cmd] of relevantScripts) {
      lines.push(`| \`${name}\` | \`${cmd}\` |`);
    }
  }

  if (hasCi) {
    lines.push("");
    lines.push("**CI:** GitHub Actions workflows are present in `.github/workflows/`.");
  }

  lines.push("");
  return lines.join("\n");
}

function buildKeyFiles(dir: string, topLevel: string[]): string {
  const lines: string[] = ["## Key Files", ""];

  // Describe well-known top-level entries
  const known: Record<string, string> = {
    "src/": "Main source code",
    "bin/": "CLI entry points",
    "tests/": "Test files",
    "test/": "Test files",
    "lib/": "Library code",
    "dist/": "Compiled output",
    "docs/": "Documentation",
    ".github/": "GitHub Actions + repo config",
    "package.json": "Package manifest — name, scripts, dependencies",
    "tsconfig.json": "TypeScript compiler configuration",
    "README.md": "Project documentation",
    "AGENTS.md": "AI agent briefing (this file)",
    "CLAUDE.md": "Claude Code project instructions",
    "docker-compose.yml": "Docker Compose configuration",
    "Dockerfile": "Container build instructions",
    ".env.example": "Environment variable template",
  };

  lines.push("| Path | Purpose |");
  lines.push("|------|---------|");

  // First: listed known entries that actually exist
  const listed = new Set<string>();
  for (const [name, desc] of Object.entries(known)) {
    if (topLevel.includes(name)) {
      lines.push(`| \`${name}\` | ${desc} |`);
      listed.add(name);
    }
  }

  // Then: any unlisted top-level items (skip hidden dirs/files)
  for (const entry of topLevel) {
    if (!listed.has(entry) && !entry.startsWith(".")) {
      lines.push(`| \`${entry}\` | — |`);
    }
  }

  // src/ contents — list first 8 files if present
  const srcDir = join(dir, "src");
  if (dirExists(srcDir)) {
    const srcFiles = listTopLevel(srcDir).filter((f) => !f.endsWith("/")).slice(0, 8);
    if (srcFiles.length > 0) {
      lines.push("");
      lines.push("**src/ files (up to 8):**");
      lines.push("");
      for (const f of srcFiles) {
        lines.push(`- \`src/${f}\``);
      }
    }
  }

  lines.push("");
  return lines.join("\n");
}

function buildConventions(pkg: PackageJson | null, hasTs: boolean, hasCi: boolean): string {
  const lines: string[] = ["## Conventions", ""];

  const scripts = pkg?.scripts ?? {};
  const testCmd = scripts["test"];
  const lintCmd = scripts["lint"] ?? scripts["check"];
  const buildCmd = scripts["build"];

  if (hasTs) {
    lines.push("- **Language:** TypeScript");
  }

  if (testCmd) {
    lines.push(`- **Run tests:** \`${testCmd}\``);
  }
  if (lintCmd) {
    lines.push(`- **Lint / type-check:** \`${lintCmd}\``);
  }
  if (buildCmd) {
    lines.push(`- **Build:** \`${buildCmd}\``);
  }

  // Detect bun usage
  const usesBun =
    Object.values(scripts).some((v) => v.startsWith("bun")) ||
    !!pkg?.devDependencies?.["bun-types"];
  if (usesBun) {
    lines.push("- **Runtime / package manager:** [Bun](https://bun.sh) — use `bun`/`bunx`, not npm/npx");
  }

  if (hasCi) {
    lines.push("- **CI:** Pull requests are validated by GitHub Actions");
  }

  // Check for common config files and add notes
  if (pkg?.devDependencies?.["eslint"] ?? pkg?.dependencies?.["eslint"]) {
    lines.push("- **Linter:** ESLint");
  }
  if (pkg?.devDependencies?.["prettier"] ?? pkg?.dependencies?.["prettier"]) {
    lines.push("- **Formatter:** Prettier");
  }

  lines.push("");
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export async function generateAgentsMd(dir: string): Promise<string> {
  // Read key files
  const pkg = readJsonSafe<PackageJson>(join(dir, "package.json"));
  const readmeRaw = readFileSafe(join(dir, "README.md"));
  const hasTs = existsSync(join(dir, "tsconfig.json"));
  const hasCi = dirExists(join(dir, ".github", "workflows"));
  const topLevel = listTopLevel(dir);

  // README excerpt — first 500 chars, trimmed, strip leading # heading line
  let readmeExcerpt: string | null = null;
  if (readmeRaw) {
    const stripped = readmeRaw
      .split("\n")
      .filter((l) => !l.startsWith("# ")) // drop top-level heading (captured in name)
      .join("\n")
      .trimStart();
    const excerpt = stripped.slice(0, 500).trimEnd();
    if (excerpt.length > 0) readmeExcerpt = excerpt;
  }

  const heading =
    `# AGENTS.md — ${pkg?.name ?? "Project"}\n` +
    `\n` +
    `> Auto-generated by gen-agents-md. Update manually if the project structure changes significantly.\n` +
    `\n`;

  const overview = buildOverview(pkg, readmeExcerpt);
  const gettingStarted = buildGettingStarted(pkg, hasCi);
  const keyFiles = buildKeyFiles(dir, topLevel);
  const conventions = buildConventions(pkg, hasTs, hasCi);

  return heading + overview + gettingStarted + keyFiles + conventions;
}
