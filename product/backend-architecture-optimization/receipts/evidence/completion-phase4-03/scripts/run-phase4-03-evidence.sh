#!/usr/bin/env bash
# Phase 4 G3a/G3b 补证采集运行器（回执 03）
#
# 规范（方向 §7）：连接参数只从工作区外私有环境文件读取，其值不得出现在命令文本、
# 证据包或任何日志中。因此本脚本：
#   1) 只引用变量名（PG_HOST/PG_PORT/PG_USERNAME/PG_PASSWORD），命令文本里没有值；
#   2) 所有输出在落盘前经过脱敏过滤器（值 → <redacted-*> 占位符）；
#   3) 每条命令记录 cwd / exit / 耗时 / 输出行数到 command-results.tsv，便于复算。
#
# 用法：bash run-phase4-evidence.sh
set -uo pipefail

SERVER_ROOT="/usr/local/projects/Smart-WorkFlow/Smart-WorkFlow-aPaaS-server"
EVIDENCE_DIR="/usr/local/projects/Smart-WorkFlow/product/backend-architecture-optimization/receipts/evidence/completion-phase4-03"
RAW="$EVIDENCE_DIR/raw"
RESULTS="$EVIDENCE_DIR/command-results.tsv"

# 私有环境文件（值不落日志）
set -a
# shellcheck disable=SC1090
source "${HOME}/.config/smart-workflow/pg.env"
set +a

mkdir -p "$RAW"

# 值 → 占位符（正则元字符先转义；脱敏只作用于本脚本产生的输出）
esc() { printf '%s' "$1" | sed -e 's/[][\\.^$*+?(){}|/]/\\&/g'; }
HOST_RE="$(esc "${PG_HOST:-__missing__}")"
PORT_RE="$(esc "${PG_PORT:-__missing__}")"
USER_RE="$(esc "${PG_USERNAME:-__missing__}")"
PASS_RE="$(esc "${PG_PASSWORD:-__missing__}")"
redact() {
  sed -E \
    -e "s/${PASS_RE}/<redacted-password>/g" \
    -e "s/${HOST_RE}/<redacted-host>/g" \
    -e "s/${PORT_RE}/<redacted-port>/g" \
    -e "s/${USER_RE}/<redacted-user>/g"
}

printf 'phase\tlabel\tcwd\texit_code\tseconds\tlog_file\tlog_lines\n' > "$RESULTS"

run() { # phase label maven-args...
  local phase="$1"; shift
  local label="$1"; shift
  local log="$RAW/${label}.log"
  local start end
  start=$(date +%s)
  ( cd "$SERVER_ROOT" && MAVEN_OPTS="-Xmx2g" mvn "$@" ) 2>&1 | redact > "$log"
  local code=${PIPESTATUS[0]}
  end=$(date +%s)
  printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\n' \
    "$phase" "$label" "$SERVER_ROOT" "$code" "$((end - start))" "raw/${label}.log" "$(wc -l < "$log" | tr -d ' ')" >> "$RESULTS"
  echo "[evidence] $phase/$label exit=$code log=raw/${label}.log"
}

# ---------- G3a/G3b 直接证据（真实 PostgreSQL + 真实 Flowable） ----------
run G3a commit-boundary-behaviour  -B -o -pl sw-bootstrap test -Dtest=Phase4PgCommitBoundaryBehaviourTest -DfailIfNoTests=false -Dsurefire.failIfNoSpecifiedTests=false
run G3b start-window-crash         -B -o -pl sw-bootstrap test -Dtest=Phase4PgStartWindowCrashTest -DfailIfNoTests=false -Dsurefire.failIfNoSpecifiedTests=false

# ---------- 受影响断言重验（引擎/事务边界与流程启动路径变更 → 上一轮相关快照失效） ----------
run reflow flowable-tx-fact        -B -o -pl sw-bootstrap test -Dtest=Phase4PgTransactionFactTest -DfailIfNoTests=false -Dsurefire.failIfNoSpecifiedTests=false
run reflow flow-seam-behaviour     -B -o -pl sw-bootstrap test -Dtest=Phase4PgFlowSeamBehaviourTest -DfailIfNoTests=false -Dsurefire.failIfNoSpecifiedTests=false
run reflow restart-recovery        -B -o -pl sw-bootstrap test -Dtest=Phase4PgRestartRecoveryTest -DfailIfNoTests=false -Dsurefire.failIfNoSpecifiedTests=false
run reflow lifecycle-behaviour     -B -o -pl sw-bootstrap test -Dtest=Phase4PgLifecycleBehaviourTest -DfailIfNoTests=false -Dsurefire.failIfNoSpecifiedTests=false
run reflow delivery-seam-behaviour -B -o -pl sw-bootstrap test -Dtest=Phase4PgDeliverySeamBehaviourTest -DfailIfNoTests=false -Dsurefire.failIfNoSpecifiedTests=false

# ---------- 机械守门（含发布矩阵零旁路复算；G4/G5 结论不变，不重做迁移与矩阵结论） ----------
run G4 rules-gate                  -B -o -pl sw-bootstrap test -Dtest=ReliableEventGateTest -DfailIfNoTests=false -Dsurefire.failIfNoSpecifiedTests=false

# ---------- 受影响模块 ----------
for module in sw-framework/sw-common \
              sw-biz/sw-bpm/sw-bpm-engine \
              sw-basic/sw-basic-job/sw-basic-job-biz \
              sw-basic/sw-basic-notify/sw-basic-notify-biz \
              sw-basic/sw-basic-iot \
              sw-biz/sw-bpm/sw-bpm-process \
              sw-biz/sw-biz-form/sw-biz-form-biz \
              sw-biz/sw-biz-openapi/sw-biz-openapi-biz; do
  name=$(basename "$module")
  run modules "module-${name}" -B -o -pl "$module" test
done

# ---------- 全量门禁 ----------
run full full-server-gate -B -o test

echo "[evidence] command-results.tsv 已写入"
