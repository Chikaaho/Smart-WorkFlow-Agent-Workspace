# T020 后台准入与租户状态审计

2026-10-23｜Executor｜XL｜IN_PROGRESS

七阶段：需求评估已完成；分支实施进行中；验收同步、合并、发布、发布后同步、结束未开始。本回执补齐 A08 的后台路径和启停审计，仍待 Planner 独立验收；T020 与整版没有完成。

## 实施结果

- IoT 流程触发的首次消费和恢复认领均通过 TenantWorkAdmission。停用、过期、缺失租户不装载身份、不发起流程、不写触发结果，原触发保持 PENDING；恢复后沿用原 triggerId、幂等键和定义。滞留触发回收也按对象租户逐条准入，不再跨租户批量改写。
- 通知首次发送、人工重发、正常恢复和滞留回收均在持久认领前校验租户。PENDING→RESENDING 与原 retry_count 条件更新同事务，停用或过期时不调用渠道、不增加重试预算；已经认领的发送继续记录真实结果。业务事务内的新外部通知只落 PENDING，事务提交后才由既有提交后路径或恢复调度认领，避免事务内先外发。
- OpenAPI 回调的提交后加速和恢复任务均先核对租户。停用或过期时应用查询、HTTP 投递和任务状态推进都不发生；已持久化意图保留 PENDING，修复原有“先外发、后治理”边界。
- BPM 节点时限的提醒、自动动作和任务消失收口均把租户准入与 PENDING 认领放入同一持久回调；停用时任务 id 与结果不变，不发布提醒、不执行审批动作。已经认领的一次执行仍允许有界完成。
- 新增 `sys_tenant_status_audit`（H2/PG 同文 `V0.1.10__tenant_status_audit.sql`）记录目标租户、操作者、原因、有效期、发生时间和结果。手工启停要求原因并同步写审计；计划任务把自然过期幂等记录为 `EXPIRED`。超管可读取最近 50 条记录，租户 0 仍只读。
- Web 启停确认改为必填原因输入，调用参数包含原因；同步中英文文案和操作手册。

## 工程与行为证据

受影响模块单一 Maven 命令：`mvn -pl sw-basic/sw-basic-iot,sw-basic/sw-basic-notify/sw-basic-notify-biz,sw-biz/sw-biz-openapi/sw-biz-openapi-biz,sw-biz/sw-biz-system/sw-biz-system-biz,sw-biz/sw-bpm/sw-bpm-process -am test`，`MAVEN_OPTS=-Xmx2g`，exit 0，1:49。按模块汇总 Surefire：common 36、security 23、IoT 76、Notify 122、OpenAPI 16、System 378、BPM Process 425，共 1076 用例，0 failure / 0 error / 0 skipped。原文 `C:/Users/hjxch/.codex/evidence-020/tenant-identity/tenant-background-regression-final.log`。

数据库与迁移检查：`FlywayFullChainH2Test,TenantAdministrationDatabaseTest`，H2 + 隔离 PostgreSQL 实际 Flyway，共 48 用例，0 failure / 0 error / 0 skipped，exit 0。覆盖全新链 18 条迁移、终点 0.1.10、手工停用/恢复原因与操作者落盘、停用期间 admission 拒绝且恢复后可认领、通知停用保留意图、恢复只投递一次、业务事务内等待提交、HTTP 已在途后停用仍记录真实结果。原文 `C:/Users/hjxch/.codex/evidence-020/tenant-identity/tenant-status-db-01.log`。

拒绝对照单测：IoT 触发认领、OpenAPI 恢复、BPM 时限认领在停用租户下均不更新任务状态、不发布事件、不访问应用或渠道；原文 `tenant-background-admission-02.log`。

Web 四连：typecheck exit 0；lint exit 0（2 条既有 `require-default-prop` warning）；vitest 190 文件通过、1 文件跳过，1704 passed / 3 skipped；build exit 0（3.21s，既有 VueUse 纯注释与插件耗时提示）。原文 `C:/Users/hjxch/.codex/evidence-020/tenant-identity/web-tenant-audit-test.log`、`web-tenant-audit-build.log`；typecheck/lint 与目标测试结果见本次终端记录和 `TenantList.spec.ts` / `tenant-handlers.spec.ts`。

## Git

- Server `e604fc2b3b292248bb7b362b06b68bdd24b785b`：通知意图、认领、恢复边界；`a69b0a42069808a56dcdba0f306ee336d1a1d588`：IoT/OpenAPI/BPM 准入、租户状态审计及迁移。两批均普通推送并回读 `origin/codex/0.2.0-tenant-form-flow` 同点。
- Web `436e3b20575bd3f5cb98c8a596250a692629f7bf`：必填原因、审计 API 类型与 Mock 约束，普通推送并回读 `origin/codex/0.2.0-ui-tenant-form-flow` 同点。

## 边界与下一动作

A08 后台实现已自验，未由 Planner 判定通过。真实外部厂商、A03 像素与 A04 全局交互仍未完成；T020 整体也仍需 Planner 汇总验收。本批未核销 P、未改功能数或正式验证基线。下一动作进入 F020 表单权限、默认列表与受控数据源配置，继续遵循 T020 → F020 → J020 → W020 → U020 的真实依赖。
