# 当前状态摘要

## 当前发布：0.1.6-release

2026-10-16｜L/VERIFYING（用户端交付验收重开）。0.1.6已发布并部署（发布事实保留）；Owner验收不通过：/workspace顶栏无应用中心。根因=用户端主导航默认派生缺项（非权限/缓存/版本）。Web `feature/application-center-user-entry`（develop新建）`c3cd686` 顶栏常驻应用中心＋`f9798cd` 按原型补列表搜索/每行数量与应用内目录表单导航＋内联数据列表；回读 `f9798cd…`；门禁 0／0e3w／1563+3／0。

复验：隔离库 sw_entry_fix＋临时普通用户（仅本人、无后台管理权限）四项；UAT chikaho.cn 中文顶栏四项、点击进入、目录/表单＋真实记录、刷新保持；UAT 前端=修复候选（`8853312f…`，备份 `web.bak-entryfix-20261016_1352` 可回滚），后端仍 0.1.6、库/健康未变、标签制品未动。

唯一下一动作：Owner/Planner 复核 `product/0.1.6-release/receipts/user-entry-fix-01.md` 并裁定是否需新正式版本；UAT 普通身份对照需授权。功能49、46/22/22、ADV64/57、P62延期/OFF保持。


## 已完成功能与历史基线

2026-10-16：应用中心与表单分类统一，L｜功能验收 PASSED（`planning-review-03-passed.md`）、**COMPLETED（规划已确认，2026-10-16）**。AC01—AC07通过、G1—G4关闭；终态同步回执 `product/application-center-form-classification/receipts/terminal-sync-01.md` 已提交。总4阶段：**4/0/0**（规划终审通过）。正式功能 **49**（=旧48+本功能1）；清单46/22/22=90、ADV64/问题57、P62延期/OFF保持；不新增/不核销P。应用中心终审已通过；主方向与终态方向均归档passed。

上轮 bugfix-20261013 **COMPLETED（规划已确认，2026-10-15）**：BF001—053，5阶段5/0/0；应用/部署0.1.5、开发默认0.1.5-SNAPSHOT。P64/P63 COMPLETED保持；P62批准功能COMPLETED、有限性能VERIFYING/Owner延期、策略OFF。持久权威 `knowledge/current-status.md`。


Owner补充：后端build-release.yml旧版本、前端eslint.config.js旧lowcode清单纳入0.1.6；Admin修工程配置与治理，验证产物版本及规则生效。见发布与delivery-lifecycle方向。
