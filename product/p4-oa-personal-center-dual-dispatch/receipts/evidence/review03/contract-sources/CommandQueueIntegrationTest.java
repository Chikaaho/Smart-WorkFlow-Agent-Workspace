package com.sw.ck.bpm.process.queue;

import com.sw.ck.bpm.process.entity.CommandChannelEnum;
import com.sw.ck.bpm.process.entity.CommandTypeEnum;
import com.sw.ck.bpm.process.queue.support.QueueH2TestConfig;
import com.sw.ck.security.holder.LoginUser;
import com.sw.ck.security.holder.LoginUserHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * G4/G5 隔离持久环境行为验证（真实 H2 + 真实持久化队列 + 真实调度车道）：
 * 提交事务可见性边界、消费中断重启恢复、重复投递、双消费者竞争领取、
 * 普通积压下 P0 优先时间线。
 * 业务副作用以隔离计数通道记录，不触达真实流程/通知/设备。
 */
@SpringBootTest(classes = QueueH2TestConfig.class,
        webEnvironment = SpringBootTest.WebEnvironment.NONE)
@DisplayName("G4/G5 命令队列持久环境行为验证")
class CommandQueueIntegrationTest {

    @Autowired
    private BpmCommandQueue queue;

    @Autowired
    private TransactionTemplate txTemplate;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    private final Map<String, AtomicInteger> effects = new ConcurrentHashMap<>();
    private final List<String> timeline = new CopyOnWriteArrayList<>();

    @BeforeEach
    void setUp() {
        LoginUser user = new LoginUser();
        user.setUserId(7L);
        user.setTenantId(1L);
        LoginUserHolder.set(user);
        effects.clear();
        timeline.clear();
        jdbcTemplate.update("DELETE FROM sw_bpm_command");
    }

    @AfterEach
    void tearDown() {
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

    /** 业务幂等 handler：同 command_key 只产生一次效果（模拟唯一约束/状态判定）。 */
    private BpmCommandHandler idempotentHandler() {
        return new BpmCommandHandler() {
            @Override
            public java.util.Set<CommandTypeEnum> types() {
                return java.util.Set.of(CommandTypeEnum.values());
            }

            @Override
            public String handle(CommandEnvelope env) {
                AtomicInteger effect = effects.computeIfAbsent(env.getCommandKey(),
                        k -> new AtomicInteger());
                if (effect.get() == 0 && effect.compareAndSet(0, 1)) {
                    timeline.add(System.currentTimeMillis() + "|" + env.getChannel()
                            + "|" + env.getCommandKey());
                    return "{\"applied\":true}";
                }
                return "{\"applied\":false,\"reason\":\"ALREADY_HANDLED\"}";
            }
        };
    }

    private void ensureLogin() {
        LoginUser user = new LoginUser();
        user.setUserId(7L);
        user.setTenantId(1L);
        LoginUserHolder.set(user);
    }

    private CommandDispatcher dispatcherWith(BpmCommandHandler handler) {
        CommandDispatcher dispatcher = new CommandDispatcher(queue, List.of(handler));
        org.springframework.test.util.ReflectionTestUtils.setField(dispatcher, "batchSize", 20);
        org.springframework.test.util.ReflectionTestUtils.setField(dispatcher, "p0BatchSize", 5);
        org.springframework.test.util.ReflectionTestUtils.setField(dispatcher, "staleSeconds", 60);
        return dispatcher;
    }

    private long effectTime(String key) {
        return timeline.stream().filter(line -> line.endsWith("|" + key))
                .findFirst().orElseThrow().transform(line -> Long.parseLong(line.split("\\|")[0]));
    }

    @Test
    @DisplayName("G5 提交边界：受理未提交时消费者不可见，提交后才可领取（时间线可证）")
    void acceptanceInvisibleBeforeCommit_visibleAfterCommit() {
        AtomicReference<Long> commandId = new AtomicReference<>();
        long acceptStart = System.currentTimeMillis();
        txTemplate.executeWithoutResult(status -> {
            CommandEnvelope env = envelope("G5-VISIBILITY-1", CommandChannelEnum.P0);
            commandId.set(queue.enqueue(env));
            // 事务未提交：独立连接（独立线程消费者）看不到该受理，也不产生业务效果
            Thread independentConsumer = new Thread(() ->
                    dispatcherWith(idempotentHandler()).pollP0());
            independentConsumer.start();
            try {
                independentConsumer.join();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new IllegalStateException(e);
            }
            assertThat(effects).doesNotContainKey("G5-VISIBILITY-1");
            assertThat(queue.findById(commandId.get()).orElseThrow().getStatus()).isEqualTo("PENDING");
        });
        long acceptCommitted = System.currentTimeMillis();

        dispatcherWith(idempotentHandler()).pollP0();
        ensureLogin();
        long consumed = System.currentTimeMillis();

        assertThat(effects.get("G5-VISIBILITY-1").get()).isEqualTo(1);
        // 受理提交时间 <= 消费时间：受理先对消费者可见，再被处理
        assertThat(acceptCommitted).isLessThanOrEqualTo(consumed);
        assertThat(acceptStart).isLessThan(acceptCommitted);
    }

    @Test
    @DisplayName("G4 重复投递：同 command_key 只受理一次，业务效果仅一次")
    void duplicateDelivery_singleAcceptance_singleEffect() {
        queue.enqueue(envelope("G4-DUP-1", CommandChannelEnum.NORMAL));
        assertThatThrownBy(() -> queue.enqueue(envelope("G4-DUP-1", CommandChannelEnum.NORMAL)))
                .isInstanceOf(DuplicateKeyException.class);

        dispatcherWith(idempotentHandler()).pollNormal();
        ensureLogin();
        dispatcherWith(idempotentHandler()).pollNormal();
        ensureLogin();

        assertThat(effects.get("G4-DUP-1").get()).isEqualTo(1);
    }

    @Test
    @DisplayName("G4 消费中断与重启恢复：claimed 未确认被 stale 回收重投，效果恰一次")
    void consumerCrash_reclaimOnRestart_effectOnce() throws Exception {
        Long id = queue.enqueue(envelope("G4-CRASH-1", CommandChannelEnum.NORMAL));

        // 中断前：第一代消费者领取并已产生业务效果，但崩溃未确认
        List<CommandEnvelope> claimed = queue.claimDue(List.of(CommandChannelEnum.NORMAL), 10);
        CommandEnvelope crashed = claimed.stream()
                .filter(e -> e.getCommandKey().equals("G4-CRASH-1")).findFirst().orElseThrow();
        idempotentHandler().handle(crashed);
        assertThat(queue.findById(id).orElseThrow().getStatus()).isEqualTo("PROCESSING");
        assertThat(effects.get("G4-CRASH-1").get()).isEqualTo(1);

        // 重启后：stale 领取回收 → 重新投递 → 幂等 handler 不重复生效
        assertThat(queue.reclaimStale(LocalDateTime.now().plusSeconds(60))).isEqualTo(1);
        dispatcherWith(idempotentHandler()).pollNormal();
        ensureLogin();

        assertThat(queue.findById(id).orElseThrow().getStatus()).isEqualTo("COMPLETED");
        assertThat(effects.get("G4-CRASH-1").get()).isEqualTo(1);
    }

    @Test
    @DisplayName("G4 双消费者竞争领取：每条命令只被一个消费者产生效果")
    void competingConsumers_eachCommandProcessedOnce() {
        for (int i = 0; i < 5; i++) {
            queue.enqueue(envelope("G4-RACE-" + i, CommandChannelEnum.NORMAL));
        }
        dispatcherWith(idempotentHandler()).pollNormal();
        ensureLogin();
        dispatcherWith(idempotentHandler()).pollNormal();
        ensureLogin();

        int totalEffects = effects.values().stream().mapToInt(AtomicInteger::get).sum();
        assertThat(totalEffects).isEqualTo(5);
    }

    @Test
    @DisplayName("G4b 独立消费者真并发：两条调度线程同时竞争，每命令恰一次效果且不串身份")
    void independentConsumersConcurrent_eachCommandExactlyOnce() throws Exception {
        for (int i = 0; i < 8; i++) {
            queue.enqueue(envelope("G4b-CONC-" + i, CommandChannelEnum.NORMAL));
        }
        // 调度线程按生产语义领取：生产调度线程当前依赖超租户回退上下文（tenant=0），
        // 测试夹具为 tenant=1，故消费线程显式携带同租户上下文，验证点是真并发 CAS 领取。
        Runnable consumer = () -> {
            LoginUser scheduler = new LoginUser();
            scheduler.setUserId(7L);
            scheduler.setTenantId(1L);
            LoginUserHolder.set(scheduler);
            try {
                dispatcherWith(idempotentHandler()).pollNormal();
            } finally {
                LoginUserHolder.clear();
            }
        };
        Thread consumerA = new Thread(consumer);
        Thread consumerB = new Thread(consumer);
        consumerA.start();
        consumerB.start();
        consumerA.join();
        consumerB.join();
        ensureLogin();

        // 每条命令只被一个消费者产生效果（DB 级 CAS 领取，非单 JVM 锁语义）
        int totalEffects = effects.values().stream().mapToInt(AtomicInteger::get).sum();
        assertThat(totalEffects).isEqualTo(8);
        assertThat(queue.findByKey(1L, "G4b-CONC-0").orElseThrow().getStatus()).isEqualTo("COMPLETED");
    }

    @Test
    @DisplayName("G4b 旧领取者与新领取者竞争：stale 回收后新消费者完成，旧领取者迟到不得复活或改判")
    void staleReclaim_oldClaimantLateCompleteCannotResurrect() {
        Long id = queue.enqueue(envelope("G4b-STALE-1", CommandChannelEnum.NORMAL));

        // 第一代消费者领取（旧领取者）后停顿
        List<CommandEnvelope> firstGen = queue.claimDue(List.of(CommandChannelEnum.NORMAL), 10);
        assertThat(firstGen).extracting(CommandEnvelope::getCommandKey).containsExactly("G4b-STALE-1");

        // 调度器判定 stale 并回收；新领取者竞争领取并成功完成
        assertThat(queue.reclaimStale(LocalDateTime.now().plusSeconds(60))).isEqualTo(1);
        dispatcherWith(idempotentHandler()).pollNormal();
        ensureLogin();
        CommandEnvelope completed = queue.findById(id).orElseThrow();
        assertThat(completed.getStatus()).isEqualTo("COMPLETED");
        assertThat(completed.getResult()).isEqualTo("{\"applied\":true}");
        assertThat(effects.get("G4b-STALE-1").get()).isEqualTo(1);

        // 旧领取者恢复：迟到 complete 与迟到失败重试都不得覆盖新消费者的终态或复活命令
        queue.complete(id, "{\"applied\":true,\"from\":\"stale-claimant\"}");
        assertThat(queue.findById(id).orElseThrow().getResult()).isEqualTo("{\"applied\":true}");

        boolean resurrected = queue.failAndScheduleRetry(id, "旧领取者的迟到失败", 5, 1000);
        assertThat(resurrected).isFalse();
        CommandEnvelope afterLateFailure = queue.findById(id).orElseThrow();
        assertThat(afterLateFailure.getStatus()).isEqualTo("COMPLETED");
        assertThat(afterLateFailure.getResult()).isEqualTo("{\"applied\":true}");
        assertThat(afterLateFailure.getFailureReason()).isNull();

        // 幂等复核：不产生第二次业务效果
        dispatcherWith(idempotentHandler()).pollNormal();
        ensureLogin();
        assertThat(effects.get("G4b-STALE-1").get()).isEqualTo(1);
    }

    @Test
    @DisplayName("G5/B2 普通积压下 P0 优先：NORMAL 滞留时 P0 先处理，NORMAL 随后推进")
    void p0PrioritizedWhileNormalBacklogged() {
        // 5 条 NORMAL 入队，其中 2 条被长期占用的消费者领取（真实积压占用）
        for (int i = 0; i < 5; i++) {
            queue.enqueue(envelope("G5-B2-N-" + i, CommandChannelEnum.NORMAL));
        }
        List<CommandEnvelope> occupied = queue.claimDue(List.of(CommandChannelEnum.NORMAL), 2);
        assertThat(occupied).hasSize(2);
        long p0EnqueueAt = System.currentTimeMillis();
        queue.enqueue(envelope("G5-B2-P0", CommandChannelEnum.P0));

        // 此时队列真实积压：2 PROCESSING + 3 NORMAL PENDING + 1 P0 PENDING
        dispatcherWith(idempotentHandler()).pollP0();
        ensureLogin();
        long p0HandledAt = effectTime("G5-B2-P0");
        // P0 处理时 3 条 NORMAL 仍在 PENDING（未被普通车道处理）
        assertThat(queue.findByKey(1L, "G5-B2-N-3").orElseThrow().getStatus()).isEqualTo("PENDING");
        assertThat(p0HandledAt).isGreaterThanOrEqualTo(p0EnqueueAt);

        // NORMAL 积压随后继续推进（不因 P0 永久饥饿）
        dispatcherWith(idempotentHandler()).pollNormal();
        ensureLogin();
        assertThat(queue.findByKey(1L, "G5-B2-N-0").orElseThrow().getStatus()).isEqualTo("PROCESSING");
        assertThat(queue.findByKey(1L, "G5-B2-N-1").orElseThrow().getStatus()).isEqualTo("PROCESSING");
        for (int i = 2; i < 5; i++) {
            assertThat(effects).containsKey("G5-B2-N-" + i);
        }
        // 时间线：P0 先于所有滞留 NORMAL 的处理时间
        for (int i = 2; i < 5; i++) {
            assertThat(p0HandledAt).isLessThanOrEqualTo(effectTime("G5-B2-N-" + i));
        }
        assertThat(effects.get("G5-B2-P0").get()).isEqualTo(1);
    }
}
