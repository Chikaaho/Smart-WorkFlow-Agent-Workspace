package com.sw.ck.bpm.process.queue;

import com.sw.ck.bpm.process.entity.CommandChannelEnum;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 流程业务命令消息边界（可替换投递/消费抽象）。
 * <p>
 * 默认实现 {@link PersistentBpmCommandQueue} 基于 {@code sw_bpm_command} 持久化表。
 * 未来接入外部 MQ 时替换本接口实现，命令入口与结果查询契约保持稳定。
 * 接口语义覆盖：投递（enqueue，与调用方事务同事务持久化）、消费领取（claim，原子、
 * 可重复领取竞争安全）、消费确认（complete/fail）、重试退避（nack + nextRetryAt）、
 * 恢复（reclaimStale，消费中断/重启后命令可重新定位）。
 * </p>
 */
public interface BpmCommandQueue {

    /**
     * 投递命令（受理）。必须在调用方业务事务内执行：本方法只落受理记录，
     * 接收成功即受理事实已持久化。
     *
     * @return 受理标识
     * @throws org.springframework.dao.DuplicateKeyException 同一 command_key 重复受理时
     */
    Long enqueue(CommandEnvelope envelope);

    /**
     * 按 command_key 查既有受理（幂等回查）。
     */
    Optional<CommandEnvelope> findByKey(Long tenantId, String commandKey);

    /**
     * 原子领取待处理命令（多消费者竞争安全）。
     *
     * @param channels 允许领取的通道（P0 调度器只领 P0，普通调度器只领 NORMAL）
     * @param limit    一次最多领取条数
     */
    List<CommandEnvelope> claimDue(List<CommandChannelEnum> channels, int limit);

    /**
     * 消费确认：成功，写结果（JSON）。
     *
     * @param claimToken 领取时签发的租约令牌；不匹配当前领取权时写回被拒
     *                   （stale 回收后旧持有者的迟到确认不覆盖新消费者）。
     */
    void complete(Long commandId, String claimToken, String resultJson);

    /**
     * 消费前安全门禁拒绝：不进入业务 Handler，直接落终态失败，便于审计与回查。
     * <p>典型场景是命令受理后用户被停用或 P0 权限被撤回。</p>
     *
     * @param claimToken 领取时签发的租约令牌；不匹配当前领取权时写回被拒。
     */
    void reject(Long commandId, String claimToken, String reason);

    /**
     * 消费失败：有界重试。未达上限时按退避安排 nextRetryAt 并回到可领取状态；
     * 达上限时进入 FAILED 终态（失败可查、不永久占住队列）。
     *
     * @param claimToken 领取时签发的租约令牌；不匹配当前领取权时写回被拒，
     *                   不把当前持有者的 PROCESSING 打回 PENDING。
     * @return true = 已安排重试；false = 已终态失败
     */
    boolean failAndScheduleRetry(Long commandId, String claimToken, String reason,
                                 int maxRetries, long backoffMillis);

    /**
     * 恢复：把 claimed_at 早于 staleBefore 的 PROCESSING 命令重新置回可领取
     *（消费进程崩溃/重启后的恢复路径；业务幂等由 Handler 的 command_key 语义保证）。
     *
     * @return 重新可领取的条数
     */
    int reclaimStale(LocalDateTime staleBefore);

    /**
     * 按受理标识查询（回查统一来源）。
     */
    Optional<CommandEnvelope> findById(Long commandId);
}
