# 当前交接：0.1.6 用户端入口修复已交付候选（待 Owner 复验与版本裁定）

默认交付遵循Owner七步流程；仅明确不发版时在第三步结束。版本需用户确认，本轮0.1.6已确认。见 `product/delivery-lifecycle/ready/direction-owner-delivery-lifecycle.md`，新会话按constraints恢复。

## 当前发布：0.1.6-release

2026-10-16｜L/VERIFYING（用户端交付验收重开）。0.1.6已发布并部署（发布事实保留）；Owner验收不通过：/workspace顶栏无应用中心。根因=用户端主导航默认派生缺项（非权限/缓存/版本）。Web `feature/application-center-user-entry`（develop新建）`c3cd686` 顶栏常驻应用中心＋`f9798cd` 原型页（列表搜索/每行数量、应用内目录树＋内联数据列表）＋`e5aa357` 去全局侧栏/白底目录栏；回读 `e5aa357…`；门禁 0／0e3w／1563+3／0。

复验：隔离库 sw_entry_fix＋临时普通用户（仅本人、无后台管理权限）四项；UAT chikaho.cn 中文顶栏四项、点击进入、目录/表单＋真实记录、刷新保持、无全局侧栏且目录栏白底；UAT 前端=修复候选（`858ffc22…`，备份 `web.bak-entryfix-20261016_1352` 可回滚），后端仍 0.1.6、库/健康未变、标签制品未动。

唯一下一动作：Owner/Planner 复核 `product/0.1.6-release/receipts/user-entry-fix-01.md` 并裁定是否需新正式版本；UAT 普通身份对照需授权。功能49、46/22/22、ADV64/57、P62延期/OFF保持。


## 已完成功能与历史基线

2026-10-16：应用中心与表单分类统一，L｜功能验收 PASSED（`product/application-center-form-classification/receipts/planning-review-03-passed.md`）、**COMPLETED（规划已确认，2026-10-16）**。终态回执 `receipts/terminal-sync-01.md`（覆盖矩阵+AC-VB01—04+memory压缩+Git回读）。总4阶段 **4/0/0**。正式功能 **49**=旧48+本功能1；90项46/22/22零升降、ADV64/57、P62延期/OFF保持；不新增/不核销P。主方向与终态方向均归档passed。应用中心终审已通过，发布任务见上方。

正式验证集合 AC-VB01—04（定义见终态方向）：Server form-biz 209/0/0/0（G2一致性7为子集）；Web `74d4be3` typecheck/lint/vitest1549+3/build沿用；H2全链17/PG12/承接6、连续性4+1；execution-01全仓2072/3/0/27失败保持历史时点。本功能未发布未部署（0.1.5与0.1.5-SNAPSHOT、无tag/Release）；不写Owner体验已通过。

## 上轮已完成基线（0.1.5）

bugfix-20261013 **COMPLETED（规划已确认，2026-10-15）**：BF001—053共53项Owner关闭；5阶段5/0/0；应用/部署0.1.5、开发默认0.1.5-SNAPSHOT；正式验证集合BF015-VB01—04（Server 2051/3/0/27失败保留、Web四检、种子/升级/回滚、UAT可见会话）；功能登记48（本列车新增0）、46/22/22=90、ADV64/57保持。主方向与发布方向归档 `product/bugfix-20261013/passed/`；裁决 close-01。P64/P63 COMPLETED保持；P62延期/OFF。


Owner补充：后端build-release.yml旧版本、前端eslint.config.js旧lowcode清单纳入0.1.6；Admin修工程配置与治理，验证产物版本及规则生效。见发布与delivery-lifecycle方向。
