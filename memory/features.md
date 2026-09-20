# 功能摘要

> 规划侧最新同步点：2026-09-20（P53=P0/XL/`VERIFYING`并继续提示07；P61=`COMPLETED（规划已确认，2026-09-20）`并已核销；P60=`COMPLETED（规划已确认）`且Server/Web `0.1.0`已发布；正式业务功能数44、ADV64）。
> 清单当前值 **✅46/🟦22/⬜22**（90，M08 十行 🟦/⬜→✅，其余 80 行零变化）；功能数 44；全量双向映射见 `knowledge/feature-reconciliation-index.md`。

- `v0.1.0-oa-completion`（P60，优先级P0）：**COMPLETED（规划已确认）**，整体14/14；版本身份=Server `c15428f…` / Web `963df36…`，迁移终点V93。
- P53（P0/XL）：**VERIFYING，验收09不接受`BLOCKED`**。当前最终证据23/31，b/c exit1；颜色33条超差被自动免失败且max diff=218；terminal缺包并与progress不一致。提示07改用受限glyph边界和SVG声明颜色方法，要求连续完成31/31、真实流与terminal；唯一入口=`product/p53-global-ui-component-layout/receipts/planning-execution-prompt-p53-global-ui-component-layout-07.md`。
- P61（P1/L）：**`COMPLETED（规划已确认，2026-09-20）`，已核销**。独立提交Server `742adb8`、Web `d110ed8`先保留，待P53结束后统一合并；三份方向归档`passed/`，不增加业务功能数。

- `p21-iot-device-access`：**COMPLETED（规划已确认，2026-09-08）**，第44个正式功能；P21已核销、I14关闭、M08 10✅/1🟦/2⬜。主方向与阶段三方向均归档 `passed/`；最终裁决 `planning-final-review-terminal-sync-p21-iot-02-passed.md`。

- `v0.0.2-oa`：**COMPLETED（规划已确认，2026-09-07）**，第43个正式功能；A1—A8全部锁定。P3/P54/P55已核销，P2/P4开放部分实现。历史基线已被 P21/I6 基线取代。三方向归档`product/v0.0.2-oa/passed/`；登记`knowledge/features/v0.0.2-oa.md`。

- `p4-oa-personal-center-dual-dispatch`：**功能状态 COMPLETED（2026-09-07）**（验收事件：功能级 PASSED，规划复验09），第 42 个正式功能；P4 总项开放、部分实现未核销（流程中心分类/双视角、抄送我的查询/催办已由 v0.0.2-oa 交付；转办/委托/加签/撤回、流程版本/挂起激活等候选仍开放）。登记 `knowledge/features/p4-oa-personal-center-dual-dispatch.md`。

- `p59-ch-apaas-project-update`：**COMPLETED（规划已确认，2026-09-05）**，非新增业务功能；**P59 已核销**；两个方向归档 passed（历史点）。

- `knowledge-full-reconciliation`（非业务功能任务）：**COMPLETED（已确认，2026-09-04）**，三方向归档 `passed/`。

- 更早已确认功能（详见 `knowledge/history/`）：p58 第41个（2026-09-04）、p57 第40个（09-03）、p56 第39个＋P46（09-02）、p52 第38个（09-02）、p45 第37个（09-01）、p51 Engine 解耦（08-31，不计功能数）、minimal-closure-first-acceptance（08-29 审计）、form-data-import-export 第36个（08-29）、minimal-business-closure 第35个（08-28）。
