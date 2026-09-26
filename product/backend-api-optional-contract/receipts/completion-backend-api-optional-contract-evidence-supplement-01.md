# backend-api-optional-contract · 补充证据回执 01

> 角色：执行（Executor）  
> 日期：2026-09-24T11:02:54+08:00  
> 任务等级：XL  
> 性质：**纯补证**（不改 production/test/POM/配置，不修复新问题，不扩大实现）  
> 完成回执（保持原样，未修改）：`product/backend-api-optional-contract/receipts/completion-backend-api-optional-contract-01.md`（`EXECUTION_SUBMITTED / VERIFYING`）  
> 证据目录：`product/backend-api-optional-contract/receipts/evidence/completion-01/`（27 个文件，全部从 `product/` 可回读）

## 1 补证范围

按本轮任务书，仅补齐“可持久回读的验收证据”：固定行为输入身份与哈希、账本机器复算、6 项验证命令的持久原始输出与真实退出码、架构与零残留扫描、非目标未漂移、守门反例、证据包哈希。**未**启动 BAO-01—BAO-10 审计，**未**开展 Phase 2，**未**修改任何仓库代码。

## 2 实际生成文件

证据目录 `product/backend-api-optional-contract/receipts/evidence/completion-01/`：

| 文件 | 用途 | SHA-256（前 16 位） |
|---|---|---|
| `am-ledger-recalculation.txt` | 121 项 AM 账本机器复算（三轮：规则过宽→脚本缺陷→PASS） | `3842ca5843472e59…` |
| `behavior-input-sha256-check.txt` | 行为输入哈希回读校验（312/312 OK） | `a21464832fe9fc55…` |
| `behavior-input.sha256` | 行为输入 SHA-256 清单（312 条：变更与新增文件 + 6 个 -api 模块 production 源 + 全部 pom.xml） | `5f6ccf69d59630fd…` |
| `changed-files.txt` | tracked 修改 194 / untracked 16 精确清单与 194/204 计数解释 | `3523a2c59142c4a2…` |
| `command-results.tsv` | 6 项命令的命令/工作目录/起止时间/退出码/精确计数/BUILD 结论 | `3468eaf74f706c4b…` |
| `deleted-contract-residual-scan.txt` | 8 个删除项定义/实现/项目内引用三层残留扫描（两轮） | `6630b59d1fe2f1a2…` |
| `evidence-sha256-check.txt` | 证据包哈希回读校验（25/25 OK） | `（清单外）` |
| `evidence.sha256` | 证据包 SHA-256 清单（25 条） | `（清单外）` |
| `forbidden-pattern-scan.txt` | 禁止模式扫描原始输出 + 逐项命中解释（含规则迭代记录） | `975089a189f53cb5…` |
| `full-maven-test.log` | 仓库根 mvn -B test 全量门禁原始日志（1457/0/0/0） | `54d5aad77727c0bd…` |
| `notify-module-test.log` | notify-biz 默认参数全模块测试日志（含 I6 文件库前后状态） | `1d09e0089880fa04…` |
| `optional-boundary.log` | AM-035/AM-062 边界与哨兵移除测试日志（exit 0） | `6e7abc5f687522ed…` |
| `optional-consumer-scan.txt` | 生产调用点 Optional 消费扫描（183 处，1 处真实命中） | `960fb6c6b092d4f4…` |
| `optional-contract-gate.log` | 守门测试日志 + 五类反例实际守门消息（附加证据段） | `66e6a1e4f59f30e1…` |
| `resource-mutex-check.txt` | 前后端编译互斥检查（两轮检测 + 规则/指令冲突留痕） | `0fcf79a146425a09…` |
| `scope-drift-check.txt` | 迁移/路由/前端/计数未漂移与 Git 边界证据 | `d84f074060e34f64…` |
| `scripts/GateNegativeDriver.java` | 守门反例取证驱动源码 | `ca7680e8862e0695…` |
| `scripts/explain-hits.py` | 命中逐项分类脚本 | `22c76922d50ec469…` |
| `scripts/ledger-recalc.py` | 121 项账本复算脚本 | `b8bc634816e1d1ad…` |
| `scripts/run-logged.sh` | 命令记录器（pipefail + tee + PIPESTATUS 取真实退出码） | `ecb6be334224495d…` |
| `scripts/scan-deleted-residuals.py` | 删除项残留扫描脚本 | `8e21d43899c908ac…` |
| `scripts/scan-forbidden.py` | 禁止模式扫描脚本 | `1f0a6d0770065cce…` |
| `scripts/scan-optional-consumers.py` | 调用点消费扫描脚本 | `0233a2a8f7a596fc…` |
| `scripts/summarize-runs.py` | 命令结果汇总器 | `429bd28ee6f46b9a…` |
| `system-semantics.log` | 两层语义与租户有效性装配测试日志（exit 0） | `24545d8dee08185e…` |
| `test-compile.log` | 全仓 mvn -B -o test-compile 原始日志（exit 0） | `95a8b99daea4369f…` |
| `workspace-identity.txt` | 分支、HEAD、git status 全量输出、工作区仓状态 | `9b038ec206e10396…` |

（完整 25 条哈希见 `evidence.sha256`；`evidence-sha256-check.txt` 为校验记录本身，按设计不在清单内。）

## 3 每项命令与退出码

来源：`command-results.tsv`（由 `scripts/summarize-runs.py` 从各日志的 `run-logged.sh` 头尾解析）。日志与命令均由 `/bin/bash` + `set -o pipefail` + `tee` 记录，退出码取被管道左端命令的真实值（`PIPESTATUS[0]`），非 `tee` 的退出码。

| # | 命令（工作目录：`Smart-WorkFlow-aPaaS-server`） | 退出码 | BUILD |
|---|---|---|---|
| C1 | `MAVEN_OPTS="-Xmx2g" mvn -B -o test-compile` | 0 | BUILD SUCCESS |
| C2 | `MAVEN_OPTS="-Xmx2g" mvn -B -o test -pl sw-bootstrap -Dtest=ApiOptionalContractGateTest -DfailIfNoTests=false` | 0 | BUILD SUCCESS |
| C3 | `MAVEN_OPTS="-Xmx2g" mvn -B -o test -pl sw-biz/sw-bpm/sw-bpm-engine -Dtest=ApiOptionalContractBoundaryTest -DfailIfNoTests=false` | 0 | BUILD SUCCESS |
| C4 | `MAVEN_OPTS="-Xmx2g" mvn -B -o test -pl sw-biz/sw-biz-system/sw-biz-system-biz -Dtest=DictFacadeTest,OrgAuthorityFacadeIntegrationTest,SystemAutoConfigurationTenantValidityTest -DfailIfNoTests=false` | 0 | BUILD SUCCESS |
| C5 | `MAVEN_OPTS="-Xmx2g" mvn -B -o test -pl sw-basic/sw-basic-notify/sw-basic-notify-biz`（默认参数，全模块） | 0 | BUILD SUCCESS |
| C6 | `MAVEN_OPTS="-Xmx2g" mvn -B test`（仓库根全量门禁） | 0 | BUILD SUCCESS |

开始/结束时间（ISO）与逐项 tests 计数同见 `command-results.tsv`。

## 4 精确测试计数（本轮固定输入实测）

| # | 范围 | tests | failures | errors | skipped |
|---|---|---|---|---|---|
| C1 | 全仓编译（无测试） | 0 | 0 | 0 | 0 |
| C2 | `ApiOptionalContractGateTest` | 6 | 0 | 0 | 0 |
| C3 | `ApiOptionalContractBoundaryTest` | 8 | 0 | 0 | 0 |
| C4 | Dict / OrgAuthority / TenantValidity 三测试类 | 13 | 0 | 0 | 0 |
| C5 | `sw-basic-notify-biz` 全模块 | 118 | 0 | 0 | 0 |
| C6 | **仓库根全量（13 个含测试模块，244 个测试类）** | **1457** | **0** | **0** | **0** |

C6 逐模块（权威值，本轮实测）：Common 32、Security 17、Storage 29、Notify 118、Job 51、IoT 50、Agent 346、System 305、Form 133、BPM Engine 58、BPM Process 205、OpenAPI 10、Bootstrap 103，合计 1457；日志中模块级总计行 13 行、类级明细行 244 行，两种口径求和一致（1457）。

## 5 121 项账本复算结果（`am-ledger-recalculation.txt`）

脚本 `scripts/ledger-recalc.py`（机器复算，非人工清单）三轮输出全部留档：

| 断言 | 结果 | 证据 |
|---|---|---|
| R1 `AM-001`—`AM-121` 连续、唯一（缺失/越界/重复均为空） | PASS | 第三轮输出 `ID 数: 121；唯一 ID 数: 121` |
| R2 `121 = 113 保留并合规 + 8 删除并闭合` | PASS | 第三轮输出 `保留并合规: 113 / 删除并闭合: 8 / 合计: 121` |
| R3 113 个保留方法全部返回参数化 `Optional<T>`（无 raw/Void/嵌套） | PASS | 第三轮输出 `保留项中非参数化 Optional / Void / 嵌套: 0 []` |
| R4 8 个删除项在 -api 定义 / 实现 / 项目内引用三层无残留 | PASS | `deleted-contract-residual-scan.txt`：L1 定义命中 0、L2 实现命中 0、L3 仅剩守门测试的“不存在”断言与 4 处已说明的同名/第三方命中 |
| R5 13 个原 ZERO_CALLER 与 AM-120 均有最终处置 | PASS | 第三轮 R5 段：8 项删除并闭合、5 项保留并迁移、AM-120 保留并迁移（DEPRECATED，有内部调用者） |

机器复算与架构守门互为独立实现，两处均得出“纳入 113 个契约方法、0 违规”，互相印证。

## 6 204 / 194 文件计数解释（`changed-files.txt`）

| 口径 | 命令 | 结果 |
|---|---|---|
| tracked 修改文件数 | `git status --porcelain`（` M` 条目）＝ `git diff --name-only` | **194** |
| `git status --porcelain` 行数 | 默认未跟踪折叠模式 | **204** = 194（tracked 修改）+ 10（未跟踪**目录条目**，折叠表示） |
| untracked 文件数 | `git status --porcelain -uall`（`??` 条目） | **16** 个文件（分布在 10 个目录条目中） |
| 逐文件展开总条目 | `git status --porcelain -uall | wc -l` | **210** = 194 + 16 |

因此：完成回执中“204 个文件变更”= tracked 修改 194 + 未跟踪目录条目 10（默认折叠口径）；按文件逐个展开应为 194 tracked + 16 untracked = 210 个文件。`git diff --shortstat` 本轮实测为 **194 files changed, +3124 / −1736**（完成回执记录的 +3123/−1735 是该轮较早时点的中间测量，差 1 行来自其后的证据相关测试收尾改动；文件数不变）。

## 7 合法扫描命中解释（摘要）

完整命令、原始输出与逐项解释见 `forbidden-pattern-scan.txt`、`deleted-contract-residual-scan.txt`、`optional-consumer-scan.txt`。摘要：

| 模式 | 命中 | 结论 |
|---|---|---|
| raw `Optional` / `Optional<Void>` / 嵌套 `Optional` | 0 / 0 / 0 | 无违规 |
| `Result<Optional<T>>` / `R<Optional<T>>` / `Optional<Result<T>>` | 0 / 0 / 0 | 无嵌套结果类型 |
| Controller/HTTP 返回或序列化 `Optional` | 0 | 对外响应不含 Optional |
| `-api` 契约方法非 `Optional` 返回 | 0（纳入 113） | 与账本 R3 一致 |
| `orElse(null)` | 21 | 接收者全部为内部服务/容器 Optional，0 条涉及契约方法（含 sw-bootstrap/src 为 22 条，同样 0 条涉及契约） |
| `Optional.get()` 无前置证明 | 0（41 条有证明） | 工具早期 6 条误报经人工复核为“多行赋值/AssertJ 断言/远距离抛错守卫” |
| `-api` 模块内 `return null` | 3 | 全部位于 `RestrictedExpressionEvaluator` 私有求值链，公共入口 `Optional.ofNullable` 包装 |
| 实现文件内 `return null` | 19 | 类型感知分类：19 条所属方法均为私有辅助方法，0 条命中契约方法 |
| 字符串 `"NOT_FOUND"` | 4 | 2 条 Javadoc、1 条注释、1 条 openapi **对外 HTTP 边界**字面量映射（方向 §4.0 要求；内部契约已无该哨兵） |
| `return -1` | 4 | agent 域内部回退（模块本轮零改动）、测试辅助、`findTopLevel` 索引约定；无契约缺失哨兵 |
| 8 个删除项残留 | 0 可疑 | 定义 0、实现 0、引用仅剩守门测试“不存在”断言与已说明同名/第三方命中 |
| 生产调用点未消费 Optional 返回值 | 183 处调用点中 8 处忽略，其中 **1 处可能 empty** | 7 处属 Javadoc 明示“empty 不可达”的方法；1 处为真实命中（见 §8-4） |

## 8 失败与偏差（如实记录，未修饰）

1. **互斥规则与 Owner 指令的冲突**（`resource-mutex-check.txt`）：检测到前端 `pnpm dev` + `vite` 长驻进程仍在运行，按 `knowledge/shared-constraints.md` §6 应先等待。已完成两轮等待-复检并**未强杀**前端进程；随后按本轮 Owner 明确指令（要求重新执行并保存后端门禁）执行，依据 `system.md` §7.1“Owner 当前明确指令优先于既有规则”；执行期间全部命令串行、统一 2G 内存上限、对前端进程零操作。该冲突已显式留痕，供规划判定是否需要额外口径确认。
2. **完成回执 §8 标准 13 的逐模块计数有误（总计正确）**：回执列出 `system-biz 299`、`bpm-engine 50`、`bpm-api 0`，缺少 `IoT 50`、`Agent 346`；本轮实测为 `System 305`、`Engine 58`，无 bpm-api 测试、IoT 50、Agent 346。根因：该处逐模块数字取自各分区负责人在**补充测试之前**的模块级运行（299+6=305、50+8=58），而总计 1457 取自最终全量运行、正确。**处理：本轮不修改完成回执**（避免在被审阅产物上事后改写），改由本回执给出权威逐模块表；如需更正，请规划指示后由执行补一条更正记录。
3. **`git diff --shortstat` 行数漂移**：完成回执记录 +3123/−1735，本轮固定输入实测 +3124/−1736（文件数 194 不变）。原因同 §6：回执记录的是较早时点的中间测量。
4. **真实命中（发现未修复）**：`sw-bpm-engine/.../listener/DynamicBranchTaskListener.java:100` 的 `port.recordAction(...)`（AM-107，契约 empty = 分支尚未冻结的防御路径）未消费返回值。判定：不属于重新制造哨兵/吞异常/以 empty 当错误通道；但属“调用方未显式消费 empty”。按本轮“不修复新问题、不扩大实现”如实报告，是否出后续小刀由规划决定。
5. **工具迭代留痕**：三份扫描脚本规则均经多轮收紧（账本 R4 的 5 条 getUrl 误报、`.get()` 14→6→0、调用点扫描 v1→v5 从 952 降至 1 条真实命中、`-api` 第 11 节 2 条嵌套 record 误判），每轮的原始终出与根因均已留档；迭代只改证据脚本，未改仓库代码。
6. **远端引用观察（非本轮产生）**：只读 `ls-remote` 显示 Server `refs/heads/develop` = `51afb8fbcbe305f4e618c8191d4a8fe193981d15`，而本地跟踪引用 `origin/develop` = `073cb39f`（陈旧，本轮未 fetch）。提示规划核对知识库中的 origin/develop 记录；本轮无任何 fetch/push 动作。

## 9 证据文件与哈希索引

- 清单：`product/backend-api-optional-contract/receipts/evidence/completion-01/evidence.sha256`（25 条，哈希范围 = 除清单与校验记录外的全部证据文件）
- 校验：`product/backend-api-optional-contract/receipts/evidence/completion-01/evidence-sha256-check.txt` → `OK 计数: 25`、`FAILED 计数: 0`、`exit_code: 0`、判定 **PASS**
- 行为输入清单与校验：`behavior-input.sha256`（312 条）+ `behavior-input-sha256-check.txt`（312 OK / 0 FAILED / exit 0）
- 回读方式：`cd product/backend-api-optional-contract/receipts/evidence/completion-01 && sha256sum -c evidence.sha256`（工作区相对路径均可从 `product/` 回读；`/tmp` 仅用于中间态，不承载唯一证据）

## 10 本轮是否修改了代码

**未修改任何仓库代码。** 具体：`Smart-WorkFlow-aPaaS-server` 的 production / test / POM / 资源文件在本轮**零改动**（本轮前后 `git status --porcelain` 的 194 M + 16 ?? 清单一致，见 `workspace-identity.txt` 与 `changed-files.txt`）；前端仓库零改动；本轮新增文件仅位于工作区 `product/backend-api-optional-contract/receipts/evidence/completion-01/`（证据与脚本）。未写 `memory/`，未修改功能状态，未写 `PASSED/COMPLETED`，未执行 commit/push/merge/tag/Release/部署。

## 11 机器终态

ENGINE_TERMINAL {"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"XL","receipt":"product/backend-api-optional-contract/receipts/completion-backend-api-optional-contract-evidence-supplement-01.md","evidence":["行为输入身份与哈希：分支 develop、HEAD 76dc947、194 tracked + 16 untracked；behavior-input.sha256 312 条回读 312 OK / exit 0","账本机器复算：AM-001..AM-121 连续唯一；121 = 113 保留并合规 + 8 删除并闭合；113 项全为参数化 Optional；删除项三层零残留（am-ledger-recalculation.txt）","6 项验证命令持久日志与真实退出码（pipefail + PIPESTATUS）：test-compile 0、gate 6/0/0/0、boundary 8/0/0/0、system 13/0/0/0、notify 118/0/0/0、全量 1457/0/0/0，全部 BUILD SUCCESS（command-results.tsv）","架构与零残留：raw/Void/嵌套 Optional 0、orElse(null) 0 条涉及契约方法、无证明 get() 0、HTTP 层 Optional 0、删除项 0 可疑残留（forbidden-pattern-scan.txt / deleted-contract-residual-scan.txt）","守门非恒过：5 类反例（非 Optional / raw / Optional<Void> / 嵌套 / 公开 static 非 Optional）实际守门消息逐条留档，合规夹具 0 误报（optional-contract-gate.log 附加段）","非目标未漂移：迁移目录与 HTTP 路由注解零改动、前端仓库零改动、功能数/P 编号/发布状态零改动；本轮无 Git 写动作（scope-drift-check.txt）","证据包哈希：25 条回读 25 OK / 0 FAILED / exit 0（evidence-sha256-check.txt）"],"feature_status":"VERIFYING","work_items":[{"id":"evidence-workspace-identity","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"等待规划核对输入身份与哈希"},{"id":"evidence-am-ledger-recalculation","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"等待规划复算账本"},{"id":"evidence-verification-logs","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"等待规划复算命令退出码与计数"},{"id":"evidence-scans-and-gate-negatives","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"等待规划复核扫描与反例证据"},{"id":"evidence-scope-drift-and-hashes","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"等待规划复核非目标未漂移与证据包哈希"},{"id":"planner-independent-acceptance","status":"PENDING","authorized":false,"dependency_satisfied":false,"actionable":false,"next_action":"规划对照方向 §7 十五项标准与补充证据独立验收"}],"remaining_actionable_count":0,"independent_work_exhausted":true,"next_action":"规划（Planner）对照方向 §7 十五项标准独立验收完成回执与补充证据（含已披露的两处偏差与 1 处真实命中）","next_action_type":"WAIT_PLANNER","progress_fingerprint":"bapi-optional-xl-20260924-evidence-supplement-01","progress_basis":{"files_changed":["仅工作区证据目录 product/backend-api-optional-contract/receipts/evidence/completion-01/（27 个证据文件，含 8 个脚本）","本轮未修改后端仓 production/test/POM/资源，未修改前端仓库"],"tool_actions":["6 项 Maven 验证命令串行执行并落盘（pipefail + tee + PIPESTATUS 记录真实退出码）","3 份扫描脚本 + 账本复算脚本 + 命中分类脚本 + 守门反例驱动的执行与输出留存","sha256sum 行为输入清单与证据包清单生成并回读校验"],"new_evidence":["全量门禁 1457/0/0/0（13 个模块、244 个测试类两级口径一致）","账本复算 PASS（121 = 113 + 8；113 全为参数化 Optional；删除项三层零残留）","守门 5 类反例实际消息逐条留档 + 合规夹具 0 误报 + 生产 113 方法 0 违规","非目标未漂移与 Git 边界证据；证据包 25 条哈希回读一致"],"closed_work_items":["evidence-workspace-identity","evidence-am-ledger-recalculation","evidence-verification-logs","evidence-scans-and-gate-negatives","evidence-scope-drift-and-hashes"]},"stop_reason":"WAITING_FOR_PLANNER","tool_results":[{"tool":"Bash:mvn -B test","outcome":"SUCCEEDED","detail":"exit 0；1457 tests / 0 failures / 0 errors / 0 skipped；BUILD SUCCESS"},{"tool":"Bash:mvn -B -o test-compile","outcome":"SUCCEEDED","detail":"exit 0；全仓 main+test 编译通过"},{"tool":"Bash:sha256sum -c","outcome":"SUCCEEDED","detail":"evidence.sha256 25/25 OK、behavior-input.sha256 312/312 OK，均 exit 0"},{"tool":"Bash:scan scripts","outcome":"SUCCEEDED","detail":"账本复算 exit 0；禁止模式与残留扫描 0 违规；调用点扫描 1 处真实命中（已报告未修复）"}],"browser_status":"NOT_APPLICABLE"}
