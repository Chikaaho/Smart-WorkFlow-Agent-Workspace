# 当前状态摘要

## 当前发布：0.1.6-release

2026-10-16｜L/IN_PROGRESS，新增业务功能0。总5阶段：①②③完成；④发布阻塞修复已落地（后端受控测试设施＋前端adapters接缝）、续发与发布待完成；⑤发布后同步待完成。按 `product/0.1.6-release/ready/direction-release-016-unblock.md`（Owner已批准下发，替代旧"等待裁决"路由；release-016-01为本轮前态、未受影响项不重跑）续发：验证通过→修复分支→develop→main→两仓CI发布（版本0.1.6）→成对语义tag→UAT交付（先核库形态选S1/S2脚本）→发布后同步；回执release-016-02.md。版本无需再确认；不跳过失败测试、不放宽边界规则。后端失败主因已更正（默认构建无loopback provider装配为主要因果、资产缺失为并因）。正式功能49、46/22/22=90、ADV64/57、P62延期/OFF保持。


## 已完成功能与历史基线

2026-10-16：应用中心与表单分类统一，L｜功能验收 PASSED（`planning-review-03-passed.md`）、**COMPLETED（规划已确认，2026-10-16）**。AC01—AC07通过、G1—G4关闭；终态同步回执 `product/application-center-form-classification/receipts/terminal-sync-01.md` 已提交。总4阶段：**4/0/0**（规划终审通过）。正式功能 **49**（=旧48+本功能1）；清单46/22/22=90、ADV64/问题57、P62延期/OFF保持；不新增/不核销P。应用中心终审已通过；主方向与终态方向均归档passed。

上轮 bugfix-20261013 **COMPLETED（规划已确认，2026-10-15）**：BF001—053，5阶段5/0/0；应用/部署0.1.5、开发默认0.1.5-SNAPSHOT。P64/P63 COMPLETED保持；P62批准功能COMPLETED、有限性能VERIFYING/Owner延期、策略OFF。持久权威 `knowledge/current-status.md`。


Owner补充：后端build-release.yml旧版本、前端eslint.config.js旧lowcode清单纳入0.1.6；Admin修工程配置与治理，验证产物版本及规则生效。见发布与delivery-lifecycle方向。
