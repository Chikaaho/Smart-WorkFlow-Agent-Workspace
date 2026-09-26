# Phase 5 · IoT API 模块边界抽取 · 完成回执 01

> 执行角色提交；所属总体任务 `backend-architecture-optimization`（BAO-02，经复核为 `PARTIAL`，本阶段只处理 IoT）  
> 方向：`product/backend-architecture-optimization/ready/direction-phase5-iot-api-boundary-extraction.md`  
> 工作树：工作区 `develop-sw@a46e4f3`；后端 `Smart-WorkFlow-aPaaS-server` `develop@76dc947`（未 commit/push/merge/tag/Release/部署）  
> 证据目录：`../evidence/completion-phase5-01/`  
> 本回执只提交 Executor 自验结果，**不写** `PASSED`/`COMPLETED`，不宣称总体任务完成。

## 1. 功能与内部 Step 概要

| Step | 内容 | 状态 |
|---|---|---|
| S0 | **按方向 §2.D.4 先锁行为**：补两条设备命令事务分界断言并在**迁移前**运行 | COMPLETED |
| S1 | 新建 `sw-basic-iot-api`（4 接口 + 1 事件），`sw-basic-iot` 原地保留为实现模块并反向依赖契约 | COMPLETED |
| S2 | `Optional<T>` 迁移：7 个开放方法 + 全部生产/测试调用方 | COMPLETED |
| S3 | 去实现耦合：`BpmDeviceCommandListener` 移除 entity/mapper；`bpm-process` 依赖改指 `-api`；fastjson2 显式化 | COMPLETED |
| S4 | 守门：Phase 1 白名单纳入新契约模块；`ReliableEventGateTest` 5 个 IoT 定位改 FQCN；新增边界门禁与类路径隔离门禁 | COMPLETED |
| S5 | 验证：受影响模块测试 + 全量 `mvn -B -o test` | COMPLETED |

## 2. 实际修改文件（28 项 = 14 已跟踪修改 + 14 未跟踪；见 `behavior-inputs.txt` 与 `raw/phase5-diffstat.txt`）

**本阶段新增 11 项**：`sw-basic/sw-basic-iot-api/pom.xml` 与 `sw-basic-iot-api/src/main/java/com/sw/ck/iot/api/{IotDeviceFacade,IotProcessTriggerFacade,IotDeviceQueryFacade,IotFormContractChecker}.java`、`.../iot/event/IotProcessTriggerEvent.java`；`sw-bpm-process/.../listener/IotContractBoundaryIsolationTest.java`；`sw-bootstrap/.../phase5/{Phase5PgSupport,Phase5IotApiBoundaryGateTest,Phase5IotApiOptionalSemanticsTest,Phase5PgDeviceCommandBoundaryBehaviourTest}.java`。

**已跟踪修改 14 项**：`sw-basic/pom.xml`（+1 模块）；`sw-basic-iot/pom.xml`（+契约依赖）；`IotDeviceFacadeImpl`/`IotDeviceQueryFacadeImpl`/`IotProcessTriggerFacadeImpl`；`IotEventRuleController`；`IotRuntimeController`；`sw-bpm-process/pom.xml`；`BpmDeviceCommandListener`；`IotProcessTriggerListener`；`IotFormContractCheckerImpl`；`BpmDeviceCommandListenerTest`；`IotProcessTriggerListenerPolicyTest`；`IotFormContractCheckerTest`。合计 `14 files changed, 428 insertions(+), 333 deletions(-)`。

**早期阶段已存在（git 视角未跟踪）、本阶段修改 3 项**：`ApiOptionalContractGate`、`ReliableEventGateTest`（Phase 1/4 资产）、`BpmDeviceCommandIntentRecorder`（Phase 4 资产）。

**实现模块删除 5 项**（契约源文件移出；`removed-from-impl.check` 逐项 ABSENT，旧路径在 `git status` 中为 ` D`，零旧包残留）：4 个接口 + 1 个事件。

## 3. 关键修改摘要

- **契约层**：5 个文件 FQCN 保持不变（`com.sw.ck.iot.api.*` / `com.sw.ck.iot.event.*`），只迁移物理位置；新模块 **依赖声明为空**（依赖树输出 `com.sw.ck:sw-basic-iot-api:jar:0.1.0` 后无任何子节点），JDK 类型签名断言覆盖 superclass/接口/方法返回/参数/异常/字段。
- **Optional<T> 7/7**：`dispatchCommand`/`dispatchCommandIdempotent`/`dispatchByDeviceKey`×2 → `Optional<Long>`；`getDeviceKeyById` → `Optional<String>`；`checkMapping` → `Optional<List<String>>`；`markTriggerResult`(原 void) → `Optional<Boolean>`。两层语义写入 Javadoc 并由行为测试固定。
- **`markTriggerResult` 三层语义**：`of(true)`=本次改写终态；`of(false)`=命中终态保护（合法幂等/零变更，**不得伪装 empty**）；`empty`=无该幂等键记录。
- **消费方**：`BpmDeviceCommandIntentRecorder` 在 `empty` 与门面缺装配时 **fail closed 抛出**（审批事务整体回滚）；`BpmDeviceCommandListener` 只经契约交互，移除 `IotDeviceCommandMapper`/`IotDeviceCommand` 依赖与 `saveCommandFailure`/`desensitizeError`；`IotProcessTriggerListener` 三处回写经 `writeBackTriggerResult` 显式消费并记录三种结果；`IotEventRuleController` 对 `empty` 返回 400 fail closed。
- **依赖所有权**：`bpm-process` 声明 9 个 `-api` 契约 + `fastjson2 2.0.53`（局部版本声明），不再声明 `sw-basic-iot`。
- **守门**：`ApiOptionalContractGate.API_BASE_PACKAGES` 追加 `com.sw.ck.iot.api` / `com.sw.ck.iot.event`（归属仍由 code source 过滤，实现模块类型不被纳入）；`ReliableEventGateTest` 新增 `resolveByFqcn/readByFqcn/readCodeByFqcn`，5 个 IoT 定位改为 FQCN（命中 0 或 >1 即失败）。

## 4. 实际命令与原始结果（原始日志见 `command-results.tsv` 与 `raw/`）

| 命令 | 结果 |
|---|---|
| `mvn -B -o test -Dtest=Phase5PgDeviceCommandBoundaryBehaviourTest`（**迁移前**） | exit 0，**3/3**；`raw/00-boundary-lock-before-migration.log` |
| `mvn -B -o compile` | exit 0 |
| `mvn -B -o test-compile` | **exit 1**（预期）：`BpmDeviceCommandListenerTest` 仍 import `com.sw.ck.iot.entity/mapper` —— 实现泄漏移除的直接证明 |
| `mvn -B -o test -Dtest='ApiOptionalContractGateTest,ReliableEventGateTest,IotContractBoundaryIsolationTest,...'` | exit 0；Phase1 门禁 6/6、Phase4 门禁 **7/7**、类路径隔离 4/4、监听器 5/5、策略 1/1、契约校验 1/1 |
| `mvn -B -o test -Dtest='Phase5IotApiBoundaryGateTest,Phase5IotApiOptionalSemanticsTest,Phase5PgDeviceCommandBoundaryBehaviourTest'` | exit 0；静态门禁 6/6、两层语义 5/5、两条分界 3/3（后两者共用一次迁移：`skipped=already-migrated-in-this-jvm`） |
| `mvn -B -o test-compile dependency:tree` | exit 0；`raw/dep-tree-*.log` |
| `mvn -B -o test`（全量，最终快照） | 见 §8 门禁 6 |

**行为事实（原始控制台行）**：

- 分界一（迁移后）：`boundary.in-tx-record-failure ... failureType=BaseException engineTask=t1 intents=0`
- 分界二（迁移后）：`boundary.post-persist-send-failure ... engineTask=t2 intentRows=1 retryCount=2 status=FAILED`
- 对照：`boundary.positive-control ... engineTask=t2 intents=1 status=QUEUED`
- 两层语义：`dispatch-idempotent present=2 rows=1 status=QUEUED`；`dispatch-command exception=device-not-found empty=0`；`dispatch-by-device-key present=1 unknown=empty noRoute=empty commandRows=1`；`get-device-key-by-id present=1 empty=1`；`mark-trigger-result firstWrite=true repeatWrite=false lateFailure=false unknownKey=empty terminalState=SUCCESS`
- 依赖面：`bpm-process` 依赖树解析构件 **145 → 116**（同一解析口径）；`paho|integration-mqtt|graalvm|truffle|tencentcloud` 命中 **0**；`com.sw.ck:sw-basic-iot:` 命中 **0**；`fastjson2` 为 `+- ` 直接依赖（depth 1, compile）；`sw-basic-iot-api` 依赖树为空（解析构件 0）。
- 哈希：行为输入 **28/28 OK**（`check_exit=0`）；证据 **18/18 OK**（`check_exit=0`）；秘密扫描 **CLEAN**。

## 5. 与方向的偏差（须 Planner 裁决）

1. **D.5 的前提修正**：方向称 5 个 IoT 路径字面量「受影响」。实测因 §2.A.2 选择原地保留 `sw-basic-iot`，这 5 个源文件路径**未移动**、门禁并未失效。仍按 D.5 改为 FQCN 定位（语义与失败能力不变且更强）。其余 9 个字面量未改，14 项检查全数保留（`ReliableEventGateTest` 7/7 通过）。
2. **B.2「结果类型」与门禁 1「类型清单准确为 4 接口 + 1 事件」的张力**：`markTriggerResult` 原为 `void`，B.2 要求改为有业务意义的结果类型，但门禁 1 要求契约类型清单严格为 4 接口 + 1 事件。为同时满足两者，采用 **JDK 结果类型** `Optional<Boolean>`（true=已改写 / false=合法幂等跳过 / empty=目标缺失），未新增枚举或 DTO。**如需专用结果类型，需 Planner 明确放宽门禁 1。**
3. **`IotFormContractCheckerImpl` 基础设施失败改为抛出**：原实现把「表单服务未装配」作为一条校验错误返回（HTTP 400）；按 B.3「基础设施失败继续抛出」改为 `IllegalStateException`。该分支仅在装配缺失时可达（正常装配下 `FormDefinitionService` 恒存在），但触发时 HTTP 状态会由 400 变为 500 —— 属方向驱动的语义纠正，**如实登记**。
4. **`saveCommandFailure` 移除的连带影响**：该分支是「下发失败时落库一条 FAILED 命令 + 脱敏错误文本」的唯一位置。迁移后发送失败状态与文本由 IoT 侧既有补偿调度承担（`CommandCompensationJob` + `CommandQueueService`），原始异常仍按既有行为由 `log.error` 记录。**IoT 侧错误文本未做脱敏**（`IotDeviceMqttDispatchService` 直接存 `e.getMessage()` 截断），本次未扩面处理，登记为后续观察项。
5. **测试基础设施加固**：Phase 5 三个 PG 类改为同 JVM 内只迁移一次（`cleanMigrateOnce`），把远端 PostgreSQL 的 clean+migrate 从 3 次降到 1 次。原因是首次最终全量门禁在 bootstrap 阶段出现一次 `SQLState 08006` 远端连接 I/O 中断（详见 §6）。

## 6. 问题、未完成内容与风险

- **首次最终全量门禁失败（已定位为环境瞬断，非本阶段缺陷）**：`Phase5PgDeviceCommandBoundaryBehaviourTest.bootAll → cleanMigrate` 在 631s 后抛 `FlywayMigrateException: Script V17__init_job_tables.sql failed / SQL State 08006 - An I/O error occurred while sending to the backend`。定向重跑同一类 **3/3 通过（67s）**；该失败发生在 1.5 小时连续远端 PG 压力之后，属连接层 I/O 中断。已通过 §5.5 降低重复迁移次数；**该失败运行的完整日志保留为 `raw/full-server-gate-run-with-transient-io-error.log.gz`**，最终快照全量门禁 `raw/full-server-gate.log` 已完成复核。
- **未完成（明确不在本阶段授权内）**：Knowledge/Agent 拆分与 `agent→knowledge` 死边清理；BAO-01/03/04/08/09/10；`fastjson2` 局部版本声明收敛进 `sw-dependencies`（BAO-03 待统一项）；IoT 侧错误文本脱敏。
- **残余风险**：① `-api` 的 `sw-common` 依赖策略按「零依赖」落地，与其他 `-api` 模块（依赖 `sw-common`）不一致——本模块契约类型不需要 `sw-common`，若后续新增类型需要则须重新评审；② `dispatchCommand`/`dispatchCommandIdempotent` 在当前实现下恒为 present，empty 分支为防御性 fail-closed，未能在真实路径上构造 empty 证据；③ `IotProcessTriggerListener` 内既有的 `existing.get()`（`BpmInstanceService` 既有契约，非本阶段 7 方法）未改动。

## 7. Git diff 摘要

仅工作树变更，**无任何 Git 写操作**。新 `sw-basic-iot-api` 为未跟踪目录；5 个契约文件表现为「实现模块删除 + 契约模块新增」，FQCN 不变。`sw-basic/pom.xml` 模块数 31 → 32。后端脏条目 257 → 269（Phase 5 净增 12 条）。`sw-bootstrap/target/bootstrap.jar`（运行中服务的制品）**未被删除**。

## 8. 与方向 §4 验收门禁逐项对照

| # | 门禁 | 结果 | 原始证据 |
|---|---|---|---|
| 1 | 契约类型清单准确 4 接口 + 1 事件；无非 JDK 类型与 `sw-common`/基础设施依赖 | **PASS** | `P5-GATE gate1 contract-files=5 interfaces=4 events=1 open-methods=7 nonJdkImports=0`；`gate1.pom dependencies=0 jdk-only-signatures=5`；`dep-tree-sw-basic-iot-api.log` 依赖树为空 |
| 2 | 新 API 开放方法 7/7 `Optional<T>`，无 void/primitive/裸集合、无违规消费 | **PASS** | `P5-GATE gate2 iot-types=5 optional-methods=7 violations=0`；`ApiOptionalContractGateTest` 6/6；`gate4 ... orElseNull=0` |
| 3 | `bpm-process→sw-basic-iot` 直接依赖 0；树中 MQTT/Paho、GraalJS、Tencent SDK 为 0；fastjson2 为直接依赖 | **PASS** | `dep-tree-sw-bpm-process.log`：heavy 命中 0、`sw-basic-iot` 命中 0、`+- com.alibaba.fastjson2:fastjson2:jar:2.0.53:compile`；`P5-GATE gate3 ...` |
| 4 | entity/mapper 跨模块引用 0；Bootstrap 装配四项契约实现与反向 SPI，无循环依赖、无重复 Bean | **PASS** | `production_hits=0`、`import` 扫描 0；`IotContractBoundaryIsolationTest` 4/4（实现类型与 MQTT/GraalJS/Tencent 全部 `ClassNotFoundException`，契约类型可达） |
| 5 | Phase 4 两条设备命令事务分界均有正反断言；既有六类接缝、发布矩阵、零旁路与规则守门受影响部分通过 | **PASS** | 迁移前/后各 3/3；`ReliableEventGateTest` **7/7**（14 项检查保留）；`Phase4Pg*BehaviourTest` 全绿（Lifecycle 7/7、Delivery 8/8、Flow 9/9、Migration 3/3、TransactionFact 2/2、StartWindowCrash 3/3、CommitBoundary 3/3、RestartRecovery 1/1） |
| 6 | 受影响模块与全量 `mvn -B -o test` 以 1536/0/0/0 为最低基线，failures/errors/skipped 为 0 并解释数变化 | **PASS** | 见下方「全量门禁」小节 |
| 7 | 依赖树/扫描/测试/行为输入/日志形成哈希清单并回读成功；秘密扫描不含 PG 连接值或其他凭据 | **PASS** | `behavior-input.check` 28/28 OK；`evidence.check` 15/15 OK；`secrets-scan.txt` = CLEAN |
| 8 | 无新 Flyway 迁移、无公开 HTTP 契约变化、无 Knowledge/Agent/BOM 扩面、无运行产物进入 Git 边界 | **PASS** | `P5-GATE gate8 iot-migrations=6 apiRoutes=0 httpRoutes=9 routesUnchanged=true`；`sw-basic-iot-api` 无 `db/migration` 与 `@RequestMapping`；Knowledge/Agent 未改动；BOM 未改动（fastjson2 为模块内局部版本） |

**全量门禁（门禁 6）**：`MAVEN_OPTS="-Xmx2g" mvn -B -o test`，**BUILD SUCCESS，16:08 min**，模块数 32（原 31，新增 `sw-basic-iot-api`）；原始日志 `raw/full-server-gate.log`。

- 总数 **1555 tests / 0 failures / 0 errors / 0 skipped**（Phase 4 基线 1536/0/0/0，仅新增测试，无删除）。
- 测试数变化 **+19** 全部可归因：`sw-bpm-process` 205 → 210（新增 `IotContractBoundaryIsolationTest` 4 项；`BpmDeviceCommandListenerTest` 因职责边界改写由 4 项变为 5 项）；`sw-bootstrap` 新增 Phase 5 三类共 14 项（静态门禁 6 + 两层语义 5 + 两条分界 3）。
- 未受影响模块计数保持一致：Common 32、Notify-Biz 118、Job-Biz 51、IoT 50、Form-Biz 159、BPM-Engine 61、OpenAPI-Biz 10。
- 该次运行中 Phase 5 三类：`Phase5IotApiBoundaryGateTest` 6/6、`Phase5IotApiOptionalSemanticsTest` 5/5、`Phase5PgDeviceCommandBoundaryBehaviourTest` 3/3；Phase 1 `ApiOptionalContractGateTest` 6/6；Phase 4 十类（含 `ReliableEventGateTest` 7/7）全绿。

## 9. 自验结论

- 方向 §2 必须实施的 A/B/C/D 四组要求全部落地；§4 八项门禁逐项通过。
- 方向 §5 停止条件均未触发：未修改 Phase 4 数据模型/迁移；同事务边界保持（迁移前后行为断言一致）；实现类型未进入 API；无 Maven 循环（`iot-api` 零依赖，`sw-basic-iot → iot-api` 单向）；未同时拆 Knowledge/Agent；全量门禁无非本阶段可归因失败。
- 未以删除测试、降低断言、恢复跨模块 Entity/Mapper 访问、保留完整 IoT 依赖或放宽 Optional 规则换取通过。
- **执行自验不等于 Planner 功能级验收**；本回执不写 `PASSED`/`COMPLETED`。
