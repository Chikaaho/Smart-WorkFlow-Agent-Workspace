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

execution='{"schema":"smart-workflow.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","receipt":"product/demo/receipts/completion.md","evidence":["gate:0"],"feature_status":"VERIFYING"}'
sync='{"schema":"smart-workflow.executor-terminal.v2","role":"executor","state":"TERMINAL_SYNC_SUBMITTED","receipt":"product/demo/receipts/sync.md","evidence":["audit:0"],"feature_status":"COMPLETED","memory_compression":{"before_bytes":10,"after_bytes":8}}'
blocked='{"schema":"smart-workflow.executor-terminal.v2","role":"executor","state":"BLOCKED","receipt":"product/demo/receipts/blocked.md","evidence":["error"],"block_type":"EXTERNAL","attempted":["retry"],"release_condition":"service restored"}'

validator_case execution pass "$execution"
validator_case sync pass "$sync"
validator_case blocked pass "$blocked"
validator_case unknown_state fail '{"schema":"smart-workflow.executor-terminal.v2","role":"executor","state":"completed","receipt":"product/demo/receipts/x.md","evidence":["x"]}' 'state: unknown terminal state'
validator_case missing fail '{"schema":"smart-workflow.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED"}' 'receipt: missing required field'
validator_case null_payload fail 'null' 'terminal: payload: expected object'
validator_case array_payload fail '[]' 'terminal: payload: expected object'
validator_case string_payload fail '"text"' 'terminal: payload: expected object'
validator_case number_payload fail '7' 'terminal: payload: expected object'
validator_case boolean_payload fail 'false' 'terminal: payload: expected object'
validator_case invalid_json parse '{' 'terminal: payload: invalid JSON'
validator_case blank_null fail '{"schema":"smart-workflow.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","receipt":"   ","evidence":null,"feature_status":"VERIFYING"}' 'evidence: expected array'
validator_case wrong_type fail '{"schema":"smart-workflow.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","receipt":3,"evidence":"x","feature_status":"VERIFYING"}' 'receipt: expected string'
validator_case out_of_range fail '{"schema":"smart-workflow.executor-terminal.v2","role":"executor","state":"TERMINAL_SYNC_SUBMITTED","receipt":"product/demo/receipts/x.md","evidence":["x"],"feature_status":"COMPLETED","memory_compression":{"before_bytes":-1,"after_bytes":0}}' 'memory_compression.before_bytes: expected non-negative integer'
validator_case extra fail '{"schema":"smart-workflow.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","receipt":"product/demo/receipts/x.md","evidence":["x"],"feature_status":"VERIFYING","surprise":true}' 'surprise: unknown field'
validator_case mismatch fail '{"schema":"smart-workflow.executor-terminal.v2","role":"executor","state":"TERMINAL_SYNC_SUBMITTED","receipt":"product/demo/receipts/x.md","evidence":["x"],"feature_status":"VERIFYING","memory_compression":{"before_bytes":1,"after_bytes":1}}' 'feature_status: incompatible with state TERMINAL_SYNC_SUBMITTED'
validator_case wrong_role fail '{"schema":"smart-workflow.executor-terminal.v2","role":"planner","state":"EXECUTION_SUBMITTED","receipt":"product/demo/receipts/x.md","evidence":["x"],"feature_status":"VERIFYING"}' 'role: must be executor'
validator_case blocked_completed fail '{"schema":"smart-workflow.executor-terminal.v2","role":"executor","state":"BLOCKED","receipt":"product/demo/receipts/x.md","evidence":["x"],"feature_status":"COMPLETED","block_type":"EXTERNAL","attempted":["retry"],"release_condition":"restored"}' 'feature_status: forbidden for state BLOCKED'
validator_case blocked_memory fail '{"schema":"smart-workflow.executor-terminal.v2","role":"executor","state":"BLOCKED","receipt":"product/demo/receipts/x.md","evidence":["x"],"block_type":"EXTERNAL","attempted":["retry"],"release_condition":"restored","memory_compression":{"before_bytes":1,"after_bytes":1}}' 'memory_compression: forbidden for state BLOCKED'
validator_case execution_block_fields fail '{"schema":"smart-workflow.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","receipt":"product/demo/receipts/x.md","evidence":["x"],"feature_status":"VERIFYING","block_type":"EXTERNAL","attempted":["retry"],"release_condition":"restored"}' 'block_type: forbidden for state EXECUTION_SUBMITTED'
validator_case execution_memory fail '{"schema":"smart-workflow.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","receipt":"product/demo/receipts/x.md","evidence":["x"],"feature_status":"VERIFYING","memory_compression":{"before_bytes":1,"after_bytes":1}}' 'memory_compression: forbidden for state EXECUTION_SUBMITTED'
validator_case sync_block_fields fail '{"schema":"smart-workflow.executor-terminal.v2","role":"executor","state":"TERMINAL_SYNC_SUBMITTED","receipt":"product/demo/receipts/x.md","evidence":["x"],"feature_status":"COMPLETED","memory_compression":{"before_bytes":1,"after_bytes":1},"release_condition":"restored"}' 'release_condition: forbidden for state TERMINAL_SYNC_SUBMITTED'

set +e
contract_output=$(/usr/bin/jq -r '. as $root | ($root.properties | keys) as $properties | $root.states | to_entries[] | select(((.value.allowed + .value.forbidden) | unique | sort) != ($properties | sort)) | .key' "$contract" 2>&1)
contract_status=$?
set -e
if [ "$contract_status" -eq 0 ] && [ -z "$contract_output" ]; then contract_ok=0; else contract_ok=1; fi
record "$contract_ok" contract/state_field_partition "exit=$contract_status output=$contract_output"

hook_case() {
  name=$1 expected=$2 role=$3 message=$4 active=$5
  input=$(/usr/bin/jq -cn --arg role "$role" --arg message "$message" --arg active "$active" '{active_role:$role,last_assistant_message:$message,stop_hook_active:($active == "true"),background_tasks:[]}')
  claude_output=$(printf '%s' "$input" | sh "$claude_hook")
  codex_output=$(printf '%s' "$input" | sh "$codex_hook")
  ok=0
  case "$expected" in
    allow) [ -z "$claude_output" ] && [ -z "$codex_output" ] || ok=1 ;;
    block)
      printf '%s' "$claude_output" | /usr/bin/jq -e '.decision == "block"' >/dev/null 2>&1 || ok=1
      printf '%s' "$codex_output" | /usr/bin/jq -e '.decision == "block"' >/dev/null 2>&1 || ok=1
      ;;
    stop)
      printf '%s' "$claude_output" | /usr/bin/jq -e '.continue == false' >/dev/null 2>&1 || ok=1
      printf '%s' "$codex_output" | /usr/bin/jq -e '.continue == false' >/dev/null 2>&1 || ok=1
      ;;
  esac
  [ "$claude_output" = "$codex_output" ] || ok=1
  record "$ok" "hooks/$name" "expected=$expected claude=$claude_output codex=$codex_output"
}

hook_case execution allow executor "summary
SWF_TERMINAL $execution" false
hook_case sync allow executor "SWF_TERMINAL $sync" false
hook_case blocked allow executor "SWF_TERMINAL $blocked" false
hook_case non_executor allow planner 'no terminal required' false
hook_case missing block executor 'summary only' false
hook_case embedded_marker block executor "summary SWF_TERMINAL $execution" false
hook_case strict_prefix block executor "summary
 SWF_TERMINAL $execution" false
hook_case marker_not_last block executor "SWF_TERMINAL $execution
trailing text" false
hook_case marker_before_blank block executor "SWF_TERMINAL $execution

" false
hook_case duplicate_marker block executor "SWF_TERMINAL $execution
SWF_TERMINAL $execution" false
hook_case invalid_payload block executor 'SWF_TERMINAL {"state":"bad"}' false
hook_case retry_invalid stop executor 'summary only' true

printf 'terminal-governance cases=%s passed=%s failed=%s\n' "$((passed + failed))" "$passed" "$failed"
[ "$failed" -eq 0 ]
