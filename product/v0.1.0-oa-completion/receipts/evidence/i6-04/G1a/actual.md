# G1a 实际结果（原始流引用：g1a-run2.log / email-enable.log / sql-backread.txt）

## 正向
- 同一审批任务完成后通知运行时真实失败：EMAIL `delivery_status=FAILED`（g1a-run2 流 + sql-backread.txt 第 2 行段：2099430376506863617）；尝试记录 `attempt_no=1, status=FAILED, failure_class=RETRYABLE`；重试已由 RETRY 策略排定（next_retry_time=17:30:41）
- 任务与流程保持推进：实例 P `d018f57a-…` status=APPROVED（sql-backread.txt 末段）；审批命令 COMPLETED；任务完成前 TODO_CREATED 通知已投出（10002 IN_APP SUCCESS）
- 失败投递可查：SQL 直查（本包 sql-backread.txt）且 u1 收件箱列表接口可读成功记录（g1a-run-raw.log 末段 IN_APP SUCCESS）

## 反向
- 不回滚：审批完成命令终态 COMPLETED，APPROVE 再次受理返回 duplicated:true（g1a-run2.log），不重复办理
- 不重复推进：实例 status 唯一 APPROVED，无额外实例行
- 无伪造：失败原因为真实 SMTP 不可达链（无监听 2525），非测试桩

## 覆盖边界
- 单租户 T=100 单实例单任务单动作；多身份可见链交给 G6b、流程事件矩阵交给 G6a，均复用本实例对象集合
- EMAIL 恢复成功链属于 G5b（真实 SMTP/Provider 条件），本原子不裁剪
