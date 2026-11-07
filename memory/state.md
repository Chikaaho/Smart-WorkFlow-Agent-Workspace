# 当前状态摘要

2026-11-08｜Planner（审查04）｜0.3.1 返修不通过，下发 H1—H5。

## 当前任务

三示例流程返修（目标 0.3.1）：**规划审查04 **不通过**（`product/three-sample-process-uat/receipts/planning-review-04.md`）：流转机制 a—e 锁定；H1 详情/流转记录不显示结构化意见、H2 意见过简且未贴原文、H3 实例数据带版本号/验证口吻且 B P0 与 4.6% 偏离矛盾、C 阈值非 75/80/85、H4 `<p>` 标签/部门只显示“已选择”/单选折行/标签重复、H5 A 需补充缺截图。返修入口 `receipts/planning-execution-prompt-three-sample-03.md`，改代码发 0.3.2。**原执行侧：方向 `product/three-sample-process-uat/ready/direction-approval-comment-rework-031.md`；回执 `product/three-sample-process-uat/receipts/execution-final-04.md`；交付登记 `knowledge/features/0.3.1-approval-driven-flow.md`。平台改动：意见→流程变量（`opinion`/`opinion_<字段>`/`formData` 回写）+ `nodeOpinions` 注入 + 会签聚合 `opinionAgg_*`（Server `83045569`/`1fc035fc`/`1ce7b3bc`/`6a113431`，测试 520/0）；版本收敛 `de66f1d0`、断言对齐 `9ba59e97`；main `452178d8`、tag `0.3.1`、Release `437557325`（jar 220,861,064 B sha256 `9379195e…`）、UAT build.version=0.3.1 health UP；**Web 无改动保持 0.3.0**；0.3.0 tag 未动。UAT 配置：17 意见表单 PUBLISHED、三图 A v9/B v9/C v11、触发器 2 条、角色修正（技术委员会 3 人、应急负责人王芳）。UAT 8 条意见驱动路径全部 APPROVED：A `YJ-20261107-004`（调整窗口，预约 due 2026-11-08 23:30）/`003`（退回）、B `XY-20261107-008`（误报）/`011`（P0 上报学校）/`010`（超时督办）、C `MES-20261107-009`（强制校准）/`010`（维修）/`011`（复产）。截图本机 `.runtime-030/uat-shots-031/`（不入 Git）。应用包 UAT 导出覆盖 `assets/`（`systemVersion=0.3.1`；缺意见表单定义/触发器脚本/Agent 图/IoT 规则与渠道凭据）。返修七阶段**3/1/3**。唯一下一动作：**Executor 按执行提示03 返修 H1—H5**。P60旧0.3.0绑定作废、发布顺延。

上一交付：0.2.4 `COMPLETED`，七阶段7/0/0；终态复核 `product/0.2.4/receipts/planning-final-review-024-completed.md`，第51个正式功能。

## 基线

功能51（0.3.0/0.3.1 均不新增正式功能）；M59/18/13=90；ADV1/7/56=64；实际P63；问题57；正式基线变更[]。已核销P2/P4/P9/P15/P19/P29/P34/P47/P65，P35部分；P20未核销。

正式/部署版本0.3.0（返修覆盖后），Flyway V0.2.9（无新迁移）；tag `0.3.0` 指向 Server `a0ac3a1a`/Web `420e0f9`，语义Release latest=0.3.0（资产为返修 CI 制品，说明含覆盖记录）。本地全量2413/0/0/32（返修+2例）；UAT启动167.774s、health UP、build.version=0.3.0、磁盘余931M（96%）。

Owner定：本机隔离环境（`smart_workflow_lc023_01`、`smart_workflow_024_01`、`smart_workflow_030`、`.lc023-mock`、`.runtime-lc023`、`.runtime-lc024`、`.runtime-030`）保留不删，含凭据密文，只要求不泄露，已gitignore。e2fe50f7历史凭据文件为本地产物，不改写历史。Key/授权码不入Git。

Owner侧供应商：OpenRouter（Embedding text-embedding-3-small、联网搜索`:online`）、Command Code（LLM）、163 SMTP；Key由Owner录入，不进文档。

## 后续候选（需求池观察区）

CI偶发失败族（Notify I6G1、H2跨测试污染等）；UAT磁盘余量；知识库写权限粒度；短信电话渠道（未采购）；Agent逐节点进度事件；P20。

## 教训

0.2.3：search只补决策缺失信息；进度按整版七阶段报；同项第3轮先审口径。0.2.4：给执行的替代路线先核前提是否存在（示例一导入包不存在导致X-02②多一轮）；隔离库克隆自旧库时供应商配置可能缺失，真实链路须写明来源。
