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

task_id=${AGENT_CODING_ENGINE_TASK_ID:-}
thread_id=${AGENT_CODING_ENGINE_THREAD_ID:-}
host=${AGENT_CODING_ENGINE_HOST:-codex}
revision=$(printf '%s' "$input" | "$jq_bin" -r 'if (.contract_revision|type) == "number" then .contract_revision else empty end' 2>/dev/null || true)
[ -n "$revision" ] || revision=${AGENT_CODING_ENGINE_CONTRACT_REVISION:-}

if [ -z "$task_id" ] || [ -z "$thread_id" ] || ! printf '%s' "$revision" | grep -Eq '^[0-9]+$'; then
  "$jq_bin" -cn --arg reason '受治理执行缺少稳定 task/thread/contract revision 绑定；Supervisor 拒绝按当前焦点猜测目标。请从受治理启动入口重新绑定原线程。' '{decision:"block",reason:$reason}'
  exit 0
fi

marker=$("$jq_bin" -r '.marker + " "' "$root_dir/.codex/governance/terminal-contract.json")
terminal_json=$(printf '%s' "$input" | "$jq_bin" -j '.last_assistant_message // ""' 2>/dev/null | awk -v marker="$marker" '
  BEGIN { count = 0; marker_line = 0 }
  index($0, marker) == 1 { count++; marker_line = NR; payload = substr($0, length(marker) + 1) }
  { last_line = NR }
  END { if (count == 1 && marker_line == last_line) print payload; else print "null" }
')
if ! printf '%s' "$terminal_json" | "$jq_bin" -e . >/dev/null 2>&1; then
  terminal_json=null
fi

event_id=$(printf '%s' "$input" | "$jq_bin" -r '.event_id // .turn_id // .stop_id // empty' 2>/dev/null || true)
if [ -z "$event_id" ]; then
  event_id=$(printf '%s\037%s\037%s\037%s' "$host" "$thread_id" "$revision" "$terminal_json" | sha256sum | awk '{print $1}')
fi

observations=$(printf '%s' "$input" | "$jq_bin" -c 'if (.execution_observations|type) == "object" then .execution_observations else null end' 2>/dev/null || printf '%s' null)
event=$("$jq_bin" -cn \
  --arg task_id "$task_id" \
  --arg host "$host" \
  --arg workspace "$root_dir" \
  --arg thread_id "$thread_id" \
  --arg event_id "$event_id" \
  --argjson revision "$revision" \
  --argjson terminal_payload "$terminal_json" \
  --argjson observations "$observations" \
  '{schema:"agent-coding-engine.supervisor-event.v1",event_type:"TURN_ENDED",event_id:$event_id,task_id:$task_id,host:$host,workspace:$workspace,thread_id:$thread_id,active_role:"executor",contract_revision:$revision,terminal_payload:$terminal_payload,execution_observations:$observations}')

supervisor_url=${AGENT_CODING_ENGINE_SUPERVISOR_URL:-}
if [ -n "$supervisor_url" ]; then
  result=$(printf '%s' "$event" | powershell.exe -NoProfile -File "$root_dir/.codex/governance/supervisor.ps1" event --url "$supervisor_url")
else
  result=$(printf '%s' "$event" | powershell.exe -NoProfile -File "$root_dir/.codex/governance/supervisor.ps1" event)
fi

printf '%s' "$result" | "$jq_bin" -c '
  if (.decision == "reinject" or .decision == "replan" or .decision == "refuse") then
    {decision:"block",reason:(.follow_up_prompt // .reason)}
  else empty end'
