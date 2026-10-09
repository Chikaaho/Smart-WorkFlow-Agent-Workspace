# P64 阶段Ⅰ完成回执07（提示05 六原子项收敛）

2026-10-09；Executor。依据[规划复审06](planning-review-phase-1-06.md)与唯一执行入口[收敛提示05](planning-execution-prompt-p64-phase1-05.md)，在既有完整实施授权（`../ready/authorization-p64-implementation-20261008.md`）内完成 6 项剩余断言。**阶段Ⅰ保持 VERIFYING，P64 保持 IN_PROGRESS；功能 47、清单 46/22/22=90、ADV64、问题 57、P63=COMPLETED、P62 延期/新策略 OFF、根 Server gitlink `78495dc` 全部不晋级不变。**证据树 `evidence/phase1-07/`（六包独立 index + MANIFEST，`ID→原文件:行/用例→实际结果→边界`）。

## 1. 六行账本总表（全部为是）

| ID | 正向证据 | 必要反向/失败原件 | 自验 |
|---|---|---|---|
| **P1-04a** 汇聚/分支/任务终态收尾 | 同 I6(`9360cee4`)/I7(`75af1262`) 只读补查（真实列 `proc_inst_id_/act_id_`）：`node_end` 恰 1、动态分支各恰 1 行（无 SUPERSEDED）、4 任务全 COMPLETED 零 ACTIVE、实例双 APPROVED（`phase1-07/P1-04a/raw/04a-closeout-*.txt` 四件）；`e_23/node_3` 单激活沿用已采信对照件（共享原件不重做并发） | 上轮失败 SQL 原件保留不改写（`raw/04a-postfix-i6-i7-counts.txt` 列名误用 ERROR），替代查询指明真实列与对象；X7 原行原样 | **是** |
| **P1-05a** 变量来源权限断言 | 权限主体=调用方租户（`LoginUserHolder`/办理同事务）、来源绑定=实例自身；既有 case 工具提取（`raw/05a-cases-tool-extract.txt` 带 grep -n 行号与安排/断言原文）；最小增补 5 case（`BpmVariableSnapshotServiceTest`）：未知来源拒绝+`verifyNoInteractions`、NODE_FORM 缺键拒绝+`never` 读取、MAIN_FORM 恰一次按调用租户+实例绑定读取（`verifyNoMoreInteractions`）、NODE_FORM 限定本实例（`never` 他实例/他租户）、SYSTEM 白名单外排除（null+missing）且零读取；类 XML **12/0**（7 既有+5 新增） | 复审06 分类"缺断言证据、尚不判产品缺陷"如实保留；零生产代码改动，无需额外修复门禁 | **是** |
| **P1-08a-L** 自身服务退出与环境收尾 | 两级证据：①历史退出原流提取补落（`raw/08a-1/2-service-*.txt`：taskkill 8196 进程树 SUCCESS→8080 no listener→三端口零 java）；②当前精确读回（`raw/08a-L-readback-now.txt`）：8196/27476/13147 均不存在、`java.exe` 全列表 0、8080/8081/5174 零监听、主库 30 实例全终态 **0 RUNNING**、命令 **0 PENDING/PROCESSING**、意图 18×STARTING（ADR §4 设计持久态）**全部解析 STARTED 且 unresolved=0**、`act_ru_task=0`、PG/Redis Up 28h 未动 | 不重启已停服务、不 taskkill 复用 PID、不造种子库；持久 STARTING≠在途（以目标实例可解析为判据，与 `resolveDisplayStatus` 同口径），不把设计态误报为挂起 | **是** |
| **P1-08a-W** Web 后继快照四门 + 恢复入口断言 | 快照=Web HEAD `53eec1e`+本轮 4 文件（`raw/gates-summary.txt` 头部 git status 原文）；四门**真实 EXIT=0 逐门记录**：lint 0e/3w、typecheck 静默（退出在案）、vitest **1376+3**（恰 +1 文件 +5 测试）、build ✓3.50s；恢复入口断言=纯函数 `canRetryActionRefStatus`（FAILED/INTENT_SUBMITTED/STARTING=true，与后端持久门槛一致）模板编译级引用 + 组件级 3 case 真实 `retryActionRef` API 行为（成功透出后端消息+重载/失败可诊断/在途互斥） | 不重做 768 写链/三类型矩阵；单元格级渲染以"允许最小安全组件替代"口径用纯函数+组件行为断言覆盖（stub 渲染限制如实登记） | **是** |
| **P1-08a-D** ADR §4 正文与修订04 一致 | §4 消费项恢复子句重写为修订04 ②语义（`ActionRefRecoveryService`/`:R{n}` 恢复代/原载荷不改写/零目标处置/已启动拒绝重试/`workflow:instance:view`）+新增修订05 记录；回读原件（`P1-08a-D/raw/08a-D-adr-readback.txt`）：`收敛需 ORCH 级重跑` **§4 正文 0 命中**（仅存修订03 历史头与修订05 引用记录），§1/§6 无冲突 | 历史原件（修订03 原文）不改写；纯文档收尾，不因文案重跑业务 | **是** |
| **P1-08a-C** knowledge-first 全受影响入口覆盖 | 逐入口字段级回读原件（`P1-08a-C/raw/08a-C-coverage-readback.txt`，10 组）：current-status/session-handoff/P64 功能登记（**复审06 指认缺核验项，已补**：状态行/分支双时点/路由行）/architecture/reconciliation（**指认缺核验项，已补**：三文件 P64 提及=0，不晋级核验）/Server 功能清单/memory×5（14,632 bytes<20,000）/todo×2/三 ready 路由（规划收尾批次，回读一致）/ADR 修订05 | 计数/gitlink 无晋级（各入口文本内原样）；不受影响文件不无效重写 | **是** |

## 2. 本轮实现变化（最小、受影响门禁已过）

- Server：`BpmVariableSnapshotServiceTest` +5 case（**仅测试**，生产代码零改动）——代码提交 `effca33`；功能清单焦点行文档提交后 **Server HEAD=`d47b4e1`**。
- Web：`p64-orchestration.ts`（新增导出纯函数）/`ProcessInstanceList.vue`（v-if 改引该函数，行为等价）/`p64-orchestration.spec.ts`（+2 case）/新增 `ProcessInstanceList.spec.ts`（3 case）——提交 `21074af`。

## 3. 受影响门禁

- Server sw-bpm-process 全模块：**Tests run: 347, Failures: 0, Errors: 0, BUILD SUCCESS**（342→347 恰 +5；`P1-05a/raw/process-gate-347.log`）。engine 本轮零改动，沿用回执06 的 100/0 锁定。
- Web 后继快照四门 EXIT=0（`P1-08a-W/raw/`，含逐门 START/END/EXIT 原记录与四份日志）；提交后工作树复验 10/10（目标 spec）。

## 4. Git 收尾

- Server HEAD=`d47b4e1`（含代码 `effca33`）；Web HEAD=`21074af`；推送后远端 ls-remote 回读原输出见本回执提交后 `memory/handoff.md` §9。
- 工作区 `develop-sw` 本批次（回执07+phase1-07 六包 index+knowledge/memory/todo/ready 同步+提示05/复审06 归档）：**主批次 SHA 记录于 `memory/handoff.md` §9（第二段提交回填）**；根 Server gitlink `78495dc` 保持。
- `.codex/**` 与 Admin 待办为本轮工作树中 Admin 独立范围（Hook 治理），**不在本批次提交范围**。

## 5. 观察项边界（保持，不晋级不改判）

- 同键异载荷 2426：不偷改历史请求，恢复经换键/恢复代（已验证路径）。
- SUPERSEDED_BY_ROUND：历史记账痕迹，修复后单激活已由替代查询锁定。

## 6. 自检（六行各自核实，非模板化"全是"）

1. **正/反证据真实可回读**：六包每行 index 均指向 raw/ 原件（SQL 原输出/工具提取/XML/日志/JSON），失败原件（04a 旧 SQL、上轮退出流缺口说明）原样保留并在 index 标明失败原因——可复核。
2. **身份与最后快照一致**：04a 对象=复审06 采信的同 I6/I7；05a=现有测试文件+最后代码快照（零生产改动）；08a-L=复审06 指认的 8196/27476/13147/三端口/30 对象；08a-W=Web 最后快照 53eec1e+本轮差异（git status 原文在案）；08a-D/08a-C=当前仓内实际文件（行号回读）。
3. **清单实际生成并校验通过**：`evidence/phase1-07/MANIFEST.txt` 由脚本生成，逐文件 SHA256 与实际内容一致（生成命令与条数在文件头）。
4. **授权内可执行项清零**：提示05 六行全部完成；无转嫁为"等待 Planner"或范围外观察项；两观察项为复审06 已裁定的既有边界保持。真实限制如实登记：08a-W 单元格级 UI 渲染断言以允许的组件替代口径覆盖；08a-L 历史退出流为上轮原件+当前读回两级（时间点分别标注）。

**唯一下一动作 = Planner 独立复审本回执与 phase1-07 六项证据包。**阶段通过不替代整体 A01—A12；Executor 不写功能 PASSED/COMPLETED、不核销 P、不晋级基线。
