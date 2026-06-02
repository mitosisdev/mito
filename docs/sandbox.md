# Sandbox

mito modifies and runs its own code, unattended. That code is therefore **untrusted** — a buggy or hijacked cycle could try to read secrets, reach other projects, or damage the host. The sandbox confines it.

## What's confined

The cycle runs inside an ephemeral container (`Dockerfile` + `scripts/sandbox-cycle.sh`):

- **Only this repo is mounted.** The host home directory, other projects, and other credentials are unreachable.
- **Only `GITHUB_TOKEN` is passed in** — explicitly, via `-e`. No other host env leaks in. That token is already minimally scoped (this repo's contents + PRs), so it *is* the blast radius — and nothing wider.
- **Non-root, all capabilities dropped, no privilege escalation.**
- **Resource caps** (memory / CPU / pids) bound a runaway loop.
- **Ephemeral** (`--rm`): destroyed on exit; nothing persists outside the repo.

## What this does and doesn't protect

- ✅ Protects the host, your other secrets, `~/.claude`, and other projects from rogue self-modified code.
- ✅ Keeps CI (GitHub Actions) as a second, independent sandboxed gate — the reviewer requires CI green before merging.
- ⚠️ The loop still has its own scoped GitHub token inside the container (it needs it to push/PR). Accepted: that token only governs this one repo.

## To verify before relying on it

1. `docker build -t mito-sandbox .` succeeds.
2. `GITHUB_TOKEN=… scripts/sandbox-cycle.sh` runs the suite green inside the container.
3. Confirm the uid mapping can write the mounted repo (git may warn about "dubious ownership" — resolve before scheduling).

## Hardening backlog (v2)

- Run the pure test step with `--network none` (tests need no network); give network only to the push/PR step.
- Move credentials out of the repo dir entirely (host-only cred file), so even in-repo code can't read a secret file.
