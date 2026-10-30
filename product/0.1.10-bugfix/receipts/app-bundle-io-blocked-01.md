# 应用导入导出：方向缺口阻塞回执（01）

2026-10-21｜Executor｜L｜BLOCKED（DIRECTION_CONFLICT）

## 已完成：UAT 灾备演练数据导入本地

按 Owner 指令，只读导出 UAT 并导入本地 `sw_0110_run`：

| 对象 | 本地数量 | 说明 |
|---|---|---|
| `sw_form_def` | 2 | 「灾备演练」（form_key=灾备演练，v3）、「演练审批意见」（form_mvf2qnmn，v2） |
| `sw_form_config` | 2 | 字段定义随表单 |
| `sw_form_snapshot` | 3 | 表单历史版本 |
| `sw_bpm_process_def` | 1 | 「灾备演练审批」（bpm_26316e0198d3484b，v9，PUBLISHED） |
| `sw_bpm_process_def_version` | 8 | 流程历史版本 |
| `sw_form_f7gnr0aln0` | 17 | 主表单数据行 |
| `sw_form_app` | 1 | 「灾备演练」应用（tenant 9001，ENABLED，ALL） |

物理表 `sw_form_f7gnr0aln0`、`sw_form_aze7bjfjdt` 已按 UAT DDL 在本地创建。导入后重启后端，`GET /api/workflow/defs?formKey=灾备演练` 返回「灾备演练审批」、`creatorName=张伟`、`defVersion=9`。UAT 侧只读，未改任何数据。

本地入口：`http://localhost:5173`，租户 9001 管理员 `demo_a_hq_1 / AdminP@ssw0rd`；表单设计器路径 `/form/designer/f2683a7b-edc0-404b-b955-7c77545fe1e7?tab=processes`。

## 阻塞：应用级导入导出缺少 L 方向

Owner 要求「应用需要加导入导出；导出包含整个表单、流程、关联审批意见；审批意见不存在则新增」。核实结果：

- 现有 `FormImportExportController/Service` 只做**表单数据 Excel 导入导出**，不是应用/表单/流程定义打包；
- 该功能跨 form、BPM、应用目录、审批意见表单与权限/租户隔离，属于 L 级（数据隔离与跨模块契约），按 0.1.10 主方向「触及权限、数据模型、跨仓契约或其他升级门的事项，补齐对应 L/XL 方向与验收边界后进入实现」；
- 当前无对应 L 方向，故不进入实现，避免自行裁决导出单元、冲突策略与权限边界。

## 建议范围（供 Planner 形成方向，不构成产品裁决）

1. 导出单元：应用（`sw_form_app`）＋目录＋应用内表单（定义、配置、快照）＋关联流程（定义、最新发布版本）＋被流程引用的审批意见表单。
2. 导入：按稳定 key 落库；审批意见表单不存在时按包内定义新建；应用/表单/流程 ID 重新生成，引用按 key 重映射。
3. 冲突策略、权限点（如 `form:app:export/import`）、租户隔离、是否含运行数据与附件，需方向明确。
4. 验收：以本轮已导入的灾备演练数据做导出→本地新库导入→定义/流程/审批意见一致性的往返验证。

## 释放条件

Planner 下发应用导入导出的 L 方向与验收边界（导出单元、冲突策略、权限与租户隔离、是否含运行数据）。方向明确后按后端导出/导入、前端入口、往返验证拆步实施。

## 证据

- UAT 导出脚本与 CSV：本地 `/tmp/uar/export0110/`（临时，未入库）
- 本地库计数：`sw_form_def` 2、`sw_form_config` 2、`sw_form_snapshot` 3、`sw_bpm_process_def` 1、`sw_bpm_process_def_version` 8、`sw_form_f7gnr0aln0` 17
- 接口回读：`/api/workflow/defs?formKey=灾备演练` → `灾备演练审批`／`张伟`／`v9`
