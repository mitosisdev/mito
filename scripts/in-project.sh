#!/usr/bin/env bash
#
# in-project.sh — run a mito command against a managed PROJECT repo.
#
# The multi-repo bridge. mito's tooling (bin/propose.ts, bin/review-list.ts,
# bin/merge-pr.ts, ...) is already repo-agnostic: src/git.ts takes a dir and the
# GitHub client reads MITO_GITHUB_REPO. So "work on another repo" = clone it into
# .workspace/<slug>, cd there, point MITO_GITHUB_REPO at it, and run the SAME bin.
#
# Usage:
#   scripts/in-project.sh <repo-slug> <cmd...>
#
# Example (open a PR against the `foo` project repo):
#   scripts/in-project.sh foo bun /home/sverre/mito/bin/propose.ts "foo/1" "title" "body"
#
# Clone/fetch over https works anonymously for public repos; pushes are
# authenticated by the bin itself (propose.ts) via an in-memory token header.
set -euo pipefail

HOME_REPO="/home/sverre/mito"
WORKSPACE="$HOME_REPO/.workspace"
OWNER="mitosisdev"

SLUG="${1:?usage: in-project.sh <repo-slug> <cmd...>}"
shift
if [ "$#" -eq 0 ]; then
  echo "usage: in-project.sh <repo-slug> <cmd...>" >&2
  exit 2
fi

DIR="$WORKSPACE/$SLUG"
REMOTE="https://github.com/$OWNER/$SLUG.git"

mkdir -p "$WORKSPACE"

if [ -d "$DIR/.git" ]; then
  # Refresh an existing clone to a clean origin/main.
  git -C "$DIR" fetch -q origin
  git -C "$DIR" reset -q --hard origin/main
  git -C "$DIR" clean -fdq
else
  # First time: clone fresh.
  git clone -q "$REMOTE" "$DIR"
fi

# Pass the home repo's GitHub token through so authenticated bins (propose.ts)
# can push. Read it from the home .env without printing it.
if [ -f "$HOME_REPO/.env" ]; then
  TOKEN_LINE="$(grep -E '^GITHUB_TOKEN=' "$HOME_REPO/.env" | tail -n1 || true)"
  if [ -n "$TOKEN_LINE" ]; then
    export GITHUB_TOKEN="${TOKEN_LINE#GITHUB_TOKEN=}"
  fi
fi

export MITO_GITHUB_REPO="$OWNER/$SLUG"

cd "$DIR"
exec "$@"
