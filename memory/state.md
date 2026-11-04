# 当前状态摘要

2026-11-03｜Planner｜`READY 1.3.3`。

## 活动交付

0.2.2（Owner 已确认版本号），`PLANNING`。F1 Agent 完善（XL：供应商+模型+graph 统一管理、graph+RAG、改用 LangChain4j、OpenAI Chat/Responses/Anthropic 三格式、单例＋模板装配）先做；F2 应用导入导出（L，同 key 作为新应用导入并重新生成 key）随后。范围草稿 `product/0.2.2/ready/direction-022-scope-draft.md`。第一轮探索已回（`search_fallback/v030-agent-provider-and-app-bundle-seams.md`：现为 Spring AI 1.0.4、无供应商维度、无单例）。真实验证用 Command Code，密钥不落文件。

F1 正式方向 `product/0.2.2/ready/direction-022-f1-agent.md`（XL 三阶段：模型接入基座 → graph 完善 → RAG），决策记录 `product/0.2.2/decision-records-022.md`。两轮探索回执均已读。

F1 阶段 1 **已通过**（第 3 次审查 `product/0.2.2/receipts/planning-review-f1-stage1-03.md`，账本 revision 3 FINISH；Server `12001c4f` / Web `df2200e`）。带入阶段 2：供应商停用的模型在列表与 LLM 节点中需显示为不可用；`RecoveryDrillPostgresTest` 本机跳过，合并阶段 CI 需跑通。

F1 阶段 2 **已通过**（第 3 次审查 `product/0.2.2/receipts/planning-review-f1-stage2-03.md`，账本 revision 6 FINISH；Server `6aa674d9` / Web `10c5f50`）。Owner 已让真实 Key 密文保留在本地验证库 `smart_workflow_f1v4b`。F1 阶段 3 第 1 次审查 `VERIFYING`（`product/0.2.2/receipts/planning-review-f1-stage3-01.md`，账本 revision 7）：租户隔离、删除、检索节点轨迹、门禁通过锁定；剩 G1 真实 Embedding 多文档检索与 RAG、G2 PDF/Word 页面上传、G3 pgvector 维度并存与“先升级后装扩展”部署顺序、G4 空状态文案。Owner 决定 D022-09：真实 Embedding 用 OpenRouter（Key Owner 交执行），UAT pgvector 发布部署时安装。

发布阶段待办：UAT 部署前装 pgvector 并按 G3 顺序升级、回读；`RecoveryDrillPostgresTest` CI 跑通。

唯一下一动作：Executor 按 `product/0.2.2/receipts/planning-execution-prompt-f1-stage3-01.md` 处理，回执 `f1-stage3-2.md`。

0.2.1 已 `COMPLETED`（`product/0.2.1-bugfix/receipts/planning-final-review-021-completed.md`）。

## 已完成基线

0.2.1：台账 B021-001～029 共 29 项 Owner 全部通过（根仓 `eb5fffb9`）；Server tag `0.2.1`→`5c33eab3`、Web→`07568b57`；发布轮 CI 成功，UAT 已就地升级至 0.2.1（health UP、启动 ERROR 0）。开发版本 Server `0.2.1-SNAPSHOT`、Web `0.2.1`。

0.2.0 已完成并发布（Server `39dcedb7` / Web `f5ec5a1`），历史验收锁定。功能数 49、清单 46/22/22＝90、ADV64/问题57、P 编号与正式基线均未变。

## 进度

0.2.2 总 7 阶段：已完成 0，进行中 2（需求评估：F2 待写；执行：F1 阶段 1、2 已过，阶段 3 验收中），未开始 5（验收与同步、合并、发布、发布后同步、结束）。
