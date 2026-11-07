# 当前未关闭事项

2026-11-05｜Planner。

0.2.2 已 `COMPLETED`，没有阻塞项。下面是不阻塞的观察项：

- **UAT 磁盘**
  - 0.2.2 发布前磁盘满（可用 0），health DOWN。经 Owner 授权清理了 2026-10-28 及以前的 reasonix 旧会话（3.58 GB）。
  - 换包后可用 2.2G。reasonix 会话仍在增长，下次发布前先复核水位，并评估扩容或会话轮转。
- **UAT 供应商（Owner 侧）**
  - Openrouter 现在是 Anthropic 格式（`https://openrouter.ai/api`），Embedding（D022-09）需要 OpenAI Chat 格式的 `https://openrouter.ai/api/v1` 和 `openai/text-embedding-3-small`。
  - 模型页也要挂上 Chat 和 Embedding 模型。
- **CI 测试抖动（同提交重跑通过，已登记）**
  - `P62CompatRollbackPgTest` 领取竞态；
  - I6G1a/b/c 通知 Boot；
  - `AgentToolConfigServiceImplTest`。


## 0.3.1（2026-11-08）

- **应用包导出缺口（不阻塞验收）**：UAT 0.3.1 导出 `opinionForms` 为空、触发器脚本/Agent 图/IoT 规则不随包；节点意见快照随流程携带。导入后需补建 17 张意见表单与 2 条触发器，否则超时督办/强制校准两条驱动关系失效。已登记 `todo/application-bundle-import-export.md`。
- **UAT 角色配置**：0.3.0 时期 `drill_tech_committee` 仅 1 人、`campus_emergency_lead` 绑张伟，与设计不符；0.3.1 已修正（3 委员 / 王芳）。其它环境导入需按 assets/README 成员口径预置。
- **本地隔离残留**：`smart_workflow_030` 若干旧图/迭代实例保持 RUNNING（Owner 口径保留不删），不参与 UAT 取证。

持续保护：
- 不覆盖 Web `vite.config.ts` 的在途改动；
- 不清库，也不清理 `smart_workflow_f1v4b`；
- 不读取或传播秘密；
- 不动 Owner 的 reasonix、frp、ngrok。
