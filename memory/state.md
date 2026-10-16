# 当前状态摘要

## 当前发布：0.1.6-release

2026-10-16｜L/IN_PROGRESS；用户端修复Owner验收PASSED保持。Owner明确本次验收异常仍用0.1.6，授权覆盖该版本标签/Release及受影响制品，无需新版本确认。方向：product/0.1.6-release/ready/direction-release-016-acceptance-republish.md。

唯一下一动作：Executor保留旧0.1.6发布恢复点，将已验收Web e5aa357修复经develop→main集成，CI通过后更新0.1.6正式标签/Release/制品及既有部署，knowledge-first同步后提交release-016-03.md。仅覆盖本次0.1.6所需对象，不强推develop/main；无变化Server保持0.1.6。最近已知运行=后端0.1.6＋前端修复候选，正式覆盖尚待执行回执。总5阶段：前三项历史完成；④同版本修复覆盖发布进行中；⑤最终同步终审未完成。功能49、46/22/22=90、ADV64/57、P62延期/OFF保持。


## 已完成功能与历史基线

2026-10-16：应用中心与表单分类统一，L｜功能验收 PASSED（`planning-review-03-passed.md`）、**COMPLETED（规划已确认，2026-10-16）**。AC01—AC07通过、G1—G4关闭；终态同步回执 `product/application-center-form-classification/receipts/terminal-sync-01.md` 已提交。总4阶段：**4/0/0**（规划终审通过）。正式功能 **49**（=旧48+本功能1）；清单46/22/22=90、ADV64/问题57、P62延期/OFF保持；不新增/不核销P。应用中心终审已通过；主方向与终态方向均归档passed。

上轮 bugfix-20261013 **COMPLETED（规划已确认，2026-10-15）**：BF001—053，5阶段5/0/0；应用/部署0.1.5、开发默认0.1.5-SNAPSHOT。P64/P63 COMPLETED保持；P62批准功能COMPLETED、有限性能VERIFYING/Owner延期、策略OFF。持久权威 `knowledge/current-status.md`。


Owner补充：后端build-release.yml旧版本、前端eslint.config.js旧lowcode清单纳入0.1.6；Admin修工程配置与治理，验证产物版本及规则生效。见发布与delivery-lifecycle方向。
