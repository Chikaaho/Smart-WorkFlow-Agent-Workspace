#!/usr/bin/env bash
# Phase 5 真实 PostgreSQL 验证环境装载（可复用，无秘密）
#
# 规范来源：Phase 4 方向 §7（Phase 5 沿用同一规范）。
#   - 连接参数唯一来源：Git 工作区外的 ~/.config/smart-workflow/pg.env（由 ~/.zshenv 自动加载）；
#   - 本脚本只引用变量名，不打印、不复制、不回显任何变量值；
#   - 变量不齐时如实报告"环境输入缺失"，不得向 Owner 再次索要连接值。
#
# 用法（被其他脚本 source）：
#   source p5-runtime-env.sh
#   require_pg_env        # 变量不齐则退出 3
set -uo pipefail

P5_PRIVATE_ENV_FILE="${HOME}/.config/smart-workflow/pg.env"
P5_EVIDENCE_DB="sw_p5_evidence"

load_pg_env() {
  if [[ -f "$P5_PRIVATE_ENV_FILE" ]]; then
    set -a
    # shellcheck disable=SC1090
    source "$P5_PRIVATE_ENV_FILE"
    set +a
  fi
}

require_pg_env() {
  local missing=0
  for name in PG_HOST PG_PORT PG_USERNAME PG_PASSWORD; do
    if [[ -z "${!name:-}" ]]; then
      echo "[p5-env] 环境输入缺失：变量 $name 未提供" >&2
      missing=$((missing + 1))
    fi
  done
  if [[ "$missing" -gt 0 ]]; then
    echo "[p5-env] 结论：环境输入缺失（$missing 个变量），Phase 5 行为证据无法执行" >&2
    return 3
  fi
  echo "[p5-env] PG 变量齐全（只核对变量名，值不落日志）evidence_db=${P5_EVIDENCE_DB}"
}
