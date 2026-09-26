# BAO-02 当前模块边界复核探索 · 回执

> 执行 / 2026-09-24 / 只读，无实施  
> 身份：工作区 `develop-sw@a46e4f3`；后端仓 `develop@76dc947`（257 未提交 = Phase 4 最终工作树）  
> 命令：`MAVEN_OPTS="-Xmx2g" mvn -o -B dependency:tree -pl <5 模块>` 全 exit 0；未 compile/test/install/deploy；工作树零修改  
> 证据：同前缀 7 TSV（依赖边/消费模式/重型链/符号清单/接缝 I1–I12/四去向/范围·非目标·风险·验收）

## 1. 裁决

**`PARTIAL`**：BAO-02 的 **IoT 部分在 Phase 4 后仍成立**，范围收窄为单模块；「Knowledge、Agent 未形成 api/biz 边界」**不成立**（零 Java 跨模块调用面）。三者不得同阶段。

## 2. 九项问答

| # | 答案 |
|---|---|
| Q1 | 直接 POM 消费者 5：`bpm-process→iot`、`agent→knowledge`（compile）、`bootstrap→三者`；Java import 者仅 `bpm-process`（4 生产+2 测试）与 `bootstrap`（4 测试）。**`knowledge`/`agent` 外部 import = 0**。入口：IoT `/iot/*` 9、Agent `/agent/*` 7（前端 2/53 文件）、Knowledge 0 |
| Q2 | 去重类型 **17** = 生产 7 + bootstrap 11 − 重叠 1。facade/port 4（全在 `iot/api`）、事件 1、**entity 1 + mapper 1（生产实现泄漏：`BpmDeviceCommandListener:5-6,35,38,86,91`）**，其余类别 0；实现类型 6 去重不应作契约。反向：`IotEventRuleController:7,27,32,93` 注入 `IotFormContractChecker`，唯一实现在 `bpm-process` ⇒ **运行期互依** |
| Q3 | Phase 4 改 IoT 13 文件 +471/−35、新增 `ProcessTriggerRecoveryJob`；bpm 侧增 `BpmDeviceCommandIntentRecorder`、`IotProcessTriggerListener` 改单事务。须保持 I1–I9（提交边界、幂等索引、终态、恢复调度、装配）。**读码风险（I9）**：intent recorder 事务内无 try/catch 且 `DomainEventPublisher` 不吞异常 ⇒ 设备缺失 404 会传播进审批事务，`saveCommandFailure`（唯一 entity/mapper 用法）在新流程下基本不可达 |
| Q4 | 不同构。**Knowledge** 2 类 29 行（空 `@AutoConfiguration`+1 properties），`sw.knowledge.enabled` 全仓未设置、`db/migration/knowledge` **未接入 Flyway**、无接口 ⇒ 拆 api/biz 只产生空模块。**Agent** 77 文件/7 REST/30 测试，但对 knowledge 的 POM 依赖**零代码零配置引用**。该死边迫使 **9 个 agent 测试类**排除 `PgVectorStoreAutoConfiguration` ⇒ 收益是「删死边+移出 Tika/PDFBox/pgvector」与占位模块存废 |
| Q5 | 不变量：**`-api` 只被业务模块消费、`-biz` 只被 `bootstrap` 消费**。缺资产：`-api`/`-biz` 模块与 POM、DTO、`*ErrorCode`。差异：① IoT 已有 `iot/api` 4 接口 + `iot/event`，契约齐备；② 6 个迁移文件（V40/V59/V66 × h2/postgresql）按通配加载 ⇒ 留 biz；③ **Phase 1 守门冲突（I11）**：白名单 + Optional 规则对任何新 `-api` 生效，而 IoT 4 接口 **7 个方法全返回 `Long/String/void/List<String>`**，纳入即违约；④ 可复用 `scanApiModuleTypes()` 的 classpath+codeSource 扫描范式 |
| Q6 | `bpm-process` ← `iot`：MQTT/Paho 3、GraalJS 13、TencentSDK 2、fastjson2 1；`agent` ← `knowledge`：Tika 24、PDFBox 7、pgvector 4、SpringAI 21、jsoup 1。**全为 compile 传递、无 direct、无仅 test**，落在消费者编译与测试 classpath。`fastjson2`、`tencentcloud-sdk-java-iotexplorer` 同为 BAO-03 的 BOM 外锁定项 |
| Q7 | 最小单元：新建 `sw-basic-iot-api`（4 接口+1 事件，**零依赖**——仅引 `List/Map/Serializable`），`sw-basic-iot` **原地保留为 biz**；改 `bpm-process/pom.xml`、`BpmDeviceCommandListener` 去 entity/mapper、事件包归位。子模块布局会移动 5 个源文件路径并**破坏 `ReliableEventGateTest` 的 5/14 路径字面量**（原地保留则全部仍有效）。**迁移阻塞（I12）**：`bpm-process` 4 个生产文件用 `fastjson2` 却未声明，仅经 `iot` 传递 ⇒ 移除即**编译失败**，须先声明。推荐 **A 仅拆 IoT**；**C 三者同阶段无共同回滚边界**（违反总体方向 §4.2） |
| Q8 | 否。① 7 个既有 `-api` 已带 `sw-common` 传递重依赖并通过 Phase 1 验收，BAO-01 类型层结论本就不成立；② 待迁 5 文件**零引 `sw-common` 类型**，`iot-api` 可零依赖、**不继承 BAO-01**；③ 唯一耦合是 Q5③ 守门适用性 = **Phase 1→Phase 5 顺序约束**。避免捆绑：只裁决「iot-api 是否依赖 sw-common」「`com.sw.ck.iot.api` 是否入白名单」 |
| Q9 | 仅「IoT 契约层抽取」；Knowledge/Agent 移出。非目标/5 风险/4 验收见 `…-phase-scope-risks.tsv`；要点：守门 Optional 规则须先裁决、5 个路径字面量随布局失效、验收含依赖面归零 + `mvn test` 1536/0/0/0 不漂移 + Phase 4 六类接缝回归 |

## 3. 未确认与冲突

未确认：Knowledge 是否有仓外用途；`sw.knowledge`/`sw.agent` 是否由部署环境注入（本仓无证据）；`-api` 是否应采 Optional 契约（规划决策）。  
冲突：Phase 1 守门规则 vs 新 `-api` 既有签名，优先级须 Planner 裁决。  
无需继续探索；最小补证（如需）= intent recorder 失败传播的事务回滚行为用例。
