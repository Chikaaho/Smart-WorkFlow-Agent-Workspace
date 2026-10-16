# 当前状态摘要

## 当前发布：0.1.6-release

2026-10-16｜发布完成（L，待Planner终审）。总5阶段：①②③④⑤执行完毕。Git：Server `e115857`、Web `f91e8bf`（feature/release-016-ci-fix→develop→main，推送回读一致）；两仓CI success（Server sw-bootstrap 256/0/0/34、全仓汇总2046/0/0/34、制品version 0.1.6；Web四检通过）；成对语义tag/Release `0.1.6`（此前无、未覆盖既有）。修复：后端两项门禁测试改由测试源受控设施（缺设施显式失败、旧归因更正）；前端32项跨模块违规经7个adapters接缝（配置未改、规则未放宽）。UAT：0.1.5→0.1.6就地升级（S1脚本）、DB终点单条0.1.6（`-1768731444`）、零versioned重放、R__新增1单次执行；健康200、启动ERROR 0；可见最小链=应用中心(uncat-t0/2业务表单)→数据列表→发起→待办→Approve→Approved。正式功能49、46/22/22=90、ADV64/57、P62延期/OFF；发布/部署版本0.1.6。唯一下一动作：Planner复核`release-016-02.md`并下发唯一终态清单（终审）。限知：非超管受限视角数据权限对照未做；UAT新增验收数据待Owner处置。


## 已完成功能与历史基线

2026-10-16：应用中心与表单分类统一，L｜功能验收 PASSED（`planning-review-03-passed.md`）、**COMPLETED（规划已确认，2026-10-16）**。AC01—AC07通过、G1—G4关闭；终态同步回执 `product/application-center-form-classification/receipts/terminal-sync-01.md` 已提交。总4阶段：**4/0/0**（规划终审通过）。正式功能 **49**（=旧48+本功能1）；清单46/22/22=90、ADV64/问题57、P62延期/OFF保持；不新增/不核销P。应用中心终审已通过；主方向与终态方向均归档passed。

上轮 bugfix-20261013 **COMPLETED（规划已确认，2026-10-15）**：BF001—053，5阶段5/0/0；应用/部署0.1.5、开发默认0.1.5-SNAPSHOT。P64/P63 COMPLETED保持；P62批准功能COMPLETED、有限性能VERIFYING/Owner延期、策略OFF。持久权威 `knowledge/current-status.md`。


Owner补充：后端build-release.yml旧版本、前端eslint.config.js旧lowcode清单纳入0.1.6；Admin修工程配置与治理，验证产物版本及规则生效。见发布与delivery-lifecycle方向。
