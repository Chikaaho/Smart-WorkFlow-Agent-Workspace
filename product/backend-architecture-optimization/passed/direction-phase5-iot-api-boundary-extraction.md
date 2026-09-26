# Phase 5 · IoT API 模块边界抽取方向

> 下发角色：规划（Planner）  
> 指定实施角色：执行（Executor）  
> 所属总体任务：`backend-architecture-optimization`  
> 对应候选：BAO-02（经复核为 `PARTIAL`，本阶段只处理 IoT）  
> 任务等级：XL  
> 状态：PASSED（规划功能级验收通过，2026-09-25；待终态同步）  
> 日期：2026-09-24

## 1. 目标

把 IoT 跨模块调用契约从完整实现 Jar 中抽离为轻量 `sw-basic-iot-api`，使 `bpm-process` 只依赖契约，不再传递获得 MQTT/Paho、GraalJS、Tencent IoT 等实现依赖；同时把新 API 全量纳入 Phase 1 的 `Optional<T>` 内部结果规范，并保持 Phase 4 已验收的可靠业务事件语义。

本阶段采用单一回滚边界：**IoT 契约抽取 + 对应消费者迁移 + 边界/可靠性守门**。不把 Knowledge、Agent、BOM 全局治理或其他 BAO 混入。

## 2. 必须实施

### A. 模块拓扑

1. 新建 `sw-basic-iot-api`，仅承载现有 4 个跨模块接口与 1 个跨模块事件；其编译依赖保持为 JDK 类型，不依赖 `sw-common`、Web、Redis、MyBatis、数据源、MQTT、GraalJS、Tencent SDK 或 IoT 实现模块。
2. `sw-basic-iot` 原地保留为实现模块并依赖 `sw-basic-iot-api`；本阶段不改名为 `*-biz`，避免扩大 POM、迁移和守门路径变更。
3. `bpm-process` 只能依赖 `sw-basic-iot-api`，不得再依赖完整 `sw-basic-iot`；Bootstrap 负责最终装配实现模块与消费者。
4. 契约类型的 FQCN 原则上保持稳定；物理源路径可迁移到新模块。确需改包时必须迁移全部生产/测试消费者并提供零旧包残留证据。
5. IoT 的数据库迁移、Controller、Service、Mapper、Entity、任务、脚本、MQTT/Graal/Tencent 适配和配置全部留在实现模块。

### B. Optional 契约

1. 新模块所有开放给其他模块调用的方法均强制返回 `Optional<T>`；现有 4 个接口、7 个方法必须全部纳入，不设白名单豁免。
2. 原 `void` 方法先改为有业务意义的结果类型再包装；primitive 使用包装类型；集合明确区分 `Optional.empty()` 与 `Optional.of(emptyCollection())`。
3. “正常缺失”映射为 empty；校验失败、基础设施失败、状态冲突等真实错误继续抛出异常，不得吞为 empty。
4. 所有生产调用方必须显式消费 Optional，不得 `get()`、`orElse(null)`、返回值丢弃或隐式恢复旧 null 语义。
5. Controller/HTTP 边界继续使用 `Result<T>`，不得直接序列化 Optional 或形成 `Result<Optional<T>>`。

### C. 实现泄漏与依赖所有权

1. 删除 `BpmDeviceCommandListener` 对 IoT entity/mapper 的跨模块访问；所需状态变更通过 API port/facade 表达，API 不得暴露 Entity、Mapper、DO、Page 或基础设施类型。
2. 保持 `IotFormContractChecker` 的反向 SPI：接口位于 API，BPM 提供实现，Bootstrap 装配；不得形成 Maven 循环依赖。
3. `bpm-process` 对 fastjson2 的现有源码使用必须变成直接依赖，不再借 IoT 传递获得。版本保持当前解析值，不升级、不扩展为 BAO-03 全局 BOM 改造；若新增局部版本声明，回执须明确登记为 BAO-03 待统一项。
4. `bpm-process` 的编译/测试依赖树中，完整 IoT 实现、MQTT/Paho、GraalJS、Tencent IoT SDK 必须归零；fastjson2 只允许作为诚实的直接依赖存在。

### D. Phase 4 可靠性不变量

1. 审批设备命令的持久意图仍与审批状态处于同一事务提交边界；无法持久化意图（含目标设备不存在）时 fail closed，审批不得单边成功。
2. 意图已持久化后，下游发送失败不得回滚已完成审批；必须记录失败/重试状态并由既有恢复调度继续处理。
3. 稳定业务幂等键、唯一约束、有限重试、租约回收、可审计终态及重启恢复语义不得弱化。
4. 先补行为断言锁定“事务内记录失败”和“持久化后发送失败”两条分界，再实施边界迁移；若当前运行行为与本方向冲突，停止扩大改动并在回执中单列差异与修复证据。
5. `ReliableEventGateTest` 等 14 项检查不得因源路径变化而删减；受影响的 5 个路径字面量改为模块/FQCN 可复核定位，检查语义和失败能力保持不变。

## 3. 非目标

- 不拆分或新建 `knowledge-api/biz`、`agent-api/biz`；不在本阶段删除 `agent→knowledge` 死 POM 边。
- 不实施 BAO-01、BAO-03/04/08/09/10，不升级第三方版本，不全局整理 BOM。
- 不更改公开 HTTP 路由、请求/响应结构、权限语义、数据库表结构、Flyway 迁移或业务功能计数。
- 不重命名现有 `sw-basic-iot` artifact，不把实现 DTO/Entity/Mapper 下沉到 API。
- 不授权 commit、push、merge、tag、Release、部署或历史改写。

## 4. 验收门禁

Executor 必须提交可复跑证据并至少证明：

1. 新模块 API 类型清单准确为 4 接口 + 1 事件；编译依赖扫描无非 JDK 类型，无 `sw-common` 或基础设施依赖。
2. 新 API 的开放方法扫描为 7/7 `Optional<T>` 合规；无 `void`、primitive、裸集合/对象返回，无违规消费模式。
3. `bpm-process→sw-basic-iot` 直接依赖为 0，且其 dependency tree 中 MQTT/Paho、GraalJS、Tencent IoT SDK 为 0；fastjson2 为直接依赖。
4. entity/mapper 跨模块引用为 0；Bootstrap 中四项 API 实现与反向 SPI 均可启动装配，无循环依赖、无重复 Bean。
5. Phase 4 两条设备命令事务分界行为均有正反断言；既有六类接缝、发布矩阵、零旁路与规则守门的受影响部分全部通过。
6. 受影响模块测试全部通过；后端全量 `mvn -B -o test` 以 Phase 4 的 1536/0/0/0 为最低基线，允许新增测试使总数上升，但 failures/errors/skipped 必须为 0，并解释测试数变化。
7. 依赖树、扫描、测试、行为输入与关键日志形成哈希清单并回读成功；秘密扫描不得包含 PG 连接值或其他凭据。
8. 无新 Flyway 迁移、无公开 HTTP 契约变化、无 Knowledge/Agent/BOM 扩面、无运行产物进入 Git 边界。

## 5. 回滚与停止条件

- 回滚单元为新模块 POM/聚合声明、5 个契约源文件、IoT 实现依赖、BPM 消费者及对应守门/测试；不涉及数据库回滚。
- 任一情况下停止扩大实施并回传：需要修改 Phase 4 数据模型/迁移；无法保持同事务边界；需要把实现类型放入 API；出现无法消除的 Maven 循环；必须同时拆 Knowledge/Agent 才能编译；全量门禁出现非本阶段可归因失败。
- 不得以删除测试、降低断言、恢复跨模块 Entity/Mapper 访问、保留完整 IoT 依赖或放宽 Optional 规则换取通过。

## 6. 完成回执

提交：

`product/backend-architecture-optimization/receipts/completion-phase5-iot-api-boundary-extraction-01.md`

回执必须区分 Executor 自验与 Planner 验收，状态先写 `EXECUTION_SUBMITTED`，不得自行写 `PASSED`、`COMPLETED` 或宣称总体任务完成。
