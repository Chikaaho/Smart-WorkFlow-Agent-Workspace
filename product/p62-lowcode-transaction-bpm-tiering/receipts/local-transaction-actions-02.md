# P62 首事务阶段补证回执 02：LT01—LT06 与 Owner 裁决传播

日期：2026-09-30；角色：执行（Executor）；等级：XL（P62 首子阶段补证）。
入口：`../ready/direction-p62-local-transaction-actions.md`（唯一执行入口）；剩余账本来源：`planning-review-local-transaction-actions-01.md`（审查 01，LT01—LT06）；Owner 裁决依据：`../../v0.1.3-release/receipts/owner-accepted-20260930.md`。
自验结论：**LT01—LT06 逐项补齐**（§3 逐项给出结果/证据/边界），并在补证过程中发现并修复 3 项真实缺陷（§5）；提交 `EXECUTION_SUBMITTED`，待 Planner 复核回执 02。P62 整体维持 PLANNING；功能 45、清单 46/22/22、ADV64、P 编号与正式基线零变化；0.1.3 按 Owner 裁决已完成机械传播（§4），无规划验收动作。

## 1. 补证步骤（本会话内部 Step）

| Step | 内容 | 结果 |
|---|---|---|
| S1 现场与日志保全 | 三仓 Git、历史运行日志（`/tmp/p62-verify/*-final.log`）与 0.1.3 裁决依据盘点 | 日志全部留存，SHA-256 记录 |
| S2 Owner 裁决传播 | knowledge 两入口 + Server 功能清单 + memory/todo 机械写入并回读 | 零残留（§4） |
| S3 LT01 门禁报告 | 四段门禁在冻结提交上自描述重跑（命令/退出码/逐类结果写入日志）+ Web 四门；`-am` 去重口径与反例 | 报告与摘录入库；1647 复现一致 |
| S4 LT02 写入口 | 穷尽枚举 `DynamicTableSql` 写路径与上层入口；导入入口真实调用；业务键/精度边界实跑 | 清单文档 + 真实 PG 证据 |
| S5 LT03 事务范围 | 事务/传播范围定界；流程写入不适用依据 | 范围文档 |
| S6 LT04/T05 行为 | 冻结版本结算、停用边界、响应丢失回查、非法声明拒绝（含修复） | 6 个真实 PG 用例 + 1 个 H2 回归 |
| S7 LT05 快照纠正 | 迁移/验收混合口径纠正、第 7 张表对象级核对、兼容测试原始结果 | 纠正文档 + 复核快照 |
| S8 LT06 界面 | 窄视口（1280/1366/1024）配置-调用-结果-回查可见会话验收 + 脱敏 R 信封 + 哈希 | 6 PNG + 3 信封 + 身份回读 |

## 2. 实际读取与修改文件（本会话）

**Server（`Smart-WorkFlow-aPaaS-server`，提交 `5f9e066`）**

| 文件 | 修改摘要 |
|---|---|
| `.../form/txn/service/TxnActionExecutor.java` | 幂等判定前移（已受理请求回查不受停用影响）；结算类调用（CONFIRM/RELEASE + 凭据）跳过当前版本门禁与配置读取；拒绝记录版本回退取当前版本 |
| `.../form/txn/service/TxnActionTxOperations.java` | 结算改用**预占受理冻结版本**解析字段绑定与数量语义；凭据须属本动作表单；抽出 `requireFrozenVersion`/`readConfig` |
| `.../form/txn/service/TxnActionService.java` | 新增 `currentVersionOrNull`；保存入口新增 `assertSupportedDeclarations`（未声明键明确拒绝，错误含键名）；发布校验新增未声明键结构化错误 `config.<key>` |
| `.../form/txn/service/C1PolicyService.java` | C1 策略保存入口拒绝未声明键 |
| `.../form/txn/model/TxnActionConfig.java` | 封闭声明模型：`@JsonAnySetter` 收集未声明键（`@JsonIgnore`，不序列化） |
| `.../form/txn/model/C1PolicyModel.java` | 同上 |
| `sw-biz-form-biz/src/test/.../txn/TxnActionFlowH2Test.java` | 新增 H2 回归：冻结语义/停用边界/非法声明（7/0/0/0） |
| `sw-bootstrap/src/test/.../p62/P62TxnActionPgBehaviourTest.java` | 新增 6 例真实 PG 证据（导入入口 C1、业务键隔离、精度与负边界、冻结版本跨重发布、响应丢失回查、非法声明）；t03 回滚断言扩展到凭据/台账 |

**Workspace（`. `，提交见 §7）**：`product/…/receipts/local-transaction-actions-02.md`（本回执）、`receipts/evidence/local-transaction-actions-02/`（20 个制品 + `evidence-sha256.txt`）、knowledge 两入口、memory 四文件、todo 两入口、Server 功能清单（同批机械传播）。

## 3. LT01—LT06 逐项结果、证据与边界

### LT01 门禁可回读报告
- **结果**：四段命令、环境、退出码、逐类结果、覆盖与去重、`-am` 处理、关键断言全部落盘，并绑定提交身份（Server `eca1b52`）。
- **证据**：`evidence/…-02/lt01-server-gate-report.md`（报告）+ `lt01-raw-excerpts.txt`（白名单行机械摘录，主机脱敏）+ `lt01-log-sha256.txt`（新旧日志 SHA-256）；原始日志 `/tmp/p62-verify/lt01-{mod,A1,A2,B}.log`、`lt01-web-gates.log`、反例 `lt01-A1-wrongflag.log`。
- **要点**：①四段 = `mvn -B test -pl '!sw-bootstrap'`（31 模块 1465）+ bootstrap 三段显式类清单（A1 4 类 17、A2 4 类 19、B 28 类 146），合计 **1647/0/0/0**，退出码均 0；②bootstrap 36 个测试类 **4+4+28 全覆盖无交叉**（类名逐字比对差集为空）；③`-am` 只影响构建：8 个上游 API 模块输出 `No tests to run.`，计数不重复；④去重闸门属性名为 `-Dsurefire.failIfNoSpecifiedTests=false`，反例日志（错误属性名在 `sw-common` 即失败、EXIT=1）与 Maven 提示原文一并留存；⑤Web 四门 commands/exit codes 同口径留档（typecheck/lint/test/build exit 0；vitest 1309+3）。
- **补证树复跑**：新树（`5f9e066`）全量 **1654/0/0/0**（1466+17+19+152，四段 exit 0），与 1647 差值 = 新增 6 个 PG 用例 + 1 个 H2 用例，算术闭合（§5 附逐模块表）。
- **边界**：1647/1654 均为执行侧门禁值，不构成 Planner 锁定基线；原日志在 `/tmp`（易失），已用 SHA-256 固定并摘录入库。

### LT02 C1 可达写入口一致
- **结果**：动态宽表写入路径**穷尽枚举**为 9 条入口（提交/更新/删除/批量导入/草稿提交/OpenAPI 发起/受控动作/过期释放/结构发布），其中 6 条表单写入口一致经 C1 闸门，受控动作路径为设计通道，结构发布不适用行级策略；脚本/Agent/批处理/流程节点/外部数据源**无写入能力**，逐项给出运行能力依据。
- **证据**：`evidence/…-02/lt02-c1-write-entry-inventory.md`（含文件:行、路由+权限白名单、委托链）；**导入入口真实调用**（受保护表单导入整批拒绝、零成功、行级错误含 C1 原因、表 0 行；同一导入在未保护表单 2 行落库）；业务键与精度边界真实结果（见下）。
- **业务键隔离/精度边界实跑**：键值匹配成功且凭据冻结键值快照；不匹配/未声明键 `REJECTED(ACTION_FIELD_BINDING_INVALID)` 无副作用；不同键值记录互不影响（A:5/B:7）；声明 3 位精度 `1.234` 可受理、`1.2345` 拒绝、`2.000` 可受理且合计 3.234（**无静默舍入**）；声明 6 位 `0.000001` 可受理、`0.0000001` 拒绝；`0`/负数/超范围拒绝；调整到「可用=0」边界可受理、再减 0.001 拒绝。
- **边界**：C1 钩子为**可选注入**（便于模块单测构造）；真实上下文 bean 必存在且 T02 拒绝已实证，若未来出现不含该 bean 的新上下文则钩子会静默不生效——记为观察项（§6）。

### LT03 事务/传播范围
- **结果**：本阶段事务范围=表单写服务与事务动作内核共享**同一提交边界**（内核默认 REQUIRED、执行器无事务、拒绝记录 REQUIRES_NEW、过期释放逐条独立事务）；回滚时记录/调用/凭据/台账**全灭**；**流程写入组合不适用**（调用图证据 + BPM 侧只读证据 + 未新增跨事务传播），不再以迁移测试论证恢复。
- **证据**：`evidence/…-02/lt03-transaction-scope.md`；`[P62-EV] t03.same-tx commit=both-present rollback=both-absent (record/invocation/reservation/ledger all-absent)`；Phase 4 接缝类 6 类 30 例在冻结树复跑通过（平台既有同提交边界性质未破坏）。
- **边界**：不主张 Phase 4 之外的恢复能力；不把迁移/兼容测试当恢复证据。

### LT04 断连回查 / 新发布旧语义 / 停用边界 / 非法声明
- **结果（含 3 项修复，见 §5）**：①**响应丢失**：同键重试为重放（同一 `invocationId`/`reservationId`，`replay=true`），预占/台账/调用记录均不重复；同调用身份可按动作回查记录/凭据/台账。②**新发布不改旧语义**：v1 预占经 v2 重发布（预占字段改指 `qty_reserved2`）后确认，仍按 v1 冻结版本扣减 `qty_reserved`、`qty_reserved2` 不变，台账 `action_version=1`；跨表单凭据拒绝。③**停用边界**：停用只拒新调用（`ACTION_DISABLED`），既有凭据仍可结算，已受理请求重放不受影响，启用可恢复。④**非法声明**：模型不支持的键（远程副作用/人工等待/事务传播/C1 未知键）被收集而非静默忽略，保存入口明确拒绝（错误含键名），发布入口给出结构化错误 `config.remoteSideEffect`；合法配置仍可发布运行。
- **证据**：`evidence/…-02/lt04-t05-frozen-and-declaration.md`；`[P62-EV] lt04.lost-response …`、`lt04.frozen-v2-published …`、`lt04.unsupported-declaration …`；H2 回归同名用例；界面侧同键重放（`27-r-envelope-invoke-success-and-replay.json` 两次信封唯一差异 `replay=false→true`）。
- **边界**：修复限本阶段已批准范围；未新增 Outbox/恢复重构；结算记录的版本语义固定为「该笔结算实际适用的冻结版本」，见文档 §6。

### LT05 快照口径纠正与兼容证据
- **结果**：纠正「迁移与验收后」混合口径——迁移侧新增 6 张表 + `sys_menu +4` + `sys_role_menu +4`；验收侧自建 1 张表单（def/config/snapshot 各 1、动态宽表 1、记录 1）；表总数 153 = 146 + 6 + 1 闭合。**第 7 张表核对为验收表单动态表 `sw_form_ouyylgp64c`**（全库唯一动态宽表；`sw_form_def` 行物理表名直接绑定，时间 15:18 晚于迁移 15:11），非计数推断。
- **证据**：`evidence/…-02/lt05-snapshot-correction.md` + `db-post-acceptance-facts.txt`（本次逐对象 SQL 复核快照）+ 原快照保留（`…-01/db-pre-migration.txt`、`db-post-migration.txt`）；兼容测试原始逐类结果（I6G7b 非空两租户通知数据 2/0/0/0、I6G7 升级演练 1/0/0/0、Flyway 双链 17/12、Phase4 六类、p4overlap 四类）。
- **边界**：专用 dev 库表单/流程/命令为 0 行，本身不证明非空旧业务对象兼容 → 以兼容测试为准（已在文档中明示）；本轮**未**对任何数据库执行 DROP/CREATE。

### LT06 窄视口界面与制品指纹
- **结果**：可见会话（`headless=false`）在 1280×720、1366×768、1024×768 完成配置/调用/结果/回查操作，记录完整页面 URL、视口、对象身份；业务拒绝与回查提供**脱敏 R 信封**；全部制品机器哈希并回读校验；原 1920 主链不重做，会话保持可见可交互（视口已恢复 1920×1080）。
- **证据**：`evidence/…-02/lt06-browser-acceptance-index.md` + `20—25` 六张 PNG + `26/27/28` 三份 R 信封 + `db-lt06-readback.txt`（界面↔数据库同对象）+ `evidence-sha256.txt`（`shasum -a 256 -c` 全 OK）。
- **边界**：验收运行在补证修复后的 Server `5f9e066` 制品上；未以 headless 或组件测试替代正式流程。

## 4. Owner 0.1.3 裁决机械传播（已完成）

- 目标值：**v0.1.3-release = COMPLETED（Owner已验收，2026-09-30）**；无规划验收动作。
- 逐入口字段/实际值/核验时点见 `evidence/…-02/owner-013-propagation-record.md`：knowledge 两入口（状态/事实口径/下一动作）、Server 功能清单（首阶段状态/发布版本/下一动作）、memory 6 文件与 todo 2 入口回读确认一致。
- 残留检索：`grep -rn "EXECUTION_SUBMITTED 待规划验收|发布/部署回执仍待规划验收|机械同步待Executor执行|待Executor机械传播"` 在当前入口**零命中**；`Owner已验收，2026-09-30` 在 knowledge 两入口、memory 六文件、todo 两入口、Server 功能清单均为 1。
- 不适用项：根 README（无版本/验收现状段落，零命中）、`knowledge/feature-reconciliation-index.md`（零命中）、`version.json`/`release/0.1.3/`（零命中）；历史回执与带日期历史记录保留不改写。
- 边界：不构成 0.1.3 验收结论（Owner 已裁决），不改变计数/基线/发布身份。

## 5. 本次发现并修复的缺陷（补证实测驱动）

| # | 缺陷 | 影响 | 修复 | 证据 |
|---|---|---|---|---|
| D3 | CONFIRM/RELEASE 使用**当前发布版本**配置解析字段绑定 | 重新发布（改指字段）会改变既有预占的结算语义，A09「新版本不改旧预占语义」不成立 | 结算改用预占受理冻结版本（`requireFrozenVersion`） | `lt04.frozen-v2-published …`；H2 回归 |
| D4 | 停用动作后**既有凭据无法结算**；已受理请求的重放也会被停用拦截 | 「停用只拒绝新调用、旧凭据可结算」不成立；已受理请求回查被误拒 | 幂等判定前移 + 结算类调用绕过当前版本门禁 | `lt04.frozen-v2-published … disable=new-call-rejected/old-credential-settled/replay-ok` |
| D5 | 配置模型未声明键被**静默忽略**（Spring Boot ObjectMapper 默认不失败） | 设计者以为声明了平台不支持的远程副作用/人工等待/事务传播，实际被丢弃且发布可通过 | 声明模型封闭：`@JsonAnySetter` 收集 + 保存入口明确拒绝 + 发布入口结构化错误 | `lt04.unsupported-declaration …`；H2 回归 |

（D1 C1 整量写入绕过、D2 菜单种子 id 冲突已在回执 01 记录并修复。）

**补证树全量门禁（Server `5f9e066`）**：`MAVEN_OPTS="-Xmx2g" mvn -B test` 四段实跑 **1654 / 0 / 0 / 0**（`mod` 1466 = 13 模块含 Form::Biz 172；`A1` 17；`A2` 19；`B` 152），四段 EXIT=0、BUILD SUCCESS；Web 四门（Web 提交未变）typecheck/lint/test/build exit 0（1309 passed + 3 skipped；lint 0 error/90 既有 warning）。

## 6. 偏差、问题与风险

1. **门禁属性名反例**（过程记录）：首段重跑尝试用 `-DfailIfNoSpecifiedTests=false` 在 `sw-common` 即失败（EXIT=1），正确属性名为 `-Dsurefire.failIfNoSpecifiedTests=false`；反例日志留存，报告中如实标注。
2. **`R__p62` 二次执行**：菜单种子修正后校验和变化触发重跑（flyway 第 5 行）；重跑前 4 条误授行已受控清理，残留复核 0——不是异常重复。
3. **C1 可选注入观察项**：见 §3 LT02 边界；不做注入方式重构（会破坏既有模块测试装配），记为观察项由 Planner 决定后续阶段是否收口。
4. **结算记录版本语义**：结算台账/调用记录的 `action_version` = 该笔结算实际适用的冻结版本（预占受理版本），被调用动作 id 仍归属结算动作，经 `reservation_id` 关联；已在代码注释与 `lt04-t05-…md` §6 固定。
5. 本阶段范围内未涉及的项（设备未知结果对账、IOT_COMMAND 节点化、完整分级/性能合同、统一恢复重构）保持后续阶段范围，未在本次触碰。

## 7. Git 差异摘要与远端回读

| 仓库 | 本会话提交 | 远端回读 | 工作树 |
|---|---|---|---|
| Workspace `develop-sw` | 传播批 `277d955`（Owner 裁决机械传播）；本回执批见提交后附录 | `git ls-remote` 与本地 HEAD 一致 | 见附录 |
| Server `develop` | `e6b44ae`（功能清单同步）、`5f9e066`（补证修复批次：冻结语义/停用边界/非法声明 + 7 用例） | `e6b44ae`、`5f9e066` 均与 `origin/develop` 一致 | 提交后 clean |
| Web `develop` | 本轮无改动（`19e1c47`） | 与 `origin/develop` 一致 | clean |

Server 批次门禁：`5f9e066` 提交前完成 1654/0/0/0 四段门禁；提交信息内载明门禁值。

## 8. 与阶段验收标准（T01—T07）对照（含本轮补强）

| ID | 结论 | 本轮补强 |
|---|---|---|
| T01 | 通过（自验） | 门禁可回读报告 + 去重口径 + 反例（LT01） |
| T02 | 通过（自验） | 写入口穷尽清单 + 导入入口真实拒绝 + 业务键/精度边界（LT02） |
| T03 | 通过（自验） | 事务范围定界 + 回滚四对象全灭断言 + 流程写入不适用依据（LT03） |
| T04 | 通过（自验） | 响应丢失回查无重复效果 + 冻结版本结算 + 停用边界（LT04 修复 D3/D4） |
| T05 | 通过（自验） | 非法声明拒绝（修复 D5）+ 结构化发布错误定位 |
| T06 | 通过（自验） | 口径纠正 + 第 7 张表对象核对 + 兼容测试原始结果（LT05） |
| T07 | 通过（自验） | 窄视口界面 + 脱敏 R 信封 + 制品哈希与代码身份绑定（LT06） |

## 9. 证据清单

`receipts/evidence/local-transaction-actions-02/`：`lt01-server-gate-report.md`、`lt01-raw-excerpts.txt`、`lt01-log-sha256.txt`、`lt02-c1-write-entry-inventory.md`、`lt03-transaction-scope.md`、`lt04-t05-frozen-and-declaration.md`、`lt05-snapshot-correction.md`、`db-post-acceptance-facts.txt`、`lt06-browser-acceptance-index.md`、`20—25` 六张 PNG、`26/27/28` 三份 R 信封、`db-lt06-readback.txt`、`owner-013-propagation-record.md`、`evidence-sha256.txt`（全部 OK 回读）。
原回执 01 与证据包 `…-01/` 保留不改写；本回执为追加。

## 10. 自验结论

LT01—LT06 逐项补齐，修复 D3/D4/D5 后行为证据与门禁（1654/0/0/0；Web 四门 exit 0）在本提交树上成立；Owner 0.1.3 裁决已机械传播并零残留。阶段维持 `VERIFYING`，提交 `EXECUTION_SUBMITTED`，**下一动作 = Planner 复核本回执与证据包，独立验收 LT01—LT06**。
