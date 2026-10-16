# memory 使用说明

默认交付遵循Owner七步流程；仅明确不发版时在第三步结束。版本需用户确认，本轮0.1.6已确认。见 `product/delivery-lifecycle/ready/direction-owner-delivery-lifecycle.md`，新会话按constraints恢复。

## 当前发布：0.1.6-release

2026-10-16｜L/IN_PROGRESS；用户端修复Owner验收PASSED保持。Owner明确本次验收异常仍用0.1.6，授权覆盖该版本标签/Release及受影响制品，无需新版本确认。方向：product/0.1.6-release/ready/direction-release-016-acceptance-republish.md。

唯一下一动作：Executor保留旧0.1.6发布恢复点，将已验收Web e5aa357修复经develop→main集成，CI通过后更新0.1.6正式标签/Release/制品及既有部署，knowledge-first同步后提交release-016-03.md。仅覆盖本次0.1.6所需对象，不强推develop/main；无变化Server保持0.1.6。最近已知运行=后端0.1.6＋前端修复候选，正式覆盖尚待执行回执。总5阶段：前三项历史完成；④同版本修复覆盖发布进行中；⑤最终同步终审未完成。功能49、46/22/22=90、ADV64/57、P62延期/OFF保持。

