#!/bin/bash
# I3-03 双应用实例重启（v2：32 字节密钥 + Flyway 建表后种子）
set -uo pipefail
RT=/tmp/i3-03
JAR=/usr/local/projects/Smart-WorkFlow/Smart-WorkFlow-Server/sw-bootstrap/target/sw-bootstrap-1.0.0-SNAPSHOT.jar
URL=$(cat "$RT/pg-jdbc-url.txt")
PGPORT=$(cat "$RT/pg-port.txt")
# base64("12345678901234567890123456789012") = 恰好 32 字节
export SW_CIPHER_KEY="MTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTI="
export SW_LOGIN_DIGEST_SECRET="[REDACTED_PASSWORD]"
export SW_LOGIN_RSA_PRIVATE_KEY="$(cat "$RT/rsa.pem")"

start_instance () {
  nohup java -jar "$JAR" --spring.profiles.active=local --server.port=$1 \
    --spring.datasource.dynamic.datasource.master.url="$URL" \
    --spring.datasource.dynamic.datasource.master.username=postgres \
    --spring.datasource.dynamic.datasource.master.password=postgres \
    --spring.data.redis.host=localhost --spring.data.redis.port=16390 \
    > "$2" 2>&1 &
  echo $! > "$3"
  echo "INSTANCE pid=$(cat $3) port=$1"
}
# 专用 Redis（系统 6379 已消失；使用 16390 隔离，禁持久化避免 dump 残留）
redis-cli -p 16390 ping 2>/dev/null | grep -q PONG || {
  redis-server --port 16390 --daemonize yes --dir "$RT" --dbfilename "redis-16390.rdb" --save "" --appendonly no
  sleep 1
}
echo "REDIS_16390=$(redis-cli -p 16390 ping 2>&1)"
# 顺序启动（Flowable schema 首建并发竞态防护）：A 先起并等健康，再起 B
start_instance 8081 "$RT/instance-a.log" "$RT/instance-a.pid"
for i in $(seq 1 24); do
  sleep 5
  C=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:8081/api/auth/challenge 2>/dev/null)
  echo "wait_a t=$((i*5))s challenge=$C"
  [ "$C" = "200" ] && break
done
start_instance 8082 "$RT/instance-b.log" "$RT/instance-b.pid"
for i in $(seq 1 24); do
  sleep 5
  CB=$(curl -s -o /dev/null -w '%{http_code}' http://localhost:8082/api/auth/challenge 2>/dev/null)
  echo "wait_b t=$((i*5))s challenge=$CB"
  [ "$CB" = "200" ] && break
done

echo "== Flyway 建表完成后补种身份（G15 差异化角色链：非全员超管） =="
psql -h localhost -p $PGPORT -U postgres -d smart_workflow -v ON_ERROR_STOP=1 <<'SQL'
-- 角色 2：业务办理员（workflow 按钮/菜单，与 V73 授权口径一致；V73 为条件插入，角色缺失时需此补建）
INSERT INTO sys_role (id, create_time, update_time, deleted, tenant_id, version, name, code, sort, status, data_scope, built_in, remark)
VALUES (2, now(), now(), 0, 0, 0, '业务办理员', 'business_operator', 10, 0, 3, false, 'I3 证据用普通业务角色（仅本人数据范围）')
ON CONFLICT (id) DO NOTHING;
-- 表单提交权限（发起人/办理人需可填报）：form:data:submit/query/edit + form:view/design 三件套
INSERT INTO sys_role_menu (id, create_time, update_time, deleted, version, tenant_id, role_id, menu_id)
SELECT 3700 + m.id, now(), now(), 0, 0, 0, 2, m.id
FROM sys_menu m
WHERE m.deleted = 0
  AND m.permission IN ('form:data:submit', 'form:data:query', 'form:data:edit',
                       'form:view', 'form:design', 'form:design:save', 'form:design:publish')
  AND NOT EXISTS (SELECT 1 FROM sys_role_menu x WHERE x.role_id = 2 AND x.menu_id = m.id AND x.deleted = 0)
  ON CONFLICT (id) DO NOTHING;
-- V73 同口径授权：11 个 workflow 按钮码 + 全部 workflow 菜单
INSERT INTO sys_role_menu (id, create_time, update_time, deleted, version, tenant_id, role_id, menu_id)
SELECT 3600 + m.id, now(), now(), 0, 0, 0, 2, m.id
FROM sys_menu m
WHERE m.deleted = 0
  AND (m.permission IN ('workflow:def:design', 'workflow:def:validate', 'workflow:def:suspend',
                        'workflow:task:transfer', 'workflow:task:delegate', 'workflow:task:authorize',
                        'workflow:task:add-sign', 'workflow:task:withdraw', 'workflow:task:communicate',
                        'workflow:task:discard', 'workflow:task:manage')
       OR m.path LIKE '%workflow%')
  AND NOT EXISTS (SELECT 1 FROM sys_role_menu rm WHERE rm.role_id = 2 AND rm.menu_id = m.id AND rm.deleted = 0);
-- 角色 3：无业务权限（仅登录，用于无权反向）
INSERT INTO sys_role (id, create_time, update_time, deleted, tenant_id, version, name, code, sort, status, data_scope, built_in, remark)
VALUES (3, now(), now(), 0, 0, 0, '访客', 'guest', 99, 0, 3, false, 'I3 证据用无业务权限角色')
ON CONFLICT (id) DO NOTHING;

INSERT INTO sys_user (id, create_time, update_time, deleted, tenant_id, version, username, password, real_name, dept_id, status, is_admin)
VALUES (2001, now(), now(), 0, 0, 0, 'user2', '$2a$10$GQx6ILw5jsPhqHxJ6/AcmOzSM8xRVRwqChiH/B9ylh0srY0/NqXiK', '审批人二号', 1, 0, 0),
       (2002, now(), now(), 0, 0, 0, 'user3', '$2a$10$GQx6ILw5jsPhqHxJ6/AcmOzSM8xRVRwqChiH/B9ylh0srY0/NqXiK', '受托人三号', 1, 0, 0),
       (2003, now(), now(), 0, 0, 0, 'user4', '$2a$10$GQx6ILw5jsPhqHxJ6/AcmOzSM8xRVRwqChiH/B9ylh0srY0/NqXiK', '沟通接收人', 1, 0, 0),
       (2004, now(), now(), 0, 0, 0, 'user5', '$2a$10$GQx6ILw5jsPhqHxJ6/AcmOzSM8xRVRwqChiH/B9ylh0srY0/NqXiK', '无权用户', 1, 0, 0),
       (2005, now(), now(), 0, 0, 0, 'initiator', '$2a$10$GQx6ILw5jsPhqHxJ6/AcmOzSM8xRVRwqChiH/B9ylh0srY0/NqXiK', '发起人', 1, 0, 0),
       (2901, now(), now(), 0, 1, 0, 'tenant1user', '$2a$10$GQx6ILw5jsPhqHxJ6/AcmOzSM8xRVRwqChiH/B9ylh0srY0/NqXiK', '跨租户用户', 1, 0, 0)
ON CONFLICT (id) DO NOTHING;
INSERT INTO sys_user_role (id, create_time, update_time, deleted, tenant_id, version, user_id, role_id)
VALUES (2101, now(), now(), 0, 0, 0, 2001, 2),
       (2102, now(), now(), 0, 0, 0, 2002, 2),
       (2103, now(), now(), 0, 0, 0, 2003, 2),
       (2105, now(), now(), 0, 0, 0, 2005, 2),
       (2901, now(), now(), 0, 1, 0, 2901, 2)
ON CONFLICT (id) DO NOTHING;
-- user5(2004) 有意不绑任何角色——无权身份；发起/审批/转办/委托/代理/沟通/无权/跨租户职责由不同用户分别承担
SQL
redis-cli -p 16390 flushall >/dev/null 2>&1 && echo "REDIS_CACHE_FLUSHED(权限快照缓存)"
echo "SEED_EXIT=$? (admin=id1 超管；user2/3/4/initiator=业务办理员 role2；user5 无角色；tenant1user=租户1)"
psql -h localhost -p $PGPORT -U postgres -d smart_workflow -tAc "select u.username||' uid='||u.id||' tenant='||u.tenant_id||' roles=['||coalesce(string_agg(r.name, ','), 'NONE')||']' from sys_user u left join sys_user_role ur on ur.user_id=u.id and ur.deleted=0 left join sys_role r on r.id=ur.role_id and r.deleted=0 where u.id in (1,2001,2002,2003,2004,2005,2901) group by u.username,u.id,u.tenant_id order by u.id"

curl -s -o /dev/null -w "A /auth/challenge HTTP=%{http_code}\n" http://localhost:8081/api/auth/challenge
curl -s -o /dev/null -w "B /auth/challenge HTTP=%{http_code}\n" http://localhost:8082/api/auth/challenge
psql -h localhost -p $PGPORT -U postgres -d smart_workflow -tAc "select 'flyway_success='||count(*) from flyway_schema_history where success=true"
psql -h localhost -p $PGPORT -U postgres -d smart_workflow -tAc "select 'users='||count(*) from sys_user where id in (1,2001,2002,2003,2004,2901)"
date "+INSTANCES_UP_AT=%Y-%m-%dT%H:%M:%S"
