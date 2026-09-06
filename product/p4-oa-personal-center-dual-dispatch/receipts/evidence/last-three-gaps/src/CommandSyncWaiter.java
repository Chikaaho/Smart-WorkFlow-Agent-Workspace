package com.sw.ck.bpm.process.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sw.ck.bpm.process.entity.BpmCommand;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * P0 同步等待器：受理后对单次命令做有界等待。
 * <p>
 * 超时不等于失败：返回受理标识与实际已知状态，调用方可按同一 commandId 回查
 * 最终结果；绝不诱导重复提交（幂等键在受理时已锁定）。
 * </p>
 * <p>
 * B1（提示07）：同步业务发起结果以"实际启动"为准——P0 的 DRAFT_SUBMIT 完成只代表
 * 业务记录已创建，FLOW_START 子命令才是流程实际启动。对外结果须等子命令终态；
 * 预算到期返回受理态（ACCEPTED），按同一标识可回查最终结果，不把迟到的启动
 * 倒算成同步返回时已完成。
 * </p>
 */
@Component
public class CommandSyncWaiter {

    private static final Logger log = LoggerFactory.getLogger(CommandSyncWaiter.class);

    private final BpmCommandService commandService;
    private final ObjectMapper objectMapper;

    @Value("${sw.bpm.command.p0-wait-timeout-millis:5000}")
    private long timeoutMillis;

    @Value("${sw.bpm.command.p0-wait-poll-millis:100}")
    private long pollMillis;

    public CommandSyncWaiter(BpmCommandService commandService, ObjectMapper objectMapper) {
        this.commandService = commandService;
        this.objectMapper = objectMapper;
    }

    public enum Outcome { COMPLETED, FAILED, TIMEOUT }

    public record WaitResult(Outcome outcome, BpmCommand command) {
    }

    /**
     * 有界等待单条命令到达终态。
     */
    public WaitResult waitTerminal(Long commandId) {
        return waitTerminalUntil(commandId, System.currentTimeMillis() + timeoutMillis);
    }

    /**
     * P0 同步发起结果：等待父命令（DRAFT_SUBMIT）终态后，继续在同一预算内等待
     * 本次发起的 FLOW_START 子命令终态。仅当实际启动完成才返回 COMPLETED；
     * 任一环节失败返回 FAILED；预算到期返回 TIMEOUT（受理态，按标识可回查）。
     */
    public WaitResult waitSyncResult(Long parentCommandId) {
        long deadline = System.currentTimeMillis() + timeoutMillis;
        WaitResult parent = waitTerminalUntil(parentCommandId, deadline);
        if (parent.outcome() != Outcome.COMPLETED) {
            return parent;
        }
        String recordId = extractRecordId(parent.command());
        if (recordId == null || recordId.isBlank()) {
            // 无 recordId = 无需启动流程的提交形态，父命令结果即业务结论
            return parent;
        }
        BpmCommand child = commandService.lambdaQuery()
                .eq(BpmCommand::getCommandKey, "FLOW_START:" + recordId)
                .last("LIMIT 1")
                .one();
        if (child == null) {
            log.warn("P0 同步等待未找到 FLOW_START 子命令，按父命令结果返回: recordId={}", recordId);
            return parent;
        }
        return waitTerminalUntil(child.getId(), deadline);
    }

    private String extractRecordId(BpmCommand command) {
        if (command == null || command.getResult() == null) {
            return null;
        }
        try {
            return objectMapper.readTree(command.getResult())
                    .path("recordId").asText(null);
        } catch (Exception e) {
            log.warn("解析命令结果 recordId 失败: commandId={}, result={}", command.getId(), command.getResult());
            return null;
        }
    }

    private WaitResult waitTerminalUntil(Long commandId, long deadline) {
        while (System.currentTimeMillis() < deadline) {
            BpmCommand command = commandService.getById(commandId);
            if (command != null) {
                if ("COMPLETED".equals(command.getStatus())) {
                    return new WaitResult(Outcome.COMPLETED, command);
                }
                if ("FAILED".equals(command.getStatus())) {
                    return new WaitResult(Outcome.FAILED, command);
                }
            }
            try {
                Thread.sleep(pollMillis);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }
        log.info("P0 同步等待超时（不等于失败）: commandId={}，预算已到，按受理态返回可回查标识", commandId);
        BpmCommand latest = commandService.getById(commandId);
        return new WaitResult(Outcome.TIMEOUT, latest);
    }
}
