#!/bin/bash
# I3-03 运行时环境启动：临时 PG 集群(50886) + 双应用实例(A=8081, B=8082) + 种子身份
# 由 Executor 会话执行；本脚本与其输出构成运行环境身份证据。
set -uo pipefail
EV=/usr/local/projects/Smart-WorkFlow/product/v0.1.0-oa-completion/receipts/evidence/i3-03
RT=/tmp/i3-03
PGBIN=/opt/homebrew/opt/postgresql@16/bin
JAR=/usr/local/projects/Smart-WorkFlow/Smart-WorkFlow-Server/sw-bootstrap/target/sw-bootstrap-1.0.0-SNAPSHOT.jar
PGPORT=50886
mkdir -p "$RT"

echo "== [1] 临时 PG 集群 =="
$PGBIN/postgres --version
rm -rf "$RT/pgdata"
$PGBIN/initdb -D "$RT/pgdata" -U postgres --auth=trust > "$RT/initdb.out" 2>&1
echo "INITDB_EXIT=$?"
$PGBIN/pg_ctl -D "$RT/pgdata" -l "$RT/pg.log" -o "-p $PGPORT" start
echo "PGCTL_EXIT=$?"
sleep 2
psql -h localhost -p $PGPORT -U postgres -d postgres -c "CREATE DATABASE smart_workflow;" && echo "CREATE_DB_OK"

echo "$PGPORT" > "$RT/pg-port.txt"
echo "jdbc:postgresql://localhost:$PGPORT/smart_workflow?user=postgres&password=postgres" > "$RT/pg-jdbc-url.txt"
echo "PG_URL=$(cat $RT/pg-jdbc-url.txt)"

echo "== [2] 种子身份（与既有回执口径一致 + 增加无角色 user5） =="
psql -h localhost -p $PGPORT -U postgres -d smart_workflow -v ON_ERROR_STOP=1 <<'SQL'
INSERT INTO sys_user (id, create_time, update_time, deleted, tenant_id, version, username, password, real_name, dept_id, status, is_admin)
VALUES (2001, now(), now(), 0, 0, 0, 'user2', '$2a$10$GQx6ILw5jsPhqHxJ6/AcmOzSM8xRVRwqChiH/B9ylh0srY0/NqXiK', '审批人二号', 1, 0, 0),
       (2002, now(), now(), 0, 0, 0, 'user3', '$2a$10$GQx6ILw5jsPhqHxJ6/AcmOzSM8xRVRwqChiH/B9ylh0srY0/NqXiK', '受托人三号', 1, 0, 0),
       (2003, now(), now(), 0, 0, 0, 'user4', '$2a$10$GQx6ILw5jsPhqHxJ6/AcmOzSM8xRVRwqChiH/B9ylh0srY0/NqXiK', '沟通接收人', 1, 0, 0),
       (2004, now(), now(), 0, 0, 0, 'user5', '$2a$10$GQx6ILw5jsPhqHxJ6/AcmOzSM8xRVRwqChiH/B9ylh0srY0/NqXiK', '无权用户', 1, 0, 0),
       (2901, now(), now(), 0, 1, 0, 'tenant1user', '$2a$10$GQx6ILw5jsPhqHxJ6/AcmOzSM8xRVRwqChiH/B9ylh0srY0/NqXiK', '跨租户用户', 1, 0, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO sys_user_role (id, create_time, update_time, deleted, tenant_id, version, user_id, role_id)
VALUES (2101, now(), now(), 0, 0, 0, 2001, 1),
       (2102, now(), now(), 0, 0, 0, 2002, 1),
       (2103, now(), now(), 0, 0, 0, 2003, 1),
       (2901, now(), now(), 0, 1, 0, 2901, 1)
ON CONFLICT (id) DO NOTHING;
SQL
echo "SEED_EXIT=$? (user5 id=2004 有意不绑角色——无权身份)"
psql -h localhost -p $PGPORT -U postgres -d smart_workflow -tAc "select id||':'||username||':tenant='||tenant_id from sys_user where id in (1,2001,2002,2003,2004,2901) order by id"
psql -h localhost -p $PGPORT -U postgres -d smart_workflow -tAc "select user_id||'->role='||role_id from sys_user_role order by user_id"

echo "== [3] 启动双应用实例 =="
SHA=$(shasum -a 256 "$JAR" | awk '{print $1}')
echo "JAR_SHA256=$SHA"
URL=$(cat "$RT/pg-jdbc-url.txt")
COMMON_ENV=(SW_CIPHER_KEY=MTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTIz
            SW_LOGIN_DIGEST_SECRET=737765637573746f6d7465737464696765737432366162636465666768696a6b6c)
# 共享 RSA：先生成一次，两实例共用
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out "$RT/rsa.pem" 2>/dev/null

start_instance () { # $1=port $2=log $3=pidfile
  nohup java -jar "$JAR" --spring.profiles.active=local --server.port=$1 \
    --spring.datasource.dynamic.datasource.master.url="$URL" \
    --spring.datasource.dynamic.datasource.master.username=postgres \
    --spring.datasource.dynamic.datasource.master.password=postgres \
    --spring.data.redis.host=localhost --spring.data.redis.port=6379 \
    > "$2" 2>&1 &
  echo $! > "$3"
  echo "INSTANCE pid=$(cat $3) port=$1"
}
export SW_LOGIN_RSA_PRIVATE_KEY="$(cat "$RT/rsa.pem")"
start_instance 8081 "$RT/instance-a.log" "$RT/instance-a.pid"
start_instance 8082 "$RT/instance-b.log" "$RT/instance-b.pid"

echo "== [4] 等待两个实例 Started（最长 180s） =="
for i in $(seq 1 36); do
  sleep 5
  A=$(grep -c 'Started StarterApplication' "$RT/instance-a.log" 2>/dev/null || echo 0)
  B=$(grep -c 'Started StarterApplication' "$RT/instance-b.log" 2>/dev/null || echo 0)
  echo "t=$((i*5))s started_a=$A started_b=$B"
  if [ "$A" -ge 1 ] && [ "$B" -ge 1 ]; then break; fi
done

echo "== [5] 健康检查 =="
curl -s -o /dev/null -w "A /auth/challenge HTTP=%{http_code}\n" http://localhost:8081/api/auth/challenge
curl -s -o /dev/null -w "B /auth/challenge HTTP=%{http_code}\n" http://localhost:8082/api/auth/challenge
psql -h localhost -p $PGPORT -U postgres -d smart_workflow -tAc "select version || ' | flyway=' || count(*) from (select (select version()) version, (select count(*) from flyway_schema_history where success=true) count) t" 2>/dev/null || psql -h localhost -p $PGPORT -U postgres -d smart_workflow -tAc "select count(*) from flyway_schema_history where success=true"
echo "== [6] 环境身份 =="
echo "PG: port=$PGPORT datadir=$RT/pgdata pg_version=$($PGBIN/postgres --version 2>/dev/null | awk '{print $3}')"
echo "A: port=8081 pid=$(cat $RT/instance-a.pid)"; echo "B: port=8082 pid=$(cat $RT/instance-b.pid)"
echo "JAR_SHA256=$SHA"
echo "ENV: SW_CIPHER_KEY/SW_LOGIN_RSA_PRIVATE_KEY/SW_LOGIN_DIGEST_SECRET 两实例共享（值见脚本，测试专用非生产密钥）"
echo "REDIS: localhost:6379 (系统 redis，双实例共用)"
date "+RUNTIME_UP_AT=%Y-%m-%dT%H:%M:%S"
