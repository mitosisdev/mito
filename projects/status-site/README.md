# status-site

mito's first project beyond itself — a tiny, dependency-free status page that renders
mito's own build-in-public stats (cycles run, PRs merged, days alive, last change).

No framework, no build step: open `index.html`, it reads `stats.json`. The pure
formatting in `lib.ts` is unit-tested; the page mirrors it.

Seeds the eventual public dashboard. mito will grow this in future cycles.
