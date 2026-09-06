package com.sw.ck.bootstrap.p4overlap;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sw.ck.bpm.api.event.BpmNotifyEvent;
import com.sw.ck.bpm.api.facade.BpmTaskFacade;
import com.sw.ck.bpm.engine.facade.BpmTaskFacadeImpl;
import com.sw.ck.bpm.process.dto.ApprovalActionRequest;
import com.sw.ck.bpm.process.entity.CommandChannelEnum;
import com.sw.ck.bpm.process.entity.CommandTypeEnum;
import com.sw.ck.bpm.process.queue.BpmCommandQueue;
import com.sw.ck.bpm.process.queue.CommandDispatcher;
import com.sw.ck.bpm.process.queue.CommandEnvelope;
import com.sw.ck.bpm.process.queue.TaskActionCommandHandler;
import com.sw.ck.bpm.process.service.ApprovalActionService;
import com.sw.ck.bpm.process.service.TaskActionService;
import com.sw.ck.bpm.process.service.impl.ApprovalActionServiceImpl;
import com.sw.ck.bpm.process.service.impl.BpmInstanceServiceImpl;
import com.sw.ck.common.event.DomainEventPublisher;
import com.sw.ck.common.security.LoginContextProvider;
import com.sw.ck.security.holder.LoginUser;
import com.sw.ck.security.holder.LoginUserHolder;
import org.flowable.engine.ProcessEngine;
import org.flowable.engine.ProcessEngineConfiguration;
import org.flowable.engine.RuntimeService;
import org.flowable.engine.TaskService;
import org.flowable.engine.impl.cfg.ProcessEngineConfigurationImpl;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import java.util.function.UnaryOperator;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * G4b 三个独立断言（提示05 §4）：真实审批核心/引擎/队列，无业务替身。
 * <ol>
 *   <li>跨通道重叠：同实例两个任务上 NORMAL 与 P0 两个真实命令，两个消费者处理区间
 *       可证相交（max(start) &lt; min(end)），实际提交顺序由事件记录，业务/通知效果单次，身份不串。</li>
 *   <li>同命令租约交接：新持有者已取得领取权且仍 PROCESSING（真实执行中途）时，
 *       旧持有者的迟到完成/迟到失败写回发生且被租约令牌拒绝，不污染当前领取者；
 *       旧写回事件位于新领取后、其终态前。</li>
 *   <li>同命令业务已成功而确认丢失：重投原命令回查自身已提交结果并恢复一致的可回查
 *       命令结果（COMPLETED/RECOVERED），审批与通知不得第二次执行；不误报"已被处理"永久失败。</li>
 * </ol>
 * 窗口控制：门控只在引擎 complete 的进入/离开处做计时与栅栏（记录型适配），
 * 审批判定、动作落库、实例状态与通知均为真实 {@link TaskActionService} 行为。
 */
@SpringBootTest(classes = CommandOverlapRealEngineTest.Config.class,
        webEnvironment = SpringBootTest.WebEnvironment.NONE)
@DisplayName("G4b 真实审批核心：跨通道重叠 / 租约交接 / 同命令恢复自身成功")
class CommandOverlapRealEngineTest {

    private static final ConcurrentLinkedQueue<Object> PUBLISHED = new ConcurrentLinkedQueue<>();
    /** 实际运行事件：(epochMillis|事件名|taskId|线程名)。 */
    private static final ConcurrentLinkedQueue<String> EVENTS = new ConcurrentLinkedQueue<>();

    @Autowired
    private BpmCommandQueue queue;

    @Autowired
    private TaskActionCommandHandler realHandler;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @org.springframework.context.annotation.Configuration
    @Import(OverlapH2TestConfig.class)
    static class Config {

        @Bean
        public BpmTaskFacade bpmTaskFacade() {
            return new GatedTaskFacade(EngineHolder.TASK_SERVICE, EngineHolder.RUNTIME_SERVICE,
                    EngineHolder.ENGINE.getRepositoryService(), EngineHolder.ENGINE.getHistoryService());
        }

        @Bean
        public com.sw.ck.common.datascope.DeptScopeProvider deptScopeProvider() {
            return new com.sw.ck.common.datascope.DeptScopeProvider() {
                @Override
                public java.util.List<Long> listChildDeptIds(Long deptId) {
                    return java.util.List.of();
                }
            };
        }

        @Bean
        public BpmInstanceServiceImpl bpmInstanceService(LoginContextProvider provider,
                                                         com.sw.ck.common.datascope.DeptScopeProvider deptScopeProvider) {
            return new BpmInstanceServiceImpl(provider, deptScopeProvider);
        }

        @Bean
        public ApprovalActionService approvalActionService() {
            return new ApprovalActionServiceImpl();
        }

        @Bean
        public ObjectMapper objectMapper() {
            return new ObjectMapper();
        }

        @Bean
        public TaskActionService taskActionService(BpmTaskFacade bpmTaskFacade,
                                                   BpmInstanceServiceImpl bpmInstanceService,
                                                   ObjectMapper objectMapper,
                                                   ApprovalActionService approvalActionService) {
            return new TaskActionService(bpmTaskFacade, bpmInstanceService, null,
                    new DomainEventPublisher(PUBLISHED::add), null, approvalActionService,
                    objectMapper, null);
        }

        @Bean
        public TaskActionCommandHandler taskActionCommandHandler(TaskActionService service,
                                                                 ApprovalActionService approvalActionService,
                                                                 ObjectMapper objectMapper) {
            return new TaskActionCommandHandler(service, approvalActionService, objectMapper);
        }
    }

    /** 引擎在宿主类加载时启动；单节点流程 overlap_p + 并行双节点流程 overlap_par。 */
    static class EngineHolder {
        static final ProcessEngine ENGINE;
        static final TaskService TASK_SERVICE;
        static final RuntimeService RUNTIME_SERVICE;

        static {
            ProcessEngineConfigurationImpl config = (ProcessEngineConfigurationImpl)
                    ProcessEngineConfiguration.createStandaloneInMemProcessEngineConfiguration();
            config.setDatabaseSchemaUpdate(ProcessEngineConfiguration.DB_SCHEMA_UPDATE_TRUE);
            ENGINE = config.buildProcessEngine();
            TASK_SERVICE = ENGINE.getTaskService();
            RUNTIME_SERVICE = ENGINE.getRuntimeService();
            String single = """
                    <?xml version="1.0" encoding="UTF-8"?>
                    <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
                                 xmlns:flowable="http://flowable.org/bpmn"
                                 targetNamespace="http://sw.ck/overlap">
                      <process id="overlap_p" isExecutable="true">
                        <startEvent id="s"/>
                        <sequenceFlow sourceRef="s" targetRef="t"/>
                        <userTask id="t" name="审批" flowable:assignee="${approver}"/>
                        <sequenceFlow sourceRef="t" targetRef="e"/>
                        <endEvent id="e"/>
                      </process>
                    </definitions>
                    """;
            String parallel = """
                    <?xml version="1.0" encoding="UTF-8"?>
                    <definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
                                 xmlns:flowable="http://flowable.org/bpmn"
                                 targetNamespace="http://sw.ck/overlap">
                      <process id="overlap_par" isExecutable="true">
                        <startEvent id="s"/>
                        <sequenceFlow sourceRef="s" targetRef="split"/>
                        <parallelGateway id="split"/>
                        <sequenceFlow sourceRef="split" targetRef="t1"/>
                        <sequenceFlow sourceRef="split" targetRef="t2"/>
                        <userTask id="t1" name="审批一" flowable:assignee="${approver1}"/>
                        <userTask id="t2" name="审批二" flowable:assignee="${approver2}"/>
                        <sequenceFlow sourceRef="t1" targetRef="join"/>
                        <sequenceFlow sourceRef="t2" targetRef="join"/>
                        <parallelGateway id="join"/>
                        <sequenceFlow sourceRef="join" targetRef="e"/>
                        <endEvent id="e"/>
                      </process>
                    </definitions>
                    """;
            // 定义带租户 "1" 部署：与真实引擎查询的 taskTenantId 口径一致
            ENGINE.getRepositoryService().createDeployment()
                    .tenantId("1")
                    .addString("overlap_p.bpmn20.xml", single).deploy();
            ENGINE.getRepositoryService().createDeployment()
                    .tenantId("1")
                    .addString("overlap_par.bpmn20.xml", parallel).deploy();
        }
    }

    /**
     * 门控引擎门面：仅对 complete/completeAsUser 做"进入事件 → 栅栏 → 真实完成 → 离开事件"。
     * 业务判定完全委托真实 {@link BpmTaskFacadeImpl}；栅栏只制造可复现的重叠窗口。
     * byTask 模式：不同任务各一个到达者，栅栏键 = taskId；
     * byArrival 模式：同任务多个到达者，栅栏键 = taskId#到达序。
     */
    static class GatedTaskFacade extends BpmTaskFacadeImpl {
        static volatile boolean gatingEnabled = false;
        static volatile boolean byArrivalMode = false;
        static final Map<String, CountDownLatch> ARRIVAL_GATES = new java.util.concurrent.ConcurrentHashMap<>();
        static final Map<String, Integer> TASK_ARRIVALS = new java.util.concurrent.ConcurrentHashMap<>();
        static final java.util.concurrent.atomic.AtomicInteger GLOBAL_ARRIVALS =
                new java.util.concurrent.atomic.AtomicInteger();
        static volatile CountDownLatch afterFirstArrival;
        static volatile CountDownLatch afterSecondArrival;

        GatedTaskFacade(org.flowable.engine.TaskService taskService, RuntimeService runtimeService,
                        org.flowable.engine.RepositoryService repositoryService,
                        org.flowable.engine.HistoryService historyService) {
            super(taskService, runtimeService, repositoryService, historyService);
        }

        private void beforeComplete(String taskId) {
            event("engine-complete-enter", taskId);
            if (!gatingEnabled) {
                return;
            }
            int globalIndex = GLOBAL_ARRIVALS.incrementAndGet();
            if (globalIndex == 1 && afterFirstArrival != null) {
                afterFirstArrival.countDown();
            }
            if (globalIndex == 2 && afterSecondArrival != null) {
                afterSecondArrival.countDown();
            }
            String key = byArrivalMode
                    ? taskId + "#" + TASK_ARRIVALS.merge(taskId, 1, Integer::sum)
                    : taskId;
            await(ARRIVAL_GATES.get(key));
        }

        private void afterComplete(String taskId) {
            event("engine-complete-exit", taskId);
        }

        @Override
        public void complete(String taskId, Map<String, Object> variables) {
            beforeComplete(taskId);
            super.complete(taskId, variables);
            afterComplete(taskId);
        }

        @Override
        public void completeAsUser(String taskId, String userId, Map<String, Object> variables) {
            beforeComplete(taskId);
            super.completeAsUser(taskId, userId, variables);
            afterComplete(taskId);
        }

        private static void await(CountDownLatch latch) {
            if (latch == null) {
                return;
            }
            try {
                if (!latch.await(30, TimeUnit.SECONDS)) {
                    throw new IllegalStateException("栅栏等待超时（窗口控制失败）");
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new IllegalStateException(e);
            }
        }
    }

    private static void event(String name, String taskId) {
        EVENTS.add(System.currentTimeMillis() + "|" + name + "|" + taskId + "|"
                + Thread.currentThread().getName());
    }

    @BeforeEach
    void setUp() {
        jdbcTemplate.update("DELETE FROM sw_bpm_command");
        jdbcTemplate.update("DELETE FROM sw_bpm_instance");
        jdbcTemplate.update("DELETE FROM sw_bpm_approval_action");
        PUBLISHED.clear();
        EVENTS.clear();
        GatedTaskFacade.gatingEnabled = false;
        GatedTaskFacade.byArrivalMode = false;
        GatedTaskFacade.ARRIVAL_GATES.clear();
        GatedTaskFacade.TASK_ARRIVALS.clear();
        GatedTaskFacade.GLOBAL_ARRIVALS.set(0);
        GatedTaskFacade.afterFirstArrival = null;
        GatedTaskFacade.afterSecondArrival = null;
    }

    @AfterEach
    void tearDown() {
        LoginUserHolder.clear();
        GatedTaskFacade.gatingEnabled = false;
        GatedTaskFacade.ARRIVAL_GATES.clear();
    }

    // ==================== 断言1：跨通道不同命令竞争 ====================

    @Test
    @DisplayName("断言1：同实例 NORMAL(t1,u1) 与 P0(t2,u2) 两命令处理区间相交，提交顺序可证，业务/通知单次，身份不串")
    void assertion1_crossChannelCommands_overlap_windows() throws Exception {
        // 0. 主线程以调度读者身份登录（MyBatis 租户拦截器按当前上下文过滤读写）
        LoginUser mainReader = new LoginUser();
        mainReader.setUserId(8L);
        mainReader.setTenantId(1L);
        LoginUserHolder.set(mainReader);

        // 1. 真实引擎发起并行双任务实例（租户 1）
        var pi = EngineHolder.RUNTIME_SERVICE.startProcessInstanceByKeyAndTenantId(
                "overlap_par", "biz-xchan-001",
                Map.of("approver1", "7", "approver2", "8"), "1");
        String flowablePid = pi.getProcessInstanceId();
        org.flowable.task.api.Task t1 = EngineHolder.TASK_SERVICE.createTaskQuery()
                .processInstanceId(flowablePid).taskDefinitionKey("t1").singleResult();
        org.flowable.task.api.Task t2 = EngineHolder.TASK_SERVICE.createTaskQuery()
                .processInstanceId(flowablePid).taskDefinitionKey("t2").singleResult();
        insertInstance(998, flowablePid, "overlap_par", "biz-xchan-001", 7L);

        // 2. 受理两个真实命令：NORMAL(u1 审 t1)、P0(u2 审 t2)
        Long cmdA = enqueueTaskAction("TASK_APPROVE:" + t1.getId() + ":7",
                CommandChannelEnum.NORMAL, 7L, t1.getId());
        Long cmdB = enqueueTaskAction("TASK_APPROVE:" + t2.getId() + ":8",
                CommandChannelEnum.P0, 8L, t2.getId());

        // 3. 窗口控制：两消费者都到达引擎 complete 后，t1 先真实提交；
        //    t2 等 cmdA 终态（COMPLETED）后才放行提交 → 实际提交顺序 t1 → t2 且区间相交
        GatedTaskFacade.gatingEnabled = true;
        CountDownLatch gateT1 = new CountDownLatch(1);
        CountDownLatch gateT2 = new CountDownLatch(1);
        CountDownLatch secondConsumerArrived = new CountDownLatch(1);
        GatedTaskFacade.afterSecondArrival = secondConsumerArrived; // 第 2 个到达者进入时计数
        GatedTaskFacade.ARRIVAL_GATES.put(t1.getId(), gateT1);
        GatedTaskFacade.ARRIVAL_GATES.put(t2.getId(), gateT2);

        CommandDispatcher dispatcher = newDispatcher();
        Thread laneNormal = lane(dispatcher, "pollNormal");
        Thread laneP0 = lane(dispatcher, "pollP0");
        laneNormal.start();
        laneP0.start();

        // 4. 两消费者都到达引擎 complete（处理区间重叠窗口打开），两命令均已领取
        assertThat(secondConsumerArrived.await(20, TimeUnit.SECONDS)).isTrue();
        assertThat(queue.findById(cmdA).orElseThrow().getStatus()).isEqualTo("PROCESSING");
        assertThat(queue.findById(cmdB).orElseThrow().getStatus()).isEqualTo("PROCESSING");

        // 5. 放行 t1（NORMAL）真实提交 → 等 cmdA COMPLETED → 放行 t2（P0）提交
        gateT1.countDown();
        awaitCommandStatus(cmdA, "COMPLETED");
        gateT2.countDown();
        laneNormal.join(30000);
        laneP0.join(30000);
        assertThat(laneNormal.isAlive()).isFalse();
        assertThat(laneP0.isAlive()).isFalse();
        awaitCommandStatus(cmdB, "COMPLETED");

        // 6. 事件窗口判定：max(enterT1, enterT2) < min(endA, endB)
        long enterT1 = eventTime("engine-complete-enter", t1.getId());
        long enterT2 = eventTime("engine-complete-enter", t2.getId());
        long endA = finishedAtMillis(cmdA);
        long endB = finishedAtMillis(cmdB);
        long overlapStart = Math.max(enterT1, enterT2);
        long overlapEnd = Math.min(endA, endB);
        assertThat(overlapStart)
                .as("重叠窗口: enterT1=%d enterT2=%d endA=%d endB=%d", enterT1, enterT2, endA, endB)
                .isLessThan(overlapEnd);

        // 7. 实际提交顺序：t1 引擎完成先于 t2 引擎完成
        assertThat(eventTime("engine-complete-exit", t1.getId()))
                .isLessThan(eventTime("engine-complete-exit", t2.getId()));

        // 8. 命令终态与通道
        CommandEnvelope doneA = queue.findById(cmdA).orElseThrow();
        CommandEnvelope doneB = queue.findById(cmdB).orElseThrow();
        assertThat(doneA.getStatus()).isEqualTo("COMPLETED");
        assertThat(doneB.getStatus()).isEqualTo("COMPLETED");
        assertThat(doneA.getChannel()).isEqualTo(CommandChannelEnum.NORMAL);
        assertThat(doneB.getChannel()).isEqualTo(CommandChannelEnum.P0);

        // 9. 单次业务效果、身份不串：动作恰两条且与各自命令发起人/命令标识一致
        Map<String, Map<String, Object>> actionByTask = jdbcTemplate.queryForList(
                "select task_id, actor_id, action, command_id from sw_bpm_approval_action "
                        + "where process_instance_id = ?", flowablePid).stream()
                .collect(Collectors.toMap(r -> (String) r.get("task_id"), UnaryOperator.identity()));
        assertThat(actionByTask).containsOnlyKeys(t1.getId(), t2.getId());
        Map<String, Object> rowT1 = actionByTask.get(t1.getId());
        Map<String, Object> rowT2 = actionByTask.get(t2.getId());
        assertThat(rowT1.get("actor_id")).isEqualTo(7L);
        assertThat(rowT1.get("action")).isEqualTo("APPROVE");
        assertThat(((Number) rowT1.get("command_id")).longValue()).isEqualTo(cmdA);
        assertThat(rowT2.get("actor_id")).isEqualTo(8L);
        assertThat(rowT2.get("action")).isEqualTo("APPROVE");
        assertThat(((Number) rowT2.get("command_id")).longValue()).isEqualTo(cmdB);

        // 10. 流程终态与通知：实例 APPROVED、通知恰一次、任务无残留
        assertThat(instanceStatus(flowablePid)).isEqualTo("APPROVED");
        long notifyEvents = PUBLISHED.stream().filter(e -> e instanceof BpmNotifyEvent).count();
        assertThat(notifyEvents).isEqualTo(1);
        assertThat(EngineHolder.TASK_SERVICE.createTaskQuery()
                .processInstanceId(flowablePid).count()).isZero();
    }

    // ==================== 断言2：同命令租约交接 ====================

    @Test
    @DisplayName("断言2：新持有者仍 PROCESSING（真实执行中途）时旧持有者迟到完成/失败写回被租约拒绝，不污染当前领取者")
    void assertion2_leaseHandover_lateWriteBackDuringNewHolderProcessing_rejected() throws Exception {
        // 1. 真实引擎发起单任务实例
        var pi = EngineHolder.RUNTIME_SERVICE.startProcessInstanceByKeyAndTenantId(
                "overlap_p", "biz-lease-001", Map.of("approver", "7"), "1");
        String flowablePid = pi.getProcessInstanceId();
        org.flowable.task.api.Task task = EngineHolder.TASK_SERVICE.createTaskQuery()
                .processInstanceId(flowablePid).singleResult();
        insertInstance(997, flowablePid, "overlap_p", "biz-lease-001", 7L);

        // 2. u1 的 NORMAL 命令受理；消费者 A 领取（旧租约令牌）并进入真实执行（阻塞在引擎 complete）
        Long cmd = enqueueTaskAction("TASK_APPROVE:" + task.getId() + ":7",
                CommandChannelEnum.NORMAL, 7L, task.getId());
        GatedTaskFacade.gatingEnabled = true;
        GatedTaskFacade.byArrivalMode = true;
        CountDownLatch gateFirstArrival = new CountDownLatch(1);
        CountDownLatch gateSecondArrival = new CountDownLatch(1);
        GatedTaskFacade.afterFirstArrival = new CountDownLatch(1);
        GatedTaskFacade.afterSecondArrival = new CountDownLatch(1);
        GatedTaskFacade.ARRIVAL_GATES.put(task.getId() + "#1", gateFirstArrival);
        GatedTaskFacade.ARRIVAL_GATES.put(task.getId() + "#2", gateSecondArrival);

        LoginUser claimIdentity = new LoginUser();
        claimIdentity.setUserId(7L);
        claimIdentity.setTenantId(1L);
        LoginUserHolder.set(claimIdentity);
        List<CommandEnvelope> firstGen = queue.claimDue(List.of(CommandChannelEnum.NORMAL), 10);
        assertThat(firstGen).extracting(CommandEnvelope::getCommandId).containsExactly(cmd);
        String firstGenToken = firstGen.get(0).getClaimToken();
        assertThat(firstGenToken).isNotBlank();

        AtomicReference<String> consumerAResult = new AtomicReference<>();
        AtomicReference<Throwable> consumerAFailure = new AtomicReference<>();
        Thread consumerA = consumerThread(firstGen.get(0), consumerAResult, consumerAFailure);
        consumerA.start();
        assertThat(GatedTaskFacade.afterFirstArrival.await(20, TimeUnit.SECONDS)).isTrue();

        // 3. 租约回收 → 新持有者 B 领取（新令牌）并进入真实执行（阻塞在引擎 complete）：
        //    此时 B 已取得领取权且仍 PROCESSING
        assertThat(queue.reclaimStale(LocalDateTime.now().plusSeconds(60))).isEqualTo(1);
        List<CommandEnvelope> secondGen = queue.claimDue(List.of(CommandChannelEnum.NORMAL), 10);
        assertThat(secondGen).extracting(CommandEnvelope::getCommandId).containsExactly(cmd);
        String secondGenToken = secondGen.get(0).getClaimToken();
        assertThat(secondGenToken).isNotBlank().isNotEqualTo(firstGenToken);

        AtomicReference<String> consumerBResult = new AtomicReference<>();
        AtomicReference<Throwable> consumerBFailure = new AtomicReference<>();
        Thread consumerB = consumerThread(secondGen.get(0), consumerBResult, consumerBFailure);
        consumerB.start();
        assertThat(GatedTaskFacade.afterSecondArrival.await(20, TimeUnit.SECONDS)).isTrue();
        assertThat(queue.findById(cmd).orElseThrow().getStatus()).isEqualTo("PROCESSING");

        // 4. 旧持有者迟到写回（位于新领取后、B 终态前）：
        //    迟到完成 → 租约令牌不匹配被拒，命令仍 PROCESSING 且结果未被覆盖
        LoginUser u1 = new LoginUser();
        u1.setUserId(7L);
        u1.setTenantId(1L);
        LoginUserHolder.set(u1);
        event("old-holder-late-writeback", task.getId());
        queue.complete(cmd, firstGenToken, "{\"status\":\"LATE_FIRST_GEN\"}");
        CommandEnvelope afterLateComplete = queue.findById(cmd).orElseThrow();
        assertThat(afterLateComplete.getStatus()).isEqualTo("PROCESSING");
        assertThat(afterLateComplete.getResult()).isNull();

        //    迟到失败 → 不得把当前持有者打回 PENDING 或改判终态
        boolean lateRetried = queue.failAndScheduleRetry(cmd, firstGenToken,
                "旧持有者迟到失败", 5, 1000);
        assertThat(lateRetried).isFalse();
        assertThat(queue.findById(cmd).orElseThrow().getStatus()).isEqualTo("PROCESSING");

        // 5. 放行 B（新持有者）真实完成业务 → 动作落库/实例 APPROVED/通知一次 → B 确认 COMPLETED
        gateSecondArrival.countDown();
        consumerB.join(30000);
        assertThat(consumerB.isAlive()).isFalse();
        assertThat(consumerBFailure.get()).isNull();
        assertThat(consumerBResult.get()).contains("DONE");
        queue.complete(cmd, secondGenToken, consumerBResult.get());
        assertThat(queue.findById(cmd).orElseThrow().getStatus()).isEqualTo("COMPLETED");

        // 6. 放行 A：其引擎 complete 因任务已被 B 完成而失败（迟到业务执行被拒，无第二次效果）
        gateFirstArrival.countDown();
        consumerA.join(30000);
        assertThat(consumerA.isAlive()).isFalse();

        // 7. 断言：B 的终态未被 A 的迟到写回扰乱；单次业务效果
        CommandEnvelope finalCmd = queue.findById(cmd).orElseThrow();
        assertThat(finalCmd.getStatus()).isEqualTo("COMPLETED");
        assertThat(finalCmd.getResult()).contains("DONE").doesNotContain("LATE_FIRST_GEN");
        List<Map<String, Object>> actions = jdbcTemplate.queryForList(
                "select actor_id, action, command_id from sw_bpm_approval_action where task_id = ?",
                task.getId());
        assertThat(actions).hasSize(1);
        assertThat(actions.get(0).get("actor_id")).isEqualTo(7L);
        assertThat(actions.get(0).get("action")).isEqualTo("APPROVE");
        assertThat(((Number) actions.get(0).get("command_id")).longValue()).isEqualTo(cmd);
        long notifyEvents = PUBLISHED.stream().filter(e -> e instanceof BpmNotifyEvent).count();
        assertThat(notifyEvents).isEqualTo(1);
        assertThat(instanceStatus(flowablePid)).isEqualTo("APPROVED");

        // 8. 时序关系（事件记录）：旧写回事件位于 B 到达执行之后、命令终态之前
        long lateWriteBackAt = eventTime("old-holder-late-writeback", task.getId());
        long bEnterAt = eventTime("engine-complete-enter", task.getId(), 2);
        long finishedAt = finishedAtMillis(cmd);
        assertThat(lateWriteBackAt).isGreaterThan(bEnterAt);
        assertThat(lateWriteBackAt).isLessThan(finishedAt);
    }

    // ==================== 断言3：同命令确认丢失恢复自身成功 ====================

    @Test
    @DisplayName("断言3：同命令 ack 丢失重投 → 回查自身已提交结果恢复 COMPLETED(RECOVERED)，不误报'已被处理'，审批/通知不二次")
    void assertion3_sameCommandAckLost_recoversOwnSuccess() throws Exception {
        // 1. 真实引擎发起 + u1 命令受理
        var pi = EngineHolder.RUNTIME_SERVICE.startProcessInstanceByKeyAndTenantId(
                "overlap_p", "biz-acklost-001", Map.of("approver", "7"), "1");
        String flowablePid = pi.getProcessInstanceId();
        org.flowable.task.api.Task task = EngineHolder.TASK_SERVICE.createTaskQuery()
                .processInstanceId(flowablePid).singleResult();
        insertInstance(996, flowablePid, "overlap_p", "biz-acklost-001", 7L);

        Long cmd = enqueueTaskAction("TASK_APPROVE:" + task.getId() + ":7",
                CommandChannelEnum.NORMAL, 7L, task.getId());

        // 2. 消费者 A 真实执行完成（审批生效）但确认丢失（不 ack）
        LoginUser claimIdentity = new LoginUser();
        claimIdentity.setUserId(7L);
        claimIdentity.setTenantId(1L);
        LoginUserHolder.set(claimIdentity);
        List<CommandEnvelope> claimed = queue.claimDue(List.of(CommandChannelEnum.NORMAL), 10);
        assertThat(claimed).extracting(CommandEnvelope::getCommandId).containsExactly(cmd);
        String firstGenToken = claimed.get(0).getClaimToken();
        AtomicReference<String> ackLostResult = new AtomicReference<>();
        AtomicReference<Throwable> ignored = new AtomicReference<>();
        Thread consumerA = consumerThread(claimed.get(0), ackLostResult, ignored);
        consumerA.start();
        consumerA.join(30000);
        assertThat(ackLostResult.get()).contains("DONE");
        assertThat(queue.findById(cmd).orElseThrow().getStatus()).isEqualTo("PROCESSING");
        assertThat(EngineHolder.TASK_SERVICE.createTaskQuery().taskId(task.getId()).count()).isZero();
        assertThat(instanceStatus(flowablePid)).isEqualTo("APPROVED");

        // 3. 租约回收 → 真实调度循环（消费者 B）重投同一命令：
        //    动作记录 command_id == 当前命令 → 恢复自身成功，命令 COMPLETED 而非 FAILED
        assertThat(queue.reclaimStale(LocalDateTime.now().plusSeconds(60))).isEqualTo(1);
        CommandDispatcher consumerB = newDispatcher();
        LoginUser scheduler = new LoginUser();
        scheduler.setUserId(8L);
        scheduler.setTenantId(1L);
        LoginUserHolder.set(scheduler);
        try {
            ReflectionTestUtils.invokeMethod(consumerB, "pollNormal");
        } finally {
            LoginUserHolder.clear();
        }
        LoginUserHolder.set(scheduler);
        CommandEnvelope recovered = queue.findById(cmd).orElseThrow();
        assertThat(recovered.getStatus())
                .as("同命令重投应恢复自身成功而非永久 FAILED")
                .isEqualTo("COMPLETED");
        assertThat(recovered.getFailureReason()).isNull();
        assertThat(recovered.getResult()).contains("RECOVERED").contains("actionRecordId");

        // 4. 旧持有者迟到 ack（旧令牌）：终态 + 租约双守卫拒绝，不覆盖已恢复结果
        LoginUser u1 = new LoginUser();
        u1.setUserId(7L);
        u1.setTenantId(1L);
        LoginUserHolder.set(u1);
        queue.complete(cmd, firstGenToken, ackLostResult.get());
        CommandEnvelope afterLateAck = queue.findById(cmd).orElseThrow();
        assertThat(afterLateAck.getStatus()).isEqualTo("COMPLETED");
        assertThat(afterLateAck.getResult()).contains("RECOVERED");
        LoginUserHolder.clear();

        // 5. 审批/通知不得第二次执行：动作恰一条（u1:APPROVE，command_id 关联本命令）、通知恰一次
        List<Map<String, Object>> actions = jdbcTemplate.queryForList(
                "select actor_id, action, command_id from sw_bpm_approval_action where task_id = ?",
                task.getId());
        assertThat(actions).hasSize(1);
        assertThat(actions.get(0).get("actor_id")).isEqualTo(7L);
        assertThat(actions.get(0).get("action")).isEqualTo("APPROVE");
        assertThat(((Number) actions.get(0).get("command_id")).longValue()).isEqualTo(cmd);
        long notifyEvents = PUBLISHED.stream().filter(e -> e instanceof BpmNotifyEvent).count();
        assertThat(notifyEvents).isEqualTo(1);
        assertThat(instanceStatus(flowablePid)).isEqualTo("APPROVED");
    }

    // ==================== 公共辅助 ====================

    private CommandDispatcher newDispatcher() {
        CommandDispatcher dispatcher = new CommandDispatcher(queue, List.of(realHandler));
        ReflectionTestUtils.setField(dispatcher, "batchSize", 20);
        ReflectionTestUtils.setField(dispatcher, "p0BatchSize", 5);
        ReflectionTestUtils.setField(dispatcher, "staleSeconds", 60);
        ReflectionTestUtils.setField(dispatcher, "maxRetries", 1);
        ReflectionTestUtils.setField(dispatcher, "backoffMillis", 200);
        return dispatcher;
    }

    /** 单次真实调度车道线程（领取 → 还原身份 → 真实 Handler → 队列确认）。 */
    private Thread lane(CommandDispatcher dispatcher, String laneMethod) {
        return new Thread(() -> {
            LoginUser scheduler = new LoginUser();
            scheduler.setUserId(8L);
            scheduler.setTenantId(1L);
            LoginUserHolder.set(scheduler);
            try {
                ReflectionTestUtils.invokeMethod(dispatcher, laneMethod);
            } finally {
                LoginUserHolder.clear();
            }
        }, "lane-" + laneMethod);
    }

    /** 消费者线程：以命令发起人身份调用真实 Handler（不含队列 ack，ack 丢失场景由测试控制）。 */
    private Thread consumerThread(CommandEnvelope envelope,
                                  AtomicReference<String> result,
                                  AtomicReference<Throwable> failure) {
        return new Thread(() -> {
            LoginUser initiator = new LoginUser();
            initiator.setUserId(envelope.getInitiatorId());
            initiator.setTenantId(envelope.getTenantId());
            LoginUserHolder.set(initiator);
            try {
                result.set(realHandler.handle(envelope));
            } catch (Throwable t) {
                failure.set(t);
            } finally {
                LoginUserHolder.clear();
            }
        }, "consumer-" + envelope.getCommandId());
    }

    private Long enqueueTaskAction(String commandKey, CommandChannelEnum channel,
                                   long initiatorId, String taskId) throws Exception {
        CommandEnvelope env = new CommandEnvelope();
        env.setCommandType(CommandTypeEnum.TASK_APPROVE);
        env.setChannel(channel);
        env.setCommandKey(commandKey);
        env.setTenantId(1L);
        env.setInitiatorId(initiatorId);
        ApprovalActionRequest req = new ApprovalActionRequest();
        req.setTaskId(taskId);
        req.setAction(com.sw.ck.bpm.process.dto.ApprovalAction.APPROVE);
        env.setPayload(new ObjectMapper().writeValueAsString(req));
        LoginUser previous = LoginUserHolder.get();
        LoginUser initiator = new LoginUser();
        initiator.setUserId(initiatorId);
        initiator.setTenantId(1L);
        LoginUserHolder.set(initiator);
        try {
            queue.enqueue(env);
        } finally {
            // 恢复调用线程原有上下文（主线程读者身份不被清除）
            if (previous != null) {
                LoginUserHolder.set(previous);
            } else {
                LoginUserHolder.clear();
            }
        }
        return env.getCommandId();
    }

    private void insertInstance(long id, String flowablePid, String processDefKey,
                                String businessKey, long initiatorId) {
        jdbcTemplate.update("""
                insert into sw_bpm_instance (id, process_instance_id, process_def_key, form_key,
                    business_key, initiator_id, status, tenant_id)
                values (?, ?, ?, 'p4_oa_biz_form_20260905b', ?, ?, 'RUNNING', 1)
                """, id, flowablePid, processDefKey, businessKey, initiatorId);
    }

    private void awaitCommandStatus(Long commandId, String expected) throws InterruptedException {
        long deadline = System.currentTimeMillis() + 20000;
        while (System.currentTimeMillis() < deadline) {
            String status = queue.findById(commandId).map(CommandEnvelope::getStatus).orElse(null);
            if (expected.equals(status)) {
                return;
            }
            Thread.sleep(20);
        }
        org.junit.jupiter.api.Assertions.fail("命令 " + commandId + " 未在期限内进入 " + expected);
    }

    private long eventTime(String name, String taskId) {
        return eventTime(name, taskId, 1);
    }

    /** 第 occurrence 次出现的同名事件时间。 */
    private long eventTime(String name, String taskId, int occurrence) {
        List<Long> times = EVENTS.stream()
                .filter(e -> e.contains("|" + name + "|" + taskId + "|"))
                .map(e -> Long.parseLong(e.split("\\|")[0]))
                .sorted()
                .toList();
        if (times.size() < occurrence) {
            throw new AssertionError("缺少事件: " + name + "/" + taskId + " 第" + occurrence + "次，实际=" + EVENTS);
        }
        return times.get(occurrence - 1);
    }

    private long finishedAtMillis(Long commandId) {
        LocalDateTime finishedAt = jdbcTemplate.queryForObject(
                "select finished_at from sw_bpm_command where id = ?", LocalDateTime.class, commandId);
        return finishedAt.atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();
    }

    private String instanceStatus(String flowablePid) {
        return jdbcTemplate.queryForObject(
                "select status from sw_bpm_instance where process_instance_id = ?",
                String.class, flowablePid);
    }

    @Autowired
    private OverlapH2TestConfig.StaleReadWindowQueue windowQueue;

    /**
     * 断言4（提示07 B4）：failAndScheduleRetry 读取校验通过后、实际写回前发生租约交接。
     * 以 A 代（tokenA）的真实行快照注入读取钩子，命令在写回前已被回收并由 B 重领
     *（tokenB，仍 PROCESSING）：终态失败与 PENDING 重试两个分支的最终 UPDATE 均须
     * 匹配当前租约令牌，A 的迟到失败不得改判 B 的状态/结果/重试计数；当前持有者
     *（tokenB）的失败写回正常生效。
     */
    @Test
    @DisplayName("断言4：读取校验后写回前交接——迟到失败两个分支均不改写新持有者状态")
    void assertion4_failWriteback_windowBetweenReadAndWrite_guardedByClaimToken() {
        // 1. 真实受理 + 消费者 A 领取（tokenA），不启动业务执行
        CommandEnvelope env = new CommandEnvelope();
        env.setCommandType(CommandTypeEnum.TASK_APPROVE);
        env.setChannel(CommandChannelEnum.NORMAL);
        env.setCommandKey("TASK_APPROVE:window-task-b4:7");
        env.setTenantId(1L);
        env.setInitiatorId(7L);
        LoginUser initiator = new LoginUser();
        initiator.setUserId(7L);
        initiator.setTenantId(1L);
        LoginUserHolder.set(initiator);
        try {
            queue.enqueue(env);
        } finally {
            LoginUserHolder.clear();
        }
        Long cmd = env.getCommandId();
        LoginUser claimIdentity = new LoginUser();
        claimIdentity.setUserId(7L);
        claimIdentity.setTenantId(1L);
        LoginUserHolder.set(claimIdentity);
        List<CommandEnvelope> firstGen = queue.claimDue(List.of(CommandChannelEnum.NORMAL), 10);
        LoginUserHolder.clear();
        assertThat(firstGen).extracting(CommandEnvelope::getCommandId).containsExactly(cmd);
        String tokenA = firstGen.get(0).getClaimToken();
        assertThat(tokenA).isNotBlank();

        // 2. A 代读取快照（此时读取校验会通过）→ 回收 → B 重领（tokenB，仍 PROCESSING）
        // 读取/写回均经租户拦截器，须保持发起人上下文（与真实消费线程一致）
        LoginUserHolder.set(claimIdentity);
        windowQueue.staleSnapshot = null;
        var snapshotA = windowQueue.readCommandForFailure(cmd);
        assertThat(snapshotA.getStatus()).isEqualTo("PROCESSING");
        assertThat(snapshotA.getClaimToken()).isEqualTo(tokenA);

        assertThat(queue.reclaimStale(LocalDateTime.now().plusSeconds(60))).isEqualTo(1);
        LoginUserHolder.set(claimIdentity);
        List<CommandEnvelope> secondGen = queue.claimDue(List.of(CommandChannelEnum.NORMAL), 10);
        LoginUserHolder.clear();
        assertThat(secondGen).extracting(CommandEnvelope::getCommandId).containsExactly(cmd);
        String tokenB = secondGen.get(0).getClaimToken();
        assertThat(tokenB).isNotBlank().isNotEqualTo(tokenA);

        // 3. 窗口内写回：读取返回 A 的快照（守卫通过），实际行已是 PROCESSING/tokenB
        windowQueue.staleSnapshot = snapshotA;

        // 3a. 重试分支：迟到失败不得打回 PENDING、不得改 retryCount/failureReason
        boolean retried = windowQueue.failAndScheduleRetry(cmd, tokenA, "A 代迟到重试", 5, 1000);
        assertThat(retried).as("重试分支必须被当前租约令牌拒绝").isFalse();
        Map<String, Object> row = jdbcTemplate.queryForMap(
                "select status, claim_token, retry_count, failure_reason from sw_bpm_command where id = ?", cmd);
        assertThat(row.get("status")).isEqualTo("PROCESSING");
        assertThat(row.get("claim_token")).isEqualTo(tokenB);
        assertThat(((Number) row.get("retry_count")).longValue()).isZero();
        assertThat(row.get("failure_reason")).isNull();

        // 3b. 终态失败分支（预算=1 即直接终态）：迟到失败不得改判 FAILED/写 failureReason
        boolean terminalFailed = windowQueue.failAndScheduleRetry(cmd, tokenA, "A 代迟到终态", 1, 1000);
        assertThat(terminalFailed).as("终态失败分支必须被当前租约令牌拒绝").isFalse();
        row = jdbcTemplate.queryForMap(
                "select status, claim_token, failure_reason from sw_bpm_command where id = ?", cmd);
        assertThat(row.get("status")).isEqualTo("PROCESSING");
        assertThat(row.get("claim_token")).isEqualTo(tokenB);
        assertThat(row.get("failure_reason")).isNull();

        // 4. 正向对照：当前持有者（tokenB）的失败写回正常生效（重试分支）
        LoginUserHolder.set(claimIdentity);
        windowQueue.staleSnapshot = null;
        boolean currentHolderRetry = windowQueue.failAndScheduleRetry(cmd, tokenB, "B 当前持有者失败", 5, 1000);
        LoginUserHolder.clear();
        assertThat(currentHolderRetry).isTrue();
        row = jdbcTemplate.queryForMap(
                "select status, retry_count from sw_bpm_command where id = ?", cmd);
        assertThat(row.get("status")).isEqualTo("PENDING");
        assertThat(((Number) row.get("retry_count")).longValue()).isEqualTo(1);
    }
}
