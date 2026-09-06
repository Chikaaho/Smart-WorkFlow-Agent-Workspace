package com.sw.ck.bpm.process.queue;

import com.sw.ck.bpm.process.entity.CommandChannelEnum;
import com.sw.ck.bpm.process.entity.CommandTypeEnum;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import com.sw.ck.security.holder.LoginUser;
import com.sw.ck.security.holder.LoginUserHolder;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * G7 消息边界契约测试（抽象）：投递、领取、确认、有界重试退避、失败终态、
 * stale 恢复、幂等回查。由持久化实现与替代内存实现共同运行，
 * 证明同一契约可替换（A8）。
 */
public abstract class BpmCommandQueueContractTest {

    protected abstract BpmCommandQueue queue();

    /** 实现相关的测试辅助：把命令的 nextRetryAt 清零（模拟退避到期）。 */
    protected abstract void forceDue(Long commandId);

    @BeforeEach
    void setUpLoginContext() {
        // 持久化实现的 tenant/审计列经 MyBatis-Plus 拦截器从登录上下文注入
        LoginUser user = new LoginUser();
        user.setUserId(7L);
        user.setTenantId(1L);
        LoginUserHolder.set(user);
    }

    @AfterEach
    void clearLoginContext() {
        LoginUserHolder.clear();
    }

    private CommandEnvelope envelope(String key, CommandChannelEnum channel) {
        CommandEnvelope envelope = new CommandEnvelope();
        envelope.setCommandType(CommandTypeEnum.TASK_APPROVE);
        envelope.setChannel(channel);
        envelope.setCommandKey(key);
        envelope.setTenantId(1L);
        envelope.setInitiatorId(7L);
        envelope.setPayload("{}");
        return envelope;
    }

    @Test
    @DisplayName("契约：投递→领取→确认全生命周期")
    void lifecycle_enqueueClaimComplete() {
        CommandEnvelope env = envelope("C1:" + getClass().getSimpleName(), CommandChannelEnum.NORMAL);
        Long id = queue().enqueue(env);
        assertThat(id).isNotNull();

        List<CommandEnvelope> claimed = queue().claimDue(List.of(CommandChannelEnum.NORMAL), 10);
        assertThat(claimed).anySatisfy(e -> {
            assertThat(e.getCommandId()).isEqualTo(id);
            assertThat(e.getStatus()).isEqualTo("PROCESSING");
        });

        queue().complete(id, "{\"ok\":true}");
        CommandEnvelope done = queue().findById(id).orElseThrow();
        assertThat(done.getStatus()).isEqualTo("COMPLETED");
        assertThat(done.getResult()).contains("ok");
    }

    @Test
    @DisplayName("契约：有界重试后退避再领取，达到上限进入 FAILED 终态")
    void retryThenTerminalFailure() {
        CommandEnvelope env = envelope("C2:" + getClass().getSimpleName(), CommandChannelEnum.NORMAL);
        Long id = queue().enqueue(env);
        queue().claimDue(List.of(CommandChannelEnum.NORMAL), 10);

        assertThat(queue().failAndScheduleRetry(id, "boom-1", 3, 60_000)).isTrue();
        CommandEnvelope retrying = queue().findById(id).orElseThrow();
        assertThat(retrying.getStatus()).isEqualTo("PENDING");
        assertThat(retrying.getRetryCount()).isEqualTo(1);
        assertThat(retrying.getFailureReason()).contains("boom-1");

        // 退避期内不可领取
        assertThat(queue().claimDue(List.of(CommandChannelEnum.NORMAL), 10))
                .noneSatisfy(e -> assertThat(e.getCommandId()).isEqualTo(id));

        // 退避到期（测试辅助拨回）后可再领取
        forceDue(id);
        assertThat(queue().claimDue(List.of(CommandChannelEnum.NORMAL), 10))
                .anySatisfy(e -> assertThat(e.getCommandId()).isEqualTo(id));
        assertThat(queue().failAndScheduleRetry(id, "boom-2", 3, 60_000)).isTrue();
        forceDue(id);
        queue().claimDue(List.of(CommandChannelEnum.NORMAL), 10);
        assertThat(queue().failAndScheduleRetry(id, "boom-3", 3, 60_000)).isFalse();
        CommandEnvelope failed = queue().findById(id).orElseThrow();
        assertThat(failed.getStatus()).isEqualTo("FAILED");
        assertThat(failed.getFailureReason()).contains("boom-3");
    }

    @Test
    @DisplayName("契约：消费中断 stale 恢复后可重新领取")
    void reclaimStale() {
        CommandEnvelope env = envelope("C3:" + getClass().getSimpleName(), CommandChannelEnum.NORMAL);
        Long id = queue().enqueue(env);
        queue().claimDue(List.of(CommandChannelEnum.NORMAL), 10);
        assertThat(queue().findById(id).orElseThrow().getStatus()).isEqualTo("PROCESSING");

        int requeued = queue().reclaimStale(LocalDateTime.now().plusSeconds(1));
        assertThat(requeued).isGreaterThanOrEqualTo(1);
        assertThat(queue().findById(id).orElseThrow().getStatus()).isEqualTo("PENDING");
    }

    @Test
    @DisplayName("契约：幂等回查 findByKey")
    void findByKeyRoundtrip() {
        CommandEnvelope env = envelope("C4:" + getClass().getSimpleName(), CommandChannelEnum.P0);
        Long id = queue().enqueue(env);
        CommandEnvelope found = queue().findByKey(1L, env.getCommandKey()).orElseThrow();
        assertThat(found.getCommandId()).isEqualTo(id);
        assertThat(found.getChannel()).isEqualTo(CommandChannelEnum.P0);
        assertThat(found.getInitiatorId()).isEqualTo(7L);
        assertThat(queue().findByKey(2L, env.getCommandKey())).isEmpty();
    }
}
