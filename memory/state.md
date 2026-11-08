# 当前状态摘要

2026-11-08｜Planner（P66 审查 b2-01）｜P66 B2 第一批有条件通过，DM8 待 Owner 材料；三示例流程 COMPLETED。

## 当前任务

三示例流程返修（0.3.1—0.3.6）功能 **`COMPLETED`**（规划审查07 `product/three-sample-process-uat/receipts/planning-review-07-passed.md`，H1—H9 锁定）；终态同步按 `passed/direction-terminal-sync-036.md` 唯一值清单完成，回执 `receipts/terminal-sync-036-01.md`。规划终态复核已通过。

- **交付**：意见写入流程变量（`opinion`/`opinion_<字段>`/`formData` 回写）、会签聚合 `opinionAgg_*`、触发器 `nodeOpinions` 注入；三流程意见驱动分支与处理人（A 需补充/高风险加签/停机>240 加副总/调整窗口改预约/现场总指挥；B 误报/现场处置人/超时督办/上报范围；C 原因分类/指派维修人/偏差>3℃ 强制校准/停机复产）；意见展示（结构化字段、摘要“标签：值”、抽屉、会签弹窗）；只读 JSON 中文映射 `jsonDisplay` + 原文权限门禁。登记 `knowledge/features/0.3.2-opinion-display.md`。
- **最终证据实例**：A1 `YJ-20261108-008/009`、A2 `YJ-20261108-006`、B1 `XY-20261108-015`、B2 `XY-20261108-013`、B3 `XY-20261108-014`、C1 `MES-20261108-015`、C2 `MES-20261108-016`。

七阶段 **7/0/0**。三示例流程线结束（终态复核 `product/three-sample-process-uat/receipts/planning-final-review-036-completed.md`）。唯一下一动作见 P66。

**P66 多数据库兼容**（XL，目标 0.4.0）：阶段 A 有条件通过，B0、B1 通过；B2 第一批有条件通过（`product/multi-database-compat/receipts/planning-review-b2-01.md`：MySQL 5.7/8.0、Oracle 21c XE 迁移+种子 0 差异，单库验收待补 S3；S1 R5 与 UAT 事实矛盾待核；DM8 卡授权已提请 Owner），Server `21da4cea`，唯一下一动作 **Executor B2 第二批（S1/S2 先答，openGauss→SQL Server→MariaDB）**，回执 `execution-b2-02.md`。

## 基线

功能51（不登记新功能）；M59/18/13=90；ADV1/7/56=64；实际P63；问题57；正式基线变更[]。已核销P2/P4/P9/P15/P19/P29/P34/P47/P65，P35部分；P20未核销。

正式/部署版本：Web **0.3.6**（tag `0.3.6`=`c3f1d6e`，Release `438126185`），Server **0.3.2**（tag `0.3.2`=`de8ec017`，Release `437820040`）；Flyway V0.2.9。UAT health UP、build.version=0.3.2、Web 入口 `assets/index-CKdiXkhU.js`、磁盘余约822M（96%）。应用包维持 `systemVersion=0.3.2`。

Owner定：本机隔离环境（`smart_workflow_030`、`.runtime-030` 等清单见 handoff）保留不删，含凭据密文，只要求不泄露，已gitignore。Key/授权码不入Git。

## 后续候选（需求池观察区）

设计器映射编辑框只对 JSON 场景显示；演示实例按真实节奏分时审批；UAT 磁盘 96%；CI偶发失败族（Notify I6G1、H2跨测试污染等）；知识库写权限粒度；短信电话渠道（未采购）；Agent逐节点进度事件；P20。

## 教训

0.3.x：审查要逐字核对表单数据内部一致性；用户可见英文编码一律判不通过；「我的实例」只含发起实例（admin 403 非参与实例，双视角需自建）。0.2.3：search只补决策缺失信息；进度按整版七阶段报；同项第3轮先审口径。0.2.4：给执行的替代路线先核前提是否存在；隔离库克隆自旧库时供应商配置可能缺失，真实链路须写明来源。
