package com.sw.ck.bootstrap.p4overlap;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sw.ck.bpm.api.facade.BpmTaskFacade;
import com.sw.ck.bpm.engine.facade.BpmTaskFacadeImpl;
import com.sw.ck.bpm.process.controller.BpmMyProcessedController;
import com.sw.ck.bpm.process.dto.ApprovalAction;
import com.sw.ck.bpm.process.dto.ApprovalActionRequest;
import com.sw.ck.bpm.process.dto.MyProcessedItemDTO;
import com.sw.ck.bpm.process.entity.BpmInstance;
import com.sw.ck.bpm.process.queue.TaskActionCommandHandler;
import com.sw.ck.bpm.process.service.ApprovalActionService;
import com.sw.ck.bpm.process.service.BpmProcessDefService;
import com.sw.ck.bpm.process.service.TaskActionService;
import com.sw.ck.bpm.process.service.impl.ApprovalActionServiceImpl;
import com.sw.ck.bpm.process.service.impl.BpmInstanceServiceImpl;
import com.sw.ck.bpm.process.service.impl.BpmProcessDefServiceImpl;
import com.sw.ck.common.event.DomainEventPublisher;
import com.sw.ck.common.page.PageParam;
import com.sw.ck.common.page.PageResult;
import com.sw.ck.common.response.R;
import com.sw.ck.common.security.LoginContextProvider;
import com.sw.ck.security.holder.LoginUser;
import com.sw.ck.security.holder.LoginUserHolder;
import org.flowable.engine.runtime.ProcessInstance;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentLinkedQueue;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * G3b 真实已办分页（提示05 §4：先证明反向对象进入过实际数据源，再检查真实查询输出）。
 * <p>
 * 正反对象全部真实存在于同一隔离库 + 真实 Flowable 历史中：
 * <ul>
 *   <li>I1 本人完成（ACTION 权威 + finished 历史）→ 双源去重，仅一条</li>
 *   <li>I2 本人完成的无 ACTION 旧历史（引擎直接完成，无动作记录）→ HISTORY_COMPAT 保留</li>
 *   <li>I3 会签结算式取消（assignee=本人、deleteReason 非空、从未办理）→ 不得入已办</li>
 *   <li>I4 任务删除（deleteReason="deleted"）→ 不得入已办</li>
 *   <li>I5 其他用户办理 → 不入本人已办</li>
 * </ul>
 * 验证经真实 {@link BpmTaskFacadeImpl} 引擎查询与真实 {@link BpmMyProcessedController}
 * 合并分页：默认/HISTORY_COMPAT 双来源、跨页不漏不重、total 精确、同数据重复读取顺序稳定。
 * 取消/删除对象由真实查询的 deleteReason 过滤排除（非 mock 预排除、非数据先删）。
 */
@SpringBootTest(classes = MyProcessedRealSourceTest.Config.class,
        webEnvironment = SpringBootTest.WebEnvironment.NONE)
@DisplayName("G3b 真实混合历史/动作分页：取消/删除/非本人不冒充本人办理")
class MyProcessedRealSourceTest {

    /** 引擎历史在同一 JVM 内累积：每个用例装配使用全新用户，保证查询对象唯一。 */
    private static final java.util.concurrent.atomic.AtomicLong USER_SEQ =
            new java.util.concurrent.atomic.AtomicLong(21);
    private static final ConcurrentLinkedQueue<Object> PUBLISHED = new ConcurrentLinkedQueue<>();

    private long u1;
    private long u2;

    @Autowired
    private BpmMyProcessedController controller;

    @Autowired
    private TaskActionService taskActionService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @org.springframework.context.annotation.Configuration
    @Import(OverlapH2TestConfig.class)
    static class Config {

        @Bean
        public BpmTaskFacade bpmTaskFacade() {
            return new BpmTaskFacadeImpl(CommandOverlapRealEngineTest.EngineHolder.TASK_SERVICE,
                    CommandOverlapRealEngineTest.EngineHolder.RUNTIME_SERVICE,
                    CommandOverlapRealEngineTest.EngineHolder.ENGINE.getRepositoryService(),
                    CommandOverlapRealEngineTest.EngineHolder.ENGINE.getHistoryService());
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
        public BpmProcessDefService bpmProcessDefService(com.sw.ck.bpm.process.mapper.BpmProcessDefMapper mapper,
                                                         ObjectMapper objectMapper) {
            // 仅用到 findByProcessKey（真实 mapper 查询）；图校验/部署等编辑能力本测试不触达
            return new BpmProcessDefServiceImpl(mapper, null, null, null, null, objectMapper);
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

        @Bean
        public BpmMyProcessedController bpmMyProcessedController(ApprovalActionService approvalActionService,
                                                                 BpmInstanceServiceImpl bpmInstanceService,
                                                                 BpmProcessDefService bpmProcessDefService,
                                                                 BpmTaskFacade bpmTaskFacade) {
            return new BpmMyProcessedController(approvalActionService, bpmInstanceService,
                    bpmProcessDefService, bpmTaskFacade);
        }
    }

    private String instance1TaskId;
    private String instance2TaskId;
    private String instance3TaskId;
    private String instance4TaskId;
    private String instance5TaskId;

    @BeforeEach
    void setUp() {
        u1 = USER_SEQ.incrementAndGet();
        u2 = USER_SEQ.incrementAndGet();
        jdbcTemplate.update("DELETE FROM sw_bpm_command");
        jdbcTemplate.update("DELETE FROM sw_bpm_instance");
        jdbcTemplate.update("DELETE FROM sw_bpm_approval_action");
        PUBLISHED.clear();

        // ── 正反对象全部真实建立（租户 1，同一隔离库 + 真实引擎历史）──

        // I1：本人（u1）经真实审批核心完成 → ACTION 记录 + finished 历史（双源重复对象）
        instance1TaskId = startAndHandle("biz-p3-real-a", u1, true);

        // I2：本人完成的无 ACTION 旧历史（引擎直接完成，不落动作记录 = 旧系统兼容对象）
        instance2TaskId = startAndHandle("biz-p3-real-b", u1, false);

        // I3：会签结算式取消——任务指派给本人但从未办理，真实删除路径落 deleteReason
        instance3TaskId = startAndCancel("biz-p3-real-c", u1, "会签结算取消");

        // I4：独立任务被删除（deleteReason="deleted"，同真实任务清理语义），本人从未办理
        org.flowable.task.api.Task standalone = CommandOverlapRealEngineTest.EngineHolder.TASK_SERVICE
                .newTask();
        standalone.setName("独立任务");
        standalone.setAssignee(String.valueOf(u1));
        standalone.setTenantId("1");
        CommandOverlapRealEngineTest.EngineHolder.TASK_SERVICE.saveTask(standalone);
        CommandOverlapRealEngineTest.EngineHolder.TASK_SERVICE.deleteTask(standalone.getId(), "deleted");
        instance4TaskId = standalone.getId();

        // I5：其他用户（u2）办理 → 不属于本人已办
        startAndHandle("biz-p3-real-e", u2, false);

        // 反向对象确实进入了实际数据源的证据：真实引擎历史中 u1 名下 finished 任务 = 4
        //（I1/I2/I3/I4；其中 I3/I4 即取消/删除对象），非"先删掉再查询"
        long finishedForU1 = CommandOverlapRealEngineTest.EngineHolder.ENGINE.getHistoryService()
                .createHistoricTaskInstanceQuery()
                .taskTenantId("1")
                .taskAssignee(String.valueOf(u1))
                .finished()
                .count();
        assertThat(finishedForU1).as("取消/删除对象必须真实存在于 finished 历史中").isEqualTo(4L);
    }

    @AfterEach
    void tearDown() {
        LoginUserHolder.clear();
    }

    /** 发起单任务实例并以指定用户完成；viaApprovalCore=true 经真实 TaskActionService（落 ACTION），否则仅引擎完成。 */
    private String startAndHandle(String businessKey, long userId, boolean viaApprovalCore) {
        ProcessInstance pi = CommandOverlapRealEngineTest.EngineHolder.RUNTIME_SERVICE
                .startProcessInstanceByKeyAndTenantId("overlap_p", businessKey,
                        Map.of("approver", String.valueOf(userId)), "1");
        String flowablePid = pi.getProcessInstanceId();
        org.flowable.task.api.Task task = CommandOverlapRealEngineTest.EngineHolder.TASK_SERVICE
                .createTaskQuery().processInstanceId(flowablePid).singleResult();
        insertInstanceRow(flowablePid, businessKey, userId);
        LoginUser user = new LoginUser();
        user.setUserId(userId);
        user.setTenantId(1L);
        LoginUserHolder.set(user);
        try {
            if (viaApprovalCore) {
                ApprovalActionRequest request = new ApprovalActionRequest();
                request.setTaskId(task.getId());
                request.setAction(ApprovalAction.APPROVE);
                taskActionService.execute(task.getId(), request);
            } else {
                // 仅引擎完成：历史保留 assignee+finished，但无 ACTION 记录（兼容来源对象）
                CommandOverlapRealEngineTest.EngineHolder.TASK_SERVICE.complete(task.getId());
            }
        } finally {
            LoginUserHolder.clear();
        }
        return task.getId();
    }

    /** 取消对象：平台真实终止路径（与 BpmTaskFacadeImpl.terminateProcess 同一
     * runtimeService.deleteProcessInstance 语义），运行中实例的任务被取消，
     * 历史任务保留 assignee + endTime + deleteReason，本人从未办理。 */
    private String startAndCancel(String businessKey, long assigneeId, String deleteReason) {
        ProcessInstance pi = CommandOverlapRealEngineTest.EngineHolder.RUNTIME_SERVICE
                .startProcessInstanceByKeyAndTenantId("overlap_p", businessKey,
                        Map.of("approver", String.valueOf(assigneeId)), "1");
        String flowablePid = pi.getProcessInstanceId();
        org.flowable.task.api.Task task = CommandOverlapRealEngineTest.EngineHolder.TASK_SERVICE
                .createTaskQuery().processInstanceId(flowablePid).singleResult();
        insertInstanceRow(flowablePid, businessKey, assigneeId);
        CommandOverlapRealEngineTest.EngineHolder.RUNTIME_SERVICE
                .deleteProcessInstance(flowablePid, deleteReason);
        return task.getId();
    }

    private static final java.util.concurrent.atomic.AtomicLong INSTANCE_ID =
            new java.util.concurrent.atomic.AtomicLong(8100);

    private void insertInstanceRow(String flowablePid, String businessKey, long initiatorId) {
        jdbcTemplate.update("""
                insert into sw_bpm_instance (id, process_instance_id, process_def_key, form_key,
                    business_key, initiator_id, status, tenant_id)
                values (?, ?, 'overlap_p', 'p4_oa_biz_form_20260905b',
                    ?, ?, 'RUNNING', 1)
                """, INSTANCE_ID.incrementAndGet(), flowablePid, businessKey, initiatorId);
    }

    private void login(long userId) {
        LoginUser user = new LoginUser();
        user.setUserId(userId);
        user.setTenantId(1L);
        LoginUserHolder.set(user);
    }

    private PageResult<MyProcessedItemDTO> page(String source, int pageNum, int pageSize) {
        PageParam param = new PageParam();
        param.setPageNum(pageNum);
        param.setPageSize(pageSize);
        R<PageResult<MyProcessedItemDTO>> resp = controller.myProcessed(param, source);
        return resp.getData();
    }

    @Test
    @DisplayName("默认来源：真实混合数据跨页不漏不重、total 精确=2，取消/删除/非本人被真实查询排除")
    void defaultSource_mixedRealObjects_exactPagination() {
        login(u1);

        // 逐页拉取（pageSize=1 强制跨页）
        Set<String> seenTaskIds = new LinkedHashSet<>();
        List<Long> seenTotals = new ArrayList<>();
        int pageNum = 1;
        while (true) {
            PageResult<MyProcessedItemDTO> page = page(null, pageNum, 1);
            seenTotals.add(page.getTotal());
            for (MyProcessedItemDTO item : page.getRecords()) {
                assertThat(seenTaskIds).as("跨页不得重复: " + item.getTaskId()).doesNotContain(item.getTaskId());
                seenTaskIds.add(item.getTaskId());
            }
            if (pageNum * 1 >= page.getTotal()) {
                break;
            }
            pageNum++;
        }

        // 并集 = 应展示集合（I1 本人 ACTION + I2 本人旧历史），交集空，total 精确
        assertThat(seenTaskIds).containsExactlyInAnyOrder(instance1TaskId, instance2TaskId);
        assertThat(seenTotals).allMatch(t -> t == 2L);

        // 反向：取消（会签结算取消）/删除/非本人对象不在任何页
        assertThat(seenTaskIds).doesNotContain(instance3TaskId, instance4TaskId);

        // 同一数据重复读取顺序稳定（办理时间倒序全局排序确定）
        List<String> first = page(null, 1, 10).getRecords().stream()
                .map(MyProcessedItemDTO::getTaskId).toList();
        List<String> second = page(null, 1, 10).getRecords().stream()
                .map(MyProcessedItemDTO::getTaskId).toList();
        assertThat(first).isEqualTo(second).hasSize(2);
    }

    @Test
    @DisplayName("ACTION 来源：仅本人动作记录；HISTORY_COMPAT 来源：本人完成历史保留且取消/删除被过滤")
    void separatedSources_actionAndHistoryCompat() {
        login(u1);

        PageResult<MyProcessedItemDTO> actionPage = page("ACTION", 1, 10);
        assertThat(actionPage.getTotal()).isEqualTo(1L);
        assertThat(actionPage.getRecords()).hasSize(1);
        assertThat(actionPage.getRecords().get(0).getTaskId()).isEqualTo(instance1TaskId);
        assertThat(actionPage.getRecords().get(0).getSource()).isEqualTo(MyProcessedItemDTO.SOURCE_ACTION);

        // HISTORY_COMPAT：本人完成历史 = I1 + I2（I1 虽有 ACTION，来源视图按引擎口径呈现）；
        // 关键反向断言：取消/删除对象（I3/I4）真实存在于 finished 历史（见 setUp 计数=4）
        // 但被 deleteReason 过滤排除，total=2 而非 4。
        PageResult<MyProcessedItemDTO> compatPage = page("HISTORY_COMPAT", 1, 10);
        assertThat(compatPage.getTotal())
                .as("deleteReason 过滤生效：4 条本人 finished 历史中 2 条为取消/删除")
                .isEqualTo(2L);
        List<String> compatTaskIds = compatPage.getRecords().stream()
                .map(MyProcessedItemDTO::getTaskId).toList();
        assertThat(compatTaskIds).containsExactlyInAnyOrder(instance1TaskId, instance2TaskId);
        assertThat(compatTaskIds).doesNotContain(instance3TaskId, instance4TaskId);
        compatPage.getRecords().forEach(item ->
                assertThat(item.getSource()).isEqualTo(MyProcessedItemDTO.SOURCE_HISTORY_COMPAT));

        // u2 视角：只见本人（u2）办理对象
        login(u2);
        PageResult<MyProcessedItemDTO> u2Page = page(null, 1, 10);
        assertThat(u2Page.getTotal()).isEqualTo(1L);
        assertThat(u2Page.getRecords().get(0).getTaskId())
                .as("非本人办理不入他人已办")
                .isNotIn(instance1TaskId, instance2TaskId, instance3TaskId, instance4TaskId);
    }

    @Test
    @DisplayName("富化一致：已办条目与同实例状态/业务标识可互相同位（非仅引擎 taskId）")
    void itemsEnrichedWithInstanceLinkage() {
        login(u1);
        PageResult<MyProcessedItemDTO> page = page(null, 1, 10);
        assertThat(page.getRecords()).hasSize(2);
        for (MyProcessedItemDTO item : page.getRecords()) {
            assertThat(item.getProcessInstanceId()).isNotBlank();
            assertThat(item.getBusinessKey()).startsWith("biz-p3-real-");
            assertThat(item.getHandleTime()).isNotNull();
        }
        // 本人已办 ≠ 整个流程已结束：I1/I2 的实例状态在库中可回查
        Map<String, Object> instanceRow = jdbcTemplate.queryForMap(
                "select status from sw_bpm_instance where business_key = 'biz-p3-real-a'");
        assertThat(instanceRow.get("status")).isEqualTo("APPROVED");
    }
}
