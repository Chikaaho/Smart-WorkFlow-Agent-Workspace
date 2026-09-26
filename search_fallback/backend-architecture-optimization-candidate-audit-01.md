# 后端架构优化候选事实审计 01 · 回执

> 角色：执行；2026-09-24；只读审计，无实施
> 身份：`Smart-WorkFlow-aPaaS-server` `develop` @ `76dc947`（工作树 194 tracked + 17 untracked；`pom.xml` 未改）
> 裁决：`CONFIRMED` 8 = BAO-02/03/04/05/06/07/08/09；`PARTIAL` 2 = BAO-01/10；合计 10
> 逐项 file:line、证据类型与命令见同前缀 5 个 TSV

## 1. 十项裁决

| ID | 裁决 | 一句话结论 | 风险 |
|---|---|---|---|
| BAO-01 | PARTIAL | 依赖层成立：7 个 `-api` 全 compile 依赖 `sw-common` 并全量下传 web/redis/mybatis-plus/jsqlparser/dynamic-datasource/security/hutool/mapstruct（form-api 树 80 构件中 79 个在子树）；类型层不成立：`-api` 仅引用 `ErrorCode`/`PageParam`，重类型 0 | 中 |
| BAO-02 | CONFIRMED | iot/knowledge/agent 单 jar、无 `-api`/`-biz`；`sw-bpm-process` compile 依赖整个 `sw-basic-iot`（mqtt+paho、polyglot、腾讯云 SDK、fastjson2）并 import `iot.entity`/`iot.mapper` | 中高 |
| BAO-03 | CONFIRMED | BOM 外编译依赖 3：`tencentcloud-sdk-java-iotexplorer:3.1.1235`、`fastjson2:2.0.53`、`poi-ooxml:5.2.5`；test 级 `embedded-postgres:2.1.0`；`sw-dependencies` 对四者 0 命中 | 中 |
| BAO-04 | CONFIRMED | 唯一 enforcer 在根 POM `pluginManagement`（78-93 行，仅 `dependencyConvergence`、无 executions）；form-api effective POM 的 `build/plugins` 为空 ⇒ 不执行、无架构规则 | 中 |
| BAO-05 | CONFIRMED | 5 事件 / 11 发布点 / 4 监听者，监听者 100% `@Async`+`AFTER_COMMIT`；无 outbox 或事件表；2 个事件无监听者；2 处发布无事务；2 个监听者无重试；失败多被吞 | 高 |
| BAO-06 | CONFIRMED | 12 类用 `JdbcTemplate`；约束靠人工（表名正则 3 处重复、`validateColumnName` 4 处手写、`DynamicTableManager` 校验 0 调用者、动态表 DDL 仅 `PRIMARY KEY(id)`）；12 处缺口含 delete 路径双 fail-open | 高 |
| BAO-07 | CONFIRMED | 表单路径 RESTRICT 为非锁定 `SELECT 1 … LIMIT 1`，ref 列无唯一约束/FK、无 advisory/Redis 锁（全仓唯一 `FOR UPDATE` 在催办路径，与本项无关）；READ_COMMITTED ⇒ 窗口成立；可复现性未验证 | 高 |
| BAO-08 | CONFIRMED | `h2` 在 `sw-bootstrap/pom.xml:158-162` 为 `runtime`（非 test），制品含 `BOOT-INF/lib/h2-2.3.232.jar`；prod 显式 PostgreSQL ⇒ 制品污染成立 | 中低 |
| BAO-09 | CONFIRMED | 根 POM `0.1.0` 非 SNAPSHOT；`0.1.0` tag 在 15 提交前，`develop`/`origin-main` 同为 `0.1.0`；身份仅靠 `build-<full-SHA>` tag；无 `revision`/flatten | 中 |
| BAO-10 | PARTIAL | 命名排除成立且为唯一构建期机制（`prod` profile 排除 `**/P58Debug*.java`/`.class`），但无流水线激活 `-Pprod`，制品仍含 6 个 `P58Debug` class（3 个顶层类型）；`devtools` 0 | 中 |

## 2. 复算口径

10 = 8 `CONFIRMED` + 2 `PARTIAL`；去向 = 立项 4（02/05/06/07）+ 构建与制品治理 5（03/04/08/09/10）+ 延期 1（01）。复算覆盖全部 33 个 POM，并对 form-api、sw-basic-iot、sw-bpm-process 实测依赖树；制品复算 `bootstrap.jar`（09-24 构建、未加 `-Pprod`）348 个 `BOOT-INF/lib` jar。Maven 仅模型查询（effective-pom、dependency:tree），未 compile/test/install/deploy；期间前端 dev 进程在运行。

## 3. 推荐下一唯一主阶段

**「动态宽表数据安全与引用完整性收口」= BAO-06 + BAO-07（≥L）**：唯一高风险项，且 `FormDataDeleteService` 同时承载 07 的 RESTRICT 检查与 06 的裸 SQL 书写，共享回滚边界。替代：(a) 只做 06、07 紧随独立成阶段；(b) 先做构建治理（03/04/08/09/10）；(c) 先做 05（须先认定 must-deliver 清单）。

## 4. 附带事实（非 10 项范围，未实施）

1. `SwJobBean.executeFlow` 发事件后即写 `SUCCESS`，而全仓无监听者 ⇒ FLOW 定时任务可静默不发起流程却报成功（`SwJobBean:167-180`、`112-118`）。
2. 三处注释引用不存在的 `FormSubmittedEventListener`；真实接缝是 `FlowStartPort` + `sw_bpm_command` 队列。
3. `sw-basic-knowledge` 惰性（`sw.knowledge.enabled` 未设置、0 外部引用）却带入 tika/pdfbox/pgvector。
4. `application.yml:249`、`application-prod.yml:58-59` 将 `com.sw.ck`/`spring.jdbc` 设为 `debug`。

## 5. 未确认与最小补证

- BAO-07 可复现性（静态判定有窗口）→ 补证 = TSV 的双连接最小实验。
- BAO-05 Flowable 回调是否在事务内、`@Async` 执行器实现 → 补证 = `isActualTransactionActive()` 断言用例。
- BAO-06 活库 schema 是否真带 `deleted`/`tenant_id` → 补证 = dev profile 下查 `information_schema`。
- BAO-08/10 仓库外是否用 `-Pprod`、是否注入 `sw.knowledge.enabled` 无法证明。

## 6. 冲突、推测与结论

偏差：BAO-01「契约层污染」类型层不成立；BAO-10「依赖命名排除」仅构建期成立。推测（未当事实）：BAO-03 收敛进 BOM 前需确认传递树冲突；BAO-09 暴露面取决于是否引入 repository manager（本仓无 `deploy`）。无阻塞；是否继续探索：否，除非 Planner 需 BAO-07 并发实验或 BAO-06 活库证据。
