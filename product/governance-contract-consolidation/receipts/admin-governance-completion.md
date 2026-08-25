# 管理员治理完成回执：治理信息与终态契约单一化

> 执行日期：2026-08-25
> 角色：管理员
> 方向：`product/governance-contract-consolidation/passed/direction-governance-contract-consolidation.md`
> 性质：治理任务，不进入业务功能三阶段状态机，不改变业务状态值。

## 1. 边界冲突与治理裁定

只读盘点发现 `roles/admin.md` 原允许范围未包含 Hook、公共 Validator、治理契约测试及 `current-status` 的结构迁移，与方向 G2/G4/G6 冲突。已先修订唯一权威边界：Governance Implementation 由 Admin 维护；Admin 仅可做治理门禁实现、契约测试和当前/历史物理分离，不因此获得业务源码、业务测试、迁移或业务状态裁决权限。

业务零变更断言：本任务未读取或修改后端/前端业务源码、业务测试、数据库迁移；未运行 Maven、pnpm、数据库或部署命令；功能数 32、清单 ✅29/🟦21/⬜40、正式基线 827 / 100f-988t / V37 均保持原值。

## 2. 现状 → 权威目标 → 动作矩阵

| 现状 | 权威目标 | 已执行动作 |
|---|---|---|
| `memory/` 8 个短文件几乎全为 Planner 无权读取的裸指针 | Planner 可直接恢复与决策的最小摘要 | 写入状态、活动治理任务、唯一下一动作、基线、近期决策、阻塞和硬约束摘要；每份附 2026-08-25 同步点与权威路径 |
| `knowledge/current-status.md` 66,469 bytes 混存大量历史 | 单一最新快照 + 独立追加式历史 | 原全文完整迁移到 `knowledge/history/current-status-through-2026-08-25.md`；新快照 1,735 bytes；`knowledge/history/README.md` 保存原→新映射 |
| 两个 Hook 各自维护宽松 jq 校验 | 单一契约 + 单一公共 Validator | 新增 `.codex/governance/validate-terminal.sh`；两套 Hook 只提取 JSON、调用 Validator、透传诊断 |
| v1 只检查少数字段存在，未知 state 可借空 required 绕过 | 封闭枚举、严格字段/类型/格式/范围/组合校验 | 契约升级为 v2；额外字段拒绝；字符串、数组、对象、整数分别设边界；角色/阶段组合锁定 |
| 工程宪法复制公共角色、终态和信息分层正文 | 核心规则单一权威 | 两端工程宪法相应段落改为短引用；新增 `knowledge/governance-authority-matrix.md` |

## 3. 实际修改文件

- 宪法与权威边界：`system.md`、`roles/admin.md`、`roles/executor.md`、`knowledge/model-registry.md`
- 工程宪法：`Smart-WorkFlow/docs/governance/engineering-constitution.md`、`Smart-WorkFlow-Web/docs/governance/engineering-constitution.md`
- 当前/历史与矩阵：`knowledge/current-status.md`、`knowledge/history/README.md`、`knowledge/history/current-status-through-2026-08-25.md`、`knowledge/governance-authority-matrix.md`
- Planner 摘要：`memory/README.md`、`memory/state.md`、`memory/handoff.md`、`memory/features.md`、`memory/decisions.md`、`memory/issues.md`、`memory/constraints.md`、`memory/architecture.md`
- Governance Implementation：`.codex/governance/terminal-contract.json`、`.codex/governance/validate-terminal.sh`、`.codex/governance/test-terminal-contract.sh`、`.claude/hooks/stop-execution-completeness.sh`、`.codex/hooks/stop-execution-completeness.sh`

## 4. 原路径到新路径映射

| 原路径/内容 | 新路径/归属 |
|---|---|
| `knowledge/current-status.md` 的 2026-08-25 及以前完整旧快照 | `knowledge/history/current-status-through-2026-08-25.md`（66,469 bytes，全文保留） |
| 当前业务状态、计数、基线、活动项、唯一下一动作 | 新 `knowledge/current-status.md`（1,735 bytes，单一快照） |
| 两套 Hook 内部 jq schema/状态分支 | `.codex/governance/terminal-contract.json` + `.codex/governance/validate-terminal.sh` |
| 两端工程宪法的公共角色/终态/信息分层镜像 | `system.md`、`roles/executor.md` 和机器契约；工程宪法只留短引用 |

## 5. memory 尺寸与可用性

迁移前总计 1,842 bytes（内容基本为裸指针）；迁移后总计 3,490 bytes，仍低于 20KB，总目录含 `knowledge/current-status.md` 统计输出为 5,225 bytes。每个文件均低于 5KB。增加的字节只用于 Planner 可直接使用的当前摘要，没有回填历史证据或完整决策正文。

## 6. 治理契约测试与跨 Harness 一致性

执行命令：`sh .codex/governance/test-terminal-contract.sh`

原始摘要：

```text
terminal-contract cases=11 passed=11 failed=0
```

覆盖：三个合法终态、未知/大小写变体状态、缺字段、空白与 null、错类型、负数越界、额外字段、阶段/终态不匹配、角色不匹配。

Claude/Codex 使用同一合法样例结果：退出码均为 0。使用同一非法样例结果：两者均输出相同退出结构和逐字段诊断：

```text
terminal: evidence: must contain at least one item
terminal: receipt: must be non-blank
terminal: state: unknown terminal state
```

静态审计 `rg -n "states\\[|forbidden_states|required.*field|unknown terminal state|allowedFeatureStatus" .claude .codex/hooks` 为 0 命中；两套 Hook 均唯一命中 `validate-terminal.sh` 调用。

## 7. 当前态与重复规则零残留

- `knowledge/current-status.md` 搜索 `此前最近完成|历史条目|后续候选|SUPERSEDED|待规划层最终复验|此前进行中`：0 命中。
- 两端工程宪法搜索旧公共镜像标记 `本文件所在目录.*会话角色|执行任务结束使用|信息分层铁律.*同步条目`：0 命中。
- 历史可追溯：旧状态全文 66,469 bytes 原样位于 `knowledge/history/current-status-through-2026-08-25.md`，映射登记于 `knowledge/history/README.md`。
- `sh -n` 覆盖 Validator、测试脚本及两套 Hook；`jq -e` 覆盖契约和 Hook 配置；均退出码 0。
- `git diff --check`：退出码 0。

## 8. 偏差与说明

文件系统不允许对两个新增治理脚本设置 executable bit（`chmod: Operation not permitted`）；所有入口均明确通过 `sh <script>` 调用，因此不影响运行与跨 Harness 一致性。未执行 Git 提交、推送、历史改写或发布。

## 9. GR-1 当前入口一致性补正

依据 `planning-review-2026-08-25.md`，仅修正以下三个 Planner 当前入口的过期未来时态：

- `memory/state.md`
- `memory/handoff.md`
- `memory/issues.md`

统一后的当前语义为：管理员实施与完成回执已经完成；当前只剩 GR-1 当前入口一致性补正，补正后交用户复核。业务状态、功能数、清单计数、三端基线、P/I 编号及其余已锁定治理成果均未修改；未重跑契约测试或跨 Harness 测试。

对上述三个入口执行审查指定的当前语义查询，四组目标文本均为 0 命中：

```text
管理员正在执行
完成该管理员治理实施与回执
下一动作仅为完成治理回执
待完成项仅为.*管理员实施
```
