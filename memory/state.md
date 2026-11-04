# 当前状态摘要

2026-11-04｜Planner｜`READY 1.3.3`。

## 活动交付

0.2.2（Owner 已确认版本号），`PLANNING`。F1 Agent 完善（XL：供应商+模型+graph 统一管理、graph+RAG、改用 LangChain4j、OpenAI Chat/Responses/Anthropic 三格式、单例＋模板装配）先做；F2 应用导入导出（L，同 key 作为新应用导入并重新生成 key）随后。范围草稿 `product/0.2.2/ready/direction-022-scope-draft.md`。第一轮探索已回（`search_fallback/v030-agent-provider-and-app-bundle-seams.md`：现为 Spring AI 1.0.4、无供应商维度、无单例）。真实验证用 Command Code，密钥不落文件。

F1 正式方向 `product/0.2.2/ready/direction-022-f1-agent.md`（XL 三阶段：模型接入基座 → graph 完善 → RAG），决策记录 `product/0.2.2/decision-records-022.md`。两轮探索回执均已读。

F1 阶段 1 **已通过**（第 3 次审查 `product/0.2.2/receipts/planning-review-f1-stage1-03.md`，账本 revision 3 FINISH；Server `12001c4f` / Web `df2200e`）。带入阶段 2：供应商停用的模型在列表与 LLM 节点中需显示为不可用；`RecoveryDrillPostgresTest` 本机跳过，合并阶段 CI 需跑通。

F1 阶段 2 **已通过**（第 3 次审查 `product/0.2.2/receipts/planning-review-f1-stage2-03.md`，账本 revision 6 FINISH；Server `6aa674d9` / Web `10c5f50`）。Owner 已让真实 Key 密文（Command Code、OpenRouter）保留在本地验证库 `smart_workflow_f1v4b`；UAT 由 Owner 在页面自行录入，不从本地库迁移。

F1 阶段 3 **已通过**（第 2 次审查 `product/0.2.2/receipts/planning-review-f1-stage3-02.md`，账本 revision 8 FINISH；Server `897983e0` / Web `c83a479`）。D022-09：真实 Embedding 用 OpenRouter `openai/text-embedding-3-small`。**F1 三阶段全部完成**，等 F2 完成后一起进入整版验收（按三阶段锁定项回归）。

后续阶段待办：合并阶段 `ApplicationCenterRecoveryDrillPostgresTest` CI 跑通；发布阶段 UAT 先装 pgvector 再升级（顺序反了就装完后重启），按 `f1-stage3-2.md` 第三节的 SQL 回读，装不了由 Owner 决定是否延期 RAG。

F2 应用导入导出正式方向已下发：`product/0.2.2/ready/direction-022-f2-app-bundle.md`（L，决策 D022-10～15）。Owner 2026-11-04 定：跨环境只带定义；外部引用按编码匹配、匹配不上置空并列入报告；审批意见表单 key 冲突逐个提示用户改名（默认随机值，可手改）；导入后全部草稿。分支 `feature/0.2.2-bundle` 从 `feature/0.2.2-agent` 当前提交拉出。

F2 第 2 次审查 `VERIFYING`（`product/0.2.2/receipts/planning-review-f2-02.md`，账本 revision 10；Server `feature/0.2.2-bundle` @ `ba5ee84c` / Web `741f2bc`）。G1～G3 锁定：冲突行内提示；跨环境主路径在独立目标库实测（字典复用与新建、数据源与分类按名称命中、零补配发布）；样例与日志入库。F2 第 3 次审查 `VERIFYING`（`planning-review-f2-03.md`，revision 11；Server `d61dceca` / Web `fd8edf5`）：G4 报告数据锁定（新建字典清单、分类去重、下载文件与 DB 一致）；剩页面侧——顶部“N 字典”只计复用数需改口径，页面报告与预检截图缺失（应用内浏览器截图故障，可改用系统浏览器）。顶部计数是规划上轮漏项，已写自检。

整版验收与同步待办：F1、F2 按锁定项回归；操作手册补应用导入导出说明（含“同名数据源需先给相关用户授权”）。

唯一下一动作：Executor 按 `product/0.2.2/receipts/planning-execution-prompt-f2-03.md` 改顶部字典计数并补两张截图，回执 `f2-04.md`。

0.2.1 已 `COMPLETED`（`product/0.2.1-bugfix/receipts/planning-final-review-021-completed.md`）。

## 已完成基线

0.2.1：台账 B021-001～029 共 29 项 Owner 全部通过（根仓 `eb5fffb9`）；Server tag `0.2.1`→`5c33eab3`、Web→`07568b57`；发布轮 CI 成功，UAT 已就地升级至 0.2.1（health UP、启动 ERROR 0）。开发版本 Server `0.2.1-SNAPSHOT`、Web `0.2.1`。

0.2.0 已完成并发布（Server `39dcedb7` / Web `f5ec5a1`），历史验收锁定。功能数 49、清单 46/22/22＝90、ADV64/问题57、P 编号与正式基线均未变。

## 进度

0.2.2 总 7 阶段：已完成 1（需求评估），进行中 1（执行：F1 已过，F2 剩报告一项），未开始 5（验收与同步、合并、发布、发布后同步、结束）。
