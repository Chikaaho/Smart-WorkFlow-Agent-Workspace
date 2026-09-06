package com.sw.ck.bpm.process.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.sw.ck.common.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * 流程业务命令持久受理记录（{@code sw_bpm_command}）。
 * <p>
 * 接收成功即受理事实已持久化：发起与审批动作先落本表（与业务事务同事务），
 * 再由 {@code CommandDispatcher} 经统一消息边界异步消费。重启/重复投递后
 * 命令可定位、结果可回查，不产生重复业务结果（command_key 幂等）。
 * </p>
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("sw_bpm_command")
public class BpmCommand extends BaseEntity {

    /** 幂等键（租户内唯一），如 FLOW_START:{recordId}、TASK_APPROVE:{taskId}:{actor}。 */
    @TableField("command_key")
    private String commandKey;

    /** 命令类型（{@link CommandTypeEnum#getCode()}）。 */
    @TableField("command_type")
    private String commandType;

    /** 通道：NORMAL / P0（{@link CommandChannelEnum}）。 */
    @TableField("channel")
    private String channel;

    /** 状态（{@link CommandStatusEnum#getCode()}）。 */
    @TableField("status")
    private String status;

    /** 命令 payload（JSON，由各 Handler 解释）。 */
    @TableField("payload")
    private String payload;

    /** 处理结果（JSON，成功时写入，供回查）。 */
    @TableField("result")
    private String result;

    /** 失败原因（终态失败或最近一次重试原因）。 */
    @TableField("failure_reason")
    private String failureReason;

    /** 已重试次数。 */
    @TableField("retry_count")
    private Integer retryCount;

    /** 下次可重试时间（退避调度）。 */
    @TableField("next_retry_at")
    private LocalDateTime nextRetryAt;

    /** 最近一次被消费领取的时间。 */
    @TableField("claimed_at")
    private LocalDateTime claimedAt;

    /** 当前租约令牌（claimDue 一次性签发；complete/reject/fail 须匹配方可写回）。 */
    @TableField("claim_token")
    private String claimToken;

    /** 到达终态（COMPLETED/FAILED）时间。 */
    @TableField("finished_at")
    private LocalDateTime finishedAt;

    /** 发起身份（可审计，不持久化凭证）。 */
    @TableField("initiator_id")
    private Long initiatorId;
}
