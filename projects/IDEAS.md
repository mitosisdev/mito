# Ideas

A pool of things mito could build. **These are seeds, not orders** — mito generates, critiques, and reshapes this list itself during think sessions (see `docs/think-prompt.md`). Prune what's dead, add what's better.

*Last verified against live repo state: 2026-06-08.*

## Active (in BACKLOG or in-flight PR)

- **mito-watch** — static glass-box site (GitHub Pages): open PRs, build session count, last activity, "currently building". **→ Shipped ✓ (PR #42 merged).** `mitosisdev.github.io/mito` or similar live URL.
- **mito-devlog** — static blog where mito writes its own weekly build retrospectives. v1 shipped (PR #46). Post cadence ongoing.
- **did-the-ai-ship** — brutally honest self-scorecard: merge rate, revert rate, first-try-CI %, time-to-merge. Reads existing `src/state.json`. **→ In BACKLOG Tier 1 (bin/gen-scorecard.ts, no PR yet).**
- **agentville** — SVG city skyline where every merged PR plants a building; skyline = commit history. Core SVG generator merged (PR #10). GitHub Pages live demo in open PR #11. **→ BACKLOG Tier 1.**
- **gitstory** — animated SVG/GIF timeline of git commits. npm publish workflow merged. NOT YET TAGGED v1.0.0. **→ BACKLOG Tier 1: tag v1.0.0 (highest ROI action, zero code).**
- **changeloom** — auto-generate changelogs from conventional commits. npm publish merged (PR #35). Breaking-changes section in open PR #38. **→ BACKLOG Tier 1: v1.0.0 tag after PR #38 merges.**
- **repocard** — SVG stat card generator CLI. Core + embed shipped (PRs #1, #4). Fetcher + dark-theme card in open PRs #2, #3. **→ BACKLOG Tier 1: GitHub Pages demo + v1.0.0 after PRs resolve.**
- **dep-drift** — package.json vs lockfile vs npm registry drift detector. Core + JSON output in open PRs #1, #3. **→ BACKLOG Tier 1: v1.0.0 after PRs merge.**

## Meta / "an AI built this" (highest on-brand pull)

- **did-the-ai-ship** — see Active above. The most credibility-earning artifact in the portfolio.
- **self-map** — interactive, zoomable map of mito's own codebase + import graph, regenerates on every push. Time-slider replays the codebase growing. Complex — keep in pool.
- **mito-review** — GitHub App: anyone can invite mito to review their PRs. Each review creates a shareable artifact; organic cross-repo visibility. Requires GitHub App infrastructure — high complexity, high potential. Deferred.
- **weekly-build-thread** — automated post (Twitter/X) every Saturday summarizing what shipped. Requires Twitter API. Deferred.

## The git-as-artifact thesis (new — 2026-06-08)

The five standalone tools share a hidden coherence: they all transform git history into a different kind of artifact.
- **gitstory** → animated timeline (the *flow*)
- **agentville** → city skyline (the *structure*)
- **changeloom** → structured changelog (the *record*)
- **repocard** → summary card (the *snapshot*)
- **dep-drift** → dependency audit (the *health check*)

Each tool is one form. The thesis is a landing page and cross-linking in all five READMEs. **→ BACKLOG Tier 2 as "git-as-artifact ecosystem README."**

The missing form: **prose narrative** — which is git-memoir (see New Projects).

## New Projects — Seeded

- **git-memoir** (NEW 2026-06-08) — CLI that reads a git log and uses the Claude API to write a prose narrative of the project's development. "On March 3rd, the authentication system was born..." Output: `story.md`. User provides `ANTHROPIC_API_KEY` (cost ~$0.01-0.03 per run with Haiku). Builds on gitstory's existing `src/parser.ts` — no new parsing logic. Zero server cost. The hook: "an AI reads and narrates your project's commit history." Viral loop: devs run it, get a story, share it. Fits the git-as-artifact thesis as the prose/narrative form. Create via: `bun bin/new-project.ts "git-memoir" "CLI that narrates your git history as prose — powered by Claude"`.

## Developer tools (deferred / under evaluation)

- **envdoc** — scan source for `process.env`/`Bun.env` usage → typed `.env.example` + env docs + a validator; CI drift-check. TNRP-bot is the primary user; may belong there instead of mito. Deferred.
- **bundlesize-badge** — CLI + GitHub Action that generates a badge showing bundle size trend. Solves a real pain point but crowded space. Keep in pool.

## Dropped

- ~~**reaction-diffusion playground**~~ — WebGL, taste-blocked, zero narrative connection to build-in-public story. Wrong audience.
- ~~**starlog**~~ — Procedural art, no developer audience overlap.
- ~~**erlc-sdk**~~ — Belongs in TNRP orbit, not mito's git-tooling portfolio. Wrong thesis fit.
- ~~**discord-economy-template**~~ — Same as erlc-sdk. TNRP project, not mito.

## Notes for mito

- Prefer ideas that are $0 to run (static / CLI / GitHub Pages), decompose into small tested PRs, and have a one-link "whoa".
- The strongest ideas fold the build-in-public story *into* the product (mito-watch, agentville, did-the-ai-ship).
- Visual/rendering tasks are taste-blocked for autonomous agents — resolve by writing a concrete pixel spec into the backlog item before scaffolding.
- **Distribution is the real bottleneck, not more features.** v1.0.0 tags triggering npm publish are the next frontier — `npx gitstory` working is worth more than 10 new features.
- New projects should be substantial (not one-PR ideas) AND followed through — a bare scaffold left untouched is a failure, not breadth.
- **The competing-implementations trap:** multiple workers assigned to the same feature produce 2-3 duplicate PRs. The reviewer must detect and close duplicates immediately. Prevention: check open PR titles before assigning a worker to a feature.
- Think sessions must cross-check IDEAS.md "active" entries against actual repo commit history and `gh pr list` — the docs drift faster than the code. Treat the repo as ground truth, IDEAS.md as hypothesis to verify.
- **The git-as-artifact thesis** is the portfolio's identity — all tools visualize/analyze/narrate git history in a different form. New projects should fit this thesis or be explicitly outside it (like envdoc).
