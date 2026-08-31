#!/bin/sh
set -eu
root_dir=$(CDPATH= cd -- "$(dirname "$0")/../.." && pwd)
contract="$root_dir/.codex/governance/terminal-contract.json"
payload=$(cat)

if ! payload_type=$(printf '%s' "$payload" | /usr/bin/jq -r 'type' 2>/dev/null); then
  printf '%s\n' 'terminal: payload: invalid JSON' >&2; exit 2
fi

if [ "$payload_type" != "object" ]; then
  printf '%s\n' 'terminal: payload: expected object' >&2; exit 1
fi

diagnostics=$(printf '%s' "$payload" | /usr/bin/jq -r --slurpfile c "$contract" '
  def nonblank: type == "string" and test("\\S");
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
       (["before_bytes","after_bytes"][] as $k | if ($o.memory_compression|has($k)) and (($o.memory_compression[$k]|type) != "number" or ($o.memory_compression[$k]|floor) != $o.memory_compression[$k] or $o.memory_compression[$k] < 0) then "memory_compression.\($k): expected non-negative integer" else empty end)
     else empty end),
    (if ($o.state? | type) == "string" and ($s.states|has($o.state)) then
       ($s.states[$o.state].required[] as $k | if ($o|has($k)|not) then "\($k): required for state \($o.state)" else empty end),
       (($o|keys_unsorted[]) as $k |
         if ($s.states[$o.state].forbidden|index($k)) != null then "\($k): forbidden for state \($o.state)"
         elif ($s.states[$o.state].allowed|index($k)) == null then "\($k): not allowed for state \($o.state)"
         else empty end),
       (if (($s.states[$o.state].allowedTaskLevels|index($o.task_level)) == null) then "task_level: incompatible with state \($o.state)" else empty end),
       (if (($s.states[$o.state].receiptRequiredTaskLevels|index($o.task_level)) != null) and ($o|has("receipt")|not) then "receipt: required for task_level \($o.task_level) in state \($o.state)" else empty end),
       (if ($s.states[$o.state].allowedFeatureStatus|length) > 0 and (($s.states[$o.state].allowedFeatureStatus|index($o.feature_status)) == null) then "feature_status: incompatible with state \($o.state)" else empty end)
     else empty end)
  ] | unique | .[]')

if [ -n "$diagnostics" ]; then
  printf '%s\n' "$diagnostics" | sed 's/^/terminal: /' >&2; exit 1
fi
