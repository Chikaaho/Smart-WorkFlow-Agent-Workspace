# P51 `main` 终态历史对账 · 探索回执

> 会话角色：执行（Executor）｜委派：规划｜日期：2026-09-01｜性质：只读对账，未实施/修复/发布
> 固定对象：`main@e0711fbb7b3a345f3136910af9e71c31ee022ad3`
> 附件目录：`search_fallback/p51-main-terminal-history-reconciliation-evidence/`

## 核心结论

`main@e0711fb` 上 P51 已存在**完整正式终态闭环**：功能级 `PASSED`（`planning-final-review-admin-p51-consolidated-2.md`，核销 C1~C5）→ 阶段三 `COMPLETED`（`planning-final-stage3-review-p51-20260831.md`，`COMPLETED（已确认，2026-08-31）`）→ Owner 授权发布落库（提交 `a609783`，主题"Owner 确认 COMPLETED 并授权远端发布，索引状态同步"）。`product/p51-agent-coding-engine-decoupling/README.md`（e0711fb 版）状态边界明记："P51 已由规划确认 `COMPLETED`；远端发布：Owner 已于 2026-08-31 授权，`main` 与 `develop-sw` 已推送"。

**但 main 的 PASSED/COMPLETED 走的是管理员治理路径（C1~C5 编号体系），与 develop-sw 首轮审查的 P51-G01～G07（执行/功能路径）不是同一验收体系**。main 的 `planning-review`（G1~G6）与 `planning-rereview-root-runtime`（G1~G6）均标记 `FAILED`，随后经 `planning-routing-decision` 转入**单一管理员方向**（C1~C5），最终 PASSED 只核销 C1~C5。因此 **G4（非 SW 完整闭环）未被 main 正式审查锁定**（root-runtime 复审明确否定了 Executor 自造的示例 `PASSED` 审查）；**G5/G6 的"行为证据"也未以 G 编号进入最终裁决**。

## 十问逐项

**1. P51 tracked 清单**（`git ls-tree -r --name-only main -- product/p51-agent-coding-engine-decoupling/`，见附件 01）：`ready/` **0**（已移除）、`passed/` **5** 方向、`receipts/` **29**（20 回执/审查 + 15 evidence，其中 evidence-admin 8 + evidence-admin-2 7）。总计 **34 文件**。

**2. 关键文件标题/角色/日期/对象/结论**（附件 02 逐份）：
- `README.md`：P51 索引；功能状态 `COMPLETED（已确认，2026-08-31）`；下一动作"无——已收口"。
- `passed/direction-p51-root-runtime-workspace.md`：规划→执行，2026-08-31，READY，前置 `planning-review`。
- `passed/direction-admin-p51-engine-governance-consolidated.md`：规划→管理员，Owner 特别授权单任务治理收口。
- `passed/direction-admin-engine-governance-generalization.md`：规划→管理员，治理入口通用化。
- `passed/direction-admin-p51-stage3-closeout.md`：规划→管理员，阶段三收口（前置 PASSED）。
- `passed/direction-p51-language-agnostic-project-contract.md`：规划→执行+管理员，语言无关接入契约。
- `receipts/planning-review-...20260831.md`：规划审查，对象 develop-sw 完成回执，**FAILED**（锁定 G1~G3/4/5/6 部分通过）。
- `planning-rereview-p51-root-runtime-20260831-01.md`：复审，**FAILED**（G1 部分/G2 VERIFYING/G3 部分/G4 未通过/G5 VERIFYING/G6 未通过）。
- `planning-rereview-admin-p51-consolidated-20260831-01.md`：复审，**FAILED**（C1~C5 未通过）。
- `planning-final-review-admin-p51-consolidated-2.md`：**PASSED**（C1~C5 全部核销；独立复核 `main@45f2c98`，POSIX `35/35`，`origin/main=93ce28c` 未发布）。
- `planning-final-stage3-review-p51-20260831.md`：**COMPLETED（已确认）**（终态值清单逐项核销：功能数 0、清单 0/0/0、基线 POSIX 35/35、Hook 8/8、方向归档 5 份、memory 8 文件 3612 字节、Git 提交 7d59297/f80b02c、`origin/main=93ce28c`）。
- 对应完成回执 4 份：`completion-admin-engine-governance-generalization`、`completion-admin-p51-engine-governance-consolidated{,-2}`、`completion-admin-p51-stage3-closeout`、`completion-p51-root-runtime-executor`。
- evidence：`evidence-admin-consolidated/01~07`（结构/单仓/多仓/零调用/双工作区/Hook/回归）+ `evidence-admin-consolidated-2/01~07`（C1~C5 收敛证据）。

**3. 实际时序**（附件 03）：`2b2ca2d`（main 通用化）→`2bd193e`（根级工作区）→`d3e85af`（Hook 定位）→`7cf6361`（单管理员治理收口）→`45f2c98`（二 级收敛 schema/marker）→`7d59297`（阶段三方向归档）→`f80b02c`（阶段三回执落库）→`a609783`（**Owner 确认 COMPLETED 并授权发布**）→`f738cef`（规划阶段三最终确认落库）→`c5213a7/ae084b1/23e4f74/b6a51cf/511d471/1eeaee6/e0711fb`（README 半自动引擎说明、分支边界、分级流程、双语、license、演进轨迹）。主方向→管理员收口→运行时收口→阶段三→Owner 确认，依次完成。

**4. 正式 PASSED/COMPLETED 判定**：**存在**。逐字：PASSED 来自 `planning-final-review-admin-p51-consolidated-2.md`"功能级结论：PASSED / P51 已满足功能级方向…本裁决只表示功能级 PASSED，尚未完成阶段三归档、状态同步和最终确认"；COMPLETED 来自 `planning-final-stage3-review-p51-20260831.md`"最终结论：COMPLETED（已确认）/ P51 状态 | `COMPLETED（已确认，2026-08-31）` | 通过"。终态值清单核销见该审查 §二（附件 04）；最终下一动作（阶段三时说"等待 Owner 决定是否授权发布"）已由 `a609783` 落库为已授权已推送，README 现登记"无——P51 已收口"。

**5. G01～G07 覆盖映射**（见附件 05）：
| develop-sw 审查缺口 | main 既有审查覆盖 | 结论 |
|---|---|---|
| G01 分叉/实例资料可追溯 | `planning-review` 锁定通过项 1/2（develop-sw 已建、分叉回滚可复核）+ evidence 07 | 部分覆盖，实例明细未逐类证据化 |
| G02 独立自检 | `planning-final-review` §三 POSIX `35/35` + 隔离验证 | **已覆盖**（功能级 PASSED 依据） |
| G03 无业务状态/绝对路径 | `planning-final-review` C4 运行时表面全量扫描 + C3 标识 | **已覆盖**（C1~C5 核销） |
| G04 非 SW 完整闭环 | `planning-rereview-root-runtime` **未通过**（"执行角色无权代替 Planner 裁决…不能证明真实跨角色闭环"）；final-review **未核销 G4** | **未覆盖** |
| G05 README 双向导航 | `planning-review` 锁定通过项 5 提及；evidence 01/05 有 README 命中，无独立链接检查 | **未覆盖**（无逐项链接检查输出） |
| G06 两无关实例隔离 | `planning-review` G5 未验证→`planning-rereview` G5 VERIFYING；final-review **未核销**（双工作区证据在 evidence 05 存在但未被 G 裁决锁定） | **证据存在、裁决未锁定** |
| G07 远端未发布 | evidence 07 §7.1~7.3 + 阶段三 §六（`origin/main=93ce28c`）；随后 a609783 记录已授权发布 | **已覆盖（历史）**；当前远端已是 `e0711fb` |

**6. G04/G06 是否真实执行并被规划锁定**：
- **G04 非 SW 完整生命周期**：main 上 `completion-p51-root-runtime` 声称已完成 demo-todo-cli 全链（探索→方向→回执→审查），但 `planning-rereview-root-runtime` 明确裁决**未通过**（"执行角色在同一执行任务内生成了标为规划 PASSED 的示例审查文件，且临时产物已清理；该文件不能证明真实跨角色闭环"）。**未被规划锁定**。
- **G06 两无关实例隔离**：`evidence-admin-consolidated/05-dual-workspace-isolation.txt` 有真实输出（engine-a/b 各自身份正向命中 + 反向零交叉 0/0），`evidence-admin-consolidated-2/05-runtime-surface-scan.txt` 覆盖扫描。这些属**管理员 C 体系证据**，作为治理验证被采纳，但**未以"P51-G06"名义进入 develop-sw 首轮审查或最终裁决**；root-runtime 复审对 G5 仅"VERIFYING"，未升级为通过。**证据存在、G 编号锁定缺失**。

**7. main vs develop-sw 摘要差异**（根因）：**分叉后未同步**。分叉点 `93ce28c`；`main` 独立完成 P51 全闭环（PASSED→COMPLETED→a609783 授权发布）；`develop-sw` 在 `5c64ae8`（P51 方向 READY 记录）后仅 3 提交且**从不触碰 P51 终态**，其 `requirement-pool.md:61` 仍写"方向 READY，待执行；main 解耦为通用 Engine"。即：develop-sw 的 P51 摘要停留在分叉前/早期（`VERIFYING`），main 已 `COMPLETED` 并发布。**同一方向、同一任务**，差异=分支分叉后的摘要未同步，非两个独立方向。

**8. tracked 计数 70 vs 83**（附件 06）：**83 正确**。权威命令 `git ls-tree -r --name-only main | wc -l` 输出 `83`（EXIT=0）。主回执正文"70 文件"是归纳笔误（83 − 15 evidence = 68 ≠ 70，无对应口径）；以附件 02 原始输出 83 为准。

**9. 任务开始/结束远端引用**（只读 `git ls-remote origin`）：
- 开始（00:23 前后）：`HEAD=e0711fb`、`develop-sw=a2b8342`、`main=e0711fb`。
- 结束（00:26）：`HEAD=e0711fb`、`develop-sw=a2b8342`、`main=e0711fb`。
- **两次一致，任务期间未变化**；未执行任何远端写操作。

**10. 单值建议**：**选项 A（部分修正版）——main 已合法 `COMPLETED`，develop-sw 摘要需纠偏；但 P51-G04 与 G06（按 develop-sw 首轮 G 编号）未被 main 最终裁决锁定，是否需要在 develop-sw 补最终验收取决于 Owner 采用的验收口径**。依据：
- main 有正式 PASSED（C1~C5）+ COMPLETED（阶段三逐项核销）+ Owner 授权发布落库（a609783），无 D 冲突；
- develop-sw 的 `VERIFYING` 与"方向 READY 待执行"是**分叉前摘要**，与 main 正式终态矛盾，可由规划在 develop-sw 侧登记"P51 已完成（见 main 历史）"纠偏；
- 但 develop-sw 首轮审查的 **G04（非 SW 完整闭环）未通过、G06 未锁定**，这两项在 main 最终裁决（C 体系）中未以 G 编号进入；若 Owner 采用原 G 体系验收，则仍需补证；若采用 main 的 C 体系 + 阶段三收口口径，则 main 已 COMPLETED。
- 不能凭空制造终态：**最终裁决权在 Planner/Owner**，执行层只回传事实。

## 是否已完成合法终态闭环

**是（main 侧）**：功能级 PASSED → 阶段三 COMPLETED → Owner 授权发布落库，均有正式规划审查逐字结论与固定提交（附件 04）。**P51-G01~G07 在 develop-sw 首轮审查口径下未被 main 最终裁决完全覆盖**——G02/G03/G07 已覆盖，G01 部分覆盖，G04/G05/G06 未以 G 编号锁定（其中 G04 明确未通过）。

## 已完成/未确认/需继续

- **已确认**：十问均有单值答案；main 已 COMPLETED（Owner 授权）；G04/G06 在 G 体系下仍开放。
- **未确认**：无。
- **需继续**：规划层判断采用 C 体系（main 已完成）还是 G 体系（G04/G06 需补证）；decide develop-sw 摘要纠偏口径。
- **未发生任何工作区或远端状态变更**：全程只读；未 fetch/push/checkout/reset/clean/branch；未新建方向或回执外的文件。