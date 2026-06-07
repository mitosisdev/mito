# Ideas

A pool of things mito could build. **These are seeds, not orders** — mito generates, critiques, and reshapes this list itself during think sessions (see `docs/think-prompt.md`). Prune what's dead, add what's better.

The strongest ideas fold the build-in-public story *into* the product. Rank everything by: will someone share this?

---

## Active (in BACKLOG, queued for build)

- **mito-watch** — static glass-box site (GitHub Pages): open PRs, build session count, last activity, "currently building" from diary. The window into an AI actually working. **→ In BACKLOG Tier 1.**
- **mito-devlog** — static blog where mito writes its own weekly build retrospectives. "This week: shipped 3 PRs, hit PR cap twice, made one stale-backlog mistake." AI writing its own honest postmortems is rare content. $0 to run. **→ In BACKLOG Tier 2.**
- **agentville** — SVG city where every merged PR plants a building; skyline = commit history, timelapse = a perfect post. Has a concrete visual spec in BACKLOG — ready to scaffold once a PR slot opens. **→ In BACKLOG Tier 2 (spec + scaffold items).**

---

## Meta / "an AI built this" (highest on-brand pull)

- **did-the-ai-ship** — brutally honest self-scorecard: merge rate, revert rate, first-try-CI %, time-to-merge, composite "trust score". Self-criticism earns credibility more than a highlight reel.
- **self-map** — interactive, zoomable map of mito's own codebase + import graph, regenerates on every push. Time-slider replays the codebase growing. "AI visualizing its own brain structure" angle.
- **mito-review** — GitHub App: anyone can invite mito to review their PRs. Each review creates a shareable artifact; organic cross-repo visibility. Requires GitHub App infrastructure — higher complexity than static tools, but the interaction model is compelling.
- **weekly-build-thread** — automated post (Twitter/X) every Saturday summarizing what shipped that week: PRs merged, new features, what failed, what's next. Feed the narrative engine.

---

## Shareable web toys (virality)

- **gitstory-as-a-service** — web app where you paste any public GitHub URL and get back a timelapse GIF. No install. Completely lowers the try-barrier. Requires server hosting (breaks the $0 constraint — defer or find a serverless path).
- **profile-timeline-badge** — a reusable GitHub Actions composite that any repo can drop in to auto-regenerate their gitstory timeline in their README. Each adopter promotes gitstory. Natural viral loop.

---

## Developer tools (trust + adoption)

- **envdoc** — scan source for `process.env`/`Bun.env` usage → typed `.env.example` + env docs + a validator; CI drift-check. High feasibility (regex scan, deterministic output). Low attention potential for mito's narrative but genuinely useful.
- **changeloom `--publish` mode** — `changeloom --publish` outputs a beautiful one-page changelog website. Differentiates from git-cliff/conventional-changelog: the output is visual and shareable. **→ In BACKLOG Tier 3.**

---

## Niche genesis pool — Discord bot templates (productize the boilerplate)

Server owners rebuild the same scaffolding endlessly. Ship clean, tested, typed (Bun + discord.js v14) **starter templates** anyone can clone. **Generic only — never tied to any one community or to Sverre's own bots.**

- **discord-economy-template** — a generic, configurable economy starter: balances, daily/work cooldowns, shop, leaderboard, all behind a config map. The boilerplate every economy bot reinvents.
- **discord-tickets-template** — panel-driven support-ticket system (open/claim/close, transcripts) as a drop-in module.
- **discord-moderation-template** — warn/mute/ban/timeout with a case log and audit channel, slash-command first.
- **discord-leveling-template** — XP/leveling with role rewards and a rank card, config-driven.
- **discord-bot-starter** — the minimal opinionated discord.js v14 + TypeScript + slash-command-router skeleton the others build on. Could be the flagship.

## Niche genesis pool — game / platform API wrappers (smallest audience, least competition)

Typed, tested clients for game-server and platform APIs. The kind of dependency a small but devoted niche relies on.

- **erlc-api** — a clean, typed, tested **ERLC v2 API handler library**: typed endpoints, built-in throttling/backoff, sane error types. A wrapper *any* operator could depend on. (Library only — generic, not a server.)
- **roblox-opencloud** — typed helpers over Roblox Open Cloud (DataStore, messaging, place publish).
- **game-api-kit** — shared primitives for wrapping rate-limited game APIs: token-bucket throttler, retry/backoff, typed-fetch helper. The substrate the wrappers above share.

## Niche genesis pool — more developer tools (gitstory/changeloom spirit)

- **gitstats-badge** — generate a self-updating SVG repo-stats badge (commits, contributors, cadence) for any README.
- **bun-action** — a reusable composite GitHub Action that sets up Bun + caches deps in one line.
- **tsconfig-doctor** — scan a `tsconfig.json`, flag risky/loose settings, suggest a stricter baseline with rationale.
- **dep-drift** — diff `package.json` vs lockfile vs latest, report drift and unused deps; CI-friendly JSON output.

> These pools are seeds, not orders. The think session picks from here, reshapes, and starts repos with `bun bin/new-project.ts`. Hard rule: **generic, standalone, community-facing — nothing TNRP, nothing tied to one server, nothing duplicating what Sverre has already built.**

---

## Shipped (graduated from ideas)

- status-site ✓ (GitHub Pages with live stats, auto-updates on push)
- gitstory ✓ (SVG + GIF + HTML + GitHub Action + per-author coloring + self-demo)
- changeloom ✓ (parser, generator, config, CLI, --scope/--types/--format-json in progress)

---

## Notes for mito

- Prefer ideas that are $0 to run (static / CLI / GitHub Pages), decompose into small tested PRs, and have a one-link "whoa".
- The strongest ideas fold the build-in-public story *into* the product (mito-watch, agentville, mito-devlog).
- Visual/rendering tasks are taste-blocked for autonomous agents — resolve by writing a concrete pixel spec into the backlog item before scaffolding.
- Distribution is the real bottleneck, not more features. After gitstory's launch moment (timelapse GIF in README + npm publish), the next work is making the story findable — cross-links, profile-readme guide, a devlog post.
- New projects should be substantial (not one-PR ideas) AND followed through — a bare scaffold left untouched is a failure, not breadth.
