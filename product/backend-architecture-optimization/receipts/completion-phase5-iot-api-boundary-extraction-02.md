# Phase 5 · Bootstrap 装配与机器终态 · 补正回执 02

> 执行角色提交；所属总体任务 `backend-architecture-optimization`（BAO-02，Phase 5）  
> 引用：`completion-phase5-iot-api-boundary-extraction-01.md`（不改写）  
> 执行单：`planning-execution-prompt-phase5-iot-api-boundary-supplement-01.md`  
> 规划复核：`planning-review-completion-phase5-01-verifying.md`（结论 `VERIFYING`，待补 G1/G2）  
> 工作树：工作区 `develop-sw@a46e4f3`；后端 `Smart-WorkFlow-aPaaS-server` `develop@76dc947`  
> 证据目录：`../evidence/completion-phase5-01/`（与 01 同目录追加，未删除任何历史证据）  
> 本回执只提交 Executor 自验结果，**不写** `PASSED`/`COMPLETED`，不归档方向，不执行 Git 写操作。

## 1. 本轮范围

只做执行单两项，不重做主体实现、不扩展范围：

| 项 | 内容 | 状态 |
|---|---|---|
| G1 | Bootstrap 真实生产装配断言（四类契约 Bean 各 1、实现归属、IoT Controller 反向 SPI 注入、无循环/重复/缺 Bean） | COMPLETED |
| G2 | 机器终态与证据计数补正（本回执末尾为可解析 `ENGINE_TERMINAL`；哈希计数按实际文件数给出） | COMPLETED |

新增文件 2 个（均为 `sw-bootstrap` 测试资产，不触碰生产代码）：
`sw-bootstrap/src/test/java/com/sw/ck/bootstrap/phase5/Phase5BootstrapAssemblyTest.java`、
`sw-bootstrap/src/test/java/com/sw/ck/bootstrap/phase5/BootstrapTestFixtureExcludeFilter.java`。

## 2. G1 · Bootstrap 实际装配（真实 `StarterApplication`）

### 2.1 装配入口与环境

- 入口为**生产类** `com.sw.ck.bootstrap.StarterApplication`（`@SpringBootApplication(scanBasePackages="com.sw.ck")` + `@MapperScan`），加载生产 `application.yml` 与全部模块真实自动配置；**没有**使用 `ProdBootTestApplication` 或任何测试专用入口替身。
- 与真实运行的唯一差异是连接目标：主数据源指向 Phase 5 专用库 `sw_p5_evidence`（只引用 `PG_HOST/PG_PORT/PG_USERNAME/PG_PASSWORD` 变量名，值不落盘），迁移由测试显式执行。
- 日志：`raw/g1-bootstrap-assembly-test.log`（原始控制台行全部保留）。

### 2.2 实测断言（4/4 通过）

原始控制台行（来自 `raw/g1-bootstrap-assembly-test.log`）：

```
[P5-G1] g1.1 deviceFacade=1 processTriggerFacade=1 deviceQueryFacade=1 formContractChecker=1 duplicates=0 missing=0
[P5-G1] g1.2 iotFacades=3 from=sw-basic-iot reverseSpi=1 from=sw-bpm-process contractTypesFrom=sw-basic-iot-api
[P5-G1] g1.3 controller=IotEventRuleController reverseSpiResolved=true impl=com.sw.ck.bpm.process.service.IotFormContractCheckerImpl sameSingletonAsContainer=true
[P5-G1] g1.4 contextActive=true allowCircularReferences=null formContractCheckerBeans=1
[P5-G1] production-entry-context=started entry=com.sw.ck.bootstrap.StarterApplication database=sw_p5_evidence credentials=redacted
```

| 断言 | 结果 |
|---|---|
| G1-1 四类契约 Bean 各恰好 1 个（无缺 Bean、无重复 Bean） | PASS |
| G1-2 三个 IoT 门面实现来自 `sw-basic-iot`（`IotDeviceFacadeImpl`/`IotProcessTriggerFacadeImpl`/`IotDeviceQueryFacadeImpl`）；`IotFormContractChecker` 实现来自 `sw-bpm-process`（`IotFormContractCheckerImpl`）；契约类型来自 `sw-basic-iot-api` | PASS |
| G1-3 IoT 规则 Controller（`IotEventRuleController`）在最终装配中取得反向 SPI，解析结果为 BPM 实现，且与容器中契约单例是**同一个 Bean** | PASS |
| G1-4 上下文可启动且 `spring.main.allow-circular-references` 未开启（无循环依赖不是靠放开限制换来的） | PASS |

### 2.3 探测过程中发现的两个非缺陷事实（如实登记）

1. **测试类路径夹具冲突（非装配缺陷）**：直接以生产入口启动时，`com.sw.ck.bootstrap.p4overlap.OverlapH2TestConfig`（测试夹具）与生产 `MybatisPlusConfig` 争夺同一个 `commonMetaObjectHandler` Bean 名，导致 `BeanDefinitionOverrideException`。原因是本模块**测试类路径**上的测试夹具也位于 `com.sw.ck.*` 下，会被 `scanBasePackages="com.sw.ck"` 扫到；真实运行不含 `test-classes`，故不构成装配缺陷。处理方式是用 Spring Boot 的 `TypeExcludeFilter`（`BootstrapTestFixtureExcludeFilter`）只排除两个测试夹具类（`OverlapH2TestConfig`、`ProdBootTestApplication`），业务模块与自动配置一律不排除；排除名单硬编码在过滤器 `match()` 内，可直读复核。
2. **CGLIB 代理实例字段为 null（Spring AOP 机制，非装配缺陷）**：`IotEventRuleController` 带 `@PreAuthorize`，容器内是 CGLIB 方法安全代理；该代理由 Objenesis 创建、不调用构造器，因此代理实例上继承的 `formContractCheckerProvider` 字段为 null。装配事实在被代理的目标对象上，测试按 `Advised.getTargetSource().getTarget()` 取目标实例后再断言（`raw/g1-bootstrap-assembly-test.log` 含定位过程）。

**因此本轮没有暴露需要修复的生产装配缺陷，主体实现未改动。**

## 3. G2 · 最终快照全量门禁

见 §6；原始日志 `raw/full-server-gate-after-g1.log`（本轮补证落定后的最终快照）。

## 4. 证据计数补正（单一正确值）

- `behavior-input.sha256` / `behavior-input.check`：**30 行 / 30 OK**（01 的 28 项 + 本轮 2 个新测试资产），`check_exit=0`。
- `evidence.sha256` / `evidence.check`：**20 行 / 20 OK**（01 冻结时为 18 项，本轮追加 G1 定向日志与两次全量门禁日志后按实际文件数冻结）。
- 01 回执 §8 门禁 7 中的「`evidence.check` 15/15」是**过时值**，正确值为冻结时的 18/18；本回执以本节数值为准，01 不改写。
- 哈希回读 `check_exit=0`；秘密扫描 **CLEAN**（无 PG 连接值或其他凭据字面量）。
- 首次 PG `08006` 失败日志保留：`raw/full-server-gate-run-with-transient-io-error.log.gz`（未删除历史失败证据）。

## 5. 与执行单逐项对照

| # | 执行单要求 | 结果 |
|---|---|---|
| 1.1 | 四类契约 Bean 各恰好 1 | PASS（G1-1，`Bean 数量=1`×4） |
| 1.2 | 三个 IoT facade 来自 IoT 实现模块、`IotFormContractChecker` 来自 BPM 实现 | PASS（G1-2，类名 + code source 双重断言） |
| 1.3 | IoT 规则 Controller 取得反向 SPI；启动无循环依赖、无重复 Bean、无缺 Bean | PASS（G1-3/G1-4） |
| 1.4 | 使用最终 Bootstrap 生产自动配置组合，不用测试替身绕过真实装配 | PASS（入口为生产 `StarterApplication`，见 §2.1/§2.3） |
| 2.1 | 补证落定后重跑全量，总数 ≥ 1556，0/0/0；计数不同须解释 | PASS（见 §6：1559/0/0/0） |
| 2.2 | 重新冻结、回读 exit 0、秘密扫描 CLEAN、不写 PG 连接值 | PASS |
| 2.3 | 登记实际文件数（28/28 与 18/18 为旧基线，不得写 15/15） | PASS（§4） |
| 2.4 | 首次 `08006` 失败日志保留 | PASS（`raw/full-server-gate-run-with-transient-io-error.log.gz`） |
| 3 | 新增补正回执 02，末尾非空物理行为可解析 `ENGINE_TERMINAL` | PASS（本文件末行） |

## 6. 全量门禁与计数解释

- 命令：`MAVEN_OPTS="-Xmx2g" mvn -B -o test`；**BUILD SUCCESS，16:18 min**，32 模块；运行窗口 `23:13:55–23:30:05`，30 个行为输入的最新 mtime 为 `23:11:52`，即门禁跑在补证后的冻结快照上。原始日志 `raw/full-server-gate-after-g1.log`。
- 总数 **1559 tests / 0 failures / 0 errors / 0 skipped**，≥ 执行单要求的 1556。
- 计数解释：01 基线 1555 = Phase 4 的 1536 + Phase 5 主体 19。本轮新增 `Phase5BootstrapAssemblyTest` **4** 个用例（执行单预估 +1 是按「一个测试类」估算；实际按四项断言拆为 4 个用例），故 **1559 = 1555 + 4**。无删除、无跳过。
- 未受影响模块计数保持不变：Common 32、Notify-Biz 118、Job-Biz 51、IoT 50、Form-Biz 159、BPM-Engine 61、OpenAPI-Biz 10、Agent 346、System-Biz 305、Storage-Biz 29、Security 17；`sw-bpm-process` 210。

## 7. 残余风险与未完成项

- 沿用 01 回执 §6/§7 的既有登记：IoT 侧持久化异常文本未脱敏（Planner 已裁为非阻塞残余风险）；`fastjson2` 局部版本声明待 BAO-03 收敛；Knowledge/Agent 与 BOM 未在本阶段范围。
- 本轮无新增残余风险；未触碰生产代码，未改公开 HTTP 契约、数据库迁移或 BOM。

## 8. 自验结论

- 执行单 G1/G2 全部落地；Phase 5 方向 §4 八项门禁在补证后仍然全部成立（门禁 4 的「Bootstrap 装配」项由本轮 G1 直接证明）。
- **执行自验不等于 Planner 功能级验收**；本回执不写 `PASSED`/`COMPLETED`，不归档主方向，不推进后续 BAO。

## 9. 机器终态

{"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"XL","receipt":"product/backend-architecture-optimization/receipts/completion-phase5-iot-api-boundary-extraction-02.md","evidence":["product/backend-architecture-optimization/receipts/completion-phase5-iot-api-boundary-extraction-02.md","product/backend-architecture-optimization/receipts/evidence/completion-phase5-01/behavior-input.sha256","product/backend-architecture-optimization/receipts/evidence/completion-phase5-01/behavior-input.check","product/backend-architecture-optimization/receipts/evidence/completion-phase5-01/evidence.sha256","product/backend-architecture-optimization/receipts/evidence/completion-phase5-01/evidence.check","product/backend-architecture-optimization/receipts/evidence/completion-phase5-01/command-results.tsv","product/backend-architecture-optimization/receipts/evidence/completion-phase5-01/raw/g1-bootstrap-assembly-test.log","product/backend-architecture-optimization/receipts/evidence/completion-phase5-01/raw/full-server-gate-after-g1.log","product/backend-architecture-optimization/receipts/evidence/completion-phase5-01/raw/full-server-gate-run-with-transient-io-error.log.gz","product/backend-architecture-optimization/receipts/evidence/completion-phase5-01/raw/00-boundary-lock-before-migration.log","product/backend-architecture-optimization/receipts/evidence/completion-phase5-01/raw/implementation-coupling-scan.txt","product/backend-architecture-optimization/receipts/evidence/completion-phase5-01/raw/phase5-diffstat.txt","product/backend-architecture-optimization/receipts/evidence/completion-phase5-01/removed-from-impl.check","product/backend-architecture-optimization/receipts/evidence/completion-phase5-01/secrets-scan.txt","product/backend-architecture-optimization/receipts/evidence/completion-phase5-01/workspace-identity.txt"],"feature_status":"VERIFYING","work_items":[{"id":"G1 Bootstrap 真实生产装配断言","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"Phase5BootstrapAssemblyTest 4/4；四类契约 Bean 各 1、实现归属正确、反向 SPI 注入同一单例、无循环/重复/缺 Bean"},{"id":"G2 机器终态与证据计数补正","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"本回执末行为可解析 ENGINE_TERMINAL；哈希计数按实际值 30/30 与 20/20，15/15 为过时值已在 §4 更正"},{"id":"补证后重跑全量门禁","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"1559/0/0/0，BUILD SUCCESS 16:18 min，32 模块；≥ 执行单要求的 1556"},{"id":"重新冻结证据并保留 08006 历史失败日志","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"behavior-input 30/30、evidence 20/20 回读 exit 0；秘密扫描 CLEAN；08006 日志保留未删"}],"remaining_actionable_count":0,"independent_work_exhausted":true,"next_action":"请规划复核 completion-phase5-iot-api-boundary-extraction-02.md：核对 G1 真实 Bootstrap 装配断言原始日志（raw/g1-bootstrap-assembly-test.log）与补证后全量门禁（raw/full-server-gate-after-g1.log，1559/0/0/0），并对 Phase 5 作功能级验收裁决。回执只提交执行自验，未写 PASSED/COMPLETED，未归档主方向。","next_action_type":"WAIT_PLANNER","progress_fingerprint":"938637d7a36ea6dd","progress_basis":{"files_changed":["sw-bootstrap/src/test/java/com/sw/ck/bootstrap/phase5/Phase5BootstrapAssemblyTest.java","sw-bootstrap/src/test/java/com/sw/ck/bootstrap/phase5/BootstrapTestFixtureExcludeFilter.java"],"tool_actions":["以生产入口 StarterApplication 启动真实 Bootstrap ApplicationContext 并断言四类契约 Bean 数量/实现归属/反向 SPI 注入","mvn -B -o test -Dtest=Phase5BootstrapAssemblyTest（定向 4/4，日志 raw/g1-bootstrap-assembly-test.log）","补证落定后重跑 mvn -B -o test 全量（1559/0/0/0，BUILD SUCCESS 16:18 min）","bash freeze-phase5-evidence.sh：行为输入 30/30、证据 20/20 哈希回读 exit 0"],"new_evidence":["raw/g1-bootstrap-assembly-test.log","raw/full-server-gate-after-g1.log","behavior-input.sha256(+.check) 30 项","evidence.sha256(+.check) 20 项"],"closed_work_items":["G1 Bootstrap 实际装配证据缺失","G2 机器终态与计数不一致"]},"stop_reason":"WAITING_FOR_PLANNER","tool_results":[{"tool":"spring-context","outcome":"SUCCEEDED","detail":"真实 StarterApplication 上下文启动成功：IotDeviceFacade/IotProcessTriggerFacade/IotDeviceQueryFacade 各 1 个且实现来自 sw-basic-iot，IotFormContractChecker 1 个且实现来自 sw-bpm-process；IotEventRuleController 取得反向 SPI（同一契约单例）；allow-circular-references 未开启"},{"tool":"maven","outcome":"SUCCEEDED","detail":"补证后全量 mvn -B -o test：32 模块 1559 tests，0 failures/0 errors/0 skipped，BUILD SUCCESS 16:18 min；Phase5 四类 4/5/6/3 全绿"},{"tool":"bash","outcome":"SUCCEEDED","detail":"行为输入 30/30、证据 20/20 哈希回读 exit 0；秘密扫描 CLEAN（30 个行为输入逐个扫描 0 命中）；08006 失败日志保留"}],"browser_status":"NOT_APPLICABLE","formal_browser_acceptance":false}
