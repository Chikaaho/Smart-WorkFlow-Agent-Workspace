# 后端架构优化重构总体方向

> 下发角色：规划（Planner）  
> 指定实施角色：执行（Executor）  
> 任务等级：XL  
> 总体状态：COMPLETED（规划已确认，2026-09-26）  
> 日期：2026-09-26  
> Owner 范围记录：`../receipts/planning-owner-scope-update-20260924.md`
> 终态复核：`../receipts/planning-review-completion-backend-architecture-optimization-terminal-sync-01-passed.md`

## 1. 总体目标

以可验证的代码事实为基础，持续收敛后端模块契约、依赖拓扑、构建治理、跨模块可靠性、数据安全和制品边界。每一主阶段必须有独立方向、回滚点、行为证据和规划验收，不以一次大规模重构同时改动全部问题。

第一主阶段固定为 API `Optional<T>` 内部结果契约；后续方向来自 Owner 提供的代码质量扫描候选，但是否执行、如何合并和优先级均以专项探索结论为准。

## 2. 当前阶段

| 主阶段 | 范围 | 当前状态 | 权威入口 |
|---|---|---|---|
| Phase 1 | `-api` 模块 `Optional<T>` 内部规范结果、调用方迁移与机械守门 | `COMPLETED（规划已确认，2026-09-24）` | `product/backend-api-optional-contract/passed/direction-backend-api-optional-contract.md` |
| Phase 2 | 10 项候选问题的代码事实审计、风险排序、依赖关系与立项裁决 | `COMPLETED（规划复核通过，2026-09-24）`：8 `CONFIRMED` + 2 `PARTIAL` | `receipts/planning-review-candidate-audit-01-passed.md` |
| Phase 3 | BAO-06/07 动态宽表数据安全与引用完整性收口 | `COMPLETED（规划已确认，2026-09-24）` | `passed/direction-phase3-dynamic-table-data-safety-reference-integrity.md` |
| Phase 4 | BAO-05 可靠业务事件交付收口 | `COMPLETED（规划已确认，2026-09-24）`，功能级 `PASSED（2026-09-24）`，21/21 | `passed/direction-phase4-reliable-business-events.md` |
| Phase 5 | BAO-02 IoT API 模块边界抽取、Optional 契约迁移与可靠性回归 | `COMPLETED（规划已确认，2026-09-25）`，功能级 `PASSED（2026-09-25）`，8/8；BAO-02 最终裁决 `PARTIAL`（IoT 完成，Knowledge/Agent 不拆） | `passed/direction-phase5-iot-api-boundary-extraction.md`；终态同步回执 `receipts/completion-phase5-iot-api-boundary-extraction-terminal-sync-01.md` |
| Phase 6A | BAO-03/04 第三方版本集中化、Enforcer 激活与依赖收敛 | `COMPLETED（规划已确认，2026-09-25）`，功能级 `PASSED（2026-09-25）`，8/8；BAO-03/04 均完成，第三方版本集中化、Enforcer 默认生命周期守门与依赖收敛闭合 | `passed/direction-phase6a-dependency-version-enforcement.md`；终态同步回执 `receipts/completion-phase6a-dependency-version-enforcement-terminal-sync-01.md` |
| Phase 6B | BAO-08/10 生产制品与开发运行边界（H2 属 test/dev，PG 为生产权威） | `COMPLETED（规划已确认，2026-09-26）`，功能级 `PASSED（2026-09-26）`，10/10；BAO-08/10 均完成，生产构建入口与制品门禁、H2/dev 运行边界、dev-only 物理隔离与 IoT 生产 fail-closed 语义闭合 | `passed/direction-phase6b-production-artifact-isolation.md`；终态同步回执 `receipts/completion-phase6b-production-artifact-isolation-terminal-sync-01.md` |
| Phase 6C | BAO-09 develop/release 版本身份 | `COMPLETED（规划已确认，2026-09-26）`，功能级 `PASSED（2026-09-26）`，10/10；34/34 POM 表达式统一、develop/release 32/32 双版本矩阵、四向身份漂移 fail-closed、仓外可消费与最终正式 `0.2.0` 制品闭合 | `passed/direction-phase6c-ci-friendly-version-identity.md`；终态同步回执 `receipts/completion-phase6c-ci-friendly-version-identity-terminal-sync-01.md` |
| Final | 后端/前端 GitHub About 与后端根 POM 仓库 URL 收口 | `COMPLETED（规划已确认，2026-09-26）`，功能级 `PASSED（2026-09-26）`，8/8；双仓 About 与后端根 POM canonical URL 收口完成（placeholder 残留 0，根 POM 8/8 hunks 已归属且 Final 仅 URL 一处） | `passed/direction-final-repository-presentation-hygiene.md`；终态同步回执 `receipts/completion-backend-architecture-optimization-terminal-sync-01.md` |

Phase 1 的 `PASSED`、阶段三状态同步和目录归档仍按原方向独立完成。总体任务不能替代子阶段验收，子阶段通过也不能宣称总体任务完成。

## 3. 候选问题池与最终去向

以下编号保留原始候选问题，同时给出总体任务结束时的最终去向。

| ID | 候选方向 | 初步风险视角 | 最终去向 |
|---|---|---|---|
| BAO-01 | `sw-common` 职责过重，API 契约层可能被 Web/Redis/MyBatis/数据源等传递依赖污染 | 模块耦合、依赖扩散、基础层稳定性 | `DEFERRED`：传递依赖污染成立、API 类型污染不成立；当前不拆 `sw-common` |
| BAO-02 | IoT、Knowledge、Agent 未形成与 Storage/Notify/Job 一致的 API/Biz 边界 | 跨模块实现依赖、重型依赖泄漏 | `PARTIAL`：IoT API 边界完成；Knowledge/Agent 保留按活调用面另行立项 |
| BAO-03 | 第三方版本仍在业务模块 POM 内锁定，可能绕过 `sw-dependencies` BOM | 版本漂移、升级与收敛成本 | `COMPLETED`：Phase 6A 完成 BOM 集中治理 |
| BAO-04 | Maven Enforcer 可能仅位于 `pluginManagement` 且未绑定生命周期 | 守门名存实亡、依赖不收敛 | `COMPLETED`：Phase 6A 完成默认生命周期守门与依赖收敛 |
| BAO-05 | 可靠业务动作与普通领域事件混用 `@Async + AFTER_COMMIT` | 进程退出丢事件、不可重试 | `COMPLETED`：Phase 4 完成 must-deliver 可靠交付收口 |
| BAO-06 | 动态宽表裸 SQL 的租户与逻辑删除约束依赖人工书写 | 跨租户/已删除数据泄露，高安全风险 | `COMPLETED`：Phase 3 完成受控 SQL 入口与租户/逻辑删除约束 |
| BAO-07 | REFERENCE 删除可能存在“检查后删除前”的并发 TOCTOU 窗口 | 引用完整性与并发一致性 | `COMPLETED`：Phase 3 完成 PostgreSQL 并发引用完整性收口 |
| BAO-08 | H2 可能以 runtime scope 进入正式 Bootstrap 制品 | 生产依赖污染、错误驱动装配 | `COMPLETED`：Phase 6B 完成 H2 test/dev 与生产制品隔离 |
| BAO-09 | `develop` 与正式 `main/tag` 可能共享相同 Maven 正式版本 | 制品身份冲突、发布追溯风险 | `COMPLETED`：Phase 6C 完成 CI-friendly `${revision}` 版本身份 |
| BAO-10 | Dev/Debug 生产隔离可能依赖 `P58Debug*` 命名排除 | 命名遗漏导致调试代码进入制品 | `COMPLETED`：Phase 6B 完成 dev-only 物理隔离与制品门禁 |

## 4. 决策原则

1. **先证实后立项**：扫描结论必须由当前分支的 POM、effective model、依赖树、源码调用面、构建生命周期或制品内容证明；不以建议文字直接判定缺陷。
2. **按风险拆分**：安全与可靠性问题优先于整洁性重构；无共同回滚边界的问题不得捆绑实施。
3. **最小依赖面**：API 层只暴露契约所需类型；实现依赖不得通过 API 或聚合模块无意传递给消费者。
4. **机械约束优先**：能由 Maven 生命周期、ArchUnit、统一基础设施接口或制品检查强制的规则，不长期依赖命名和人工约定。
5. **兼容性显式**：模块拆分、版本策略、事件交付和 SQL 基础设施变更均需明确迁移窗口、消费者、数据/制品兼容与整体回滚点。
6. **不预设方案**：候选技术名不等于实施结论；以专项审计、Owner 裁决和阶段方向为准。

## 5. 后续方向分组

Phase 2 已完成 10/10 初次事实裁决。以下分组保留为审计索引；实际完成、READY 与延期状态以 §2 的阶段表为准，分组本身不额外授权：

- 模块与依赖拓扑：BAO-01、BAO-02；
- BOM、构建、制品与版本治理：BAO-03、BAO-04、BAO-08、BAO-09、BAO-10；
- 可靠事件与动态数据安全：BAO-05、BAO-06、BAO-07。

同组不代表必须合并。BAO-06/07 已由 Phase 3 收口，BAO-05 已由 Phase 4 收口；BAO-02 仅 IoT 部分进入 Phase 5，其他项按实际影响独立判级。

## 6. 总体非目标

- 不授权一次性执行全部 10 项，也不要求为了形式统一强制采用扫描建议中的命名或技术方案。
- 不在候选审计阶段修改源码、POM、测试、数据库、版本号、分支或制品配置。
- 不借架构重构改变业务功能、权限语义、公开 HTTP 契约或发布状态。
- 不把结构扫描、依赖声明或类名存在当作行为验收；每个实施阶段仍需风险相称的真实门禁和行为证据。
- 不自动授权 commit、push、合并、tag、Release、部署或历史改写。

## 7. 总体完成边界

总体任务只有在以下条件全部成立后才能完成：

1. Phase 1 已独立 `PASSED` 并完成阶段三状态同步；
2. 10 个候选项均有事实裁决和最终去向，不存在“默认遗忘”；
3. 被立项的方向均独立完成验收与终态同步，被延期/不执行的方向有明确理由和风险归属；
4. 最终模块依赖、构建守门、可靠性和数据安全状态有统一可复核摘要；
5. 最终仓库展示收口已完成：两仓 GitHub About 与项目能力一致，后端根 POM 不再保留 `your-org` 占位 URL；
6. 未把阶段性通过或单一测试绿色外推成总体架构优化完成。
