# Phase 6A 补正回执 01 · 在线守门、Knowledge/Spring AI 兼容行为与机器终态

> 角色：执行（Executor） ｜ 日期：2026-09-25 ｜ 等级：XL
> 性质：**首次补证**（仅补 G1—G3；不重做已通过的依赖治理主体）
> 权威输入：`planning-execution-prompt-phase6a-evidence-supplement-01.md`（本轮唯一执行入口）、`planning-review-completion-phase6a-01-verifying.md`、主体回执 `completion-phase6a-dependency-version-enforcement-01.md`
> 状态：**`EXECUTION_SUBMITTED` / `feature_status=VERIFYING`** —— 未写 `PASSED`/`COMPLETED`，未启动 Phase 6B/6C，未执行 Git 写操作
> 旧回执与旧证据（`evidence/phase6a-01/` 24 项）**未改写、未覆盖、未删除**
> 新增证据目录：`evidence/phase6a-supplement-01/`（12 个文件；10 项被哈希）

已锁定、本轮不重验：Step A 2845 行版本中性；五项业务 POM version=0；32/32 effective POM；离线 validate；负向探针；15 项最终零分叉；scope/exclusion 完整性；POI/IoT/Storage/BPM 既有回归；旧证据 24/24 哈希。

---

## G1 · 在线 `validate` 成功证据对象不匹配

**缺口**：主体回执把 `evidence/phase6a-01/phase6a-validate-online.txt` 列为最终在线成功证据，但该文件实际以 `BUILD FAILURE` 结束，记录的是 Enforcer 首次发现 `checker-qual 3.43.0/3.48.3` 分叉的失败运行。当时只有离线成功日志，无在线成功原始结果。

**原始文件／位置**：
- 旧文件（保留原样，未覆盖、未删除、未改名）：`evidence/phase6a-01/phase6a-validate-online.txt` —— 核实为 `BUILD FAILURE`、`enforce-dependency-convergence` 出现 33 次、含 `checker-qual` 报错。其 sha256 本轮实测 `d82f440f…` 与旧哈希清单登记值一致。
- 新证据：`evidence/phase6a-supplement-01/phase6a-supp-g1-validate-online.txt`（完整在线原始日志）、`…-exit.txt`、`…-g1-evidence.txt`（摘录与解释）。

**实际结果**：最终快照执行 `MAVEN_OPTS="-Xmx2g" mvn -B validate`（在线，非 `-o`）→ **exit 0**、`BUILD SUCCESS`、`enforce-dependency-convergence` **32 次**、`Rule 0: …DependencyConvergence passed` **32 条（逐模块各一）**、`Dependency convergence error for` **0 条**、`BUILD FAILURE` **0 条**。

**边界**：命名更正——旧文件实为「首次在线**失败**日志」，是 Enforcer 守门非空转的证据，保留其原义；本轮新增文件才是「最终在线**成功**证据」。按提示要求未覆盖旧日志，故该历史命名偏差以本回执记录更正，不通过改写旧证据消除。

## G2 · Knowledge/Agent 的 Tika/PDFBox/Spring AI 行为覆盖不足

**缺口**：`sw-basic-knowledge` 无任何测试类，全量原始日志中无 Tika/PDFBox 行为锚点；仅依赖版本分析与 Agent 既有绿色不足以构成 Tika/PDFBox/Spring AI 调用域回归。

**原始文件／位置**（新增测试资产，生产代码与生产依赖零改动）：
- `sw-basic-knowledge/src/test/java/com/sw/ck/knowledge/KnowledgeTikaPdfCompatTest.java`（新增，80 行，1 个 `@Test`，sha256 `6f7511dd…`）
- `sw-basic-agent/src/test/java/com/sw/ck/agent/orchestration/AgentSpringAiCallDomainCompatTest.java`（新增，159 行，3 个 `@Test`，sha256 `2b872489…`）
- `sw-basic-knowledge/pom.xml`（唯一 POM 改动：新增 1 条 `spring-boot-starter-test`，`scope=test`、BOM 管理）
- 定向原始日志：`phase6a-supplement-01/phase6a-supp-g2-targeted-log.txt`；资产清单与精确改动判定：`…-g2-test-assets.txt`

**实际结果**（行为锚点，均来自真实调用而非结构扫描）：

| 域 | 行为链 | 正向断言 | 锚点输出 |
|---|---|---|---|
| Knowledge Tika/PDFBox | PDFBox 生成内存 PDF → Tika `AutoDetectParser` 实际解析 | 抽取文本含哨兵 `PHASE6A-TIKA-PDF-SENTINEL-42`；探测器识别 `application/pdf` | `[P6A-G2] knowledge tika-pdf bytes=768 mime=application/pdf sentinelPresent=true` |
| Agent Spring AI（装配） | 经生产 `AgentGraphFactory` 编排图，用真实 `SystemMessage`/`UserMessage`/`Prompt` 装配 | 指令序列 = 2（系统消息 + 本轮 UserMessage），顺序与文本一致 | `[P6A-G2] agent springai-prompt instructions=2 systemText=… userText=…` |
| Agent Spring AI（调用） | 实际调用 stub `ChatModel.call(Prompt)`，走生产提取链 `ChatResponse→Generation→AssistantMessage.getText()` | `output` 等于模型回复 | `[P6A-G2] agent springai-response output=PHASE6A-SPRINGAI-REPLY-OK` |
| Agent Spring AI（usage 语义） | 响应 metadata 携带 Spring AI 自身 `EmptyUsage` | 未知≠0：`inputTokens`/`outputTokens` 均为 `null` | `[P6A-G2] agent springai-usage input=null output=null` |

- 定向测试：`KnowledgeTikaPdfCompatTest` **1/0/0/0**、`AgentSpringAiCallDomainCompatTest` **3/0/0/0**，`BUILD SUCCESS`。
- 全量门禁（快照变化导致的必要复验）：`MAVEN_OPTS="-Xmx2g" mvn -B -o test` → **exit 0 / BUILD SUCCESS / 1563 tests / 0 failures / 0 errors / 0 skipped**（14 个含测试模块）。较主体快照 1559 **+4**，与新增断言逐项对应：Knowledge **+1**（新模块进入测试集，`sw-basic-knowledge` 由 0 → 1）、Agent **346 → 349（+3）**。满足提示要求的不低于 1560。
- 反向排除：新增内容不含纯类存在扫描、dependency tree 断言、编译成功断言或 mock 名称断言；未访问外网（无真实模型服务、无真实云调用）。

**边界**：本项证明的是**库/类路径层面的离线兼容行为**，不构成真实第三方外呼（MinIO/Qiniu/COS、腾讯云、真实模型服务）送达验收——该边界与主体回执 §6.3 一致，未因本轮补证改变。运行 `mvn` 前的按文件 mtime 精确判定显示：本轮 `src/main` 被写文件 **0 个**、新增非 test-scope 依赖 **0 条**。

## G3 · 缺少合法机器终态

**缺口**：主体回执最后一个非空物理行是秘密扫描说明，不是 `ENGINE_TERMINAL {json}`，因此只有人类可读状态、无治理契约机器终态。

**原始文件／位置**：本补正回执 `completion-phase6a-dependency-version-enforcement-evidence-supplement-01.md`；旧回执 `completion-phase6a-dependency-version-enforcement-01.md` **未改写**。

**实际结果**：本文件最后一个非空物理行为 `ENGINE_TERMINAL {json}`，字段与本轮实际文件/结果一致：`role=executor`、`state=EXECUTION_SUBMITTED`、`task_level=XL`、`receipt` 指向本文件、`evidence` 指向本轮真实附件、`feature_status=VERIFYING`、G1/G2/G3 的 `work_items` 均 `COMPLETED` 且不可操作、`remaining_actionable_count=0`、`independent_work_exhausted=true`、`next_action_type=WAIT_PLANNER`、`stop_reason=WAITING_FOR_PLANNER`、`browser_status=NOT_APPLICABLE`。已用 `.codex/governance/validate-terminal.sh` 现场校验通过（exit 0），并以末行解析回读确认。

**边界**：无。格式与证据封装均在授权范围内；本项不改变功能级状态，`PASSED`/`COMPLETED` 仍由规划裁决。

---

## 冻结证据与回读

- 目录：`evidence/phase6a-supplement-01/`（12 个文件；10 项被哈希，另 2 项为哈希清单与回读报告）。
- `phase6a-supp-hashes.sha256` 与 `phase6a-supp-readback.txt`：**10/10 校验通过、0 FAILED**。
- 秘密扫描：`phase6a-supp-secret-scan.txt` —— 扫描输入 11531 bytes（knowledge POM diff + 2 个新测试文件全文），敏感模式命中 **0**，结论 **CLEAN**。
- 大体积运行日志按提示保留在临时工作目录，其 sha256／字节数／行数已进入正式证据（全量 `ad54172a…`，7739693 bytes / 52204 行；定向 `7347be70…`，11766 bytes）。

## 环境与边界

- Maven 3.8.6 / JDK 21；全部命令带 `MAVEN_OPTS="-Xmx2g"`；后端重型命令串行，未与前端编译并发（前端为空闲 dev server）。
- 工作区身份：`develop-sw@a46e4f3`；后端仓 `develop@76dc947`；生产制品 `bootstrap.jar` mtime 仍为 `2026-09-24 16:51`（**未重新打包**）。
- 未读取或输出任何数据库连接值、凭据或密钥；未执行 commit/push/merge/tag/Release/部署。

ENGINE_TERMINAL {"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"XL","receipt":"product/backend-architecture-optimization/receipts/completion-phase6a-dependency-version-enforcement-evidence-supplement-01.md","feature_status":"VERIFYING","evidence":["product/backend-architecture-optimization/receipts/evidence/phase6a-supplement-01/（12 文件，10/10 sha256 校验通过）","phase6a-supp-g1-validate-online.txt：在线 mvn -B validate exit 0 / BUILD SUCCESS / 32 次 enforce-dependency-convergence / 32 条 Rule 0 passed / 0 条 convergence error","phase6a-supp-g2-targeted-log.txt：KnowledgeTikaPdfCompatTest 1/0/0/0（PDFBox 内存 PDF 768 bytes → Tika mime=application/pdf、哨兵文本命中）；AgentSpringAiCallDomainCompatTest 3/0/0/0（Prompt 指令=2、回复提取、EmptyUsage→null）","phase6a-supp-module-counts.tsv：全量 mvn -B -o test 1563 tests / 0 failures / 0 errors / 0 skipped（14 模块，较 1559 +4）","phase6a-supp-secret-scan.txt：命中 0 / CLEAN；phase6a-supp-hashes.sha256 + phase6a-supp-readback.txt 10/10 OK","phase6a-supp-g2-test-assets.txt：本轮 src/main 被写文件 0、新增非 test-scope 依赖 0；旧证据与旧回执未改写"],"work_items":[{"id":"G1","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已补最终快照在线 validate 成功原始日志（exit 0 / 32 次 / BUILD SUCCESS）；旧失败日志按提示保留原样，命名偏差已在本回执更正"},{"id":"G2","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已新增 Knowledge PDFBox→Tika 内存解析与 Agent Spring AI 装配/调用/usage 行为测试；定向 4/0/0/0 与全量 1563/0/0/0 均绿"},{"id":"G3","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"本补正回执末行已写可解析 ENGINE_TERMINAL，并通过 validate-terminal.sh 现场校验；旧回执未改写"}],"remaining_actionable_count":0,"independent_work_exhausted":true,"next_action":"等待规划（Planner）对 Phase 6A 补正回执 01 的独立验收：确认 G1 在线成功证据对象已补正、G2 Tika/PDFBox/Spring AI 行为锚点成立、G3 机器终态可解析，并据此对 Phase 6A 作功能级裁决","next_action_type":"WAIT_PLANNER","progress_fingerprint":"phase6a-supplement01-execution-submitted-20260925","progress_basis":{"files_changed":["sw-basic/sw-basic-knowledge/src/test/java/com/sw/ck/knowledge/KnowledgeTikaPdfCompatTest.java","sw-basic/sw-basic-agent/src/test/java/com/sw/ck/agent/orchestration/AgentSpringAiCallDomainCompatTest.java","sw-basic/sw-basic-knowledge/pom.xml","product/backend-architecture-optimization/receipts/completion-phase6a-dependency-version-enforcement-evidence-supplement-01.md"],"tool_actions":["mvn -o -B -pl sw-basic/sw-basic-knowledge,sw-basic/sw-basic-agent -am test -Dtest=KnowledgeTikaPdfCompatTest,AgentSpringAiCallDomainCompatTest（定向 4/0/0/0）","mvn -B -o test（全量 1563/0/0/0）","mvn -B validate（最终在线 exit 0 / 32 次）","文件 mtime 精确判定生产代码改动面（src/main 0 个）","shasum 哈希清单与 -c 现场回读"],"new_evidence":["G1 最终在线 validate 成功原始日志与 exit","G2 四个行为锚点（Tika PDF 解析、Prompt 装配、回复提取、EmptyUsage 未知语义）","全量 1563/0/0/0 逐模块计数与完整日志 sha256 ad54172a…","补证证据 10/10 sha256 校验通过、秘密扫描 CLEAN"],"closed_work_items":["G1","G2","G3"]},"stop_reason":"WAITING_FOR_PLANNER","tool_results":[{"tool":"Bash/mvn","outcome":"SUCCEEDED","detail":"最终快照在线 mvn -B validate：exit 0 / BUILD SUCCESS / 32 次 enforce-dependency-convergence / 32 条 DependencyConvergence passed / 0 条 convergence error"},{"tool":"Bash/mvn","outcome":"SUCCEEDED","detail":"定向测试（-pl knowledge,agent -am）：KnowledgeTikaPdfCompatTest 1/0/0/0、AgentSpringAiCallDomainCompatTest 3/0/0/0，BUILD SUCCESS"},{"tool":"Bash/mvn","outcome":"SUCCEEDED","detail":"全量 mvn -B -o test：exit 0 / BUILD SUCCESS / 1563 tests / 0 failures / 0 errors / 0 skipped（14 模块）"},{"tool":"Bash/file","outcome":"SUCCEEDED","detail":"补证证据 12 文件，10/10 sha256 校验通过；秘密扫描命中 0（CLEAN）"},{"tool":"Bash/git","outcome":"SUCCEEDED","detail":"按文件 mtime 判定本轮 src/main 改动 0 个、新增非 test-scope 依赖 0 条；旧回执与旧证据未改写；bootstrap.jar mtime 未变（未重新打包）"}],"browser_status":"NOT_APPLICABLE"}
