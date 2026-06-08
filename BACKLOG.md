# Backlog

What mito plans to build next, ordered by attention-earning potential and dependencies. Verified against live repo state on 2026-06-08.

## PR Capacity

| Repo | Open PRs | Cap | Free | Notes |
|------|----------|-----|------|-------|
| mito | 1 (#33) | 3 | 2 | #33 stale 3 days |
| gitstory | 3 (#25 DUP, #26, #29) | 3 | 0 | FULL — reviewer must close #25 dup first |
| changeloom | 1 (#38) | 3 | 2 | |
| agentville | 1 (#11) | 3 | 2 | |
| repocard | 2 (#2, #3) | 3 | 1 | Possible competing impls — reviewer audit needed |
| dep-drift | 2 (#1, #3) | 3 | 1 | #3 depends on unmerged #1 |

## Safety
- Scan every code diff for secrets before opening a PR — never let a key reach a public commit. ✓ shipped
- Cap the size of a single autonomous change (files + lines); flag oversized PRs for extra scrutiny. ✓ shipped
- Detect thrash — don't keep churning the same file or re-proposing rejected ideas. ✓ shipped
- `bin/doctor.ts`: verify env, git remote, and credentials before a run. ✓ shipped

## ⭐ Tier 1 — Distribution-critical (ordered by attention impact)

**[gitstory] v1.0.0 release tag** — ZERO CODE. After reviewer closes #25 (dup of already-merged --since feature), run `git tag v1.0.0 && git push --tags` on the gitstory repo. The npm publish workflow (PR #18, merged) triggers on `v*` tags. Write a GitHub release with the animated demo GIF in the body. Unlocks `bunx gitstory` and `npx gitstory` for anyone who finds the repo. Highest ROI action in the entire portfolio: no code, pure distribution unlock. *Blocked on: reviewer closing gitstory #25 (dup) first.*

**[mito] did-the-ai-ship scorecard** — `bin/gen-scorecard.ts` reads from `src/state.json` (already tracking PRs, sessions, merge/close outcomes). Computes: merge rate, avg time-to-merge, CI-first-pass rate, revert rate. Outputs a single self-contained `site/scorecard.html` deployed to GitHub Pages alongside mito-watch. The "AI evaluating its own shipping quality" angle is uniquely honest and shareable — hits AI skeptics and enthusiasts simultaneously. One clean PR. *No blockers — start now.*

**[agentville] GitHub Pages live demo** — PR #11 is already open (feat: GitHub Pages live demo — deploy skyline SVG on every merge). Reviewer merges it: CI runs `bun bin/agentville.ts mitosisdev/agentville` and deploys the skyline SVG to `mitosisdev.github.io/agentville`. The live URL is the share artifact. *Blocked on: reviewer merging agentville PR #11.*

**[agentville] README with live skyline embed** — After GitHub Pages ships, embed the SVG directly in the README: `![agentville skyline](https://mitosisdev.github.io/agentville/skyline.svg)`. One-line pitch: "Every merged PR plants a building. This is agentville's own skyline." Auto-regenerates on every PR merge. Small standalone PR. *Depends on: agentville PR #11 merged.*

**[changeloom] v1.0.0 release tag** — npm publish workflow (PR #35) is already merged. After PR #38 (breaking-changes) merges, tag `v1.0.0` and write a release. Use changeloom to generate its own changelog — maximum dogfood moment. `npx changeloom` try-path. *Blocked on: reviewer merging changeloom PR #38.*

**[mito] health-check PR** — `bin/health.ts` portfolio health auditor committed on local `feat/health-check` branch (SHA 7724ca9, 28 passing tests). Push branch to origin and open PR. This has been sitting locally for multiple sessions. Push it: `git push origin feat/health-check`. *No blockers — local branch exists at SHA 7724ca9.*

**[changeloom] --publish mode (HTML changelog)** — Multiple previous attempts (PRs #28, #31, #34, #37) were all CLOSED without merging. This feature has never shipped. Fresh implementation needed: `--publish` flag generates a dark-styled self-contained `changelog.html`. One PR with working tests. *No blockers.*

**[repocard] GitHub Pages demo** — CI step that generates a real repocard for each mitosisdev repo and deploys them to `mitosisdev.github.io/repocard`. Embed one card in repocard's README as a self-demo. *Blocked on: reviewer resolving open PRs #2/#3 (possible duplicates).*

**[repocard] npm publish + v1.0.0** — Add `.github/workflows/publish.yml` publishing to npm on `v*` tag. Tag v1.0.0. `npx repocard` try-path. *Blocked on: core PRs merging.*

**[dep-drift] npm publish + v1.0.0** — After PRs #1 (core) and #3 (JSON output) merge, add publish workflow and tag v1.0.0. `npx dep-drift` try-path. *Blocked on: both open PRs merging.*

## ⭐ Tier 2 — Feature depth and narrative (after Tier 1 ships)

**[mito] git-as-artifact ecosystem README** — Write a section in mito's README (or standalone `ECOSYSTEM.md`) framing all 5 tools under the shared thesis: "git history is a story worth telling in multiple forms — animated (gitstory), architectural (agentville), structured (changeloom), summarized (repocard), audited (dep-drift)." Add cross-links in each tool's README pointing to the others. One PR per repo, or a single mito PR. Cheapest structural move with the highest compounding value.

**[dep-drift] Unused-deps detection** — Scan all `import`/`require` statements in `src/` and cross-reference against `package.json` dependencies. Flag packages that appear in `dependencies` but have zero imports. Second PR for dep-drift after JSON output merges.

**[dep-drift] .driftignore** — Simple config file: list package names to exclude from drift reporting (peer deps, workspace roots, intentionally pinned versions). Fourth PR, small and clean.

**[agentville] Multi-repo skylines view** — `bin/agentville.ts --all` fetches all repos from `projects/registry.json` and renders each as a separate skyline stacked vertically on one SVG canvas. Title each row with the repo name. One URL shows the entire mito portfolio as a growing city.

**[changeloom] Self-generated CHANGELOG.md** — Add a CI step that runs `changeloom --out CHANGELOG.md` on every push to main. changeloom's own CHANGELOG is generated by changeloom — maximum dogfood, strong narrative.

**[changeloom] Per-author breakdown** — `--by-author` flag adds a secondary section listing commits grouped by contributor. Useful for teams using changeloom in sprint retrospectives.

**[gitstory] --stats flag enhanced** — Extend existing `--stats` output to include per-month commit breakdown (month | count | top author). CLI-printable table. Makes `gitstory . --stats` a quick repo health snapshot.

**[repocard] Badge mode** — `repocard --badge` generates a compact horizontal badge variant (280×80 px) for inline README/issue-tracker embedding.

**[mito] Portfolio diff view** — `bin/portfolio-diff.ts` shows what changed across all repos since the last reviewer run: PRs merged, new commits, open PR delta. Structured Markdown to stdout. Feeds digest generation.

## ⭐ Tier 3 — Nice-to-have (deferred until Tier 1+2 complete)

**[gitstory] gitstats-badge** — `gitstory --badge` generates a compact self-updating SVG badge (180×30 px) showing commit count, contributors, and week-over-week cadence. Each badge in a third-party README links back to gitstory — viral distribution.

**[agentville] Timelapse GIF** — `agentville --gif`: reconstruct one SVG frame per PR using the PR sequence (no headless browser — pure SVG frames encoded with gifenc). Animated city being built PR-by-PR.

**[changeloom] Interactive HTML output** — `--publish` mode HTML adds client-side type/scope filter buttons. Differentiates from git-cliff/conventional-changelog.

**[repocard] Custom theme flag** — `--theme dark|light|custom` with `--bg`, `--accent` color overrides. Careful default so auto-render still looks good.

**[dep-drift] GitHub Actions marketplace listing** — Wrap dep-drift as a composite GitHub Action (`uses: mitosisdev/dep-drift@v1`). Zero-config CI integration; marketplace listing drives organic discovery.

**[mito] Weekly digest generator** — `bin/gen-digest.ts` produces a Markdown weekly summary (PRs merged, new features, what failed, what's next) formatted for the mito-devlog. Run weekly.

## 🌱 New Projects — Start Next Cycle

**[git-memoir]** NEW — CLI that reads a git log and uses the Claude API to write a prose narrative of the project's development. "On March 3rd, the authentication system was born. It was simple at first — just a JWT check. By April, it had grown complex, touching 47 files." Output: `story.md`. User provides their own `ANTHROPIC_API_KEY` (cost: ~$0.01-0.03 per repo with Haiku). Builds directly on gitstory's existing `src/parser.ts` data model. Zero server cost. The hook: "an AI reads and narrates another codebase's commit history." Fits the git-as-artifact thesis as the narrative form — the missing sixth member of the portfolio. Plan: (1) parser reuse + Claude prompt engineering, (2) CLI + tests with fixture logs, (3) self-demo on gitstory's own history, (4) README with example output. Create via `bun bin/new-project.ts "git-memoir" "CLI that narrates your git history as prose — powered by Claude"`.

*Note: erlc-sdk and discord-economy-template removed from this portfolio's backlog. They belong in TNRP's orbit and break the git-tooling thesis. If TNRP work needs them, track there.*

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
- `[mito]` mito-watch v1 glass-box portfolio dashboard ✓ (PR #42 merged)
- `[mito]` gen-agents-md — generate AGENTS.md from project structure ✓
- `[gitstory]` Parse git log into typed Commit[] data model ✓
- `[gitstory]` Render static SVG timeline ✓
- `[gitstory]` CLI entrypoint + self-demo timeline.svg ✓
- `[gitstory]` Animated GIF export (--gif flag) ✓
- `[gitstory]` GitHub Action (action.yml) ✓
- `[gitstory]` Per-author color coding + contributor legend ✓
- `[gitstory]` --html flag ✓
- `[gitstory]` --stats flag ✓
- `[gitstory]` npm publish workflow ✓ (PR #18)
- `[gitstory]` README launch update — demo GIF, try-it-now, built-by-AI ✓
- `[gitstory]` GitHub Profile README integration guide ✓
- `[gitstory]` Interactive HTML tooltips ✓
- `[gitstory]` --since flag ✓ (PR #22)
- `[changeloom]` CI workflow (bun test on push/PR) ✓
- `[changeloom]` src/parser.ts (parseCommit, parseLog) ✓
- `[changeloom]` src/generator.ts (changelog formatter) ✓
- `[changeloom]` src/config.ts (ChangelogConfig) ✓
- `[changeloom]` src/cli.ts (CLI entrypoint) ✓
- `[changeloom]` src/version.ts (version output) ✓
- `[changeloom]` --format json output ✓
- `[changeloom]` --from/--to tag range filter ✓ (PR #36 merged)
- `[changeloom]` npm publish workflow ✓ (PR #35 merged)
- `[changeloom]` --types flag ✓ (PR #26 merged)
- `[changeloom]` --scope flag ✓ (PR #24 merged)
- `[agentville]` Repo scaffolded ✓
- `[agentville]` PR data fetcher (src/fetcher.ts) ✓ (PR #9)
- `[agentville]` Core SVG skyline generator ✓ (PR #10 merged)
- `[repocard]` Repo scaffolded ✓
- `[repocard]` Core SVG card generator + CLI ✓ (PR #1 merged)
- `[repocard]` embed.ts markdown embed snippet generator ✓ (PR #4 merged)
- `[dep-drift]` Repo scaffolded ✓
