#!/bin/sh

cd "$(dirname "$0")/../.."
input=$(cat)
active_role=$(printf '%s' "$input" | /usr/bin/jq -r '.active_role // ""')
[ "$active_role" = "executor" ] || exit 0

stop_hook_active=$(printf '%s' "$input" | /usr/bin/jq -r 'if .stop_hook_active == true then "true" else "false" end')
background_count=$(printf '%s' "$input" | /usr/bin/jq '[.background_tasks[]? | select(.status == "running" or .status == "pending" or .status == "in_progress")] | length')
if [ "$background_count" -gt 0 ]; then
  printf '%s\n' '{"decision":"block","reason":"仍有后台任务或 Sub Agent 在运行。请等待并回收其结果后再结束。"}'
  exit 0
fi

message=$(printf '%s' "$input" | /usr/bin/jq -r '.last_assistant_message // ""')
terminal_json=$(printf '%s' "$message" | awk -v marker='SWF_TERMINAL ' 'index($0, marker) { sub("^.*" marker, ""); print; exit }')
diagnostic=$(printf '%s' "$terminal_json" | sh .codex/governance/validate-terminal.sh 2>&1)
if [ "$?" -eq 0 ]; then
  exit 0
fi

if [ "$stop_hook_active" = "true" ]; then
  /usr/bin/jq -cn --arg reason "Stop hook 已重试一次，终态仍不合法；已停止自动续跑。$diagnostic" '{continue:false,stopReason:$reason}'
  exit 0
fi
/usr/bin/jq -cn --arg reason "执行会话缺少合法结构化终态：$diagnostic" '{decision:"block",reason:$reason}'
exit 0
