# 会话交接（session-handoff）— 当前压缩版

> 同步点：2026-09-07，`p4-oa-personal-center-dual-dispatch`（P4 OA 本轮子集）功能状态 **COMPLETED（2026-09-07）**（验收事件：功能级 PASSED，规划复验09）；终态同步修正回执 `terminal-sync-p4-02.md` 待 Planner 复核。P59 时点全文存档：`knowledge/history/current-status-through-2026-09-07-p4-stage3-before.md`。更早历史见 `knowledge/history/README.md`。

## 当前唯一值（P4 本轮子集终态同步方向）

| 字段 | 值 |
|---|---|
| 正式业务功能数 | **42**（41＋本轮子集 1，不另建 P 编号） |
| 清单规模 | 10 模块、55 功能、90 明细 |
| 清单状态计数 | **✅34 / 🟦28 / ⬜28**（P4 子集零行升降级，M04-F05-01 仍 🟦） |
| P 编号 | **P4 开放、部分实现，未整体核销**（本轮子集完成）；P58/P59 等已核销项保持；P3/P21 部分关闭未核销；P34/P35/P37/P38/P39 部分实现未核销；I 集合 54 条不增删 |
| 后端基线 | 174 份 Surefire 报告 / 1128 tests / 0 failures / 0 errors / 0 skipped；MVN_EXIT=0 |
| 前端基线 | 121 files passed + 1 skipped / 1153 tests passed + 3 skipped；VITEST/ESLINT/TSC/BUILD_EXIT=0（lint 范围按已锁原件注明） |
| Flyway | H2 V55（55）/ PG V55（54） |
| 当前任务状态 | `p4-oa-personal-center-dual-dispatch`：**功能状态 COMPLETED（2026-09-07）**（验收事件：功能级 PASSED，`planning-review-p4-09-passed.md`）；终态同步修正回执 `terminal-sync-p4-02.md` 待 Planner 复核 |
| 活动业务实现功能 | 无 |
| 唯一下一动作 | 等待 Owner 选择下一需求（不自动选择下一业务需求） |

## P59 发布时点唯一事实（2026-09-04 已验收发布时点，不要求后续 ref 永久停在该 SHA）

- 规范地址：后端 `git@github.com:Chikaaho/Smart-WorkFlow-aPaaS-server.git`、前端 `git@github.com:Chikaaho/Smart-WorkFlow-aPaaS-Web.git`、工作区 `git@github.com:Chikaaho/Smart-WorkFlow-Agent-Workspace.git`（产品 CH-aPaaS / PaaS）。
- 六分支发布时点 SHA：Workspace develop-sw `721f034e6f1cc1cd80993e358087201dab6626a2`、Workspace main `29f70338d0390810e932bdd040e82956743d343b`、Server develop `d62c8436bd4a20deea13b2700ab4998ce0052934`、Server main `6ab9ae50080b2ae884eefaa728ae021702661ece`、Web develop `f2647e151ab40c00efd5dbd7df753e97721bc916`、Web main `4c044c671318627599560320efd217a0a520b5aa`。
- 累计提交 **26**（原 17＋增量 9）；Server 成功 run 33889195373、Web 成功 run 33889880505；两仓 tag 为 `build-`＋对应 main 完整 SHA；资产指纹及证据边界见审查07与 `planning-online-verification-p59-07.json`。
- 场景 3.1—3.3 仅原始记录，未实施（原文在 `todo/ch-apaas-project-update.md`，不改）。

## 固定文字口径（对账轮已锁定；M04-F05-01/P4 行已按 2026-09-07 交付更新，其余行仍有效）

| 明细/需求 | 已交付子集 | 剩余范围 |
|---|---|---|
| M04-F01-03/P34 | ALL/ANY/RATIO 会签结算、独立意见、取消语义 | 原明细完整规则（含一票否决）覆盖待确认，未完成整体核销 |
| M04-F07-01/P35 | 受控条件表达式、条件分支 | 超时处理、自动审批/自动通过规则 |
| M06-F01-01/P37 | 站内信、统一渠道 SPI 及已验收扩展接缝 | 真实厂商渠道、配置开关及账号联调 |
| M06-F02-01/P38 | 可复用通用消息模板与变量渲染 | 按渠道配置内容与变量；沿用 P38，不新编号 |
| M06-F03-01/P39 | 内置审批事件、通知节点触发 | 用户可配置规则、订阅设置 |
| M06-F04-01/P3 | 投递状态持久化、幂等 | 状态查询/管理入口、失败重发、全局日志；不把状态落库写成完全缺失 |
下表为对账轮历史口径的剩余范围行（P37—P3 等仍有效）；M04-F05-01/P4 各行已由 P4 OA 本轮子集（功能状态 COMPLETED 2026-09-07）交付关闭，当前值以本表更新行为准，历史原文不再作为当前待办：
| M04-F05-01/P4：我发起的 | ~~可复用流程监控数据，不能替代个人入口~~ **已交付：专用个人入口「我发起的」（含详情流转记录），强制当前发起人查询** | ——（已关闭，2026-09-07） |
| M04-F05-01/P4：我的待办 | ~~Owner 确认尚未完成~~ **已交付：个人待办入口与处理链路（真实待办动作，经真实审批核心验证）** | ——（已关闭，2026-09-07） |
| M04-F05-01/P4：我的已办 | ~~ASSIGNEE 漏单结构疑点待运行核实~~ **已交付：真实历史过滤（取消/删除/非本人排除）+同办理时间确定性分页，真实引擎/数据源验证** | ——（已关闭，2026-09-07） |
| M04-F05-01/P4：我的草稿 | **已交付：草稿免必填保存、提交校验、0 草稿空态发起入口修复** | ——（已关闭，2026-09-07） |
| M04-F05-01/P4 其他 | 抄送产生已有 P58 交付 | **仍缺：抄送我的查询、催办入口；流程中心分类/双视角**（P4 总项继续开放，与 P55 协同后续） |

## 任务指针

- P59：主方向与终态同步方向均归档 `product/p59-ch-apaas-project-update/passed/`；任务登记 `knowledge/features/p59-ch-apaas-project-update.md`；最终裁决 `receipts/planning-final-review-p59-terminal-sync-02-passed.md`（COMPLETED 规划已确认）
- `knowledge-full-reconciliation`：**COMPLETED（已确认，2026-09-04）**（最终裁决 `receipts/planning-final-review-terminal-sync-02-passed.md`）；三方向均归档 `product/knowledge-full-reconciliation/passed/`；该任务回执与账本（terminal-sync-01、sync-b-01 及 correction 链、full-audit-01、audit-ledger-{a..e} 等）为历史追溯
- 映射索引：`knowledge/feature-reconciliation-index.md`（主索引）+ `feature-reconciliation-issues.md`（54 I 逐项）+ `feature-reconciliation-products.md`（55 目录逐项）；90 明细/56 唯一 P/54 I/55 product 目录双向映射；41 为历史正式功能计数勿混淆
- 必读入口：`knowledge/current-status.md`、`Smart-WorkFlow-Server/功能清单.md`、`knowledge/known-issues.md`、`todo/requirement-pool.md`、本交接
