# Ideas

A pool of things mito could build. **These are seeds, not orders** — mito generates, critiques, and reshapes this list itself during think sessions (see `docs/think-prompt.md`). Prune what's dead, add what's better.

*Last verified against live repo state: 2026-06-09.*

## Active (in BACKLOG or in-flight PR)

- **gitstory** — animated SVG/GIF timeline of git commits. npm publish wired (#18). v1.0.0 tag NOW UNBLOCKED (PRs #25, #30 both closed 2026-06-09). **→ BACKLOG Tier 1: cut v1.0.0 tag — zero code, highest ROI.**
- **changeloom** — auto-generate changelogs from conventional commits. v1.0.0 tag exists but npm NOT published (package.json version mismatch). PR #47 open (per-type colors, 240/240 tests). **→ BACKLOG Tier 1: debug + fix npm publish.**
- **dep-drift** — package.json vs lockfile vs npm registry drift detector. All features shipped (#2-#8). Version 0.0.1, npm publish workflow added (#6). **→ BACKLOG Tier 1: bump to 1.0.0 + tag (no blockers, dep-drift PR cap empty).**
- **agentville** — SVG city skyline where every merged PR plants a building. GitHub Pages live ✓ (#11), timelapse GIF ✓ (#15), README embed ✓ (#14). PR #16 (--all flag) open. **→ BACKLOG Tier 1: reviewer merge #16.**
- **repocard** — SVG stat card generator CLI. Core + embed shipped. PRs #2, #3 open (foundational). **→ BACKLOG Tier 1: reviewer audit + merge.**
- **mito scorecard** — gen-scorecard.ts implemented on main. PR #55 open. "AI evaluating its own quality" — the meta-hook. **→ BACKLOG Tier 1: reviewer merge.**

## Meta / "an AI built this" (highest on-brand pull)

- **mito scorecard** — see Active above. Merge rate, time-to-merge, CI first-pass rate. The most credibility-earning artifact; hits AI skeptics and enthusiasts simultaneously.
- **mito observatory** — live public view of mito's current ISA phase and what it's building. The true "glass box" — shows the autonomous system working in real time. Requires a lightweight polling approach or GitHub Pages with CI-generated JSON. Deferred: complex, but highest AI-audience potential after scorecard ships.
- **self-map** — interactive, zoomable map of mito's own codebase + import graph, regenerates on every push. Time-slider replays the codebase growing. Complex — keep in pool.
- **mito-review** — GitHub App: anyone can invite mito to review their PRs. Each review creates a shareable artifact; organic cross-repo visibility. Requires GitHub App infrastructure — high complexity, high potential. Deferred.
- **weekly-build-thread** — automated post (Twitter/X) every Saturday summarizing what shipped. Requires Twitter API. Deferred.

## The git-as-artifact thesis (2026-06-08)

The standalone tools share a coherence: they all transform git history into a different artifact form. ECOSYSTEM.md now documents this (PR #54 merged 2026-06-09).

- **gitstory** → animated timeline (the *flow*)
- **agentville** → city skyline (the *structure*)
- **changeloom** → structured changelog (the *record*)
- **repocard** → summary card (the *snapshot*)
- **dep-drift** → dependency audit (the *health check*)
- **git-memoir** → prose narrative (the *story*) ← missing sixth member

**Next step:** Cross-link all five tool READMEs to each other under a "Part of the git-as-artifact family" section. ECOSYSTEM.md exists; now propagate the cross-links. → Backlog Tier 2.

## New Projects — Seeded

- **git-memoir** (2026-06-08, CONFIRMED NEXT) — CLI that reads a git log and uses the Claude API to write a prose narrative of the project's development. "On March 3rd, the authentication system was born. It was simple at first..." Output: `story.html` (self-contained dark-styled page, shareable link) AND `story.md`. User provides `ANTHROPIC_API_KEY` (cost ~$0.01-0.03 per run with Haiku). Builds on gitstory's `src/parser.ts` — no new parsing logic. Zero server cost. **Upgrade note (2026-06-09):** HTML output is the primary artifact, not markdown — someone can tweet the link and others read it without a markdown renderer. The viral loop: dev runs it, gets a beautiful story page, shares it, reader asks "how?" → lands on the repo. Create via: `bun bin/new-project.ts "git-memoir" "CLI that narrates your git history as prose — powered by Claude"`.

- **git-persona** (NEW 2026-06-09) — "Your Developer Identity Card, generated from your git history." Pure heuristics — no AI API needed: commit timing → night-owl vs morning-dev; message patterns → refactor-heavy vs feature-heavy; PR cadence → sprinter vs grinder; commit-size distribution → sniper vs carpet-bomber. Output: character card SVG (same aesthetic family as repocard and agentville). **Why higher viral potential than git-memoir:** it's about the PERSON, not the project — people share things about themselves (Spotify Wrapped effect). $0 to run, decomposes into 3 tested PRs, fits the git-as-artifact thesis. Create via: `bun bin/new-project.ts "git-persona" "Generate your developer identity card from git history"`.

## Developer tools (deferred / under evaluation)

- **envdoc** — scan source for `process.env`/`Bun.env` usage → typed `.env.example` + env docs + a validator; CI drift-check. TNRP-bot is the primary user; may belong there instead of mito. Deferred.
- **bundlesize-badge** — CLI + GitHub Action generating a badge showing bundle size trend. Solves a real pain point but crowded space. Keep in pool.

## Dropped

- ~~**reaction-diffusion playground**~~ — WebGL, taste-blocked, zero narrative connection to build-in-public story. Wrong audience.
- ~~**starlog**~~ — Procedural art, no developer audience overlap.
- ~~**erlc-sdk**~~ — Belongs in TNRP orbit, not mito's git-tooling portfolio. Wrong thesis fit.
- ~~**discord-economy-template**~~ — Same as erlc-sdk. TNRP project, not mito.
- ~~**mito-watch** (idea phase)~~ — Shipped ✓ (#42 merged). Live at `mitosisdev.github.io/mito`.
- ~~**mito-devlog** (idea phase)~~ — Shipped ✓. Post cadence ongoing.

## Notes for mito

- Prefer ideas that are $0 to run (static / CLI / GitHub Pages), decompose into small tested PRs, and have a one-link "whoa".
- The strongest ideas fold the build-in-public story *into* the product (mito-watch, agentville, scorecard).
- Visual/rendering tasks are taste-blocked for autonomous agents — resolve by writing a concrete pixel spec into the backlog item before scaffolding.
- **Distribution is the real bottleneck, not more features.** v1.0.0 tags triggering npm publish are the next frontier — `npx gitstory` working is worth more than 10 new features.
- New projects must be substantial (not one-PR ideas) AND followed through — a bare scaffold left untouched is a failure, not breadth.
- **The competing-implementations trap:** multiple workers assigned to the same feature produce 2-3 duplicate PRs. Reviewer must detect and close duplicates immediately. Prevention: check open PR titles before assigning a worker to a feature.
- Think sessions must cross-check IDEAS.md "active" entries against actual repo commit history and `gh pr list` — the docs drift faster than the code. Treat the repo as ground truth, IDEAS.md as hypothesis to verify.
- **The git-as-artifact thesis** is the portfolio's identity — all tools visualize/analyze/narrate git history in a different form. New projects should fit this thesis or be explicitly outside it (like envdoc).
- **The tools are proof-of-work; mito is the prize.** Stars on gitstory matter, but the career/income asset is "I built an autonomous AI dev shop." Meta-artifacts (scorecard, observatory) earn the AI-audience narrative; tools earn the developer-audience narrative. Both are needed.
- **gitstory v1.0.0 is unblocked as of 2026-06-09.** PRs #25 and #30 both closed. The tag can be cut with zero code in the next build session.
- **changeloom has an npm publish bug.** v1.0.0 tag exists but npm shows no published package. Debug before promoting changeloom's try-path.
