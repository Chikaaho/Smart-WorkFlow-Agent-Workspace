#!/bin/sh
set -u
# 解析可用的 jq：宿主机不再保证 /usr/bin/jq，缺失时由调用方 fail closed。
resolve_jq() {
  for candidate in "${AGENT_CODING_ENGINE_JQ:-}" "$(command -v jq 2>/dev/null || true)" /usr/bin/jq /usr/local/bin/jq /opt/homebrew/bin/jq; do
    if [ -n "$candidate" ] && [ -x "$candidate" ]; then printf '%s' "$candidate"; return 0; fi
  done
  return 1
}

root_dir=$(CDPATH= cd -- "$(dirname "$0")/../.." && pwd)
contract="$root_dir/.codex/governance/terminal-contract.json"
validator="$root_dir/.codex/governance/validate-terminal.sh"
supervisor="$root_dir/.codex/governance/supervisor-reinject.sh"
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
[ "$active_role" = "executor" ] || exit 0

# Governed sessions carry stable launch-time identity. Only those sessions are
# routed to the durable host-neutral Supervisor; unbound sessions retain the
# legacy compatibility gate and are never guessed from the focused window.
if [ -n "${AGENT_CODING_ENGINE_TASK_ID:-}" ] || [ -n "${AGENT_CODING_ENGINE_THREAD_ID:-}" ]; then
  printf '%s' "$input" | sh "$root_dir/.codex/governance/supervisor-turn-ended.sh"
  exit 0
fi

background_count=$(printf '%s' "$input" | "$jq_bin" '[.background_tasks[]? | select(.status == "running" or .status == "pending" or .status == "in_progress")] | length' 2>/dev/null || printf '%s' '0')
if [ "$background_count" -gt 0 ]; then
  "$jq_bin" -cn --arg reason '仍有后台任务或 Sub Agent 在运行。请先等待并回收其结果，再继续当前授权任务。' --arg next_action '等待并回收后台任务结果，然后核对其产物和剩余工作项。' --argjson attempt 0 --argjson max_attempts 3 '{reason:$reason,next_action:$next_action,attempt:$attempt,max_attempts:$max_attempts}' | sh "$supervisor"
  exit 0
fi

marker=$("$jq_bin" -r '.marker + " "' "$contract")
set +e
terminal_json=$(printf '%s' "$input" | "$jq_bin" -j '.last_assistant_message // ""' 2>/dev/null | awk -v marker="$marker" '
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

next_action=$(printf '%s' "$terminal_json" | "$jq_bin" -r '.next_action // "完成诊断中指出的第一项原子动作。"' 2>/dev/null || printf '%s' '完成诊断中指出的第一项原子动作。')
terminal_state=$(printf '%s' "$terminal_json" | "$jq_bin" -r '.state // ""' 2>/dev/null || printf '%s' '')
progress_fingerprint=$(printf '%s' "$terminal_json" | "$jq_bin" -r '.progress_fingerprint // ""' 2>/dev/null || printf '%s' '')
previous_fingerprint=$(printf '%s' "$input" | "$jq_bin" -r '.progress_guard.previous_fingerprint // ""' 2>/dev/null || printf '%s' '')
repeat_count=$(printf '%s' "$input" | "$jq_bin" -r 'if (.progress_guard.repeat_count|type) == "number" and (.progress_guard.repeat_count|floor) == .progress_guard.repeat_count and .progress_guard.repeat_count >= 0 then (.progress_guard.repeat_count|floor) else 0 end' 2>/dev/null || printf '%s' '0')
observed_progress=$(printf '%s' "$input" | "$jq_bin" -r 'if .progress_guard.observed_progress == false then "false" else "true" end' 2>/dev/null || printf '%s' 'true')
supervisor_attempt=$(printf '%s' "$input" | "$jq_bin" -r 'if (.supervisor.attempt|type) == "number" and (.supervisor.attempt|floor) == .supervisor.attempt and .supervisor.attempt >= 0 then (.supervisor.attempt|floor) else 0 end' 2>/dev/null || printf '%s' '0')
supervisor_max_attempts=$(printf '%s' "$input" | "$jq_bin" -r 'if (.supervisor.max_attempts|type) == "number" and (.supervisor.max_attempts|floor) == .supervisor.max_attempts and .supervisor.max_attempts >= 1 then (.supervisor.max_attempts|floor) else 3 end' 2>/dev/null || printf '%s' '3')

observation_present=$(printf '%s' "$input" | "$jq_bin" -r 'if (.execution_observations|type) == "object" then "true" else "false" end' 2>/dev/null || printf '%s' 'false')
observed_browser_status=$(printf '%s' "$input" | "$jq_bin" -r '.execution_observations.browser_status // ""' 2>/dev/null || printf '%s' '')
claimed_browser_status=$(printf '%s' "$terminal_json" | "$jq_bin" -r '.browser_status // ""' 2>/dev/null || printf '%s' '')
observed_tool_results=$(printf '%s' "$input" | "$jq_bin" -cS '.execution_observations.tool_results // null' 2>/dev/null || printf '%s' 'null')
claimed_tool_results=$(printf '%s' "$terminal_json" | "$jq_bin" -cS '.tool_results // null' 2>/dev/null || printf '%s' 'null')
observed_progress_fingerprint=$(printf '%s' "$input" | "$jq_bin" -r '.execution_observations.progress_fingerprint // ""' 2>/dev/null || printf '%s' '')
claimed_browser_evidence=$(printf '%s' "$terminal_json" | "$jq_bin" -cS 'if (.browser_evidence|type) == "object" then .browser_evidence else null end' 2>/dev/null || printf '%s' 'null')
observed_browser_evidence=$(printf '%s' "$input" | "$jq_bin" -cS 'if (.execution_observations.browser_evidence|type) == "object" then .execution_observations.browser_evidence else null end' 2>/dev/null || printf '%s' 'null')
confirmation_continue=$(printf '%s' "$terminal_json" | "$jq_bin" -r '
  if (.confirmation|type) == "object" then
    if .confirmation.category == "DETERMINISTIC_LOCAL_INPUT" then "true"
    elif ((.confirmation.input_source == "DEV_TEST_CONFIG" or .confirmation.input_source == "EXISTING_TEST_CONTRACT") and
          ((["DESTRUCTIVE","REMOTE_PUBLISH","OUT_OF_AUTHORIZATION"]|index(.confirmation.category)) == null)) then "true"
    else "false" end
  else "false" end' 2>/dev/null || printf '%s' 'false')
confirmation_continue_diagnostic='confirmation: authorized deterministic input is a continue action; complete it without requesting user input'
confirmation_continue_action='该输入由 dev/test 配置或既有测试契约确定，属于已授权可继续动作：直接完成该动作并继续后续授权项，不请求用户输入。'

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

if [ "$validate_status" -eq 0 ] && [ "$claimed_browser_evidence" != "null" ] && [ "$observed_browser_evidence" != "null" ] && [ "$observed_browser_evidence" != "$claimed_browser_evidence" ]; then
  validate_status=1
  diagnostic='observations: browser_evidence does not match the Harness observation'
  next_action='reconcile the visible browser session and its readback evidence before claiming formal flow acceptance'
fi

if [ "$terminal_state" = "BLOCKED" ] && [ "$confirmation_continue" = "true" ]; then
  next_action="$confirmation_continue_action"
  if [ "$validate_status" -eq 0 ]; then
    validate_status=1
    diagnostic="$confirmation_continue_diagnostic"
  else
    diagnostic=$(printf '%s\n%s' "$diagnostic" "$confirmation_continue_diagnostic")
  fi
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

"$jq_bin" -cn \
  --arg reason "执行会话不能结束：$diagnostic" \
  --arg next_action "$next_action" \
  --argjson attempt "$supervisor_attempt" \
  --argjson max_attempts "$supervisor_max_attempts" \
  '{reason:$reason,next_action:$next_action,attempt:$attempt,max_attempts:$max_attempts}' | sh "$supervisor"
exit 0
