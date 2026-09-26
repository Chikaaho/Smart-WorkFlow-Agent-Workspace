#!/usr/bin/env bash
# Phase 5 证据采集（可复跑）：依赖树、源码扫描、门禁/行为测试、全量门禁。
#
# 用法：
#   bash run-phase5-evidence.sh <evidence-dir> <server-repo-dir>
# 约定：本脚本只引用 PG_* 变量名；所有输出落盘前不含任何连接值。
set -uo pipefail

EVIDENCE_DIR="${1:?usage: run-phase5-evidence.sh <evidence-dir> <server-repo-dir>}"
SERVER_DIR="${2:?usage: run-phase5-evidence.sh <evidence-dir> <server-repo-dir>}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

mkdir -p "${EVIDENCE_DIR}/raw"
cd "${SERVER_DIR}"

# shellcheck source=p5-runtime-env.sh
source "${SCRIPT_DIR}/p5-runtime-env.sh"
load_pg_env

RESULTS="${EVIDENCE_DIR}/command-results.tsv"
printf '#\tcwd\tcommand\texit\tnote\n' > "${RESULTS}"
idx=0

record() {
  local note="$1"; shift
  idx=$((idx + 1))
  local log="${EVIDENCE_DIR}/raw/${idx}-$(echo "$note" | tr ' ' '-').log"
  local cmd="$*"
  MAVEN_OPTS="-Xmx2g" "$@" > "$log" 2>&1
  local code=$?
  printf '%s\t%s\t%s\t%s\t%s\n' "$idx" "server" "$cmd" "$code" "$note" >> "${RESULTS}"
  echo "[p5-evidence] #${idx} exit=${code} ${note}"
  return 0
}

# 1) 依赖树：bpm-process 必须零 MQTT/GraalJS/Tencent，fastjson2 为直接依赖
record "dependency-tree-sw-bpm-process" mvn -B -o dependency:tree -pl sw-biz/sw-bpm/sw-bpm-process

# 2) 依赖树：契约模块与实现模块
record "dependency-tree-sw-basic-iot-api" mvn -B -o dependency:tree -pl sw-basic/sw-basic-iot-api
record "dependency-tree-sw-basic-iot" mvn -B -o dependency:tree -pl sw-basic/sw-basic-iot

# 3) Phase 5 门禁与行为测试（真实 PostgreSQL）
require_pg_env || exit 3
record "phase5-gate-and-optional-semantics" mvn -B -o test \
  -Dtest='Phase5IotApiBoundaryGateTest,Phase5IotApiOptionalSemanticsTest,Phase5PgDeviceCommandBoundaryBehaviourTest' \
  -DfailIfNoTests=false -Dsurefire.failIfNoSpecifiedTests=false

# 4) 既有守门（Phase 1 Optional 契约 + Phase 4 可靠性 14 项检查）
record "phase1-and-phase4-gates" mvn -B -o test \
  -Dtest='ApiOptionalContractGateTest,ReliableEventGateTest,IotContractBoundaryIsolationTest' \
  -DfailIfNoTests=false -Dsurefire.failIfNoSpecifiedTests=false

# 5) 全量门禁（Phase 4 基线 1536/0/0/0 为最低线）
record "full-server-gate" mvn -B -o test

echo "[p5-evidence] done; results=${RESULTS}"
