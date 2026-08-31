#!/bin/sh
set -u
root_dir=$(CDPATH= cd -- "$(dirname "$0")/../.." && pwd)
input=$(cat)
active_role=$(printf '%s' "$input" | /usr/bin/jq -r '.active_role // ""')
[ "$active_role" = "executor" ] || exit 0

stop_hook_active=$(printf '%s' "$input" | /usr/bin/jq -r 'if .stop_hook_active == true then "true" else "false" end')
background_count=$(printf '%s' "$input" | /usr/bin/jq '[.background_tasks[]? | select(.status == "running" or .status == "pending" or .status == "in_progress")] | length')
if [ "$background_count" -gt 0 ]; then
  printf '%s\n' '{"decision":"block","reason":"仍有后台任务或 Sub Agent 在运行。请等待并回收其结果后再结束。"}'
  exit 0
fi

set +e
terminal_json=$(printf '%s' "$input" | /usr/bin/jq -j '.last_assistant_message // ""' | awk '
  BEGIN { marker = "ENGINE_TERMINAL "; count = 0; marker_line = 0 }
  index($0, marker) == 1 { count++; marker_line = NR; payload = substr($0, length(marker) + 1) }
  { last_line = NR }
  END {
    if (count == 0) { print "terminal-message: marker: missing" > "/dev/stderr"; exit 1 }
    if (count != 1) { print "terminal-message: marker: expected exactly one" > "/dev/stderr"; exit 1 }
    if (marker_line != last_line) { print "terminal-message: marker: must be the physical last line" > "/dev/stderr"; exit 1 }
    print payload
  }' 2>&1)
extract_status=$?
if [ "$extract_status" -eq 0 ]; then
  diagnostic=$(printf '%s' "$terminal_json" | sh "$root_dir/.codex/governance/validate-terminal.sh" 2>&1)
  validate_status=$?
else
  diagnostic=$terminal_json
  validate_status=$extract_status
fi
set -e
if [ "$validate_status" -eq 0 ]; then
  exit 0
fi

if [ "$stop_hook_active" = "true" ]; then
  /usr/bin/jq -cn --arg reason "Stop hook 已重试一次，终态仍不合法；已停止自动续跑。$diagnostic" '{continue:false,stopReason:$reason}'
  exit 0
fi
/usr/bin/jq -cn --arg reason "执行会话缺少合法结构化终态：$diagnostic" '{decision:"block",reason:$reason}'
exit 0
