# 流程变量新增从“无法保存”修复为真实可配置

2026-10-26｜Executor｜批次36，对应 273:1051 流程变量与 A12 版本脚本的变量前置；修复 P0 前端缺口。

## 根因

流程变量弹窗原来只有“变量标识/变量名称”两个输入，`emptyVariableDraft()` 默认 `source=MAIN_FORM`、`sourceField=''`；`validateVariableDraft` 要求主表来源必须选择具体字段，因此**新增变量必然被拒**，只有编辑既有变量才能保存。

## 变更

- Web `363fecd..c44d8ab`（`codex/0.2.0-ui-tenant-form-flow`，已推送）：
  - 变量弹窗补齐变量类型（数字/文本/布尔/用户/部门/用户集合/部门集合/明细行）、数据来源（主表字段/节点表单/系统字段）。
  - 主表字段从 `mainFormFields` 选择；节点表单选择来源节点 + 该节点表单字段（复用 `nodeFormBindings` 与字段缓存）；系统字段从只读白名单选择。
  - 补聚合方式（不聚合/并集去重/拼接）与允许空值开关。
  - 选字段时按 `compatibleVariableTypes` 自动带出变量类型和名称；切换来源清空旧字段，避免跨来源脏值。
  - 原 `validateVariableDraft`/`buildVariableDef` 契约不变，服务端发布校验仍是权威。

## 真实链（PG 18.4，t100admin@租户100，1920）

1. 打开 A16 流程设计器 → “变量”弹窗；原为空列表。
2. 新增：标识 `var_batch32_probe`、名称“批次32变量”、来源“主表字段”、字段“名称（name）”；类型自动为“文本”，聚合“不聚合”，允许空值关。
3. 点击“添加”后列表出现“批次32变量/编辑/删除”；关闭弹窗点击“保存”，提示“草稿已保存”。
4. PG `sw_bpm_process_def.graph_json.variables` 实际保存：
   `{"varId":"var_batch32_probe","name":"批次32变量","type":"STRING","source":"MAIN_FORM","sourceField":"name","roundRule":"CURRENT","aggregation":"NONE","nullable":false}`。
5. 未发布新版本；草稿变量不影响已发布 v7 及旧实例。

## 覆盖矩阵回填

- 273:1051 流程变量：补“新增可用 + 真实草稿持久化”证据（36）。

## 门禁

- Web 四连 exit=0：typecheck 0、eslint 0/0、vitest **215 文件通过/1 跳过，1871 通过/3 跳过**、build 3.83s（`/tmp/web-fourgate-36.log`）。
- 服务端零改动。

## 未验证/边界

- 节点表单来源、系统字段来源、集合聚合未逐一造真实链；本批验证主表来源新增/保存。
- 变量草稿未发布，未验证发布后的运行期取值；服务端发布校验与运行期沿用既有变量链。
- 无修复后截图（宿主 surface/rAF/OS 捕获限制），同态像素未通过。
- 0.2.0 IN_PROGRESS，未核销 P、未晋级基线；等待 Planner 独立复核。
