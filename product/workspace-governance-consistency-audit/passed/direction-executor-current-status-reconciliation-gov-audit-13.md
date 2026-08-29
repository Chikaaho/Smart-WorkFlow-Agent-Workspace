# GOV-AUDIT-13 当前状态单值机械同步方向

> 下发角色：规划（Planner）
> 指定执行角色：执行（Executor）
> 方向状态：READY
> 日期：2026-08-29
> 性质：Admin 治理修复后的唯一剩余机械同步；禁止业务实现和重新验证
> 权威输入：`../receipts/planning-review-admin-workspace-governance-remediation-20260829.md`

## 一、目标

仅修正 `knowledge/current-status.md`、knowledge 交接入口与 memory 摘要中的旧“待规划终态复核/旧 ready 路径/旧下一动作”残留，使其与已存在的规划裁决、目录事实和本轮 Admin 修复结果一致，从而关闭 GOV-AUDIT-13。

本任务不重新验收业务或治理，不运行任何测试，不修改任何规则，只机械落实以下唯一值。

## 二、唯一终态值清单

| 字段 | 唯一目标值 |
|---|---|
| `minimal-closure-first-acceptance` | `COMPLETED（已确认，2026-08-29）` |
| 正式已完成功能数 | `36` |
| 功能清单计数 | `✅32 / 🟦25 / ⬜33`（总计 90） |
| P/I 编号 | 不新增、不核销、不改变 |
| 后端正式基线 | `955/0/0/0`，agent `346/0/0/0` |
| 前端正式基线 | `110 files / 1060 tests / 0 skipped`，typecheck/lint/test/build 全绿 |
| 迁移正式基线 | H2 `V44 / 44 migrations`；PostgreSQL `V44 / 43 migrations` |
| README 同步任务 | `COMPLETED（已确认，2026-08-29）`，未提交/未推送 |
| 管理员只读审计 | `COMPLETED（已确认，2026-08-29）`；历史发现 16 项 |
| 管理员治理修复 | `COMPLETED（已确认，2026-08-29）`；Admin 可修项全部关闭 |
| GOV-AUDIT-13 | `COMPLETED`；业务状态、目录和摘要已一致 |
| 当前活动正式功能 | 无 |
| 当前活动治理/管理员任务 | 无 |
| 当前唯一下一动作 | 规划比较并选择下一唯一正式功能 |
| 最小闭环三份方向 | 均位于 `product/minimal-closure-first-acceptance/passed/` |
| 管理员审计方向 | 位于 `product/workspace-governance-consistency-audit/passed/` |
| 管理员治理修复方向 | 位于 `product/workspace-governance-consistency-audit/passed/` |
| 本同步方向 | 执行落值后仍留 `ready/`；规划复核通过后移入 `passed/` |
| memory | 每个短文件 `<5KB`，总量 `<20KB` |

## 三、允许写入文件

仅允许：

- `knowledge/current-status.md`；
- `knowledge/session-handoff.md`；
- 必要的新历史快照及 `knowledge/history/README.md`；
- `memory/state.md`、`memory/handoff.md`、`memory/issues.md`，仅做本清单摘要同步与压缩；
- `product/workspace-governance-consistency-audit/receipts/receipt-executor-current-status-reconciliation-gov-audit-13-20260829.md`。

不得修改功能追踪、功能清单、known-issues、todo、治理文件、业务代码、测试、迁移、README 或其他 product 方向/历史回执。

## 四、必须清理的当前口径残留

在当前状态、当前交接、当前活动、下一动作和新会话提示中，以下内容必须为零残留：

- `COMPLETED（待规划终态复核）`；
- `ready/direction-minimal-closure-first-acceptance-terminal-sync.md`；
- `规划复核本终态同步方向`；
- `最小闭环终态同步待复核`；
- `当前管理员修复待执行/待验收`；
- `治理现状仍有 12 HIGH / 4 MEDIUM 未修复` 作为当前口径。

历史快照和带日期的审计历史可以保留，但必须明确标注为历史，不得出现在当前唯一状态或下一动作中。

## 五、执行与验证边界

- 先写 knowledge 完整当前状态与交接，再按相同值压缩 memory；
- 不运行 Maven、pnpm、npm、Node、Java、数据库、服务、浏览器或治理测试；
- 不修改治理规则或重新检查 Admin 已锁定项；
- 不提交、不推送、不发布，不清理工作区；
- 使用只读全文检索、目录存在性和字节数检查验证同步结果；
- 正式功能数、清单、P/I、测试和迁移基线必须逐字保持清单值，不得重新计算或推断。

## 六、回执要求

回执必须包含：

1. 实际写入文件；
2. 每个清单字段的修改前值、目标值、实际值；
3. knowledge-first 写入顺序证明；
4. 当前区旧残留检索命令与零残留结果；
5. 三份最小闭环方向、Admin 审计/修复方向及本同步方向的目录事实；
6. memory 压缩前后每文件和总字节数；
7. 未运行测试、未修改治理/业务文件、未提交推送的范围证明；
8. 物理末行唯一合法 `SWF_TERMINAL`，state=`TERMINAL_SYNC_SUBMITTED`、feature_status=`COMPLETED`，包含合法 `memory_compression` 并通过公共 Validator。

回执路径：

`product/workspace-governance-consistency-audit/receipts/receipt-executor-current-status-reconciliation-gov-audit-13-20260829.md`

任一字段无法逐字落实时必须如实 `BLOCKED`，不得修改规划单值或重开已锁定的 Admin 修复。

