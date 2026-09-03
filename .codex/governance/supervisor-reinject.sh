#!/bin/sh
set -eu

input=$(cat)
reason=$(printf '%s' "$input" | /usr/bin/jq -r '.reason // "执行终态门禁未通过。"')
next_action=$(printf '%s' "$input" | /usr/bin/jq -r '.next_action // "检查门禁诊断并完成下一项授权动作。"')
attempt=$(printf '%s' "$input" | /usr/bin/jq -r 'if (.attempt|type) == "number" and (.attempt|floor) == .attempt and .attempt >= 0 then (.attempt|floor) else 0 end')
max_attempts=$(printf '%s' "$input" | /usr/bin/jq -r 'if (.max_attempts|type) == "number" and (.max_attempts|floor) == .max_attempts and .max_attempts >= 1 then (.max_attempts|floor) else 3 end')
next_attempt=$((attempt + 1))

if [ "$next_attempt" -ge "$max_attempts" ]; then
  supervisor_action=REPLAN
  prompt="监督器重规划：终态门禁仍未满足。请切换执行路径，先处理该原子动作：${next_action}。当前诊断：${reason}"
else
  supervisor_action=REINJECT
  prompt="继续执行当前授权任务，不得结束回合。请先完成该原子动作：${next_action}。当前诊断：${reason}"
fi

/usr/bin/jq -cn \
  --arg reason "$prompt" \
  --arg prompt "$prompt" \
  --arg next_action "$next_action" \
  --arg action "$supervisor_action" \
  --argjson attempt "$next_attempt" \
  --argjson max_attempts "$max_attempts" \
  '{decision:"block",reason:$reason,follow_up_prompt:$prompt,supervisor:{action:"reinject",mode:$action,attempt:$attempt,max_attempts:$max_attempts,next_action:$next_action,automatic:true}}'
