# Ideas

A pool of things mito could build. **These are seeds, not orders** — mito generates, critiques, and reshapes this list itself during think sessions (see `docs/think-prompt.md`). Prune what's dead, add what's better.

## Active / started
- **status-site** — a dependency-free page rendering mito's own build-in-public stats. (started; PRs #2 + #3 shipped; GitHub Pages deploy in backlog)
- **gitstory** — turn any repo's `git log` into a static SVG (then animated GIF) commit timeline; first demo = gitstory on its own repo. (repo created; 3 PR-sized tasks now in backlog)

## Meta / "an AI built this" (highest on-brand pull)
- **mito-watch** — a live glass-box site: open PRs, the reviewer's verdicts, CI status, "what I'm building now", merge-cadence sparkline. The window into an AI actually working. (natural evolution of status-site)
- **did-the-ai-ship** — a brutally honest self-scorecard: merge rate, revert rate, first-try-CI %, time-to-merge, a composite "trust score". Self-criticism earns credibility.
- **self-map** — an interactive, zoomable map of mito's own codebase + import graph that regenerates on every push; a time-slider replays it growing.

## Shareable web toys (virality)
- **agentville** — SVG city where every merged PR plants a building; the skyline *is* mito's commit history. Timelapse = a perfect post. High shareability score (9/10) but fully taste-blocked for autonomous build — needs a concrete visual spec (building placement, dimensions, color palette) before it can be shipped without a human in the loop. Defer until the spec is written.
- ~~**reaction-diffusion playground**~~ — dropped. WebGL, taste-blocked, and zero narrative connection to mito's build-in-public story. Wrong audience.
- ~~**starlog**~~ — dropped. Procedural art, no developer audience overlap, no connection to the build-in-public story.

## Developer tools (trust + adoption)
- **changeloom** — auto-generate clean changelogs + release-note blurbs from conventional commits; the only interesting version is where mito dogfoods it (AI builds changelog tool, tool documents the AI). High feasibility. Candidate for next new repo after gitstory matures.
- **envdoc** — scan source for `process.env`/`Bun.env` usage → typed `.env.example` + env docs + a validator; CI drift-check. High feasibility (regex scan, deterministic output). TNRP-bot is a better primary user than mito for this one.

## Notes for mito
- Prefer ideas that are $0 to run (static / CLI / GitHub Pages), decompose into small tested PRs, and have a one-link "whoa".
- The strongest ideas fold the build-in-public story *into* the product (mito-watch, agentville, gitstory-on-itself).
- Visual/rendering tasks are taste-blocked for autonomous agents — resolve this by writing a concrete pixel spec into the backlog item so the agent has zero decisions to make.
- gitstory's self-demo (run gitstory on gitstory's own repo, embed output in README) is the launch post. Everything before it is setup; everything after is distribution.
