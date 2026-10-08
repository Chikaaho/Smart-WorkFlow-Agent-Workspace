# 功能追踪：P63 MES前置能力：动态并行审批与一次性预约IoT下发

> 工作区统一知识库 — 正式业务功能登记（第 47 个正式功能，L，P0）。
> 可信度标记：CONFIRMED / REPORTED / ASSUMED / SUPERSEDED

---

## 1. 功能信息

| 字段 | 值 |
|------|-----|
| 功能编号 | P63（需求池编号；不对应 Mxx-Fyy-zz 既有明细，不改变 90 明细与 I 集合；本次新增里程碑 ID 集合=空、核销原 90 行明细 ID 集合=空） |
| 功能名称 | MES前置能力：动态并行审批与一次性预约IoT下发 |
| 功能目标 | 用户从真实表单配置人员/部门及预约时间，完成动态并行审批；流程成功结束后产生一次性 IoT 预约，到点下发并回查结果；普通手工并行与旧流程继续正常使用 |
| 创建日期 | 2026-10-06（Owner 需求 → 探索复核 → 正式方向下发）；2026-10-08 功能级验收 `PASSED`（规划审查10） |
| 当前状态 | **COMPLETED（待规划终态复核）**（功能级 `PASSED` 依据 `planning-review-completion-10-passed.md`：20/20 核销、A01—A10 通过（10/10）、业务缺口0；终态同步回执 01 经 Planner **复核01 未通过**（TS01—TS03 三项精确差异），已按唯一执行入口 `planning-execution-prompt-p63-terminal-sync-01.md` 修正并提交回执 02，整体完成待 Planner 复核02 确认） |
| 等级 / 优先级 | L / P0 |
| 涉及模块 | Server `sw-biz-form`（多选存储/datetime/子表列/实例读 Facade）、`sw-bpm`（FORM_FIELD 参与人策略、动态并行 v2 轮次、手工并行网关、终态预约意图）、`sw-basic-iot`（预约意图/到点调度/取消/查询/受控回执）；Web 表单设计器-填报-渲染、流程设计器参与人与动态并行面板、任务/流程详情预约卡、iot-reservation 适配接缝 |
| 计数归属 | 正式功能数 47（46+P63 整体 1）；清单 90 行 ✅46/🟦22/⬜22 零行状态升降；P63 本次批准 R01—R06 交付已核销 |

---

## 2. 方向与回执

| 项 | 路径 |
|---|---|
| 主方向（已归档 `passed/`） | `product/p63-mes-workflow-foundations/passed/direction-p63-mes-workflow-foundations.md`（产品合同与 A01—A10 验收合同） |
| 终态同步方向（`ready/`，Planner 终态复核通过后归档 `passed/`） | `product/p63-mes-workflow-foundations/ready/direction-p63-mes-workflow-foundations-terminal-sync.md` |
| 功能级验收（PASSED） | `product/p63-mes-workflow-foundations/receipts/planning-review-completion-10-passed.md`（2026-10-08：20/20 核销、A01—A10 全部通过、业务缺口0） |
| 终态同步回执 | `product/p63-mes-workflow-foundations/receipts/terminal-sync-p63-mes-workflow-foundations-02.md`（附件 `receipts/evidence/terminal-sync-02/`；回执 01 经复核01 未通过，仅作历史输入） |
| 终态复核与补充提示 | `receipts/planning-review-terminal-sync-p63-mes-workflow-foundations-01.md`（未通过，剩 TS01—TS03）；唯一执行入口 `receipts/planning-execution-prompt-p63-terminal-sync-01.md` |
| 候选与 Git 事实（分层） | 验收候选（业务候选，≠当前文档 HEAD）Server `19d1da2165dd0d9a5671ab9a088941b15e52a851`、Web `2b0c660fb1b1d4f612ada472c38e964a481937a5`；当前 Git 事实（2026-10-08 实测）：Server develop 文档 HEAD `692b73c748cc420b2aafef8a593a4d8e65ab1b50`（本地=远端；业务候选不变）、Web develop = 验收候选、workspace `develop-sw` 批次 `c5d493d`＋补记 `bfe365c`＋Planner 复核轮 `6f02b49`（本轮修订批次与回读见 `receipts/evidence/terminal-sync-02/git-readback-02.md`） |
| 执行回执链（历史，逐轮追加保留） | `receipts/completion-p63-mes-workflow-foundations-01.md`—`-10.md`；审查 `planning-review-completion-03.md`—`-10-passed.md`；补充提示 01—09 均已结清、只作历史 |
| 探索回执（历史时点） | `search_fallback/p63-mes-workflow-foundations-readiness-20261006.md` + 附件；规划复核 `receipts/planning-review-readiness-01.md` |
| 浏览器/行为证据根 | `product/p63-mes-workflow-foundations/receipts/evidence/acceptance-02/`—`acceptance-10/`（分层：真实 PG、受控 HTTP 对端、可见浏览器 PNG） |

---

## 3. 正式验证集合（VB01—VB04；授权集合=实际涉及=回执声明，互不相加）

| ID | 唯一登记值与证据 |
|---|---|
| VB01 Web 最终候选 | **`2b0c660fb1b1d4f612ada472c38e964a481937a5`（develop）**：typecheck/lint/test/build 四门 exit0——typecheck 合法静默 exit0（22B）；lint 0 error / **79 warning**；vitest **151 测试文件通过+1 跳过（152）**、**1365 测试通过+3 跳过（1368）**（`node-capabilities.spec` 16 通过为全量子集，含 FIXED 数组化用例）；build `✓ built in 1.96s`。原件 `receipts/evidence/acceptance-10/raw/g10b-web-{typecheck,lint,build}-original.md` 全文、`g10b-web-vitest-original.md` 索引＋`g10b-web-vitest-original.log`（本地留存）。不另加 16、不沿旧 1364/76。 |
| VB02 Server 受影响模块 | iot **63/0/0/0**、engine **76/0/0/0**（审查07），process **266/0/0/0** 与 exit0（`receipts/evidence/acceptance-08/raw/p63-process-tests8.log`，审查08 最终授权修复后）。候选 `19d1da2165dd0d9a5671ab9a088941b15e52a851` 仅授权修复、其余未改；不把三数扩推整仓绿基线。 |
| VB03 P63 功能行为基线 | 20 原子（G01a/G01b/G02a/G03a/G03b/G04a/G04b/G05a/G05b/G06a/G06b/G06c/G07a/G07b/G08a/G08b/G09a/G10a/G10b/G10c）与 A01—A10 全部通过（审查10§3 及审查03—09 原件指针；真实 PG/HTTP/可见浏览器分层）。外部资产恢复隔离 **3/0/0/0**（审查07）、截止内 FLOW 恢复 **1/0/0/0**（审查08 等强度替代）单列，不与 VB02 或全量计数相加；真实对端 SUCCESS/UNKNOWN 边界沿原对象，不称物理恰一次。 |
| VB04 P63 追加迁移 | `V0.1.5__p63_dynamic_branch_semantics.sql`、`V0.1.6__p63_iot_command_reservation.sql`、`R__p63_iot_reservation_menu.sql`（`sw-bootstrap` PG/H2 双链）；三文件与升级/关闭新配置后的存量管理行为沿 G10a 审查06 锁定，迁移链到 **0.1.6**。迁移版本不冒充产品发布版本；历史产品/部署版本不变。 |

历史失败诊断保留（不新建基线、不重复测试）：bootstrap 全量 **286/3/0/27 exit1**（Phase4 `Phase4PgStartWindowCrashTest` 既有失败=装置时序 + 审查03§49 守准入截止，按审查08 由截止内受控恢复替代接受）；两外部受控资产（broker 18830 / 对端 9778）缺失已隔离 3/0。**全部收敛不等于全部成功**；无效果且执行权终止可 EXPIRED、进行中/部分效果依权威结果；不写「bootstrap 全量通过」。

---

## 4. 边界与留账

- **范围**：完整 MES 应用、分管领导组织模型、周期预约、真实机房动作（断电/火警）、温度 Agent、厂商实网、新增部署拓扑不在本功能验收内；已发布/旧定义与运行实例兼容沿 A09/A10 锁定。
- **REG-P63-Phase4CrashTest**：Phase4 崩溃恢复失败归既有问题（对照候选 92238ad 同败；FLOW 路径零引用本轮共享接缝）；审查08§3 合同裁决（全部收敛≠全部成功、截止内恢复替代接受）已落既有登记，不重跑旧自然等待用例/全量、不改截止/共享重排/恢复合同。
- **P62 张力留账**：P62「截止与恢复」≤120s 收敛 vs「截止后不得执行」的表述张力按审查08 裁决收敛为「无效果且执行权终止可 EXPIRED、进行中/部分效果依权威结果」。
- **性能与资源策略**：P62 性能仍 Owner 延期、未验证；新资源策略默认关闭；无性能执行任务、无发布/部署动作。
- **问题记录**：问题总记录 57 为 P63 起始历史基线；执行期确证并修复的缺陷随候选提交（Server `19d1da2`/Web `2b0c660`），不删除已登记条目、不另造问题、不擅自关闭其他问题。
- **计数口径**：正式功能数 47（46+1）与清单 90 行完成行 ✅46 为不同统计口径，不混同；ADV64、其他 P/明细状态不变。

---

## 5. 交付要点（能力摘要）

- **表单来源与八组合**：主字段/表格列 × 人员/部门 × 单选/多选八组合存储与读取（多选 JSON 数组 VARCHAR(1000)、DATE `format='datetime'`）；APPROVAL/CONSENSUS/DYNAMIC_PARALLEL 统一 FORM_FIELD 参与人策略与权威解析（人员直解析、部门逐个解析唯一负责人）。
- **动态并行 v2**：`semanticVersion` 门控；对象分支按稳定 ID 去重、表格来源行保留追溯、轮次按多实例根 executionId 键控（同轮复用/重入新轮/旧轮 SUPERSEDED_BY_ROUND）；v1 旧语义不迁移、旧实例继续原规则；规模沿既有默认 50/硬上限 200 与有界输入解析。
- **手工并行兼容（Owner 硬边界）**：新增式 PARALLEL_GATEWAY 翻译器补齐；手工分支数/节点/连线/汇聚语义由原图决定，保存/发布/执行不自动转换；旧图保存不丢失合法未知配置；一个路径含动态审批时先内层汇聚再参与外层汇聚。
- **一次性 IoT 预约**：成功完成同事务冻结意图（unique(租户,实例)）；显式时区（歧义/不存在拒绝）；到期/过期不补发、到点条件认领下发、允许迟到窗口 1—3600 秒（默认 60）；待触发可取消、取消与认领竞争单结果生效；到点重核租户/设备/功能有效性；流程详情与 IoT 命令记录同对象可回查；UNKNOWN 禁自动重发与受控人工核实边界不变。
- **设计器实际入口**：固定值来源按 objectType 复用人员多选/部门树多选（稳定对象 ID 数组，与 CONSENSUS participant 形状一致）；新建动态并行默认 BLOCK 与合法来源同帧可见；配置授权缺陷（`PUT /workflow/defs/{id}/graph` 缺 `@PreAuthorize`）已归位修复并负向复验 403。
