# 0.1.0 数据库迁移清单

> H2 与 PostgreSQL 同一迁移身份（逐字节一致），起点为 P60 I5 终点（H2 V88 / PG V87），I6 终点统一 **V93**。

| 版本 | 文件 | 内容 |
|---|---|---|
| V89 | `sw-basic/sw-basic-notify/sw-basic-notify-biz/src/main/resources/db/migration/notify/{h2,postgresql}/V89__i6_notify_closure.sql` | ① `sw_notify_template` 增列 event_type/channel/variables_allowed/jump_ref；② 新建 `sw_notify_template_version`（不可变版本快照，唯一键 tenant+template+version）；③ 新建 `sw_notify_rule`（事件开关/渠道顺序/接收人规则/失败策略/required）；④ 新建 `sw_notify_subscription`（用户订阅，唯一键 tenant+user+event+channel+deleted）；⑤ 新建 `sw_notify_channel_config`（租户级渠道启停，秘密不入库）；⑥ `sw_notify_message` 增列 event_type/occurrence_no/template_id/template_version/link_type/link_id/retry_count/next_retry_time/failure_class/receipt_digest + 业务身份唯一索引 `uk_sw_notify_msg_identity`；⑦ `sw_notify_send_attempt` 增列 failure_class/started_at/finished_at |
| V90 | `sw-bootstrap/src/main/resources/db/migration/{h2,postgresql}/V90__i6_notify_menus.sql` | 管理端菜单/按钮权限种子：218 通知规则、219 渠道配置、220 订阅偏好、221 `notify:rule:manage`、222 `notify:channel:manage`、223 `notify:record:detail`（幂等 NOT EXISTS） |
| V91 | `sw-basic/sw-basic-notify/sw-basic-notify-biz/src/main/resources/db/migration/notify/{h2,postgresql}/V91__i6_notify_subject_binding.sql` | 通知 Provider 主体绑定表；租户、用户、Provider 唯一约束与密文/摘要存储，跨租户 fail closed |
| V92 | `sw-basic/sw-basic-notify/sw-basic-notify-biz/src/main/resources/db/migration/notify/{h2,postgresql}/V92__i6_notify_flag_boolean.sql` | 模板启用标志的数据库布尔语义（`sw_notify_template.enabled`），迁移保留既有值 |
| V93 | `sw-basic/sw-basic-notify/sw-basic-notify-biz/src/main/resources/db/migration/notify/{h2,postgresql}/V93__i6_notify_flag_boolean_closure.sql` | 规则/订阅/渠道配置启用标志列 smallint→boolean 收口（幂等，兜底 V92 未生效环境），双方言同版本身份，迁移终点 |

## 兼容性与升级语义

- 只追加表/列/索引，不删除、不重命名、不重写历史数据；既有 90 明细与流程数据可解释。
- 新建表全部带 8 基列 + `tenant_id`，纳入租户隔离（fail closed）。
- `uk_sw_notify_msg_identity` 只约束（event_type+biz_id 非空）的业务通知；存量行 event_type 回填 'SYSTEM' 后与广播语义不冲突（H2/PG 对 NULL/默认列安全）。
- 迁移由启动期 Flyway 自动执行；不得手工在库内直写 SQL 绕过 Flyway。
