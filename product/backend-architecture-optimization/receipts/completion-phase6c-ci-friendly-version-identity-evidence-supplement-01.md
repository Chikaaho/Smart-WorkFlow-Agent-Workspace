# Phase 6C · 版本身份门禁与可消费 POM 补证回执 01

> 角色：执行（Executor） ｜ 日期：2026-09-26
> 补证指令：`planning-execution-prompt-phase6c-version-identity-probe-supplement-01.md`（唯一执行入口）
> 前置复核：`planning-review-completion-phase6c-01-verifying.md`
> 状态：**`EXECUTION_SUBMITTED` / `feature_status=VERIFYING` / `next_action_type=WAIT_PLANNER`**
> 锁定项未重开：34/34 正向 POM 表达式、develop/release 32/32 版本矩阵、workflow 同源结构、Phase 6B 正式制品门禁、1570/0/0/0、ref 零修改与秘密扫描。本补证未改 34 个 POM、workflow、`build-prod.sh`、制品门禁或业务代码，故未重跑全量测试与生产构建。

## 1. G1 · 父版本分叉门禁：根因、修复与证明

**根因查明（方向 §2.1）**：旧探针"注入成功仍 exit 0"的原因是**路径集合错误**——旧 `mode_pom` 的 `all_poms` 在 `(cd REPO_DIR)` 子壳内 `find`，输出 REPO_DIR 相对路径（`./pom.xml` 等），而其后的 `xargs grep`/`awk` 在**调用者 cwd** 执行；调用者 cwd ≠ REPO_DIR 时全部探测静默落空（`No such file`），聚合计数恒为 0 → PASS。非根目录错位、非计数逻辑缺陷。（首次 BSD `sed '0,/…/'` 语法注入失败的日志属另一独立过程问题，仅作历史，不计入通过数。）

**修复（`scripts/check-version-identity.sh`，sha256 `dd0cd02e…`）**：`all_poms` 输出绝对路径；`pom` 模式改为**逐文件枚举断言**——根 POM 工程 version 恰为 `${revision}`，33 个子 POM 的 `com.sw.ck` parent version 各自恰为 `${revision}`，不合规文件输出**相对路径 + 实际值**；聚合计数仅作汇总展示，不作判定依据；另保留 `0.1.0` 字面量兜底扫描（逐处点名）。调用者 cwd 无关性已在 `/tmp` 下调用验证。

**探针（唯一临时完整副本）**：

| 步骤 | 结果 |
|---|---|
| 临时根 | `/tmp/6c-supp-tree`（gate 副本 + 34 个 POM 完整目录结构） |
| 前置断言 | 注入文件 `sw-framework/sw-common/pom.xml`；注入前第 10 行 `<version>${revision}</version>` → 注入后第 10 行 `<version>0.1.0</version>`，副本内 0.1.0 命中 1 |
| 工作树保护 | 正式工作树同路径 POM sha256 注入前后一致（`a214ba11…`）——未被探针触碰 |
| 临时根上运行 | **exit 1**，输出点名 `sw-framework/sw-common/pom.xml` 与 `0.1.0`（FAIL 不合规 POM（parent version）+ FAIL 字面量 0.1.0，共 2 个不合规项） |
| 正式工作树 | `pom` 模式仍 **PASS**（exit 0） |

## 2. 其余三向探针重跑（全部有效注入 + 非零失败）

| 探针 | 注入 | 结果 |
|---|---|---|
| 未解析 revision | 唯一临时 m2 副本中 `sw-common-0.2.0.pom` 版本字段 2 处改 `${revision}`（回读证据在案） | exit 1，FAIL 3 项（未解析占位符/版本 31/32/父版本） |
| release SNAPSHOT | B1 `release 0.2.0-SNAPSHOT` 参数即拒；B2 副本版本字段改 `0.2.0-SNAPSHOT` | B1 exit 1（不得含 SNAPSHOT/占位符）；B2 exit 1，FAIL 3 项 |
| Release 元数据不一致 | workflow 副本 `--title` 的 release_version 改为字面 `0.9.9`（注入后第 99 行可回读） | exit 1，FAIL「发布标题/注释存在非 release_version 的版本来源」 |

## 3. G2 · install 与仓外消费行为

1. **唯一临时 local repository**：`/tmp/6cs-m2-install`（保留至规划复核结束）。离线 install 前以 APFS 克隆既有本地缓存预置（无网络动作）——原因是空仓 + `-o` 时 `sw-dependencies` 自身的第三方 BOM import（spring-boot-dependencies 等）无法离线解析；克隆属于缓存预置，非解析来源替换。
2. **离线 install**：命令、exit 0、原始日志 1257 行（非空，`6cs-install-raw.log`）、`BUILD SUCCESS`、`Reactor Summary for Smart-WorkFlow 0.2.0`（32 项目，Total time 29.8s）——见 `6cs-install-command.txt`。
3. **installed 门禁 PASS**：版本 `0.2.0` 目录下 32 个安装 POM，工程版本 32/32、父版本 32/32 均为 `0.2.0`，版本字段无 SNAPSHOT，`${revision}` 命中 0（`6cs-gate-installed.txt`）。**34 POM 与 32 reactor/install 项的关系**：34 个 POM 文件中 `sw-basic-job` 与 `sw-basic-storage` 两个聚合 POM 不在 `<modules>` 内、不属于反应堆（不编译、不 install），其 `${revision}` 表达式由 `pom` 模式核验；参与 install 的是 root + 31 个反应堆子模块共 32 项。
4. **仓外最小 consumer**：`/tmp/6c-consumer/pom.xml`（源码仓外、无 relativePath），依赖已安装叶子模块 `com.sw.ck:sw-basic-iot-api:0.2.0`（零依赖契约模块）；`mvn -B -o dependency:tree -Dmaven.repo.local=/tmp/6cs-m2-install` → **exit 0，BUILD SUCCESS**，解析到 `com.sw.ck:sw-basic-iot-api:jar:0.2.0:compile`（`6cs-consumer-tree.log`、解析结果 `6cs-consumer-resolved.txt`）；构件唯一来源为该临时仓（仓内存在 `sw-basic-iot-api-0.2.0.jar/.pom`），全程未回退默认 `~/.m2`。
5. **默认 `~/.m2/com/sw/ck` 未新增 `0.2.0`**（仅有既有 `0.1.0`，`6cs-m2-check.txt`）。

## 4. 正式工作树与制品状态（如实记录）

- 正式工作树 POM：`pom` 模式 PASS（`6cs-formal-pom-gate.txt`）；`sw-framework/sw-common/pom.xml` sha256 探针前后一致。
- **`target/bootstrap.jar` 现状说明**：本补证的 install 不带 `clean`，sw-bootstrap 的 `target/classes` 残留上次正式构建的身份标记资源，故当前磁盘上的 bootstrap.jar（216898539 bytes）既非入口产物也非干净默认制品——这正是 Phase 6B 入口自带 `clean` 所防御的残留现象。正式生产制品以冻结的入口实跑记录为准（`REVISION=0.2.0` 下 216897994 bytes / sha256 `be629874…`，含 `build.version=0.2.0` 门禁断言），重跑入口即可复现。
- Git refs 零修改；未 commit/push/merge/tag/Release/deploy，未执行 Final。

## 5. 允许修改范围内的实际变更

仅 `scripts/check-version-identity.sh`（`pom` 模式逐项枚举化 + `installed` 模式版本范围限定），sha256 `dd0cd02ed651c5797b407b2f12bbe9c9c7c7676269cc815ccaa30d0c52fa5ceb`；未改 34 个 POM、workflow、`build-prod.sh`、`check-prod-artifact.sh`、业务代码、数据库或测试。

## 6. 证据清单（`evidence/phase6c-supplement-01/`，哈希现场回读全部通过）

`6cs-g1-parent-fork-probe.txt`、`6cs-other-probes.txt`、`6cs-formal-pom-gate.txt`、`6cs-gate-installed.txt`、`6cs-install-command.txt`、`6cs-install-raw.log`、`6cs-consumer-pom.xml`、`6cs-consumer-tree.log`、`6cs-consumer-resolved.txt`、`6cs-m2-check.txt`、`6cs-secret-scan.txt`、`6cs-hashes.sha256`、`6cs-readback.txt`（被哈希载荷 10 文件；目录物理文件 13 个，差值为本清单与回读文件）。

ENGINE_TERMINAL {"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"XL","receipt":"product/backend-architecture-optimization/receipts/completion-phase6c-ci-friendly-version-identity-evidence-supplement-01.md","feature_status":"VERIFYING","evidence":["product/backend-architecture-optimization/receipts/evidence/phase6c-supplement-01/（10 个被哈希载荷 + 清单/回读，10/10 sha256 现场回读通过；秘密扫描 CLEAN）","6cs-g1-parent-fork-probe.txt：根因=路径集合错误（all_poms 相对路径 vs 调用者 cwd）；pom 模式改逐文件枚举；唯一临时完整副本 /tmp/6c-supp-tree 注入 sw-framework/sw-common/pom.xml parent=0.1.0 后 gate exit 1 并点名文件与值；正式工作树同路径 POM sha256 注入前后一致且 pom 模式仍 PASS","6cs-other-probes.txt：未解析 revision、release SNAPSHOT（参数拒绝 + 版本字段注入）、Release 元数据不一致三向探针均以有效注入非零失败","6cs-install-command.txt + 6cs-install-raw.log：唯一临时仓 /tmp/6cs-m2-install 以 -Drevision=0.2.0 离线 install，exit 0、原始日志 1257 行、BUILD SUCCESS、Reactor 32 项目（仓以 APFS 克隆既有缓存预置，无网络动作）","6cs-gate-installed.txt：版本 0.2.0 下 32 个安装 POM 工程/父版本全部 0.2.0、版本字段无 SNAPSHOT、${revision} 命中 0","6cs-consumer-pom.xml + 6cs-consumer-tree.log + 6cs-consumer-resolved.txt：源码仓外最小 consumer 以唯一临时仓离线 dependency:tree exit 0，解析 com.sw.ck:sw-basic-iot-api:jar:0.2.0:compile，构件仅来自临时仓","6cs-m2-check.txt：默认 ~/.m2/com/sw/ck 未新增 0.2.0；临时仓保留至规划复核结束","6cs-formal-pom-gate.txt：正式工作树 pom 模式 PASS；正式生产制品以冻结入口实跑记录（be629874…）为准，磁盘 bootstrap.jar 因补证 install 无 clean 被默认 profile 构建覆盖（残留现象，已在回执 §4 如实说明）"],"work_items":[{"id":"G1-rootcause-and-fix","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"根因定位为路径集合错误并修复为绝对路径逐文件枚举；不合规输出相对路径+实际值；cwd 无关性验证"},{"id":"G1-fork-probe","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"唯一临时完整副本注入 parent=0.1.0，前置断言路径/行/值与正式 POM hash 不变，gate exit 1 点名文件与值，正式树 PASS"},{"id":"probes-rerun","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"未解析 revision / release SNAPSHOT / Release 元数据不一致三向均以有效注入非零失败"},{"id":"G2-install-and-consumer","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"新唯一临时仓离线 install（exit 0，BUILD SUCCESS，32 项目）；installed 门禁 PASS；仓外 consumer 离线解析 sw-basic-iot-api:0.2.0 成功且仅来自临时仓"},{"id":"evidence-freeze","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"10/10 哈希现场回读通过；秘密扫描 CLEAN；机器末行经 validate-terminal.sh 校验"}],"remaining_actionable_count":0,"independent_work_exhausted":true,"next_action":"等待规划（Planner）复核 Phase 6C 补证回执 01；G1/G2 均以行为证据关闭，Phase 6C 保持 VERIFYING，未 commit/push/merge/tag/Release/deploy，未执行 Final","next_action_type":"WAIT_PLANNER","progress_fingerprint":"phase6c-evidence-supplement-01-20260926","progress_basis":{"files_changed":["Smart-WorkFlow-aPaaS-server/scripts/check-version-identity.sh"],"tool_actions":["mode_pom 逐文件枚举化 + installed 模式版本范围限定（均为版本门禁直接相关修复）","唯一临时完整副本 /tmp/6c-supp-tree 的父版本分叉探针（前置断言 + exit 1 点名）","其余三向探针有效注入重跑","新唯一临时仓 /tmp/6cs-m2-install 离线 install + installed 门禁","仓外 /tmp/6c-consumer 离线 dependency:tree 消费证明","~/.m2 0.2.0 零新增检查与 10/10 哈希回读"],"new_evidence":["旧探针缺陷根因定位并修复：路径集合错误（相对路径 vs 调用者 cwd），pom 模式升级为逐文件枚举、cwd 无关","父版本分叉探针 exit 1 且点名 sw-framework/sw-common/pom.xml 与 0.1.0；正式工作树 POM hash 未变且 pom 模式 PASS","四向探针（含重跑）全部以有效注入非零失败","release install 在唯一临时仓 exit 0/BUILD SUCCESS/32 项目，installed 门禁 PASS，仓外 consumer 离线解析 0.2.0 成功","默认 ~/.m2 未新增 0.2.0；临时仓按指示保留"],"closed_work_items":["G1-rootcause-and-fix","G1-fork-probe","probes-rerun","G2-install-and-consumer","evidence-freeze"]},"stop_reason":"WAITING_FOR_PLANNER","tool_results":[{"tool":"Bash/script","outcome":"SUCCEEDED","detail":"修复后 pom 模式在正式树 PASS（/tmp 下调用亦 PASS），在注入副本 exit 1 并点名 sw-framework/sw-common/pom.xml 实际值 0.1.0"},{"tool":"Bash/script","outcome":"SUCCEEDED","detail":"三向探针有效注入后分别 exit 1（installed 3 项 FAIL / release 参数拒绝 / workflow 元数据 FAIL）"},{"tool":"Bash/mvn","outcome":"SUCCEEDED","detail":"唯一临时仓离线 install exit 0（1257 行原始日志、BUILD SUCCESS、32 项目）；consumer 离线 dependency:tree exit 0（解析 sw-basic-iot-api:0.2.0）"},{"tool":"Bash/script","outcome":"SUCCEEDED","detail":"installed 门禁（版本范围限定）PASS：32/32 版本与父版本 0.2.0、无占位符、版本字段无 SNAPSHOT"},{"tool":"Bash/file","outcome":"SUCCEEDED","detail":"证据 10 个被哈希载荷 10/10 回读 OK；秘密扫描 CLEAN；正式工作树探针目标 POM sha256 注入前后一致"}],"browser_status":"NOT_APPLICABLE"}
