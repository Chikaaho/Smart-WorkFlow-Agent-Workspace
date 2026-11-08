# 交接

2026-11-08｜Planner（P66 审查 assess-02）｜P66 B0 通过，下一步 B1；三示例流程 COMPLETED。

## 当前

三示例流程返修（0.3.1—0.3.6）功能 **`COMPLETED`**（规划审查07 `product/three-sample-process-uat/receipts/planning-review-07-passed.md`，H1—H9 锁定），终态同步回执 `product/three-sample-process-uat/receipts/terminal-sync-036-01.md`；方向 `passed/direction-terminal-sync-036.md` 待规划复核后归档 `passed/`。规划终态复核已通过。

**交付登记** `knowledge/features/0.3.2-opinion-display.md`（最终交付登记 0.3.1—0.3.6）：
- 平台机制：意见写入流程变量（`opinion`/`opinion_<字段>`/`formData` 回写）、会签聚合 `opinionAgg_*`、触发器 `nodeOpinions` 注入。
- 三流程意见驱动分支与处理人：A 需补充、高风险加签、停机>240 加副总、调整窗口改预约时间、现场总指挥；B 误报、现场处置人、超时督办、上报范围；C 原因分类、指派维修人、偏差>3℃ 强制校准、停机复产。
- 意见展示：结构化字段、摘要每段“标签：值”、意见抽屉、会签弹窗；只读 JSON 中文映射 `jsonDisplay` 与原文权限门禁。
- 证据实例：A1 `YJ-20261108-008/009`、A2 `YJ-20261108-006`、B1 `XY-20261108-015`、B2 `XY-20261108-013`、B3 `XY-20261108-014`、C1 `MES-20261108-015`、C2 `MES-20261108-016`。

**发布**：Web 0.3.6（tag `c3f1d6e`，Release `438126185`，zip 6,197,059 B sha256 `9470f0c1…`）；Server 0.3.2（tag `de8ec017`，Release `437820040`）；UAT `build.version=0.3.2`、Web 入口 `assets/index-CKdiXkhU.js`、Flyway V0.2.9、health UP；Web 0.3.2 tag 同版本覆盖 Owner 2026-11-08 追认（维持 `3b0043f`）。已发布 tag 0.3.0—0.3.5 均未改动。

**应用包**：维持 `systemVersion=0.3.2` 导出（71,786 B）；缺独立意见表单定义（17 张）、触发器脚本（B `tg_duty_overdue`、C `tg_scene_sensor`）、Agent 图、IoT 产品/设备/规则与渠道凭据——补建方法见功能文件与 `assets/README.md`。

七阶段 **7/0/0**。三示例流程线结束（终态复核 `product/three-sample-process-uat/receipts/planning-final-review-036-completed.md`）。唯一下一动作见 P66。

## 0.3.3—0.3.5（历史，审查 06 已验收锁定）

H6（摘要每段带标签，含备注回退与审批时间）、H7（JSON 字段化+原文折叠；A1 `YJ-20261108-008`、B1 `XY-20261108-015` 重跑 APPROVED）；tags `d52f5aa`/`94827dd`/`cfccaa9`。

并行任务 **P66 多数据库兼容**（XL，目标 0.4.0）：阶段 A 有条件通过，B0 补充盘点通过（`product/multi-database-compat/receipts/planning-review-assess-02.md`：LIKE 跨库区分大小写靠排序规则、`comment` 改名 `opinion_comment`、MySQL DYNAMIC 为支持前提等五项口径已裁决，H1—H6 并入 B1），唯一下一动作 **Executor B1 公共能力**，分支 `feature/0.4.0-multi-database`，回执 `execution-b1-01.md`。

## 0.3.2（历史，审查05 不通过，由 0.3.3—0.3.5 替代）

H1—H5 完成（UAT 7 条路径全 APPROVED），回执 `execution-final-05.md`；Server tag `0.3.2`=`de8ec017`、Web `3b0043f`（同版本覆盖，已追认）。

## 更早历史

0.3.0（终审后被 Owner 退回，发布事实不回滚，详见 `knowledge/features/0.3.0-three-sample-processes.md`）；0.2.3/0.2.4 COMPLETED（0.2.4=第51个正式功能）。常规决定：截图本机留存不入Git；执行列表无菜单、冷却抑制、mes_judge_config不参与判定按已登记边界处理。

## 保留与保护

Owner定保留本机隔离环境（含 `.runtime-*`、隔离库、凭据密文，已gitignore，只要求不泄露）。继续保护 Web vite.config.ts 在途改动、`smart_workflow_f1v4b`、用户8080/5173服务和秘密；Key/授权码不入Git。
