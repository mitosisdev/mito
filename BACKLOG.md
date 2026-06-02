# Backlog

What mito plans to build next. mito reads this and may add to it. Roughly highest-value first.

## Safety
- Scan every code diff for secrets before opening a PR — never let a key reach a public commit. ✓ shipped
- Cap the size of a single autonomous change (files + lines); flag oversized PRs for extra scrutiny. ✓ shipped
- Detect thrash — don't keep churning the same file or re-proposing rejected ideas.
- `bin/doctor.ts`: verify env, git remote, and credentials before a run. ✓ shipped

## Get better, not just busy
- ~~Add a linter (Biome) and test coverage; climb the numbers.~~ ✓ PR #4
- **[mito]** Add `src/backlog.ts` — parse BACKLOG.md into a typed task queue; expose it to build sessions so they pull from here instead of inventing work at random.
- **[mito]** Track rejected-PR close reasons — add `rejectedIdeas: [{title, reason, closedAt}]` to `mito-state.json`; populate it in `bin/merge-pr.ts` when a reviewer closes without merging; read it at build time to skip re-proposals.
- **[mito]** Fix `cyclesRun` semantic in `src/stats.ts` — currently equals total PR count; should count distinct completed build sessions from `state.json` `cycles[]` array (flagged in PR #3 review).

## Build in public
- **[mito]** Deploy status-site to GitHub Pages via a GitHub Actions workflow triggered on push to main (pre-step required: enable Pages in repo Settings → Pages → source: GitHub Actions).
- **[mito]** Auto-update README stats on every merge — cycles run, PRs merged, days alive, last change — so the repo landing page is always live.
- **[gitstory]** Parse `git log` into a typed `Commit[]` data model — `{ sha, authorName, authorEmail, isoTimestamp, subject }` — with unit tests that run against a fixture log string. No rendering; pure parsing. This is PR 1 of the gitstory chain.
- **[gitstory]** Render a static SVG timeline from `Commit[]`. Visual spec: dark background `#0b0d10`, horizontal time axis left→right, one 4 px circle per commit in `#8A2BE2`, ISO-date tick labels in monospace 10 px, repo name as centered h1. Export via `Bun.write("timeline.svg", svg)`. This is PR 2.
- **[gitstory]** Add CLI entrypoint: `bun src/cli.ts <repo-path> [--out timeline.svg]` — runs the parser + renderer end-to-end, writes the SVG, prints the output path. Run it on gitstory's own repo; commit the resulting `timeline.svg` and embed it in README. This is PR 3 — the self-demo that makes the first post.
- Reviewer writes thoughtful, public PR review comments — the threads are the story.
- Triage human-filed issues in mito's voice.

## Later
- Public live dashboard (cycles, spend, changes as they happen).
- Generated media (video / voice / visuals) within the spend cap.
- **[gitstory]** Animated GIF — render one SVG per commit in chronological order, encode to GIF with a lightweight encoder (gifenc). The timelapse of a repo growing commit-by-commit is the viral format. Depends on PR 2 being solid first.
- **[mito + gitstory]** Run mito's build loop against gitstory as a first-class project using `scripts/in-project.sh`; let mito ship gitstory PRs autonomously without manual intervention.
- **[agentville]** SVG city where every merged PR plants a building, skyline = commit history. Highest shareability score — blocked on a concrete visual spec (building placement rules, dimensions, color palette) before an agent can build it without taste decisions.
