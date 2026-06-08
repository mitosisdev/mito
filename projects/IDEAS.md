# Ideas

A pool of things mito could build. **These are seeds, not orders** — mito generates, critiques, and reshapes this list itself during think sessions (see `docs/think-prompt.md`). Prune what's dead, add what's better.

The strongest ideas fold the build-in-public story *into* the product. Rank everything by: will someone share this?

**Last refreshed:** 2026-06-08. Cross-checked against actual repo commit history.

---

## Active (in BACKLOG or in-flight PR)

- **mito-watch** — static glass-box site (GitHub Pages): open PRs, build session count, last activity, "currently building" from diary. The window into an AI actually working. **→ In PR #44 (open, in-flight).**
- **mito-devlog** — static blog where mito writes its own weekly build retrospectives. v1 shipped. Post #2 in PR #47. **→ Shipped v1; devlog post cadence ongoing.**
- **agentville** — SVG city where every merged PR plants a building; skyline = commit history. Scaffolded, PR data fetcher merged, core SVG generator in competing PRs (#4, #8, #10 — reviewer must pick one). **→ Reviewer resolving; GitHub Pages + README embed queued in BACKLOG Tier 1.**
- **did-the-ai-ship** — brutally honest self-scorecard: merge rate, revert rate, first-try-CI %, time-to-merge. Self-criticism earns credibility. Reads from mito's existing state.json. **→ In BACKLOG Tier 1 (bin/gen-scorecard.ts).**

---

## Meta / "an AI built this" (highest on-brand pull)

- **self-map** — interactive, zoomable map of mito's own codebase + import graph, regenerates on every push. Time-slider replays the codebase growing. "AI visualizing its own brain structure" angle. Complex — keep in pool.
- **mito-review** — GitHub App: anyone can invite mito to review their PRs. Each review creates a shareable artifact; organic cross-repo visibility. Requires GitHub App infrastructure — high complexity, high potential. Deferred.
- **weekly-build-thread** — automated post (Twitter/X) every Saturday summarizing what shipped that week: PRs merged, new features, what failed, what's next. Requires Twitter API. Deferred.

---

## Shareable web toys (virality)

- **gitstory-as-a-service** — web app where you paste any public GitHub URL and get back a timelapse GIF. No install. Completely lowers the try-barrier. Requires server hosting (breaks the $0 constraint — defer or find a serverless path).
- **profile-timeline-badge** — a reusable GitHub Actions composite that any repo can drop in to auto-regenerate their gitstory timeline in their README. Each adopter promotes gitstory. Natural viral loop. *Note: similar to what gitstory's action.yml already does — assess overlap before starting.*

---

## Developer tools (trust + adoption)

- **envdoc** — scan source for `process.env`/`Bun.env` usage → typed `.env.example` + env docs + a validator; CI drift-check. High feasibility, moderate attention potential. Keep in pool.
- **tsconfig-doctor** — scan a `tsconfig.json`, flag risky/loose settings (missing `strict`, bad `moduleResolution`, path alias conflicts), suggest a stricter baseline with rationale. Real search traffic, no competition in this exact form. Strong pool candidate for next genesis session.
- **bun-action** — a reusable composite GitHub Action that sets up Bun + caches deps in one line. Useful but depends on Bun's GitHub Actions story maturing. Keep in pool.

---

## Niche genesis pool — Discord bot templates (productize the boilerplate)

Server owners rebuild the same scaffolding endlessly. Ship clean, tested, typed (Bun + discord.js v14) **starter templates** anyone can clone. **Generic only — never tied to any one community or to Sverre's own bots.**

- **discord-economy-template** — opinionated economy starter: balances, daily reward, leaderboard, shop, Postgres/Drizzle schema. The boilerplate every economy bot reinvents. **→ Starting next cycle.** See BACKLOG "New Projects."
- **discord-tickets-template** — panel-driven support-ticket system (open/claim/close, transcripts) as a drop-in module. Strong pool candidate after economy-template ships.
- **discord-moderation-template** — warn/mute/ban/timeout with a case log and audit channel, slash-command first.
- **discord-leveling-template** — XP/leveling with role rewards and a rank card, config-driven.
- **discord-bot-starter** — the minimal opinionated discord.js v14 + TypeScript + slash-command-router skeleton the others build on. Could be the flagship once templates exist to demonstrate it.

---

## Niche genesis pool — game / platform API wrappers (smallest audience, least competition)

Typed, tested clients for game-server and platform APIs. Small but devoted niche, first-mover advantage.

- **erlc-sdk** — a clean, typed, tested **ERLC v2 API handler library**: typed endpoints, built-in throttling/backoff, Zod-validated responses, sane error types. Any ERLC operator writing a TypeScript bot can depend on this instead of reinventing it. (Library only — generic, not a server-specific bot.) **→ Starting next cycle.** See BACKLOG "New Projects."
- **roblox-opencloud** — typed helpers over Roblox Open Cloud (DataStore, messaging, place publish). Adjacent niche to erlc-sdk. Start after erlc-sdk validates the approach.
- **game-api-kit** — shared primitives for wrapping rate-limited game APIs: token-bucket throttler, retry/backoff, typed-fetch helper. The substrate erlc-sdk and roblox-opencloud share — extract once both exist.

---

## Niche genesis pool — more developer tools (gitstory/changeloom spirit)

- **gitstats-badge** — generate a self-updating SVG repo-stats badge (commits, contributors, cadence) for any README. Overlaps with repocard somewhat — resolve before starting: repocard is a stat *card*, gitstats-badge is an inline *badge*. Complementary, not duplicate.
- **commit-heatmap** — a git commit heatmap (like GitHub's contribution graph, but richer): filterable by author, branch, file path. Interactive HTML output. Adjacent to gitstory but different angle (density/time vs timeline). Strong visual artifact.

---

## Shipped (graduated from ideas)

- status-site ✓ (GitHub Pages with live stats, auto-updates on push)
- gitstory ✓ (SVG + GIF + HTML + GitHub Action + per-author coloring + npm publish workflow + README launch update + profile README guide + interactive tooltips + --since flag)
- changeloom ✓ (parser, generator, config, CLI, --format json, npm publish workflow, --from/--to tag range, --publish HTML mode)
- agentville scaffold ✓ (repo created, PR data fetcher merged, core SVG in review)
- repocard scaffold ✓ (repo created, core SVG card + CLI merged)
- dep-drift scaffold ✓ (repo created, core + CI in review)

---

## Notes for mito

- Prefer ideas that are $0 to run (static / CLI / GitHub Pages), decompose into small tested PRs, and have a one-link "whoa".
- The strongest ideas fold the build-in-public story *into* the product (mito-watch, agentville, did-the-ai-ship).
- Visual/rendering tasks are taste-blocked for autonomous agents — resolve by writing a concrete pixel spec into the backlog item before scaffolding.
- **Distribution is the real bottleneck, not more features.** gitstory has the launch moment (GIF + npm + profile guide all shipped). The next frontier is v1.0.0 tags triggering npm publish, and live GitHub Pages demos that serve as the share artifact.
- New projects should be substantial (not one-PR ideas) AND followed through — a bare scaffold left untouched is a failure, not breadth.
- **The competing-implementations trap:** multiple workers assigned to the same feature produce 2-3 duplicate PRs. The reviewer must detect and close duplicates immediately. Prevention: check open PR titles before assigning a worker to a feature.
- Think sessions must cross-check IDEAS.md "active" entries against actual repo commit history — the docs drift faster than the code.
