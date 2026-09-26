# Phase 5 模块边界现状探索 · 规划复核

> 复核角色：规划（Planner）  
> 复核日期：2026-09-24  
> 对象：`search_fallback/backend-module-boundary-phase5-current-seams.md` 及同前缀证据 TSV  
> 复核结论：`PASSED`（探索通过，可形成正式 Phase 5 方向）

## 1. 裁决

探索已回答任务要求的 9 个问题，并把 BAO-02 从“三模块统一拆分”收敛为以下事实裁决：

1. **IoT：`CONFIRMED`**。`bpm-process` 对完整 IoT 实现模块存在直接依赖，并由此获得 MQTT/Paho、GraalJS、Tencent SDK 等实现依赖；同时还存在 entity/mapper 泄漏和运行期反向 SPI 装配，因此具备独立抽取契约层的真实收益。
2. **Knowledge/Agent：本阶段 `NOT_PLANNED`**。仓内不存在 Knowledge/Agent 的 Java 跨模块调用面；强行生成空 `*-api/*-biz` 只会增加结构。`agent→knowledge` 是应另行治理的死 POM 边，不与 IoT 拆分共用回滚边界。
3. **BAO-02 总项：由 `CONFIRMED` 修正为 `PARTIAL`**。Phase 5 仅授权 IoT 契约边界抽取，不授权 Knowledge/Agent 拆分。
4. BAO-01 轻量 Kernel 不是本阶段前置；待迁 IoT 契约只依赖 JDK，可形成零业务/基础设施依赖的 `sw-basic-iot-api`。

## 2. 规划处理的冲突

- **Optional 规则**：新建 `-api` 不是 Phase 1 守门豁免项。现有 4 个 IoT 接口的 7 个方法必须在本阶段迁移为合规 `Optional<T>` 契约；`void` 先改为有意义结果再包装，真实错误仍以异常表达。
- **可靠事件语义**：Phase 5 只改变模块边界，不放宽 Phase 4 的可靠性。事务内无法持久化设备命令意图时必须 fail closed 并回滚审批；意图已持久化后的下游发送失败不得反向回滚已完成审批，而应落失败终态并进入既有恢复/重试路径。
- **实现泄漏**：`BpmDeviceCommandListener` 对 IoT entity/mapper 的依赖必须改为契约调用，不允许把持久化类型搬入 API。
- **fastjson2**：`bpm-process` 必须诚实声明自身直接使用的依赖，版本保持当前解析值；本阶段不宣称 BAO-03 完成，也不扩展为全局 BOM 整理。
- **路径守门**：源文件迁移不能以删除或弱化 Phase 4 守门换取绿色；5 个受影响路径字面量须改为模块/FQCN 可复核定位，14 项可靠事件检查语义保持有效。

## 3. 证据充分性

依赖树命令均退出 0；依赖边、消费者模式、重型传递链、跨模块符号、接缝不变量、方案比较和范围风险均有独立 TSV。探索未执行编译/测试、未修改工作树，符合只读授权。

记录两个不阻塞立项的文档偏差：主回执写“7 TSV”，实际同前缀为 **8 份 TSV**；主回执为 5222 B，略高于探索要求的 5 KB 目标。两项均不改变证据内容或裁决。

## 4. 后续唯一动作

Executor 按正式方向执行：

`product/backend-architecture-optimization/ready/direction-phase5-iot-api-boundary-extraction.md`

本复核不授权 Knowledge/Agent 拆分、全局 BOM 治理、模块重命名、数据库迁移、公开 HTTP 契约变化或 Git/发布操作。
