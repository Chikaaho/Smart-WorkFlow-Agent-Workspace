#!/bin/sh
set -eu
root_dir=$(CDPATH= cd -- "$(dirname "$0")/../.." && pwd)
validator="$root_dir/.codex/governance/validate-terminal.sh"
passed=0; failed=0
case_run() {
  name=$1 expected=$2 payload=$3
  set +e; output=$(printf '%s' "$payload" | sh "$validator" 2>&1); actual=$?; set -e
  if { [ "$expected" = pass ] && [ "$actual" -eq 0 ]; } || { [ "$expected" = fail ] && [ "$actual" -ne 0 ]; }; then passed=$((passed + 1)); else failed=$((failed + 1)); printf 'FAIL %s expected=%s exit=%s output=%s\n' "$name" "$expected" "$actual" "$output"; fi
}
case_run execution pass '{"schema":"smart-workflow.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","receipt":"product/demo/receipts/completion.md","evidence":["gate:0"],"feature_status":"VERIFYING"}'
case_run sync pass '{"schema":"smart-workflow.executor-terminal.v2","role":"executor","state":"TERMINAL_SYNC_SUBMITTED","receipt":"product/demo/receipts/sync.md","evidence":["audit:0"],"feature_status":"COMPLETED","memory_compression":{"before_bytes":10,"after_bytes":8}}'
case_run blocked pass '{"schema":"smart-workflow.executor-terminal.v2","role":"executor","state":"BLOCKED","receipt":"product/demo/receipts/blocked.md","evidence":["error"],"block_type":"EXTERNAL","attempted":["retry"],"release_condition":"service restored"}'
case_run unknown_state fail '{"schema":"smart-workflow.executor-terminal.v2","role":"executor","state":"completed","receipt":"product/demo/receipts/x.md","evidence":["x"]}'
case_run missing fail '{"schema":"smart-workflow.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED"}'
case_run blank_null fail '{"schema":"smart-workflow.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","receipt":"   ","evidence":null,"feature_status":"VERIFYING"}'
case_run wrong_type fail '{"schema":"smart-workflow.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","receipt":3,"evidence":"x","feature_status":"VERIFYING"}'
case_run out_of_range fail '{"schema":"smart-workflow.executor-terminal.v2","role":"executor","state":"TERMINAL_SYNC_SUBMITTED","receipt":"product/demo/receipts/x.md","evidence":["x"],"feature_status":"COMPLETED","memory_compression":{"before_bytes":-1,"after_bytes":0}}'
case_run extra fail '{"schema":"smart-workflow.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","receipt":"product/demo/receipts/x.md","evidence":["x"],"feature_status":"VERIFYING","surprise":true}'
case_run mismatch fail '{"schema":"smart-workflow.executor-terminal.v2","role":"executor","state":"TERMINAL_SYNC_SUBMITTED","receipt":"product/demo/receipts/x.md","evidence":["x"],"feature_status":"VERIFYING","memory_compression":{"before_bytes":1,"after_bytes":1}}'
case_run wrong_role fail '{"schema":"smart-workflow.executor-terminal.v2","role":"planner","state":"EXECUTION_SUBMITTED","receipt":"product/demo/receipts/x.md","evidence":["x"],"feature_status":"VERIFYING"}'
printf 'terminal-contract cases=%s passed=%s failed=%s\n' "$((passed + failed))" "$passed" "$failed"
[ "$failed" -eq 0 ]
