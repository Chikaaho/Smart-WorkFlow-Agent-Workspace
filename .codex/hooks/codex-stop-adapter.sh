#!/bin/sh
set -eu

root_dir=$(CDPATH= cd -- "$(dirname "$0")/../.." && pwd)
input=$(cat)
active_role=$(printf '%s' "$input" | /usr/bin/jq -r '.active_role // ""' 2>/dev/null || printf '%s' '')

if [ -z "$active_role" ] && [ -n "${AGENT_CODING_ENGINE_ACTIVE_ROLE:-}" ]; then
  input=$(printf '%s' "$input" | /usr/bin/jq --arg role "$AGENT_CODING_ENGINE_ACTIVE_ROLE" '. + {active_role:$role}')
fi

output=$(printf '%s' "$input" | sh "$root_dir/.codex/hooks/stop-execution-completeness.sh")
if [ -n "$output" ]; then
  printf '%s' "$output" | /usr/bin/jq -c 'if .decision == "block" and (.reason | type) == "string" then {decision,reason} elif .continue == false then {continue:false} else empty end'
fi
