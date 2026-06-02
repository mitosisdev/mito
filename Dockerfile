# mito sandbox image.
# Purpose: run mito's (self-modified) code in isolation, so a buggy or hijacked
# cycle can touch only this repo + the scoped GitHub token — never the host's
# other secrets, files, or projects.
#
# Secrets are NEVER baked in: .dockerignore excludes .env, and the only
# credential reaches the container at runtime via `-e GITHUB_TOKEN` (see
# scripts/sandbox-cycle.sh).

FROM oven/bun:1-alpine

# git for the branch/commit/PR flow; certs for HTTPS to GitHub.
RUN apk add --no-cache git ca-certificates

# Run as a non-root user.
RUN addgroup -S mito && adduser -S -G mito -u 1000 mito

WORKDIR /work

# Install dependencies in a cached layer (manifest only).
COPY --chown=mito:mito package.json bun.lock ./
RUN bun install --frozen-lockfile || bun install

# Copy the rest of the tree (.dockerignore keeps .env and host junk out).
COPY --chown=mito:mito . .

USER mito
ENV HOME=/tmp

# Default: run the test suite (the risky, self-modified code) in isolation.
CMD ["bun", "test"]
