# 探索任务回执：decisions 注册表归属注记（D84 裁定落地）

- **任务来源**：`search_task/decisions-registry-note.md`（规划层派发，2026-08-16）
- **执行日期**：2026-08-16
- **执行方式**：1 个 Sub Agent 执行 + 汇总层核实落盘；纯静态读码+文档编辑，未执行任何编译/测试命令
- **核对声明**：3 项全部完成；knowledge/decisions.md 的 D1-D46 索引与详情正文**零改动**（仅顶部注记 1 行）；未改 memory/、todo/、两端代码
- **结论摘要**：decisions.md 顶部注记已加；唯一 decisions 指向索引（根 README.md）已同步；I3/I18/I30/I49-I51 只读核对无冲突；附带发现 I18 状态时差 1 项（待规划层纳入下次同步）

---

## 逐项落库摘要

### ① knowledge/decisions.md 顶部注记 ✅

| 位置 | 改前 → 改后 |
|------|------|
| 标题/说明块之后、`## 决策索引` 之前（原第 9 行 `---` 上方） | 无 → 新增「> **注记（2026-08-16 D84 裁定）**：D47+ 决策见 `memory/decisions.md`（活跃权威，D84 裁定）+ `product/*/passed/` + `receipts/` 归档；本文件为 D1-D46 历史详情档案」 |

### ② decisions 指向索引同步 ✅

- `knowledge/` 下**无 README.md**（第 2 项任务书失败处理路径触发）；检查 current-status.md §11 参考索引（仅 zip 来源文档）、development-workflow.md、shared-constraints.md、architecture.md、model-registry.md 均无 decisions 注册表指向说明
- 唯一指向说明位于**根 `README.md`** 目录结构树 knowledge/ 段（原第 56 行），已同步：

| 文件 | 位置 | 改前 → 改后 |
|------|------|------|
| `README.md` | 目录结构树 knowledge/ 段 decisions.md 行 | 「decisions.md — 全部设计决策（D1-D46）」→「decisions.md — 决策档案（D1-D46 历史详情；D47+ 活跃决策见 memory/decisions.md）」 |

- memory/README.md 与 knowledge/session-handoff.md 中已有指向（memory=活跃权威）与归属表述天然一致，未改

### ③ 只读核对（I3/I18/I30/I49-I51）✅

| 编号 | 核对结论 |
|------|------|
| I3 | 部分修复状态与注记无冲突（文中引用 D35/D39/D40 均属 D1-D46 区间，与「本文件为历史档案」一致） |
| I18 | 状态「待规划层裁定关闭」与任务描述一致，与注记无冲突（注记只管决策归属不管问题状态） |
| I30 | ✅ 已满足可关闭（D83 复核证据 handlers.ts L738-769）与注记无冲突 |
| I49/I50/I51 | 待修复（D83 登记）与注记无冲突；D83 属 D47+ 活跃决策（权威在 memory/decisions.md），归属一致 |

---

## 附带发现（非冲突，待规划层处理）

**I18 状态时差**：memory/decisions.md D84 已裁定「I18 关闭」（前提消失），但 knowledge/known-issues.md I18 仍写「待规划层裁定关闭」——注册表侧未同步为「已关闭」。本任务硬约束禁止改动 known-issues.md，建议纳入下次执行层触碰时的同步项（与 knowledge-sync-apply 回执「未确认事项 5」同源）。

## 触碰文件清单

| 文件 | 操作 |
|------|------|
| `knowledge/decisions.md` | 修改（顶部注记 1 行；D1-D46 正文零改动） |
| `README.md` | 修改（索引 1 行） |
| `search_fallback/decisions-registry-note.md` | 新建（本回执，汇总层落盘） |

未触碰：memory/、todo/、两端代码、knowledge/known-issues.md（只读核对）、knowledge/decisions.md 的 D1-D46 内容。

## 未确认事项

1. I18 注册表关闭同步（见上「附带发现」）。
2. knowledge/ 目录级无 README/说明区，「knowledge=完整权威」一句话表述已由 rule-sync-d85 的 shared-constraints §10 与 development-workflow §6.3 承载；若规划层仍希望目录级落一句，候选位置为根 README.md 目录结构区（超出本任务范围，未改）。
