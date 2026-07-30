# memory/ — 规划代理压缩上下文

> **Anthropic 只能读此目录、system.md、search_fallback/。**
> DeepSeek 读 knowledge/（完整原材料）并在探索后写入压缩结论到 search_fallback/。
> 最后更新：2026-07-30

## 文件索引

| 文件 | 内容 | 大小 | 何时读 |
|------|------|------|--------|
| [state.md](state.md) | 当前功能/Step/测试基线/模块完成度 | ~1K | **每次启动必读** |
| [handoff.md](handoff.md) | 最新会话交接（已完成/进行中/下一步） | ~2K | **每次启动必读** |
| [features.md](features.md) | 功能索引表（一行一功能，仅状态+当前 Step） | ~3K | 有进行中功能时 |
| [decisions.md](decisions.md) | 最近 10 条活跃设计决策 | ~2K | 按需 |
| [issues.md](issues.md) | 仅未关闭的已知问题 | ~2K | 按需 |
| [constraints.md](constraints.md) | 规划关键硬约束（安全+架构+工作流） | ~2K | 按需 |
| [architecture.md](architecture.md) | 系统架构高层视图 | ~2K | 按需 |

## 阅读建议

1. **启动时**：system.md → memory/README.md → state.md → handoff.md
2. **有进行中功能**：加读 features.md
3. **生成方案前**：加读 constraints.md（回顾红线）
4. **涉及特定模块**：加读 architecture.md + decisions.md

## 什么不在这里（需要 search_task 获取）

- 已完成功能的详细 Step 列表和证据链 → 在 `knowledge/features/*.md`
- D1-D32 早期稳定性架构决策 → 在 `knowledge/decisions.md`
- 已修复问题的完整描述和修复历史 → 在 `knowledge/known-issues.md`
- 完整架构描述、模块文件计数、技术栈详情 → 在 `knowledge/architecture.md`
- 原始 Step 方案和回执文件 → 在 `product/<feature>/passed/` 和 `receipts/`
- 业务代码（后端 Java / 前端 Vue/TS）→ 在 `Smart-WorkFlow/` 和 `Smart-WorkFlow-Web/`

**发现 memory/ 中的信息不足以支撑规划决策时，创建 `search_task/` 委派探索。**
