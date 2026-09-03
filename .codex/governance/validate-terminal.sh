#!/bin/sh
set -eu
root_dir=$(CDPATH= cd -- "$(dirname "$0")/../.." && pwd)
contract="$root_dir/.codex/governance/terminal-contract.json"
payload=$(cat)

if ! payload_type=$(printf '%s' "$payload" | /usr/bin/jq -r 'type' 2>/dev/null); then
  printf '%s\n' 'terminal: payload: invalid JSON' >&2
  exit 2
fi

if [ "$payload_type" != "object" ]; then
  printf '%s\n' 'terminal: payload: expected object' >&2
  exit 1
fi

diagnostics=$(printf '%s' "$payload" | /usr/bin/jq -r --slurpfile c "$contract" '
  def nonblank: type == "string" and test("\\S");
  def nonnegative_integer: type == "number" and floor == . and . >= 0;
  def actionable_item:
    type == "object" and
    (.status == "PENDING" or .status == "IN_PROGRESS") and
    .authorized == true and
    .dependency_satisfied == true and
    .actionable == true;
  def failure_outcome:
    .outcome == "FAILED" or .outcome == "DENIED" or .outcome == "UNAVAILABLE" or
    .outcome == "TIMEOUT" or .outcome == "REQUIRES_SECRET" or
    .outcome == "REQUIRES_MFA" or .outcome == "REQUIRES_HUMAN_VERIFICATION";
  . as $o | $c[0] as $s | [
    ($s.required[] as $k | if ($o|has($k)|not) then "\($k): missing required field" else empty end),
    (($o|keys_unsorted[]) as $k | if ($s.properties|has($k)|not) then "\($k): unknown field" else empty end),
    (if ($o|has("schema")) and ($o.schema|type) != "string" then "schema: expected string" elif ($o|has("schema")) and $o.schema != $s.properties.schema.const then "schema: unsupported value" else empty end),
    (if ($o|has("role")) and ($o.role|type) != "string" then "role: expected string" elif ($o|has("role")) and $o.role != $s.properties.role.const then "role: must be executor" else empty end),
    (if ($o|has("state")) and ($o.state|type) != "string" then "state: expected string" elif ($o|has("state")) and (($s.properties.state.enum|index($o.state)) == null) then "state: unknown terminal state" else empty end),
    (if ($o|has("task_level")) and ($o.task_level|type) != "string" then "task_level: expected string" elif ($o|has("task_level")) and (($s.properties.task_level.enum|index($o.task_level)) == null) then "task_level: unknown value" else empty end),
    (if ($o|has("receipt")) and ($o.receipt|type) != "string" then "receipt: expected string" elif ($o|has("receipt")) and (($o.receipt|nonblank)|not) then "receipt: must be non-blank" elif ($o|has("receipt")) and (($o.receipt|test($s.properties.receipt.pattern))|not) then "receipt: invalid path format" else empty end),
    (if ($o|has("evidence")) and ($o.evidence|type) != "array" then "evidence: expected array" elif ($o|has("evidence")) and ($o.evidence|length) < 1 then "evidence: must contain at least one item" elif ($o|has("evidence")) and any($o.evidence[]; type != "string" or (nonblank|not)) then "evidence: items must be non-blank strings" else empty end),
    (if ($o|has("feature_status")) and ($o.feature_status|type) != "string" then "feature_status: expected string" elif ($o|has("feature_status")) and (($s.properties.feature_status.enum|index($o.feature_status)) == null) then "feature_status: unknown value" else empty end),
    (if ($o|has("block_type")) and ($o.block_type|type) != "string" then "block_type: expected string" elif ($o|has("block_type")) and (($s.properties.block_type.enum|index($o.block_type)) == null) then "block_type: unknown value" else empty end),
    (if ($o|has("attempted")) and ($o.attempted|type) != "array" then "attempted: expected array" elif ($o|has("attempted")) and ($o.attempted|length) < 1 then "attempted: must contain at least one item" elif ($o|has("attempted")) and any($o.attempted[]; type != "string" or (nonblank|not)) then "attempted: items must be non-blank strings" else empty end),
    (if ($o|has("release_condition")) and ($o.release_condition|type) != "string" then "release_condition: expected string" elif ($o|has("release_condition")) and (($o.release_condition|nonblank)|not) then "release_condition: must be non-blank" else empty end),
    (if ($o|has("memory_compression")) and ($o.memory_compression|type) != "object" then "memory_compression: expected object" elif ($o|has("memory_compression")) then
       (($o.memory_compression|keys_unsorted[]) as $k | if ($s.properties.memory_compression.properties|has($k)|not) then "memory_compression.\($k): unknown field" else empty end),
       ($s.properties.memory_compression.required[] as $k | if ($o.memory_compression|has($k)|not) then "memory_compression.\($k): missing required field" else empty end),
       (["before_bytes","after_bytes"][] as $k | if ($o.memory_compression|has($k)) and (($o.memory_compression[$k]|nonnegative_integer)|not) then "memory_compression.\($k): expected non-negative integer" else empty end)
     else empty end),
    (if ($o|has("work_items")) and ($o.work_items|type) != "array" then "work_items: expected array"
     elif ($o|has("work_items")) and ($o.work_items|length) < 1 then "work_items: must contain at least one item"
     elif ($o|has("work_items")) then
       ($o.work_items[] | select(type != "object") | "work_items: items must be objects"),
       ($o.work_items[] | select(type == "object") as $i |
         (($i|keys_unsorted[]) as $k | if (["id","status","authorized","dependency_satisfied","actionable","next_action"]|index($k)) == null then "work_items.\($k): unknown field" else empty end),
         (["id","status","authorized","dependency_satisfied","actionable","next_action"][] as $k | if ($i|has($k)|not) then "work_items.\($k): missing required field" else empty end),
         (if ($i|has("id")) and (($i.id|nonblank)|not) then "work_items.id: must be non-blank string" else empty end),
         (if ($i|has("status")) and (($i.status|type) != "string" or (["PENDING","IN_PROGRESS","COMPLETED","BLOCKED"]|index($i.status)) == null) then "work_items.status: unknown value" else empty end),
         (if ($i|has("authorized")) and ($i.authorized|type) != "boolean" then "work_items.authorized: expected boolean" else empty end),
         (if ($i|has("dependency_satisfied")) and ($i.dependency_satisfied|type) != "boolean" then "work_items.dependency_satisfied: expected boolean" else empty end),
         (if ($i|has("actionable")) and ($i.actionable|type) != "boolean" then "work_items.actionable: expected boolean" else empty end),
         (if ($i|has("next_action")) and (($i.next_action|nonblank)|not) then "work_items.next_action: must be non-blank string" else empty end)
       )
     else empty end),
    (if ($o|has("remaining_actionable_count")) and (($o.remaining_actionable_count|nonnegative_integer)|not) then "remaining_actionable_count: expected non-negative integer" else empty end),
    (if ($o|has("independent_work_exhausted")) and ($o.independent_work_exhausted|type) != "boolean" then "independent_work_exhausted: expected boolean" else empty end),
    (if ($o|has("next_action")) and (($o.next_action|nonblank)|not) then "next_action: must be non-blank string" else empty end),
    (if ($o|has("next_action_type")) and ($o.next_action_type|type) != "string" then "next_action_type: expected string" elif ($o|has("next_action_type")) and ((["CONTINUE","WAIT_PLANNER","WAIT_EXTERNAL","REPLAN"]|index($o.next_action_type)) == null) then "next_action_type: unknown value" else empty end),
    (if ($o|has("progress_fingerprint")) and (($o.progress_fingerprint|nonblank)|not) then "progress_fingerprint: must be non-blank string" else empty end),
    (if ($o|has("progress_basis")) and ($o.progress_basis|type) != "object" then "progress_basis: expected object"
     elif ($o|has("progress_basis")) then
       (["files_changed","tool_actions","new_evidence","closed_work_items"][] as $k |
         (($o.progress_basis|keys_unsorted[]) as $extra | if (["files_changed","tool_actions","new_evidence","closed_work_items"]|index($extra)) == null then "progress_basis.\($extra): unknown field" else empty end),
         if ($o.progress_basis|has($k)|not) then "progress_basis.\($k): missing required field"
         elif ($o.progress_basis[$k]|type) != "array" then "progress_basis.\($k): expected array"
         elif any($o.progress_basis[$k][]; type != "string" or (nonblank|not)) then "progress_basis.\($k): items must be non-blank strings"
         else empty end)
     else empty end),
    (if ($o|has("stop_reason")) and ($o.stop_reason|type) != "string" then "stop_reason: expected string" elif ($o|has("stop_reason")) and ((["WAITING_FOR_PLANNER","EXTERNAL_DEPENDENCY","DIRECTION_CONFLICT","ENVIRONMENT_UNAVAILABLE","EVIDENCE_GAP","PERMISSION_DENIED","CAPABILITY_UNAVAILABLE"]|index($o.stop_reason)) == null) then "stop_reason: unknown value" else empty end),
    (if ($o|has("tool_results")) and ($o.tool_results|type) != "array" then "tool_results: expected array"
     elif ($o|has("tool_results")) then
       ($o.tool_results[] | select(type != "object") | "tool_results: items must be objects"),
       ($o.tool_results[] | select(type == "object") as $r |
         (($r|keys_unsorted[]) as $k | if (["tool","outcome","detail"]|index($k)) == null then "tool_results.\($k): unknown field" else empty end),
         (["tool","outcome","detail"][] as $k | if ($r|has($k)|not) then "tool_results.\($k): missing required field" else empty end),
         (if ($r|has("tool")) and (($r.tool|nonblank)|not) then "tool_results.tool: must be non-blank string" else empty end),
         (if ($r|has("outcome")) and ($r.outcome|type) != "string" then "tool_results.outcome: expected string" elif ($r|has("outcome")) and ((["SUCCEEDED","FAILED","DENIED","UNAVAILABLE","TIMEOUT","REQUIRES_SECRET","REQUIRES_MFA","REQUIRES_HUMAN_VERIFICATION"]|index($r.outcome)) == null) then "tool_results.outcome: unknown value" else empty end),
         (if ($r|has("detail")) and (($r.detail|nonblank)|not) then "tool_results.detail: must be non-blank string" else empty end)
       )
     else empty end),
    (if ($o|has("browser_status")) and ($o.browser_status|type) != "string" then "browser_status: expected string" elif ($o|has("browser_status")) and ((["NOT_APPLICABLE","OPERABLE","UNAVAILABLE","REQUIRES_SECRET","REQUIRES_MFA","REQUIRES_HUMAN_VERIFICATION"]|index($o.browser_status)) == null) then "browser_status: unknown value" else empty end),
    (if ($o.state? | type) == "string" and ($s.states|has($o.state)) then
       ($s.states[$o.state].required[] as $k | if ($o|has($k)|not) then "\($k): required for state \($o.state)" else empty end),
       (($o|keys_unsorted[]) as $k |
         if ($s.states[$o.state].forbidden|index($k)) != null then "\($k): forbidden for state \($o.state)"
         elif ($s.states[$o.state].allowed|index($k)) == null then "\($k): not allowed for state \($o.state)"
         else empty end),
       (if (($s.states[$o.state].allowedTaskLevels|index($o.task_level)) == null) then "task_level: incompatible with state \($o.state)" else empty end),
       (if (($s.states[$o.state].receiptRequiredTaskLevels|index($o.task_level)) != null) and ($o|has("receipt")|not) then "receipt: required for task_level \($o.task_level) in state \($o.state)" else empty end),
       (if ($s.states[$o.state].allowedFeatureStatus|length) > 0 and (($s.states[$o.state].allowedFeatureStatus|index($o.feature_status)) == null) then "feature_status: incompatible with state \($o.state)" else empty end)
     else empty end),
    (if ($o.state? | type) == "string" and ($o.state == "EXECUTION_SUBMITTED" or $o.state == "TERMINAL_SYNC_SUBMITTED" or $o.state == "BLOCKED") and
        ($o|has("work_items")) and ($o.work_items|type) == "array" and
        ($o|has("remaining_actionable_count")) and (($o.remaining_actionable_count|nonnegative_integer)) and
        ($o|has("independent_work_exhausted")) and ($o.independent_work_exhausted|type) == "boolean" then
       ($o.work_items | map(select(actionable_item)) | length) as $count |
       (if $count != $o.remaining_actionable_count then "remaining_actionable_count: declared \($o.remaining_actionable_count), observed \($count)" else empty end),
       (if $o.independent_work_exhausted != ($count == 0) then "independent_work_exhausted: inconsistent with remaining actionable work" else empty end),
       (if ($o|has("progress_basis")) and ($o.progress_basis|type) == "object" and
           (["files_changed","tool_actions","new_evidence","closed_work_items"] | all(.[]; (. as $k | ($o.progress_basis|has($k)) and ($o.progress_basis[$k]|type) == "array"))) and
           ((["files_changed","tool_actions","new_evidence","closed_work_items"] | map($o.progress_basis[.]|length) | add) < 1) then "progress_basis: must record a file change, tool action, new evidence, or closed work item" else empty end),
       (if ($o.state == "EXECUTION_SUBMITTED" or $o.state == "TERMINAL_SYNC_SUBMITTED") and $count != 0 then "next_action: continue actionable work before submitting \($o.state)" else empty end),
       (if ($o.state == "EXECUTION_SUBMITTED" or $o.state == "TERMINAL_SYNC_SUBMITTED") and $o.next_action_type != "WAIT_PLANNER" then "next_action_type: \($o.state) requires WAIT_PLANNER when work is exhausted" else empty end),
       (if $o.state == "BLOCKED" and $count != 0 then "next_action: independent actionable work remains; do not submit BLOCKED" else empty end)
     else empty end),
    (if ($o.state? | type) == "string" and $o.state == "EXECUTION_SUBMITTED" and ($o|has("stop_reason")) and $o.stop_reason != "WAITING_FOR_PLANNER" then "stop_reason: EXECUTION_SUBMITTED requires WAITING_FOR_PLANNER" else empty end),
    (if ($o.state? | type) == "string" and $o.state == "TERMINAL_SYNC_SUBMITTED" and ($o|has("stop_reason")) and $o.stop_reason != "WAITING_FOR_PLANNER" then "stop_reason: TERMINAL_SYNC_SUBMITTED requires WAITING_FOR_PLANNER" else empty end),
    (if ($o.state? | type) == "string" and $o.state == "BLOCKED" and ($o|has("tool_results")) and ($o.tool_results|type) == "array" then
       (if ($o.tool_results|length) < 1 then "tool_results: BLOCKED requires at least one actual tool result" else empty end),
       (if ($o|has("browser_status")) and $o.browser_status == "OPERABLE" then "browser_status: OPERABLE browser session remains; continue browser actions before blocking" else empty end),
       (if $o.block_type == "PERMISSION_DENIED" and (any($o.tool_results[]; .outcome == "DENIED")|not) then "tool_results: PERMISSION_DENIED requires an actual DENIED tool result" else empty end),
       (if $o.block_type == "CAPABILITY_UNAVAILABLE" and (any($o.tool_results[]; .outcome == "UNAVAILABLE")|not) then "tool_results: CAPABILITY_UNAVAILABLE requires an actual UNAVAILABLE tool result" else empty end),
       (if ($o.block_type == "EXTERNAL" or $o.block_type == "ENVIRONMENT") and (any($o.tool_results[]; failure_outcome)|not) then "tool_results: EXTERNAL or ENVIRONMENT block requires an actual failed, unavailable, timeout, or external-input result" else empty end),
       (if $o.browser_status == "REQUIRES_SECRET" and (any($o.tool_results[]; .outcome == "REQUIRES_SECRET")|not) then "browser_status: REQUIRES_SECRET requires a matching tool result" else empty end),
       (if $o.browser_status == "REQUIRES_MFA" and (any($o.tool_results[]; .outcome == "REQUIRES_MFA")|not) then "browser_status: REQUIRES_MFA requires a matching tool result" else empty end),
       (if $o.browser_status == "REQUIRES_HUMAN_VERIFICATION" and (any($o.tool_results[]; .outcome == "REQUIRES_HUMAN_VERIFICATION")|not) then "browser_status: REQUIRES_HUMAN_VERIFICATION requires a matching tool result" else empty end),
       (if any($o.tool_results[]; failure_outcome and ((.detail|nonblank)|not)) then "tool_results: failed or externally blocked results require non-blank detail" else empty end),
       (if ($o|has("stop_reason")) and ($o.stop_reason != ({"EXTERNAL":"EXTERNAL_DEPENDENCY","DIRECTION_CONFLICT":"DIRECTION_CONFLICT","ENVIRONMENT":"ENVIRONMENT_UNAVAILABLE","EVIDENCE_GAP":"EVIDENCE_GAP","PERMISSION_DENIED":"PERMISSION_DENIED","CAPABILITY_UNAVAILABLE":"CAPABILITY_UNAVAILABLE"}[$o.block_type])) then "stop_reason: does not match block_type" else empty end)
     else empty end)
  ] | unique | .[]')

if [ -n "$diagnostics" ]; then
  printf '%s\n' "$diagnostics" | sed 's/^/terminal: /' >&2
  exit 1
fi
