# 终态入口补丁回执 · terminal-sync-01-correction-01（T1/T2/T3）

> 功能：知识库全量整理与同步（knowledge-full-reconciliation，L 级）
> 角色：Executor；日期：2026-09-04；状态：**COMPLETED（待 Planner 终态复核）**，不得称已确认
> 依据：`product/knowledge-full-reconciliation/receipts/planning-execution-prompt-knowledge-full-reconciliation-06.md`（终态入口补充提示 06，唯一补证入口）；前置 `planning-review-terminal-sync-01.md`（终态复核首轮：T1/T2/T3 引用错误）
> 范围：仅三处当前文字；不滚动其他入口编号；未改业务代码/治理/Git/工程命令/方向/业务计数；旧文件只读；阶段三方向唯一值仍有效。

## 三原子修正（固定前态=evidence-terminal-sync-01/final 三副本）

### T1：current-status L21 最近审查 —— 移除不存在的 06-passed 悬空引用

| 项 | 内容 |
|---|---|
| 修正前 | `planning-review-sync-b-07-passed.md`（整体 PASSED）\| `planning-review-sync-b-06-passed.md`（复核 06：B2a-r2 两处文字修正 PASSED）\| P58 最终复核（历史） |
| 修正后 | `planning-review-sync-b-07-passed.md`（B 阶段整体 PASSED，终态同步方向下发）\| `planning-review-terminal-sync-01.md`（终态复核首轮：引用错误待补证）\| P58 最终复核（历史） |
| 路径存在性 | `planning-review-sync-b-07-passed.md` **存在** ✓；`planning-review-terminal-sync-01.md` **存在** ✓；`planning-review-sync-b-06-passed.md` **不存在**（实际文件为 `planning-review-sync-b-06.md`，该轮未单独通过，由 07 整体验收；引用已移除，未新建空壳、未改写历史裁决） |
| diff | final/diffs/diff-current-status.txt（exit=1，11 行） |

### T2：Server 功能清单当前焦点 —— 不再把 sync-b-01 作为当前待复核

| 项 | 内容 |
|---|---|
| 修正前 | 「唯一下一动作：Planner 复核 knowledge-full-reconciliation B 阶段同步回执（`product/knowledge-full-reconciliation/receipts/sync-b-01.md`）」 |
| 修正后 | 「唯一下一动作：Planner 复核 knowledge-full-reconciliation 终态（当前唯一下一动作见 `knowledge/current-status.md`「当前唯一下一动作」）」 |
| diff | final/diffs/diff-server-checklist.txt（exit=1，11 行） |
| 边界 | 该段其余内容（任务 COMPLETED 待终态复核、41、34/28/28、五行、基线、P47 历史标注）零变化 |

### T3：索引 L202 —— 移除「本 B 方向为当前唯一执行入口」

| 项 | 内容 |
|---|---|
| 修正前 | 「…本 B 方向为当前唯一执行入口，历史文件不删除」 |
| 修正后 | 「…本任务当前执行入口见 `knowledge/current-status.md`「当前唯一下一动作」（阶段三方向 `ready/direction-knowledge-full-reconciliation-terminal-sync.md`），B 阶段同步方向已归档 `passed/` 属历史，历史文件不删除」 |
| diff | final/diffs/diff-index.txt（exit=1，11 行） |

## 提交门（提示 §范围顺序，按实际输出）

| 检查 | 实际 |
|---|---|
| 三个正向条件成立 | T1 ✓（真实 07 + 终态复核 01）；T2 ✓（指向 current-status 现入口）；T3 ✓（指向 current-status/阶段三方向） |
| 旧错误引用零残留 | grep「06-passed」「sync-b-01.md（当前待复核）」「本 B 方向为当前唯一执行入口」三文件均 0 命中 |
| diff 只改授权三段 | 三份 diff exit=1 各 11 行，仅对应单行替换 |
| 源/副本一致 | 三文件源/副本哈希逐一相同（见 source-hashes.txt） |
| 清单 missing/extra/duplicate=0 且全部回读 OK | final-paths-diff exit=0；回读 N/N OK（数字取实际输出）；日志包外 |

## 证据包（`evidence-terminal-sync-01-correction-01/final/`）

- diffs/ 三份真实 diff（前态=evidence-terminal-sync-01/final 副本，哈希匹配）；三文件当前全文副本；source-hashes.txt（前/现哈希）；回执副本。
- 唯一 SHA256SUMS 一次生成；载荷/清单双向 diff exit=0；`shasum -a 256 -c` 回读成功数=载荷数、失败 0（校验日志在包外）。

## 自验结论

T1/T2/T3 三处引用错误全部修正：06-passed 悬空引用移除（改引真实 07 + 终态复核 01，路径存在性验证）、Server 清单下一动作不再把 sync-b-01 当当前待复核、索引不再自称 B 方向为当前唯一执行入口；三份真实 diff 仅授权三段、旧引用残留 0、源/副本一致、包校验通过。任务保持 **COMPLETED（待 Planner 终态复核）**，未称已确认。**自验通过，待规划终态复核。**

附件：`receipts/evidence-terminal-sync-01-correction-01/`（final/ 载荷 + 日志包外）。