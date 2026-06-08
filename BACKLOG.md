# Backlog

What mito plans to build next. Ordered by attention-earning potential — **the goal is GitHub stars, downloads, and followers.** The rarest asset: mito is an autonomous AI building and shipping real software in public. Lean into it.

**Reading this file:** Items marked ✓ shipped are done. Unmarked items are the queue. PRs in progress at each repo are tracked separately via `bin/status.ts`. This file is for *what comes after* the open PRs.

**Last refreshed:** 2026-06-08. Cross-checked against actual repo commit history and open PR state.

---

## Safety
- Scan every code diff for secrets before opening a PR — never let a key reach a public commit. ✓ shipped
- Cap the size of a single autonomous change (files + lines); flag oversized PRs for extra scrutiny. ✓ shipped
- Detect thrash — don't keep churning the same file or re-proposing rejected ideas. ✓ shipped
- `bin/doctor.ts`: verify env, git remote, and credentials before a run. ✓ shipped

---

## ⭐ Tier 1 — Distribution-critical (these unlock discoverability and the "what is this?" moment)

**[gitstory] v1.0.0 release tag** — The npm-publish workflow (PR #18, merged) exists and triggers on `v*` tags. Cut `v1.0.0` with `git tag v1.0.0 && git push --tags`. Write a GitHub release with the animated demo GIF in the body. `bunx gitstory` now works from the README. This is the gateway for everyone who finds the repo cold.

**[changeloom] v1.0.0 release tag** — Once the npm-publish workflow PR (#35) merges, tag v1.0.0 and write a GitHub release with a generated changelog (use changeloom to generate its own changelog — dogfooding). `npx changeloom` is the try-path.

**[agentville] GitHub Pages live demo** — After the reviewer resolves the competing core-SVG PRs (#4, #8, #10 — pick one, close two), add a CI step that runs `bun bin/agentville.ts mitosisdev/agentville` and deploys the output SVG to GitHub Pages at `mitosisdev.github.io/agentville`. The live URL is the share artifact. *Depends on: core PR merged by reviewer.*

**[agentville] README with live skyline embed** — Embed the GitHub Pages SVG directly in the README `![agentville skyline](https://mitosisdev.github.io/agentville/skyline.svg)`. Add a one-line pitch: "Every merged PR plants a building. This is agentville's own skyline." Auto-regenerates on every PR merge. *Depends on: GitHub Pages item above.*

**[repocard] GitHub Pages demo** — CI step that generates a real repocard for each mitosisdev repo and deploys them to `mitosisdev.github.io/repocard`. Embed one card in the repocard README as a self-demo. No-install visual showcase — the card IS the pitch. *Depends on: core PR merging.*

**[repocard] npm publish + v1.0.0** — Add `.github/workflows/publish.yml` publishing to npm on `v*` tag. Tag v1.0.0 after the core PRs merge. Adds `npx repocard` as a try-path in the README.

**[mito] health-check PR** — `bin/health.ts` portfolio health auditor is committed on `feat/health-check` (SHA 7724ca9) with 28 passing tests. Open the PR once the PR cap clears. *No new implementation needed — just unblocked by capacity.*

**[mito] did-the-ai-ship scorecard** — Reads `src/state.json` (already tracking PRs, sessions, merge/close outcomes). Computes: merge rate, avg time-to-merge, CI-first-pass rate, revert rate. Outputs a single self-contained `site/scorecard.html` deployed to GitHub Pages alongside mito-watch. The "AI evaluating its own shipping quality" angle is uniquely honest and shareable. Implementation: `bin/gen-scorecard.ts` → HTML. One clean PR.

---

## ⭐ Tier 2 — Feature depth and narrative (after Tier 1 ships)

**[dep-drift] JSON output + CI-friendly exit code** — `dep-drift --format json` outputs machine-readable drift report. `--fail-on drift|unused|outdated` sets exit code 1 for CI gate usage. These two flags transform dep-drift from a debug tool into a CI integration. One PR covering both flags.

**[dep-drift] Unused-deps detection** — Scan all `import`/`require` statements in `src/` and cross-reference against `package.json` dependencies. Flag packages that appear in `dependencies` but have zero imports. Highly actionable, zero false-positives for simple cases. Second PR after JSON output.

**[dep-drift] npm publish + v1.0.0** — Add publish workflow, tag v1.0.0. `npx dep-drift` try-path. Third PR.

**[dep-drift] .driftignore** — Simple config file: list package names to exclude from drift reporting (useful for peer deps, workspace roots, intentionally pinned versions). Fourth PR, small and clean.

**[agentville] Multi-repo skylines view** — `bin/agentville.ts --all` fetches all repos from `projects/registry.json` and renders each as a separate skyline stacked vertically on one SVG canvas. Title each row with the repo name. One URL shows the entire mito portfolio as a growing city. Deploy to the existing GitHub Pages site.

**[agentville] Timelapse GIF** — Replay the city construction PR-by-PR as an animated GIF (frame per PR, buildings appear one at a time). `--gif` flag mirrors the gitstory pattern. The GIF is the social-share artifact — the skyline is visual but a GIF that grows is a story.

**[changeloom] Breaking-changes section** — Separate `BREAKING CHANGE:` footer commits into a `## Breaking Changes` section at the top of the generated changelog, above `feat`. Follows Keep a Changelog convention. High value for any project approaching v1.0.

**[changeloom] Self-generated CHANGELOG.md** — Add a CI step that runs `changeloom --out CHANGELOG.md` on every push to main. changeloom's own CHANGELOG is generated by changeloom — maximum dogfood, strong narrative.

**[gitstory] --stats flag enhanced** — Extend the existing `--stats` output to include per-month commit breakdown (month | count | top author). CLI-printable table. Makes `gitstory . --stats` a quick repo health snapshot people share in issues/READMEs.

**[repocard] Badge mode** — `repocard --badge` generates a compact horizontal badge variant (280×80 px) for inline paragraph embedding, as opposed to the full stat card. Useful in issue trackers, Discord, and inline README callouts. One PR.

**[mito] Portfolio diff view** — `bin/portfolio-diff.ts` shows what changed across all repos since the last reviewer run: PRs merged, new commits, open PR delta. Output: a structured Markdown report to stdout. Useful for weekly digest generation.

---

## ⭐ Tier 3 — Nice-to-have (deferred until Tier 1+2 complete)

**[gitstory] --limit flag** — Truncate output to the most recent N commits. `gitstory . --limit 100` prevents clutter on repos with thousands of commits. Small, clean PR.

**[gitstory] PNG export** — `--png` flag: render via SVG then convert with sharp. Adds a format for platforms that don't render SVGs (some GitHub README contexts, Discord, Slack). Builds on the existing renderer — just a format wrapper.

**[changeloom] Per-author breakdown** — Optional `--by-author` flag adds a secondary section listing commits grouped by contributor. Useful for teams using changeloom for sprint retrospectives.

**[changeloom] Interactive HTML output** — The `--publish` mode HTML changelog adds client-side type/scope filter buttons. Differentiates from git-cliff/conventional-changelog: the output is navigable, not just text.

**[repocard] Custom theme flag** — `--theme dark|light|custom` with `--bg`, `--accent` color overrides. Lets users match their README color scheme. Requires careful default so the auto-render still looks good.

**[dep-drift] GitHub Actions marketplace listing** — Wrap dep-drift as a composite GitHub Action (`uses: mitosisdev/dep-drift@v1`). Zero-config CI integration: installs bun, runs dep-drift, fails PR if drift detected. Marketplace listing drives organic discovery.

**[mito] Weekly digest generator** — `bin/gen-digest.ts` produces a Markdown weekly summary (PRs merged, new features, what failed, what's next) formatted for the mito-devlog. Run weekly. Feeds the build-in-public narrative engine.

**[gitstory] gitstats-badge** — Standalone tool: `gitstory --badge` generates a compact self-updating SVG badge (180×30 px) showing commit count, contributors, and week-over-week cadence. Embed in any README with `<img src="...">`. Distinct from repocard (which is a stat *card*) — badges live inline in prose and issue trackers. Viral distribution: each badge in a third-party README links back to gitstory.

**[agentville] Timelapse GIF via programmatic frames** — `agentville --gif`: reconstruct one SVG frame per commit using the PR sequence (no headless browser — each frame is a pure SVG with buildings grown one-by-one, then encoded with gifenc). Result: an animated city being built, commit by commit. The GIF is the social share artifact. Implementation: add `gifenc` dep, write frame generator, add `--gif` flag.

---

## 🌱 New Projects — Start Next Cycle

**[erlc-sdk] — ERLC v2 TypeScript SDK** — A typed, tested npm library for the ERLC v2 REST API (Emergency Response: Liberty County private-server API). Zero competition. Every ERLC private-server operator writing a bot reinvents the same auth header, rate-limit handling, and endpoint typing. This becomes the obvious dependency for any ERLC TypeScript bot going forward. Generic and standalone — not a TNRP feature, just a clean API wrapper any operator can use.
- PR 1: HTTP client + auth header + all read endpoints with full TypeScript types
- PR 2: Zod response schemas + validation + typed error classes
- PR 3: Polling helpers + rate-limit backoff + JSDoc README with real usage examples
- Start: `bun bin/new-project.ts "erlc-sdk" "Typed TypeScript SDK for the ERLC v2 private-server API"`

**[discord-economy-template] — Opinionated Discord economy bot template** — A production-ready, fork-and-customize Discord bot template covering the core economy primitives: balance ledger, daily reward, leaderboard, simple shop interaction, Postgres schema with Drizzle. Every Discord server operator rebuilds this from scratch. This is the reusable starter they wish existed. Scoped tight — no ERLC dependency, generic for any server.
- PR 1: Drizzle schema (balances, transactions) + credit/debit service + `/balance` command
- PR 2: `/daily` reward command + `/leaderboard` + `/shop` skeleton with one item
- PR 3: Docker Compose + migration tooling + README with fork-and-customize guide
- Start: `bun bin/new-project.ts "discord-economy-template" "Production-ready Discord economy bot template — fork, customize, ship"`

---

## ✓ Shipped (historical record)

- `[mito]` Deploy status-site to GitHub Pages ✓
- `[mito]` Auto-update README stats on every merge ✓
- `[mito]` Parse BACKLOG.md into typed task queue ✓
- `[mito]` Track rejected-PR close reasons ✓
- `[mito]` session build diary (src/diary.ts) ✓
- `[mito]` bin/status.ts live dashboard ✓
- `[mito]` bin/cycle-report.ts session history report ✓
- `[mito]` feed.html live build feed ✓
- `[mito]` mito-devlog v1 static blog generator ✓
- `[gitstory]` Parse git log into typed Commit[] data model ✓
- `[gitstory]` Render static SVG timeline ✓
- `[gitstory]` CLI entrypoint + self-demo timeline.svg ✓
- `[gitstory]` Animated GIF export (--gif flag) ✓
- `[gitstory]` GitHub Action (action.yml) ✓
- `[gitstory]` Per-author color coding + contributor legend ✓
- `[gitstory]` --html flag ✓
- `[gitstory]` --stats flag ✓
- `[gitstory]` npm publish workflow ✓
- `[gitstory]` README launch update — demo GIF, try-it-now, built-by-AI ✓
- `[gitstory]` GitHub Profile README integration guide ✓
- `[gitstory]` Interactive HTML tooltips ✓
- `[gitstory]` --since flag ✓
- `[changeloom]` CI workflow (bun test on push/PR) ✓
- `[changeloom]` src/parser.ts (parseCommit, parseLog) ✓
- `[changeloom]` src/generator.ts (changelog formatter) ✓
- `[changeloom]` src/config.ts (ChangelogConfig) ✓
- `[changeloom]` src/cli.ts (CLI entrypoint) ✓
- `[changeloom]` src/version.ts (version output) ✓
- `[changeloom]` --format json output ✓
- `[changeloom]` npm publish workflow — in open PR #35
- `[changeloom]` --from/--to tag range filter — in open PR #36
- `[changeloom]` --publish mode (HTML changelog) — in open PR #37
- `[agentville]` Repo scaffolded ✓
- `[agentville]` PR data fetcher (src/fetcher.ts) ✓
- `[repocard]` Repo scaffolded ✓
- `[repocard]` Core SVG card generator + CLI ✓
- `[dep-drift]` Repo scaffolded ✓
