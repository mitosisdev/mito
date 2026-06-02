#!/usr/bin/env bash
#
# mito local session runner — fires a headless Claude Code session (on your stored
# subscription auth) to run one of mito's prompts. Driven by cron.
#
# Usage: run-session.sh <prompt-file>      e.g. docs/cycle-prompt.md
#
# Safety: mito's own kill switch (the STOP file, checked by bin/preflight.ts inside
# the prompts) halts work even while cron keeps firing — `touch STOP` to pause,
# `rm STOP` to arm.

set -euo pipefail

REPO="/home/sverre/mito"
CLAUDE="/home/sverre/.bun/bin/claude"
PROMPT_FILE="${1:?usage: run-session.sh <prompt-file>}"
LOG_DIR="$REPO/.mito-logs"

mkdir -p "$LOG_DIR"
cd "$REPO"
unset CLAUDECODE   # never signal a nested session — headless must run clean

# Respect the kill switch WITHOUT spinning a Claude session (saves usage while paused).
if [ -f "$REPO/STOP" ]; then
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) halted: STOP present, skipping" >> "$LOG_DIR/halt.log"
  exit 0
fi

stamp="$(date -u +%Y%m%dT%H%M%SZ)"
name="$(basename "$PROMPT_FILE" .md)"

# Prompt comes in on STDIN — the positional-arg form isn't picked up in --print mode.
"$CLAUDE" -p \
  --permission-mode bypassPermissions \
  --allowed-tools "Bash,Edit,Write,Read,Glob,Grep,Task" \
  --model sonnet \
  --output-format text \
  < "$PROMPT_FILE" \
  >> "$LOG_DIR/${name}-${stamp}.log" 2>&1
