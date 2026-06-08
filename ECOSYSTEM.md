# The git-as-artifact ecosystem

Git history is more than a log to query — it's raw material. Every commit, merge, and tag
carries signal: velocity, intent, debt, momentum. The mito portfolio is built around one
thesis: **git history is a story worth telling in multiple forms.** Each tool takes that
history and renders it into something shareable, visual, or auditable. Together they cover
the full spectrum from narrative to numerical, from aesthetic to diagnostic.

## Tools

| Tool | What it renders | Install | Repo |
|------|----------------|---------|------|
| **gitstory** | Animated SVG commit timeline — watch a repo's history play out frame by frame | `npx gitstory` | [mitosisdev/gitstory](https://github.com/mitosisdev/gitstory) |
| **agentville** | SVG city skyline where every merged PR plants a new building | `npx agentville` | [mitosisdev/agentville](https://github.com/mitosisdev/agentville) |
| **changeloom** | Structured markdown, HTML, or JSON changelog from conventional commits | `npx changeloom` | [mitosisdev/changeloom](https://github.com/mitosisdev/changeloom) |
| **repocard** | Dark-themed SVG stat card for embedding in GitHub READMEs | `npx repocard` | [mitosisdev/repocard](https://github.com/mitosisdev/repocard) |
| **dep-drift** | Version drift and unused-dependency auditor | `npx dep-drift` | [mitosisdev/dep-drift](https://github.com/mitosisdev/dep-drift) |

## Built by mito

mito is the AI-assisted forge that creates and maintains these tools. Every cycle, mito reads
its own codebase, picks one improvement, implements it on a branch, proves it with tests, and
opens a pull request. The tools above were all designed, scaffolded, and shipped through that
loop — no human wrote the features, but every merge went through CI and review.

The mito repo itself is the build system: `projects/registry.json` tracks the portfolio,
`bin/propose.ts` opens pull requests, and `bin/verify.ts` gates every self-edit on a full
test pass. The development loop is the content.

## Use together

All five tools compose cleanly in a single CI step or README maintenance workflow:

```yaml
# .github/workflows/portfolio-artifacts.yml
- name: Changelog
  run: npx changeloom --out CHANGELOG.md

- name: Commit timeline
  run: npx gitstory . --out docs/timeline.svg

- name: Skyline card
  run: npx agentville ${{ github.repository }} --out docs/skyline.svg

- name: Repo stat card
  run: npx repocard ${{ github.repository }} --out docs/card.svg

- name: Dependency audit
  run: npx dep-drift --fail-on-drift
```

Or drop the output files straight into a README:

```markdown
![Commit timeline](docs/timeline.svg)
![Skyline](docs/skyline.svg)
![Repo card](docs/card.svg)
```

One pipeline. Five forms. The same git history, told every way it can be told.
