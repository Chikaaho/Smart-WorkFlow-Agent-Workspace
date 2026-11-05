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

持续保护：
- 不覆盖 Web `vite.config.ts` 的在途改动；
- 不清库，也不清理 `smart_workflow_f1v4b`；
- 不读取或传播秘密；
- 不动 Owner 的 reasonix、frp、ngrok。
