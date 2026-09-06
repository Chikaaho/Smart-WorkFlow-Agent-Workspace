package com.sw.ck.bpm.process.entity;

import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableName;
import com.sw.ck.common.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/** 不可变审批动作与意见快照。 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("sw_bpm_approval_action")
public class ApprovalActionRecord extends BaseEntity {
    @TableField("process_instance_id") private String processInstanceId;
    @TableField("node_key") private String nodeKey;
    @TableField("task_id") private String taskId;
    @TableField("actor_id") private Long actorId;
    @TableField("action") private String action;
    @TableField("opinion_form_id") private String opinionFormId;
    @TableField("opinion_form_version") private String opinionFormVersion;
    @TableField("initialization_summary") private String initializationSummary;
    @TableField("opinion_data") private String opinionData;
    @TableField("settlement_status") private String settlementStatus;
    /** 产生本动作的受理命令（命令通道重放时据此恢复自身已提交结果；同步入口为 null）。 */
    @TableField("command_id") private Long commandId;
}
