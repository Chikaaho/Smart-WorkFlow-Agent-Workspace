package com.sw.ck.bpm.process.service.impl;

import com.sw.ck.bpm.process.entity.ApprovalActionRecord;
import com.sw.ck.bpm.process.mapper.ApprovalActionRecordMapper;
import com.sw.ck.bpm.process.service.ApprovalActionService;
import com.sw.ck.common.service.BaseServiceImpl;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ApprovalActionServiceImpl extends BaseServiceImpl<ApprovalActionRecordMapper, ApprovalActionRecord>
        implements ApprovalActionService {
    @Override
    public List<ApprovalActionRecord> findByProcessInstanceId(String processInstanceId) {
        return lambdaQuery().eq(ApprovalActionRecord::getProcessInstanceId, processInstanceId)
                .orderByDesc(ApprovalActionRecord::getCreateTime).list();
    }

    @Override
    public ApprovalActionRecord findByTaskId(String taskId) {
        return lambdaQuery().eq(ApprovalActionRecord::getTaskId, taskId).last("LIMIT 1").one();
    }

    @Override
    public boolean existsForTask(String taskId) {
        return lambdaQuery().eq(ApprovalActionRecord::getTaskId, taskId).exists();
    }

    @Override
    public java.util.List<ApprovalActionRecord> pageByActor(long actorId, int offset, int limit) {
        return lambdaQuery()
                .eq(ApprovalActionRecord::getActorId, actorId)
                // 唯一次键：同 createTime 记录仍有确定性全序，分页不漏不重（A5）
                .orderByDesc(ApprovalActionRecord::getCreateTime)
                .orderByDesc(ApprovalActionRecord::getTaskId)
                .last("LIMIT " + limit + " OFFSET " + offset)
                .list();
    }

    @Override
    public long countByActor(long actorId) {
        return lambdaQuery()
                .eq(ApprovalActionRecord::getActorId, actorId)
                .count();
    }
}