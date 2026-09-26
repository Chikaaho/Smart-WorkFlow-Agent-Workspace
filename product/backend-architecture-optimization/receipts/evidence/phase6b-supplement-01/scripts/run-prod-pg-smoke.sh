#!/usr/bin/env bash
# Phase 6B 补证 · 正式 Boot Jar 三向生产启动证据（真实 PostgreSQL、隔离端口、隔离临时库）。
#
# 前提：使用仓内唯一生产入口 scripts/build-prod.sh 产出的正式制品
#       sw-bootstrap/target/bootstrap.jar（含 build.profile=prod 身份标记）。
#
# 三次运行（串行，互不并行）：
#   (A) 出厂 prod 配置原样（IoT 启用、未预设 provider）→ 期望启动成功、health 200；
#   (B) --sw.iot.enabled=false（G2 完成条件要求的 IoT 关闭路径）→ 期望启动成功、health 200；
#   (C) --sw.iot.tencent.provider-mode=tencent 但缺凭证 → 期望启动期 fail closed（非零退出）。
#
# 安全边界：
#   - 连接值只来自既有 PG_* 环境变量；本脚本只把这些变量的值传给子进程与环境，
#     绝不打印、绝不落盘、绝不写进证据；证据只记录变量名、临时库名、产品/驱动、
#     Flyway 终点、health 与退出/清理结果。
#   - 运行时安全值（RSA/digest/JWT/cipher）现场生成并只经环境变量注入，不落盘、不进日志。
#   - 临时库在本脚本内创建、用后删除并回读；不触碰服务器上既有库与当前常驻服务。
#
# 用法：bash run-prod-pg-smoke.sh <evidence-dir> <port-A> <port-B> <port-C>
set -Eeuo pipefail

REPO=/usr/local/projects/Smart-WorkFlow/Smart-WorkFlow-aPaaS-server
EV_DIR="${1:?usage: run-prod-pg-smoke.sh <evidence-dir> <portA> <portB> <portC>}"
PORT_A="${2:?}"; PORT_B="${3:?}"; PORT_C="${4:?}"
JAR="${REPO}/sw-bootstrap/target/bootstrap.jar"
TMP_DB="sw_6b_supp_$(date +%Y%m%d%H%M%S)_$$"
RAW_DIR="/tmp/6b-supp"
mkdir -p "${RAW_DIR}"

required_vars=(PG_HOST PG_PORT PG_USERNAME PG_PASSWORD)
for v in "${required_vars[@]}"; do
    [[ -n "${!v:-}" ]] || { echo "缺少环境变量 ${v}（只引用变量名，不输出值）"; exit 1; }
done
[[ -f "${JAR}" ]] || { echo "缺少正式制品：${JAR}"; exit 1; }

psql_admin() { PGPASSWORD="${PG_PASSWORD}" psql -h "${PG_HOST}" -p "${PG_PORT}" -U "${PG_USERNAME}" -d postgres -tAc "$1"; }
psql_tmp()   { PGPASSWORD="${PG_PASSWORD}" psql -h "${PG_HOST}" -p "${PG_PORT}" -U "${PG_USERNAME}" -d "${TMP_DB}" -tAc "$1"; }

# 现场生成的运行时安全值（仅子进程环境，未落盘）
export SW_LOGIN_RSA_PRIVATE_KEY="$(openssl genrsa 2048 2>/dev/null \
    | openssl pkcs8 -topk8 -nocrypt -outform DER 2>/dev/null | base64 | tr -d '\n')"
export SW_LOGIN_DIGEST_SECRET="$(openssl rand -base64 36 | tr -d '\n')"
export JWT_SECRET="$(openssl rand -base64 48 | tr -d '\n')"
export SW_CIPHER_KEY="$(openssl rand -base64 32 | tr -d '\n')"
# 数据源指向本阶段唯一临时库（经既有 PG_* 变量拼装，值不打印）。
# tcpKeepAlive=true：实测远端 PostgreSQL 在空库全链迁移期间会中途复位连接（EOF），
# 打开 TCP keepalive 以避免中间网络设备回收看似空闲的连接；不影响任何断言语义。
export PG_URL="jdbc:postgresql://${PG_HOST}:${PG_PORT}/${TMP_DB}?stringtype=unspecified&tcpKeepAlive=true"

CREATED=0
psql_admin "CREATE DATABASE \"${TMP_DB}\"" >/dev/null && CREATED=1

run_boot() { # $1=label $2=attempt $3=probe_max_sec $4=port $5..=extra args ; 回显 "<http> <state> <exit> <secs> <log>"
    local label="$1" attempt="$2" probe_max="$3" port="$4"; shift 4
    local log="${RAW_DIR}/${label}-attempt${attempt}.log"
    local extra=("$@")
    local t0 t1
    t0=$(date +%s)
    # 注意：bash 3.2（macOS 自带）在 set -u 下展开空数组会报 unbound variable，
    # 因此用 ${arr[@]+"${arr[@]}"} 惯用法兼容空参数场景。
    java -Xmx2g -jar "${JAR}" --spring.profiles.active=prod --server.port="${port}" \
        ${extra[@]+"${extra[@]}"} >"${log}" 2>&1 &
    local pid=$!
    local code
    code=$(curl -s -o /dev/null -w '%{http_code}' \
        --retry 1800 --retry-connrefused --retry-delay 1 --retry-max-time "${probe_max}" --max-time 5 \
        "http://127.0.0.1:${port}/api/actuator/health" 2>/dev/null || true)
    t1=$(date +%s)
    if [[ ! -f "${log}" ]]; then
        echo "${code} no-log 1 $((t1-t0)) ${log}"
        return 0
    fi
    if [[ "${code}" == "200" ]] && kill -0 "${pid}" 2>/dev/null; then
        # 启动成功：由本脚本显式终止（信号退出码不构成启动失败）
        kill "${pid}"; wait "${pid}" 2>/dev/null || true
        echo "${code} running->terminated 0 $((t1-t0)) ${log}"
        return 0
    fi
    if kill -0 "${pid}" 2>/dev/null; then
        # 未就绪/预算耗尽：先记录真实等待事件（只读诊断），再硬终止失败实例
        # （失败实例无需优雅关闭证据；SIGTERM 后 JVM 可能滞留数十分钟，故用 -9）
        {
            echo "--- [diagnostic] ${label} attempt=${attempt} 探针预算 ${probe_max}s 用尽时 pg_stat_activity（仅本临时库；只读；不含连接值）---"
            psql_tmp "SELECT coalesce(wait_event_type,'-')||'/'||coalesce(wait_event,'-')||' state='||coalesce(state,'-')||' n='||count(*) FROM pg_stat_activity WHERE datname=current_database() GROUP BY 1,2,3" || true
            echo "--- [diagnostic] 本临时库锁等待计数（只读）---"
            psql_tmp "SELECT locktype||' '||mode||' granted='||granted||' n='||count(*) FROM pg_locks l JOIN pg_stat_activity a USING (pid) WHERE a.datname=current_database() GROUP BY 1,2,3" || true
            echo "--- [diagnostic] 该 attempt 日志最后 5 行（避免连接值）---"
            tail -5 "${log}" | cut -c1-160 || true
        } >> "${EV_DIR}/6b-supp-prod-stall-diagnostics.txt"
        kill -9 "${pid}" 2>/dev/null || true; wait "${pid}" 2>/dev/null || true
        echo "${code} killed-after-failed-probe 9 $((t1-t0)) ${log}"
    else
        local exit_code=0
        wait "${pid}" 2>/dev/null || exit_code=$?
        echo "${code} exited ${exit_code} $((t1-t0)) ${log}"
    fi
}

run_scenario() { # $1=label $2=首探针预算 $3=重试探针预算 $4=port $5=expect(200|fail) $6..=extra
    # 回显 "<http> <state> <exit> <secs> <log> <attempts>"
    local label="$1" pmax="$2" pmax_retry="$3" port="$4" expect="$5"; shift 5
    local extra=("$@")
    local attempt=1 max=3
    local out health state ecode secs log
    while :; do
        out=$(run_boot "${label}" "${attempt}" "${pmax}" "${port}" ${extra[@]+"${extra[@]}"})
        read -r health state ecode secs log <<< "${out}"
        printf '%s\tattempt=%s\thealth=%s\tstate=%s\texit=%s\tsecs=%s\n' \
            "${label}" "${attempt}" "${health}" "${state}" "${ecode}" "${secs}" \
            >> "${RAW_DIR}/attempts.tsv"
        if [[ "${expect}" == "200" && "${health}" == "200" && "${state}" == "running->terminated" ]]; then break; fi
        if [[ "${expect}" == "fail" && "${state}" == "exited" && "${ecode}" != "0" ]]; then break; fi
        attempt=$((attempt + 1))
        if [[ ${attempt} -gt ${max} ]]; then break; fi
        pmax="${pmax_retry}"
    done
    echo "${health} ${state} ${ecode} ${secs} ${log} ${attempt}"
}

# 运行顺序刻意固定为 (B) → (A) → (C)：由 IoT 关闭的运行在空库上完成全链迁移后，
# 后续两次启动直接复用已迁移库。远端 PostgreSQL 在空库全链迁移期间会随机中途复位连接
# （EOF，服务端行为，与本仓库代码无关），因此同一临时库上允许就地重试：Flyway 迁移
# 按版本提交、可断点续跑，每次重试都单调推进直至完成。每次失败先记录真实等待事件再终止，
# 并在结果中如实记录尝试次数。
read -r HEALTH_B STATE_B EXIT_B SECS_B LOG_B ATT_B < <(run_scenario iot-disabled 600 300 "${PORT_B}" 200 --sw.iot.enabled=false)
read -r HEALTH_A STATE_A EXIT_A SECS_A LOG_A ATT_A < <(run_scenario prod-default 300 300 "${PORT_A}" 200)
read -r HEALTH_C STATE_C EXIT_C SECS_C LOG_C ATT_C < <(run_scenario tencent-nocreds 300 120 "${PORT_C}" fail --sw.iot.tencent.provider-mode=tencent)

# 数据源产品/驱动、Flyway 终点（只读查询，无连接值）
PG_VERSION="$(psql_tmp 'SHOW server_version' | tr -d ' ')"
PG_DB="$(psql_tmp 'SELECT current_database()' | tr -d ' ')"
FLYWAY_MAX="$(psql_tmp 'SELECT max(version) FROM flyway_schema_history WHERE success' | tr -d ' ')"
FLYWAY_CNT="$(psql_tmp 'SELECT count(*) FROM flyway_schema_history WHERE success' | tr -d ' ')"
TABLES="$(psql_tmp "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'" | tr -d ' ')"

# 关键日志行（只取白名单行，避免把连接值带进证据）
grep -h -E 'Started StarterApplication|The following 1 profile is active|Tomcat started on port|Successfully applied .* migration|Current version of schema|使用腾讯云 IoT Explorer Provider' \
    "${LOG_A}" "${LOG_B}" "${LOG_C}" > "${EV_DIR}/6b-supp-prod-log-keylines.txt" || true

# 运行时秘密回扫（命中数，应全为 0）
LEAK=0
for v in "${SW_LOGIN_RSA_PRIVATE_KEY}" "${SW_LOGIN_DIGEST_SECRET}" "${JWT_SECRET}" "${SW_CIPHER_KEY}" "${PG_PASSWORD}"; do
    for f in "${LOG_A}" "${LOG_B}" "${LOG_C}"; do
        n=$( { grep -F -c "${v}" "${f}" || true; } 2>/dev/null | tr -dc '0-9' )
        LEAK=$((LEAK + ${n:-0}))
    done
done

# 清理：删除本阶段唯一临时库并回读
DROP_OK="n/a"
psql_admin "DROP DATABASE \"${TMP_DB}\"" >/dev/null 2>&1 || true
REMAIN="$(psql_admin "SELECT count(*) FROM pg_database WHERE datname='${TMP_DB}'" | tr -d ' ')"
[[ "${REMAIN}" == "0" ]] && DROP_OK="ok(dropped,readback=0)"

{
    echo "# Phase 6B 补证 · 正式 Boot Jar 生产启动（真实 PostgreSQL、隔离端口）"
    echo "制品: ${JAR}"
    echo "  bytes : $(wc -c <"${JAR}" | tr -d ' ')"
    echo "  sha256: $(shasum -a 256 "${JAR}" | awk '{print $1}')"
    echo "连接输入: 仅环境变量名 PG_HOST / PG_PORT / PG_USERNAME / PG_PASSWORD（值不在命令、日志与证据中出现）"
    echo "隔离对象: 临时数据库（唯一名，非秘密标识）=${TMP_DB}"
    echo "运行时安全值: 现场生成、仅环境变量注入（RSA PKCS#8 DER base64 / digest / JWT / cipher）"
    echo
    echo "== 三次运行（同一正式制品、同一临时库、隔离端口；顺序 B→A→C，远端 PG 迁移中断时就地重试）=="
    echo "(A) prod 出厂配置原样（IoT 启用、未预设 provider）  端口=${PORT_A}  health_http=${HEALTH_A}  状态=${STATE_A}  exit=${EXIT_A}  耗时=${SECS_A}s  尝试=${ATT_A}"
    echo "(B) --sw.iot.enabled=false（IoT 关闭）            端口=${PORT_B}  health_http=${HEALTH_B}  状态=${STATE_B}  exit=${EXIT_B}  耗时=${SECS_B}s  尝试=${ATT_B}"
    echo "(C) --sw.iot.tencent.provider-mode=tencent 缺凭证  端口=${PORT_C}  health_http=${HEALTH_C}  状态=${STATE_C}  exit=${EXIT_C}  耗时=${SECS_C}s  尝试=${ATT_C}"
    echo
    echo "== 数据源与迁移（只读查询）=="
    echo "PostgreSQL server_version = ${PG_VERSION}"
    echo "驱动（prod 配置固定）      = org.postgresql.Driver"
    echo "当前库（隔离对象）         = ${PG_DB}"
    echo "Flyway 成功迁移条数        = ${FLYWAY_CNT}   终点版本 = ${FLYWAY_MAX}"
    echo "public schema 表数         = ${TABLES}"
    echo
    echo "== 关键日志行（白名单提取，完整原始日志仅在 /tmp/6b-supp 现场保留）=="
    cat "${EV_DIR}/6b-supp-prod-log-keylines.txt"
    echo
    echo "== (C) 失败原因（缺凭证 fail closed，提取首因行）=="
    grep -h -o 'sw.iot.tencent.provider-mode=tencent 但未配置 SecretId/SecretKey[^"]*' "${LOG_C}" | head -1 || echo "  （未在日志中匹配到首因文案）"
    echo
    echo "秘密回扫（三份原始日志中命中数，应全为 0）: ${LEAK}"
    echo "清理: ${DROP_OK}"
    echo
    if [[ "${HEALTH_A}" == "200" && "${STATE_A}" == "running->terminated" \
          && "${HEALTH_B}" == "200" && "${STATE_B}" == "running->terminated" \
          && "${STATE_C}" == "exited" && "${EXIT_C}" -ne 0 \
          && "${LEAK}" -eq 0 && "${DROP_OK}" != "n/a" ]]; then
        echo "RESULT=PASS"
    else
        echo "RESULT=FAIL"
    fi
} > "${EV_DIR}/6b-supp-pg-smoke-result.txt"
cat "${EV_DIR}/6b-supp-pg-smoke-result.txt"
