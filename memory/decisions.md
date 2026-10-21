# 近期有效决策摘要

## 0.1.10 开轮与基线对齐（2026-10-21）

Owner 确认版本 **0.1.10**；本轮从核实后的 develop 承接：根同步提交 `3c1a2a22`、Server `2d6b8f1`、Web `2ac1a71`。0.1.9 既有交付 COMPLETED（README 首例灾备演练，7/0/0），终审结论机械传播至 knowledge。SYNC-01规划复核通过并关闭，同步方向归档passed，执行承接关闭裁决传播及提交推送。0.1.10 版本收敛仍留待发布阶段，不提前改 `version.json`/`pom`/`package.json` 的 0.1.9 现状。

## Owner默认交付流程（2026-10-16）

后续固定：①新需求评估→②执行并从 develop 拉新分支→③验收与信息同步→④开发分支→develop→main（develop 内按发布要求压缩种子/版本收敛）→⑤发版，版本必须用户确认→⑥再次同步信息→⑦结束。只有 Owner 明确“不发版”，才在③结束；版本未给不等于不发版。已确认版本不重复询问。第三步业务功能完成不等于默认交付结束；维持风险分级与角色边界。完整裁决：`product/delivery-lifecycle/ready/direction-owner-delivery-lifecycle.md`。

## 已完成功能与历史基线

- 正式功能 49；清单 46/22/22=90；ADV64、问题57；不新增/不核销 P。P62 功能 COMPLETED、有限性能延期/OFF；P64 COMPLETED；P63 COMPLETED。
- 0.1.6 应用中心与表单分类统一（2026-10-16）；0.1.7 Bug 修复列车（2026-10-18）；0.1.8 原生 MQTT 与用户态探测（2026-10-19）；0.1.9 首例灾备演练修复与验收（2026-10-21）。
- 当前状态与历史物理分离；当前值只见 `knowledge/current-status.md`；终态契约单一源 `.codex/governance/terminal-contract.json`。
- Planner 以 `memory/` 最小摘要恢复；冲突时按 knowledge 权威修正，不反向裁决。
- P62/P63/P64 边界与 P60/I3—I6、P61、BAO 裁决保持；0.1.5 列车、0.1.3、0.1.0 为历史发布，不重复发布。

