#!/bin/sh
set -u

root_dir=$(CDPATH= cd -- "$(dirname "$0")/../.." && pwd)
contract="$root_dir/.codex/governance/terminal-contract.json"
validator="$root_dir/.codex/governance/validate-terminal.sh"
supervisor="$root_dir/.codex/governance/supervisor-reinject.sh"
input=$(cat)

active_role=$(printf '%s' "$input" | /usr/bin/jq -r '.active_role // ""' 2>/dev/null || printf '%s' '')
[ "$active_role" = "executor" ] || exit 0

background_count=$(printf '%s' "$input" | /usr/bin/jq '[.background_tasks[]? | select(.status == "running" or .status == "pending" or .status == "in_progress")] | length' 2>/dev/null || printf '%s' '0')
if [ "$background_count" -gt 0 ]; then
  /usr/bin/jq -cn --arg reason '仍有后台任务或 Sub Agent 在运行。请先等待并回收其结果，再继续当前授权任务。' --arg next_action '等待并回收后台任务结果，然后核对其产物和剩余工作项。' --argjson attempt 0 --argjson max_attempts 3 '{reason:$reason,next_action:$next_action,attempt:$attempt,max_attempts:$max_attempts}' | sh "$supervisor"
  exit 0
fi

marker=$(/usr/bin/jq -r '.marker + " "' "$contract")
set +e
terminal_json=$(printf '%s' "$input" | /usr/bin/jq -j '.last_assistant_message // ""' 2>/dev/null | awk -v marker="$marker" '
  BEGIN { count = 0; marker_line = 0 }
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
  diagnostic=$(printf '%s' "$terminal_json" | sh "$validator" 2>&1)
  validate_status=$?
else
  diagnostic=$terminal_json
  validate_status=$extract_status
fi
set -e

next_action=$(printf '%s' "$terminal_json" | /usr/bin/jq -r '.next_action // "完成诊断中指出的第一项原子动作。"' 2>/dev/null || printf '%s' '完成诊断中指出的第一项原子动作。')
terminal_state=$(printf '%s' "$terminal_json" | /usr/bin/jq -r '.state // ""' 2>/dev/null || printf '%s' '')
progress_fingerprint=$(printf '%s' "$terminal_json" | /usr/bin/jq -r '.progress_fingerprint // ""' 2>/dev/null || printf '%s' '')
previous_fingerprint=$(printf '%s' "$input" | /usr/bin/jq -r '.progress_guard.previous_fingerprint // ""' 2>/dev/null || printf '%s' '')
repeat_count=$(printf '%s' "$input" | /usr/bin/jq -r 'if (.progress_guard.repeat_count|type) == "number" and (.progress_guard.repeat_count|floor) == .progress_guard.repeat_count and .progress_guard.repeat_count >= 0 then (.progress_guard.repeat_count|floor) else 0 end' 2>/dev/null || printf '%s' '0')
observed_progress=$(printf '%s' "$input" | /usr/bin/jq -r 'if .progress_guard.observed_progress == false then "false" else "true" end' 2>/dev/null || printf '%s' 'true')
supervisor_attempt=$(printf '%s' "$input" | /usr/bin/jq -r 'if (.supervisor.attempt|type) == "number" and (.supervisor.attempt|floor) == .supervisor.attempt and .supervisor.attempt >= 0 then (.supervisor.attempt|floor) else 0 end' 2>/dev/null || printf '%s' '0')
supervisor_max_attempts=$(printf '%s' "$input" | /usr/bin/jq -r 'if (.supervisor.max_attempts|type) == "number" and (.supervisor.max_attempts|floor) == .supervisor.max_attempts and .supervisor.max_attempts >= 1 then (.supervisor.max_attempts|floor) else 3 end' 2>/dev/null || printf '%s' '3')

observation_present=$(printf '%s' "$input" | /usr/bin/jq -r 'if (.execution_observations|type) == "object" then "true" else "false" end' 2>/dev/null || printf '%s' 'false')
observed_browser_status=$(printf '%s' "$input" | /usr/bin/jq -r '.execution_observations.browser_status // ""' 2>/dev/null || printf '%s' '')
claimed_browser_status=$(printf '%s' "$terminal_json" | /usr/bin/jq -r '.browser_status // ""' 2>/dev/null || printf '%s' '')
observed_tool_results=$(printf '%s' "$input" | /usr/bin/jq -cS '.execution_observations.tool_results // null' 2>/dev/null || printf '%s' 'null')
claimed_tool_results=$(printf '%s' "$terminal_json" | /usr/bin/jq -cS '.tool_results // null' 2>/dev/null || printf '%s' 'null')
observed_progress_fingerprint=$(printf '%s' "$input" | /usr/bin/jq -r '.execution_observations.progress_fingerprint // ""' 2>/dev/null || printf '%s' '')

if [ "$validate_status" -eq 0 ] && [ "$terminal_state" = "BLOCKED" ] && [ "$observation_present" != "true" ]; then
  validate_status=1
  diagnostic='observations: BLOCKED requires Harness execution_observations for tool results, browser status, and progress binding'
  next_action='continue through supported tools and record the Harness observation before evaluating a blocker'
fi

if [ "$validate_status" -eq 0 ] && [ "$terminal_state" = "BLOCKED" ] && [ "$observation_present" = "true" ] && [ "$observed_browser_status" != "$claimed_browser_status" ]; then
  validate_status=1
  diagnostic='observations: browser_status does not match the Harness observation'
  next_action='reconcile the browser observation and continue the supported session'
fi

if [ "$validate_status" -eq 0 ] && [ "$terminal_state" = "BLOCKED" ] && [ "$observation_present" = "true" ] && [ "$observed_tool_results" != "$claimed_tool_results" ]; then
  validate_status=1
  diagnostic='observations: tool_results do not match the Harness observation'
  next_action='reconcile the actual tool result before evaluating a blocker'
fi

if [ "$validate_status" -eq 0 ] && [ "$terminal_state" = "BLOCKED" ] && [ "$observation_present" = "true" ] && [ -z "$observed_progress_fingerprint" ]; then
  validate_status=1
  diagnostic='observations: progress_fingerprint is missing from the Harness observation'
  next_action='record the observed progress fingerprint and perform the next atomic action'
fi

if [ "$validate_status" -eq 0 ] && [ "$terminal_state" = "BLOCKED" ] && [ "$observation_present" = "true" ] && [ -n "$observed_progress_fingerprint" ] && [ "$observed_progress_fingerprint" != "$progress_fingerprint" ]; then
  validate_status=1
  diagnostic='observations: progress_fingerprint does not match the Harness observation'
  next_action='record the observed progress and perform the next atomic action'
fi

if [ "$validate_status" -eq 0 ] && [ "$terminal_state" = "BLOCKED" ] && {
  [ "$observed_progress" = "false" ] || {
    [ "$repeat_count" -gt 0 ] && [ -n "$previous_fingerprint" ] && [ "$progress_fingerprint" = "$previous_fingerprint" ];
  };
}; then
  validate_status=1
  diagnostic='progress: repeated fingerprint has no new file change, tool action, evidence, or closed work item; BLOCKED is not eligible'
  next_action='perform one new atomic action, then switch path if it fails again'
fi

if [ "$validate_status" -eq 0 ]; then
  exit 0
fi

/usr/bin/jq -cn \
  --arg reason "执行会话不能结束：$diagnostic" \
  --arg next_action "$next_action" \
  --argjson attempt "$supervisor_attempt" \
  --argjson max_attempts "$supervisor_max_attempts" \
  '{reason:$reason,next_action:$next_action,attempt:$attempt,max_attempts:$max_attempts}' | sh "$supervisor"
exit 0
