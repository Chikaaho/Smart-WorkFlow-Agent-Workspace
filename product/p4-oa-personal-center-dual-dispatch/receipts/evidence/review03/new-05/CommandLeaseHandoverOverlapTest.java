package com.sw.ck.bpm.process.queue;

import com.sw.ck.bpm.process.dto.ApprovalActionRequest;
import com.sw.ck.bpm.process.entity.CommandChannelEnum;
import com.sw.ck.bpm.process.entity.CommandTypeEnum;
import com.sw.ck.bpm.process.queue.support.QueueH2TestConfig;
import com.sw.ck.common.exception.BaseException;
import com.sw.ck.common.response.R;
import com.sw.ck.bpm.process.service.TaskActionService;
import com.sw.ck.security.holder.LoginUser;
import com.sw.ck.security.holder.LoginUserHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * G4b 同业务对象租约交接重叠窗口验证（真实处理器 + 受控外部效果适配器）：
 * <p>
 * 场景：同一审批任务 t9（两名可办理人 u1/u2）。u1 的 NORMAL 命令被消费者 A 领取
 * 并**正在处理中**（业务执行中途阻塞）；租约到期被 stale 回收，u2 的 P0 命令与
 * 消费者 B 在同一命令上交接。断言：交接重叠期间旧持有者迟到的业务执行与结果
 * 写回均被当前领取权/幂等语义拒绝，业务效果恰一次、命令终态确定、无身份串用。
 * 外部效果（引擎任务完成）以受控适配器记录，等价真实"任务完成一次"语义。
 * </p>
 */
@SpringBootTest(classes = QueueH2TestConfig.class,
        webEnvironment = SpringBootTest.WebEnvironment.NONE)
@DisplayName("G4b 租约交接重叠窗口（同任务/双消费者/NORMAL+P0）")
class CommandLeaseHandoverOverlapTest {

    @Autowired
    private BpmCommandQueue queue;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /** 受控任务状态：taskId -> (assignee, status)；effects 只允许一条完成记录。 */
    private static final Map<String, String> TASK_ASSIGNEE = Map.of("t9", "7");
    private static final Set<Long> CAN_HANDLE = Set.of(7L, 8L);
    private static final Map<String, String> TASK_STATUS = new java.util.concurrent.ConcurrentHashMap<>();
    private static final ConcurrentLinkedQueue<String> EFFECTS = new ConcurrentLinkedQueue<>();
    private static final ConcurrentLinkedQueue<String> ATTEMPTS = new ConcurrentLinkedQueue<>();
    /** 第一次（旧持有者）业务执行中途阻塞；B 完成后放行，制造真实重叠窗口。 */
    private static volatile CountDownLatch firstHandleBlock;

    /** 受控 TaskActionService：镜像真实语义（越权/任务不存在确定性拒绝 + 单次完成）。 */
    static class ControlledTaskActionService extends TaskActionService {
        ControlledTaskActionService() {
            super(null, null, null, null, null, null, null, null);
        }

        @Override
        public com.sw.ck.common.response.R<Void> execute(String taskId, ApprovalActionRequest request) {
            LoginUser user = LoginUserHolder.get();
            ATTEMPTS.add(user.getUserId() + "->" + taskId + "@" + System.nanoTime());
            CountDownLatch latch = firstHandleBlock;
            if (latch != null && ATTEMPTS.size() == 1) {
                try {
                    latch.await(10, TimeUnit.SECONDS);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    throw new IllegalStateException(e);
                }
            }
            String status = TASK_STATUS.get(taskId);
            if (status == null || "DONE".equals(status)) {
                // 与真实引擎一致：任务已完成/不存在 → 确定性拒绝，不产生第二次效果
                throw new BaseException(404, "任务不存在");
            }
            if (!CAN_HANDLE.contains(user.getUserId())) {
                throw new BaseException(403, "无权处理该任务");
            }
            TASK_STATUS.put(taskId, "DONE");
            EFFECTS.add(user.getUserId() + "->" + taskId + ":" + request.getAction());
            return R.ok();
        }
    }

    private final ControlledTaskActionService controlledService = new ControlledTaskActionService();
    private final TaskActionCommandHandler realHandler =
            new TaskActionCommandHandler(controlledService, new com.fasterxml.jackson.databind.ObjectMapper());

    private final AtomicReference<Throwable> oldClaimantFailure = new AtomicReference<>();

    @BeforeEach
    void setUp() {
        LoginUser fixtureUser = new LoginUser();
        fixtureUser.setUserId(7L);
        fixtureUser.setTenantId(1L);
        LoginUserHolder.set(fixtureUser);
        TASK_STATUS.clear();
        TASK_STATUS.put("t9", "PENDING");
        EFFECTS.clear();
        ATTEMPTS.clear();
        firstHandleBlock = new CountDownLatch(1);
        oldClaimantFailure.set(null);
        jdbcTemplate.update("DELETE FROM sw_bpm_command");
    }

    @AfterEach
    void tearDown() {
        firstHandleBlock.countDown();
        LoginUserHolder.clear();
    }

    private CommandEnvelope envelope(String key, CommandChannelEnum channel, long initiator) {
        CommandEnvelope envelope = new CommandEnvelope();
        envelope.setCommandType(CommandTypeEnum.TASK_APPROVE);
        envelope.setChannel(channel);
        envelope.setCommandKey(key);
        envelope.setTenantId(1L);
        envelope.setInitiatorId(initiator);
        ApprovalActionRequest request = new ApprovalActionRequest();
        request.setTaskId("t9");
        request.setAction(com.sw.ck.bpm.process.dto.ApprovalAction.APPROVE);
        try {
            envelope.setPayload(new com.fasterxml.jackson.databind.ObjectMapper()
                    .writeValueAsString(request));
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
        return envelope;
    }

    private CommandDispatcher dispatcherB() {
        CommandDispatcher dispatcher = new CommandDispatcher(queue, List.of(realHandler));
        ReflectionTestUtils.setField(dispatcher, "batchSize", 20);
        ReflectionTestUtils.setField(dispatcher, "p0BatchSize", 5);
        ReflectionTestUtils.setField(dispatcher, "staleSeconds", 60);
        ReflectionTestUtils.setField(dispatcher, "maxRetries", 1);
        return dispatcher;
    }

    @Test
    @DisplayName("G4b 处理中租约被回收+P0/B 交接：旧持有者迟到执行与写回被拒，业务效果恰一次")
    void leaseHandoverOverlap_oldClaimantLateExecutionAndWriteRejected() throws Exception {
        // 1. u1 的 NORMAL 命令受理
        CommandEnvelope envN = envelope("TASK_APPROVE:t9:7", CommandChannelEnum.NORMAL, 7L);
        queue.enqueue(envN);
        Long cmdN = envN.getCommandId();

        // 2. 消费者 A 领取并进入业务执行（服务在第一次执行处阻塞 = 处理中重叠窗口）
        List<CommandEnvelope> claimed = queue.claimDue(List.of(CommandChannelEnum.NORMAL), 10);
        assertThat(claimed).extracting(CommandEnvelope::getCommandId).containsExactly(cmdN);
        Thread consumerA = new Thread(() -> {
            LoginUser u1 = new LoginUser();
            u1.setUserId(7L);
            u1.setTenantId(1L);
            LoginUserHolder.set(u1);
            try {
                realHandler.handle(claimed.get(0));
            } catch (Throwable t) {
                oldClaimantFailure.set(t);
                // 旧持有者迟到失败处理（真实调度器行为）
                queue.failAndScheduleRetry(cmdN, "旧持有者迟到失败", 5, 1000);
            } finally {
                LoginUserHolder.clear();
            }
        });
        consumerA.start();
        long deadline = System.currentTimeMillis() + 5000;
        while (ATTEMPTS.isEmpty() && System.currentTimeMillis() < deadline) {
            Thread.sleep(20);
        }
        assertThat(ATTEMPTS).isNotEmpty();

        // 3. 租约到期回收：命令回 PENDING，而 A 仍在业务执行中（重叠成立）
        assertThat(queue.reclaimStale(LocalDateTime.now().plusSeconds(60))).isEqualTo(1);
        assertThat(queue.findById(cmdN).orElseThrow().getStatus()).isEqualTo("PENDING");

        // 4. u2 的 P0 命令受理（同任务 t9）
        CommandEnvelope envP = envelope("TASK_APPROVE:t9:8", CommandChannelEnum.P0, 8L);
        queue.enqueue(envP);
        Long cmdP = envP.getCommandId();

        // 5. 消费者 B（真实调度循环）：P0 完成任务（业务效果恰一次）→ 再领取被回收的 cmdN
        CommandDispatcher consumerB = dispatcherB();
        LoginUser scheduler = new LoginUser();
        scheduler.setUserId(8L);
        scheduler.setTenantId(1L);
        LoginUserHolder.set(scheduler);
        try {
            consumerB.pollP0();
            // dispatchOne 结束会清理线程身份（生产中查询方总有身份）；断言前恢复
            LoginUserHolder.set(scheduler);
            assertThat(queue.findById(cmdP).orElseThrow().getStatus()).isEqualTo("COMPLETED");
            consumerB.pollNormal();
            LoginUserHolder.set(scheduler);
            assertThat(queue.findById(cmdN).orElseThrow().getStatus()).isEqualTo("FAILED");
        } finally {
            LoginUserHolder.clear();
        }

        // 6. 放行旧持有者：其迟到业务执行被"任务不存在"拒绝，迟到失败处理不改终态
        firstHandleBlock.countDown();
        consumerA.join(10000);
        assertThat(oldClaimantFailure.get()).isNotNull().hasMessageContaining("任务不存在");
        LoginUser reader = new LoginUser();
        reader.setUserId(7L);
        reader.setTenantId(1L);
        LoginUserHolder.set(reader);
        queue.complete(cmdN, "{\"late\":true}");
        assertThat(queue.findById(cmdN).orElseThrow().getStatus()).isEqualTo("FAILED");

        // 7. 断言：业务效果恰一次（u2 完成），两次执行尝试身份正确（u1/u2 不串）
        assertThat(EFFECTS).containsExactly("8->t9:APPROVE");
        assertThat(ATTEMPTS.stream().map(s -> s.split("->")[0]))
                .containsExactly("7", "8", "7");
        assertThat(TASK_STATUS.get("t9")).isEqualTo("DONE");
    }
}
