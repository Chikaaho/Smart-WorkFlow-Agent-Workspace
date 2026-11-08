# 交接

2026-11-08｜Executor（执行提示05）｜H8、H9 完成并发布 0.3.6，回执 `execution-final-07.md`，待 Planner 验收。

## 当前

三示例流程返修 0.3.6 已完成，依据执行提示05（审查06：H6、H7 锁定）。

**H8**：TEXT 字段契约键 `jsonDisplay`（keyLabels/valueLabels），只读 JSON 参数显中文（演练编号、动作、机房断电、火警告警、目标机房、回切时限（分钟）；switch→切换），无映射回退原键名/原值；「JSON 原文」折叠区仅 `form:design:save`（管理员/设计者）渲染。设计器 TEXT 配置新增映射编辑（每行「键=中文名」，非法行忽略）。`ops_drill_plan` UAT 版本 3：标题「到点下发的设备指令」+ 映射；存储值与 MQTT 载荷英文键不变。

**H9**：C1 `MES-20261108-015`（81.2/2.8，序列 77.6→81.2，实测 77.8 偏差 3.4>3 → 传感器漂移→仪表校准）、C2 `MES-20261108-016`（82.0/2.4，序列 78.4→82.0，实测 82.3 → 设备维修）均 APPROVED；原 014 同类矛盾一并重跑；阈值 75/80/85、判定值 1.5、窗口 5 一致。

**A1 双视角**：普通审批人 chenjing 视 `YJ-20261108-008`（全中文、foldable 0）；管理员 admin 新建 `YJ-20261108-009`（9 节点 APPROVED，原文可展开）。「我的实例」只含发起实例，admin 打开他人实例 403。

**回执与证据**：回执 `product/three-sample-process-uat/receipts/execution-final-07.md`；截图 `.runtime-030/uat-shots-036/`（本机留存）。

**发布**：
- Web 0.3.6：feature `8dd0220` → develop `0d71982` → main/tag `c3f1d6e`（Release `438126185`，zip 6,197,059 B sha256 `9470f0c1…`，CI run `42463025237`）。
- Server 未改动，仍为 tag `0.3.2`=`de8ec017`。
- 已发布 tag（0.3.0—0.3.5）均未改动。
- UAT Web 入口 `assets/index-CKdiXkhU.js`，build.version=0.3.2，health UP。

测试：`TextControl.spec` 9/9、`TextConfig.spec` 6/6、透传 1 项；全量 2054 通过。七阶段 **5/1/1**。唯一下一动作：**Planner 验收 0.3.6（H8、H9）**。上一交付 0.3.3—0.3.5 已由审查 06 验收锁定。

## 0.3.3—0.3.5（历史，审查 06 已验收锁定）

H6（摘要每段带标签，含备注回退与审批时间）、H7（JSON 字段化+原文折叠；A1 `YJ-20261108-008`、B1 `XY-20261108-015` 重跑 APPROVED）；tags `d52f5aa`/`94827dd`/`cfccaa9`。

并行任务 **P66 多数据库兼容**（XL，目标 0.4.0，READY）：`product/multi-database-compat/ready/direction-multi-database-compat.md`；下一步阶段 A 只读核对。

## 0.3.2（历史，审查05 不通过，由 0.3.3—0.3.5 替代）

H1—H5 完成（UAT 7 条路径全 APPROVED），回执 `execution-final-05.md`；Server tag `0.3.2`=`de8ec017`、Web `3b0043f`（同版本覆盖，已追认）。

## 更早历史

0.3.0（终审后被 Owner 退回，发布事实不回滚，详见 `knowledge/features/0.3.0-three-sample-processes.md`）；0.2.3/0.2.4 COMPLETED（0.2.4=第51个正式功能，终态复核 `product/0.2.4/receipts/planning-final-review-024-completed.md`）。常规决定：截图本机留存不入Git；执行列表无菜单、冷却抑制、mes_judge_config不参与判定按已登记边界处理。

## 保留与保护

Owner定保留本机隔离环境（含 `.runtime-*`、隔离库、凭据密文，已gitignore，只要求不泄露）。继续保护 Web vite.config.ts 在途改动、`smart_workflow_f1v4b`、用户8080/5173服务和秘密；Key/授权码不入Git。
