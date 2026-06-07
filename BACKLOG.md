# Backlog

What mito plans to build next. mito reads this and may add to it. Roughly highest-value first.

## Safety
- Scan every code diff for secrets before opening a PR — never let a key reach a public commit. ✓ shipped
- Cap the size of a single autonomous change (files + lines); flag oversized PRs for extra scrutiny. ✓ shipped
- Detect thrash — don't keep churning the same file or re-proposing rejected ideas. ✓ shipped
- `bin/doctor.ts`: verify env, git remote, and credentials before a run. ✓ shipped

## Get better, not just busy
- ~~Add a linter (Biome) and test coverage; climb the numbers.~~ ✓ PR #4
- ~~**[mito]** Add `src/backlog.ts` — parse BACKLOG.md into a typed task queue; expose it to build sessions so they pull from here instead of inventing work at random.~~ ✓ PR #22
- ~~**[mito]** Track rejected-PR close reasons — add `rejectedIdeas: [{title, reason, closedAt}]` to `mito-state.json`; populate it in `bin/merge-pr.ts` when a reviewer closes without merging; read it at build time to skip re-proposals.~~ ✓ PR #23
- ~~**[mito]** Fix `cyclesRun` semantic in `src/stats.ts` — currently equals total PR count; should count distinct completed build sessions from `state.json` `cycles[]` array (flagged in PR #3 review).~~ ✓ PR #25

## Build in public
- ~~**[mito]** Deploy status-site to GitHub Pages via a GitHub Actions workflow triggered on push to main.~~ ✓ shipped
- ~~**[mito]** Auto-update README stats on every merge — cycles run, PRs merged, days alive, last change.~~ ✓ shipped
- ~~**[gitstory]** Parse `git log` into a typed `Commit[]` data model with unit tests.~~ ✓ shipped
- ~~**[gitstory]** Render a static SVG timeline from `Commit[]`.~~ ✓ shipped
- ~~**[gitstory]** Add CLI entrypoint: `bun src/cli.ts <repo-path> [--out timeline.svg]`.~~ ✓ shipped
- ~~**[gitstory]** Add `--html` flag — wrap the SVG in a standalone HTML file with embedded styles.~~ ✓ PR #16
- ~~**[gitstory]** Add `--stats` flag — print commit count, date range, and top authors to stdout.~~ ✓ PR #17
- ~~**[gitstory]** npm publish workflow — `.github/workflows/publish.yml` releases to npm on version tag.~~ ✓ PR #18
- ~~**[gitstory]** Add `--since` flag — filter commits to a date range (`--since 2024-01-01`).~~ ✓ PR #22
- ~~**[gitstory]** README launch update — polish README for public launch, add usage examples and demo GIF.~~ ✓ PR #21
- ~~**[gitstory]** Interactive HTML tooltips — hovering a commit circle shows sha, author, date, subject.~~ ✓ PR #24
- ~~**[gitstory]** GitHub Profile README integration guide — section in README showing how to embed the SVG in a GitHub profile.~~ ✓ PR #23
- ~~**[mito]** mito-watch v1 glass box — live terminal dashboard showing what mito is doing as it runs.~~ ✓ PR #42
- ~~**[mito]** mito-devlog v1 — autonomous devlog post generation capturing a build session narrative.~~ ✓ PR #46
- **[changeloom]** Add `.github/workflows/publish.yml` — npm publish workflow triggered on version tag. (High priority — blocks v1.0 release)
- **[changeloom]** Add `--publish` flag — build and publish the HTML changelog to a static URL automatically on release.
- **[agentville]** Implement SPEC.md — concrete visual spec: building placement rules, dimensions, color palette. Prerequisite for all agentville PRs.
- **[agentville]** Skyline core — SVG city where every merged PR plants a building; skyline = commit history. Depends on SPEC.md.
- Reviewer writes thoughtful, public PR review comments — the threads are the story.
- Triage human-filed issues in mito's voice.

## Tier 3 — next cycle
- **[gitstory]** `--branch` flag — filter the timeline to a specific git branch instead of the full history.
- **[gitstory]** `--theme` flag — dark / light / auto theme for SVG output; `auto` reads system preference via CSS `prefers-color-scheme`.
- **[changeloom]** v1.0.0 tag — after publish.yml is merged, cut the first tagged release and verify it lands on npm.
- **[agentville]** CLI entrypoint — `agentville <repo>` generates `skyline.svg` from the GitHub API; depends on skyline core being merged.
- **[mito]** devlog post #2 — second post: "What autonomous AI development actually looks like" — lessons from the first full build cycle.

## Later
- Public live dashboard (cycles, spend, changes as they happen).
- Generated media (video / voice / visuals) within the spend cap.
- **[gitstory]** Animated GIF — render one SVG per commit in chronological order, encode to GIF with a lightweight encoder (gifenc). The timelapse of a repo growing commit-by-commit is the viral format.
- **[mito + gitstory]** Run mito's build loop against gitstory as a first-class project using `scripts/in-project.sh`; let mito ship gitstory PRs autonomously without manual intervention.
- **[changeloom]** Implement `src/parser.ts` — `parseCommit()` and `parseLog()` with `ConventionalCommit` interface.
- **[changeloom]** Implement `src/formatter.ts` — format `ConventionalCommit[]` into a Markdown changelog grouped by type.
- **[changeloom]** Implement `src/config.ts` — typed `ChangelogConfig` with defaults and `mergeConfig()`.
- **[changeloom]** Add CLI entrypoint `bin/changeloom.ts` — `git log | changeloom` → changelog output.
