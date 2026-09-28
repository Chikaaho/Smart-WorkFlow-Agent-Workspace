# 当前状态摘要

> 总体任务 `backend-architecture-optimization` 已 `COMPLETED（规划已确认，2026-09-26）`，新活动任务见下方 0.1.2 修复方向。

> Owner 裁决（2026-09-24）：`v0.1.1-bugfix` 已结束，**`COMPLETED（Owner 范围关闭）`**，主方向已归档；裁决 `product/v0.1.1-bugfix/receipts/planning-owner-v011-task-close-20260924.md`。

- 0.1.1 边界：25 项缺陷收口、开放修复项 0；两仓已在本地合并进 `develop`（`76dc947` / `2c2ffe1`）。不声称远程 `develop`、`main`、`0.1.1` tag/Release、CI 身份或部署已完成；公开版本仍 0.1.0。

## 总体任务（已完成）

- `backend-architecture-optimization`：**`COMPLETED（规划已确认，2026-09-26）`**，总体方向已归档 `product/backend-architecture-optimization/passed/direction-backend-architecture-optimization.md`；目标=分阶段优化后端模块契约、依赖拓扑、构建治理、可靠性、数据安全与制品边界。
- Phase 1 `backend-api-optional-contract`：**`COMPLETED（规划已确认，2026-09-24）`**，`PASSED` 15/15；内部 API 用 `Optional<T>`，Controller 用 `Result<T>`，真实错误不吞为 empty。
- Phase 2 候选事实审计：**`COMPLETED（规划复核通过，2026-09-24）`**，10 = 8 `CONFIRMED` + 2 `PARTIAL`。
- Phase 3 `dynamic-table-data-safety-reference-integrity`（BAO-06/07）：**`COMPLETED`**，`PASSED` 17/17；动态宽表 SQL 收敛唯一受控入口 `DynamicTableSql`。
- Phase 4 `reliable-business-events`（BAO-05）：**`COMPLETED`**，`PASSED` 21/21；五道 must-deliver 接缝统一为事务内持久意图、恢复调度、幂等与可审计终态，G3a/G3b 锁定引擎/应用/流程发起的单一事务边界。
- Phase 5 `iot-api-boundary-extraction`（BAO-02-IoT）：**`COMPLETED`**，`PASSED` 8/8；零基础设施依赖 `sw-basic-iot-api`（4 接口 + 1 事件、7/7 Optional），BPM→完整 IoT/MQTT/GraalJS/Tencent 归零。
- Phase 6A（BAO-03/04，8/8）、Phase 6B（BAO-08/10，10/10：生产入口 exit 0、Jar 负向 10 项全 0/正向 6 项、真实 PG 迁移至 V96 health 200、IoT fail-closed）、Phase 6C（BAO-09，10/10：`${revision}` 双版本矩阵 32/32、四向负探针、仓外消费 `sw-basic-iot-api:0.1.2`）：均 **`COMPLETED`**，最终正式 Jar sha256 `4fd3174c…`。
- Final `repository-presentation-hygiene`：**`COMPLETED`，`PASSED` 8/8**；后端 About=`Enterprise low-code aPaaS platform with dynamic forms, BPM workflow, RBAC, multi-tenancy, notifications, agent workflows and IoT integration.`、前端=`Web console for an enterprise low-code aPaaS platform with dynamic forms, BPM workflow, RBAC, multi-tenancy, notifications and IoT integration.`（写后 API 回读逐字一致）；根 POM `<url>`=canonical `https://github.com/Chikaaho/Smart-WorkFlow-aPaaS-server`（placeholder 0，8/8 hunks 已归属且 Final 仅 URL 一处）；主方向已归档。
- **10 项候选最终去向**：BAO-01 `DEFERRED`、BAO-02 `PARTIAL`、BAO-03/04、BAO-05、BAO-06/07、BAO-08/10、BAO-09 共 8 项 `COMPLETED`。
- **上一轮结束时下一动作：等待 Owner 决定下一任务**（2026-09-26 版本修正轮已按 Owner 指令完成 commit+push：server `develop`、工作区 `develop-sw`，web 无变更；tag/Release/部署仍未执行；公开版本仍 0.1.0）。

## 锁定基线

- 功能数 **45**；清单 **✅46/🟦22/⬜22**（90）；**ADV64** 独立计数；P60/P53/P61/P21 已终态，P2/P4/P34/P35/P37/P38/P39 未核销边界不受本任务改变。
- 当前验证基线：Server **1570/0/0/0**（`BUILD SUCCESS`；Phase 6C 正式入口保持）；Phase 6C 三包哈希 17/17、10/10、6/6，物理文件 19/12/8；真实秘密 0。Phase 6B 主证据 18/18、补证 16/16及更早时点仅作历史。
- Flyway：H2 15/0/0/0、97 migrations、V96；PostgreSQL 12/0/0/0、95 migrations、V96；V95→V96 行为 3/0/0/0；Phase 6A 无新增迁移。Web `1217 passed + 3 skipped` 为历史基线。
- Phase 6B 接受边界：H2 仅 test/dev 辅助、生产行为以 PG 为准；不证明腾讯 IoT 真实云端送达；版本身份已由 6C 完成。
- Phase 6C 接受边界：develop 的 `0.1.2-SNAPSHOT` 是工程版本身份、不构成已发布版本主张（公开版本仍 0.1.0）；不修改历史 branch/tag/Release，不推断远端 ahead/behind；GitHub About/根 POM URL 属 Final。
- Phase 4 接受边界：外部五类通知 Provider 真实送达仍 Owner 延期/未验证；引入 `@DS` 或改 Flowable DataSource/事务管理器则 G3a/G3b 快照失效；交付语义为至少一次 + 业务幂等。
- Phase 3 接受残余：锁/语句超时固定 10 秒未配置化；极端跨表单多引用可能死锁（1511 + 回滚、无自动重试）；H2 不承担 PG 锁语义证明。

## 2026-09-27 当前修复方向

- 活动任务 `v0.1.2-bugfix`：IN_PROGRESS；Owner 2026-09-27 要求按原始 Bug 描述完整修复后标记，7 项大需求全部本轮详细处理。
- 唯一执行入口：`product/v0.1.2-bugfix/ready/direction-full-repair-20260927.md`。
- 原表 19 项：001–008 Owner 已通过；009–013、017、019 本轮待完整实施；014–016、018 有已交付内容、整项待 Owner 验收。
- BUG-019 最新反例为 /login 的 SSO 租户 ID 手填框；要求全局名称/选择器化，优先修复，不局限登录截图。
- 批次 6 G1–G3 子项行为证据已核销；转录差异见最新规划复核。局部通过不代表全局或整体通过。
- 下一动作：执行制定详细实施计划并推进 019，再按方向连续处理菜单、流程中心、主题规则、发起/详情与全局对账；逐批提交推送。
- 修复栏完整实现验证后填“是”，部分完成明确剩余；Owner 回归独立记录。Owner 回规划宣布结束后才整体收口。

- Owner 追加 V012-CODE-001（READY）：后端全限定类名改 import，唯一例外为同一类同时使用不同包同名类型；代码清理与开发规范落盘均须完成。方向 `product/v0.1.2-bugfix/ready/direction-backend-import-style.md`；Executor 处理代码，管理员承接工程规范。

## 2026-09-28 回归复开修复轮执行完毕（批次 7—12 + 复开批次 13—16）

- 批次 7—12（七项完整实现）后 Owner 2026-09-28 上午回归：011/014/015/016/017/018「通过」锁定（累计 14 项）；009/010/012/013/019 复开（已备注原因）+ 新增 V012-BUG-020（前台顶栏 tab 左对齐）。
- 复开修复全部完成并标记原文「是」：020 tab 左对齐、010 定位分类移除+主题规则列内联入口、012/013 表单边框体系+流程图网格画布与节点层级+详情发起同款/铺满、009 流程中心列表化（分类分组带+多列条目）、019 用户/部门系统弹窗选择器；另修复收藏「取消→再收藏」撞物理唯一键 500（物理删除+回环单测）。
- 提交：Web `d627b6e`/`9ff1c17`/`3aaa2e0`/`3aa8ff6`/`3fb7f1a`/`59a9878`；Server `0d05b5e`/`e348ff8`（迁移锚随 V102 修正）。迁移终点 V102。
- 基线：Server 全量 1559 例（6 失败均为锚陈旧，修正后四锚类 31 例复验绿，其余同树全绿）；Web 四连 typecheck 0/lint 0/vitest 1301+3/build 0。回执 `batch-13-16-v012-bug-reopened-round.md`。
- 新发现缺陷（记录未修）：「我发起的」Flow name 列全「—」且未接主题。
- 2026-09-28 午后回归：010/012/013/019/020 通过（累计 19 项）；009 二轮未通过（左右留白）已修（去 1152px 上限铺满，Web `d09c748`），待 Owner 回归。
- 唯一下一动作：Owner 对 009 铺满修复回归验收；新登记（含 V012-CODE-001）继续接入。
