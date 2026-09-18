#!/bin/sh
set -eu
# 解析可用的 jq：宿主机不再保证 /usr/bin/jq，缺失时由调用方 fail closed。
resolve_jq() {
  for candidate in "${AGENT_CODING_ENGINE_JQ:-}" "$(command -v jq 2>/dev/null || true)" /usr/bin/jq /usr/local/bin/jq /opt/homebrew/bin/jq; do
    if [ -n "$candidate" ] && [ -x "$candidate" ]; then printf '%s' "$candidate"; return 0; fi
  done
  return 1
}

input=$(cat)
jq_bin=$(resolve_jq || true)
if [ -z "$jq_bin" ]; then
  # 找不到 jq 时不得静默放行：受治理会话必须显式报告门禁无法裁决。
  if [ "${AGENT_CODING_ENGINE_ACTIVE_ROLE:-}" = "executor" ] || [ -n "${AGENT_CODING_ENGINE_TASK_ID:-}" ] || [ -n "${AGENT_CODING_ENGINE_THREAD_ID:-}" ] || [ "${GATE_REQUIRE_JQ:-}" = "1" ]; then
    printf '%s\n' '{"decision":"block","reason":"停止门禁无法裁决：本机找不到可用的 jq，无法读取 hook 载荷或校验终态契约。下一步动作：安装 jq，或在 ZCode 宿主改用 .codex/governance/stop-gate.ps1 入口；在此之前不得把本回合当作已完成。"}'
  fi
  exit 0
fi
reason=$(printf '%s' "$input" | "$jq_bin" -r '.reason // "执行终态门禁未通过。"')
next_action=$(printf '%s' "$input" | "$jq_bin" -r '.next_action // "检查门禁诊断并完成下一项授权动作。"')
attempt=$(printf '%s' "$input" | "$jq_bin" -r 'if (.attempt|type) == "number" and (.attempt|floor) == .attempt and .attempt >= 0 then (.attempt|floor) else 0 end')
max_attempts=$(printf '%s' "$input" | "$jq_bin" -r 'if (.max_attempts|type) == "number" and (.max_attempts|floor) == .max_attempts and .max_attempts >= 1 then (.max_attempts|floor) else 3 end')
next_attempt=$((attempt + 1))

if [ "$next_attempt" -ge "$max_attempts" ]; then
  supervisor_action=REPLAN
  prompt="监督器重规划：终态门禁仍未满足。请切换执行路径，先处理该原子动作：${next_action}。当前诊断：${reason}"
else
  supervisor_action=REINJECT
  prompt="继续执行当前授权任务，不得结束回合。请先完成该原子动作：${next_action}。当前诊断：${reason}"
fi

"$jq_bin" -cn \
  --arg reason "$prompt" \
  --arg prompt "$prompt" \
  --arg next_action "$next_action" \
  --arg action "$supervisor_action" \
  --argjson attempt "$next_attempt" \
  --argjson max_attempts "$max_attempts" \
  '{decision:"block",reason:$reason,follow_up_prompt:$prompt,supervisor:{action:"reinject",mode:$action,attempt:$attempt,max_attempts:$max_attempts,next_action:$next_action,automatic:true}}'
