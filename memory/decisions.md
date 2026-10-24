# 近期有效决策摘要

## 0.2.0 当前安排（2026-10-24）

Owner要求前后端两个执行会话并行；前端先完善统一主题，默认蓝色，保留明确用户偏好，恢复默认为蓝色。前端负责Figma/可见联调及根共享状态收尾，后端按文字产品契约实施。当前入口 product/0.2.0/ready/direction-parallel-020.md。七阶段1/1/5，局部中间验收不核销P或晋级正式基线；历史发布记录按各自时点理解。

## Owner默认交付流程（2026-10-16）

后续固定：①新需求评估→②执行并从develop拉新分支→③验收与信息同步→④开发分支→develop→main（develop内按发布要求压缩种子/版本收敛）→⑤发版，版本必须用户确认→⑥再次同步信息→⑦结束。只有Owner明确“不发版”，才在③结束；版本未给不等于不发版。已确认版本不重复询问，本轮0.1.6已确认。第三步业务功能完成不等于默认交付结束；维持风险分级与角色边界。完整裁决：`product/delivery-lifecycle/ready/direction-owner-delivery-lifecycle.md`。

## 历史发布：0.1.6-release

2026-10-16｜0.1.6-release COMPLETED（规划已确认）。用户验收、发布复核与终态同步均通过，最终裁决：product/0.1.6-release/receipts/planning-final-review-terminal-sync-01-completed.md。两端正式及部署版本0.1.6：Web发布来源e5aa357（同版本覆盖）、Server e115857；验证集合R016-VB01—04，五份方向均归档passed/。

总5阶段5/0/0：develop、种子版本、main、发布及用户验收、最终同步均完成。无剩余发布动作，等待新需求。功能49、46/22/22=90、ADV64/57、P62延期/OFF保持，活动业务功能无。普通用户权限隔离环境通过，UAT管理员范围保留。后续Server文档CI38865882855有2项已知时序失败，不影响正式制品，稳定性加固另列待办。最终裁决向knowledge等入口的机械传播已授权，不重复验收。


## 已完成功能与历史基线

2026-10-16：应用中心与表单分类统一 **COMPLETED（规划已确认，2026-10-16）**；正式功能 **49**（=旧48+本功能1）。G2权限收尾闭环（execution-03核实：导入/导出公共守卫、模板仅结构披露、ext独立租户数据面、recordOwner归属通道仅服务端编排可达且HTTP不透传）；功能验收 PASSED（审查03），AC-VB01—04为正式验证集合；管理权不授予数据旁路。主方向与终态方向均归档passed。

2026-10-13：P64 **COMPLETED（规划已确认，2026-10-13）**、批准范围核销；三阶段完成3/0/0。P62批准功能COMPLETED、有限性能VERIFYING/Owner延期、策略OFF保持。

- **当前计数**：正式功能49；清单46/22/22=90零升降；ADV64、问题57保持；不新增/不核销P编号。
- 当前状态与历史物理分离；当前值只见 `knowledge/current-status.md`（历轮长条目迁 `knowledge/history/`）；终态机器契约单一源 `.codex/governance/terminal-contract.json`。
- Planner以 `memory/` 最小摘要恢复；冲突时按knowledge权威修正，不反向裁决。
- P62：批准功能COMPLETED（2026-10-06）；有限性能三轮未过/VERIFYING、Owner搁置为已知延期（2026-10-12；未来方向=带权参数配置、后台可配置每租户优先级）、策略OFF。
- P63边界：手工并行兼容=Owner硬边界；预约=成功完成后一次性、显式时区（歧义/不存在拒绝）、到期不补发、窗口1—3600s默认60；UNKNOWN禁自动重发；全部收敛≠全部成功。
- P64边界：受控HTTP层级/异步对账观察非性能或物理承诺；数量关闭与报废去向以实例node-form-data查回。
- P60/I3—I6裁决保持：bpmn-js移出生产依赖；I4受控真实HTTP对端；I5钉钉/飞书PASSED、企业微信Owner延期；I6通知以持久化为权威、五渠道Owner延期/未验证（P37/P38/P39不核销）。
- P61：`errorKey`消歧、公共msg不承载原始诊断、zh-CN/en-US防枚举。
- BAO：动态宽表SQL唯一受控入口 `DynamicTableSql`（fail closed）；引擎与业务写入共享提交边界；生产IoT缺省时503 fail closed；`${revision}`双版本机制继续生效；PG为生产权威。
- 0.1.5发布列车bugfix-20261013 **COMPLETED（规划已确认，2026-10-15）**；0.1.3为历史发布（Owner已验收，2026-09-30）；0.1.0发布身份锁定，不重复发布。

