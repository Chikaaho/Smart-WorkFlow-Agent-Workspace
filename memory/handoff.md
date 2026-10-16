# 当前交接：0.1.6 发布续发中（两侧阻塞修复已落地）

默认交付遵循Owner七步流程；仅明确不发版时在第三步结束。版本需用户确认，本轮0.1.6已确认。见 `product/delivery-lifecycle/ready/direction-owner-delivery-lifecycle.md`，新会话按constraints恢复。

## 当前发布：0.1.6-release

2026-10-16｜L/IN_PROGRESS，新增业务功能0。总5阶段：①②③完成；④发布阻塞修复已落地（后端受控测试设施＋前端adapters接缝）、续发与发布待完成；⑤发布后同步待完成。按 `product/0.1.6-release/ready/direction-release-016-unblock.md`（Owner已批准下发，替代旧"等待裁决"路由；release-016-01为本轮前态、未受影响项不重跑）续发：验证通过→修复分支→develop→main→两仓CI发布（版本0.1.6）→成对语义tag→UAT交付（先核库形态选S1/S2脚本）→发布后同步；回执release-016-02.md。版本无需再确认；不跳过失败测试、不放宽边界规则。后端失败主因已更正（默认构建无loopback provider装配为主要因果、资产缺失为并因）。正式功能49、46/22/22=90、ADV64/57、P62延期/OFF保持。


## 已完成功能与历史基线

2026-10-16：应用中心与表单分类统一，L｜功能验收 PASSED（`product/application-center-form-classification/receipts/planning-review-03-passed.md`）、**COMPLETED（规划已确认，2026-10-16）**。终态回执 `receipts/terminal-sync-01.md`（覆盖矩阵+AC-VB01—04+memory压缩+Git回读）。总4阶段 **4/0/0**。正式功能 **49**=旧48+本功能1；90项46/22/22零升降、ADV64/57、P62延期/OFF保持；不新增/不核销P。主方向与终态方向均归档passed。应用中心终审已通过，发布任务见上方。

正式验证集合 AC-VB01—04（定义见终态方向）：Server form-biz 209/0/0/0（G2一致性7为子集）；Web `74d4be3` typecheck/lint/vitest1549+3/build沿用；H2全链17/PG12/承接6、连续性4+1；execution-01全仓2072/3/0/27失败保持历史时点。本功能未发布未部署（0.1.5与0.1.5-SNAPSHOT、无tag/Release）；不写Owner体验已通过。

## 上轮已完成基线（0.1.5）

bugfix-20261013 **COMPLETED（规划已确认，2026-10-15）**：BF001—053共53项Owner关闭；5阶段5/0/0；应用/部署0.1.5、开发默认0.1.5-SNAPSHOT；正式验证集合BF015-VB01—04（Server 2051/3/0/27失败保留、Web四检、种子/升级/回滚、UAT可见会话）；功能登记48（本列车新增0）、46/22/22=90、ADV64/57保持。主方向与发布方向归档 `product/bugfix-20261013/passed/`；裁决 close-01。P64/P63 COMPLETED保持；P62延期/OFF。


Owner补充：后端build-release.yml旧版本、前端eslint.config.js旧lowcode清单纳入0.1.6；Admin修工程配置与治理，验证产物版本及规则生效。见发布与delivery-lifecycle方向。
