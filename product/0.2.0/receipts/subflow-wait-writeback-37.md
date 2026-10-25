# 子流程向导补齐编排方式、等待策略与结果回写

2026-10-26｜Executor｜批次37，对应 278:1634/1669/1719；修复 273:1051 之后的又一个前端真实缺口。

## 变更

- Web `c44d8ab..0b46115`、`82d036a..8cfd444`（`codex/0.2.0-ui-tenant-form-flow`，已推送）：
  - 子流程向导第①步新增“始终发起”，与“写脚本/选字段”并列；始终发起保存为等价 `return 1;` 触发脚本，不再要求用户先写脚本。
  - 第③步新增“编排方式”（主子流程/独立关联）、“等待策略”（全部/任一/达到数量/不等待）、“等待数量”、结果回写开关、结果节点、子表单结果表、来源行标识列、本表单来源表，以及行级/主记录回写映射行。
  - 这些值同时写入节点 `config.subflow` 和 `TriggerAction`（orchestration/waitPolicy/waitCount/writeBack），与既有 `buildActionConfig` 契约一致；服务端发布校验仍为权威。
  - 修复重复应用时等待块重复插入：`syncSubflowWaitNode` 不再只按预期 id 查找，改为按 `waitActionIds` 匹配；关闭时清理全部匹配等待块并回连原走向。

## 真实链（PG 18.4，t100admin@租户100，1920）

1. 选中 A16 流程 `node_1 主管审批` → 高级 → 发起子流程；向导第①步显示“始终发起/写脚本/选字段”，选“选字段/名称”可进入下一步。
2. 第②步选择已发布流程 `A16 全链流程`；第③步设置等待策略“达到数量”、等待数量 2、结果回写开、结果节点 `node_1`、子表单结果表 `items`、来源行标识列 `sourceRowId`，并添加主记录回写 `childField→parentField`。
3. 点击完成 → 设计器显示“修改配置 A16 全链流程｜初始值 0 项”；保存草稿提示“草稿已保存”。
4. PG `graph_json.elements[node_1].config.subflow` 实际包含：`triggerMode=FIELD, triggerField=name, orchestration=CHILD, waitPolicy=COUNT, waitCount=2, wbEnabled=true, wbResultNodeKey=node_1, wbTableField=items, wbRowKeyField=sourceRowId, wbMainFields=[{fromField:childField,toField:parentField}]`。
5. 首次应用时发现重复等待块（node_2/node_3）；修复匹配逻辑后，关闭发起子流程开关并保存，`elements` 中 `SUBFLOW_WAIT` 数组为空，节点 `subflow.enabled=false`，触发器恢复为原有两条（`tg_a13_marker`、`node_enter_node_1`）。

## 覆盖矩阵回填

- 278:1634 目标流程 → 已实施（目标流程 + 始终/脚本/字段）
- 278:1669 字段映射 → 已实施（子流程字段/来源映射、逐行/汇总）
- 278:1719 等待与回写 → 已实施（编排/等待/数量/结果节点/行级与主记录回写）
- 273:1051 变量/子流程前置 → 沿用批次36

## 门禁

- Web 四连 exit=0：typecheck 0、eslint 0/0、vitest **215 文件通过/1 跳过，1872 通过/3 跳过**、build 4.06s（`/tmp/web-fourgate-39.log`）。
- 服务端零改动；未发布新流程版本。

## 未验证/边界

- 子流程目标暂选 A16 自身，仅验证 UI/草稿持久化，未发布、未真实发起；自引用目标发布校验与运行期派发未验证。
- 等待策略/回写只验证配置写入，未造真实子流程执行/回写链。
- 结果节点当前为文本输入，未接目标流程节点下拉；与既有触发器面板同口径，但设计若要求选择器仍有差异。
- 无修复后截图（宿主 surface/rAF/OS 捕获限制），同态像素未通过。
- 0.2.0 IN_PROGRESS，未核销 P、未晋级基线；等待 Planner 独立复核。
