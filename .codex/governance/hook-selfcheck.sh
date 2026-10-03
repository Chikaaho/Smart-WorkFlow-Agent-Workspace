#!/bin/sh
# ZCode hook 门禁自检（POSIX 宿主）。
#
# 与 hook-selfcheck.ps1（Windows）同构的只读诊断入口：报告声明、平台块、入口文件、
# 解释器、漂移、审计台账与派发回执。门禁是否实际运行以审计台账/派发回执为准，
# 不以文件存在代替。

set -u

resolve_jq() {
  for candidate in "${AGENT_CODING_ENGINE_JQ:-}" "$(command -v jq 2>/dev/null || true)" /usr/bin/jq /usr/local/bin/jq /opt/homebrew/bin/jq; do
    if [ -n "$candidate" ] && [ -x "$candidate" ]; then printf '%s' "$candidate"; return 0; fi
  done
  return 1
}

resolve_python() {
  for candidate in "${AGENT_CODING_ENGINE_PYTHON:-}" "$(command -v python3 2>/dev/null || true)" /opt/homebrew/bin/python3 /usr/local/bin/python3 /usr/bin/python3; do
    if [ -n "$candidate" ] && [ -x "$candidate" ] && "$candidate" -c 'import sqlite3' >/dev/null 2>&1; then
      printf '%s' "$candidate"; return 0
    fi
  done
  return 1
}

RecentAudit=6
for arg in "$@"; do
  case "$arg" in
    --recent-audit=*) RecentAudit="${arg#*=}" ;;
    *) echo "{\"status\":\"error\",\"error\":\"unknown-argument\",\"detail\":\"$arg\"}"; exit 1 ;;
  esac
done

root_dir=$(CDPATH= cd -- "$(dirname "$0")/../.." && pwd)
jq_bin=$(resolve_jq || true)
if [ -z "$jq_bin" ]; then
  echo '{"status":"error","error":"jq-unavailable"}'
  exit 1
fi

runtime="$root_dir/.codex/governance/runtime/zcode"
declaration_path="$root_dir/.codex/governance/zcode-hooks-declaration.json"
user_config="$HOME/.zcode/cli/config.json"

declaration_present=false
[ -f "$declaration_path" ] && declaration_present=true

posix_block=$(printf '%s' "$(cat "$declaration_path" 2>/dev/null)" | "$jq_bin" -cS '.platforms.posix.hooks // empty' 2>/dev/null || printf '')
posix_present=false
[ -n "$posix_block" ] && [ "$posix_block" != "null" ] && posix_present=true

entry_files='[]'
for entry in zcode-role-bind.py zcode-stop-gate.py zcode_gate_common.py session-observation.py validate-terminal.sh terminal-contract.json; do
  path="$root_dir/.codex/governance/$entry"
  if [ -f "$path" ]; then
    bytes=$(wc -c < "$path" | tr -d ' ')
    entry_files=$(printf '%s' "$entry_files" | "$jq_bin" -c --arg name "$entry" --arg bytes "$bytes" '. + [{name:$name, present:true, bytes:($bytes|tonumber)}]')
  else
    entry_files=$(printf '%s' "$entry_files" | "$jq_bin" -c --arg name "$entry" '. + [{name:$name, present:false, bytes:0}]')
  fi
done

interpreter=$(resolve_python || true)

drift=true
installed='null'
if [ -f "$user_config" ]; then
  installed=$(printf '%s' "$(cat "$user_config")" | "$jq_bin" -cS '.hooks // null' 2>/dev/null || printf 'null')
fi
if [ -n "$posix_block" ] && [ "$installed" = "$posix_block" ]; then
  drift=false
fi

audit_tail='[]'
if [ -f "$runtime/audit.jsonl" ]; then
  audit_tail=$(tail -n "$RecentAudit" "$runtime/audit.jsonl" | "$jq_bin" -cS -s '.' 2>/dev/null || printf '[]')
fi
audit_record_count=0
[ -f "$runtime/audit.jsonl" ] && audit_record_count=$(wc -l < "$runtime/audit.jsonl" | tr -d ' ')

invocation_tail='[]'
if [ -f "$runtime/invocations.log" ]; then
  invocation_tail=$(tail -n "$RecentAudit" "$runtime/invocations.log" | "$jq_bin" -cS -s '.' 2>/dev/null || printf '[]')
fi
invocation_count=0
[ -f "$runtime/invocations.log" ] && invocation_count=$(wc -l < "$runtime/invocations.log" | tr -d ' ')

entry_failures_present=false
[ -f "$runtime/entry-failures.log" ] && entry_failures_present=true

bound_sessions=0
[ -d "$runtime/sessions" ] && bound_sessions=$(ls "$runtime/sessions" 2>/dev/null | grep -c '\.role\.json$' || printf 0)

live=false
if [ "$drift" = "false" ] && [ "$declaration_present" = "true" ] && [ -n "$interpreter" ] && [ "$audit_record_count" -gt 0 -o "$invocation_count" -gt 0 ]; then
  live=true
fi

printf '%s' "{\"status\":\"$(if [ "$live" = "true" ]; then printf live; else printf 'not-live'; fi)\""
printf ',"declaration":{"present":%s,"path":".codex/governance/zcode-hooks-declaration.json"}' "$declaration_present"
printf ',"platform_block_posix":{"present":%s}' "$posix_present"
printf ',"entry_files":%s' "$entry_files"
printf ',"interpreter":"%s"' "$interpreter"
printf ',"effective_scope":"user","user_config":"%s","drift":%s' "$user_config" "$drift"
printf ',"audit":{"records":%s,"tail":%s}' "$audit_record_count" "$audit_tail"
printf ',"invocations":{"records":%s,"tail":%s}' "$invocation_count" "$invocation_tail"
printf ',"entry_failures_present":%s' "$entry_failures_present"
printf ',"bound_sessions":%s' "$bound_sessions"
printf '%s\n' "}"
exit 0
