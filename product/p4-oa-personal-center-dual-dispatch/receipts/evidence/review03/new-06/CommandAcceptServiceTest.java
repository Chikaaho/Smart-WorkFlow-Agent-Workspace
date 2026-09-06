package com.sw.ck.bpm.process.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sw.ck.bpm.process.dto.ApprovalAction;
import com.sw.ck.bpm.process.dto.ApprovalActionRequest;
import com.sw.ck.bpm.process.dto.CommandAcceptRespDTO;
import com.sw.ck.bpm.process.entity.CommandChannelEnum;
import com.sw.ck.bpm.process.entity.CommandTypeEnum;
import com.sw.ck.bpm.process.queue.BpmCommandQueue;
import com.sw.ck.bpm.process.queue.CommandEnvelope;
import com.sw.ck.common.exception.BaseException;
import com.sw.ck.security.holder.LoginUser;
import com.sw.ck.security.holder.LoginUserHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * {@link CommandAcceptService} 单元测试。
 * <p>
 * 覆盖：审批动作受理（类型/幂等键/通道映射）、同 key 幂等命中、FAILED 后重新受理。
 * </p>
 */
@DisplayName("命令受理服务测试")
class CommandAcceptServiceTest {

    private final BpmCommandQueue commandQueue = mock(BpmCommandQueue.class);
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final CommandAcceptService service =
            new CommandAcceptService(commandQueue, objectMapper);

    @BeforeEach
    void setUp() {
        LoginUser loginUser = new LoginUser();
        loginUser.setUserId(2L);
        loginUser.setTenantId(0L);
        LoginUserHolder.set(loginUser);
    }

    @AfterEach
    void tearDown() {
        LoginUserHolder.clear();
    }

    @Test
    @DisplayName("G6b 非超租户受理前明确拒绝：不产生命令（当前调度仅可靠消费超租户）")
    void acceptTaskAction_shouldRejectNonSuperTenantBeforeAccept() {
        LoginUser tenant5 = new LoginUser();
        tenant5.setUserId(2L);
        tenant5.setTenantId(5L);
        LoginUserHolder.set(tenant5);

        org.assertj.core.api.Assertions.assertThatThrownBy(() -> service.acceptTaskAction(
                        "task-9", ApprovalAction.APPROVE, null, CommandChannelEnum.NORMAL))
                .isInstanceOf(BaseException.class)
                .hasMessageContaining("当前租户未开通流程命令通道");
        org.mockito.Mockito.verify(commandQueue, org.mockito.Mockito.never())
                .enqueue(any(CommandEnvelope.class));
    }

    @Test
    @DisplayName("首次受理：enqueue 收到正确 type/commandKey/channel，duplicated=true")
    void acceptTaskAction_shouldEnqueueNewCommand() {
        when(commandQueue.findByKey(0L, "TASK_APPROVE:task-9:2")).thenReturn(Optional.empty());
        when(commandQueue.enqueue(any(CommandEnvelope.class))).thenAnswer(inv -> {
            CommandEnvelope env = inv.getArgument(0);
            env.setCommandId(66L);
            return 66L;
        });

        CommandAcceptRespDTO resp = service.acceptTaskAction("task-9", ApprovalAction.APPROVE,
                null, CommandChannelEnum.NORMAL);

        assertThat(resp.getCommandId()).isEqualTo(66L);
        assertThat(resp.getCommandKey()).isEqualTo("TASK_APPROVE:task-9:2");
        assertThat(resp.getCommandType()).isEqualTo(CommandTypeEnum.TASK_APPROVE.getCode());
        assertThat(resp.getChannel()).isEqualTo(CommandChannelEnum.NORMAL.getCode());
        assertThat(resp.isDuplicated()).isTrue();

        ArgumentCaptor<CommandEnvelope> captor = ArgumentCaptor.forClass(CommandEnvelope.class);
        verify(commandQueue).enqueue(captor.capture());
        CommandEnvelope env = captor.getValue();
        assertThat(env.getCommandType()).isEqualTo(CommandTypeEnum.TASK_APPROVE);
        assertThat(env.getChannel()).isEqualTo(CommandChannelEnum.NORMAL);
        assertThat(env.getCommandKey()).isEqualTo("TASK_APPROVE:task-9:2");
        assertThat(env.getTenantId()).isEqualTo(0L);
        assertThat(env.getInitiatorId()).isEqualTo(2L);
        assertThat(env.getPayload()).contains("task-9");
    }

    @Test
    @DisplayName("同 key 已存在且状态非 FAILED → 幂等返回 duplicated=true 且不再 enqueue")
    void acceptTaskAction_shouldReturnExistingWhenNotFailed() {
        CommandEnvelope existing = new CommandEnvelope();
        existing.setCommandId(66L);
        existing.setCommandType(CommandTypeEnum.TASK_APPROVE);
        existing.setChannel(CommandChannelEnum.NORMAL);
        existing.setCommandKey("TASK_APPROVE:task-9:2");
        existing.setStatus("PROCESSING");
        when(commandQueue.findByKey(0L, "TASK_APPROVE:task-9:2")).thenReturn(Optional.of(existing));

        CommandAcceptRespDTO resp = service.acceptTaskAction("task-9", ApprovalAction.APPROVE,
                null, CommandChannelEnum.NORMAL);

        assertThat(resp.getCommandId()).isEqualTo(66L);
        assertThat(resp.isDuplicated()).isFalse();
        verify(commandQueue, never()).enqueue(any());
    }

    @Test
    @DisplayName("已存在且状态 FAILED → 重新 enqueue 新受理")
    void acceptTaskAction_shouldReEnqueueWhenFailed() {
        CommandEnvelope existing = new CommandEnvelope();
        existing.setCommandId(66L);
        existing.setCommandType(CommandTypeEnum.TASK_APPROVE);
        existing.setChannel(CommandChannelEnum.NORMAL);
        existing.setCommandKey("TASK_APPROVE:task-9:2");
        existing.setStatus("FAILED");
        when(commandQueue.findByKey(0L, "TASK_APPROVE:task-9:2")).thenReturn(Optional.of(existing));
        when(commandQueue.enqueue(any(CommandEnvelope.class))).thenAnswer(inv -> {
            CommandEnvelope env = inv.getArgument(0);
            env.setCommandId(99L);
            return 99L;
        });

        CommandAcceptRespDTO resp = service.acceptTaskAction("task-9", ApprovalAction.APPROVE,
                new ApprovalActionRequest(), CommandChannelEnum.NORMAL);

        assertThat(resp.getCommandId()).isEqualTo(99L);
        assertThat(resp.isDuplicated()).isTrue();
        verify(commandQueue).enqueue(any(CommandEnvelope.class));
    }

    @Test
    @DisplayName("动作映射：REJECT/RETURN → 对应命令类型")
    void acceptTaskAction_shouldMapActionTypes() {
        when(commandQueue.findByKey(eq(0L), org.mockito.ArgumentMatchers.anyString())).thenReturn(Optional.empty());
        when(commandQueue.enqueue(any(CommandEnvelope.class))).thenReturn(1L);

        service.acceptTaskAction("task-9", ApprovalAction.REJECT, null, CommandChannelEnum.NORMAL);
        ArgumentCaptor<CommandEnvelope> captor = ArgumentCaptor.forClass(CommandEnvelope.class);
        verify(commandQueue, org.mockito.Mockito.times(1)).enqueue(captor.capture());
        assertThat(captor.getValue().getCommandType()).isEqualTo(CommandTypeEnum.TASK_REJECT);

        service.acceptTaskAction("task-9", ApprovalAction.RETURN, null, CommandChannelEnum.NORMAL);
        verify(commandQueue, org.mockito.Mockito.times(2)).enqueue(captor.capture());
        assertThat(captor.getValue().getCommandType()).isEqualTo(CommandTypeEnum.TASK_RETURN);
    }
}
