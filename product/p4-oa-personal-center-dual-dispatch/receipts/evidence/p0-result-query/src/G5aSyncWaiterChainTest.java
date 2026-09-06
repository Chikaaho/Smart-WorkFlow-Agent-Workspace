package com.sw.ck.bootstrap.p4overlap;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sw.ck.bpm.process.entity.BpmCommand;
import com.sw.ck.bpm.process.entity.CommandChannelEnum;
import com.sw.ck.bpm.process.entity.CommandTypeEnum;
import com.sw.ck.bpm.process.queue.BpmCommandQueue;
import com.sw.ck.bpm.process.queue.CommandEnvelope;
import com.sw.ck.bpm.process.service.BpmCommandService;
import com.sw.ck.bpm.process.dto.CommandStatusRespDTO;
import com.sw.ck.bpm.process.service.CommandSyncWaiter;
import com.sw.ck.common.security.LoginContextProvider;
import com.sw.ck.security.holder.LoginUser;
import com.sw.ck.security.holder.LoginUserHolder;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * G5a B1（提示07）：P0 同步发起结果以"实际启动"为准。
 * <p>
 * 真实 H2 + 真实持久化命令队列 + 真实 {@link CommandSyncWaiter}：
 * 父 DRAFT_SUBMIT 完成不等于业务发起完成——外部同步结果必须等到本次
 * FLOW_START 子命令终态；子命令未终态（延迟）时预算到期返回受理态且同一
 * 标识可回查最终结果；子命令失败（真实消费前安全拒绝路径）返回 FAILED，
 * 不冒充业务发起成功。
 * </p>
 */
@SpringBootTest(classes = G5aSyncWaiterChainTest.Config.class,
        webEnvironment = SpringBootTest.WebEnvironment.NONE)
@DisplayName("G5a 同步发起结果链：父完成不冒充子启动，实际启动/延迟/失败三分支")
class G5aSyncWaiterChainTest {

    @org.springframework.context.annotation.Configuration
    @Import(OverlapH2TestConfig.class)
    static class Config {
        @Bean
        public ObjectMapper objectMapper() {
            return new ObjectMapper();
        }

        @Bean
        public CommandSyncWaiter commandSyncWaiter(BpmCommandService commandService, ObjectMapper objectMapper) {
            return new CommandSyncWaiter(commandService, objectMapper);
        }
    }

    @Autowired
    private BpmCommandQueue queue;

    @Autowired
    private BpmCommandService commandService;

    @Autowired
    private CommandSyncWaiter waiter;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private static final long INITIATOR = 2096474378888507394L;

    @BeforeEach
    void setUp() {
        jdbcTemplate.update("DELETE FROM sw_bpm_command");
    }

    private void login() {
        LoginUser user = new LoginUser();
        user.setUserId(INITIATOR);
        user.setTenantId(1L);
        LoginUserHolder.set(user);
    }

    /** 真实受理一条命令并领取，返回（commandId, claimToken）。 */
    private record Claimed(Long id, String token) {}

    private Claimed enqueueAndClaim(String commandKey, CommandTypeEnum type) {
        CommandEnvelope env = new CommandEnvelope();
        env.setCommandType(type);
        env.setChannel(CommandChannelEnum.P0);
        env.setCommandKey(commandKey);
        env.setTenantId(1L);
        env.setInitiatorId(INITIATOR);
        login();
        try {
            queue.enqueue(env);
        } finally {
            LoginUserHolder.clear();
        }
        login();
        try {
            List<CommandEnvelope> claimed = queue.claimDue(List.of(CommandChannelEnum.P0), 10);
            assertThat(claimed).extracting(CommandEnvelope::getCommandId).containsExactly(env.getCommandId());
            return new Claimed(env.getCommandId(), claimed.get(0).getClaimToken());
        } finally {
            LoginUserHolder.clear();
        }
    }

    @Test
    @DisplayName("实际启动完成才返回 COMPLETED：子命令 PENDING 时预算到期受理态，完成后同一链读回成功")
    void syncResult_waitsForFlowStartChild() {
        Claimed parent = enqueueAndClaim("DRAFT_SUBMIT:d-sync-1:1", CommandTypeEnum.DRAFT_SUBMIT);
        login();
        try {
            queue.complete(parent.id(), parent.token(),
                    "{\"status\":\"SUBMITTED\",\"recordId\":\"rec-sync-1\"}");
        } finally {
            LoginUserHolder.clear();
        }

        // 子命令已受理但未启动（PENDING）：同步结果不得返回业务发起成功
        Claimed child = enqueueAndClaim("FLOW_START:rec-sync-1", CommandTypeEnum.FLOW_START);
        ReflectionTestUtils.setField(waiter, "timeoutMillis", 300L);
        ReflectionTestUtils.setField(waiter, "pollMillis", 20L);
        CommandSyncWaiter.WaitResult pending;
        login();
        try {
            pending = waiter.waitSyncResult(parent.id());
        } finally {
            LoginUserHolder.clear();
        }
        assertThat(pending.outcome()).as("子启动未完成不得返回 COMPLETED")
                .isEqualTo(CommandSyncWaiter.Outcome.TIMEOUT);
        CommandSyncWaiter.WaitResult started;

        // 实际启动完成：同一父标识的同步结果链返回 COMPLETED（原标识可回查）
        login();
        try {
            queue.complete(child.id(), child.token(), "{\"status\":\"STARTED\"}");
        } finally {
            LoginUserHolder.clear();
        }
        login();
        try {
            started = waiter.waitSyncResult(parent.id());
        } finally {
            LoginUserHolder.clear();
        }
        assertThat(started.outcome()).isEqualTo(CommandSyncWaiter.Outcome.COMPLETED);
        assertThat(started.command().getId()).isEqualTo(child.id());
        assertThat(started.command().getStatus()).isEqualTo("COMPLETED");
    }

    @Test
    @DisplayName("子启动失败（真实消费前安全拒绝）→ 同步结果 FAILED，不冒充业务发起成功")
    void syncResult_childFailure_returnsFailed() {
        Claimed parent = enqueueAndClaim("DRAFT_SUBMIT:d-sync-2:1", CommandTypeEnum.DRAFT_SUBMIT);
        login();
        try {
            queue.complete(parent.id(), parent.token(),
                    "{\"status\":\"SUBMITTED\",\"recordId\":\"rec-sync-2\"}");
        } finally {
            LoginUserHolder.clear();
        }
        Claimed child = enqueueAndClaim("FLOW_START:rec-sync-2", CommandTypeEnum.FLOW_START);
        // 真实安全门禁拒绝路径（消费前身份回查失败的生产语义）→ 子命令终态 FAILED
        login();
        try {
            queue.reject(child.id(), child.token(), "发起用户不存在、已停用或租户不匹配");
        } finally {
            LoginUserHolder.clear();
        }

        ReflectionTestUtils.setField(waiter, "timeoutMillis", 2000L);
        ReflectionTestUtils.setField(waiter, "pollMillis", 20L);
        CommandSyncWaiter.WaitResult result;
        login();
        try {
            result = waiter.waitSyncResult(parent.id());
        } finally {
            LoginUserHolder.clear();
        }
        assertThat(result.outcome()).as("子启动失败不得返回业务发起成功")
                .isEqualTo(CommandSyncWaiter.Outcome.FAILED);
        assertThat(result.command().getId()).isEqualTo(child.id());
        login();
        BpmCommand childRow = commandService.getById(child.id());
        LoginUserHolder.clear();
        assertThat(childRow.getStatus()).isEqualTo("FAILED");
        assertThat(childRow.getFailureReason()).contains("租户不匹配");
    }

    @Test
    @DisplayName("对外结果回查（提示08 B1）：原标识→实际子启动结论，处理中/成功/失败可区分且不新建任何受理")
    void externalResultQuery_resolvesActualFlowStartOutcome() {
        com.sw.ck.bpm.process.controller.BpmCommandController controller =
                new com.sw.ck.bpm.process.controller.BpmCommandController(
                        null, commandService, waiter, null);

        Claimed parent = enqueueAndClaim("DRAFT_SUBMIT:d-sync-4:1", CommandTypeEnum.DRAFT_SUBMIT);
        Claimed child = enqueueAndClaim("FLOW_START:rec-sync-4", CommandTypeEnum.FLOW_START);
        login();
        try {
            queue.complete(parent.id(), parent.token(),
                    "{\"status\":\"SUBMITTED\",\"recordId\":\"rec-sync-4\"}");
        } finally {
            LoginUserHolder.clear();
        }

        long commandsBefore = jdbcTemplate.queryForObject(
                "select count(*) from sw_bpm_command", Long.class);

        // 1) 子启动处理中：父内部 COMPLETED 保留，但业务结论以 flowStart=PENDING 呈现（不掩盖）
        CommandStatusRespDTO processing = statusOf(controller, INITIATOR, parent.id());
        org.assertj.core.api.Assertions.assertThat(processing.getStatus()).isEqualTo("COMPLETED");
        org.assertj.core.api.Assertions.assertThat(processing.getFlowStart()).isNotNull();
        org.assertj.core.api.Assertions.assertThat(processing.getFlowStart().getStatus())
                .as("子未完成不得显示业务成功").isIn("PENDING", "PROCESSING");
        org.assertj.core.api.Assertions.assertThat(processing.getFlowStart().getCommandId())
                .isEqualTo(child.id());

        // 2) 查询只读：不新建任何命令/受理/实例
        long commandsAfter = jdbcTemplate.queryForObject(
                "select count(*) from sw_bpm_command", Long.class);
        org.assertj.core.api.Assertions.assertThat(commandsAfter).isEqualTo(commandsBefore);

        // 3) 实际启动成功：flowStart COMPLETED/STARTED
        login();
        try {
            queue.complete(child.id(), child.token(), "{\"status\":\"STARTED\"}");
        } finally {
            LoginUserHolder.clear();
        }
        CommandStatusRespDTO started = statusOf(controller, INITIATOR, parent.id());
        org.assertj.core.api.Assertions.assertThat(started.getFlowStart().getStatus()).isEqualTo("COMPLETED");
        org.assertj.core.api.Assertions.assertThat(started.getFlowStart().getResult()).contains("STARTED");

        // 4) 实际启动失败：flowStart FAILED + 原因，父 COMPLETED 不掩盖失败结论
        Claimed parent2 = enqueueAndClaim("DRAFT_SUBMIT:d-sync-5:1", CommandTypeEnum.DRAFT_SUBMIT);
        Claimed child2 = enqueueAndClaim("FLOW_START:rec-sync-5", CommandTypeEnum.FLOW_START);
        login();
        try {
            queue.complete(parent2.id(), parent2.token(),
                    "{\"status\":\"SUBMITTED\",\"recordId\":\"rec-sync-5\"}");
            queue.reject(child2.id(), child2.token(), "流程定义不可用（采集用失败）");
        } finally {
            LoginUserHolder.clear();
        }
        CommandStatusRespDTO failed = statusOf(controller, INITIATOR, parent2.id());
        org.assertj.core.api.Assertions.assertThat(failed.getStatus()).isEqualTo("COMPLETED");
        org.assertj.core.api.Assertions.assertThat(failed.getFlowStart().getStatus())
                .as("子启动失败不得被父成功掩盖").isEqualTo("FAILED");
        org.assertj.core.api.Assertions.assertThat(failed.getFlowStart().getFailureReason())
                .contains("流程定义不可用");

        // 5) 身份不放宽：非发起人回查被拒（BaseException FORBIDDEN），发起人正常
        org.assertj.core.api.Assertions.assertThatCode(
                        () -> statusOf(controller, 42L, parent.id()))
                .isInstanceOf(com.sw.ck.common.exception.BaseException.class);
        CommandStatusRespDTO again = statusOf(controller, INITIATOR, parent2.id());
        org.assertj.core.api.Assertions.assertThat(again.getFlowStart().getStatus()).isEqualTo("FAILED");
    }

    private CommandStatusRespDTO statusOf(com.sw.ck.bpm.process.controller.BpmCommandController controller,
                                          long userId, Long commandId) {
        LoginUser viewer = new LoginUser();
        viewer.setUserId(userId);
        viewer.setTenantId(1L);
        LoginUserHolder.set(viewer);
        try {
            return controller.status(commandId).getData();
        } finally {
            LoginUserHolder.clear();
        }
    }

    @Test
    @DisplayName("无实际启动结论不宣称成功：父完成但子命令缺失 → 同步结果按受理态返回")
    void syncResult_missingChild_doesNotClaimSuccess() {
        Claimed parent = enqueueAndClaim("DRAFT_SUBMIT:d-sync-6:1", CommandTypeEnum.DRAFT_SUBMIT);
        login();
        try {
            queue.complete(parent.id(), parent.token(),
                    "{\"status\":\"SUBMITTED\",\"recordId\":\"rec-sync-6-missing\"}");
        } finally {
            LoginUserHolder.clear();
        }
        ReflectionTestUtils.setField(waiter, "timeoutMillis", 300L);
        ReflectionTestUtils.setField(waiter, "pollMillis", 20L);
        CommandSyncWaiter.WaitResult result;
        login();
        try {
            result = waiter.waitSyncResult(parent.id());
        } finally {
            LoginUserHolder.clear();
        }
        org.assertj.core.api.Assertions.assertThat(result.outcome())
                .as("缺实际启动结论不得返回业务发起成功")
                .isEqualTo(CommandSyncWaiter.Outcome.TIMEOUT);
    }

    @Test
    @DisplayName("父命令本身失败 → 同步结果 FAILED（不进入子启动等待）")
    void syncResult_parentFailure_returnsFailed() {
        Claimed parent = enqueueAndClaim("DRAFT_SUBMIT:d-sync-3:1", CommandTypeEnum.DRAFT_SUBMIT);
        login();
        try {
            queue.reject(parent.id(), parent.token(), "草稿业务校验失败");
        } finally {
            LoginUserHolder.clear();
        }
        ReflectionTestUtils.setField(waiter, "timeoutMillis", 1000L);
        ReflectionTestUtils.setField(waiter, "pollMillis", 20L);
        CommandSyncWaiter.WaitResult result;
        login();
        try {
            result = waiter.waitSyncResult(parent.id());
        } finally {
            LoginUserHolder.clear();
        }
        assertThat(result.outcome()).isEqualTo(CommandSyncWaiter.Outcome.FAILED);
        assertThat(result.command().getId()).isEqualTo(parent.id());
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "select status from sw_bpm_command where command_key = 'FLOW_START:rec-sync-3'");
        assertThat(rows).as("父失败不新建第二流程受理").isEmpty();
    }
}
