package com.sw.ck.bootstrap.p4overlap;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sw.ck.bpm.api.dto.BpmTaskDTO;
import com.sw.ck.bpm.api.event.BpmNotifyEvent;
import com.sw.ck.bpm.api.facade.BpmTaskFacade;
import com.sw.ck.bpm.engine.facade.BpmTaskFacadeImpl;
import com.sw.ck.bpm.process.dto.ApprovalActionRequest;
import com.sw.ck.bpm.process.entity.ApprovalActionRecord;
import com.sw.ck.bpm.process.entity.BpmInstance;
import com.sw.ck.bpm.process.entity.CommandChannelEnum;
import com.sw.ck.bpm.process.entity.CommandTypeEnum;
import com.sw.ck.bpm.process.queue.BpmCommandQueue;
import com.sw.ck.bpm.process.queue.CommandEnvelope;
import com.sw.ck.bpm.process.queue.CommandDispatcher;
import com.sw.ck.bpm.process.queue.PersistentBpmCommandQueue;
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
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * G4b 同实例跨通道重叠 + 同命令租约交接（真实审批核心，无替身）。
 * <p>
 * 审批链 = 真实 Flowable 引擎（独立内存 H2，bootstrap 测试域全模块可见）+
 * 真实 {@link BpmTaskFacadeImpl} + 真实 {@link TaskActionService}（真实动作落库/
 * 实例状态/通知事件）+ 真实 {@link TaskActionCommandHandler} 与
 * {@link CommandDispatcher} 调度循环；通知副作用以记录型发布器适配（提示03允许）。
 * </p>
 * 场景：u1 的 NORMAL 审批命令被消费者 A 领取，真实引擎完成审批（业务效果提交）后
 * 确认丢失；租约回收后消费者 B 在新租约 PROCESSING 期间以真实审批核心重执行并进入
 * 终态 FAILED；旧持有者迟到 ack 写回被终态守卫拒绝。断言：审批记录恰一条、流程通知
 * 恰一次、任务无残留、实例 APPROVED、命令终态确定、执行身份无串用。
 */
@SpringBootTest(classes = CommandOverlapRealEngineTest.Config.class,
        webEnvironment = SpringBootTest.WebEnvironment.NONE)
@DisplayName("G4b 真实审批核心：跨通道重叠 + 租约交接 + 单次效果")
class CommandOverlapRealEngineTest {

    private static final ConcurrentLinkedQueue<Object> PUBLISHED = new ConcurrentLinkedQueue<>();

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
            return new BpmTaskFacadeImpl(EngineHolder.TASK_SERVICE, EngineHolder.RUNTIME_SERVICE,
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
                                                                 ObjectMapper objectMapper) {
            return new TaskActionCommandHandler(service, objectMapper);
        }
    }

    /** 引擎在宿主类加载时启动（早于 Bean 创建）；最小单节点审批流程。 */
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
            String bpmn = """
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
            ENGINE.getRepositoryService().createDeployment()
                    .addString("overlap_p.bpmn20.xml", bpmn).deploy();
        }
    }

    @BeforeEach
    void setUp() {
        jdbcTemplate.update("DELETE FROM sw_bpm_command");
        PUBLISHED.clear();
    }

    @AfterEach
    void tearDown() {
        LoginUserHolder.clear();
    }

    @Test
    @DisplayName("业务提交后确认丢失：新租约重执行确定性拒绝（节点已被处理），旧持有者迟到写回被拒，审批/通知恰一次")
    void realEngine_overlap_ackLost_newLeaseDeterministic_oldWriteBackRejected() throws Exception {
        // 1. 真实引擎发起：任务指派给 u1(7)；业务实例行落库（生产语义）
        var pi = EngineHolder.RUNTIME_SERVICE.startProcessInstanceByKey("overlap_p",
                "biz-overlap-001", Map.of("approver", "7"));
        String flowablePid = pi.getProcessInstanceId();
        org.flowable.task.api.Task task = EngineHolder.TASK_SERVICE.createTaskQuery()
                .processInstanceId(flowablePid).singleResult();
        String taskId = task.getId();
        LoginUser u1 = new LoginUser();
        u1.setUserId(7L);
        u1.setTenantId(1L);
        LoginUserHolder.set(u1);
        jdbcTemplate.update("""
                insert into sw_bpm_instance (id, process_instance_id, process_def_key, form_key,
                    business_key, initiator_id, status, tenant_id)
                values (999, ?, 'overlap_p', 'p4_oa_biz_form_20260905b', 'biz-overlap-001', 7,
                    'RUNNING', 1)
                """, flowablePid);

        // 2. 受理 u1 的 NORMAL 审批命令
        CommandEnvelope env = new CommandEnvelope();
        env.setCommandType(CommandTypeEnum.TASK_APPROVE);
        env.setChannel(CommandChannelEnum.NORMAL);
        env.setCommandKey("TASK_APPROVE:" + taskId + ":7");
        env.setTenantId(1L);
        env.setInitiatorId(7L);
        ApprovalActionRequest req = new ApprovalActionRequest();
        req.setTaskId(taskId);
        req.setAction(com.sw.ck.bpm.process.dto.ApprovalAction.APPROVE);
        env.setPayload(new ObjectMapper().writeValueAsString(req));
        queue.enqueue(env);
        Long cmdId = env.getCommandId();

        // 3. 消费者 A 领取并执行真实审批核心：引擎完成任务、动作落库、实例 APPROVED、
        //    通知发布一次；ack 丢失（不调用 complete）= 业务提交与确认之间中断的真实窗口
        List<CommandEnvelope> claimed = queue.claimDue(List.of(CommandChannelEnum.NORMAL), 10);
        assertThat(claimed).extracting(CommandEnvelope::getCommandId).containsExactly(cmdId);
        final AtomicReference<String> ackLostResult = new AtomicReference<>();
        Thread consumerA = new Thread(() -> {
            LoginUserHolder.set(u1);
            try {
                ackLostResult.set(realHandler.handle(claimed.get(0)));
            } catch (Throwable t) {
                throw new IllegalStateException(t);
            } finally {
                LoginUserHolder.clear();
            }
        });
        consumerA.start();
        consumerA.join(10000);
        assertThat(ackLostResult.get()).isEqualTo("{\"status\":\"DONE\"}");
        assertThat(queue.findById(cmdId).orElseThrow().getStatus()).isEqualTo("PROCESSING");
        assertThat(EngineHolder.TASK_SERVICE.createTaskQuery().taskId(taskId).count()).isZero();
        assertThat(instanceStatus(flowablePid)).isEqualTo("APPROVED");

        // 4. 租约回收 → 消费者 B（真实调度循环）在新租约 PROCESSING 期间以真实审批核心重执行：
        //    引擎/门禁确定性拒绝（节点已被处理）→ 终态 FAILED
        assertThat(queue.reclaimStale(LocalDateTime.now().plusSeconds(60))).isEqualTo(1);
        CommandDispatcher consumerB = new CommandDispatcher(queue, List.of(realHandler));
        ReflectionTestUtils.setField(consumerB, "batchSize", 20);
        ReflectionTestUtils.setField(consumerB, "p0BatchSize", 5);
        ReflectionTestUtils.setField(consumerB, "staleSeconds", 60);
        ReflectionTestUtils.setField(consumerB, "maxRetries", 1);
        LoginUser scheduler = new LoginUser();
        scheduler.setUserId(8L);
        scheduler.setTenantId(1L);
        LoginUserHolder.set(scheduler);
        try {
            // pollNormal 为包内可见（跨包测试用反射调用同一方法）
            org.springframework.test.util.ReflectionTestUtils.invokeMethod(consumerB, "pollNormal");
        } finally {
            LoginUserHolder.clear();
        }
        // 调度线程结束会清理身份；断言前恢复租户上下文
        LoginUserHolder.set(scheduler);
        CommandEnvelope finalCmd = queue.findById(cmdId).orElseThrow();
        assertThat(finalCmd.getStatus()).isEqualTo("FAILED");
        assertThat(finalCmd.getFailureReason()).contains("已被处理");

        // 5. 旧持有者迟到 ack 写回：终态守卫拒绝，不覆盖 FAILED
        LoginUserHolder.set(u1);
        queue.complete(cmdId, ackLostResult.get());
        assertThat(queue.findById(cmdId).orElseThrow().getStatus()).isEqualTo("FAILED");
        assertThat(queue.findById(cmdId).orElseThrow().getFailureReason()).contains("已被处理");

        // 6. 单次效果与无身份串用：审批记录恰一条（u1:APPROVE）、流程通知恰一次、任务无残留
        List<java.util.Map<String, Object>> actionRows = jdbcTemplate.queryForList(
                "select actor_id, action from sw_bpm_approval_action where task_id = ?", taskId);
        List<String> actions = actionRows.stream()
                .map(r -> r.get("actor_id") + ":" + r.get("action")).toList();
        assertThat(actions).containsExactly("7:APPROVE");
        long notifyEvents = PUBLISHED.stream().filter(e -> e instanceof BpmNotifyEvent).count();
        assertThat(notifyEvents).isEqualTo(1);
        assertThat(EngineHolder.TASK_SERVICE.createTaskQuery().processInstanceId(flowablePid).count()).isZero();
        assertThat(instanceStatus(flowablePid)).isEqualTo("APPROVED");
    }

    private String instanceStatus(String flowablePid) {
        return jdbcTemplate.queryForObject(
                "select status from sw_bpm_instance where process_instance_id = ?",
                String.class, flowablePid);
    }
}
