# P62 首事务阶段补证回执03：LT01a / LT02a / LT04a / LT05a

日期：2026-09-30；角色：执行（Executor）；状态：**VERIFYING（回执03已提交/待规划复核）**。
输入：审查02 `planning-review-local-transaction-actions-02.md`、一级补充提示 `planning-execution-prompt-local-transaction-actions-01.md`、回执02 及证据包、`ready/direction-p62-local-transaction-actions.md`。
本轮范围：仅补四个原子残余（LT01a/LT02a/LT04a/LT05a）；不回改历史回执与旧证据；不重开治理与已锁定项。

## 1. 结论摘要

| 原子项 | 完成事实 | 证据（原始输出） | 边界 |
|---|---|---|---|
| LT01a | 在**已提交且工作区干净**的最终树 `6e73a11` 上重跑四段门禁：**1660/0/0/0**（mod 239类1466；A1 4类17；A2 4类19；B 30类158）；四段原始日志自描述（命令/git 身份/dirty=0/退出码 0），逐类与模块两条口径互证，bootstrap 38 类集合无缺口无越界；新增断言（lt02a/lt04a/lt05a）原始输出与消费链异常栈一并归档 | `evidence/local-transaction-actions-03/lt01a-gate-report.md`、`lt01a-raw-excerpts.txt`、`lt01a-per-class-counts.txt`、`lt01a-log-sha256.txt`、`lt02a-lt04a-lt05a-raw-output.txt` | 结论限定运行树 `6e73a11`；旧树 `eca1b52`/`5f9e066` 报告只作追溯不混用；Web 四门未重跑（已锁定） |
| LT02a | 草稿提交与 OpenAPI 两个可达入口经**真实 HTTP**（内嵌 Tomcat + JWT/HMAC 签名）到达写入前置闸门：受保护表单被 C1 明确拒绝（`1612`/`form.c1_write_protected`；命令终态 FAILED + 失败原因 + 草稿 `last_error`），动态行/流程发起命令/流程实例/幂等登记**零增量**；未保护表单同入口同身份**真实落库**（对照，排除"整链拒绝"） | `lt02a-upper-entry-c1.md`；`[P62-EV] lt02a.draft*`/`lt02a.openapi*`；消费链栈帧 `FormSubmitService.submitForm:368 ← C1PolicyService.assertBulkWriteAllowed:219` | 为隔离内嵌 PG + 测试直驱 `pollNormal()`（生产同一方法，仅改触发时机）；不含真实网络断连声明 |
| LT04a | **撤回**回执02"同一用例/同一表单"表述；改为**单对象**场景：同一表单/记录/预占在"合法 C1 变更（受理）→ 非法变更（拒且策略不变）→ 重发布 v2"后仍按**冻结版本 v1** 结算（95/0/7 与台账 `action_version=1` 一致）；普通写入变更前可用、变更后持续被拒；重复结算被拒且台账恰 1 条 | `lt04a-single-object-frozen.md`；`[P62-EV] lt04a.single-object …` | 场景覆盖策略变更+重发布组合；不代表任意组合；隔离对象销毁不宣称与 dev 同 ID |
| LT05a | **非空旧数据先于增量**的时间链：0.1.3 基线（V0.1.0 + R__i6，字节同源复制）→ 写入表单元数据+动态宽表 2 行 → 应用本次增量（V0.1.1 + R__p62）→ 回读身份/值/既有查询**逐项一致**（摘要与逐行双口径），迁移历史含版本/校验和/安装时间；增量前 P62 六表与菜单 9100—9103 均不存在，增量后齐备 | `lt05a-nonempty-upgrade.md`；`[P62-EV] lt05a.baseline/legacy-seeded/increment/readback/file-identity` | 内嵌真实 PG 临时集群；不触碰 dev/线上库、不 DROP DATABASE、不改发布基线；代表数据为最小非空集 |

## 2. 运行身份与门禁适用性

| 项 | 值 |
|---|---|
| 代码/测试身份 | Server `6e73a1147a0233676d3fdc33f5aec0a6b10ffa9f`（父 `9efe451`）；分支 `develop`；测试文件内容指纹与提交逐字节一致（磁盘 = `git show`，见门禁报告 §1） |
| 本轮变更 | **仅新增/扩展测试**（`P62UpperEntryC1PgTest` 新增；`P62TxnActionPgBehaviourTest` +1 用例；`P62NonEmptyUpgradePgTest` 新增）；**无产品代码改动**，故门禁按受影响范围全量四段执行并在最终树复跑 |
| 门禁结果 | mod **1466**/0/0/0；A1 **17**/0/0/0；A2 **19**/0/0/0；B **158**/0/0/0；合计 **1660**，四段 `EXIT=0`，`BUILD SUCCESS` |
| 覆盖闭合 | sw-bootstrap 测试类 38 = A1 4 + A2 4 + B 30，集合唯一无缺口无越界；`-am` 去重由 8 个上游模块 `No tests to run.` 解释 |
| 环境 | OpenJDK 21.0.11 / Maven 3.8.6 / `MAVEN_OPTS=-Xmx2g`；2026-09-30 17:53:55—18:07:35 +0800 |

## 3. 逐项结果（四要素：缺口→原始位置→实际输出→边界）

### LT01a 新树原始输出归档
- 缺口事实：持久摘录只覆盖 `eca1b52`；`5f9e066` 与新增断言在证据包 0 命中。
- 处理：不改写旧摘录，新增 `lt01a-raw-excerpts.txt`（626 行白名单行，含四段头/逐类/模块小结/退出码/`[P62-EV]`）与 `lt01a-per-class-counts.txt`（工具复算），并单独归档 `lt02a-lt04a-lt05a-raw-output.txt`（含消费者链路 WARN 异常头与 `com.sw.ck` 栈帧）。
- 计数复算：`1466+17+19+158=1660`；两条口径（逐类合计、模块小结合计）一致；全部 `Failures/Errors/Skipped = 0`。
- 身份绑定：日志内 `git_head=6e73a11… dirty_lines=0`；三个 P62 测试文件磁盘 SHA-256 与提交内容一致。
- 边界：不重跑 Web 四门与窄视口（审查02已锁定）；不宣称旧树数字被覆盖，仅作历史保留。

### LT02a 上层入口实际到达并受 C1 约束
- 入口 5（`POST /api/workflow/drafts/{id}/submit`，JWT）：受理成功（command `2105238059506790401`）→ 直驱消费者 → 到达 `FormSubmitService.submitForm` → C1 拒绝（`字段 qty_available 为 C1 受保护数据…`）；命令 FAILED + 草稿 `2105238059301269505` FAILED + `last_error`；行/FLOW_START/实例零增量。对照：未保护表单同链路落库（row `5e70e977-…`）+ 草稿 SUBMITTED + FLOW_START 受理 +1。
- 入口 6（`POST /api/openapi/v1/processes`，HMAC 签名，测试侧独立实现签名口径）：受保护表单 → R `code=1612`、`errorKey=form.c1_write_protected`、`eventRef` 非空、零副作用（行/幂等/FLOW_START/实例）；对照：未保护表单 → `recordId=13cb1b88-…`、行 +1、幂等 +1；同幂等键重放 → **业务身份与结果一致**（同 `recordId`、`idempotentReplay=true`、行数不增）。
- 边界：`pollNormal()` 由测试直驱（自动车道以 1h 间隔静默），为生产同一方法；未保护对照的 `FLOW_START` 子命令因隔离环境无流程定义部署而失败，已声明且不影响断言（行已先提交）。

### LT04a 同一旧预占跨策略变化与重发布
- 撤回：回执02 §2"同一真实 PG 用例/同一表单"表述撤回（旧文档保留）；新单对象集合：form `ea8cab38-…`、record `77aba5d5-…`、reservation `34800c9a-…`、reserveAction `3e242e43-…`(v1→v2)、confirmAction `bbd4e9f0-…`。
- 实际输出：合法 C1 变更受理（`applyAt=2026-09-30T18:07:29.109597`）→ 非法变更拒 `1603` 且 `policyJson/appliedAt` 不变 → 重发布 v2 → 旧凭据结算 `actionVersion=1`、`100→95`、`qty_reserved 5→0`、`qty_reserved2 保持 7`、台账 `action_version=1/balance_after=95/reserved_after=0` → 重复结算拒 `1609` 且台账仍 1 条 → 变更后普通写入持续 `1612`。
- 边界：与既有"冻结版本/停用/响应丢失"断言并存不重跑；隔离对象销毁，标识以本轮为准。

### LT05a 非空旧数据升级时间链
- 实际输出：`baseline migrated=2（V0.1.0 checksum 841228558 + R__i6 -1061893576）` → `legacy-seeded rows=2 digest=e228ed24…`（增量前：P62 六表 0、菜单 0）→ `increment migrated=2 applied=…>0.1.1>p62 menu`（`0.1.1|checksum 257617857|18:07:16|true|13ms`）→ `readback digest_equal=true p62_tables=6`、逐行一致、既有查询 `70.000000/7.500000`、菜单 4 + 授权 4 落库。
- 身份：`V0.1.1__form_local_transaction_actions.sql` SHA-256 `0534ce41…`。
- 边界：最小非空代表集；内嵌真实 PG 隔离；不改发布基线。

## 4. 与锁定项的关系（不重验）

审查02 已锁定的旧树 `eca1b52` 逐类报告与 Web 四门、LT03 适用范围、LT05 迁移口径与第 7 表归属、LT06 窄视口/信封/20 制品哈希、Owner 0.1.3 传播——本轮一律未重跑、未改写，仅作追溯引用。回执01/02 正文与证据保留原状（本轮唯一口径纠正为 LT04a 撤回声明，写在回执03 与新证据内，不回改旧文）。

## 5. 覆盖矩阵（提示01 四原子 → 断言与证据）

| 提示原子 | 完成条件（提示原文要点） | 本轮断言出处 | 证据文件 |
|---|---|---|---|
| LT01a | 新树逐类/命令/退出码/断言可读、计数可复算、无旧树混用 | 四段日志 + 逐类/模块两口径 + 覆盖闭合 | `lt01a-gate-report.md` 等 4 件 |
| LT02a | 两入口合法身份可达并受 C1 约束；非法写入无非预期副作用；拒绝按契约保留 | `draftSubmitEntryEnforcesC1WithNoSideEffects`、`draftSubmitEntryWritesPlainFormThroughSameChain`、`openApiEntryEnforcesC1WithNoSideEffects`、`openApiEntryWritesPlainFormAndReplaysByBusinessKey` | `lt02a-upper-entry-c1.md` |
| LT04a | 同一旧预占跨合法 C1 变更仍按冻结语义结算；非法变更拒绝且旧状态不变；普通写入持续受保护；不可重复结算 | `singleObjectReservationSurvivesRepublishAndC1PolicyChange` | `lt04a-single-object-frozen.md` |
| LT05a | 代表数据先于迁移存在；迁移后身份/值/既有查询正确；迁移历史/时间/校验和与对象 ID | `nonEmptyLegacyRowsSurviveP62Increment` | `lt05a-nonempty-upgrade.md` |

## 6. 边界、已知限制与未修项

- 本轮**未发现新产品缺陷**、未改产品代码；四处均为证据补齐（提示01 §4 允许范围）。
- 隔离对象（内嵌 PG 临时集群、dev 专用测试夹具）随运行销毁；证据保留其当轮标识，不宣称与 dev 库对象同 ID。
- 未纳入本轮：BPM 分级后续阶段、性能合同、设备未知结果；企业微信与通知延期项保持。
- 未复现/未宣称：真实网络断连、生产库迁移、全库规模升级演练。
- 0.1.3 = COMPLETED（Owner已验收，2026-09-30），无剩余动作；本轮仅同步当前入口与下一动作，不重开传播。

## 7. Git 身份

| 仓 | 提交 | 说明 |
|---|---|---|
| Server | `6e73a1147a0233676d3fdc33f5aec0a6b10ffa9f` | 测试用例（LT02a/LT04a/LT05a 证据） |
| Server | （本回执正文提交，见提交后附录） | 回执03 + 证据包 + 当前入口同步 |
| Workspace | （本回执正文提交，见提交后附录） | 回执03/证据 + knowledge/Server 清单/memory/todo 当前值 |
| Web | `19e1c47` | 未变（本轮无前端改动） |

## 8. 证据清单（`receipts/evidence/local-transaction-actions-03/`）

| 文件 | 内容 | 哈希回读 |
|---|---|---|
| `lt01a-gate-report.md` | 四段门禁报告（身份/命令/退出码/逐类/覆盖/复算命令） | `evidence-sha256.txt` 内逐件校验 |
| `lt01a-raw-excerpts.txt` | 四段白名单原文摘录（626 行，主机脱敏） | 同上 |
| `lt01a-per-class-counts.txt` | 逐类计数复算（mod 239 行 + A1/A2/B 明细） | 同上 |
| `lt01a-log-sha256.txt` | 四份原始日志 + 运行脚本 SHA-256 | 同上 |
| `lt02a-lt04a-lt05a-raw-output.txt` | 新增断言原始输出 + 消费链异常栈 | 同上 |
| `lt02a-upper-entry-c1.md` | LT02a 两入口证据（身份/结果/边界） | 同上 |
| `lt04a-single-object-frozen.md` | LT04a 单对象证据 + 撤回声明 | 同上 |
| `lt05a-nonempty-upgrade.md` | LT05a 时间链证据 | 同上 |
| `evidence-sha256.txt` | 上述 8 件的 SHA-256（不含自身），`shasum -c` 全 OK | — |

## 9. 结论与下一动作

四项原子残余（LT01a/LT02a/LT04a/LT05a）均已按提示01 的完成标准补齐真实运行结果与可复算证据；门禁在最终树 1660/0/0/0；阶段保持 **VERIFYING**，P62 保持 PLANNING，信息治理 PASSED，功能 45 / 清单 46/22/22 / ADV64 / 问题 57 / P 编号与正式基线不变。

**下一动作 = Planner 复核回执03 与证据包并独立验收 LT01a—LT05a。**
