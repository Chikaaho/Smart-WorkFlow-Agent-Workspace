# 当前交接：0.1.6 用户端入口修复已交付候选（待 Owner 复验与版本裁定）

默认交付遵循Owner七步流程；仅明确不发版时在第三步结束。版本需用户确认，本轮0.1.6已确认。见 `product/delivery-lifecycle/ready/direction-owner-delivery-lifecycle.md`，新会话按constraints恢复。

## 当前发布：0.1.6-release

2026-10-16｜L/IN_PROGRESS；用户端修复Owner验收PASSED保持。Owner明确本次验收异常仍用0.1.6，授权覆盖该版本标签/Release及受影响制品，无需新版本确认。方向：product/0.1.6-release/ready/direction-release-016-acceptance-republish.md。

唯一下一动作：Executor保留旧0.1.6发布恢复点，将已验收Web e5aa357修复经develop→main集成，CI通过后更新0.1.6正式标签/Release/制品及既有部署，knowledge-first同步后提交release-016-03.md。仅覆盖本次0.1.6所需对象，不强推develop/main；无变化Server保持0.1.6。最近已知运行=后端0.1.6＋前端修复候选，正式覆盖尚待执行回执。总5阶段：前三项历史完成；④同版本修复覆盖发布进行中；⑤最终同步终审未完成。功能49、46/22/22=90、ADV64/57、P62延期/OFF保持。


## 已完成功能与历史基线

2026-10-16：应用中心与表单分类统一，L｜功能验收 PASSED（`product/application-center-form-classification/receipts/planning-review-03-passed.md`）、**COMPLETED（规划已确认，2026-10-16）**。终态回执 `receipts/terminal-sync-01.md`（覆盖矩阵+AC-VB01—04+memory压缩+Git回读）。总4阶段 **4/0/0**。正式功能 **49**=旧48+本功能1；90项46/22/22零升降、ADV64/57、P62延期/OFF保持；不新增/不核销P。主方向与终态方向均归档passed。应用中心终审已通过，发布任务见上方。

正式验证集合 AC-VB01—04（定义见终态方向）：Server form-biz 209/0/0/0（G2一致性7为子集）；Web `74d4be3` typecheck/lint/vitest1549+3/build沿用；H2全链17/PG12/承接6、连续性4+1；execution-01全仓2072/3/0/27失败保持历史时点。本功能未发布未部署（0.1.5与0.1.5-SNAPSHOT、无tag/Release）；不写Owner体验已通过。

## 上轮已完成基线（0.1.5）

bugfix-20261013 **COMPLETED（规划已确认，2026-10-15）**：BF001—053共53项Owner关闭；5阶段5/0/0；应用/部署0.1.5、开发默认0.1.5-SNAPSHOT；正式验证集合BF015-VB01—04（Server 2051/3/0/27失败保留、Web四检、种子/升级/回滚、UAT可见会话）；功能登记48（本列车新增0）、46/22/22=90、ADV64/57保持。主方向与发布方向归档 `product/bugfix-20261013/passed/`；裁决 close-01。P64/P63 COMPLETED保持；P62延期/OFF。


Owner补充：后端build-release.yml旧版本、前端eslint.config.js旧lowcode清单纳入0.1.6；Admin修工程配置与治理，验证产物版本及规则生效。见发布与delivery-lifecycle方向。
