package com.sw.ck.bpm.process.dto;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 命令受理/执行状态（回查统一来源）。
 */
@Data
public class CommandStatusRespDTO {

    private Long commandId;

    private String commandType;

    private String channel;

    /** PENDING / PROCESSING / COMPLETED / FAILED */
    private String status;

    private String result;

    private String failureReason;

    private Integer retryCount;

    private LocalDateTime createTime;

    private LocalDateTime finishedAt;

    /**
     * 实际启动结果关联（B1，提示08）：DRAFT_SUBMIT 完成且结果携带 recordId 时，
     * 关联本次业务发起的 FLOW_START 子命令对外只读视图。父命令内部 COMPLETED
     * 不作为业务发起完成的唯一结论——调用方须以本视图区分子命令
     * PENDING/PROCESSING（处理中）、COMPLETED/STARTED（启动成功）与
     * FAILED（启动失败及原因）。子命令尚不存在或父结果无 recordId 时为 null，
     * 此时同样不得解读为业务成功。
     */
    private FlowStartView flowStart;

    @Data
    public static class FlowStartView {

        private Long commandId;

        /** PENDING / PROCESSING / COMPLETED / FAILED */
        private String status;

        /** 子命令结果 JSON（如 {\"status\":\"STARTED\"}） */
        private String result;

        private String failureReason;

        private LocalDateTime createTime;

        private LocalDateTime finishedAt;
    }
}
