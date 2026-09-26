# Phase 5 IoT API 模块边界抽取 · 规划验收

> 复核角色：规划（Planner）  
> 日期：2026-09-25  
> 审查对象：完成回执 01/02/03 与 `evidence/completion-phase5-01/`  
> 结论：**功能级 `PASSED`（8/8；待终态同步，不等于 `COMPLETED`）**

## 1. 验收裁决

| # | 门禁 | 规划结论 |
|---|---|---|
| 1 | `sw-basic-iot-api` 为 4 接口 + 1 事件，零基础设施依赖、JDK-only 签名 | PASSED |
| 2 | 开放方法 7/7 使用 `Optional<T>`，无 void/primitive/裸对象返回和违规消费 | PASSED |
| 3 | BPM 不再依赖完整 IoT；MQTT/Paho、GraalJS、Tencent SDK 传递依赖归零，fastjson2 显式直属 | PASSED |
| 4 | entity/mapper 泄漏归零；真实 Bootstrap 中四类契约 Bean 各 1，反向 SPI 装配正确、无循环/重复/缺 Bean | PASSED |
| 5 | 设备命令事务分界与 Phase 4 可靠事件接缝、守门保持 | PASSED |
| 6 | 最终全量 32 模块、1559/0/0/0，较 1536 基线新增 23 项均可归因 | PASSED |
| 7 | 行为输入 30/30、证据 20/20 现场哈希回读 exit 0，秘密扫描 CLEAN | PASSED |
| 8 | 无新迁移、无公开路由/结构变化、无 Knowledge/Agent/BOM 扩面、无 Git/发布动作 | PASSED |

## 2. 补证闭合

- 回执 02 的生产入口 `StarterApplication` 原始日志证明：三个 IoT facade 实现来自 `sw-basic-iot`，`IotFormContractChecker` 实现来自 `sw-bpm-process`，Controller 取得容器内同一 SPI 单例，循环依赖未开启。
- 回执 03 修正冻结顺序；Planner 现场重放 `behavior-input.sha256` 为 30/30 OK、`evidence.sha256` 为 20/20 OK，均 exit 0。
- 回执 03 最后一个非空物理行以唯一 `ENGINE_TERMINAL ` marker 开始；JSON 可解析，`state=EXECUTION_SUBMITTED`、`feature_status=VERIFYING`、`remaining_actionable_count=0`、`next_action_type=WAIT_PLANNER`，receipt 指向回执 03。
- 首次远端 PG `08006` 失败日志被保留；同一最终实现快照随后全量成功，故作为历史环境瞬断证据保留，不阻塞通过。

## 3. 已锁定结果

1. `sw-basic-iot-api` 成为零基础设施依赖的契约 Jar；`sw-basic-iot` 原地保留实现，Bootstrap 负责最终装配。
2. 新 API 的 4 接口、7 方法无豁免继承 Phase 1 Optional 规范；Controller 继续使用 `Result<T>`。
3. `bpm-process` 不再通过完整 IoT 获得实现依赖，也不再跨模块访问 IoT Entity/Mapper。
4. 审批事务内无法持久化设备命令意图时 fail closed；意图已持久化后的发送失败保留审批并进入失败/重试恢复链。
5. Knowledge/Agent 未被机械拆分；BAO-02 最终结论保持 `PARTIAL`，本阶段只核销 IoT 部分。

## 4. 接受边界与后续项

- `agent→knowledge` 死 POM 边不在本阶段处理；Knowledge/Agent API/Biz 拆分不成立，不得写成遗漏。
- fastjson2 `2.0.53` 局部版本声明留给 BAO-03；本阶段不宣称 BOM 治理完成。
- IoT 侧持久化原始异常文本尚未脱敏，登记为后续安全观察项；本阶段只证明失败终态与恢复语义。
- `IotFormContractCheckerImpl` 在必需基础设施缺失时抛异常属于 B.3 窄幅纠正，不外推为公开 HTTP 契约改造。
- 当前通过不授权 commit、push、merge、tag、Release、部署或最终仓库展示收口。

## 5. 状态裁决

Phase 5 `iot-api-boundary-extraction` 由 `VERIFYING` 进入功能级 **`PASSED（2026-09-25）`**。总体任务 `backend-architecture-optimization` 继续 `IN_PROGRESS`。

主方向归档：

`product/backend-architecture-optimization/passed/direction-phase5-iot-api-boundary-extraction.md`

终态同步唯一入口：

`product/backend-architecture-optimization/ready/direction-phase5-iot-api-boundary-extraction-terminal-sync.md`

终态同步复核通过前不得写 Phase 5 `COMPLETED`，不得启动 Phase 6、其他 BAO 或最终仓库展示收口。
