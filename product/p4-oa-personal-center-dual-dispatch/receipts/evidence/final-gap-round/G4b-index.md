# G4b 索引：三断言分别成立（提示05 §4，真实审批核心/引擎/队列）

## §2 事实
- 被验证路径：CommandOverlapRealEngineTest（sw-bootstrap）＝真实 Flowable 引擎（独立内存 H2，overlap_p/overlap_par 带 tenant "1" 部署）+ 真实 BpmTaskFacadeImpl + 真实 TaskActionService（动作落库/实例状态/通知事件）+ 真实 TaskActionCommandHandler + 真实 CommandDispatcher/PersistentBpmCommandQueue（含 V55 租约令牌）。门控仅挂在引擎 complete 进入/离开处做计时与栅栏（记录型适配），审批判定全部真实。
- 场景输入：断言1=同实例并行双任务 t1(u1)/t2(u2) 上 NORMAL 与 P0 两个真实命令；断言2=同命令两代领取者（stale 回收+重领，两代令牌不同）；断言3=同命令业务已成功但 ack 丢失后重投。
- 结果判据：见各断言事件窗口与终态读回。

## 断言1：跨通道不同命令竞争
- 运行 → g8b 清单 CommandOverlapRealEngineTest.txt（Tests run: 3, Failures: 0, Errors: 0）assertion1_crossChannelCommands_overlap_windows。
- 窗口：两消费者都到达引擎 complete（secondConsumerArrived 栅栏）后 max(enterT1,enterT2) < min(endA,endB)（实际事件毫秒值断言通过）；t2 等 cmdA COMPLETED 后才提交（实际提交顺序 t1→t2，engine-complete-exit 时间断言）。
- 效果：两命令 COMPLETED（channel 读回 NORMAL/P0）；动作恰两条且 command_id 分别=各自命令 id、actor=各自发起人（7/8 不串）；实例 APPROVED；通知恰 1。
- 结论：处理区间相交、提交顺序可证、业务/通知单次、无身份串用 → 成立。

## 断言2：同命令租约交接（新持有者仍 PROCESSING 时旧持有者迟到写回）
- 窗口事实：A 领取（令牌1）阻塞在引擎 complete 中途 → reclaimStale（令牌清除）→ B 领取（令牌2，命令 PROCESSING）阻塞在引擎 complete 中途 → 旧持有者迟到 complete(令牌1) 与迟到 failAndScheduleRetry(令牌1) 发生（事件 old-holder-late-writeback 位于 B 到达之后、命令终态之前，时间断言通过）。
- 反向：迟到完成被拒（命令仍 PROCESSING、result=null 未被覆盖）；迟到失败返回 false（不打回 PENDING、不改判终态）。
- 正向：放行 B → 真实完成业务（动作恰一条 actor=7、command_id=本命令；实例 APPROVED；通知恰 1）→ B 以令牌2确认 COMPLETED；放行 A → 其引擎 complete 因任务已被 B 完成而失败（迟到业务执行被拒，无第二次效果）；最终 result 含 DONE 且不含 LATE_FIRST_GEN。
- 结论：租约令牌拒绝旧写回、不污染当前领取者 → 成立。

## 断言3：同命令业务已成功而确认丢失
- 场景：A 真实执行完成（实例 APPROVED、动作落库 command_id=本命令）不 ack → reclaim → 真实调度循环重投同命令。
- 结果：同命令重放恢复自身已提交结果——服务器日志 `同命令重放恢复自身已提交结果: commandId=…, actionRecordId=…, actor=7`，命令 COMPLETED（非 FAILED），result=`{"status":"RECOVERED","actionRecordId":…}`，failureReason=null；旧持有者迟到 ack（旧令牌）被终态+租约双守卫拒绝，不覆盖已恢复结果；动作恰一条、通知恰一次（审批/通知不二次执行）。
- 实现修复：ApprovalActionRecord 新增 command_id（V55 迁移）；TaskActionService.execute 三参重载按 command_id 定位自身已提交结果并恢复；不同命令/意图冲突仍确定性拒绝（APPROVAL_ALREADY_HANDLED）。
- 结论：同命令恢复成功、不同意图才拒绝（规划澄清后的正确语义）→ 成立。

## 边界
- 门控栅栏为计时/同步适配，不替换任何业务判定；旧近似测试 CommandLeaseHandoverOverlapTest（受控服务镜像语义）保留为补充场景（不同意图冲突+迟到写回），不再作为 G4b 关闭依据。
- 事件字段按 §4 采集：事件名/时序毫秒值/命令id/任务id/线程名在测试事件队列中断言，未保留全量日志。
