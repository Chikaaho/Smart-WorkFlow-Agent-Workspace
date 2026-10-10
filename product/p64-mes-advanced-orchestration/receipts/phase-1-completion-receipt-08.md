# P64 阶段Ⅰ完成回执08（提示06 两项原证提取）

2026-10-10；Executor。依据[规划复审07](planning-review-phase-1-07.md)与唯一执行入口[收敛提示06](planning-execution-prompt-p64-phase1-06.md)，在既有完整实施授权内完成 2 项剩余原证。**阶段Ⅰ保持 VERIFYING，P64 保持 IN_PROGRESS；功能 47、清单 46/22/22=90、ADV64、问题 57、P63=COMPLETED、P62 延期/新策略 OFF、根 Server gitlink `78495dc` 全部不晋级不变。**证据树 `evidence/phase1-08/`（两包独立 index + MANIFEST）。本轮**零测试/业务改动**；已过矩阵（worker/版本冻结/X5 二段恢复/OFF/并发/升级/768/三类型/process 347/Web 1376 门禁）全部保持锁定，不重跑。

## 1. 两行账本（全部为是）

| ID | 原位置（真实方法边界/命令原输出） | 实际结果 | 边界 |
|---|---|---|---|
| **P1-05a** 关键断言原提取 | `raw/05a-assert-extract-by-method-boundary.txt`：Python 花括号配平解析当前方法实际起止边界，逐行带行号 | 五新增 case **完整方法体**（行 211-222/224-235/237-256/258-281/283-294）：`verifyNoInteractions`×2（未知来源/SYSTEM 白名单外→零读取）、`verify(never())`×2（NODE_FORM 缺键→零读取；`argThat` 他实例/他租户变体）、`verify+verifyNoMoreInteractions`（MAIN_FORM 恰一次 `findRecord(9L,"main_form_bound","rec-bound-42")`＝调用租户+实例自身绑定）、`verify(listSubmitted(9L,"pi-1","node_qc",2L))`（NODE_FORM 限定本实例租户/实例/节点/轮次）+`containsEntry(null)`/`missingRequired` 断言原文；既有名单 case 按复审口径只摘实际必要断言（行 187 `doesNotContainKey("v_secret")`）。提交关联：文件最后提交=`effca33`、`git status --short` 空=当前文件与该提交快照逐字节一致（HEAD=`ef72c8b`）。XML 对应：共享原件 `../phase1-07/P1-05a/raw/TEST-…xml` 完整解析=**12 `<testcase>`/0 failure/error，六个方法全命中附 time**（嵌套 system-out 的 2 例由完整开标签解析覆盖，改正上轮自闭合正则漏计） | 只读提取；零新增测试/零重跑；代码未变化故无受影响门禁（process 347/0 沿用锁定）；不以方法名/DisplayName 替断言 |
| **P1-08a-C** 新三仓 Git 截止原输出 | `raw/08a-C-git-cutoff.txt`（`git branch/log/rev-parse/status/ls-files -s` + 三仓 `ls-remote`，2026-10-10 08:05） | Server HEAD=origin=**`ef72c8b`**（`log -4`：ef72c8b←d47b4e1←effca33←87afbe9，代码=`effca33`）；Web HEAD=origin=**`21074af`**（本轮零改动，最终态=回执07 的 08a-W 提交）；两仓 `status --short` 空=CLEAN。工作区：回执07 主批次 `2d6f0f33`+交接批次 `19ebc9f9` 之后存在**新增并行治理提交** `2ba37f03`/`539adcc2`/`8da874bd`（Admin Hook 批次），当前 HEAD=origin=`8da874bd`；`ls-files -s` 实记录 Web gitlink=`7af86f2`、**Server gitlink=`78495dc`**（mode 160000，Owner 认可保留）；未提交范围全量在案（本轮 Executor knowledge 同步+Planner 路由同步+prompt06/review07 未跟踪+Admin 待办+两 gitlink M）。回执08 工作区新批次 SHA 回填 `memory/handoff.md` §Git（第二段提交） | 只读 git/ls-remote；不运行工程/数据库；不改 gitlink、不合并/tag/部署；旧截止（87afbe9/53eec1e/e185105c）不再充当现状 |

## 2. knowledge-first 路由同步（伴随本件）

current-status（新顶部条目+回执07 条目转历史）/session-handoff 覆盖值/P64 功能登记（状态行+分支时点③+路由行）/architecture:259/memory handoff（§回执08 执行结果+§Git 收尾）/Server 功能清单焦点行（`ef72c8b` 提交）——统一指向**复审07/提示06/回执08**；三 ready 由 Planner 本轮已同步，工作树原状随本批次固定。

## 3. Git 收尾

- Server HEAD=`ef72c8b`（origin 同 SHA、工作树 CLEAN）；Web HEAD=`21074af`（origin 同 SHA、CLEAN）。
- 工作区回执08 主批次 SHA=**见 `memory/handoff.md` §Git（第二段提交回填）**；推送后远端 `ls-remote` 原输出追加于 `P1-08a-C/raw/08a-C-git-cutoff.txt` 末尾（同一次只读会话的收尾段）。
- `.codex/**` 与 Admin 待办属 Hook 治理独立范围，不在本批次。

## 4. 自检（两行各自核实）

1. **P1-05a**：断言/verify 片段按真实方法边界逐行可回读，逐 case 与已跑 XML 对应；调用租户（9L）、实例 formKey/businessKey（main_form_bound/rec-bound-42、pi-1/node_qc/2L）、合法精确读取（verify 恰一次）、非法源零读取（verifyNoInteractions/never）、SYSTEM 排除（containsEntry(null)+missingRequired）逐项在原文中——未用名称/注释替断言。
2. **P1-08a-C**：指定提交（Server ef72c8b 含 effca33、Web 21074af、工作区 2d6f0f33+后继）与远端/分支对应关系由 rev-parse/ls-remote 原输出确认；工作树状态、未提交精确范围、根 gitlink 78495dc 实记录；新截止与新增并行提交（治理批次）明确区分；无反复回填自 SHA（仅 handoff §Git 一次回填既有模式）。
3. 清单由工具生成：`evidence/phase1-08/MANIFEST.txt`（find+sha256sum，条数在文件头），逐文件哈希与实际内容一致。
4. 自身任务收尾：两原子项外无可执行项；零转嫁为零可执行项后方提交本回执。

**唯一下一动作 = Planner 独立复审本回执与 phase1-08 两项证据包。**不冒称阶段/整体 PASSED；Executor 不写功能 PASSED/COMPLETED、不核销 P、不晋级基线。
