import { readFileSync, writeFileSync, statSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = process.argv[2]
const edits = [
  [
    "knowledge/current-status.md",
    "唯一当前快照；截至/同步点：2026-09-15，P60 ",
    "唯一当前快照；截至/同步点：2026-09-20。**P61 `p61-user-facing-message-humanization`（全系统用户可见错误码与提示语人性化治理；L，P1）COMPLETED（待规划确认，2026-09-20）**：功能级验收 `product/p61-user-facing-message-humanization/receipts/planning-review-p61-scope-corrected-completion-03-passed.md` **PASSED**（2026-09-20，范围纠偏后六项标准全部通过）；阶段三终态同步回执 `product/p61-user-facing-message-humanization/receipts/terminal-sync-p61-user-facing-message-humanization-01.md` 已提交（`TERMINAL_SYNC_SUBMITTED`，待 Planner 全文复核）；主方向与范围纠偏方向已归档 `product/p61-user-facing-message-humanization/passed/`；P61 已核销（待规划确认），不增加业务功能数；当前活动功能=P53 `p53-global-ui-component-layout`（XL，P0，`VERIFYING`，唯一入口 `product/p53-global-ui-component-layout/receipts/planning-execution-prompt-p53-global-ui-component-layout-07.md`）。P60 "
  ],
  [
    "knowledge/current-status.md",
    "| 验证基线变更集合 | Server/Web/Flyway/产品行为四组（见上）；0.1.0 最终值为 Server 1362/0/0/0、Web 1185+3、迁移终点 V93；",
    "| 验证基线变更集合 | Server/Web/Flyway/产品行为四组（见上）；0.1.0 最终值为 Server 1362/0/0/0、Web 1185+3、迁移终点 V93；P61 治理验证基线集合（2026-09-20，只证明 P61，不构成 P53 视觉或功能通过）：Server **1423 tests / 0 failures / 0 errors / 0 skipped**（BUILD SUCCESS、exit 0，含新增 `BilingualMessageContractTest`）、Web typecheck/lint/test/build 四门 exit 0（**1217 passed + 3 skipped**）、真实 HTTP 22/22、契约/运行测试 9/9、8/8、8/8、集成 locale 八值 8/8 逐字匹配（`allMatch=true`）；"
  ],
  [
    "knowledge/current-status.md",
    "| P 编号 | **P21 已核销/完成（2026-09-08）**；",
    "| P 编号 | **P21 已核销/完成（2026-09-08）**；**P61 已核销（待规划确认，2026-09-20）**；"
  ],
  [
    "knowledge/current-status.md",
    "| 变更类型记录（历史事件，非当前值） | 2026-09-15 仓库健康与推送",
    "| 变更类型记录（历史事件，非当前值） | 2026-09-20 P61 阶段三终态同步（本回执 `product/p61-user-facing-message-humanization/receipts/terminal-sync-p61-user-facing-message-humanization-01.md`）：按 `ready/direction-p61-user-facing-message-humanization-terminal-sync.md` 的唯一终态值清单，把 P61 机械写为 `COMPLETED（待规划确认，2026-09-20）`、功能级验收锁定为 `PASSED（2026-09-20）`、P61 已核销（待规划确认），并把 P61 治理验证基线集合（Server 1423/0/0/0、Web 1217+3）登记为只证明 P61 的证据；功能数 44、90 明细 ✅46/🟦22/⬜22、ADV64 与其余开放 P 编号零变化；P61 主方向与范围纠偏方向保持 `passed/`，阶段三方向仍在 `ready/` 待 Planner 归档；未运行工程构建/测试/迁移、未执行浏览器验收、未改业务代码、未 commit/push/tag/Release。2026-09-20 P61 功能级 PASSED（`product/p61-user-facing-message-humanization/receipts/planning-review-p61-scope-corrected-completion-03-passed.md`）：按 2026-09-20 范围纠偏六项标准全部通过，C1（154 目录键）、C3（Web 1217+3）锁定，C2-V 集成 locale 八值逐字一致（8/8、missing/duplicate=0、exit 0）。2026-09-15 仓库健康与推送"
  ],
  [
    "knowledge/current-status.md",
    "| 当前活动正式功能 | `v0.1.0-oa-completion`（P60，XL）：**COMPLETED（待规划确认，2026-09-15）**；I1—I6 均 COMPLETED（规划已确认），整体 14/14；终态同步已由最终复核 01 PASSED 确认 |",
    "| 当前活动正式功能 | `p53-global-ui-component-layout`（P53 全局 UI 与组件布局优化，XL，P0）：**`VERIFYING`**，唯一实现入口 `product/p53-global-ui-component-layout/receipts/planning-execution-prompt-p53-global-ui-component-layout-07.md`；`v0.1.0-oa-completion`（P60，XL）：**COMPLETED（规划已确认，2026-09-15）**（I1—I6 均 COMPLETED（规划已确认），整体 14/14，终态同步已由最终复核 01 PASSED 确认）；**P61 `p61-user-facing-message-humanization`：`COMPLETED（待规划确认，2026-09-20）`，已核销（待规划确认），不再列为活动功能** |"
  ],
  [
    "knowledge/current-status.md",
    "| 当前活动交付任务 | P60 整体终态同步（方向 `product/v0.1.0-oa-completion/ready/direction-v0.1.0-oa-completion-terminal-sync.md`；回执 `product/v0.1.0-oa-completion/receipts/terminal-sync-v0.1.0-oa-completion-01.md`，机器 `TERMINAL_SYNC_SUBMITTED`）；R8 五外部渠道真实链保持 P2 待办 `todo/i6-external-notification-channels-real-verification.md` |",
    "| 当前活动交付任务 | P53 提示07 执行（`product/p53-global-ui-component-layout/receipts/planning-execution-prompt-p53-global-ui-component-layout-07.md`）；P61 阶段三终态同步（方向 `product/p61-user-facing-message-humanization/ready/direction-p61-user-facing-message-humanization-terminal-sync.md`；回执 `product/p61-user-facing-message-humanization/receipts/terminal-sync-p61-user-facing-message-humanization-01.md`，机器 `TERMINAL_SYNC_SUBMITTED`，待 Planner 全文复核后归档）；P60 整体终态同步（方向已归档 `product/v0.1.0-oa-completion/passed/direction-v0.1.0-oa-completion-terminal-sync.md`；回执 `product/v0.1.0-oa-completion/receipts/terminal-sync-v0.1.0-oa-completion-01.md`，已由最终复核 01 PASSED 确认）；R8 五外部渠道真实链保持 P2 待办 `todo/i6-external-notification-channels-real-verification.md` |"
  ],
  [
    "knowledge/current-status.md",
    "| 最近审查 | `product/v0.1.0-oa-completion/receipts/planning-final-review-release-v0.1.0-server-web-02-passed.md`",
    "| 最近审查 | `product/p61-user-facing-message-humanization/receipts/planning-review-p61-scope-corrected-completion-03-passed.md`（P61 功能级验收 **PASSED**，范围纠偏后六项标准全部通过，2026-09-20）\\| `product/p61-user-facing-message-humanization/receipts/planning-review-p61-scope-corrected-completion-02-not-passed.md`（C1/C3 通过并锁定、C2 缺八值工具证据，2026-09-20）\\| `product/p61-user-facing-message-humanization/receipts/planning-review-p61-scope-corrected-completion-01-not-passed.md`（C1—C3 差异核销单，2026-09-20）\\| `product/v0.1.0-oa-completion/receipts/planning-final-review-release-v0.1.0-server-web-02-passed.md`"
  ],
  [
    "knowledge/current-status.md",
    "- `p21-iot-device-access`（P21 IoT 设备接入、受控脚本与流程联动）：功能状态 **COMPLETED（规划已确认，2026-09-08）**",
    "- `p61-user-facing-message-humanization`（P61 全系统用户可见错误码与提示语人性化治理，L）：功能级验收 **PASSED（2026-09-20）**，功能状态 **COMPLETED（待规划确认，2026-09-20）**，已核销（待规划确认）；主方向与 2026-09-20 范围纠偏方向均已归档 `product/p61-user-facing-message-humanization/passed/`；阶段三终态同步方向仍在 `product/p61-user-facing-message-humanization/ready/direction-p61-user-facing-message-humanization-terminal-sync.md`，由 Planner 最终复核后归档；不增加业务功能数，不映射 90 明细。任务登记：`knowledge/features/p61-user-facing-message-humanization.md`。\n- `p53-global-ui-component-layout`（P53 全局 UI 与组件布局优化，XL）：**`VERIFYING`**（P0 主任务），唯一入口 `product/p53-global-ui-component-layout/receipts/planning-execution-prompt-p53-global-ui-component-layout-07.md`；P61 通过不构成 P53 视觉或功能通过结论。\n- `p21-iot-device-access`（P21 IoT 设备接入、受控脚本与流程联动）：功能状态 **COMPLETED（规划已确认，2026-09-08）**"
  ],
  [
    "knowledge/current-status.md",
    "**Planner 已确认 P60 `COMPLETED（规划已确认，2026-09-15）`；当前规划入口切换为 P61 用户可见错误码与提示语人性化治理现状探索（`search_task/v0.1.0-p61-user-facing-message-humanization-current-seams.md`）；不改变功能计数与开放 P 编号。**",
    "**继续执行 P53 提示07（`product/p53-global-ui-component-layout/receipts/planning-execution-prompt-p53-global-ui-component-layout-07.md`），等待其下一份合法完成回执；不改变功能计数与开放 P 编号。** P61 已功能级 `PASSED`（2026-09-20）、写为 `COMPLETED（待规划确认，2026-09-20）` 并已核销（待规划确认）；阶段三终态同步回执 `product/p61-user-facing-message-humanization/receipts/terminal-sync-p61-user-facing-message-humanization-01.md`（`TERMINAL_SYNC_SUBMITTED`）待 Planner 全文复核，归档前 P61 不再列为活动功能。"
  ],
  [
    "knowledge/current-status.md",
    "当前唯一规划入口 `ready/direction-v0.1.0-oa-completion-terminal-sync.md`（P60 整体终态同步方向）",
    "P60 整体终态同步方向已归档 `passed/direction-v0.1.0-oa-completion-terminal-sync.md`（最终复核 01 PASSED）；P61 任务登记 `knowledge/features/p61-user-facing-message-humanization.md`、阶段三入口 `product/p61-user-facing-message-humanization/ready/direction-p61-user-facing-message-humanization-terminal-sync.md`（待 Planner 归档）；P53 当前入口 `product/p53-global-ui-component-layout/receipts/planning-execution-prompt-p53-global-ui-component-layout-07.md`"
  ],
  [
    "knowledge/current-status.md",
    "- 上轮完成：**P60 整体终态同步**",
    "- 上轮完成：**P61 阶段三终态同步**（方向 `product/p61-user-facing-message-humanization/ready/direction-p61-user-facing-message-humanization-terminal-sync.md`；回执 `product/p61-user-facing-message-humanization/receipts/terminal-sync-p61-user-facing-message-humanization-01.md`，`TERMINAL_SYNC_SUBMITTED`）：把 P61 `COMPLETED（待规划确认，2026-09-20）`、功能级 `PASSED（2026-09-20）`、已核销（待规划确认）与 P61 治理验证基线集合（Server 1423/0/0/0、Web 1217+3）机械同步至 knowledge、memory、todo；功能数 44、90 明细 ✅46/🟦22/⬜22、ADV64 与其余开放 P 编号零变化；未运行工程构建/测试/迁移、未改业务代码、未执行 Git 写动作\n- 更早上轮完成：**P60 整体终态同步**"
  ],
  [
    "knowledge/current-status.md",
    "- 当前唯一下一动作：**P61 用户可见错误码与提示语人性化治理现状探索**（入口 `search_task/v0.1.0-p61-user-facing-message-humanization-current-seams.md`；P60 整体终态同步方向已归档 `passed/direction-v0.1.0-oa-completion-terminal-sync.md`，最终复核 01 PASSED）",
    "- 当前唯一下一动作：**继续执行 P53 提示07，等待其下一份合法完成回执**（入口 `product/p53-global-ui-component-layout/receipts/planning-execution-prompt-p53-global-ui-component-layout-07.md`）；P61 阶段三终态同步回执已提交（`TERMINAL_SYNC_SUBMITTED`），待 Planner 全文复核（P60 整体终态同步方向已归档 `passed/direction-v0.1.0-oa-completion-terminal-sync.md`，最终复核 01 PASSED）"
  ],
  [
    "knowledge/current-status.md",
    "- 功能追踪：`knowledge/features/v0.1.0-oa-completion.md`；映射索引 `knowledge/feature-reconciliation-index.md`",
    "- 功能追踪：`knowledge/features/v0.1.0-oa-completion.md`、`knowledge/features/p61-user-facing-message-humanization.md`（P61）；映射索引 `knowledge/feature-reconciliation-index.md`"
  ],
  [
    "knowledge/current-status.md",
    "P61（全系统用户可见错误码与提示语人性化治理）现状探索入口已就绪、等待 Owner 启动；",
    "P61（全系统用户可见错误码与提示语人性化治理）已功能级 `PASSED`（2026-09-20）、写为 `COMPLETED（待规划确认，2026-09-20）` 并已核销（待规划确认），不属于未完成边界；当前主任务 P53 `VERIFYING`；"
  ],
  [
    "knowledge/session-handoff.md",
    "> 同步点：2026-09-15，P60 `v0.1.0-oa-completion`（0.1.0 OA 全功能收口，XL，P0）执行中：",
    "> 同步点：2026-09-20。**当前活动功能=P53 全局 UI 与组件布局优化（XL，P0，`VERIFYING`，唯一入口 `product/p53-global-ui-component-layout/receipts/planning-execution-prompt-p53-global-ui-component-layout-07.md`）；P61 全系统用户可见错误码与提示语人性化治理（L，P1）功能级 `PASSED`（2026-09-20）并写为 `COMPLETED（待规划确认，2026-09-20）`、已核销（待规划确认），阶段三终态同步回执已提交（`TERMINAL_SYNC_SUBMITTED`，待 Planner 全文复核）**。P60 `v0.1.0-oa-completion`（0.1.0 OA 全功能收口，XL，P0）**COMPLETED（规划已确认，2026-09-15）**："
  ],
  [
    "knowledge/session-handoff.md",
    "| 当前活动正式功能 | `v0.1.0-oa-completion`（P60 0.1.0 OA 全功能收口）：**COMPLETED（规划已确认，2026-09-15）**",
    "| 当前活动正式功能 | `p53-global-ui-component-layout`（P53 全局 UI 与组件布局优化，XL，P0）：**`VERIFYING`**（唯一入口提示07）；`v0.1.0-oa-completion`（P60 0.1.0 OA 全功能收口）：**COMPLETED（规划已确认，2026-09-15）**"
  ],
  [
    "knowledge/session-handoff.md",
    "| P 编号 | **P21 已核销/完成（2026-09-08）**；",
    "| P 编号 | **P21 已核销/完成（2026-09-08）**；**P61 已核销（待规划确认，2026-09-20）**；"
  ],
  [
    "knowledge/session-handoff.md",
    "| 活动业务实现功能 | 无（I6 确认值投影已完成；P60 整体 14 条验收标准复核待 Planner 启动） |",
    "| 活动业务实现功能 | **P53 全局 UI 与组件布局优化（XL，P0，`VERIFYING`，唯一入口提示07）**；**P61 阶段三终态同步进行中**（回执 `product/p61-user-facing-message-humanization/receipts/terminal-sync-p61-user-facing-message-humanization-01.md` 已提交，待 Planner 全文复核；P61 不再列为活动功能） |"
  ],
  [
    "knowledge/session-handoff.md",
    "| 唯一下一动作 | **P61 用户可见错误码与提示语人性化治理现状探索**（入口 `search_task/v0.1.0-p61-user-facing-message-humanization-current-seams.md`；P60 终态同步方向已归档 `passed/`，最终复核 01 PASSED）。",
    "| 唯一下一动作 | **继续执行 P53 提示07（`product/p53-global-ui-component-layout/receipts/planning-execution-prompt-p53-global-ui-component-layout-07.md`），等待其下一份合法完成回执**；P61 阶段三终态同步回执 `product/p61-user-facing-message-humanization/receipts/terminal-sync-p61-user-facing-message-humanization-01.md` 待 Planner 全文复核（P60 终态同步方向已归档 `passed/`，最终复核 01 PASSED）。"
  ],
  [
    "knowledge/session-handoff.md",
    "- p21-iot-device-access：主方向与阶段三方向均归档 `product/p21-iot-device-access/passed/`",
    "- p53-global-ui-component-layout（P53，当前活动，XL/P0）：**`VERIFYING`**；唯一入口 `product/p53-global-ui-component-layout/receipts/planning-execution-prompt-p53-global-ui-component-layout-07.md`；P61 通过不构成 P53 视觉或功能通过结论。\n- p61-user-facing-message-humanization（P61）：功能级 **`PASSED`（2026-09-20）**，功能状态 **`COMPLETED（待规划确认，2026-09-20）`**，已核销（待规划确认）；阶段三终态同步回执 `product/p61-user-facing-message-humanization/receipts/terminal-sync-p61-user-facing-message-humanization-01.md`（`TERMINAL_SYNC_SUBMITTED`）待 Planner 全文复核；主方向与范围纠偏方向归档 `product/p61-user-facing-message-humanization/passed/`，阶段三方向仍在 `ready/` 待 Planner 归档；任务登记 `knowledge/features/p61-user-facing-message-humanization.md`。\n- p21-iot-device-access：主方向与阶段三方向均归档 `product/p21-iot-device-access/passed/`"
  ],
  [
    "knowledge/feature-reconciliation-index.md",
    "- **审计外新增编号（1）**：P59（",
    "- **审计外新增编号（2）**：P61（全系统用户可见错误码与提示语人性化治理；Owner 2026-09-14/20；优先级 P1、L；非新增业务功能、不映射 90 明细；功能级 `PASSED`（2026-09-20），写为 `COMPLETED（待规划确认，2026-09-20）`，已核销（待规划确认）；主方向与范围纠偏方向归档 `product/p61-user-facing-message-humanization/passed/`，阶段三终态同步回执 `product/p61-user-facing-message-humanization/receipts/terminal-sync-p61-user-facing-message-humanization-01.md` 待规划复核）、P59（"
  ],
  [
    "knowledge/feature-reconciliation-index.md",
    "`knowledge/features/knowledge-full-reconciliation.md`（非业务功能，COMPLETED 已确认，历史）",
    "`knowledge/features/knowledge-full-reconciliation.md`（非业务功能，COMPLETED 已确认，历史）；`knowledge/features/p61-user-facing-message-humanization.md`（P61 全系统用户可见错误码与提示语人性化治理，`COMPLETED（待规划确认，2026-09-20）`，已核销（待规划确认））"
  ],
  [
    "memory/README.md",
    "（截至2026-09-20；P53为P0/XL主任务并继续提示07；P61范围纠偏后功能级`PASSED`，八值8/8精确匹配，主方向已归档，等待阶段三终态同步。P60/0.1.0已发布）",
    "（截至2026-09-20；P53为P0/XL主任务并继续提示07；P61范围纠偏后功能级`PASSED`（2026-09-20）、状态`COMPLETED（待规划确认，2026-09-20）`、已核销（待规划确认），八值8/8精确匹配，主方向已归档，阶段三终态同步回执已提交待Planner复核。P60/0.1.0已发布）"
  ],
  [
    "memory/state.md",
    "> 当前规划（2026-09-20）：P53仍为Owner P0/XL主任务，状态`VERIFYING`，唯一实现入口继续为提示07。Owner同时恢复P61；P61范围已从XL架构包纠偏为L级提示语收口，状态`IN_PROGRESS`，唯一入口=`product/p61-user-facing-message-humanization/receipts/planning-execution-prompt-p61-user-facing-message-humanization-04.md`。",
    "> 当前规划（2026-09-20）：P53仍为Owner P0/XL主任务，状态`VERIFYING`，唯一实现入口继续为提示07。P61已从XL架构包纠偏为L级提示语收口并完成：功能级`PASSED`（2026-09-20）、状态`COMPLETED（待规划确认，2026-09-20）`、已核销（待规划确认）；阶段三终态同步回执=`product/p61-user-facing-message-humanization/receipts/terminal-sync-p61-user-facing-message-humanization-01.md`（`TERMINAL_SYNC_SUBMITTED`，待Planner全文复核）。"
  ],
  [
    "memory/state.md",
    "- P61：**PASSED（功能级，等待阶段三终态同步）**。四键×双语八值8/8逐字匹配、missing/duplicate=0、exit0；154目录键/22修订、HTTP 22/22、Server 1423、Web 1217+3均锁定。主方向已归档`passed/`；唯一入口=`product/p61-user-facing-message-humanization/ready/direction-p61-user-facing-message-humanization-terminal-sync.md`。业务功能数暂保持44。",
    "- P61：**`COMPLETED（待规划确认，2026-09-20）`**（功能级`PASSED`，2026-09-20；已核销（待规划确认））。四键×双语八值8/8逐字匹配、missing/duplicate=0、exit0；154目录键/22修订、HTTP 22/22、Server 1423、Web 1217+3均锁定。主方向与范围纠偏方向已归档`passed/`；阶段三方向=`product/p61-user-facing-message-humanization/ready/direction-p61-user-facing-message-humanization-terminal-sync.md`（待Planner归档），回执`receipts/terminal-sync-p61-user-facing-message-humanization-01.md`。业务功能数保持44（P61不增加业务功能数）。"
  ],
  [
    "memory/features.md",
    "> 规划侧最新同步点：2026-09-20（P53=P0/XL/`VERIFYING`并继续提示07；P61功能级`PASSED`并等待阶段三终态同步；P60=`COMPLETED（规划已确认）`且Server/Web `0.1.0`已发布；正式业务功能数44、ADV64）。",
    "> 规划侧最新同步点：2026-09-20（P53=P0/XL/`VERIFYING`并继续提示07；P61=`COMPLETED（待规划确认，2026-09-20）`并已核销（待规划确认）；P60=`COMPLETED（规划已确认）`且Server/Web `0.1.0`已发布；正式业务功能数44、ADV64）。"
  ],
  [
    "memory/features.md",
    "- P61（P1/L）：**PASSED（功能级）**。八值8/8、154键/22修订、HTTP 22/22、Server 1423、Web 1217+3锁定；主方向归档，等待阶段三终态同步；不增加业务功能数。",
    "- P61（P1/L）：**`COMPLETED（待规划确认，2026-09-20）`**（功能级`PASSED`，已核销（待规划确认））。八值8/8、154键/22修订、HTTP 22/22、Server 1423、Web 1217+3锁定；主方向与范围纠偏方向归档`passed/`，阶段三终态同步回执已提交待Planner复核；不增加业务功能数。"
  ],
  [
    "memory/handoff.md",
    "P53 全局 UI 与组件布局优化继续作为 P0/XL 主任务，状态 `VERIFYING`；P61 用户提示语治理由 Owner 同时恢复，为 P1/L 当前剩余项，状态 `IN_PROGRESS`。",
    "P53 全局 UI 与组件布局优化继续作为 P0/XL 主任务，状态 `VERIFYING`，唯一入口为提示07；P61 用户提示语治理（P1/L）已完成——功能级 `PASSED`（2026-09-20）、状态 `COMPLETED（待规划确认，2026-09-20）`、已核销（待规划确认），阶段三终态同步回执待 Planner 全文复核。"
  ],
  [
    "memory/handoff.md",
    "- P61：`product/p61-user-facing-message-humanization/receipts/planning-execution-prompt-p61-user-facing-message-humanization-04.md`。",
    "- P61：阶段三入口 `product/p61-user-facing-message-humanization/ready/direction-p61-user-facing-message-humanization-terminal-sync.md`（回执已提交，待 Planner 全文复核）。"
  ],
  [
    "memory/handoff.md",
    "P61 已功能级`PASSED`：八值8/8逐字匹配、缺失/重复0，154键/22修订、HTTP 22/22、Server 1423、Web 1217+3锁定。主方向已归档，阶段三只机械同步状态；P53视觉不因P61通过而获得通过结论。",
    "P61 已功能级`PASSED`（2026-09-20）并写为`COMPLETED（待规划确认，2026-09-20）`、已核销（待规划确认）：八值8/8逐字匹配、缺失/重复0，154键/22修订、HTTP 22/22、Server 1423、Web 1217+3锁定。主方向与范围纠偏方向已归档`passed/`，阶段三终态同步回执`terminal-sync-p61-user-facing-message-humanization-01.md`已提交；P53视觉不因P61通过而获得通过结论。"
  ],
  [
    "memory/handoff.md",
    "P61执行会话：读取功能验收03与终态同步方向，只提交`terminal-sync-p61-user-facing-message-humanization-01.md`，不得重跑测试或改实现。同步完成后的项目唯一下一动作仍是继续P53提示07。",
    "P61执行会话已完成阶段三终态同步（回执`terminal-sync-p61-user-facing-message-humanization-01.md`，待Planner全文复核）。P53执行会话：继续提示07并提交其下一份合法完成回执；P61不再是活动功能。"
  ],
  [
    "todo/requirement-pool.md",
    "P61按范围纠偏后的L级提示语治理并行推进，当前入口为`product/p61-user-facing-message-humanization/receipts/planning-execution-prompt-p61-user-facing-message-humanization-04.md`。P53负责颜色/布局/响应式，P61负责用户提示语与必要安全净化；共享文件必须隔离实施并在集成后复核。功能数44、✅46/🟦22/⬜22、ADV64不变。",
    "P61按范围纠偏后的L级提示语治理已并行完成：功能级`PASSED`（2026-09-20）、状态`COMPLETED（待规划确认，2026-09-20）`、已核销（待规划确认），阶段三终态同步回执`product/p61-user-facing-message-humanization/receipts/terminal-sync-p61-user-facing-message-humanization-01.md`已提交待Planner复核；P61不再是活动功能。P53负责颜色/布局/响应式（继续提示07）；共享文件已隔离实施并在P53最新可合并结果上完成值级集成复核（八值8/8）。功能数44、✅46/🟦22/⬜22、ADV64不变。"
  ],
  [
    "todo/requirement-pool.md",
    "| 功能级`PASSED`，等待阶段三终态同步；不增加业务功能数，尚未最终核销 |",
    "| `COMPLETED（待规划确认，2026-09-20）`（功能级`PASSED`，2026-09-20）；已核销（待规划确认）；不增加业务功能数；阶段三终态同步回执已提交待Planner复核 |"
  ],
  [
    "todo/requirement-pool.md",
    "- P60 `0.1.0` 前置已满足；Owner 2026-09-20 覆盖此前等待排期，P61 与 P53 并行恢复。当前范围以 `direction-p61-user-facing-message-humanization-scope-correction-20260920.md` 为准，不改变 I6 范围、功能数或清单计数。",
    "- P60 `0.1.0` 前置已满足；Owner 2026-09-20 覆盖此前等待排期，P61 与 P53 并行恢复并按范围纠偏完成：功能级 `PASSED`（2026-09-20）、`COMPLETED（待规划确认，2026-09-20）`、已核销（待规划确认），阶段三终态同步回执 `receipts/terminal-sync-p61-user-facing-message-humanization-01.md` 已提交待 Planner 全文复核。P61 范围以 `direction-p61-user-facing-message-humanization-scope-correction-20260920.md`（已归档 `passed/`）为准，不改变 I6 范围、功能数或清单计数。"
  ],
  [
    "todo/requirement-pool.md",
    "- P61 已建立的机器错误语义与安全边界不得被 UI 改造回退；P61 已按 2026-09-20 范围纠偏与 P53 并行恢复。两项共享页面文件隔离实施，集成后只复核 P61 文案行为，不把 P53 视觉结果纳入 P61 验收。",
    "- P61 已建立的机器错误语义与安全边界不得被 UI 改造回退；P61 已按 2026-09-20 范围纠偏与 P53 并行完成（功能级 `PASSED`（2026-09-20）；`COMPLETED（待规划确认，2026-09-20）`；已核销（待规划确认）），并已在 P53 最新可合并结果上完成两个 locale 文件的值级集成复核（八值 8/8）。两项共享页面文件隔离实施，集成后只复核 P61 文案行为，不把 P53 视觉结果纳入 P61 验收。"
  ],
  [
    "product/p61-user-facing-message-humanization/ready/direction-p61-user-facing-message-humanization-terminal-sync.md",
    "> 前置：功能级`PASSED`，见`receipts/planning-review-p61-scope-corrected-completion-03-passed.md`",
    "> 前置：功能级`PASSED`，见`receipts/planning-review-p61-scope-corrected-completion-03-passed.md`  \n> 阶段三状态指针：`COMPLETED（待规划确认，2026-09-20）`（Executor 已按本方向完成机械同步并提交回执；待 Planner 全文复核后归档 `passed/`）  \n> 本轮回执：`receipts/terminal-sync-p61-user-facing-message-humanization-01.md`（`TERMINAL_SYNC_SUBMITTED`）"
  ]
]
const memoryDir = join(ROOT, 'memory')
const memoryFiles = readdirSync(memoryDir).filter(f => f.endsWith('.md'))
const memoryBefore = memoryFiles.reduce((s, f) => s + statSync(join(memoryDir, f)).size, 0)

const log = []
let failed = 0
for (const [file, find, replace] of edits) {
  const path = join(ROOT, file)
  const content = readFileSync(path, 'utf8')
  const occurrences = content.split(find).length - 1
  if (occurrences !== 1) {
    failed++
    log.push({ file, status: 'ANCHOR_ERROR', occurrences })
    continue
  }
  writeFileSync(path, content.replace(find, replace))
  log.push({ file, status: 'REPLACED', occurrences })
}

const memoryAfter = memoryFiles.reduce((s, f) => s + statSync(join(memoryDir, f)).size, 0)
writeFileSync(join(ROOT, 'product/p61-user-facing-message-humanization/receipts/evidence/terminal-sync-p61-user-facing-message-humanization-01/apply-log.json'),
  JSON.stringify({ edits: log, replaced: log.filter(l => l.status === 'REPLACED').length, failed, memoryCompression: { before_bytes: memoryBefore, after_bytes: memoryAfter } }, null, 2))
console.log(JSON.stringify({ replaced: log.filter(l => l.status === 'REPLACED').length, failed, memoryBefore, memoryAfter }))
process.exit(failed === 0 ? 0 : 1)

