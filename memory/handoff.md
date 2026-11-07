# 交接

2026-11-08｜Planner（审查04）｜0.3.1 返修不通过，下发 H1—H5。

## 当前

三示例流程返修（目标 0.3.1）：**规划审查04 **不通过**（`product/three-sample-process-uat/receipts/planning-review-04.md`）：流转机制 a—e 锁定；H1 详情/流转记录不显示结构化意见、H2 意见过简且未贴原文、H3 实例数据带版本号/验证口吻且 B P0 与 4.6% 偏离矛盾、C 阈值非 75/80/85、H4 `<p>` 标签/部门只显示“已选择”/单选折行/标签重复、H5 A 需补充缺截图。返修入口 `receipts/planning-execution-prompt-three-sample-03.md`，改代码发 0.3.2。**原执行侧：方向 `product/three-sample-process-uat/ready/direction-approval-comment-rework-031.md`；回执 `product/three-sample-process-uat/receipts/execution-final-04.md`；登记 `knowledge/features/0.3.1-approval-driven-flow.md`。平台改动：意见→流程变量 + `nodeOpinions` 注入 + 会签聚合（Server `83045569`/`1fc035fc`/`1ce7b3bc`/`6a113431`；`de66f1d0` 版本收敛、`9ba59e97` 断言对齐）；main `452178d8`、tag `0.3.1`、Release `437557325`（bootstrap-0.3.1.jar 220,861,064 B sha256 `9379195e…`）、UAT `build.version=0.3.1` health UP；Web 无改动保持 0.3.0；0.3.0 tag 未动。UAT：17 意见表单 PUBLISHED、三图 A v9/B v9/C v11、触发器 2 条、角色修正（技术委员会 3 人、应急负责人王芳）；8 条意见驱动路径全部 APPROVED（A `YJ-20261107-004` 调整窗口/`003` 退回；B `XY-20261107-008` 误报/`011` P0 上报/`010` 督办；C `MES-20261107-009` 校准/`010` 维修/`011` 复产）。应用包 UAT 导出覆盖 `assets/`（`systemVersion=0.3.1`，66,734 B；缺意见表单定义/触发器脚本/Agent 图/IoT 规则与渠道凭据）。返修七阶段**3/1/3**。唯一下一动作：**Executor 按执行提示03 返修 H1—H5**。 上一交付 0.2.4 COMPLETED（7/0/0），方向归档 `product/0.2.4/passed/`。

## 0.3.0（历史，终态同步后被 Owner 退回）

过程：方向→执行 01/02/03→审查 01/02/03 PASSED→终态同步 01→终审 COMPLETED（7/0/0）→**同日 Owner 审核退回**（意见过简、未用意见/变量/脚本），`COMPLETED` 撤回，发布事实不回滚。交付与配置快照 `knowledge/features/0.3.0-three-sample-processes.md`（含应用包不含的 Agent 图 v7 与 IoT 规则映射）。发布：Server `a0ac3a1a`、Web `420e0f9`，UAT 0.3.0。


## 0.2.4（历史）

过程：方向→执行01方案/02自验→审查01（7过7未过）→提示01→执行03→审查02（剩3）→提示02→执行04→审查03 PASSED→Owner确认版本0.2.4、功能51→终态同步01+发布链02→终审COMPLETED。能力：IoT规则启动Agent研判、失败升级（级别+双渠道）、Agent内部工具、渠道凭据密文、规则页研判参数；修MQTT订阅/租户上下文/通知前缀/GET入参等缺陷。发布：Server main `41511bd4`、Web main `f4acc3d`，全量2404测试0失败，UAT Flyway v0.2.9。

常规决定：截图本机留存不入Git；执行列表无菜单、冷却抑制、mes_judge_config不参与判定按已登记边界处理。

## 保留与保护

Owner定保留本机隔离环境（`smart_workflow_lc023_01`、`smart_workflow_024_01`、`.lc023-mock/lc023-server-wt`、`.runtime-lc023`、`.runtime-lc024`），已gitignore，只要求不泄露。继续保护Web vite.config.ts在途改动、`smart_workflow_f1v4b`、用户8080/5173服务和秘密。

## 0.2.3（历史）

COMPLETED，7/0/0，功能保持50（Owner确认）。终态复核 `product/0.2.3/receipts/planning-final-review-023-completed.md`。
