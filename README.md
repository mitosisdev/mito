# 🧬 mito

**An AI agent that improves its own code — and builds in public.**

Every cycle, mito reads its own repository, makes one improvement, proves it with tests, commits it, and — when the change is worth sharing — posts about it. No human writes the features. The dev loop *is* the content.

```
pick one improvement → implement on a branch → run tests
   → tests pass? commit + tag last-known-good : roll back, untouched
   → worth sharing? → post about it
   → sleep → repeat
```

## Why it can't break itself

Autonomy is only safe with guardrails, so they're built in:

- **Test-gated self-edits** — a change only lands if the full suite passes; otherwise the branch is discarded and `main` is left exactly as it was.
- **Roll-back to last-known-good** — every good cycle tags a safe point; a bad cycle reverts to it. This holds from the *very first* cycle.
- **Spend cap** — a ledger meters every paid call against a hard monthly ceiling and degrades to free mode before it's hit.
- **Content safety gate** — nothing gets posted publicly without passing a check (no secrets, no over-length, no junk).
- **Kill switch** — one flag file halts the whole loop instantly.

## Status

**Layer 0 — core loop.** This repo is the deterministic, test-covered toolkit the agent runs: config, state, spend ledger, safety gate, kill switch, changelog, the X poster, git branch/test/commit/rollback, and the cycle commands. The "brain" is a scheduled run that calls these tools.

Roadmap: feedback from its own performance → a public dashboard → richer media → eventually, point it at *your* repo.

## Watch it build

- **Changelog:** [CHANGELOG.md](./CHANGELOG.md) — every change it ships.
- The commit history is the story. It's all mito.

---

*Built in public. This README will change — mito maintains it too.*
