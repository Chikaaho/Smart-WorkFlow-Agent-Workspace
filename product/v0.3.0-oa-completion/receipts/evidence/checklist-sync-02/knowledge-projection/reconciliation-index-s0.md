# knowledge/feature-reconciliation-index.md §0
# 功能映射索引（feature-reconciliation-index）

> 知识库全量整理（knowledge-full-reconciliation）产物；对账任务已 **COMPLETED（已确认，2026-09-04）**（`product/knowledge-full-reconciliation/receipts/planning-final-review-terminal-sync-02-passed.md`）。2026-09-04 P59（非业务功能统一交付）已核销；90 明细/56 审计唯一编号/54 I 集合不变。
> 本索引固化全量双向映射与独立范围说明：**90 项清单明细**、**56 个唯一 P 编号**、**54 条 I 编号**、**55 个审计 product 目录**；每个稳定 ID 均可定位。
> 41 是历史正式功能计数（P52—P58 等正式功能序列），**不是** product 目录数或 feature 文件数；本审计不增加业务功能。

## 0. 权威值（与 current-status/功能清单一致）

- 清单：10 模块、55 功能、90 明细；**✅46/🟦22/⬜22**（p21-iot-device-access 十行 🟦/⬜→✅：M08-F01-01/02/03、F02-01/02、F03-01/02、F04-03/04、F05-01；其余 80 行不变）
- 高级能力规划项（P60 v0.3.0-oa-completion 首次同步，2026-09-08）：**8 模块、64 条（ADV-M11—ADV-M18，键 `ADV-M11-F01-01`—`ADV-M18-F03-01`）**，正式登记于 `Smart-WorkFlow-Server/功能清单.md` 文末 ADV 章节；**未纳入 0.3.0 验收、不计入上方 90 明细 ✅/🟦/⬜ 统计、不并入已完成功能数**，状态统一 ⬜ 规划登记/待现状核实；规划定义权威为 `product/v0.3.0-oa-completion/ready/advanced-capability-feature-checklist.md`（本审计集合不并入该 64 条）
- P：物理 57 行、唯一 56 编号（P48 总表/明细双入口同值；P13 已核销移除、P23 零引用备案）
- I：索引 54 条、区间 I1—I55 缺 I27（I27 缺行证据待定位，见 §5；I14 已满足/关闭 2026-09-08）
- product 审计目录：55（总 57 − governance − knowledge-full-reconciliation）
- 正式功能数：**44**（p21-iot-device-access 为第 44 个，功能状态 COMPLETED（规划已确认）2026-09-08，43＋1 不另建 P 编号；历史点：v0.0.2-oa 为第 43 个，P4 OA 本轮子集为第 42 个，P58 为第 41 个）
- P59：Owner 2026-09-04 新增统一交付编号（不在审计 56 唯一编号集合内），非新增业务功能、不映射清单明细，**已核销**（功能级 PASSED，见 `knowledge/features/p59-ch-apaas-project-update.md`）；上列审计计数保持原值

## 1. 90 项清单明细 ↔ 交付/P 编号 双向映射

### M01 组织架构（13 行）

| ID | 状态 | 映射交付 / P / I | 范围说明 |
|---|---|---|---|
