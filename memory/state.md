# 当前状态摘要

> 总体任务 `backend-architecture-optimization` 已 `COMPLETED（规划已确认，2026-09-26）`，新活动任务见下方「2026-09-28 Owner 关闭与发布」。

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

- 功能数 **45**；清单 **✅46/🟦22/⬜22**（90）；**ADV64** 独立计数；P60/P53/P61/P21 已终态，P2/P4/P34/P35/P37/P38/P39 未核销边界不受发布任务改变（发布不增删功能数/P 编号）。
- 当前验证基线：Server **1586/0/0/0**（`mvn -B test` BUILD SUCCESS exit 0，2026-09-28 发布门禁实跑 @ `fd704ff`；Phase 6C 时点 1570 仅作历史）；Web 四连全 exit 0、vitest **1301 passed + 3 skipped（142 文件 + 1 skipped）**（2026-09-28 发布门禁实跑 @ `5368e6c`）。Phase 6C 三包哈希等制品证据仅作历史。
- Flyway：0.1.2 发布线终点 **V102**（H2/PostgreSQL 双份一致；0.1.0 终点 V93、2026-09-26 生产快照 V96 均为历史事实）；Web `1217+3` 为历史基线，当前见上。
- Phase 6B 接受边界：H2 仅 test/dev 辅助、生产行为以 PG 为准；不证明腾讯 IoT 真实云端送达；版本身份已由 6C 完成。
- Phase 6C 接受边界：develop 的 `0.1.2-SNAPSHOT` 是工程版本身份；公开版本已随 2026-09-28 发布轮更新为 **0.1.2**（tag/Release/CI 已回读，见下方发布段）。
- Phase 4 接受边界：外部五类通知 Provider 真实送达仍 Owner 延期/未验证；引入 `@DS` 或改 Flowable DataSource/事务管理器则 G3a/G3b 快照失效；交付语义为至少一次 + 业务幂等。
- Phase 3 接受残余：锁/语句超时固定 10 秒未配置化；极端跨表单多引用可能死锁（1511 + 回滚、无自动重试）；H2 不承担 PG 锁语义证明。

## 2026-09-28 Owner 关闭与发布

- 2026-09-28 Owner 宣布本轮修复结束，`v0.1.2-bugfix` 修复阶段 COMPLETED（Owner 范围关闭）；23 项历史执行与回归记录保留，不补造逐项验收。
- `v0.1.2-release` 发布执行完成（执行自验，状态 `VERIFYING`，待规划核对发布终态）：两仓 `0.1.2-bugfix` → `develop` → `main` 普通快进合并（零冲突）并推送回读一致——Server `origin/develop = origin/main = fd704ff12af3ccd99febaa700c523d7688e91509`（develop 合入 10 提交）、Web `origin/develop = origin/main = 5368e6c656c095acd3fe2cff1875c27ee5672307`（develop 合入 26 提交 + 版本提交 `5368e6c`，package.json 0.1.0→0.1.2）。
- 门禁：Server compile exit 0 + `mvn -B test` BUILD SUCCESS **1586/0/0/0**；Web 2G 四连全 exit 0（vitest 1301+3）。main CI 双 success：Server run `36396145288`（`bootstrap-0.1.2.jar` 216,941,567B、`build.version=0.1.2`）、Web run `36396187465`（dist zip 1,035,442B）。
- 两仓 annotated tag `0.1.2` 已推送并回读一致（Server tag 对象 `68987243…`、Web `e280b141…`）；正式公开 Release（非 prerelease、Latest）：Server [0.1.2](https://github.com/Chikaaho/Smart-WorkFlow-aPaaS-server/releases/tag/0.1.2)（sha256 `a4d59613…61c876`）、Web [0.1.2](https://github.com/Chikaaho/Smart-WorkFlow-aPaaS-Web/releases/tag/0.1.2)（sha256 `703fd2c4…adadbc`）；正文自上一实际发布 0.1.0 真实差异生成。工作区 `version.json`→0.1.2、`release/0.1.2/` 六份材料落盘；回执 `product/v0.1.2-release/receipts/release-20260928.md`。
- 本次未部署：生产仍为 2026-09-26 快照（旧 main `2d4278b`/`1871725`、Flyway V96）；V97→V102 随下次授权部署增量生效。未强推、未移动/删除既有 tag/Release。
- V012-CODE-001 核实无在途改动，仍 READY 独立跟踪，不伪造完成、不自动启动全仓清理。
- 下一动作：规划核对发布终态（回执 §6—§11）并确认发布状态；服务器部署、V012-CODE-001、外部渠道验证均需后续独立授权。
