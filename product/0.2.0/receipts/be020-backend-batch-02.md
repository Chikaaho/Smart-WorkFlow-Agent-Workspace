# be020 后端补充批次完成回执（G1/G2 行为闭合）

2026-10-24｜Executor（后端）｜XL｜自验通过，待规划第二轮复核

总 7 阶段：已完成 1「需求评估」；进行中 1「分支实施」；未开始 5「验收同步、合并、发布、发布后同步、结束」。本回执是 0.2.0 后端补充任务01（BE020-G1/G2）的完成回执；明细见 `receipts/backend/be020-supplement-01.md`，先轮批次回执 `be020-backend-batch-01.md` 历史保留。

## 交付摘要

- **BE020-G1（设计预览/运行授权）**：`GET /form/ext/query` 按请求形态区分准入——设计预览检查当前授权（撤权后直接构造预览 1220 拒绝）；已发布运行读取走新入参 `formKey+fieldKey`（发布绑定 + 字段查看资格，不追溯原设计者授权）；提交期对象解析不回查设计授权。错误码 1220 语义扩展，旧新输入/输出与准入解释已写入明细回执供前端对齐。
- **BE020-G2（终态监听阶段）**：`TriggerExecutionService.onProcessCompleted` 按 DR07 区分——旧配置（缺 enabled）保持同事务；新配置（显式 enabled）终态提交后经独立短事务评估，失败不回滚终态、回滚零外发。终态事件映射表已列明（PROCESS_COMPLETED 仅 APPROVED；与 DR07「保持旧语义」一致，如需覆盖 REJECTED 属产品口径，交 Planner）。

## 实施与验证摘要

- 实际修改：Server 6 文件（`FormExtDataService`/`FormExtDataController`、`TriggerExecutionService`、G2 harness 测试装配、新增 `FormExtQueryAdmissionTest` 9 项与 `TriggerTerminalCommitPhaseTest` 5 项）。行为证据使用真实事务边界、真实 H2 持久数据（生产同 DDL：`sw_bpm_trigger_exec`、`sw_bpm_ext_datasource_grant`）与真实授权持久读取，无始终放行桩；外部命令队列为受控观察桩，脚本求值按既有隔离门禁用桩。
- 验证（`MAVEN_OPTS=-Xmx2g`，exit 0）：form-biz **242/0/0/0**、bpm-process **466/0/0/0**；engine 175 与迁移链（PG 12+H2 1）本轮未触及，沿原证据承接。原文 `/tmp/g1g2-full-final.log`、`/tmp/g1-admission-test.log`、`/tmp/g2-phase-test.log`（本机 Temp 留存）。
- Git：`b3aadbe974e91b7c03588b0e5d8ac32c2076708a`（普通推送，远端 `origin/codex/0.2.0-tenant-form-flow` 回读同 SHA，6 文件 +1089/-14；前置快照 `6c03afb7`）。根仓仍由前端集成负责人统一收尾。

## 对照补充任务的完成条件

| 项 | 完成条件 | 结果 |
| --- | --- | --- |
| G1 | 有权设计者可预览；撤权后直接构造同 queryKey 预览拒绝；登记/发布拒绝有效；运行读取需发布绑定+字段资格；无管理权/跨租户的 grants 替换与契约启停拒绝且零变更 | 全部有真实服务端行为结果（9 项准入用例 + 既有单测），明细回执逐项列表 |
| G2 | 新配置终态提交后受控副作用；回滚不外发；监听失败不撤销终态；重复投递不重复成功效果、重试仅补失败/未执行；旧配置保持原事务阶段；禁用/顺序/快照承接；终态映射按 DR07 核实 | 5 项真实事务行为用例 + 既有 23 项承接 + 映射表（明细回执） |

## 边界与下一动作

- 等待规划第二轮复核（同项两轮规则内）；自验不裁决整版 PASSED/COMPLETED。
- 前端运行读取入参对齐（formKey+fieldKey）为对接项，不阻塞其余契约消费。
- 独立密钥版本化、三种新节点语义、富文本格式交接仍为规划/协作待办，未冒称完成。
