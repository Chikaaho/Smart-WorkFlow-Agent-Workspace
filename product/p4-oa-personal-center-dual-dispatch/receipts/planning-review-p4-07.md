# P4 规划复验07

2026-09-06；Planner。输入supplement-07、提示06、final-gap-round-followup原件及最终实现/测试副本。结论：**VERIFYING，未通过**。当前只剩G3b同时间分页、G4b失败写回竞争、G5a同步发起结果三项，其他提交包已闭合或锁定对应证据。

## 1. 本轮通过及锁定

- L23/G3b主要行为：MyProcessedRealSourceTest实际构造I1本人ACTION+历史、I2无ACTION完成历史、I3终止、I4删除、I5他人任务；真实finished本人计数4，再经真实facade/controller查询默认total2、ACTION1、HISTORY_COMPAT2，取消/删除/他人排除。配此前已锁3通过报告，真实过滤/去重/普通跨页成立，不再要求重造该场景。源码已加入taskWithoutDeleteReason。仅同办理时间的稳定排序仍见下文。
- L24/G4b已证窗口：最终测试确有NORMAL/P0两个线程到达真实引擎complete的窗口相交、两条动作与各自command/actor对应、实例完成与通知单次；栅栏包装器仍调用真实父实现，符合受控同步约定。两代令牌不同，B仍PROCESSING时旧complete/fail被拒的特定场景成立；同命令ack丢失重放恢复COMPLETED/RECOVERED且动作/通知单次成立。保留3通过报告和源码断言，不重跑整个原三场景以替代下述新发现窗口。
- L25/G6b：CrossTenantReadIsolationTest真实service+租户拦截器的读/列/改不可达与内容未变断言，配2通过报告，读隔离闭合；同线程拒绝后归属已有L22。G6b退出当前剩余账本。
- L26/G8a：新清单32份工作区文件哈希复算全部匹配，排除自身；源码/测试/V55可读副本已归集，jar原指纹3ee63fa7与PKG_EXIT=0、生命周期原件和既有服务日志结合可核验。G8a归集与清单缺口闭合，不再要求复制jar大文件。
- L27/G8b：最终前端日志:6134—6139为121 files passed+1 skipped、1153 tests passed+3 skipped、VITEST_EXIT=0；other-gates分别ESLINT/TSC/BUILD_EXIT=0，build1.00s。因mtime晚于旧日志而补跑合理。后端173/1121/0/0/0沿L21，门禁证据闭合，后续实现变动只做实际必需回归。
- L28/G1a：BpmMyInstanceControllerTest无动作节点的action/approvalResult/opinionData均null断言配通过报告，结合L20真实详情，剩余反向证据关闭。

以上全部只锁到当前证据快照；未整体验收通过，候选计数不晋级正式基线。

## 2. 三个精确剩余问题

### G5a/B1：父提交完成仍被当作同步业务发起完成

采集身份问题已解释：脚本POST后以admin回查，原日志13:50:16.188确有越权拒绝。原null不再作为业务数据丢失依据。

但另一问题并未因此消失。原脚本顺序是POST返回后再GET父命令；服务器GET已于13:50:16.185到达，因此该POST响应在此之前已经返回COMPLETED。原服务器日志子FLOW_START到13:50:16.261才开始、.374才完成。这条先后关系不依赖将服务端受理时点加145ms估算响应时间（该估算起点并不等于客户端t0）。

所以可以确认：同步发起请求返回时，流程启动子命令尚未执行。仅表单记录已创建、有recordId，并不等于用户要求的P0同步流程发起已经完成。当前回执认为“父COMPLETED/SUBMITTED就是业务发起结果，无需修复”，不符合原B1和此前明确的父子边界。允许保留内部父状态，但对外业务结果必须等待本次实际启动，或预算到期返回处理中/已受理并按同一标识回查；不能把迟些才发生的启动倒算成同步返回时已完成。

### G4b/B4：失败更新遗漏原子令牌条件

PersistentBpmCommandQueue.java:140—191中，failAndScheduleRetry先getById再比较currentToken；两个真正UPDATE（终态失败与PENDING重试）只带id与status条件，没有claim_token条件。complete/reject已把令牌带入UPDATE，这是正确进展。

仍存在可达竞争：旧A读取PROCESSING/tokenA并通过检查→命令回收再由B领取，状态回PROCESSING/tokenB→A按id+PROCESSING执行UPDATE，可能把B打为FAILED或PENDING。当前测试先完成交接再调用旧fail，只覆盖读时已tokenB的分支，不覆盖“读检查后、实际写前”切换。此为从最终副本发现的精确实现缺陷，属于既定领取权保护，不是扩大验收。需证明终态失败和重试两分支的最终写入都受当前领取权约束；状态相同不能代替领取代次。

### G3b/A5：同办理时间分页未覆盖

最终BpmTaskFacadeImpl.queryProcessedPage只按endTime倒序；BpmMyProcessedController合并只按handleTime排序，没有稳定唯一的次排序键。真实测试按实际先后完成两个任务，只对同一批数据读两次，未构造相同时间的跨页对象。它已证明普通混合分页，但不能证明此前要求的同时间稳定性。应使分页源与合并结果拥有确定性顺序，并用真实同时间对象逐页检查，不截断或漏重。数据增长线性物化代价已披露，本轮不另立压测/性能平台要求。

## 3. 状态与后续

提示07替代06，唯一剩余三行；不再重补G6b/G8a/G8b或主要历史过滤/原三并发场景。按真实实现修复并补受影响验证即可。本轮有大量证据核销，不能再次把六包全部写成待补。

P4继续VERIFYING，主方向ready；正式功能41、清单34/28/28及正式基线保持。全部通过后才另下阶段三。
