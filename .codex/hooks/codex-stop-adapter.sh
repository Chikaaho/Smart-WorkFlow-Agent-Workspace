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
  # 找不到 jq 时不得静默放行：受治理会话必须显式报告门禁无法裁决。
  if [ "${AGENT_CODING_ENGINE_ACTIVE_ROLE:-}" = "executor" ] || [ -n "${AGENT_CODING_ENGINE_TASK_ID:-}" ] || [ -n "${AGENT_CODING_ENGINE_THREAD_ID:-}" ] || [ "${GATE_REQUIRE_JQ:-}" = "1" ]; then
    printf '%s\n' '{"decision":"block","reason":"停止门禁无法裁决：本机找不到可用的 jq，无法读取 hook 载荷或校验终态契约。下一步动作：安装 jq，或在 ZCode 宿主改用 .codex/governance/stop-gate.ps1 入口；在此之前不得把本回合当作已完成。"}'
  fi
  exit 0
fi
active_role=$(printf '%s' "$input" | "$jq_bin" -r '.active_role // ""' 2>/dev/null || printf '%s' '')

if [ -z "$active_role" ] && [ -n "${AGENT_CODING_ENGINE_ACTIVE_ROLE:-}" ]; then
  input=$(printf '%s' "$input" | "$jq_bin" --arg role "$AGENT_CODING_ENGINE_ACTIVE_ROLE" '. + {active_role:$role}')
fi

output=$(printf '%s' "$input" | sh "$root_dir/.codex/hooks/stop-execution-completeness.sh")
if [ -n "$output" ]; then
  printf '%s' "$output" | "$jq_bin" -c 'if .decision == "block" and (.reason | type) == "string" then {decision,reason} elif .continue == false then {continue:false} else empty end'
fi
