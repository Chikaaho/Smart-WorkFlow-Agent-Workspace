#!/bin/sh
set -eu
root_dir=$(CDPATH= cd -- "$(dirname "$0")/../.." && pwd)
validator="$root_dir/.codex/governance/validate-terminal.sh"
contract="$root_dir/.codex/governance/terminal-contract.json"
claude_hook="$root_dir/.claude/hooks/stop-execution-completeness.sh"
codex_hook="$root_dir/.codex/hooks/stop-execution-completeness.sh"
passed=0
failed=0

record() {
  if [ "$1" -eq 0 ]; then
    passed=$((passed + 1))
  else
    failed=$((failed + 1))
    printf 'FAIL %s %s\n' "$2" "$3"
  fi
}

validator_case() {
  name=$1 expected=$2 payload=$3 expected_text=${4-}
  set +e
  output=$(printf '%s' "$payload" | sh "$validator" 2>&1)
  actual=$?
  set -e
  ok=1
  if { [ "$expected" = pass ] && [ "$actual" -eq 0 ]; } || { [ "$expected" = fail ] && [ "$actual" -eq 1 ]; } || { [ "$expected" = parse ] && [ "$actual" -eq 2 ]; }; then
    ok=0
  fi
  if [ "$ok" -eq 0 ] && [ -n "$expected_text" ] && ! printf '%s' "$output" | grep -F "$expected_text" >/dev/null; then
    ok=1
  fi
  record "$ok" "validator/$name" "expected=$expected exit=$actual output=$output"
}

direct_s='{"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"TASK_COMPLETED","task_level":"S","evidence":["focused-check:0"]}'
direct_m='{"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"TASK_COMPLETED","task_level":"M","evidence":["targeted-test:0"]}'
execution='{"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"L","receipt":"product/demo/receipts/completion.md","evidence":["gate:0"],"feature_status":"VERIFYING","work_items":[{"id":"implementation","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"等待 Planner 验收"}],"remaining_actionable_count":0,"independent_work_exhausted":true,"next_action":"等待 Planner 验收","next_action_type":"WAIT_PLANNER","progress_fingerprint":"fp-execution-1","stop_reason":"WAITING_FOR_PLANNER","tool_results":[],"browser_status":"NOT_APPLICABLE"}'
sync='{"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"TERMINAL_SYNC_SUBMITTED","task_level":"XL","receipt":"product/demo/receipts/sync.md","evidence":["audit:0"],"feature_status":"COMPLETED","memory_compression":{"before_bytes":10,"after_bytes":8},"work_items":[{"id":"synchronization","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"等待 Planner 复核"}],"remaining_actionable_count":0,"independent_work_exhausted":true,"next_action":"等待 Planner 复核","next_action_type":"WAIT_PLANNER","progress_fingerprint":"fp-sync-1","stop_reason":"WAITING_FOR_PLANNER","tool_results":[],"browser_status":"NOT_APPLICABLE"}'
blocked='{"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"BLOCKED","task_level":"L","receipt":"product/demo/receipts/blocked.md","evidence":["error"],"block_type":"EXTERNAL","attempted":["retry"],"release_condition":"user secret supplied","work_items":[{"id":"browser-login","status":"BLOCKED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"等待用户提供秘密"}],"remaining_actionable_count":0,"independent_work_exhausted":true,"next_action":"等待用户提供秘密","next_action_type":"WAIT_EXTERNAL","progress_fingerprint":"fp-blocked-1","stop_reason":"EXTERNAL_DEPENDENCY","tool_results":[{"tool":"browser.login","outcome":"REQUIRES_SECRET","detail":"受支持会话要求用户秘密，当前未提供"}],"browser_status":"REQUIRES_SECRET"}'
execution=$(printf '%s' "$execution" | /usr/bin/jq -c '. + {progress_basis:{files_changed:["implementation"],tool_actions:["verify"],new_evidence:["gate:0"],closed_work_items:["implementation"]}}')
sync=$(printf '%s' "$sync" | /usr/bin/jq -c '. + {progress_basis:{files_changed:["synchronization"],tool_actions:["audit"],new_evidence:["audit:0"],closed_work_items:["synchronization"]}}')
blocked=$(printf '%s' "$blocked" | /usr/bin/jq -c '. + {progress_basis:{files_changed:["login-check"],tool_actions:["browser.login"],new_evidence:["error"],closed_work_items:[]}}')
blocked_observations=$(printf '%s' "$blocked" | /usr/bin/jq -c '{browser_status,tool_results,progress_fingerprint}')

validator_case direct_s pass "$direct_s"
validator_case direct_m pass "$direct_m"
validator_case execution pass "$execution"
validator_case sync pass "$sync"
validator_case blocked pass "$blocked"
validator_case unknown_state fail '{"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"completed","task_level":"S","evidence":["x"]}' 'state: unknown terminal state'
validator_case missing fail '{"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"L","evidence":["x"],"feature_status":"VERIFYING"}' 'receipt: required for state EXECUTION_SUBMITTED'
validator_case null_payload fail 'null' 'terminal: payload: expected object'
validator_case array_payload fail '[]' 'terminal: payload: expected object'
validator_case string_payload fail '"text"' 'terminal: payload: expected object'
validator_case number_payload fail '7' 'terminal: payload: expected object'
validator_case boolean_payload fail 'false' 'terminal: payload: expected object'
validator_case invalid_json parse '{' 'terminal: payload: invalid JSON'
validator_case missing_level fail '{"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"TASK_COMPLETED","evidence":["x"]}' 'task_level: missing required field'
validator_case wrong_level fail '{"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"TASK_COMPLETED","task_level":"L","evidence":["x"]}' 'task_level: incompatible with state TASK_COMPLETED'
validator_case light_receipt fail '{"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"TASK_COMPLETED","task_level":"S","receipt":"product/demo/receipts/x.md","evidence":["x"]}' 'receipt: forbidden for state TASK_COMPLETED'
validator_case blocked_l_receipt fail '{"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"BLOCKED","task_level":"L","evidence":["x"],"block_type":"EXTERNAL","attempted":["retry"],"release_condition":"restored"}' 'receipt: required for task_level L in state BLOCKED'
validator_case blank_null fail '{"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"L","receipt":"   ","evidence":null,"feature_status":"VERIFYING"}' 'evidence: expected array'
validator_case wrong_type fail '{"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"L","receipt":3,"evidence":"x","feature_status":"VERIFYING"}' 'receipt: expected string'
validator_case out_of_range fail '{"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"TERMINAL_SYNC_SUBMITTED","task_level":"L","receipt":"product/demo/receipts/x.md","evidence":["x"],"feature_status":"COMPLETED","memory_compression":{"before_bytes":-1,"after_bytes":0}}' 'memory_compression.before_bytes: expected non-negative integer'
validator_case extra fail '{"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"L","receipt":"product/demo/receipts/x.md","evidence":["x"],"feature_status":"VERIFYING","surprise":true}' 'surprise: unknown field'
validator_case mismatch fail '{"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"TERMINAL_SYNC_SUBMITTED","task_level":"L","receipt":"product/demo/receipts/x.md","evidence":["x"],"feature_status":"VERIFYING","memory_compression":{"before_bytes":1,"after_bytes":1}}' 'feature_status: incompatible with state TERMINAL_SYNC_SUBMITTED'
validator_case wrong_role fail '{"schema":"agent-coding-engine.executor-terminal.v2","role":"planner","state":"EXECUTION_SUBMITTED","task_level":"L","receipt":"product/demo/receipts/x.md","evidence":["x"],"feature_status":"VERIFYING"}' 'role: must be executor'
validator_case blocked_completed fail '{"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"BLOCKED","task_level":"L","receipt":"product/demo/receipts/x.md","evidence":["x"],"feature_status":"COMPLETED","block_type":"EXTERNAL","attempted":["retry"],"release_condition":"restored"}' 'feature_status: forbidden for state BLOCKED'
validator_case blocked_memory fail '{"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"BLOCKED","task_level":"L","receipt":"product/demo/receipts/x.md","evidence":["x"],"block_type":"EXTERNAL","attempted":["retry"],"release_condition":"restored","memory_compression":{"before_bytes":1,"after_bytes":1}}' 'memory_compression: forbidden for state BLOCKED'
validator_case execution_block_fields fail '{"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"L","receipt":"product/demo/receipts/x.md","evidence":["x"],"feature_status":"VERIFYING","block_type":"EXTERNAL","attempted":["retry"],"release_condition":"restored"}' 'block_type: forbidden for state EXECUTION_SUBMITTED'
validator_case execution_memory fail '{"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"L","receipt":"product/demo/receipts/x.md","evidence":["x"],"feature_status":"VERIFYING","memory_compression":{"before_bytes":1,"after_bytes":1}}' 'memory_compression: forbidden for state EXECUTION_SUBMITTED'
validator_case sync_block_fields fail '{"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"TERMINAL_SYNC_SUBMITTED","task_level":"XL","receipt":"product/demo/receipts/x.md","evidence":["x"],"feature_status":"COMPLETED","memory_compression":{"before_bytes":1,"after_bytes":1},"release_condition":"restored"}' 'release_condition: forbidden for state TERMINAL_SYNC_SUBMITTED'
validator_case actionable_execution fail '{"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"L","receipt":"product/demo/receipts/x.md","evidence":["x"],"feature_status":"VERIFYING","work_items":[{"id":"pending","status":"PENDING","authorized":true,"dependency_satisfied":true,"actionable":true,"next_action":"运行下一项"}],"remaining_actionable_count":1,"independent_work_exhausted":false,"next_action":"运行下一项","next_action_type":"CONTINUE","progress_fingerprint":"fp-actionable","stop_reason":"WAITING_FOR_PLANNER","tool_results":[],"browser_status":"NOT_APPLICABLE"}' 'next_action: continue actionable work before submitting EXECUTION_SUBMITTED'
validator_case actionable_sync fail '{"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"TERMINAL_SYNC_SUBMITTED","task_level":"XL","receipt":"product/demo/receipts/x.md","evidence":["x"],"feature_status":"COMPLETED","memory_compression":{"before_bytes":1,"after_bytes":1},"work_items":[{"id":"pending","status":"IN_PROGRESS","authorized":true,"dependency_satisfied":true,"actionable":true,"next_action":"完成同步"}],"remaining_actionable_count":1,"independent_work_exhausted":false,"next_action":"完成同步","next_action_type":"CONTINUE","progress_fingerprint":"fp-sync-actionable","progress_basis":{"files_changed":["x"],"tool_actions":["sync"],"new_evidence":["x"],"closed_work_items":[]},"stop_reason":"WAITING_FOR_PLANNER","tool_results":[],"browser_status":"NOT_APPLICABLE"}' 'next_action: continue actionable work before submitting TERMINAL_SYNC_SUBMITTED'
validator_case independent_work_left fail '{"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"BLOCKED","task_level":"L","receipt":"product/demo/receipts/x.md","evidence":["error"],"block_type":"EXTERNAL","attempted":["retry"],"release_condition":"service restored","work_items":[{"id":"blocked","status":"BLOCKED","authorized":true,"dependency_satisfied":false,"actionable":false,"next_action":"等待服务"},{"id":"independent","status":"IN_PROGRESS","authorized":true,"dependency_satisfied":true,"actionable":true,"next_action":"继续独立项"}],"remaining_actionable_count":1,"independent_work_exhausted":false,"next_action":"继续独立项","next_action_type":"CONTINUE","progress_fingerprint":"fp-independent","stop_reason":"EXTERNAL_DEPENDENCY","tool_results":[{"tool":"service","outcome":"UNAVAILABLE","detail":"服务返回不可用"}],"browser_status":"NOT_APPLICABLE"}' 'next_action: independent actionable work remains; do not submit BLOCKED'
validator_case browser_operable_block fail '{"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"BLOCKED","task_level":"M","evidence":["login claim"],"block_type":"EVIDENCE_GAP","attempted":["inspect page"],"release_condition":"captcha visible","work_items":[{"id":"login","status":"BLOCKED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"填写可见验证码"}],"remaining_actionable_count":0,"independent_work_exhausted":true,"next_action":"填写可见验证码","next_action_type":"WAIT_EXTERNAL","progress_fingerprint":"fp-browser","stop_reason":"EVIDENCE_GAP","tool_results":[{"tool":"browser.snapshot","outcome":"SUCCEEDED","detail":"页面、DOM 和网络仍可操作"}],"browser_status":"OPERABLE"}' 'browser_status: OPERABLE browser session remains'
validator_case permission_without_denial fail '{"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"BLOCKED","task_level":"M","evidence":["permission claim"],"block_type":"PERMISSION_DENIED","attempted":["run tool"],"release_condition":"permission granted","work_items":[{"id":"local-action","status":"BLOCKED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"重试工具"}],"remaining_actionable_count":0,"independent_work_exhausted":true,"next_action":"重试工具","next_action_type":"WAIT_EXTERNAL","progress_fingerprint":"fp-permission","stop_reason":"PERMISSION_DENIED","tool_results":[{"tool":"shell","outcome":"FAILED","detail":"命令未返回权限拒绝"}],"browser_status":"NOT_APPLICABLE"}' 'PERMISSION_DENIED requires an actual DENIED tool result'

set +e
contract_output=$(/usr/bin/jq -r '. as $root | ($root.properties | keys) as $properties | $root.states | to_entries[] | select(((.value.allowed + .value.forbidden) | unique | sort) != ($properties | sort)) | .key' "$contract" 2>&1)
contract_status=$?
set -e
if [ "$contract_status" -eq 0 ] && [ -z "$contract_output" ]; then contract_ok=0; else contract_ok=1; fi
record "$contract_ok" contract/state_field_partition "exit=$contract_status output=$contract_output"

hook_case() {
  name=$1 expected=$2 role=$3 message=$4 active=$5 observations=${6-}
  input=$(/usr/bin/jq -cn --arg role "$role" --arg message "$message" --arg active "$active" '{active_role:$role,last_assistant_message:$message,stop_hook_active:($active == "true"),background_tasks:[]}')
  if [ -n "$observations" ]; then
    input=$(printf '%s' "$input" | /usr/bin/jq -c --argjson observations "$observations" '. + {execution_observations:$observations}')
  fi
  claude_output=$(printf '%s' "$input" | sh "$claude_hook")
  codex_output=$(printf '%s' "$input" | sh "$codex_hook")
  ok=0
  case "$expected" in
    allow) [ -z "$claude_output" ] && [ -z "$codex_output" ] || ok=1 ;;
    block)
      printf '%s' "$claude_output" | /usr/bin/jq -e '.decision == "block"' >/dev/null 2>&1 || ok=1
      printf '%s' "$codex_output" | /usr/bin/jq -e '.decision == "block"' >/dev/null 2>&1 || ok=1
      printf '%s' "$claude_output" | /usr/bin/jq -e '.supervisor.action == "reinject" and (.follow_up_prompt|length) > 0 and (.continue != false)' >/dev/null 2>&1 || ok=1
      printf '%s' "$codex_output" | /usr/bin/jq -e '.supervisor.action == "reinject" and (.follow_up_prompt|length) > 0 and (.continue != false)' >/dev/null 2>&1 || ok=1
      ;;
    stop)
      printf '%s' "$claude_output" | /usr/bin/jq -e '.continue == false' >/dev/null 2>&1 || ok=1
      printf '%s' "$codex_output" | /usr/bin/jq -e '.continue == false' >/dev/null 2>&1 || ok=1
      ;;
  esac
  [ "$claude_output" = "$codex_output" ] || ok=1
  record "$ok" "hooks/$name" "expected=$expected claude=$claude_output codex=$codex_output"
}

hook_case direct_s allow executor "summary
ENGINE_TERMINAL $direct_s" false
hook_case direct_m allow executor "summary
ENGINE_TERMINAL $direct_m" false
hook_case execution allow executor "summary
ENGINE_TERMINAL $execution" false
hook_case sync allow executor "ENGINE_TERMINAL $sync" false
hook_case blocked allow executor "ENGINE_TERMINAL $blocked" false "$blocked_observations"
hook_case blocked_missing_observations block executor "ENGINE_TERMINAL $blocked" false
hook_case non_executor allow planner 'no terminal required' false
hook_case missing block executor 'summary only' false
hook_case embedded_marker block executor "summary ENGINE_TERMINAL $execution" false
hook_case strict_prefix block executor "summary
 ENGINE_TERMINAL $execution" false
hook_case marker_not_last block executor "ENGINE_TERMINAL $execution
trailing text" false
hook_case marker_before_blank block executor "ENGINE_TERMINAL $execution

" false
hook_case duplicate_marker block executor "ENGINE_TERMINAL $execution
ENGINE_TERMINAL $execution" false
hook_case invalid_payload block executor 'ENGINE_TERMINAL {"state":"bad"}' false
hook_case retry_invalid block executor 'summary only' true

progress_guard_case() {
  input=$(/usr/bin/jq -cn --arg message "ENGINE_TERMINAL $blocked" --argjson observations "$blocked_observations" '{active_role:"executor",last_assistant_message:$message,stop_hook_active:true,background_tasks:[],progress_guard:{previous_fingerprint:"fp-blocked-1",repeat_count:2,observed_progress:false},supervisor:{attempt:0,max_attempts:3},execution_observations:$observations}')
  claude_output=$(printf '%s' "$input" | sh "$claude_hook")
  codex_output=$(printf '%s' "$input" | sh "$codex_hook")
  ok=0
  printf '%s' "$claude_output" | /usr/bin/jq -e '.decision == "block" and (.reason|contains("repeated fingerprint")) and .supervisor.mode == "REINJECT"' >/dev/null 2>&1 || ok=1
  printf '%s' "$codex_output" | /usr/bin/jq -e '.decision == "block" and (.reason|contains("repeated fingerprint")) and .supervisor.mode == "REINJECT"' >/dev/null 2>&1 || ok=1
  [ "$claude_output" = "$codex_output" ] || ok=1
  record "$ok" hooks/repeated_no_progress "claude=$claude_output codex=$codex_output"
}

observation_mismatch_case() {
  mismatched_observations=$(printf '%s' "$blocked_observations" | /usr/bin/jq -c '.browser_status="OPERABLE"')
  input=$(/usr/bin/jq -cn --arg message "ENGINE_TERMINAL $blocked" --argjson observations "$mismatched_observations" '{active_role:"executor",last_assistant_message:$message,stop_hook_active:false,background_tasks:[],execution_observations:$observations}')
  claude_output=$(printf '%s' "$input" | sh "$claude_hook")
  codex_output=$(printf '%s' "$input" | sh "$codex_hook")
  ok=0
  printf '%s' "$claude_output" | /usr/bin/jq -e '.decision == "block" and (.reason|contains("browser_status does not match")) and .supervisor.action == "reinject"' >/dev/null 2>&1 || ok=1
  printf '%s' "$codex_output" | /usr/bin/jq -e '.decision == "block" and (.reason|contains("browser_status does not match")) and .supervisor.action == "reinject"' >/dev/null 2>&1 || ok=1
  [ "$claude_output" = "$codex_output" ] || ok=1
  record "$ok" hooks/observation_mismatch "claude=$claude_output codex=$codex_output"
}

supervisor_replan_case() {
  input=$(/usr/bin/jq -cn '{reason:"重复失败",next_action:"切换到替代工具",attempt:2,max_attempts:3}')
  output=$(printf '%s' "$input" | sh "$root_dir/.codex/governance/supervisor-reinject.sh")
  ok=0
  printf '%s' "$output" | /usr/bin/jq -e '.decision == "block" and .supervisor.mode == "REPLAN" and .supervisor.automatic == true and .continue != false' >/dev/null 2>&1 || ok=1
  record "$ok" supervisor/replan "output=$output"
}

model_invariance_case() {
  message='summary only'
  input_a=$(/usr/bin/jq -cn --arg message "$message" '{active_role:"executor",last_assistant_message:$message,stop_hook_active:false,background_tasks:[],model:"model-a"}')
  input_b=$(/usr/bin/jq -cn --arg message "$message" '{active_role:"executor",last_assistant_message:$message,stop_hook_active:false,background_tasks:[],model:"model-b"}')
  claude_a=$(printf '%s' "$input_a" | sh "$claude_hook")
  claude_b=$(printf '%s' "$input_b" | sh "$claude_hook")
  codex_a=$(printf '%s' "$input_a" | sh "$codex_hook")
  codex_b=$(printf '%s' "$input_b" | sh "$codex_hook")
  ok=0
  [ "$claude_a" = "$claude_b" ] || ok=1
  [ "$codex_a" = "$codex_b" ] || ok=1
  [ "$claude_a" = "$codex_a" ] || ok=1
  record "$ok" hooks/model_invariance "claude=$claude_a codex=$codex_a"
}

progress_guard_case
observation_mismatch_case
supervisor_replan_case
model_invariance_case

printf 'terminal-governance cases=%s passed=%s failed=%s\n' "$((passed + failed))" "$passed" "$failed"
[ "$failed" -eq 0 ]
