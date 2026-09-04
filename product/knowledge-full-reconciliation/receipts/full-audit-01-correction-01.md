# 全量审计修正回执 · full-audit-01-correction-01（A 阶段补证）

> 功能：知识库全量整理与同步（L 级）· 阶段：A 全量审计补证（G1—G5）
> 角色：Executor；日期：2026-09-04 16:39—16:50 CST
> 依据：规划验收 `planning-review-full-audit-01.md`（VERIFYING；L1—L8 锁定通过；仅补 G1—G5，不重做全量审计/业务测试）
> 范围：仅本功能 `receipts/` 新增本回执与 `evidence-correction-g1-g5/` 原始证据附件；**未改写** full-audit-01.md 与 A—E 账本，**未修改** knowledge、功能清单、todo、memory、search_task/fallback、product 生命周期目录或业务代码，未运行编译/测试/迁移/部署，未提交/推送。
> 采纳的规划裁决（自 `planning-review-full-audit-01.md` §Planner差异裁决，下文以「F1—F9」引用）：F1 功能数保持 41；F2—F6 五行 ⬜→🟦；F7 清单唯一目标 ✅34/🟦28/⬜28 且 P34/P35/P37/P38/P39 保持未核销；F8 三类个人查询保持 M04-F05-01/P4 开放范围；F9 D1—D20、X1—X9 具体文件修改未授权，待 B 阶段逐文件唯一同步清单。

---

## G1 统计单值（修正替代 full-audit-01.md §2/§6 与账本 A §5/账本 B A1 的冲突段）

**唯一口径（本回执生效，原文字段以本表替代）：**

| 统计项 | 原摘要/账本值（冲突） | **修正唯一值** | 依据（原始输出/已锁定裁决） |
|---|---|---|---|
| known-issues 条目数 | 摘要 54 条且「缺 I27」；账本 A「55 条含 I27」 | **54 条物理行；编号区间 I1—I55（55 个编号位置），I27 无行**；无重复编号 | `evidence-correction-g1-g5/raw-i-ids.txt`（54 行）、raw-i-missing.txt（仅 I27/I56 缺号，I56 无行不入区间）、raw-i-duplicates.txt（空=无重复） |
| 「功能清单明细」 | 摘要「95 项明细」 | **功能清单明细=90**（M01 13/M02 7/M03 8/M04 10/M05 4/M06 4/M07 14/M08 13/M09 8/M10 9 = 90）；P、I、product 为各自独立集合 | `raw-checklist-90.txt`（90 行）；模块行数由账本 E L2 已锁定 |
| P58 行 Flyway 值 | 账本 B A1 写「H2 V49/PG V48」 | **H2 V49（49 迁移）/ PG V49（48 迁移）**；引用 P58 终态裁决（planning-final-review-p58-terminal-sync-01-passed.md，2026-09-04），未重跑迁移 | current-status.md L28 同值；本回执不重跑迁移（方向 §7） |
| P/I/product 独立集合 | 摘要混计 | **三个独立集合分别计数**：P 池物理 57 行/唯一 56 编号（见 G2）；I 集合 54 行；product 目录 57（审计 55） | 见 G2/G3 原始输出 |

历史原件（full-audit-01.md、A 账本）按对账规则 §7 保留不覆盖；本表为读取当前结论的唯一修正入口。

## G2 P 集合计数（修正替代账本 C §三.2 的「56 行」表述）

**三种口径（Planner 只读复算与本轮复算一致）：**

| 口径 | 值 | 输出文件 |
|---|---|---|
| 物理行数 | **57** | `raw-p-rows.txt`（57 行） |
| 唯一 P 编号数 | **56**（P1—P58 区间：P13、P23 无行） | `raw-p-unique.txt`（56 行） |
| 重复编号检测 | **P48 出现 2 次**（总表 L39 + 待排期明细 L415，两行状态一致均「已核销」，属总表/明细双登记非重复计数） | `raw-p-duplicates.txt`（唯一输出 P48） |
| 缺号 | P13（经 knowledge/features/sysrole-v5-column-alignment 确认已闭环核销，合规移除）、P23（全工作区零引用备案） | `raw-p-missing.txt`（P13、P23） |

**唯一 P 编号分类复算（56 个，单归属）：** 已核销/完成 19（P1、P5、P6、P7、P8、P10、P12、P24、P28、P32、P36、P45、P46、P48、P51、P52、P56、P57、P58）· 未排期 14 · 待对账、未核销 6（P4、P34、P35、P37、P38、P39）· 待排期 4 · 未开发候选 3 · 部分关闭、未核销 2（P3、P21）· 待设计 2 · 待规划 2 · 待开发 1 · 待决策 1 · 待Owner确认 1 · 仅骨架 1。合计 19+14+6+4+3+2+2+2+1+1+1+1 = **56** ✓（`raw-p-row-classified.tsv`）。

**I 范围措辞修正**：账本 C 「I31—I56 范围内」存在不存在的 I56 数字——实际 I 集合为 **I1—I55 区间（54 行，缺 I27）**；后续所有 I 范围表述仅使用实际存在编号（raw-i-ids.txt）。「P/I/product 全集无静默遗漏」以 G3 原始枚举为证。

## G3 可复算证据（原始枚举 + 哈希回读）

本轮实际执行的只读命令原始输出已保存至 `receipts/evidence-correction-g1-g5/`，全部记录工作目录（`/usr/local/projects/Smart-WorkFlow`）与退出码（`README-meta.md`）：

| 集合 | 原始输出文件 | 结果 |
|---|---|---|
| 功能清单 90 行 | raw-checklist-90.txt | 90 行；✅34/🟦23/⬜33；exit=0 |
| P 集合 | raw-p-rows.txt / raw-p-unique.txt / raw-p-duplicates.txt / raw-p-missing.txt / raw-p-row-classified.tsv / raw-p-status-dist.txt / raw-p-classified.txt | 57 物理行 / 56 唯一 / P48×2 / 缺 P13、P23；exit=0 |
| I 集合 | raw-i-ids.txt / raw-i-missing.txt / raw-i-duplicates.txt | 54 行 / 缺 I27（I56 无行）/ 无重复；exit=0 |
| product 目录 | raw-product-dirs.txt / raw-product-dirs-audited.txt | 57 总 / 55 审计；exit=0 |
| knowledge/features | raw-features.txt | 41 文件；exit=0 |
| search 配对 | raw-search-tasks.txt / raw-search-fallbacks.txt / raw-search-task-archive.txt / raw-search-task-no-fallback.txt / raw-search-fallback-no-task.txt / raw-search-fallback-orphan.txt | task 8（含 .archive 4）/ fallback 51；有任务无回传 1（notification-personal-workflow-reconciliation-20260904.md）；扣除 .archive 归档链后有回传无任务 11；exit=0 |

**账本哈希清单与回读**：`evidence-correction-g1-g5/SHA256SUMS` 覆盖 full-audit-01.md 与 A—E 五账本；`shasum -a 256 -c` 回读 **6/6 OK，exit=0**。

## G4 清单状态建议（按 Planner 固定值复算，F2—F7）

以下五行均为 `⬜ → 🟦`（目标值，**未落盘**，待 B 阶段授权；P34/P35/P37/P38/P39 保持待办开放、未核销——状态纠正≠功能完成）：

| ID 明细 | 已实现子集（证据层级） | 剩余子集 | 目标状态 |
|---|---|---|---|
| M04-F01-03 会签规则（P34） | P58 验收：ALL/ANY/RATIO 会签结算、独立审批意见、取消语义（ConsensusNodeTranslator/ConsensusTaskListener/ConsensusCompletionEvaluator；测试 ConsensusCompletionEvaluatorTest + P58 回执运行时证据） | 原明细「通过比例、一票否决」完整范围待后续功能验收（账本 D 静态定位） | 🟦 |
| M04-F07-01 流程规则（P35） | P58 验收：受控条件表达式与条件分支（BpmBranchConditionEvaluator/ConditionGatewayTranslator + sw_bpm_branch_trace V49） | 超时处理、自动审批/自动通过规则未实现 | 🟦 |
| M06-F01-01 通知渠道（P37） | 站内信（真实实现）+ 统一通知 SPI（NotifyFacade/NotifyChannelAdapter + 消费方 CopyNode/NotificationNode/BpmNotifyListener，投递状态落库 V48；P58 回执 G1/E5 运行时证据） | 真实厂商渠道接入与配置开关未实现（仅 dev 隔离 Adapter；NotifyTargetResolver 无消费方骨架） | 🟦 |
| M06-F02-01 通知模板（P38） | 通用模板实现可复用（同一 sw_notify_template 表与渲染链路，M05-F02-01/P36 已核销） | 按渠道配置内容与变量的渠道维度未实现（表无渠道列）；不新建 P 编号，继续由 P38 跟踪 | 🟦 |
| M06-F03-01 通知规则（P39） | 内置审批事件触发（BpmNotifyListener：TODO_CREATED/APPROVED/REJECTED/RETURNED）+ 通知节点配置触发 | 用户可配置规则与订阅设置未实现 | 🟦 |

**目标计数复算**：当前 ✅34/🟦23/⬜33 → 五行 ⬜→🟦 → **✅34 / 🟦28 / ⬜28 = 90**（34+28+28=90；python3 复算确认；原始输出 raw-checklist-90.txt + 五行唯一性 grep -c=1 每行）。正式功能数保持 **41**（F1）；不因状态纠正核销任何 P 编号（F7）。

## G5 跨账本结论整合（有效替代结论）

| 原冲突位置 | 原陈述（失效） | **有效替代结论（本回执生效）** |
|---|---|---|
| 账本 C §五 | 「search_fallback/notification-personal-workflow-reconciliation-20260904.md 不存在 ⇒ 三类查询逐项结论、映射建议、计数影响均未生成」 | 局部探索任务被主方向吸收（方向 §1），其待答问题已由同批审计生成：**三类查询逐项结论 = 账本 D §3（我的待办 API/页面+可处理者过滤；我的已办 API/页面+实际处理人，存在 ASSIGNEE_ 落库疑点未运行验证；我发起的无专用入口；抄送我的/催办无实现）；映射建议 = 账本 E M04-F05-01 行 + 主回执 §3；计数影响 = P4 开放未核销、M04-F05-01 维持 🟦（F8）**。无回传文件仅说明该局部任务未独立结项（已在 G3 search 配对列示），不影响审计结论完整性。 |
| 账本 B A1 admin-role-governance 行 | 「I36 子集关闭（P1 其余缺口保持开放，无误核销）」 | **P1 当前事实 = 已核销（2026-08-20，role-menu-permission-parity D123 规划层最终验收 PASSED + 阶段三终态同步 COMPLETED，P1 全部子项 I31/I36/F02/F03 已闭合）**。账本 B 该行为 admin-role-governance（D97，2026-08-18）交付时点陈述，属历史子集说明；P1 核销事实以 todo/requirement-pool.md P1 行（✅已核销）为准。
| 账本 B §B.4 | 「P1 其余缺口保持开放、P7 仅关子集…均为正确不核销记录」 | **P1 已核销、P7 已核销（2026-08-23，单步调试 D180 15/15 + 终态同步；P7 双子集 D148/D149 运行日志 + D175—D180 单步调试均闭环，todo/requirement-pool.md P7 行 ✅已核销）**。该段为各功能交付时点的历史子集记录，不构成当前开放项；当前开放集合见 G2 分类（P3/P21 部分关闭、P4 开放、P34/P35/P37/P38/P39 待对账等）。历史子集陈述不会重新成为当前开放项。 |

**整合读取入口**：当前结论统一以 主回执 §2—§4 + 账本 E + 本修正回执 为唯一口径；账本 A/B/C/D 中与上述表冲突的历史/时点表述均以本回执替代。

---

## 自验结论

G1—G5 全部闭合：G1/G2 统计单值与三口径由原始枚举复算（56 唯一 P、54 条 I、90 明细）；G3 六集合原始输出 + SHA-256 回读 6/6 OK；G4 按规划裁决复算 ✅34/🟦28/⬜28=90 且五 P 编号未核销；G5 逐处指定 C§五、B P1/P7 有效替代结论。未启动 B 阶段同步，D1—D20/X1—X9 文件修改仍待授权（F9）。**自验通过，待规划验收确认后进入 B 阶段同步授权。**

**附件**：`evidence-correction-g1-g5/`（README-meta.md、SHA256SUMS、21 份 raw 原始输出，合计 84KB）。