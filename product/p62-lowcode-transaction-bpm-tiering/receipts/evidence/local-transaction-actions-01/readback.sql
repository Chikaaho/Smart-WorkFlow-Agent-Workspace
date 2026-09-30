-- P62 首事务阶段 T07 浏览器验收：数据库回读（与界面同对象）
-- 用法：psql -h 127.0.0.1 -p 5432 -U chikan -d sw_p62_accept -f $0
\echo '=== 1. 动作定义（界面「事务动作」列表同一对象）==='
SELECT action_key, name, action_type, status, current_version, config_json->>'balanceField' AS balance_field,
       config_json->>'reservedField' AS reserved_field, config_json->>'expiresInSeconds' AS ttl_seconds,
       tenant_id, create_by
FROM sw_form_txn_action ORDER BY action_key;

\echo '=== 2. 动作发布版本（不可变快照）==='
SELECT action_id, version_no, form_version, published_by, published_at FROM sw_form_txn_action_version ORDER BY version_no;

\echo '=== 3. 调用记录（幂等键 + 指纹 + 结果 + 耗时事实）==='
SELECT invocation_key, status, error_code, error_msg, duration_ms, biz_record_id, create_by,
       left(result_json::text, 120) AS result_head
FROM sw_form_txn_invocation ORDER BY create_time;

\echo '=== 4. 预占凭据生命周期 ==='
SELECT id, action_id, action_version, record_id, quantity, status, expires_at, settled_at
FROM sw_form_txn_reservation ORDER BY create_time;

\echo '=== 5. 台账（守恒复算：SUM(quantity) 按 entry_type）==='
SELECT entry_type, count(*) AS rows, sum(quantity) AS sum_qty, min(balance_after) AS min_balance_after,
       max(balance_after) AS max_balance_after, max(reserved_after) AS max_reserved_after
FROM sw_form_txn_ledger GROUP BY entry_type ORDER BY entry_type;

\echo '=== 6. 台账逐行 ==='
SELECT entry_type, quantity, balance_after, reserved_after, record_id, reservation_id, invocation_id, create_by
FROM sw_form_txn_ledger ORDER BY create_time;

\echo '=== 7. C1 保护策略 ==='
SELECT form_id, enabled, policy_json FROM sw_form_c1_policy;

\echo '=== 8. 库存宽表记录（与界面列表/表单同对象）==='
SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'sw_form_p62%';
