# Phase 6 构建、制品与版本治理探索 · 规划复核

> 复核角色：规划（Planner）  
> 日期：2026-09-25  
> 对象：`search_fallback/backend-build-artifact-governance-phase6-current-seams.md` 及同前缀 10 份 TSV  
> 结论：`PASSED`（探索通过，可形成分阶段实施方向）

## 1. 裁决

| 候选 | 当前裁决 | 规划去向 |
|---|---|---|
| BAO-03 | CONFIRMED | Phase 6A：第三方版本集中化 |
| BAO-04 | CONFIRMED | Phase 6A：Enforcer 激活与依赖收敛；与 BAO-03 同阶段、内部两步 |
| BAO-08 | CONFIRMED | Phase 6B：隔离生产运行时 H2；H2 继续作为次优先级辅助验证环境 |
| BAO-09 | CONFIRMED | Phase 6C 独立实施；须先取得 Owner 版本策略裁决并刷新远程引用 |
| BAO-10 | CONFIRMED（由 Phase 2 PARTIAL 升级） | Phase 6B：与 BAO-08 共用生产构建入口和制品断言 |

阶段顺序固定为 **6A → 6B → 6C → Final 展示收口**。不得把 34 POM 版本身份、生产制品隔离和 GitHub About 混入 6A。

## 2. 数据库验证优先级

Owner 明确：**PostgreSQL 等主流生产数据库是第一优先级；H2 用于轻量、快速的数据交互辅助验证。** 因此：

1. Phase 6B 将 H2 限定在 test/dev 辅助边界，不进入默认生产运行时和正式生产制品；
2. H2 适配按实际使用点维护，出现具体兼容问题时就地处理，不建设独立的全量兼容工程；
3. 涉及事务、锁、迁移、方言和生产行为的结论以真实 PostgreSQL 为权威，H2 绿色不得替代 PostgreSQL 行为证据；
4. BAO-03 不额外调整现有 H2 BOM 管理，除非依赖收敛产生直接需要。

## 3. 已确认的实施边界

- 6A 先把 Tencent IoT SDK、fastjson2、POI、embedded-postgres 与 zonky BOM 的版本所有权集中，再激活 Enforcer 并收敛 14 个冲突构件；Phase 5 fastjson2 临时声明必须进入集中治理。
- Enforcer 当前 0/32 生效，且存在错误 GA；不能只添加 execution 而不证明规则真实执行与负向失败能力。
- 6B 将 H2、P58Debug、VerificationRunner/BpmVerificationRunner、dev 配置/devseed 限定在非生产边界；`AgentGraphDebug*` 是正式授权能力，不得误删。
- `MockCloudProvider` 在 prod 中被显式选择的事实需在 6B 单独裁决，不得因类名含 Mock 就机械删除而破坏 IoT 可运行模式。
- 6C 必须独立处理 develop/main/tag 制品坐标；现有 remote-tracking 引用已陈旧，实施前只读刷新并由 Owner 决定 SNAPSHOT 或 CI-friendly revision。
- Final 展示收口与本组无共同回滚边界，继续最后执行。

## 4. 唯一下一动作

Executor 执行正式方向：

`product/backend-architecture-optimization/ready/direction-phase6a-dependency-version-enforcement.md`

本复核不授权 6B、6C、GitHub About、根 POM URL、发布版本、Git 或部署动作。
