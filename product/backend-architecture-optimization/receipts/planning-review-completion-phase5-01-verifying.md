# Phase 5 IoT API 边界抽取 · 规划复核 01

> 复核角色：规划（Planner）  
> 复核对象：`completion-phase5-iot-api-boundary-extraction-01.md` 与 `evidence/completion-phase5-01/`  
> 日期：2026-09-24  
> 结论：`VERIFYING`（主体成立，补齐 2 项后再作功能级裁决）

## 1. 已确认

1. 新模块清单为 4 接口 + 1 事件，FQCN 保持；实现模块旧路径 5/5 缺失，API POM 零依赖、签名只使用 JDK 类型。
2. 7/7 开放方法均为 `Optional<T>`；`markTriggerResult` 采用 `Optional<Boolean>` 表达“改写/终态保护/目标缺失”三态，满足不新增契约类型和不使用 void 的双重约束。
3. `bpm-process` 不再依赖完整 IoT；MQTT/Paho、GraalJS、Tencent SDK 在其依赖树中归零，fastjson2 成为直接依赖并登记为 BAO-03 后续项。
4. 生产代码中的 IoT entity/mapper 实现引用为 0；测试源码命中均为负向隔离断言。
5. 设备命令事务分界在迁移前后均有 3/3 行为证据：意图记录失败时审批回滚；意图已持久化后的发送失败保留审批并落 FAILED/重试状态。
6. 最终全量门禁 `BUILD SUCCESS`，32 模块、1555 tests、0 failures/0 errors/0 skipped；首次远端 PG `08006` 失败日志已保留，随后同一最终快照成功，暂不判为实现缺陷。
7. Planner 已独立回读行为输入哈希 28/28、证据哈希 **18/18**，均 exit 0；秘密扫描为 CLEAN。

## 2. 暂不通过项

### G1 · Bootstrap 实际装配证据缺失

方向 §4.4 要求证明 Bootstrap 中四项 API 实现与反向 SPI 均可启动装配、无循环依赖、无重复 Bean。回执引用的 `IotContractBoundaryIsolationTest` 只证明 `bpm-process` 测试类路径看不到 IoT 实现，并不证明最终 Bootstrap `ApplicationContext` 中：

- `IotDeviceFacade`；
- `IotProcessTriggerFacade`；
- `IotDeviceQueryFacade`；
- `IotFormContractChecker`

各自恰好存在一个真实生产 Bean，也没有证明 IoT Controller 对反向 SPI 的最终注入。全量 Maven 绿色不能替代这一明确装配断言。

### G2 · 机器终态与计数不一致

完成回执最后一个非空物理行不是可解析的 `ENGINE_TERMINAL`；因此当前只有人类可读的 Executor 自验，没有治理机器终态。另，回执 §8 写 `evidence.check 15/15`，实际 `evidence.sha256` 与 `evidence.check` 均为 **18 行且 18/18 OK**。旧回执无需改写，但补正回执必须给出单一正确值。

## 3. 偏差裁决

- 5 个 IoT 守门定位改为 FQCN：**接受**，比路径字面量更稳，14 项检查未减少。
- `Optional<Boolean>`：**接受**，三态语义已有 5/5 行为测试，不要求新增 DTO/枚举。
- `IotFormContractCheckerImpl` 在必需基础设施未装配时由 400 校验结果改为异常：**接受为方向 B.3 的窄幅纠正**。正常业务校验与公开路由/结构未改；不得外推为一般 HTTP 契约改造。
- IoT 侧持久化原始异常文本未脱敏：记为**非阻塞残余风险**，不得宣称已完成安全治理；本阶段已有失败终态与恢复行为，不因此否定模块边界结果。
- 回执中 `evidence.check 15/15`：按独立回读修正为 **18/18**。

## 4. 唯一下一动作

Executor 执行：

`product/backend-architecture-optimization/receipts/planning-execution-prompt-phase5-iot-api-boundary-supplement-01.md`

补证前 Phase 5 保持 `VERIFYING`，不得归档主方向、同步 `COMPLETED`、推进后续 BAO 或执行最终仓库展示收口。
