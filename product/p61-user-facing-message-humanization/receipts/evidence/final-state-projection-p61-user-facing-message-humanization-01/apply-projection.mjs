import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.argv[2]
const edits = [
  [
    "knowledge/current-status.md",
    "COMPLETED（待规划确认，2026-09-20）**：功能级验收 `product/p61-user-facing-message-humanization/receipts/planning-review-p61-scope-corrected-completion-03-passed.md`",
    "COMPLETED（规划已确认，2026-09-20）**：功能级验收 `product/p61-user-facing-message-humanization/receipts/planning-review-p61-scope-corrected-completion-03-passed.md`"
  ],
  [
    "knowledge/current-status.md",
    "terminal-sync-p61-user-facing-message-humanization-01.md` 已提交（`TERMINAL_SYNC_SUBMITTED`，待 Planner 全文复核）；主方向与范围纠偏方向已归档",
    "terminal-sync-p61-user-facing-message-humanization-01.md` 已提交（`TERMINAL_SYNC_SUBMITTED`）并已由最终复核 01 `planning-final-review-terminal-sync-p61-user-facing-message-humanization-01-passed.md` **PASSED** 确认；三份方向（原方向、范围纠偏、阶段三）均已归档"
  ],
  [
    "knowledge/current-status.md",
    "；P61 已核销（待规划确认），不增加业务功能数；当前活动功能=P53",
    "；P61 已核销，不增加业务功能数；集成顺序=独立提交先保留（Server `742adb8`、Web `d110ed8`），待 P53 结束后统一合并；当前活动功能=P53"
  ],
  [
    "knowledge/current-status.md",
    "**P61 已核销（待规划确认，2026-09-20）**；",
    "**P61 已核销（规划已确认，2026-09-20）**；"
  ],
  [
    "knowledge/current-status.md",
    "| 变更类型记录（历史事件，非当前值） | 2026-09-20 P61 阶段三终态同步（本回执",
    "| 变更类型记录（历史事件，非当前值） | 2026-09-20 P53/P61 集成顺序记录（`product/p53-global-ui-component-layout/receipts/planning-integration-order-p61-before-p53-merge-20260920.md`）：Owner 裁决 P61 独立提交先保留、暂不合并，P53 结束后统一合并；合并必须同时保留 P53 结构/新增键与 P61 八值 8/8，两 locale 文件冲突按此完成条件处理；该安排只决定 Git 集成顺序，不改变 P61 `COMPLETED（规划已确认，2026-09-20）` 与 P53 `VERIFYING`；本轮未执行合并、推送或远端动作。2026-09-20 P61 阶段三最终复核确认（`product/p61-user-facing-message-humanization/receipts/planning-final-review-terminal-sync-p61-user-facing-message-humanization-01-passed.md` **PASSED**，九项复核全通过）：P61 由 `COMPLETED（待规划确认）` 确认为 `COMPLETED（规划已确认，2026-09-20）` 并正式核销，终态同步方向由 Planner 归档至 `passed/`；功能数 44、90 明细 ✅46/🟦22/⬜22、ADV64 与开放 P 编号零变化。2026-09-20 P61 阶段三终态同步（本回执"
  ],
  [
    "knowledge/current-status.md",
    "**P61 `p61-user-facing-message-humanization`：`COMPLETED（待规划确认，2026-09-20）`，已核销（待规划确认），不再列为活动功能**",
    "**P61 `p61-user-facing-message-humanization`：`COMPLETED（规划已确认，2026-09-20）`，已核销，不再列为活动功能；独立提交 Server `742adb8` / Web `d110ed8` 先保留，P53 结束后统一合并**"
  ],
  [
    "knowledge/current-status.md",
    "P61 阶段三终态同步（方向 `product/p61-user-facing-message-humanization/ready/direction-p61-user-facing-message-humanization-terminal-sync.md`；回执 `product/p61-user-facing-message-humanization/receipts/terminal-sync-p61-user-facing-message-humanization-01.md`，机器 `TERMINAL_SYNC_SUBMITTED`，待 Planner 全文复核后归档）",
    "P61 阶段三终态同步已确认（回执 `product/p61-user-facing-message-humanization/receipts/terminal-sync-p61-user-facing-message-humanization-01.md`，机器 `TERMINAL_SYNC_SUBMITTED`；最终复核 01 PASSED，三份方向均归档 `passed/`）"
  ],
  [
    "knowledge/current-status.md",
    "| 最近审查 | `product/p61-user-facing-message-humanization/receipts/planning-review-p61-scope-corrected-completion-03-passed.md`",
    "| 最近审查 | `product/p61-user-facing-message-humanization/receipts/planning-final-review-terminal-sync-p61-user-facing-message-humanization-01-passed.md`（P61 阶段三终态同步最终复核 01 **PASSED**，P61 正式确认 `COMPLETED（规划已确认，2026-09-20）` 并核销，九项复核全通过，2026-09-20）\\| `product/p53-global-ui-component-layout/receipts/planning-integration-order-p61-before-p53-merge-20260920.md`（P53/P61 最终集成顺序记录：P61 独立提交先保留、P53 结束后统一合并，2026-09-20）\\| `product/p61-user-facing-message-humanization/receipts/planning-review-p61-scope-corrected-completion-03-passed.md`"
  ],
  [
    "knowledge/current-status.md",
    "- `p61-user-facing-message-humanization`（P61 全系统用户可见错误码与提示语人性化治理，L）：功能级验收 **PASSED（2026-09-20）**，功能状态 **COMPLETED（待规划确认，2026-09-20）**，已核销（待规划确认）；主方向与 2026-09-20 范围纠偏方向均已归档 `product/p61-user-facing-message-humanization/passed/`；阶段三终态同步方向仍在 `product/p61-user-facing-message-humanization/ready/direction-p61-user-facing-message-humanization-terminal-sync.md`，由 Planner 最终复核后归档；不增加业务功能数，不映射 90 明细。任务登记：`knowledge/features/p61-user-facing-message-humanization.md`。",
    "- `p61-user-facing-message-humanization`（P61 全系统用户可见错误码与提示语人性化治理，L）：功能级验收 **PASSED（2026-09-20）**，功能状态 **COMPLETED（规划已确认，2026-09-20）**，已核销（最终复核 01 PASSED）；主方向、2026-09-20 范围纠偏方向与阶段三终态同步方向均已归档 `product/p61-user-facing-message-humanization/passed/`；集成顺序=独立提交先保留（Server `742adb8`、Web `d110ed8`），待 P53 结束后统一合并（记录 `product/p53-global-ui-component-layout/receipts/planning-integration-order-p61-before-p53-merge-20260920.md`）；不增加业务功能数，不映射 90 明细。任务登记：`knowledge/features/p61-user-facing-message-humanization.md`。"
  ],
  [
    "knowledge/current-status.md",
    "P61 已功能级 `PASSED`（2026-09-20）、写为 `COMPLETED（待规划确认，2026-09-20）` 并已核销（待规划确认）；阶段三终态同步回执 `product/p61-user-facing-message-humanization/receipts/terminal-sync-p61-user-facing-message-humanization-01.md`（`TERMINAL_SYNC_SUBMITTED`）待 Planner 全文复核，归档前 P61 不再列为活动功能。",
    "P61 已功能级 `PASSED`（2026-09-20）、最终确认 `COMPLETED（规划已确认，2026-09-20）` 并核销，三份方向均已归档 `passed/`（最终复核 01 PASSED）；独立提交先保留、待 P53 结束后统一合并。"
  ],
  [
    "knowledge/current-status.md",
    "；P61 任务登记 `knowledge/features/p61-user-facing-message-humanization.md`、阶段三入口 `product/p61-user-facing-message-humanization/ready/direction-p61-user-facing-message-humanization-terminal-sync.md`（待 Planner 归档）；P53 当前入口",
    "；P61 三份方向均已归档 `product/p61-user-facing-message-humanization/passed/`，任务登记 `knowledge/features/p61-user-facing-message-humanization.md`，集成顺序记录 `product/p53-global-ui-component-layout/receipts/planning-integration-order-p61-before-p53-merge-20260920.md`；P53 当前入口"
  ],
  [
    "knowledge/current-status.md",
    "把 P61 `COMPLETED（待规划确认，2026-09-20）`、功能级 `PASSED（2026-09-20）`、已核销（待规划确认）与 P61 治理验证基线集合",
    "把 P61 `COMPLETED（规划已确认，2026-09-20）`（最终复核 01 PASSED）、功能级 `PASSED（2026-09-20）`、已核销与 P61 治理验证基线集合"
  ],
  [
    "knowledge/current-status.md",
    "P61（全系统用户可见错误码与提示语人性化治理）已功能级 `PASSED`（2026-09-20）、写为 `COMPLETED（待规划确认，2026-09-20）` 并已核销（待规划确认），不属于未完成边界；当前主任务 P53 `VERIFYING`；",
    "P61（全系统用户可见错误码与提示语人性化治理）已最终确认 `COMPLETED（规划已确认，2026-09-20）` 并核销，不属于未完成边界（独立提交待 P53 结束后统一合并）；当前主任务 P53 `VERIFYING`；"
  ],
  [
    "knowledge/session-handoff.md",
    "并写为 `COMPLETED（待规划确认，2026-09-20）`、已核销（待规划确认），阶段三终态同步回执已提交（`TERMINAL_SYNC_SUBMITTED`，待 Planner 全文复核）**。",
    "并已最终确认 `COMPLETED（规划已确认，2026-09-20）` 并核销，三份方向均归档 `passed/`；独立提交 Server `742adb8` / Web `d110ed8` 先保留，待 P53 结束后统一合并**。"
  ],
  [
    "knowledge/session-handoff.md",
    "**P61 已核销（待规划确认，2026-09-20）**；",
    "**P61 已核销（规划已确认，2026-09-20）**；"
  ],
  [
    "knowledge/session-handoff.md",
    "| 活动业务实现功能 | **P53 全局 UI 与组件布局优化（XL，P0，`VERIFYING`，唯一入口提示07）**；**P61 阶段三终态同步进行中**（回执 `product/p61-user-facing-message-humanization/receipts/terminal-sync-p61-user-facing-message-humanization-01.md` 已提交，待 Planner 全文复核；P61 不再列为活动功能） |",
    "| 活动业务实现功能 | **P53 全局 UI 与组件布局优化（XL，P0，`VERIFYING`，唯一入口提示07）**；**P61 已最终确认 `COMPLETED（规划已确认，2026-09-20）` 并核销**（三份方向归档 `passed/`；独立提交先保留，待 P53 结束后统一合并；P61 不再列为活动功能） |"
  ],
  [
    "knowledge/session-handoff.md",
    "- p61-user-facing-message-humanization（P61）：功能级 **`PASSED`（2026-09-20）**，功能状态 **`COMPLETED（待规划确认，2026-09-20）`**，已核销（待规划确认）；阶段三终态同步回执 `product/p61-user-facing-message-humanization/receipts/terminal-sync-p61-user-facing-message-humanization-01.md`（`TERMINAL_SYNC_SUBMITTED`）待 Planner 全文复核；主方向与范围纠偏方向归档 `product/p61-user-facing-message-humanization/passed/`，阶段三方向仍在 `ready/` 待 Planner 归档；任务登记 `knowledge/features/p61-user-facing-message-humanization.md`。",
    "- p61-user-facing-message-humanization（P61）：功能级 **`PASSED`（2026-09-20）**，功能状态 **`COMPLETED（规划已确认，2026-09-20）`**，已核销；最终复核 `planning-final-review-terminal-sync-p61-user-facing-message-humanization-01-passed.md` **PASSED**，阶段三终态同步回执 `receipts/terminal-sync-p61-user-facing-message-humanization-01.md`（`TERMINAL_SYNC_SUBMITTED`）；三份方向均归档 `product/p61-user-facing-message-humanization/passed/`；集成顺序=独立提交 Server `742adb8` / Web `d110ed8` 先保留，待 P53 结束后统一合并（记录 `product/p53-global-ui-component-layout/receipts/planning-integration-order-p61-before-p53-merge-20260920.md`）；任务登记 `knowledge/features/p61-user-facing-message-humanization.md`。"
  ],
  [
    "knowledge/features/p61-user-facing-message-humanization.md",
    "| 当前状态 | **COMPLETED（待规划确认，2026-09-20）**（功能级验收 PASSED，2026-09-20；已核销（待规划确认）；阶段三终态同步回执已提交，待 Planner 全文复核） |",
    "| 当前状态 | **COMPLETED（规划已确认，2026-09-20）**（功能级验收 PASSED，2026-09-20；正式核销；阶段三终态同步回执经最终复核 01 PASSED 确认） |"
  ],
  [
    "knowledge/features/p61-user-facing-message-humanization.md",
    "| 阶段三终态同步方向（待 Planner 归档） | `product/p61-user-facing-message-humanization/ready/direction-p61-user-facing-message-humanization-terminal-sync.md` |",
    "| 阶段三终态同步方向（已归档） | `product/p61-user-facing-message-humanization/passed/direction-p61-user-facing-message-humanization-terminal-sync.md` |\n| 阶段三最终复核 | `product/p61-user-facing-message-humanization/receipts/planning-final-review-terminal-sync-p61-user-facing-message-humanization-01-passed.md`（**PASSED**，`COMPLETED（规划已确认，2026-09-20）`） |\n| 集成顺序记录 | `product/p53-global-ui-component-layout/receipts/planning-integration-order-p61-before-p53-merge-20260920.md`（P61 独立提交 Server `742adb8` / Web `d110ed8` 先保留；P53 结束后统一合并；locale 冲突须同时保留 P53 结构/新增键与 P61 八值 8/8） |"
  ],
  [
    "knowledge/features/p61-user-facing-message-humanization.md",
    "- 功能状态：**COMPLETED（待规划确认，2026-09-20）**。",
    "- 功能状态：**COMPLETED（规划已确认，2026-09-20）**（已核销）。"
  ],
  [
    "knowledge/features/p61-user-facing-message-humanization.md",
    "- 需求编号：**P61 已核销（待规划确认）**；",
    "- 需求编号：**P61 已核销**；"
  ],
  [
    "knowledge/features/p61-user-facing-message-humanization.md",
    "- 终态同步：回执 `receipts/terminal-sync-p61-user-facing-message-humanization-01.md`（`TERMINAL_SYNC_SUBMITTED`）；`COMPLETED（规划已确认）` 只由 Planner 最终复核确认。",
    "- 终态同步：回执 `receipts/terminal-sync-p61-user-facing-message-humanization-01.md`（`TERMINAL_SYNC_SUBMITTED`）已经最终复核 01 PASSED 确认；三份方向均归档 `passed/`。\n- 集成顺序：P61 独立提交（Server `742adb8`、Web `d110ed8`）先保留、暂不合并；P53 结束后统一合并，locale 冲突按「P53 结构与新增键全部保留 + P61 八值 8/8 保留」处理。"
  ],
  [
    "knowledge/feature-reconciliation-index.md",
    "非新增业务功能、不映射 90 明细；功能级 `PASSED`（2026-09-20），写为 `COMPLETED（待规划确认，2026-09-20）`，已核销（待规划确认）；主方向与范围纠偏方向归档 `product/p61-user-facing-message-humanization/passed/`，阶段三终态同步回执 `product/p61-user-facing-message-humanization/receipts/terminal-sync-p61-user-facing-message-humanization-01.md` 待规划复核）",
    "非新增业务功能、不映射 90 明细；功能级 `PASSED`（2026-09-20），最终确认 `COMPLETED（规划已确认，2026-09-20）` 并正式核销；三份方向均归档 `product/p61-user-facing-message-humanization/passed/`，阶段三终态同步回执 `product/p61-user-facing-message-humanization/receipts/terminal-sync-p61-user-facing-message-humanization-01.md` 经最终复核 01 PASSED 确认；独立提交 Server `742adb8` / Web `d110ed8` 先保留，待 P53 结束后统一合并）"
  ],
  [
    "knowledge/feature-reconciliation-index.md",
    "`knowledge/features/p61-user-facing-message-humanization.md`（P61 全系统用户可见错误码与提示语人性化治理，`COMPLETED（待规划确认，2026-09-20）`，已核销（待规划确认））",
    "`knowledge/features/p61-user-facing-message-humanization.md`（P61 全系统用户可见错误码与提示语人性化治理，`COMPLETED（规划已确认，2026-09-20）`，已核销）"
  ],
  [
    "todo/requirement-pool.md",
    "禁止中间回执/`WAIT_PLANNER`或以难度包装阻塞。P61在P53通过后恢复。",
    "禁止中间回执/`WAIT_PLANNER`或以难度包装阻塞。P61 已 `COMPLETED（规划已确认，2026-09-20）` 并核销，独立提交先保留、待 P53 结束后统一合并。"
  ],
  [
    "product/p61-user-facing-message-humanization/passed/direction-p61-user-facing-message-humanization-terminal-sync.md",
    "> 本轮回执：`receipts/terminal-sync-p61-user-facing-message-humanization-01.md`（`TERMINAL_SYNC_SUBMITTED`）",
    "> 本轮回执：`receipts/terminal-sync-p61-user-facing-message-humanization-01.md`（`TERMINAL_SYNC_SUBMITTED`）  \n> 最终确认：`COMPLETED（规划已确认，2026-09-20）`——规划最终复核 01 `receipts/planning-final-review-terminal-sync-p61-user-facing-message-humanization-01-passed.md` **PASSED**；本方向已由 Planner 归档至 `passed/`；集成顺序见 `product/p53-global-ui-component-layout/receipts/planning-integration-order-p61-before-p53-merge-20260920.md`（独立提交先保留，P53 结束后统一合并）"
  ]
]
const log = []
let failed = 0
for (const [file, find, replace] of edits) {
  const path = join(ROOT, file)
  const content = readFileSync(path, 'utf8')
  const occurrences = content.split(find).length - 1
  if (occurrences !== 1) { failed++; log.push({ file, status: 'ANCHOR_ERROR', occurrences, find: find.slice(0, 60) }); continue }
  writeFileSync(path, content.replace(find, replace))
  log.push({ file, status: 'REPLACED' })
}
writeFileSync(join(ROOT, 'product/p61-user-facing-message-humanization/receipts/evidence/final-state-projection-p61-user-facing-message-humanization-01/apply-log.json'), JSON.stringify({ edits: log, replaced: log.filter(l => l.status === 'REPLACED').length, failed }, null, 2))
console.log(JSON.stringify({ replaced: log.filter(l => l.status === 'REPLACED').length, failed }))
if (failed) { for (const l of log.filter(x => x.status !== 'REPLACED')) console.log(JSON.stringify(l)) }
process.exit(failed === 0 ? 0 : 1)

