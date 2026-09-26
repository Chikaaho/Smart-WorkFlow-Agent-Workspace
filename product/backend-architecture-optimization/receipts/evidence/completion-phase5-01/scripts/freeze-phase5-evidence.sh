#!/usr/bin/env bash
# Phase 5 证据冻结与回读（可复跑）：为行为输入与证据产物生成 SHA-256 清单并回读校验。
#
# 用法：
#   bash freeze-phase5-evidence.sh <evidence-dir> <server-repo-dir>
# 行为输入 = 本阶段实际修改/新增的生产与测试文件（不包含证据目录自身）。
set -uo pipefail

EVIDENCE_DIR="${1:?usage: freeze-phase5-evidence.sh <evidence-dir> <server-repo-dir>}"
SERVER_DIR="${2:?usage: freeze-phase5-evidence.sh <evidence-dir> <server-repo-dir>}"
WORKSPACE_DIR="$(cd "${SERVER_DIR}/.." && pwd)"

cd "${SERVER_DIR}"

BEHAVIOR_INPUTS_FILE="${EVIDENCE_DIR}/behavior-inputs.txt"
BEHAVIOR_SHA_FILE="${EVIDENCE_DIR}/behavior-input.sha256"
EVIDENCE_SHA_FILE="${EVIDENCE_DIR}/evidence.sha256"
SECRETS_SCAN_FILE="${EVIDENCE_DIR}/secrets-scan.txt"

# 0) 冻结顺序守卫（Phase 5 补正 02）：秘密扫描必须先于哈希生成并保持稳定。
#    曾因此产生证据漂移——清单先算、扫描后写，导致 evidence.sha256 与磁盘上的
#    secrets-scan.txt 不一致（现场回读 FAILED）。本守卫在哈希之前强制校验：
#    秘密扫描文件必须存在、必须以 CLEAN 收尾，否则拒绝冻结而不是生成一份
#    立即失配的清单。本脚本不重写秘密扫描文件，保证其内容冻结后不变。
if [[ ! -s "${SECRETS_SCAN_FILE}" ]]; then
  echo "[p5-freeze] 秘密扫描缺失：${SECRETS_SCAN_FILE} 不存在；请先生成并确认 CLEAN，再执行冻结" >&2
  exit 4
fi
if ! tail -n 5 "${SECRETS_SCAN_FILE}" | grep -q '^CLEAN$'; then
  echo "[p5-freeze] 秘密扫描结论不是 CLEAN（末 5 行未见独立 CLEAN 行）；拒绝冻结" >&2
  exit 4
fi
echo "[p5-freeze] order-guard secrets-scan=CLEAN (stable, hashed as-is)"

# 1) 行为输入清单：Phase 5 的模块/契约/消费者/守门/测试变更
cat > "${BEHAVIOR_INPUTS_FILE}" <<'EOF'
sw-basic/pom.xml
sw-basic/sw-basic-iot-api/pom.xml
sw-basic/sw-basic-iot-api/src/main/java/com/sw/ck/iot/api/IotDeviceFacade.java
sw-basic/sw-basic-iot-api/src/main/java/com/sw/ck/iot/api/IotDeviceQueryFacade.java
sw-basic/sw-basic-iot-api/src/main/java/com/sw/ck/iot/api/IotFormContractChecker.java
sw-basic/sw-basic-iot-api/src/main/java/com/sw/ck/iot/api/IotProcessTriggerFacade.java
sw-basic/sw-basic-iot-api/src/main/java/com/sw/ck/iot/event/IotProcessTriggerEvent.java
sw-basic/sw-basic-iot/pom.xml
sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/api/impl/IotDeviceFacadeImpl.java
sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/api/impl/IotDeviceQueryFacadeImpl.java
sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/api/impl/IotProcessTriggerFacadeImpl.java
sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/controller/IotEventRuleController.java
sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/controller/IotRuntimeController.java
sw-biz/sw-bpm/sw-bpm-process/pom.xml
sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/listener/BpmDeviceCommandIntentRecorder.java
sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/listener/BpmDeviceCommandListener.java
sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/listener/IotProcessTriggerListener.java
sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/IotFormContractCheckerImpl.java
sw-biz/sw-bpm/sw-bpm-process/src/test/java/com/sw/ck/bpm/process/listener/BpmDeviceCommandListenerTest.java
sw-biz/sw-bpm/sw-bpm-process/src/test/java/com/sw/ck/bpm/process/listener/IotContractBoundaryIsolationTest.java
sw-biz/sw-bpm/sw-bpm-process/src/test/java/com/sw/ck/bpm/process/listener/IotProcessTriggerListenerPolicyTest.java
sw-biz/sw-bpm/sw-bpm-process/src/test/java/com/sw/ck/bpm/process/service/IotFormContractCheckerTest.java
sw-bootstrap/src/test/java/com/sw/ck/bootstrap/architecture/ApiOptionalContractGate.java
sw-bootstrap/src/test/java/com/sw/ck/bootstrap/phase4/ReliableEventGateTest.java
sw-bootstrap/src/test/java/com/sw/ck/bootstrap/phase5/Phase5PgSupport.java
sw-bootstrap/src/test/java/com/sw/ck/bootstrap/phase5/Phase5IotApiBoundaryGateTest.java
sw-bootstrap/src/test/java/com/sw/ck/bootstrap/phase5/Phase5IotApiOptionalSemanticsTest.java
sw-bootstrap/src/test/java/com/sw/ck/bootstrap/phase5/Phase5PgDeviceCommandBoundaryBehaviourTest.java
sw-bootstrap/src/test/java/com/sw/ck/bootstrap/phase5/Phase5BootstrapAssemblyTest.java
sw-bootstrap/src/test/java/com/sw/ck/bootstrap/phase5/BootstrapTestFixtureExcludeFilter.java
EOF

# 已移出实现模块的 5 个契约源文件必须不存在（无旧包残留证据）
MISSING_CHECK="${EVIDENCE_DIR}/removed-from-impl.check"
: > "${MISSING_CHECK}"
for removed in \
  sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/api/IotDeviceFacade.java \
  sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/api/IotProcessTriggerFacade.java \
  sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/api/IotDeviceQueryFacade.java \
  sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/api/IotFormContractChecker.java \
  sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/event/IotProcessTriggerEvent.java ; do
  if [[ -e "${removed}" ]]; then
    echo "PRESENT ${removed}" >> "${MISSING_CHECK}"
  else
    echo "ABSENT  ${removed}" >> "${MISSING_CHECK}"
  fi
done

# 2) 行为输入哈希
: > "${BEHAVIOR_SHA_FILE}"
while IFS= read -r path; do
  [[ -z "$path" ]] && continue
  if [[ -f "$path" ]]; then
    shasum -a 256 "$path" >> "${BEHAVIOR_SHA_FILE}"
  else
    echo "MISSING $path" >> "${BEHAVIOR_SHA_FILE}"
  fi
done < "${BEHAVIOR_INPUTS_FILE}"

# 3) 证据产物哈希（证据目录自身，排除清单文件）
: > "${EVIDENCE_SHA_FILE}"
find "${EVIDENCE_DIR}" -type f \
  ! -name 'behavior-input.sha256' ! -name 'evidence.sha256' \
  ! -name 'behavior-input.check' ! -name 'evidence.check' \
  | sort | while IFS= read -r f; do
    shasum -a 256 "$f" | sed "s|${WORKSPACE_DIR}/||" >> "${EVIDENCE_SHA_FILE}"
  done

# 4) 回读校验
shasum -a 256 -c "${BEHAVIOR_SHA_FILE}" > "${EVIDENCE_DIR}/behavior-input.check" 2>&1
behavior_code=$?
# 证据清单存的是工作区相对路径，回读必须回到工作区根
cd "${WORKSPACE_DIR}"
shasum -a 256 -c "${EVIDENCE_SHA_FILE}" > "${EVIDENCE_DIR}/evidence.check" 2>&1
evidence_code=$?

behavior_ok=$(grep -c ': OK$' "${EVIDENCE_DIR}/behavior-input.check" || true)
behavior_total=$(wc -l < "${BEHAVIOR_SHA_FILE}" | tr -d ' ')
evidence_ok=$(grep -c ': OK$' "${EVIDENCE_DIR}/evidence.check" || true)
evidence_total=$(wc -l < "${EVIDENCE_SHA_FILE}" | tr -d ' ')

echo "[p5-freeze] behavior-input ${behavior_ok}/${behavior_total} OK (check_exit=${behavior_code})"
echo "[p5-freeze] evidence ${evidence_ok}/${evidence_total} OK (check_exit=${evidence_code})"

if [[ "$behavior_code" -ne 0 || "$evidence_code" -ne 0 ]]; then
  echo "[p5-freeze] 回读失败，证据不完整" >&2
  exit 1
fi
