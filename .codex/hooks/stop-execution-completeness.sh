#!/bin/sh

# Only inspect the point where Claude is about to hand control back. This hook
# does not run on ordinary tool calls and does not change bypassPermissions.
input=$(cat)

transcript_path=$(printf '%s' "$input" | /usr/bin/jq -r '.transcript_path // ""')

# The caller must provide the canonical role as structured hook input. A
# transcript is not a role-control channel: do not infer permissions from
# natural-language messages.
active_role=$(printf '%s' "$input" | /usr/bin/jq -r '.active_role // ""')

if [ "$active_role" != "executor" ]; then
  exit 0
fi

message=$(printf '%s' "$input" | /usr/bin/jq -r '.last_assistant_message // ""')
background_count=$(printf '%s' "$input" | /usr/bin/jq '[.background_tasks[]? | select(.status == "running" or .status == "pending" or .status == "in_progress")] | length')

if [ "$background_count" -gt 0 ]; then
  printf '%s\n' '{"decision":"block","reason":"仍有后台任务或 Sub Agent 在运行。请等待并回收其结果，完成当前授权任务的全部剩余项后再结束。"}'
  exit 0
fi

terminal_json=$(printf '%s' "$message" | awk -v marker='SWF_TERMINAL ' 'index($0, marker) { sub("^.*" marker, ""); print; exit }')
diagnostic=$(printf '%s' "$terminal_json" | sh /usr/local/projects/Smart-WorkFlow/.codex/governance/validate-terminal.sh 2>&1)
if [ "$?" -eq 0 ]; then
  exit 0
fi
/usr/bin/jq -cn --arg reason "执行会话缺少合法结构化终态：$diagnostic" '{decision:"block",reason:$reason}'
exit 0
