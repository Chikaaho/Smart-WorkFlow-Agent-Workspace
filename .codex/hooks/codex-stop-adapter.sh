#!/bin/sh
set -eu
# 解析可用的 jq：宿主机不再保证 /usr/bin/jq，缺失时由调用方 fail closed。
resolve_jq() {
  for candidate in "${AGENT_CODING_ENGINE_JQ:-}" "$(command -v jq 2>/dev/null || true)" /usr/bin/jq /usr/local/bin/jq /opt/homebrew/bin/jq; do
    if [ -n "$candidate" ] && [ -x "$candidate" ]; then printf '%s' "$candidate"; return 0; fi
  done
  return 1
}

root_dir=$(CDPATH= cd -- "$(dirname "$0")/../.." && pwd)
input=$(cat)
jq_bin=$(resolve_jq || true)
if [ -z "$jq_bin" ]; then
  # Resolve the role without jq so a native Planner cannot silently bypass the
  # new gate when jq is absent. This helper only observes explicit user roles.
  role_without_jq="${AGENT_CODING_ENGINE_ACTIVE_ROLE:-}"
  python_bin="${AGENT_CODING_ENGINE_PYTHON:-$(command -v python3 || true)}"
  if [ -n "$python_bin" ]; then
    if binding=$(printf '%s' "$input" | "$python_bin" -X utf8 "$root_dir/.codex/governance/codex-session-role.py" --workspace "$root_dir" 2>/dev/null); then
      role_without_jq=$(printf '%s' "$binding" | "$python_bin" -c 'import json,sys; print(json.load(sys.stdin).get("active_role", ""))')
    else
      printf '%s\n' '{"decision":"block","reason":"Stop Gate cannot observe the explicit session role without jq; repair role observation before handoff."}'
      exit 0
    fi
  fi
  # 找不到 jq 时不得静默放行：受治理会话必须显式报告门禁无法裁决。
  if [ "$role_without_jq" = "executor" ] || [ "$role_without_jq" = "planner" ] || [ -n "${AGENT_CODING_ENGINE_TASK_ID:-}" ] || [ -n "${AGENT_CODING_ENGINE_THREAD_ID:-}" ] || [ "${GATE_REQUIRE_JQ:-}" = "1" ]; then
    printf '%s\n' '{"decision":"block","reason":"停止门禁无法裁决：本机找不到可用的 jq，无法读取 hook 载荷或校验终态契约。下一步动作：安装 jq，或在 ZCode 宿主改用 .codex/governance/stop-gate.ps1 入口；在此之前不得把本回合当作已完成。"}'
  fi
  exit 0
fi
active_role=$(printf '%s' "$input" | "$jq_bin" -r '.active_role // ""' 2>/dev/null || printf '%s' '')

if [ -z "$active_role" ] && [ -z "${AGENT_CODING_ENGINE_ACTIVE_ROLE:-}" ] &&
   [ -n "$(printf '%s' "$input" | "$jq_bin" -r '.transcript_path // ""')" ]; then
  python_bin="${AGENT_CODING_ENGINE_PYTHON:-$(command -v python3 || true)}"
  if [ -z "$python_bin" ] || ! binding=$(printf '%s' "$input" | "$python_bin" -X utf8 "$root_dir/.codex/governance/codex-session-role.py" --workspace "$root_dir" 2>/dev/null); then
    printf '%s\n' '{"decision":"block","reason":"Codex Stop Gate cannot bind the session role (ROLE_OBSERVATION_UNAVAILABLE). Repair the native transcript identity/role observation before submitting a terminal result."}'
    exit 0
  fi
  active_role=$(printf '%s' "$binding" | "$jq_bin" -r '.active_role')
  input=$(printf '%s' "$input" | "$jq_bin" --arg role "$active_role" '. + {active_role:$role}')
fi

if [ -z "$active_role" ] && [ -n "${AGENT_CODING_ENGINE_ACTIVE_ROLE:-}" ]; then
  active_role="$AGENT_CODING_ENGINE_ACTIVE_ROLE"
  input=$(printf '%s' "$input" | "$jq_bin" --arg role "$AGENT_CODING_ENGINE_ACTIVE_ROLE" '. + {active_role:$role}')
fi

if [ "$active_role" = "planner" ]; then
  python_bin="${AGENT_CODING_ENGINE_PYTHON:-$(command -v python3 || true)}"
  if [ -z "$python_bin" ]; then
    printf '%s\n' '{"decision":"block","reason":"Planner convergence gate: PYTHON_UNAVAILABLE; repair the hook before handing off a repeated rejection."}'
    exit 0
  fi
  result=$(printf '%s' "$input" | "$python_bin" -X utf8 "$root_dir/.codex/governance/planner-convergence.py" --workspace "$root_dir" 2>/dev/null) || {
    if ! printf '%s' "$result" | "$jq_bin" -e 'type == "object" and .ok == false and (.reason | type == "string")' >/dev/null 2>&1; then
      printf '%s\n' '{"decision":"block","reason":"Planner convergence gate: VALIDATOR_UNAVAILABLE; repair the hook before handing off a repeated rejection."}'
      exit 0
    fi
  }
  if ! printf '%s' "$result" | "$jq_bin" -e 'type == "object" and ((.ok == true) or (.ok == false and (.reason | type == "string")))' >/dev/null 2>&1; then
    printf '%s\n' '{"decision":"block","reason":"Planner convergence gate: OUTPUT_INVALID; repair the hook before handoff."}'
    exit 0
  fi
  if ! printf '%s' "$result" | "$jq_bin" -e 'type == "object" and .ok == true' >/dev/null 2>&1; then
    printf '%s' "$result" | "$jq_bin" -c '{decision:"block",reason:(.reason // "Planner convergence gate: OUTPUT_INVALID")}'
  fi
  exit 0
fi

[ "$active_role" = "executor" ] || exit 0
output=$(printf '%s' "$input" | sh "$root_dir/.codex/hooks/stop-execution-completeness.sh")
if [ -n "$output" ]; then
  printf '%s' "$output" | "$jq_bin" -c 'if .decision == "block" and (.reason | type) == "string" then {decision,reason} elif .continue == false then {continue:false} else empty end'
fi
