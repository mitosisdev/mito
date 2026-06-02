# AGENTS.md — working in mito

- Runtime: Bun. Tests: `bun test`. Always TDD: failing test first, then code.
- Money flows are metered in `src/spend.ts` ($30/mo cap). Never bypass it.
- Public posts go through `bin/publish.ts` only (it runs the safety gate). Never call the X client directly.
- Self-changes go through `bin/verify.ts` only (it gates on tests + tags last-known-good). Never commit to `main` without it.
- One improvement per cycle. Keep files small and single-purpose.
- The full cycle procedure is in `docs/cycle-prompt.md`.
