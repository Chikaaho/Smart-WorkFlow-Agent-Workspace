# Phase 6A 完成回执 · 第三方版本集中化与 Enforcer 依赖收敛

> 执行角色：执行（Executor） ｜ 日期：2026-09-25 ｜ 等级：XL
> 所属总体任务：`backend-architecture-optimization` ｜ 候选：BAO-03 + BAO-04
> 权威方向：`../ready/direction-phase6a-dependency-version-enforcement.md`
> 回执状态：**`EXECUTION_SUBMITTED`（自验通过，待规划验收）** —— 未写 `PASSED`/`COMPLETED`，未启动 Phase 6B
> 后端仓身份：`develop@76dc947`，工作树含 Phase 3/4/5 既有未提交改动；本阶段净改 **6 个 POM + 1 个测试文件**

---

## 1. 功能与内部 Step 概要

| Step | 目标 | 结果 |
|---|---|---|
| **A** | 版本集中化且解析值不变 | 4 项（fastjson2／腾讯云 IoT Explorer／embedded-postgres／zonky binaries BOM）集中进 `sw-dependencies`；**解析版本集合逐项恒等（机器 diff 零差异，2845 行／21 模块）**；冲突标记 63→63 未增；`validate` exit 0 |
| **B** | 激活守门并收敛传递树 | 删除 GA 错误的 plugin dependency；根 `build/plugins` 增 execution（id=`enforce-dependency-convergence`，phase=`validate`），**32/32 模块继承**；`sw-dependencies` 增 15 项管理式收敛；分叉 **14 构件/4 模块 → 0/0** |

Step A 与 Step B 分别可独立回滚（见 §7）。

## 2. 实际修改文件

| 文件 | Step | 净行变化（vs HEAD，含 Phase 3/4/5 既有改动时已标注） |
|---|---|---|
| `sw-dependencies/pom.xml` | A+B | +177 / −0（本阶段全部新增） |
| `pom.xml`（根） | B | +23 / −7（本阶段全部新增/删除） |
| `sw-bootstrap/pom.xml` | A | +9 / −16（本阶段全部新增/删除） |
| `sw-biz/sw-biz-form/sw-biz-form-biz/pom.xml` | B | +1 / −2（本阶段全部新增/删除） |
| `sw-basic/sw-basic-iot/pom.xml` | A | 现 +11/−4；Phase 5 时点为 +9/−0 ⇒ **本阶段净 +2/−4** |
| `sw-biz/sw-bpm/sw-bpm-process/pom.xml` | A | 现 +23/−2；Phase 5 时点为 +24/−2 ⇒ **本阶段净 −1/0** |
| `sw-bootstrap/src/test/.../phase5/Phase5IotApiBoundaryGateTest.java` | B | 门禁3 方法改写（见 §5.2） |

未修改：任何业务源码、HTTP 契约、DB 迁移（V96 为 Phase 4 既有未跟踪文件）、groupId/artifactId、Profile、版本号表达式、分支或 Git 历史。

## 3. 各文件修改摘要

- **`sw-dependencies/pom.xml`**：新增 `专项依赖（Phase 6A 集中化）` 属性组（`fastjson2.version=2.0.53`、`tencentcloud-iot.version=3.1.1235`、`embedded-postgres.version=2.1.0`、`embedded-postgres-binaries.version=17.5.0`）与 `传递树收敛（Phase 6A Step B）` 属性组（13 项）；`dependencyManagement` 末尾新增 19 条管理项（4 条集中化 + 15 条收敛，含 1 条 zonky BOM import）。全部为**管理**、零 `<exclusion>`、零 scope 改写。
- **`pom.xml`（根）**：删除 `pluginManagement` 中 GA 错误的 `<dependencies><dependency>org.apache.maven.plugins:maven-enforcer-rules:3.5.0` 声明（规范坐标为 `org.apache.maven.enforcer:enforcer-rules`，插件自身已引入）；新增 `build/plugins` 中的可继承 execution，绑定 `validate`。
- **`sw-bootstrap/pom.xml`**：删除自导入的 zonky `embedded-postgres-binaries-bom:17.5.0`（移入 `sw-dependencies`）；删除 `embedded-postgres:2.1.0` 的 `<version>`；注释同步。
- **`sw-biz-form-biz/pom.xml`**：删除 `poi-ooxml:5.2.5` 的 `<version>`（收敛值 5.4.0 由 BOM 供给）。
- **`sw-basic-iot/pom.xml`**：删除 tencent iotexplorer `3.1.1235` 与 fastjson2 `2.0.53` 的 `<version>`；注释标注唯一版本所有者。
- **`sw-bpm-process/pom.xml`**：删除 Phase 5 临时局部 fastjson2 `2.0.53` 的 `<version>`；注释由「须在后续 BOM 治理阶段收敛」改写为「已集中进 sw-dependencies，不得在本模块重写 version」。
- **`Phase5IotApiBoundaryGateTest.java`**：门禁3 断言改写（见 §5.2）。

## 4. 实际命令与原始结果摘要

完整命令台账见 `evidence/phase6a-01/phase6a-commands.tsv`。关键结果：

| 命令 | exit | 结果 |
|---|---|---|
| `MAVEN_OPTS=-Xmx2g mvn -o -B dependency:list -DincludeScope=test`（Step A 前后各一次） | 0 / 0 | 归一化后 **2845 行逐项恒等，零差异** |
| `MAVEN_OPTS=-Xmx2g mvn -o -B dependency:tree -Dverbose`（Step A 后 / Step B 后） | 0 / 0 | `omitted for conflict` **63 → 0** |
| `MAVEN_OPTS=-Xmx2g mvn -B validate`（Step B 首次） | **1** | Enforcer 首次真实执行并**正确失败**：`sw-bootstrap` 报 `checker-qual` 分叉（证明守门非空转） |
| 补 `checker-qual` 后 `mvn -B validate` | 0 | BUILD SUCCESS，32 个模块各执行一次 `enforce-dependency-convergence` |
| `MAVEN_OPTS=-Xmx2g mvn -B -o validate` | 0 | 离线同样成功，32 次执行 |
| `MAVEN_OPTS=-Xmx2g mvn -o -B help:effective-pom` | 0 | **32/32** 模块 `build/plugins` 含同一 execution（id/phase 唯一） |
| 负向探针（临时副本注入 `commons-io:2.15.0`）`mvn -B validate` | **1** | **预期失败**：`sw-basic-storage-biz` 报 `Dependency convergence error for commons-io:2.18.0` 并列出两条路径 |
| `MAVEN_OPTS=-Xmx2g mvn -B -o test`（全量） | 0 | **BUILD SUCCESS**；全工程 **1559 tests / 0 failures / 0 errors / 0 skipped** |

### 4.1 全量测试逐模块计数（`mvn -B -o test`）

| 模块 | tests | failures | errors | skipped |
|---|---|---|---|---|
| Smart-WorkFlow :: Common | 32 | 0 | 0 | 0 |
| Smart-WorkFlow :: Security | 17 | 0 | 0 | 0 |
| Smart-WorkFlow :: Basic :: Storage :: Biz | 29 | 0 | 0 | 0 |
| Smart-WorkFlow :: Basic :: Notify :: Biz | 118 | 0 | 0 | 0 |
| Smart-WorkFlow :: Basic :: Job :: Biz | 51 | 0 | 0 | 0 |
| Smart-WorkFlow :: Basic :: IoT | 50 | 0 | 0 | 0 |
| Smart-WorkFlow :: Basic :: Agent | 346 | 0 | 0 | 0 |
| Smart-WorkFlow :: Biz :: System :: Biz | 305 | 0 | 0 | 0 |
| Smart-WorkFlow :: Biz :: Form :: Biz | 159 | 0 | 0 | 0 |
| Smart-WorkFlow :: Biz :: BPM :: Engine | 61 | 0 | 0 | 0 |
| Smart-WorkFlow :: Biz :: BPM :: Process | 210 | 0 | 0 | 0 |
| Smart-WorkFlow :: Biz :: OpenAPI :: Biz | 10 | 0 | 0 | 0 |
| Smart-WorkFlow :: Bootstrap | 171 | 0 | 0 | 0 |

### 4.2 定向回归域计数（验收 6）

| 受影响域 | 覆盖模块 | tests | failures | errors | skipped |
|---|---|---|---|---|---|
| Form(POI/Excel) | Biz :: Form :: Biz | 159 | 0 | 0 | 0 |
| IoT | Basic :: IoT | 50 | 0 | 0 | 0 |
| Storage(MinIO/Qiniu/COS) | Basic :: Storage :: Biz | 29 | 0 | 0 | 0 |
| Knowledge/Agent | Basic :: Knowledge/Basic :: Agent | 346 | 0 | 0 | 0 |
| BPM/Flowable | Biz :: BPM :: Engine/Biz :: BPM :: Process/Biz :: BPM :: API | 271 | 0 | 0 | 0 |

- **POI/Excel 专项**：POI 生产使用点仅 1 个（`FormImportExportService`，用 `getCellType()`/`CellType`/`WorkbookFactory`/`XSSFWorkbook` 等 POI 5.x 稳定 API）；`FormDynamicTableSafetyTest` 的 `exportResolvesReferenceAndFailsClosed`、`importReferenceValidation` 做真实 xlsx **写出→读回**往返，构成 5.2.5→5.4.0 升档的行为证据。
- **Knowledge/Agent（Tika/PDFBox/Spring AI）**：`sw-basic-knowledge` **本身无测试类**（与该模块当前惰性状态一致，Phase 2 审计已记录）；Agent 模块测试全绿。该域的风险（bcprov/commons-io/commons-logging/antlr4/jackcess）已通过「不把任何消费方压回其编译基线之下」的定版原则规避，但**无模块级行为测试可依赖**，列为残余风险（§6）。

## 5. 与方向的偏差

### 5.1 POI 的集中化从 Step A 移到 Step B（方向内部要求互斥）

- 方向 Step A 第 1 条要求把 **POI** 一并集中进 `sw-dependencies`，第 3 条要求 Step A 完成时 **POI 解析版本为 5.2.5 且解析版本集合逐项恒等**。
- 实测两者互斥：`dependencyManagement` 对**传递依赖同样生效**，一旦托管 `poi-ooxml`，`sw-basic-agent`/`sw-basic-knowledge` 经 Tika 获得的 `poi-ooxml 5.4.0` 会被强制改为 5.2.5 —— 我在 Step A 首次实施后由机器 diff 捕获到 **6 行非预期变化**（poi-ooxml、poi-ooxml-lite、xmlbeans 三个构件各在 agent 与 knowledge 各 1 处），随即回退该条目。
- 硬证据：`tika-parent:3.1.0` 的属性 `poi.version=5.4.0`，即 Tika 的编译基线；把 Tika 压到 5.2.5 属「低于编译基线」的降档。且基线制品内已存在 `poi 5.2.5` 与 `poi-scratchpad 5.4.0` 的家族内错配。
- **处置**：把 POI 归入 Step B 的收敛账（Step A 因此保持**可证明的完全中性**），收敛值取 **5.4.0**，使 poi/poi-ooxml/poi-ooxml-lite/poi-scratchpad 四件同版并满足 Tika 基线；`form-biz` 由 5.2.5 同 major 升档，配套 Excel 往返回归（§4.2）。
- 结果：本阶段五项 version 在业务/实现 POM 中均为 0（验收 1 达成），而 Step A 的中性门禁仍严格成立。请规划裁决该步序归属是否接受。

### 5.2 Phase 5 门禁测试的断言改写（不改强度，只改表达层）

- 首轮全量测试唯一失败：`Phase5IotApiBoundaryGateTest#bpmProcessOwnsItsDependencies:219`，原断言为
  `assertThat(deps).contains("<version>2.0.53</version>")` —— 即把「fastjson2 版本 2.0.53」写成对 `sw-bpm-process/pom.xml` **字面文本**的断言。而 Step A 的方向要求正是删除该字面量，两者文字互斥。
- 保留全部原有约束：① 声明 `sw-basic-iot-api`；② 不得再声明完整 `sw-basic-iot`；③ fastjson2 必须是本模块直接声明。
- 改写为更强表达：ⅰ fastjson2 依赖块内不得出现 `<version>`（唯一版本所有者为 `sw-dependencies`）；ⅱ `sw-dependencies` 的 `<fastjson2.version>` 必须等于 `2.0.53`；ⅲ **运行期真实加载到的构件必须为 `fastjson2-2.0.53.jar`**（不受 POM 结构变化影响，直接证明「不得顺手升级」）。
- 复验：`-Dtest=Phase5IotApiBoundaryGateTest` → Tests run: 6, Failures: 0（同轮另外 7 道 Phase 5 门禁全部保持通过）。
- 全文扫描确认：全仓仅此 1 个测试读取 `pom.xml`；无其他测试断言本阶段改动的版本字面量。

## 6. 问题、未完成与风险

1. **`checker-qual`：探索记录 14 项之外第 15 项**。探索期用 `dependency:tree -Dverbose` 的冲突标记枚举，会漏掉 Maven 已介导为「duplicate」但原始图中仍存在多版本的节点；Enforcer 按**介导前**的图判定，因此首次激活即报出 `checker-qual 3.43.0`（guava）与 `3.48.3`（PostgreSQL JDBC）。已按同一「不降档」原则收敛为 3.48.3（纯注解构件，无运行期影响）。教训：**枚举分叉必须以 Enforcer 实跑为准**，verbose 树只能作辅助。
2. **生产制品依赖集合确实发生变化**（Step B 的必然结果）：8 个构件在装配制品内升档，其中 `tencentcloud-sdk-java-common 3.1.213→3.1.1235` 连带把该 SDK 的 HTTP 栈由 OkHttp 2.7.5/jaxb-api 换成 OkHttp 3.12.13（经收敛为 4.12.0）/ini4j 0.5.4；`storage-biz` 由此减少 `com.squareup.okhttp:okhttp:2.7.5`、`logging-interceptor:2.7.5`、`javax.xml.bind:jaxb-api:2.3.0` 三个传递构件。上述三者为**另一 GA**（`com.squareup.okhttp` 2.x），非为规避收敛而移除；该组合本就是装配制品（`tencent-common 3.1.1235`）的既有运行期事实。逐项变化见 `phase6a-stepB-resolution-changes.tsv`。
3. **跨 major 升级的回归强度有限**：`okhttp 3.x→4.12.0`（另有 `okio 1.x→3.6.0`、`joda-time 2.9.9→2.13.0`、`bcprov 1.78.1→1.80.2`）。选 4.12.0 的两条依据是：okhttp 4 对 3.x 的 Java 调用方保持二进制兼容，且**装配制品现即解析为 4.12.0**（即运行期事实未变）。但 MinIO/Qiniu/COS 与腾讯云 SDK 的真实网络往返**无法在本环境离线复现**，只有模块级测试与依赖面证据，不构成真实外呼行为验收。
4. **`sw-basic-knowledge` 无任何测试**：该模块是本次受影响构件（bcprov/commons-io/commons-logging/antlr4/jackcess）的主要承载方之一，其行为变化无测试兜底。
5. **`sw-basic-iot-api` 未进入 `~/.m2`**：Phase 5 新模块只在工作树与 `target/classes`，`dependency:tree` 等独立 goal 需临时 local repo 补装；全量 `mvn test` 走反应堆不受影响。属 Phase 5 遗留环境事实，非本阶段引入。
6. 未做（且按方向属非目标）：H2 生产运行时隔离、P58Debug/dev-only 制品边界、生产 profile/CI 打包入口（Phase 6B）；版本表达式与 34 POM 父版本迁移（Phase 6C）；仓库展示收口。

## 7. Git diff 摘要与回滚

- 变更文件：6 个 POM + 1 个测试文件（§2）；`git diff --stat`（6 个 POM）＝ 6 files changed, 244 insertions(+), 31 deletions(-)；完整 diff 见 `phase6a-pom-diff.txt`。
- **Step A 回滚**：还原 `sw-basic-iot`／`sw-bpm-process`／`sw-bootstrap` 三个 POM 的 `<version>` 行与 zonky BOM import，并移除 `sw-dependencies` 中 4 条集中化管理项与 4 个属性 → 解析版本回到集中化前（已证明恒等，回滚同样恒等）。
- **Step B 回滚**：还原根 `pom.xml`（恢复 pluginManagement 状态并移除 `build/plugins` execution）＋ 移除 `sw-dependencies` 中 15 条收敛管理项与 13 个属性 ＋ 还原 `form-biz` 的 POI version → 回到「无守门、15 项分叉」状态。
- 两步修改面与回滚语义相互独立，不构成单次回退；Phase 6B/6C 未受影响。
- 本阶段未 commit/push/merge/tag/Release/部署。生产制品 `sw-bootstrap/target/bootstrap.jar` 未被重新打包（mtime 仍为 2026-09-24 16:51）。

## 8. 与验收标准逐项对照

| # | 验收标准 | 结论 | 证据 |
|---|---|---|---|
| 1 | 五项 version 在业务/实现 POM 为 0；`sw-dependencies` 唯一版本所有者；Step A 前后解析版本集合逐项恒等并有机器 diff | **达成** | 五项扫描各 0 行；`phase6a-stepA-neutrality.txt`（2845 行零差异）；`phase6a-converged-artifacts.tsv` |
| 2 | effective POM：32 模块均在 `build/plugins` 继承同一 execution；`pluginManagement` 非唯一落点 | **达成** | `phase6a-effective-pom-enforcer.tsv`（32/32 true，id/phase 唯一） |
| 3 | `mvn -B validate` 与 `mvn -B -o validate` 均成功，日志证明实际执行；不以 exit 0 推断 | **达成** | `phase6a-validate-online.txt`／`-offline.txt`（各 32 次 `enforce-dependency-convergence`） |
| 4 | 临时副本制造最小分叉，默认 `validate` 必须非零失败；探针不污染工作树与正式本地仓 | **达成** | `phase6a-probe-negative.txt`（exit 1，报 commons-io 分叉双路径）；探针在 `/tmp/bao6/probe` ＋临时 local repo；正式工作树扫描 `NEGATIVE PROBE` = 0 |
| 5 | 14 构件无版本分叉；未以移除能力或改 test scope 规避 | **达成** | `phase6a-divergence-after.txt`（0/0）；`phase6a-scope-integrity.txt`（scope 变化 0、移除 0、新增 `exclusion` 0） |
| 6 | 受影响域定向回归覆盖 Form Excel/POI、IoT 腾讯云与命令链、Storage MinIO/Qiniu/COS、Knowledge/Agent Tika/PDFBox/Spring AI、BPM/Flowable | **达成（含受限项）** | §4.2 逐域计数全绿；POI 有 xlsx 往返证据；Knowledge 无测试类、外呼行为不可离线复现 → §6.3/6.4 残余风险 |
| 7 | 全量 `mvn -B -o test` 不低于 1559 基线，failures/errors/skipped 均 0；测试数变化逐项解释 | **BUILD SUCCESS；1559/0/0/0，与基线一致无漂移** | §4.1 逐模块表；双重计数校验见 §9 |
| 8 | 最终命令、effective POM、版本集合 diff、冲突清单、负向探针、测试日志形成哈希并现场回读；秘密扫描 CLEAN | **达成** | `phase6a-hashes.sha256` ＋ `phase6a-readback.txt`；`phase6a-secret-scan.txt`（命中 0，CLEAN） |

## 9. 自验结论

- 目标达成：`sw-dependencies` 成为本阶段所涉第三方构件的唯一版本所有者；`dependencyConvergence` 已在默认 `validate`／`test`／`package` 生命周期真实执行（不依赖手工 goal、额外 profile 或 CI 私有参数），且分叉由 14 构件降到 0。
- 测试计数：本阶段实测 **1559 tests / 0 failures / 0 errors / 0 skipped**，与 Phase 5 时点基线 **1559 完全一致，无漂移**。测试方法数未增未减：`Phase5IotApiBoundaryGateTest` 仍为 6 个 `@Test`（门禁3 只在同一方法内把字面断言换成更强的多重断言）。
- 计数双重校验：① Maven 逐模块汇总 = 1559；② `target/surefire-reports/*.txt` 累计 = 1559（已排除 1 个 09-24 的陈旧报告 `Phase3PreFixOverlapReproducerTest.txt`，该类未出现在本次运行日志中）。两者一致。
- 自验通过，**不等于规划验收**；功能级状态与终态值等待规划裁定。

### 证据清单与哈希

证据目录：`evidence/phase6a-01/`（26 个文件；24 个被哈希，另 2 个为哈希清单与回读报告）。摘要与逐模块计数见 `phase6a-module-counts.tsv` 与 `phase6a-full-test-extract.txt`；sha256 清单见 `phase6a-hashes.sha256`，现场回读见 `phase6a-readback.txt`（24/24 校验通过）。

### 环境与边界

- Maven 3.8.6 / JDK 21 / 离线优先（`-o`），全部命令带 `MAVEN_OPTS="-Xmx2g"`；仅在本机默认 `~/.m2` 与临时 local repo `/tmp/bao6/m2` 之间活动。
- 前后端互斥：检测到前端为**空闲 dev server**（`pnpm dev` CPU 累计 0:07、`vite` 2:48，均自周二常驻），未运行任何前端构建，后端重型命令串行执行，未与前端编译并发。
- 环境中另有一处于 `local` profile 常驻的后端实例（非本阶段启动，未干预）。Phase 4/5 的全量基线同样在该条件下取得。
- 未读取或输出任何数据库连接值、凭据或密钥。
- 秘密扫描：本阶段改动面（19962 bytes diff）敏感模式命中 **0**，判定 CLEAN。
