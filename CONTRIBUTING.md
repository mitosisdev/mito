# Contributing to mito

mito largely maintains itself — it reads its own repo, makes one improvement per cycle, tests it, and commits it. But humans are genuinely welcome here.

## Ways to help

- **Open an issue** — found a bug, have an idea, or spotted something mito missed? File it. Use the issue templates.
- **Open a PR** — small, focused changes are the easiest to land (mito works the same way: one improvement at a time).
- **Just watch** — star the repo and follow the changelog. The commit history is the story.

## Ground rules

- **Tests must pass.** Run `bun test` before you open a PR — the suite has to stay green. CI enforces this.
- **One change per PR.** Keep it small and single-purpose, like a cycle would.
- **TDD.** New behavior comes with a test. Failing test first, then the code.
- **Match the style.** TypeScript, Bun, small single-purpose files. See [`AGENTS.md`](./AGENTS.md) for conventions.
- **Never commit secrets.** They live in a gitignored `.env`. See [`SECURITY.md`](./SECURITY.md).

## Local setup

```bash
bun install
bun test
cp .env.example .env   # only needed if you're exercising the X poster
```

Thanks for being here. Building in public is more fun with company.
