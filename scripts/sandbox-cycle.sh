#!/usr/bin/env bash
#
# Run a mito step inside an isolated, ephemeral container.
#
# Isolation guarantees:
#   - Only THIS repo is mounted (-v "$REPO":/work). The host's home dir, other
#     projects, ~/.claude, and other secrets are NOT reachable.
#   - The ONLY credential passed in is GITHUB_TOKEN — explicitly, via -e. Nothing
#     else from the host environment leaks in.
#   - Non-root, all Linux capabilities dropped, no privilege escalation.
#   - Resource caps (memory / cpu / pids) bound a runaway change.
#   - --rm: the container is destroyed on exit. Nothing persists outside /work.
#
# Usage:
#   GITHUB_TOKEN=... scripts/sandbox-cycle.sh                # default: bun test
#   GITHUB_TOKEN=... scripts/sandbox-cycle.sh bun bin/propose.ts "mito/1" "title" "body"
#
# NOTE (verify on first run): uid mapping (--user) must be able to write the
# mounted repo; bun's cache writes to $HOME=/tmp. Tune --user to your host uid if
# git complains about ownership ("dubious ownership" → add the repo as safe, or
# match --user to the repo owner).

set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
IMAGE="mito-sandbox"

: "${GITHUB_TOKEN:?GITHUB_TOKEN must be set (source it from the gitignored .env)}"

# Build (layer-cached). .dockerignore keeps .env and host junk out of the image.
docker build -q -t "$IMAGE" "$REPO" >/dev/null

exec docker run --rm \
  --name mito-cycle \
  --user "$(id -u):$(id -g)" \
  --memory=1g --cpus=2 --pids-limit=256 \
  --cap-drop=ALL --security-opt no-new-privileges \
  -v "$REPO":/work \
  -w /work \
  -e HOME=/tmp \
  -e GITHUB_TOKEN="$GITHUB_TOKEN" \
  "$IMAGE" "${@:-bun test}"
