# Phase 6B 生产制品与开发运行边界 · 规划复核 01

> 复核角色：规划（Planner）  
> 复核对象：`completion-phase6b-production-artifact-isolation-01.md` 与 `evidence/phase6b-01/`  
> 日期：2026-09-25  
> 结论：`VERIFYING`（主体成立；按停止条件裁决 IoT 生产装配后继续）

## 1. 已确认并锁定

1. H2 已退出生产 runtime：`prod` 依赖树 10 个 H2 命中全部为 test scope，非 test 命中 0；PostgreSQL 生产依赖保持。
2. dev/local 配置与 devseed 已进入 dev resource 边界；正式制品中 H2 jar、两份 dev/local 配置、devseed 均为 0。
3. 五个验证适配器及 `VerifyMapper` 已迁入 `src/dev/java`；默认编译输出为 0，`-Pdev` 下全部存在。该边界由源码根实现，不再仅依赖 `P58Debug*` 命名。
4. 制品正向清单成立：`application.yml`、`application-prod.yml`、PostgreSQL 驱动、87 项生产迁移、`TencentCloudProvider`、11 个 `AgentGraphDebug*` class 均存在。
5. prod/dev 制品身份可区分；prod marker、构建脚本、制品门禁与 Release workflow 调用已落地。临时 Jar 注入禁止资源后门禁按预期失败，正式制品 hash 未改变。
6. dev 制品 H2 启动烟测 health 200；该证据只证明开发入口可用，不外推为生产数据库行为。
7. 后端全量 1563/0/0/0，BUILD SUCCESS，与 Phase 6A 基线一致；正式证据 18/18 现场哈希回读通过，秘密扫描 CLEAN。

上述项目锁定；补证只重验因 IoT 生产装配变更而失效的调用域、最终生产制品与全量门禁。

## 2. 未通过项

### G1 · Mock provider 仍在正式制品

正式制品门禁实际 exit 1：负向清单 10 项中只有 `MockCloudProvider` 仍为 1；`prod` 配置仍默认选择 mock。因此方向 §5.1、§5.3 尚未达成。

### G2 · 生产 IoT 关闭路径无法启动

`MockCloudProvider` 被生产选择器直接实例化；两个生产组件强制注入 `DeviceControlProvider`，实测 `sw.iot.enabled=false` 时因 IoT 配置 Bean 缺失导致上下文创建失败。当前无法同时证明“正式制品无 mock”“应用可启动”“调用 fail closed”。方向 §5.5、§5.6 未达成，§5.8 的 prod 上下文安全断言也未完成。

### G3 · 正式生产入口尚未端到端成功

`scripts/build-prod.sh` 已实现但最终制品门禁失败，故仓内唯一生产入口整体 exit 1。真实 PostgreSQL 启动未执行，不能以依赖树、Jar 清单或 H2 dev 烟测替代。

## 3. 规划裁决

采纳回执解除条件 **(a)**，授权在 Phase 6B 原范围内做窄幅生产装配修正：

1. `MockCloudProvider` 进入 dev/test/mock 源与配置边界，正式生产编译和制品均不可见；
2. 生产 IoT 装配不再直接引用或实例化 mock；
3. `sw.iot.enabled=false` 时应用可启动、provider Bean 为 0，代表性设备操作按既有错误体系 fail closed，不能模拟成功；
4. `sw.iot.enabled=true` 且真实 provider 配置不足时继续 fail closed；
5. 允许将 provider 强制注入改为可选获取或为 IoT-only 组件增加精确条件，但不得改变公开 API、成功/失败模型或扩展到 IoT 功能重构。

不采纳精确排除造成字节码悬挂的过渡方案，也不把该缺口延期到后续阶段。该阻塞是方向预设停止条件触发后的规划裁决，不计为执行失败。

## 4. 唯一下一动作

Executor 执行：

`product/backend-architecture-optimization/receipts/planning-execution-prompt-phase6b-iot-production-assembly-supplement-01.md`

Phase 6B 保持 `VERIFYING`；不得归档主方向、同步 `COMPLETED`、启动 Phase 6C 或最终仓库展示收口。
