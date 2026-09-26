# Phase 6C · CI-friendly 版本身份 完成回执 01

> 角色：执行（Executor） ｜ 日期：2026-09-26 ｜ 等级：XL ｜ 对应候选：BAO-09
> 方向：`../ready/direction-phase6c-ci-friendly-version-identity.md`
> Owner 裁决：`../receipts/planning-owner-phase6c-version-strategy-20260926.md`
> 状态：**`EXECUTION_SUBMITTED` / `feature_status=VERIFYING`**（不自写 `PASSED/COMPLETED`，不执行 Final）

## 1. 起始事实与预检（方向 §2）

- 本地：`develop@76dc947da5e031cca557cee7f3983a64c0d682dc`，开工时 `git status --porcelain` **304 项**；原地实施，未 fetch/pull/merge/rebase/checkout，未改任何 ref。
- 只读 `git ls-remote`：`develop=51afb8fb…`、`main=d18e9a39…`、`0.1.0^{}`=`d18e9a39…`，远端无 `0.1.1` tag —— 与规划回读一致（`6c-ref-identity.txt`）。
- 远端 develop 对象 `51afb8fb…` **不在本地对象库**：按方向如实报告「**无法计算提交图**」，不作 ahead/behind 猜测。
- 字面量盘点：34/34 POM 各恰含一处 `<version>0.1.0</version>`（根 GAV + 33 个 parent 块），无子 POM 自带版本声明 → 统一替换可逐项审计（台账 `6c-pom-edits.tsv`）。
- Flatten 插件未缓存：按方向 §5 允许完成**一次联网引导**（坐标 `org.codehaus.mojo:flatten-maven-plugin:1.6.0`，来自 Maven Central；`maven-help-plugin:3.5.1` 一并缓存，记录 `6c-plugin-bootstrap.txt`），最终全部门禁以 `MVN_FLAGS=-o` 离线复跑通过。

## 2. 实施内容（34 POM + marker + 3 scripts + workflow，逐项可审计）

| 项 | 内容 |
|---|---|
| 根 POM | GAV `<version>${revision}</version>`；`<properties>` 唯一开发默认 `<revision>0.2.0-SNAPSHOT</revision>`；`build/plugins` 固定 Flatten Maven Plugin `1.6.0`（`flatten`→`process-resources`、`flatten.clean`→`clean`、`flattenMode=resolveCiFriendliesOnly`、`updatePomFile=true` 含 pom packaging、版本集中定义、`outputDirectory=${project.build.directory}` 使 `.flattened-pom.xml` 落在 target/ 不进 Git） |
| 33 个子 POM | `com.sw.ck` 父版本 → `${revision}`；替换后 `<version>0.1.0</version>` 全仓命中 0、`<version>${revision}</version>` 命中 34/34 |
| 身份标记 | `META-INF/production-build.properties` 新增 `build.version=${project.version}`；prod profile 仅对该文件开启 Maven 资源过滤（刻意 exclude Spring `application*.yml`，防止 `${...}` 被过滤改写） |
| 制品门禁 | `scripts/check-prod-artifact.sh` 新增：`build.version` 必须已解析（占位符即失败）；`EXPECTED_VERSION`（release 模式）必须非 SNAPSHOT/占位符且与标记精确一致 |
| 版本门禁 | 新增 `scripts/check-version-identity.sh`（fail closed）：`pom` / `develop` / `release <v>` / `installed <repo> <v>` / `workflow` 五模式 |
| 生产入口 | `scripts/build-prod.sh` 以 `REVISION` 环境变量把 `-Drevision=<value>` 同时注入 `[1/3] clean test`、`[2/3] -Pprod package`、`[3/3]` 门禁（`EXPECTED_VERSION`），同版本贯穿；摘要输出生效版本 |
| Release workflow | 以 `maven-help-plugin help:evaluate -DforceStdout` 读 effective version（删除 XML grep），断言 `0.2.0-SNAPSHOT`，正式值由其剥离 `-SNAPSHOT` 解析为 `0.2.0`，以 `REVISION=0.2.0` 调用唯一生产入口；制品内 `build.version` 为发布版本唯一来源并与 release version 一致性断言；Release 标题/notes/上传制品名（`bootstrap-0.2.0.jar`）同源；`build-<full-SHA>` tag 规则保留 |
| 未动项 | groupId/artifactId/模块树/业务依赖版本/根 POM `<url>`/发布历史/业务代码/迁移 |

发现并如实记录的结构事实：反应堆项目数为 **32**（`sw-basic-job`、`sw-basic-storage` 两个聚合 POM 不在 `<modules>` 内、不参与构建/安装），与既有「32 模块」口径一致；二者仍为 34 POM 之一并由 `pom` 模式核验 `${revision}`。

## 3. 验收门禁对照（方向 §5，1—10）

| # | 门禁 | 结果 | 证据 |
|---|---|---|---|
| 1 | POM 结构 34/34；根 `${revision}`；33 子父版本 `${revision}`；旧字面量 0 | **PASS（离线）** | `6c-gate-pom.txt`（3 OK）+ `6c-pom-edits.tsv` |
| 2 | develop 解析 32/32 = `0.2.0-SNAPSHOT`，无空值/占位符/分叉 | **PASS（离线）** | `6c-gate-develop.txt`；矩阵 `6c-version-matrix-develop.txt`（32 行 0 未命中） |
| 3 | release 解析 `-Drevision=0.2.0` 32/32 = `0.2.0`，无 SNAPSHOT | **PASS（离线）** | `6c-gate-release.txt`；矩阵 `6c-version-matrix-release.txt` |
| 4 | 可消费 POM：唯一临时 local repo（`/tmp/6c-m2`）release install；版本/父版本 `0.2.0`、`${revision}` 0；`~/.m2` 未污染 | **PASS（离线）** | `6c-install-temp-repo.log`（exit 0）+ `6c-gate-installed.txt`（32 POM：版本 32/32、父版本 32/32、占位符 0、版本字段 SNAPSHOT 0）；`~/.m2` 仅既有 `0.1.0`，无 `0.2.0` |
| 5 | 发布链路：Maven 求值 → 同一 release version 驱动构建/标题/制品名/版本标记 | **PASS（静态）** | `6c-gate-workflow.txt`（8 项结构断言）；运行时同源由门禁 `build.version` 一致性断言闭环 |
| 6 | fail-closed 探针 4/4 非零失败；工作树与最终制品 hash 未被污染 | **PASS** | `6c-gate-probes.txt`、`6c-gate-probes-retry.txt`：①已安装 POM 注入未解析 `${revision}`→FAIL(3 项)；②`release 0.2.0-SNAPSHOT`→立即拒绝 + 版本字段 SNAPSHOT→FAIL(3 项)；③临时 POM 树单模块父版本写死 `0.1.0`→FAIL；④workflow 副本标题改为独立字面版本→FAIL；探针窗口制品 sha256 前后一致 |
| 7 | Phase 6B 回归：显式 release revision 调用入口整体 exit 0；负向 10 项全 0、正向 6 项、prod marker 保持 + 版本一致性断言 | **PASS** | `6c-entry-build.txt`：`REVISION=0.2.0 MVN_FLAGS=-o scripts/build-prod.sh` **ENTRY_EXIT=0**，门禁 PASS（负向 0 违规/正向齐备/`build.profile=prod`/`build.version=0.2.0` 且与期望一致） |
| 8 | 全量回归（默认 develop revision）≥1570，0/0/0；release 构建与默认测试串行 | **PASS** | `6c-full-test-extract.txt`：`MAVEN_OPTS="-Xmx2g" mvn -B -o test` **1570/0/0/0，exit 0**；入口内 release 同版本测试步独立聚合 **1570/0/0/0**（串行执行） |
| 9 | 历史身份保护：本地/远端 ref 只读回读；零 tag/Release 新增；未 deploy | **PASS** | `6c-ref-identity.txt`：HEAD/分支未变；远端与规划回读一致；本地 tag 列表无 `0.1.1`/`0.2.0`；未创建 Release、未 deploy |
| 10 | 可复跑证据 + 哈希现场回读 | **PASS** | `evidence/phase6c-01/` 17 文件，`6c-readback.txt` 17/17 OK；秘密扫描 CLEAN（`6c-secret-scan.txt`，高信号命中 0） |

## 4. 行为与语义说明

- develop 工作树默认解析 `0.2.0-SNAPSHOT`；`REVISION=0.2.0`（或 workflow 自动解析）时全 reactor、可消费 POM、生产制品标记同为 `0.2.0`。
- `resolveCiFriendliesOnly` 只解析版本字段；根 POM flattened/installed 后的 `<properties>` 仍保留 `<revision>` 属性定义（flatten 既定行为，非版本字段）——`installed` 模式的 SNAPSHOT 检查因此只针对版本字段，并已在证据中说明。
- `help:evaluate` 不随多模块聚合，版本门禁的 develop/release 模式改为全反应堆 `process-resources` + 逐模块 flattened POM 断言（`validate` 阶段 Enforcer 收敛守门随之真实执行）；临时 local repo 的 release install 证明同一模型可被下游消费。
- 本阶段不证明腾讯 IoT 真实云端送达，不改变 H2/dev 边界与 IoT 生产语义；GitHub About/根 POM canonical URL 仍属 Final。

## 5. 边界遵守

未 commit/push/merge/tag/Release/deploy，未切换分支、未改写历史、未更新远端引用；既有 tag/Release 指针零修改；未使用 `versions:set`，34 个 POM 变更逐项可审计（`6c-pom-edits.tsv` + git diff）；未停止常驻服务；`.flattened-pom.xml` 全部位于 target/（git status 零泄漏），临时 local repository 位于 `/tmp/6c-m2`。

## 6. 回滚

整体回滚点 = 根 POM（GAV/revision 属性/Flatten 插件段）、33 个子 POM 的 parent version、`sw-bootstrap` marker 与 prod 资源过滤段、`scripts/build-prod.sh` 的 REVISION 段、`scripts/check-prod-artifact.sh` 的版本断言段、`scripts/check-version-identity.sh`（删除）、Release workflow 版本链；回滚后须重新构建并清理 `.flattened-pom.xml` 与 `/tmp/6c-m2`。既有 tag/Release 无需也不得回滚。

## 7. 证据清单（`evidence/phase6c-01/`，17 文件哈希回读全部通过）

`6c-ref-identity.txt`、`6c-pom-edits.tsv`、`6c-plugin-bootstrap.txt`、`6c-gate-pom.txt`、`6c-gate-develop.txt`、`6c-gate-release.txt`、`6c-gate-installed.txt`、`6c-gate-workflow.txt`、`6c-gate-probes.txt`、`6c-gate-probes-retry.txt`、`6c-install-temp-repo.log`、`6c-entry-build.txt`、`6c-entry-exit.txt`、`6c-full-test-extract.txt`、`6c-version-matrix-develop.txt`、`6c-version-matrix-release.txt`、`6c-secret-scan.txt`、`6c-hashes.sha256`、`6c-readback.txt`。

ENGINE_TERMINAL {"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"XL","receipt":"product/backend-architecture-optimization/receipts/completion-phase6c-ci-friendly-version-identity-01.md","feature_status":"VERIFYING","evidence":["product/backend-architecture-optimization/receipts/evidence/phase6c-01/（17 文件，17/17 sha256 回读通过；秘密扫描 CLEAN）","6c-ref-identity.txt：本地 develop@76dc947d 与 304→327 项工作树、远端 develop/main/0.1.0^{} 与规划回读一致、无 0.1.1/0.2.0 tag 新增；远端 develop 对象不在本地，如实报告无法计算提交图","6c-pom-edits.tsv：33 个子 POM 父版本逐文件台账（before=1/after=0/after_revision=1）；全仓 <version>0.1.0</version> 命中 0，${revision} 命中 34/34","6c-gate-pom.txt / 6c-gate-develop.txt / 6c-gate-release.txt / 6c-gate-installed.txt / 6c-gate-workflow.txt：五模式版本门禁全部离线 PASS（34/34 结构、32/32 develop=0.2.0-SNAPSHOT、32/32 release=0.2.0、可消费 POM 版本/父版本 0.2.0 且 ${revision}=0、workflow 八项静态断言）","6c-gate-probes.txt + 6c-gate-probes-retry.txt：四向 fail-closed 探针全部非零失败（未解析 revision/release SNAPSHOT/单模块父版本分叉/Release 元数据不一致），探针窗口制品 sha256 前后一致","6c-entry-build.txt + 6c-entry-exit.txt：REVISION=0.2.0 时 scripts/build-prod.sh 整体 exit 0，门禁 PASS（负向 10 项全 0、正向 6 项、prod marker、build.version=0.2.0 与期望一致），制品 216897994 bytes / sha256 be629874…","6c-full-test-extract.txt：默认 develop revision 下 mvn -B -o test 1570/0/0/0 exit 0；入口内 release 同版本测试步独立聚合 1570/0/0/0；release 构建与默认测试串行","6c-install-temp-repo.log：唯一临时 local repository（/tmp/6c-m2）release override install exit 0；~/.m2 未污染（仅既有 0.1.0）","6c-plugin-bootstrap.txt：flatten-maven-plugin 1.6.0 与 maven-help-plugin 3.5.1 一次性联网引导记录，最终门禁全部离线复跑","6c-version-matrix-develop.txt + 6c-version-matrix-release.txt：32/32 模块版本矩阵（develop=0.2.0-SNAPSHOT、release=0.2.0，零未命中）"],"work_items":[{"id":"precheck-refs","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"本地/远端 ref 只读回读完成；远端 develop 对象不在本地，按方向报告无法计算提交图"},{"id":"pom-contract","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"根 POM ${revision}+0.2.0-SNAPSHOT 默认+Flatten 1.6.0；33 子 POM 父版本表达式化，0.1.0 字面量 0"},{"id":"identity-chain","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"marker build.version 过滤注入、制品门禁版本断言、build-prod.sh 同版本透传、check-version-identity.sh 五模式、workflow Maven 求值链"},{"id":"gates-and-probes","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"五向门禁 PASS + 四向探针全部非零失败且制品 hash 未污染"},{"id":"regression","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"REVISION=0.2.0 入口整体 exit 0（Phase 6B 门禁保持 + 版本断言）；默认 revision 全量 1570/0/0/0"},{"id":"receipt","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已提交完成回执，等待规划复核"}],"remaining_actionable_count":0,"independent_work_exhausted":true,"next_action":"等待规划（Planner）复核 Phase 6C 完成回执 01；本阶段未 commit/push/merge/tag/Release/deploy，未执行 GitHub About/根 POM URL 收口（属 Final），最终仓库展示项继续 QUEUED","next_action_type":"WAIT_PLANNER","progress_fingerprint":"phase6c-execution-submitted-20260926","progress_basis":{"files_changed":["pom.xml","sw-dependencies/pom.xml","sw-framework/pom.xml","sw-framework/sw-common/pom.xml","sw-framework/sw-security/pom.xml","sw-basic/pom.xml","sw-biz/pom.xml","sw-bootstrap/pom.xml","（其余 26 个模块 POM 同规则替换，完整台账见 evidence/phase6c-01/6c-pom-edits.tsv）","sw-bootstrap/src/prod/resources/META-INF/production-build.properties","scripts/build-prod.sh","scripts/check-prod-artifact.sh","scripts/check-version-identity.sh",".github/workflows/build-release.yml"],"tool_actions":["git status/HEAD/ls-remote 只读预检与 34 POM 字面量盘点","34 POM ${revision} 化 + 根 POM Flatten 插件（一次性联网引导后离线复跑）","check-version-identity.sh 五模式门禁（pom/workflow/develop/release/installed，全部离线 PASS）","四向 fail-closed 探针（临时副本，正式制品 hash 前后一致）","REVISION=0.2.0 scripts/build-prod.sh 整体实跑（exit 0）","默认 revision 全量 mvn -B -o test（1570/0/0/0 exit 0）","秘密扫描与 17/17 哈希现场回读"],"new_evidence":["develop 工作树默认解析 0.2.0-SNAPSHOT、release 显式解析 0.2.0，全 reactor 32/32 + 可消费 POM 32/32 无占位符","正式生产制品含 build.version=0.2.0 且与 EXPECTED_VERSION/CI 链同源","四向 fail-closed 探针全部非零失败，负向能力成立","release override 下 Phase 6B 全部门禁保持（负向 10 项全 0、正向 6 项、marker）且全量 1570/0/0/0","历史 ref 零修改；本地 tag 无新增；未执行任何发布动作"],"closed_work_items":["precheck-refs","pom-contract","identity-chain","gates-and-probes","regression","receipt"]},"stop_reason":"WAITING_FOR_PLANNER","tool_results":[{"tool":"Bash/git","outcome":"SUCCEEDED","detail":"预检与验收时两轮只读回读：HEAD 76dc947d 未变，远端 develop/main/0.1.0^{} 与规划一致，无新 tag；远端 develop 对象不在本地，未猜测 ahead/behind"},{"tool":"Bash/mvn","outcome":"SUCCEEDED","detail":"flatten 一次性联网引导后，pom/develop/release/installed/workflow 五模式门禁离线全部 PASS；临时 local repo install exit 0"},{"tool":"Bash/script","outcome":"SUCCEEDED","detail":"REVISION=0.2.0 build-prod.sh 整体 exit 0：门禁 PASS（负向 10 项全 0、正向 6 项、build.version=0.2.0 一致）"},{"tool":"Bash/script","outcome":"FAILED","detail":"四向探针按预期非零失败（该 FAILED 即探针的预期结果）；正式制品与工作树未被污染"},{"tool":"Bash/mvn","outcome":"SUCCEEDED","detail":"默认 develop revision 全量 mvn -B -o test 1570/0/0/0 BUILD SUCCESS exit 0；入口内 release 同版本测试步独立聚合 1570/0/0/0"},{"tool":"Bash/file","outcome":"SUCCEEDED","detail":"证据 17 文件哈希现场回读全部 OK；秘密扫描高信号命中 0（CLEAN）"}],"browser_status":"NOT_APPLICABLE"}
