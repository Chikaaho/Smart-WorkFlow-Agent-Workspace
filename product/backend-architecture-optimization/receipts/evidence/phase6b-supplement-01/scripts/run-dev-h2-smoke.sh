#!/usr/bin/env bash
# Phase 6B 补证 · dev/local（H2）隔离启动烟测，复跑以证明 dev 入口未被 IoT 装配修正破坏。
#
# 语义：
#   - 制品：sw-bootstrap/target/bootstrap-dev.jar（`-Pdev` 构建，含 H2 runtime、dev 资源与
#     iot 模块 dev 源根里的模拟 provider）；
#   - 现场生成的运行时安全值只经环境变量注入子进程：不落盘、不进日志、不进证据；
#   - 健康探针使用 curl 有界重试（不使用 sleep 轮询）；
#   - 结果只输出 RESULT / health 状态码 / 关键日志行 / 秘密回扫命中数。
#
# 用法：bash run-dev-h2-smoke.sh <evidence-dir>
set -Eeuo pipefail

REPO=/usr/local/projects/Smart-WorkFlow/Smart-WorkFlow-aPaaS-server
EV_DIR="${1:?usage: run-dev-h2-smoke.sh <evidence-dir>}"
JAR="${REPO}/sw-bootstrap/target/bootstrap-dev.jar"
PORT=18081
LOG="${EV_DIR}/6b-supp-dev-smoke.log"

[[ -f "${JAR}" ]] || { echo "缺少 dev 制品：${JAR}"; exit 1; }

# 现场生成的运行时安全值（dev 用途；仅内存与子进程环境，未落盘）
export SW_LOGIN_RSA_PRIVATE_KEY="$(openssl genrsa 2048 2>/dev/null \
    | openssl pkcs8 -topk8 -nocrypt -outform DER 2>/dev/null | base64 | tr -d '\n')"
export SW_LOGIN_DIGEST_SECRET="$(openssl rand -base64 36 | tr -d '\n')"
export JWT_SECRET="$(openssl rand -base64 48 | tr -d '\n')"
# 仓库既有 dev 占位值（非秘密，见 src/dev/resources/application-dev.yml）
export SW_CIPHER_KEY="c21hcnQtd29ya2Zsb3ctZGV2LWNpcGhlci1rZXkhIQ=="

java -Xmx2g -jar "${JAR}" --spring.profiles.active=dev --server.port="${PORT}" \
    >"${LOG}" 2>&1 &
APP_PID=$!

HEALTH_CODE=$(curl -s -o /dev/null -w '%{http_code}' \
    --retry 90 --retry-connrefused --retry-delay 1 --max-time 5 \
    "http://127.0.0.1:${PORT}/api/actuator/health" || true)

if kill -0 "${APP_PID}" 2>/dev/null; then
    kill "${APP_PID}"
    wait "${APP_PID}" 2>/dev/null || true
    SHUTDOWN="terminated"
else
    wait "${APP_PID}" 2>/dev/null
    SHUTDOWN="exited-before-stop(exit=$?)"
fi

STARTED=$(grep -c 'Started StarterApplication' "${LOG}" || true)
MOCK_LINE=$(grep -c '使用 dev 模拟 IoT Provider' "${LOG}" || true)
H2_LINE=$(grep -c 'H2' "${LOG}" || true)

# 秘密回扫：日志中不得出现现场生成/注入的运行时值
LEAK_RSA=$(grep -F -c "${SW_LOGIN_RSA_PRIVATE_KEY}" "${LOG}" || true)
LEAK_DIGEST=$(grep -F -c "${SW_LOGIN_DIGEST_SECRET}" "${LOG}" || true)
LEAK_JWT=$(grep -F -c "${JWT_SECRET}" "${LOG}" || true)

{
    echo "# Phase 6B 补证 · dev(H2) 隔离启动烟测"
    echo "命令形态: java -Xmx2g -jar sw-bootstrap/target/bootstrap-dev.jar --spring.profiles.active=dev --server.port=${PORT}"
    echo "制品: ${JAR}"
    echo "  bytes : $(wc -c <"${JAR}" | tr -d ' ')"
    echo "  sha256: $(shasum -a 256 "${JAR}" | awk '{print $1}')"
    echo "运行时安全值注入: 仅环境变量（SW_LOGIN_RSA_PRIVATE_KEY 现场生成 PKCS#8 DER base64、"
    echo "  SW_LOGIN_DIGEST_SECRET / JWT_SECRET 现场生成、SW_CIPHER_KEY 仓库既有 dev 占位值）"
    echo "health_http=${HEALTH_CODE}  Started 行数=${STARTED}  dev 模拟 provider 装配行数=${MOCK_LINE}"
    echo "关闭结果: ${SHUTDOWN}"
    echo "秘密回扫（日志中命中数，应全为 0）: RSA=${LEAK_RSA} DIGEST=${LEAK_DIGEST} JWT=${LEAK_JWT}"
    echo "日志: $(basename "${LOG}")  bytes=$(wc -c <"${LOG}" | tr -d ' ') sha256=$(shasum -a 256 "${LOG}" | awk '{print $1}')"
    if [[ "${HEALTH_CODE}" == "200" && "${STARTED}" -ge 1 && "${MOCK_LINE}" -ge 1 \
          && "${LEAK_RSA}" -eq 0 && "${LEAK_DIGEST}" -eq 0 && "${LEAK_JWT}" -eq 0 ]]; then
        echo "RESULT=PASS"
    else
        echo "RESULT=FAIL"
    fi
} | tee "${EV_DIR}/6b-supp-dev-smoke-result.txt"
