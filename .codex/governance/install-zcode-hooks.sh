#!/bin/sh
# 把仓库内的 ZCode hook 声明（POSIX 平台块）同步到机器级配置（安装 / 漂移检查）。
#
# 与 install-zcode-hooks.ps1（Windows）同构：仓库是唯一来源
# `.codex/governance/zcode-hooks-declaration.json`，POSIX 机器安装 `platforms.posix.hooks` 块。
# 生效位置是用户级 `~/.zcode/cli/config.json`——工作区级声明会被宿主信任层静默禁用，
# 且宿主设置界面的保存会用空状态覆写机器级配置（2026-09-26 macOS 实测）。
#
# 用法：
#   sh .codex/governance/install-zcode-hooks.sh            # 安装/修复
#   sh .codex/governance/install-zcode-hooks.sh -Check     # 只检查漂移
# 输出为 JSON 摘要；-Check 在存在漂移时以 exit 3 结束，便于自动化。

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

CHECK=0
for arg in "$@"; do
  case "$arg" in
    -Check|--check) CHECK=1 ;;
    *) printf '%s\n' "{\"status\":\"error\",\"error\":\"unknown-argument\",\"detail\":\"$arg\"}"; exit 1 ;;
  esac
done

root_dir=$(CDPATH= cd -- "$(dirname "$0")/../.." && pwd)
declaration_path="$root_dir/.codex/governance/zcode-hooks-declaration.json"
user_config="${AGENT_CODING_ENGINE_USER_CONFIG:-$HOME/.zcode/cli/config.json}"

jq_bin=$(resolve_jq || true)
if [ -z "$jq_bin" ]; then
  printf '%s\n' '{"status":"error","error":"jq-unavailable","detail":"no usable jq on this host"}'
  exit 1
fi

if [ ! -f "$declaration_path" ]; then
  printf '%s\n' '{"status":"error","error":"declaration-missing"}'
  exit 1
fi

declared_hooks=$(printf '%s' "$(cat "$declaration_path")" | "$jq_bin" -cS '.platforms.posix.hooks // .hooks // empty' 2>/dev/null)
if [ -z "$declared_hooks" ] || [ "$declared_hooks" = "null" ]; then
  printf '%s\n' '{"status":"error","error":"declaration-has-no-posix-hooks"}'
  exit 1
fi

role_bind_entry="$root_dir/.codex/governance/zcode-role-bind.py"
stop_gate_entry="$root_dir/.codex/governance/zcode-stop-gate.py"
if [ ! -f "$role_bind_entry" ] || [ ! -f "$stop_gate_entry" ]; then
  printf '%s\n' '{"status":"error","error":"entry-script-missing"}'
  exit 1
fi

interpreter=$(resolve_python || true)
if [ -z "$interpreter" ]; then
  printf '%s\n' '{"status":"error","error":"python3-unavailable","detail":"no python3 with sqlite3 reachable; hook would be dead on arrival"}'
  exit 1
fi

current_hooks='null'
if [ -f "$user_config" ]; then
  current_hooks=$(printf '%s' "$(cat "$user_config")" | "$jq_bin" -cS '.hooks // null' 2>/dev/null || printf 'null')
fi

drift=true
if [ "$current_hooks" = "$declared_hooks" ]; then
  drift=false
fi

backup=''
applied=false
status='drift'
if [ "$drift" = "false" ]; then
  status='in-sync'
fi

if [ "$drift" = "false" ]; then
  printf '%s\n' "{\"status\":\"$status\",\"declaration\":\".codex/governance/zcode-hooks-declaration.json\",\"effective_scope\":\"user\",\"user_config\":\"$user_config\",\"drift\":false,\"applied\":false,\"backup\":\"\",\"interpreter\":\"$interpreter\"}"
  exit 0
fi

if [ "$CHECK" -eq 1 ]; then
  printf '%s\n' "{\"status\":\"drift\",\"declaration\":\".codex/governance/zcode-hooks-declaration.json\",\"effective_scope\":\"user\",\"user_config\":\"$user_config\",\"drift\":true,\"applied\":false,\"backup\":\"\",\"interpreter\":\"$interpreter\"}"
  exit 3
fi

if [ -f "$user_config" ]; then
  backup="$user_config.bak-$(date +%Y%m%d%H%M%S)"
  cp "$user_config" "$backup" || { printf '%s\n' '{"status":"error","error":"backup-failed"}'; exit 1; }
fi

temporary=$(mktemp)
if [ -f "$user_config" ]; then
  printf '%s' "$(cat "$user_config")" | "$jq_bin" -S --argjson hooks "$declared_hooks" '.hooks = $hooks' > "$temporary" 2>/dev/null
else
  printf '%s' '{}' | "$jq_bin" -S --argjson hooks "$declared_hooks" '.hooks = $hooks' > "$temporary" 2>/dev/null
fi
if [ ! -s "$temporary" ]; then
  rm -f "$temporary"
  printf '%s\n' '{"status":"error","error":"merge-failed"}'
  exit 1
fi
mkdir -p "$(dirname "$user_config")"
mv "$temporary" "$user_config"

printf '%s\n' "{\"status\":\"installed\",\"declaration\":\".codex/governance/zcode-hooks-declaration.json\",\"effective_scope\":\"user\",\"user_config\":\"$user_config\",\"drift\":true,\"applied\":true,\"backup\":\"$backup\",\"interpreter\":\"$interpreter\"}"
exit 0
