-- P4 G4b：命令领取租约令牌 + 审批动作命令关联。
-- 1) sw_bpm_command.claim_token：每次 claimDue 生成一次性租约令牌；complete/reject/
--    failAndScheduleRetry 必须携带当前令牌方可写回。stale 回收后旧持有者在新持有者
--    仍 PROCESSING 期间的迟到写回因令牌不匹配被拒，不污染当前领取者（提示05 §4 断言2）。
-- 2) sw_bpm_approval_action.command_id：动作记录与受理命令关联；同一命令确认丢失
--    重投时据此定位自身已提交结果并恢复一致的可回查命令结果，不误报"已被处理"；
--    不同命令/意图的冲突仍确定性拒绝（提示05 §4 断言3）。同步 HTTP 入口该列为 null。
-- 全部幂等（information哨兵 + IF NOT EXISTS 语义），可重复执行。

ALTER TABLE sw_bpm_command ADD COLUMN IF NOT EXISTS claim_token varchar(64);
ALTER TABLE sw_bpm_approval_action ADD COLUMN IF NOT EXISTS command_id bigint;
