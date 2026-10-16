# 近期有效决策摘要

## Owner默认交付流程（2026-10-16）

后续固定：①新需求评估→②执行并从develop拉新分支→③验收与信息同步→④开发分支→develop→main（develop内按发布要求压缩种子/版本收敛）→⑤发版，版本必须用户确认→⑥再次同步信息→⑦结束。只有Owner明确“不发版”，才在③结束；版本未给不等于不发版。已确认版本不重复询问，本轮0.1.6已确认。第三步业务功能完成不等于默认交付结束；维持风险分级与角色边界。完整裁决：`product/delivery-lifecycle/ready/direction-owner-delivery-lifecycle.md`。

## 当前发布：0.1.6-release

2026-10-16｜L/VERIFYING（用户端交付验收重开）。0.1.6已发布并部署（发布事实保留）；Owner验收不通过：/workspace顶栏无应用中心。根因=用户端主导航默认派生缺项（非权限/缓存/版本）。Web `feature/application-center-user-entry`（develop新建）`c3cd686` 顶栏常驻应用中心＋`f9798cd` 原型页（列表搜索/每行数量、应用内目录树＋内联数据列表）＋`e5aa357` 去全局侧栏/白底目录栏；回读 `e5aa357…`；门禁 0／0e3w／1563+3／0。

复验：隔离库 sw_entry_fix＋临时普通用户（仅本人、无后台管理权限）四项；UAT chikaho.cn 中文顶栏四项、点击进入、目录/表单＋真实记录、刷新保持、无全局侧栏且目录栏白底；UAT 前端=修复候选（`858ffc22…`，备份 `web.bak-entryfix-20261016_1352` 可回滚），后端仍 0.1.6、库/健康未变、标签制品未动。

唯一下一动作：Owner/Planner 复核 `product/0.1.6-release/receipts/user-entry-fix-01.md` 并裁定是否需新正式版本；UAT 普通身份对照需授权。功能49、46/22/22、ADV64/57、P62延期/OFF保持。

本轮决策：入口属前端主导航职责（不以后台菜单/侧栏替代、不要求后台表单管理权限）；修复走普通分支推送、不覆盖已公开 0.1.6 标签制品；UAT 前端以可恢复通道部署候选并保留回滚；新版本由 Owner 裁定。


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

