# 近期有效决策摘要

## Owner默认交付流程（2026-10-16）

后续固定：①新需求评估→②执行并从develop拉新分支→③验收与信息同步→④开发分支→develop→main（develop内按发布要求压缩种子/版本收敛）→⑤发版，版本必须用户确认→⑥再次同步信息→⑦结束。只有Owner明确“不发版”，才在③结束；版本未给不等于不发版。已确认版本不重复询问，本轮0.1.6已确认。第三步业务功能完成不等于默认交付结束；维持风险分级与角色边界。完整裁决：`product/delivery-lifecycle/ready/direction-owner-delivery-lifecycle.md`。

## 当前发布：0.1.6-release

2026-10-16｜L/READY（发布任务，新增业务功能0）。Owner指定顺序：两仓feature/application-center→develop→压缩0.1.6种子→main→发版。方向：`product/0.1.6-release/ready/direction-release-016.md`。

总5阶段：合入develop、种子压缩与版本收敛、合入main、0.1.6发版、当前信息同步与终审，发布前摘要为均未开始（0/0/5），实际在途状态待回传。唯一下一动作：Executor核实实际三仓发布输入并合入develop，依赖满足后连续推进；最终回执release-016-01。正式功能49、清单46/22/22=90、ADV64/57、P62延期/OFF保持。发布前最近核实版本为0.1.5，0.1.6实际发布/部署结果待回传；后续实际发布与部署分别回读。

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

2026-10-16恢复核对：治理七步规则已纳入system.md§3.0；0.1.6保留原五阶段和已确认版本。发布目录本次尚无执行回执，以上0/0/5为发布前摘要，实际在途进度待执行侧回传；只读请求 `search_task/release-016-progress-readback-20261016.md` 不阻断原发布流程。既有唯一实施入口仍为direction-release-016.md。
