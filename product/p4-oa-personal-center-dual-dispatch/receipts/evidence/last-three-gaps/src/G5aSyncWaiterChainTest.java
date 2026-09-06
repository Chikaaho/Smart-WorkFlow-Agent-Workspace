package com.sw.ck.bootstrap.p4overlap;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sw.ck.bpm.process.entity.BpmCommand;
import com.sw.ck.bpm.process.entity.CommandChannelEnum;
import com.sw.ck.bpm.process.entity.CommandTypeEnum;
import com.sw.ck.bpm.process.queue.BpmCommandQueue;
import com.sw.ck.bpm.process.queue.CommandEnvelope;
import com.sw.ck.bpm.process.service.BpmCommandService;
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
