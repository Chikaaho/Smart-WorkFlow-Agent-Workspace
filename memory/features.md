# 功能摘要

2026-11-08｜Executor（执行提示05）｜0.3.6 发布完成，H8、H9 已交付，待 Planner 验收。

- 0.3.6：**指令参数中文化与原文权限门禁（H8）+ C1/C2 一致数据重跑（H9）**。
  - TEXT 字段新增 `jsonDisplay`（键名/取值中文映射）；只读 JSON 参数显中文（演练编号/动作/机房断电/火警告警/目标机房/回切时限（分钟）；switch→切换），无映射回退原键名；「JSON 原文」折叠区仅 `form:design:save` 可见；MQTT 载荷英文键不变。
  - `ops_drill_plan` UAT 版本 3：标题「到点下发的设备指令」+ 映射；C1 `MES-20261108-015`（传感器漂移→仪表校准）、C2 `MES-20261108-016`（设备维修）重跑 APPROVED；A1 双视角（chenjing `YJ-20261108-008` foldable 0；admin `YJ-20261108-009` 可展开）。
  - Web tag `0.3.6`=`c3f1d6e`（feature `8dd0220`），Release `438126185`；Server 维持 0.3.2；功能数保持 **51**。
  - 详见 `knowledge/features/0.3.2-opinion-display.md`（0.3.6 节）、回执 `receipts/execution-final-07.md`。

- 0.3.3—0.3.5：**流转记录摘要标签与数据一致性返修（H6、H7；审查06 已验收锁定）**。
  - 意见摘要每段都是“标签：值”，数值带单位，备注显示为“审批意见：…”，长文本可悬浮看全文，1440 无横向滚动。
  - JSON 参数按字段展示，原文折叠。
  - UAT 新建实例重跑 A1 `YJ-20261108-008`、B1 `XY-20261108-015`，均 APPROVED。
  - Web tag `0.3.3`/`0.3.4`/`0.3.5`=`d52f5aa`/`94827dd`/`cfccaa9`，Server 维持 0.3.2。
  - 详见 `knowledge/features/0.3.2-opinion-display.md`（0.3.3—0.3.5 节）、回执 `receipts/execution-final-06.md`。

- 0.3.2/0.3.1/0.3.0：0.3.2 意见展示返修（H1—H5 锁定，审查05 由 0.3.3—0.3.5 替代）；0.3.1 意见驱动流转机制锁定（审查04 由 0.3.2 替代）；0.3.0 初版被 Owner 退回后返修。详见 `knowledge/features/0.3.2-opinion-display.md`、`0.3.1-approval-driven-flow.md`、`0.3.0-three-sample-processes.md`。

- 0.2.0—0.2.4：均 `COMPLETED`（七阶段 7/0/0，已发布并部署 UAT）。0.2.4=第 **51** 个正式功能（README 示例二/三，tag Server `41511bd4`/Web `f4acc3d`）；0.2.2=第 50 个（F1 Agent 完善+应用导入导出，D022-16）；0.2.3=Agent graph 增强（功能数保持 50，P20 不核销）；0.2.1=29 项缺陷列车。终态复核见各 `product/0.2.x/receipts/`，登记见 `knowledge/features/0.2.*.md`。

缺陷修复不增加正式业务功能数，不核销 P 编号。
