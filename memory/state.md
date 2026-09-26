# 当前状态摘要

> 总体任务 `backend-architecture-optimization` 已 `COMPLETED（规划已确认，2026-09-26）`，**当前无活动任务**；下一动作=等待 Owner 另行决定。

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
- **当前唯一下一动作：无自动工程动作，等待 Owner 另行决定下一任务**（2026-09-26 版本修正轮已按 Owner 指令完成 commit+push：server `develop`、工作区 `develop-sw`，web 无变更；tag/Release/部署仍未执行；公开版本仍 0.1.0）。

## 锁定基线

- 功能数 **45**；清单 **✅46/🟦22/⬜22**（90）；**ADV64** 独立计数；P60/P53/P61/P21 已终态，P2/P4/P34/P35/P37/P38/P39 未核销边界不受本任务改变。
- 当前验证基线：Server **1570/0/0/0**（`BUILD SUCCESS`；Phase 6C 正式入口保持）；Phase 6C 三包哈希 17/17、10/10、6/6，物理文件 19/12/8；真实秘密 0。Phase 6B 主证据 18/18、补证 16/16及更早时点仅作历史。
- Flyway：H2 15/0/0/0、97 migrations、V96；PostgreSQL 12/0/0/0、95 migrations、V96；V95→V96 行为 3/0/0/0；Phase 6A 无新增迁移。Web `1217 passed + 3 skipped` 为历史基线。
- Phase 6B 接受边界：H2 仅 test/dev 辅助、生产行为以 PG 为准；不证明腾讯 IoT 真实云端送达；版本身份已由 6C 完成。
- Phase 6C 接受边界：develop 的 `0.1.2-SNAPSHOT` 是工程版本身份、不构成已发布版本主张（公开版本仍 0.1.0）；不修改历史 branch/tag/Release，不推断远端 ahead/behind；GitHub About/根 POM URL 属 Final。
- Phase 4 接受边界：外部五类通知 Provider 真实送达仍 Owner 延期/未验证；引入 `@DS` 或改 Flowable DataSource/事务管理器则 G3a/G3b 快照失效；交付语义为至少一次 + 业务幂等。
- Phase 3 接受残余：锁/语句超时固定 10 秒未配置化；极端跨表单多引用可能死锁（1511 + 回滚、无自动重试）；H2 不承担 PG 锁语义证明。
