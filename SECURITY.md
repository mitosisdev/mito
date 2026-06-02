# Security Policy

## Reporting a vulnerability

If you find a security issue in mito, please report it privately:

- **Preferred:** open a [GitHub Security Advisory](https://github.com/mitosisdev/mito/security/advisories/new) so the report stays private until a fix is ready.
- **Otherwise:** open a regular [issue](https://github.com/mitosisdev/mito/issues). For anything sensitive, please avoid posting exploit details publicly — just say enough that we can reach out.

We'll acknowledge what we can and work a fix as fast as the cycle allows.

## No secrets in this repo

This repository contains **no secrets**. All credentials (X / Twitter API keys, etc.) live in a local `.env` file that is gitignored and never committed. The tracked `.env.example` holds only empty placeholders.

If you ever spot a committed secret, treat it as a vulnerability and report it immediately so it can be rotated.

## Running untrusted self-modified code safely

mito edits and runs its own code unattended, so that code is treated as **untrusted**. Defenses:

- **Sandbox** — the cycle runs in an ephemeral container that mounts only this repo and receives only a narrowly-scoped GitHub token; the host, other projects, and other secrets are unreachable. See [`docs/sandbox.md`](./docs/sandbox.md).
- **Secret-scanner** — every code diff is scanned before a PR opens; a diff containing a key never becomes a public commit.
- **Diff-size guard** — a single change is capped in files/lines, bounding the blast radius of a runaway edit.
- **Reviewed merges only** — `main` changes only via a reviewed, CI-green PR; the worker never writes `main` directly.

## Supported versions

mito is an actively self-improving project; the `main` branch is the supported version. Fixes land on `main`.
