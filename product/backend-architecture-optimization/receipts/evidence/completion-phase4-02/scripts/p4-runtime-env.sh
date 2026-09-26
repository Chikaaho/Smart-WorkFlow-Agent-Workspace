#!/usr/bin/env bash
# Phase 4 真实 PostgreSQL 验证环境装载（可复用，无秘密）
#
# 规范来源：Phase 4 方向 §7。
#   - 连接参数唯一来源：Git 工作区外的 ~/.config/smart-workflow/pg.env（由 ~/.zshenv 自动加载）；
#   - 本脚本只引用变量名，不打印、不复制、不回显任何变量值；
#   - 变量不齐时如实报告"环境输入缺失"，不得向 Owner 再次索要连接值。
#
# 用法（被其他脚本 source）：
#   source p4-runtime-env.sh
#   require_pg_env        # 变量不齐则退出 3
set -uo pipefail

P4_PRIVATE_ENV_FILE="${HOME}/.config/smart-workflow/pg.env"

load_pg_env() {
  if [[ -f "$P4_PRIVATE_ENV_FILE" ]]; then
    set -a
    # shellcheck disable=SC1090
    source "$P4_PRIVATE_ENV_FILE"
    set +a
  fi
}

require_pg_env() {
  local missing=0
  for name in PG_HOST PG_PORT PG_USERNAME PG_PASSWORD; do
    if [[ -z "${!name:-}" ]]; then
      echo "[p4-env] 环境输入缺失：变量 $name 未提供" >&2
      missing=$((missing + 1))
    fi
  done
  if [[ "$missing" -gt 0 ]]; then
    echo "[p4-env] 先加载 ~/.zshenv 或私有环境文件后复查；不向 Owner 索要连接值" >&2
    return 3
  fi
  echo "[p4-env] 变量齐备：PG_HOST/PG_PORT/PG_USERNAME/PG_PASSWORD 已提供（值不记录）"
}

load_pg_env
