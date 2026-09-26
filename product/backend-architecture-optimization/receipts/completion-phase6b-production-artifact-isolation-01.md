# Phase 6B 完成回执 · 生产制品与开发运行边界

> 角色：执行（Executor） ｜ 日期：2026-09-25 ｜ 等级：XL
> 所属总体任务：`backend-architecture-optimization` ｜ 候选：BAO-08 + BAO-10
> 权威方向：`../ready/direction-phase6b-production-artifact-isolation.md`
> 状态：**`EXECUTION_SUBMITTED`**（自验通过项与**单列未关闭项**分别列明，见 §5/§6）——未写 `PASSED`/`COMPLETED`，未启动 Phase 6C/最终展示收口
> 后端仓身份：`develop@76dc947`（工作树含 Phase 3/4/5/6A 既有改动）

---

## 1. 三个 Step 的净结果

| Step | 目标 | 结果 |
|---|---|---|
| **1** | 正式生产构建入口、CI 制品门禁与生产身份标记 | **已实现并可用**：`scripts/build-prod.sh`（测试门禁 → `-Pprod` 打包 → 制品门禁，任一步失败即整体 fail closed）、`scripts/check-prod-artifact.sh`（负向/正向清单 + 身份标记，可复跑）、`sw-bootstrap/src/prod/resources/META-INF/production-build.properties`（等价 marker）；Release workflow 已改为显式调用同一入口。**但制品门禁当前因 §6 单列项（MockCloudProvider）不通过**，故入口 end-to-end 仍非 exit 0。 |
| **2** | H2 与 dev/local 配置、devseed 资源归属分离 | **已完成并验证**：h2 默认降为 `test` scope、dev/local 运行入口以 `dev` profile 供应 runtime H2；`application-dev.yml`／`application-local.yml`／`db/migration/devseed/**` 已移出 `src/main/resources` 至 `src/dev/resources`，仅经 dev profile 与测试类路径供应。生产制品负向清单中 H2／dev 配置／devseed 均为 0，正向清单齐备。 |
| **3** | dev-only 类物理隔离与 IoT provider 环境归属 | **五个验证适配器已完成物理隔离**（移入各模块 `src/dev/java`，默认构建编译输入天然不可见，`-Pdev` 才编译）；**`MockCloudProvider` 未隔离**——结构性隔离必须修改生产选择器，触发方向 §6 的停止条件，按 §6 单列（见 §5）。IoT `prod` 配置归属问题连带未决（同一根因）。 |

## 2. 修改文件与回滚点

| 文件 | Step | 内容 | 回滚语义 |
|---|---|---|---|
| `scripts/build-prod.sh`（新增） | 1 | 仓内唯一正式生产构建入口 | 删除脚本即回滚 |
| `scripts/check-prod-artifact.sh`（新增） | 1 | 制品门禁（fail closed，可复跑，含负向探针用法） | 删除脚本即回滚 |
| `sw-bootstrap/src/prod/resources/META-INF/production-build.properties`（新增） | 1 | 生产身份等价 marker | 删除 + 移除 prod profile 的 resources 段 |
| `sw-bootstrap/pom.xml` | 1+2+3 | prod profile（marker 资源根）、dev profile（额外资源根 + `finalName=bootstrap-dev` + h2 runtime + `src/dev/java` 源码根）、h2 默认降为 test scope、`testResources` 增加 dev 资源根 | 按 profile 段分别回滚 |
| `pom.xml`（根） | 1+3 | prod profile 的排除由 `**/P58Debug*` 前缀改为**精确类名**（5 适配器 + VerifyMapper），注释改为「辅助门禁」 | 还原 prod profile plugins 段 |
| `.github/workflows/build-release.yml` | 1 | 发布改为调用 `scripts/build-prod.sh`，制品路径固定为 `sw-bootstrap/target/bootstrap.jar` 并在上传前经门禁 | 还原该 step |
| `sw-basic-notify-biz/pom.xml`、`sw-bpm-engine/pom.xml` | 3 | 新增 `dev` profile（build-helper 增加 `src/dev/java` 源码根） | 删除 profile 段 |
| `sw-bootstrap/src/dev/{java,resources}/**`（新增/移动） | 2+3 | dev-only 类与 dev/local 资源新归属 | 移回 `src/main/**` |
| 移动的既有文件 | 2+3 | `application-dev.yml`、`application-local.yml`、`db/migration/devseed/**`（4 个 SQL）、5 个验证适配器、`VerifyMapper` | 逐一移回原位 |

## 3. 关键验证（可复跑）

| 验收项 | 结果 | 证据 |
|---|---|---|
| §5.2 prod 依赖树 H2 runtime = 0 | **达成**：prod profile 下 `h2database` 命中 10 处**全部为 `scope=test`**，非 test 命中 **0**；PostgreSQL 命中 4 | `6b-prod-dependency-tree.txt` |
| §5.3 Boot Jar 负向清单 | **10 项中 9 项为 0**：不含 H2 驱动、不含 5 个 dev-only 顶层类型（含嵌套类）、不含 `application-dev.yml`／`application-local.yml`／`db/migration/devseed/**`；**仅 `MockCloudProvider` 仍为 1** | `6b-gate-official.txt` |
| §5.4 Boot Jar 正向清单 | **达成**：`application.yml`、`application-prod.yml`、PostgreSQL 驱动、生产 Flyway 迁移（87 项）、正式 IoT provider（`TencentCloudProvider`）、`AgentGraphDebug*` 11 个 class 全部存在；未使用过宽排除 | 同上 |
| §5.1 生产身份标记 | **达成**：`META-INF/production-build.properties` 内含 `build.profile=prod`，仅 prod profile 注入（Spring Boot repackage 将其保留在制品根目录）；dev jar 不含该标记 | `6b-artifact-identity.txt` |
| §5.10 制品门禁负向探针 | **达成**：向临时副本注入 `application-dev.yml` 后门禁非零失败（2 项），正式制品 sha256 前后一致（`3add8665…`）未被污染 | `6b-gate-negative-probe.txt` |
| §5.7 dev/local 可用与 H2 烟测 | **达成**：`-Pdev` 下 5 个适配器 + `VerifyMapper` 全部编译、dev 资源进入 classes；dev 制品以隔离端口启动 **RESULT=PASS（health 200，13.4s）** | `6b-dev-smoke-result.txt`、`6b-dev-smoke.log` |
| Step 3 结构性隔离证据 | **达成**：默认构建 `target/classes` 中 5 个类与 `VerifyMapper` 计数全为 0；`-Pdev` 下全部 ≥1 | 见 §4 |
| §5.9 全量回归 | 见 §7 | `6b-full-test-extract.txt` |
| §5.5 生产上下文 PG 启动 / §5.6 IoT fail-closed | **未达成**（被 §5.1/§5.3 的同一单列项阻塞，且本环境无可用的腾讯云真实凭据） | `6b-iot-provider-facts.txt` |

## 4. Step 3 结构性隔离的实测（非命名排除）

- 默认构建：`mvn -B -o test-compile` → exit 0，`P58DebugNotifyController`／`P58DebugNotifyChannelAdapter`／`P58DebugParticipantAdapter`／`VerificationRunner`／`BpmVerificationRunner`／`VerifyMapper` 在 `target/classes` 中的 class 计数**全为 0**。
- dev 构建：`mvn -B -o -Pdev test-compile` → exit 0，同六者计数**全部 ≥1**，且 `application-dev.yml`／`application-local.yml`／devseed 4 个 SQL 进入 classes。
- 机制：默认构建的**编译输入天然看不到**这些源码（源码根不在 classpath 上，而非依赖 `**/P58Debug*` 前缀排除）；根 POM 的精确类名排除仅作辅助门禁，未使用 `*Debug*`／`*Mock*` 宽通配（`AgentGraphDebug*` 11 个 class 仍完整存在于制品）。

## 5. 单列未关闭项（按方向 §6）

**缺口**：`MockCloudProvider` 未从生产制品隔离，且 `prod` 的 `provider-mode` 仍为 `mock`。

**失败事实**（全部为工具实测/代码事实，证据 `6b-iot-provider-facts.txt`）：
1. `IotAutoConfiguration.deviceControlProvider` **直接 `new MockCloudProvider()`**（生产选择器引用该 dev-only 实现）。
2. `TencentCloudProperties.providerMode` 的**默认值即为 `"mock"`**。
3. `OnlineConfirmControlUtil` 与 `DeferredControlUtil` 是 `@Component` 且**强制注入 `DeviceControlProvider`**；`StarterApplication` 以 `scanBasePackages="com.sw.ck"` **无条件扫描**它们 ⇒ **`sw.iot.enabled=false` 时上下文创建失败**（实测：`No qualifying bean of type 'com.sw.ck.iot.config.IotCipherProperties'`）。
4. 本环境只有 `PG_*` 四个变量，**无腾讯云真实凭据**；`providerMode=tencent` 且无凭据时既有错误体系在启动期抛 `IllegalStateException`（fail closed）。

**结论**：在「不修改生产调用方」（§6）前提下，**「生产制品不含 MockCloudProvider」（§5.3）与「生产上下文可启动」（§5.5）不可同时成立**——把该类移出 `src/main` 必须改动生产选择器 `IotAutoConfiguration`，而 prod 侧当前唯一能启动的 provider 就是 mock。

**已尝试路径**：① 结构性移入 `src/dev/java`（被 §6 阻断，未实施）；② 仅按精确类名从 prod 制品排除（未采用：会留下指向缺失类的字节码引用，且 §4.2 禁止「排除成为唯一归属机制」）；③ 令 prod 关闭 IoT（实测不可启动，见事实 3）；④ 以真实凭据启动真实 provider（本环境无凭据，且不得伪造）。

**解除条件（需规划裁决其一）**：
- (a) 授权在 Phase 6B 内修改生产 IoT 装配，使 provider 可缺省并 fail closed（例如把 mock 分支移入 dev-only 配置、把两个 util 的 provider 依赖改为可选并在缺失时按既有错误体系报错）；或
- (b) 明确「prod 保留 mock provider 但不得默认选择」的可接受口径，并授权对 `MockCloudProvider` 使用精确类名排除作为过渡机制（需同时接受制品内字节码悬挂引用）；或
- (c) 将本项拆到后续阶段，并把 §5.3 的 `MockCloudProvider` 一项与 §5.5 的生产启动证据一并挂起。

## 6. 边界与未做项

- §5.5 生产上下文 PG 启动、§5.6 IoT fail-closed 行为断言**未执行**：两者都要求一个可启动且不含 mock 的 prod 制品，被 §5 同一根因阻塞；且启动需要外部安全配置注入（RSA／digest／JWT 等），本环境无相应真实配置。
- 未改业务功能、公开 API、数据库模型、生产迁移、groupId/artifactId；未重打历史 Release；未 commit/push/merge/tag/Release/部署；未停止任何常驻服务；验证进程均使用隔离端口并在证据冻结前终止。
- MySQL 等其它数据库驱动未做任何裁决或删除（未触碰）。
- `knowledge/`／`memory/` 未同步（本阶段未进入终态同步）。

## 7. 全量回归

`MAVEN_OPTS="-Xmx2g" mvn -B -o test` → BUILD SUCCESS；**1563 tests / 0 failures / 0 errors / 0 skipped**（Phase 6A 基线 1563）。与 Phase 6A 基线 **1563 完全一致**：本阶段未新增或删减任何测试方法（只调整了源码/资源归属、构建配置与制品门禁，未改测试断言），因此不存在需要逐项解释的测试数变化。

## 8. 证据清单

目录：`evidence/phase6b-01/`（见 `6b-hashes.sha256` 与 `6b-readback.txt`；秘密扫描见 `6b-secret-scan.txt`）。

ENGINE_TERMINAL {"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"XL","receipt":"product/backend-architecture-optimization/receipts/completion-phase6b-production-artifact-isolation-01.md","feature_status":"VERIFYING","evidence":["product/backend-architecture-optimization/receipts/evidence/phase6b-01/（20 文件，18/18 sha256 校验通过；秘密扫描 CLEAN）","scripts/build-prod.sh + scripts/check-prod-artifact.sh（仓内唯一生产构建入口与可复跑制品门禁，fail closed）","6b-gate-official.txt：正式制品负向 10 项中 9 项为 0，仅 MockCloudProvider 为 1；正向清单 6 项全部存在（含 AgentGraphDebug* 11 class）","6b-gate-negative-probe.txt：临时副本注入 application-dev.yml 后门禁非零失败；正式制品 sha256 前后一致未被污染","6b-prod-dependency-tree.txt：prod profile 下 h2 命中 10 全部为 test scope，非 test 命中 0","6b-dev-smoke-result.txt + 6b-dev-smoke.log：dev 制品以隔离端口启动 RESULT=PASS（health 200，13.4s）","6b-artifact-identity.txt：prod jar 216903227 bytes / sha256 23910dc0…，内含 build.profile=prod 标记；dev jar 不含该标记","6b-iot-provider-facts.txt：MockCloudProvider 被生产选择器直接引用、providerMode 默认 mock、IoT 关闭即无法启动（实测）","6b-full-test-extract.txt：mvn -B -o test 1563/0/0/0 / BUILD SUCCESS / exit 0（与 Phase 6A 基线一致，无测试增删）"],"work_items":[{"id":"step1-build-entry","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已实现生产构建入口、制品门禁与生产身份标记，并接入 Release workflow"},{"id":"step2-h2-dev-resources","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"H2 降为 test scope 并由 dev profile 供应 runtime；dev/local 配置与 devseed 已移出生产主资源"},{"id":"step3-dev-only-adapters","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"五个验证适配器与 VerifyMapper 已移入 src/dev/java，默认构建编译输入不可见、-Pdev 才编译"},{"id":"step3-iot-mock-provider","status":"BLOCKED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"按方向 §6 单列：MockCloudProvider 结构性隔离需修改生产选择器 IotAutoConfiguration；实测 IoT 关闭时上下文无法启动，故「制品不含 mock」(§5.3) 与「生产上下文可启动」(§5.5) 在现有生产代码下不可同时成立。需规划裁决：(a) 授权改生产 IoT 装配使 provider 可缺省并 fail closed；(b) 授权对 MockCloudProvider 用精确类名排除作过渡；(c) 挂起该子项与 §5.5 证据"},{"id":"step3-iot-prod-config","status":"BLOCKED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"与上项同根因：prod 的 provider-mode 当前为 mock，改为 tencent 而无真实凭据会使生产上下文启动失败（既有 fail-closed），需与上项一并裁决"},{"id":"regression","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"全量 mvn -B -o test 1563/0/0/0 BUILD SUCCESS，与基线一致"},{"id":"receipt","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已提交完成回执（含单列未关闭项），等待规划裁决"}],"remaining_actionable_count":0,"independent_work_exhausted":true,"next_action":"等待规划（Planner）裁决方向 §6 单列项：MockCloudProvider 生产隔离与 prod IoT provider 归属。该项阻塞 §5.1（入口 exit 0）、§5.3（制品负向清单）与 §5.5/§5.6（生产上下文与 IoT fail-closed 证据）；Step 1/2 与五个验证适配器的物理隔离已实现并验证，§5.2/§5.4/§5.7/§5.9/§5.10 已通过","next_action_type":"WAIT_PLANNER","progress_fingerprint":"phase6b-execution-submitted-20260925","progress_basis":{"files_changed":["scripts/build-prod.sh","scripts/check-prod-artifact.sh","sw-bootstrap/src/prod/resources/META-INF/production-build.properties","sw-bootstrap/pom.xml","pom.xml","sw-basic/sw-basic-notify/sw-basic-notify-biz/pom.xml","sw-biz/sw-bpm/sw-bpm-engine/pom.xml",".github/workflows/build-release.yml","sw-bootstrap/src/dev/java/com/sw/ck/bootstrap/verify/VerificationRunner.java","sw-bootstrap/src/dev/java/com/sw/ck/bootstrap/verify/BpmVerificationRunner.java","sw-bootstrap/src/dev/java/com/sw/ck/bootstrap/verify/VerifyMapper.java","sw-basic/sw-basic-notify/sw-basic-notify-biz/src/dev/java/com/sw/ck/notify/controller/P58DebugNotifyController.java","sw-basic/sw-basic-notify/sw-basic-notify-biz/src/dev/java/com/sw/ck/notify/impl/P58DebugNotifyChannelAdapter.java","sw-biz/sw-bpm/sw-bpm-engine/src/dev/java/com/sw/ck/bpm/engine/participant/P58DebugParticipantAdapter.java","sw-bootstrap/src/dev/resources/application-dev.yml","sw-bootstrap/src/dev/resources/application-local.yml","sw-bootstrap/src/dev/resources/db/migration/devseed/h2/V900__i5_tenant100_test_fixtures.sql","sw-bootstrap/src/dev/resources/db/migration/devseed/h2/V901__i5_g2_g4_negative_fixtures.sql","sw-bootstrap/src/dev/resources/db/migration/devseed/h2/V902__i5_g2_g6_fixtures.sql","sw-bootstrap/src/dev/resources/db/migration/devseed/h2/V903__i5_g5_three_provider_fixtures.sql"],"tool_actions":["mvn -B -o test-compile（默认与 -Pdev 各一次，验证结构性隔离）","mvn -B -o -Pprod clean package -DskipTests","mvn -B -o -Pdev clean package -DskipTests","scripts/check-prod-artifact.sh（正式制品 + 注入禁止项的临时副本）","mvn -o -B -Pprod dependency:tree","java -jar bootstrap-dev.jar --spring.profiles.active=dev（隔离端口 18081，health 200）","java -jar bootstrap-dev.jar --spring.profiles.active=dev --sw.iot.enabled=false（实测上下文失败）","mvn -B -o test（全量回归）"],"new_evidence":["制品门禁负向清单由 3 项失败降到 1 项（仅 MockCloudProvider），正向清单 6/6 齐备","prod 依赖树 h2 非 test 命中 0","dev 制品 H2 启动烟测 PASS（health 200）","生产身份标记可机器区分 prod/dev 制品","prod 无法在无 mock 且无真实凭据下启动（实测 IotCipherProperties 缺失）","全量 1563/0/0/0 与基线一致"],"closed_work_items":["step1-build-entry","step2-h2-dev-resources","step3-dev-only-adapters","regression","receipt"]},"stop_reason":"WAITING_FOR_PLANNER","tool_results":[{"tool":"Bash/mvn","outcome":"SUCCEEDED","detail":"默认与 -Pdev 的 test-compile 均 exit 0；五个 dev-only 类与 VerifyMapper 在默认 target/classes 计数全为 0、在 -Pdev 下全部 ≥1"},{"tool":"Bash/mvn","outcome":"SUCCEEDED","detail":"mvn -B -o -Pprod dependency:tree exit 0：h2database 10 处全部 scope=test，非 test 命中 0"},{"tool":"Bash/script","outcome":"FAILED","detail":"scripts/check-prod-artifact.sh 在正式制品上 exit 1：仅 MockCloudProvider 一项不满足（其余负向 9 项与正向 6 项全部通过）"},{"tool":"Bash/script","outcome":"SUCCEEDED","detail":"负向探针：注入 application-dev.yml 的临时副本 exit 1（2 项不满足）；正式制品 sha256 前后一致未被污染"},{"tool":"Bash/java","outcome":"SUCCEEDED","detail":"dev 制品启动烟测 RESULT=PASS（health 200，13.4s）；--sw.iot.enabled=false 时上下文创建失败（IotCipherProperties 缺 Bean）"},{"tool":"Bash/mvn","outcome":"SUCCEEDED","detail":"全量 mvn -B -o test：BUILD SUCCESS / exit 0 / 1563 tests / 0 failures / 0 errors / 0 skipped"},{"tool":"Bash/file","outcome":"SUCCEEDED","detail":"证据目录 20 文件、18/18 sha256 校验通过；秘密扫描命中 0（CLEAN）"}],"browser_status":"NOT_APPLICABLE"}
