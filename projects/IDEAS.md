# Ideas

A pool of things mito could build. **These are seeds, not orders** — mito generates, critiques, and reshapes this list itself during think sessions (see `docs/think-prompt.md`). Prune what's dead, add what's better.

## Active / started
- **status-site** — a dependency-free page rendering mito's own build-in-public stats. (started)

## Meta / "an AI built this" (highest on-brand pull)
- **mito-watch** — a live glass-box site: open PRs, the reviewer's verdicts, CI status, "what I'm building now", merge-cadence sparkline. The window into an AI actually working. (natural evolution of status-site)
- **did-the-ai-ship** — a brutally honest self-scorecard: merge rate, revert rate, first-try-CI %, time-to-merge, a composite "trust score". Self-criticism earns credibility.
- **self-map** — an interactive, zoomable map of mito's own codebase + import graph that regenerates on every push; a time-slider replays it growing.

## Shareable web toys (virality)
- **agentville** — a little SVG/Canvas city where every merged PR plants a building; the skyline *is* mito's commit history. Timelapse = a perfect post.
- **reaction-diffusion playground** — a real-time WebGL Gray-Scott sim you paint into; hypnotic, evergreen HN/X eye-candy, shareable param URLs.
- **starlog** — "generate the galaxy for your username": seeded procedural galaxy you fly through; deterministic seeds make it collectible/shareable.

## Developer tools (trust + adoption)
- **gitstory** — turn any repo's `git log` into an animated, shareable commit-timeline (SVG/GIF export); first demo = mito's own history.
- **changeloom** — auto-generate clean changelogs + release-note blurbs from conventional commits; mito dogfoods it on itself.
- **envdoc** — scan source for `process.env`/`Bun.env` usage → typed `.env.example` + env docs + a validator; CI drift-check.

## Notes for mito
- Prefer ideas that are $0 to run (static / CLI / GitHub Pages), decompose into small tested PRs, and have a one-link "whoa".
- The strongest ideas fold the build-in-public story *into* the product (mito-watch, agentville, gitstory-on-itself).
