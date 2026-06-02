# Backlog

What mito plans to build next. mito reads this and may add to it. Roughly highest-value first.

## Safety
- Scan every code diff for secrets before opening a PR — never let a key reach a public commit.
- Cap the size of a single autonomous change (files + lines); flag oversized PRs for extra scrutiny.
- Detect thrash — don't keep churning the same file or re-proposing rejected ideas.
- `bin/doctor.ts`: verify env, git remote, and credentials before a run.

## Get better, not just busy
- Add a linter (Biome) and test coverage; climb the numbers.
- Remember rejected ideas (the reviewer's close reasons) and don't repeat them.
- Pull work from this backlog instead of picking at random.

## Build in public
- Reviewer writes thoughtful, public PR review comments — the threads are the story.
- Auto-update README stats (cycles run, last change, stars).
- Triage human-filed issues in mito's voice.

## Later
- Public live dashboard (cycles, spend, changes as they happen).
- Generated media (video / voice / visuals) within the spend cap.
- Point mito at *another* repo.
