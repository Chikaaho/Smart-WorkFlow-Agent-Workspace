# Phase 5 · Bootstrap 装配与机器终态补证执行单

> 下发角色：规划（Planner）  
> 指定角色：执行（Executor）  
> 日期：2026-09-24  
> 状态：READY  
> 性质：Phase 5 验收补证；不重做主体实现，不扩展范围

## 1. G1 Bootstrap 实际装配

在 `sw-bootstrap` 增加生产式 Spring `ApplicationContext` 装配测试，禁止用 Mock/手工 new 替代最终装配。测试必须明确断言：

1. `IotDeviceFacade`、`IotProcessTriggerFacade`、`IotDeviceQueryFacade`、`IotFormContractChecker` 各自 Bean 数量严格为 1；
2. 三个 IoT facade Bean 来自 IoT 实现模块，`IotFormContractChecker` 来自 BPM 实现；
3. IoT 规则 Controller 能取得上述反向 SPI，启动过程无循环依赖、无重复 Bean、无缺 Bean；
4. 测试使用最终 Bootstrap 生产自动配置组合，不通过测试专用替身绕过真实模块装配。

先运行该定向测试并保留原始日志。若暴露装配缺陷，可在 Phase 5 原范围内最小修复；不得扩展 Knowledge/Agent、BOM、数据库迁移或公开 HTTP 契约。

## 2. 最终快照与证据

1. 在补证文件落定后重跑后端全量 `MAVEN_OPTS="-Xmx2g" mvn -B -o test`；总数应不低于 1556，failures/errors/skipped 均为 0。若计数不同，逐项解释，不以预期数字替代日志事实。
2. 重新冻结所有 Phase 5 行为输入与证据；哈希清单必须回读 exit 0，秘密扫描 CLEAN，不得写入 PG 连接值。
3. 正确登记 `behavior-input` 与 `evidence` 的实际文件数；本轮基线中旧证据为 28/28 与 18/18，不得继续写成 15/15。
4. 首次 PG `08006` 失败日志继续保留，不删除历史失败证据。

## 3. 补正回执与机器终态

新增：

`product/backend-architecture-optimization/receipts/completion-phase5-iot-api-boundary-extraction-02.md`

回执引用 01，不改写旧回执；说明新增测试/任何最小修复、定向结果、最终全量结果、哈希数量和残余风险。最后一个非空物理行必须是可解析 `ENGINE_TERMINAL`，至少满足：

- `role=executor`；
- `state=EXECUTION_SUBMITTED`；
- `feature_status=VERIFYING`；
- `remaining_actionable_count=0`；
- `next_action_type=WAIT_PLANNER`；
- `receipt` 指向补正回执 02；
- `evidence` 指向本轮实际证据。

不得写 `PASSED`、`COMPLETED`，不得归档方向，不得执行 Git 写操作或最终仓库展示收口。
