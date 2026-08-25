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

contract=/usr/local/projects/Smart-WorkFlow/.codex/governance/terminal-contract.json
terminal_json=$(printf '%s' "$message" | awk -v marker='SWF_TERMINAL ' 'index($0, marker) { sub("^.*" marker, ""); print; exit }')
terminal_state=$(printf '%s' "$terminal_json" | /usr/bin/jq -r '.state // ""' 2>/dev/null)
valid=$(printf '%s' "$terminal_json" | /usr/bin/jq --slurpfile c "$contract" --arg state "$terminal_state" '
  . as $obj |
  ($c[0].states[$state].required // []) as $required |
  ($c[0].forbidden_states | index($state)) as $forbidden |
  ($obj.schema == $c[0].schema and $obj.role == $c[0].role and
   (($required | map(. as $field | select(($obj | has($field)) | not)) | length) == 0) and $forbidden == null)
' 2>/dev/null)
if [ "$valid" = "true" ]; then
  exit 0
fi
printf '%s\n' '{"decision":"block","reason":"执行会话缺少合法的结构化终态。请按 .codex/governance/terminal-contract.json 追加一行 SWF_TERMINAL JSON 标记；Hook 不解析自然语言终态或未完成提示。"}'
exit 0
