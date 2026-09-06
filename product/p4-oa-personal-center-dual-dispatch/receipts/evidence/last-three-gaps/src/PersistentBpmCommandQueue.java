package com.sw.ck.bpm.process.queue;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.sw.ck.bpm.process.entity.BpmCommand;
import com.sw.ck.bpm.process.entity.CommandChannelEnum;
import com.sw.ck.bpm.process.entity.CommandStatusEnum;
import com.sw.ck.bpm.process.entity.CommandTypeEnum;
import com.sw.ck.bpm.process.service.BpmCommandService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * 默认持久化命令队列：以 {@code sw_bpm_command} 为受理/调度事实源。
 * <p>
 * enqueue 与调用方业务事务同事务（{@link Propagation#MANDATORY}，无独立事务时
 * 显式失败，避免"受理未持久化就成功返回"）；领取用条件更新保证多消费者竞争安全；
 * 业务幂等由 command_key 唯一索引 + Handler 侧幂等语义共同保证。
 * </p>
 */
@Component
public class PersistentBpmCommandQueue implements BpmCommandQueue {

    private static final Logger log = LoggerFactory.getLogger(PersistentBpmCommandQueue.class);

    private final BpmCommandService commandService;

    public PersistentBpmCommandQueue(BpmCommandService commandService) {
        this.commandService = commandService;
    }

    @Override
    @Transactional(propagation = Propagation.MANDATORY)
    public Long enqueue(CommandEnvelope envelope) {
        BpmCommand command = new BpmCommand();
        command.setCommandKey(envelope.getCommandKey());
        command.setCommandType(envelope.getCommandType().getCode());
        command.setChannel(envelope.getChannel().getCode());
        command.setStatus(CommandStatusEnum.PENDING.getCode());
        command.setPayload(envelope.getPayload());
        command.setRetryCount(0);
        command.setInitiatorId(envelope.getInitiatorId());
        commandService.save(command);
        envelope.setCommandId(command.getId());
        log.info("命令已受理: commandId={}, type={}, channel={}, key={}",
                command.getId(), command.getCommandType(), command.getChannel(), command.getCommandKey());
        return command.getId();
    }

    @Override
    public Optional<CommandEnvelope> findByKey(Long tenantId, String commandKey) {
        BpmCommand command = commandService.lambdaQuery()
                .eq(BpmCommand::getTenantId, tenantId)
                .eq(BpmCommand::getCommandKey, commandKey)
                .last("LIMIT 1")
                .one();
        return Optional.ofNullable(command).map(this::toEnvelope);
    }

    @Override
    public List<CommandEnvelope> claimDue(List<CommandChannelEnum> channels, int limit) {
        LocalDateTime now = LocalDateTime.now();
        List<BpmCommand> candidates = commandService.lambdaQuery()
                .eq(BpmCommand::getStatus, CommandStatusEnum.PENDING.getCode())
                .in(BpmCommand::getChannel, channels.stream().map(Enum::name).toList())
                .and(wrapper -> wrapper.isNull(BpmCommand::getNextRetryAt)
                        .or().le(BpmCommand::getNextRetryAt, now))
                .orderByAsc(BpmCommand::getCreateTime)
                .last("LIMIT " + limit)
                .list();
        List<CommandEnvelope> claimed = new ArrayList<>();
        for (BpmCommand candidate : candidates) {
            // 一次性租约令牌：写回（complete/reject/fail）须匹配本令牌，
            // stale 回收后旧持有者的迟到写回因令牌不匹配被拒。
            String claimToken = java.util.UUID.randomUUID().toString();
            LambdaUpdateWrapper<BpmCommand> claim = new LambdaUpdateWrapper<BpmCommand>()
                    .eq(BpmCommand::getId, candidate.getId())
                    .eq(BpmCommand::getStatus, CommandStatusEnum.PENDING.getCode())
                    .set(BpmCommand::getStatus, CommandStatusEnum.PROCESSING.getCode())
                    .set(BpmCommand::getClaimedAt, now)
                    .set(BpmCommand::getClaimToken, claimToken);
            if (commandService.update(claim)) {
                candidate.setStatus(CommandStatusEnum.PROCESSING.getCode());
                candidate.setClaimedAt(now);
                candidate.setClaimToken(claimToken);
                claimed.add(toEnvelope(candidate));
            }
        }
        return claimed;
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRED)
    public void complete(Long commandId, String claimToken, String resultJson) {
        // PROCESSING + 当前租约令牌双守卫：stale 回收后旧领取者迟到的完成
        // 因令牌不匹配被拒，不覆盖新消费者（仍在 PROCESSING）的结果。
        boolean updated = commandService.lambdaUpdate()
                .eq(BpmCommand::getId, commandId)
                .eq(BpmCommand::getStatus, CommandStatusEnum.PROCESSING.getCode())
                .eq(BpmCommand::getClaimToken, claimToken == null ? "" : claimToken)
                .set(BpmCommand::getStatus, CommandStatusEnum.COMPLETED.getCode())
                .set(BpmCommand::getResult, resultJson)
                .set(BpmCommand::getFailureReason, null)
                .set(BpmCommand::getFinishedAt, LocalDateTime.now())
                .update();
        if (!updated) {
            log.warn("命令完成被跳过: commandId={} 已离开当前领取权（被回收/终结或租约令牌不匹配）", commandId);
        }
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRED)
    public void reject(Long commandId, String claimToken, String reason) {
        boolean updated = commandService.lambdaUpdate()
                .eq(BpmCommand::getId, commandId)
                .eq(BpmCommand::getStatus, CommandStatusEnum.PROCESSING.getCode())
                .eq(BpmCommand::getClaimToken, claimToken == null ? "" : claimToken)
                .set(BpmCommand::getStatus, CommandStatusEnum.FAILED.getCode())
                .set(BpmCommand::getResult, "{\"status\":\"REJECTED\"}")
                .set(BpmCommand::getFailureReason, truncate(reason))
                .set(BpmCommand::getFinishedAt, LocalDateTime.now())
                .update();
        if (!updated) {
            log.warn("命令消费前拒绝被跳过: commandId={} 已离开当前领取权（租约令牌不匹配）", commandId);
            return;
        }
        log.warn("命令消费前安全门禁拒绝: commandId={}, reason={}", commandId, reason);
    }

    @Override
    @Transactional(propagation = Propagation.REQUIRED)
    public boolean failAndScheduleRetry(Long commandId, String claimToken, String reason,
                                        int maxRetries, long backoffMillis) {
        BpmCommand command = readCommandForFailure(commandId);
        if (command == null) {
            return false;
        }
        // 三重守卫：终态不可复活；非当前租约令牌（stale 回收后旧持有者）不得写回——
        // 既不打回 PENDING 扰乱当前持有者，也不改判其终态。
        // 读取守卫与实际写入之间存在交接窗口：最终 UPDATE 仍须携带本令牌
        // （与 complete/reject 同一领取权条件），读取校验通过不豁免写入校验。
        String status = command.getStatus();
        if (CommandStatusEnum.COMPLETED.getCode().equals(status)
                || CommandStatusEnum.FAILED.getCode().equals(status)) {
            log.warn("命令失败处理被跳过: commandId={} 已是终态 {}", commandId, status);
            return false;
        }
        String currentToken = command.getClaimToken();
        if (status.equals(CommandStatusEnum.PROCESSING.getCode())
                && !java.util.Objects.equals(currentToken, claimToken)) {
            log.warn("命令失败处理被跳过: commandId={} 租约令牌不匹配（当前持有者仍在处理，"
                    + "旧持有者迟到写回被拒）", commandId);
            return false;
        }
        int retryCount = command.getRetryCount() == null ? 0 : command.getRetryCount();
        if (retryCount + 1 >= maxRetries) {
            boolean failed = commandService.lambdaUpdate()
                    .eq(BpmCommand::getId, commandId)
                    .eq(BpmCommand::getStatus, status)
                    .eq(BpmCommand::getClaimToken, claimToken == null ? "" : claimToken)
                    .set(BpmCommand::getStatus, CommandStatusEnum.FAILED.getCode())
                    .set(BpmCommand::getFailureReason, truncate(reason))
                    .set(BpmCommand::getFinishedAt, LocalDateTime.now())
                    .update();
            if (!failed) {
                log.warn("命令终态失败改判被跳过: commandId={} 状态已变化", commandId);
                return false;
            }
            log.warn("命令终态失败: commandId={}, retries={}, reason={}", commandId, retryCount + 1, reason);
            return false;
        }
        long backoff = backoffMillis * (1L << Math.min(retryCount, 10));
        boolean retried = commandService.lambdaUpdate()
                .eq(BpmCommand::getId, commandId)
                .eq(BpmCommand::getStatus, status)
                .eq(BpmCommand::getClaimToken, claimToken == null ? "" : claimToken)
                .set(BpmCommand::getStatus, CommandStatusEnum.PENDING.getCode())
                .set(BpmCommand::getRetryCount, retryCount + 1)
                .set(BpmCommand::getNextRetryAt, LocalDateTime.now().plusNanos(backoff * 1_000_000))
                .set(BpmCommand::getFailureReason, truncate(reason))
                .update();
        if (!retried) {
            log.warn("命令重试改派被跳过: commandId={} 状态已变化", commandId);
            return false;
        }
        log.info("命令将重试: commandId={}, retry={}，退避 {}ms，reason={}",
                commandId, retryCount + 1, backoff, reason);
        return true;
    }

    /** 失败处理前的命令读取；测试以此注入"读取后、写入前"的交接窗口快照。 */
    protected BpmCommand readCommandForFailure(Long commandId) {
        return commandService.getById(commandId);
    }

    @Override
    public int reclaimStale(LocalDateTime staleBefore) {
        boolean updated = commandService.lambdaUpdate()
                .eq(BpmCommand::getStatus, CommandStatusEnum.PROCESSING.getCode())
                .lt(BpmCommand::getClaimedAt, staleBefore)
                .set(BpmCommand::getStatus, CommandStatusEnum.PENDING.getCode())
                .set(BpmCommand::getClaimToken, null)
                .update();
        return updated ? 1 : 0;
    }

    @Override
    public Optional<CommandEnvelope> findById(Long commandId) {
        return Optional.ofNullable(commandService.getById(commandId)).map(this::toEnvelope);
    }

    private CommandEnvelope toEnvelope(BpmCommand command) {
        CommandEnvelope envelope = new CommandEnvelope();
        envelope.setCommandId(command.getId());
        envelope.setCommandType(CommandTypeEnum.of(command.getCommandType()));
        envelope.setChannel(CommandChannelEnum.valueOf(command.getChannel()));
        envelope.setCommandKey(command.getCommandKey());
        envelope.setTenantId(command.getTenantId());
        envelope.setInitiatorId(command.getInitiatorId());
        envelope.setPayload(command.getPayload());
        envelope.setRetryCount(command.getRetryCount() == null ? 0 : command.getRetryCount());
        envelope.setStatus(command.getStatus());
        envelope.setResult(command.getResult());
        envelope.setFailureReason(command.getFailureReason());
        envelope.setClaimToken(command.getClaimToken());
        return envelope;
    }

    private String truncate(String reason) {
        if (reason == null) {
            return null;
        }
        return reason.length() <= 1000 ? reason : reason.substring(0, 997) + "...";
    }
}
