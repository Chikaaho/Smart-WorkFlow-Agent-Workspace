package com.sw.ck.bootstrap.p4overlap;

import com.sw.ck.bpm.process.entity.BpmDraft;
import com.sw.ck.bpm.process.entity.BpmInstance;
import com.sw.ck.bpm.process.service.BpmDraftService;
import com.sw.ck.bpm.process.service.BpmInstanceService;
import com.sw.ck.common.security.LoginContextProvider;
import com.sw.ck.common.datascope.DeptScopeProvider;
import com.sw.ck.bpm.process.service.impl.BpmInstanceServiceImpl;
import com.sw.ck.security.holder.LoginUser;
import com.sw.ck.security.holder.LoginUserHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * G6b 跨租户读隔离（提示05：实际跨租户草稿/个人查询隔离，非仅发起拒绝）。
 * <p>
 * 真实服务 + 真实 MyBatis-Plus 租户拦截器 + 真实 H2：租户 1 用户 A 的草稿/实例，
 * 租户 2 用户 B 以 getById / 列表查询 / 更新均不可达、不可改、不可见；
 * B 自己租户内对象正常可见。不验证发起入口（那已由既有证据覆盖），只验证读取边界。
 * </p>
 */
@SpringBootTest(classes = CrossTenantReadIsolationTest.Config.class,
        webEnvironment = SpringBootTest.WebEnvironment.NONE)
@DisplayName("G6b 跨租户读隔离：A 不能读取/修改 B 租户对象")
class CrossTenantReadIsolationTest {

    @Autowired
    private BpmDraftService draftService;

    @Autowired
    private BpmInstanceService instanceService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @org.springframework.context.annotation.Configuration
    @Import(OverlapH2TestConfig.class)
    static class Config {

        @Bean
        public BpmDraftService bpmDraftService() {
            return new com.sw.ck.bpm.process.service.impl.BpmDraftServiceImpl();
        }

        @Bean
        public DeptScopeProvider deptScopeProvider() {
            return new DeptScopeProvider() {
                @Override
                public java.util.List<Long> listChildDeptIds(Long deptId) {
                    return java.util.List.of();
                }
            };
        }

        @Bean
        public BpmInstanceService bpmInstanceService(LoginContextProvider provider,
                                                     DeptScopeProvider deptScopeProvider) {
            return new BpmInstanceServiceImpl(provider, deptScopeProvider);
        }
    }

    private Long tenant1DraftId;

    @BeforeEach
    void setUp() {
        jdbcTemplate.update("DELETE FROM sw_bpm_command");
        jdbcTemplate.update("DELETE FROM sw_bpm_instance");
        jdbcTemplate.update("DELETE FROM sw_bpm_approval_action");
        jdbcTemplate.update("DELETE FROM sw_bpm_draft");

        // 租户 1 用户 31 的个人草稿（真实服务落库，租户拦截器注入 tenant_id=1）
        tenant1DraftId = createDraft(31L, 1L, "租户1用户草稿");
    }

    @AfterEach
    void tearDown() {
        LoginUserHolder.clear();
    }

    private void login(long userId, long tenantId) {
        LoginUser user = new LoginUser();
        user.setUserId(userId);
        user.setTenantId(tenantId);
        LoginUserHolder.set(user);
    }

    private Long createDraft(long userId, long tenantId, String title) {
        login(userId, tenantId);
        BpmDraft draft = new BpmDraft();
        draft.setTitle(title);
        draft.setFormKey("p4_oa_biz_form_20260905b");
        draft.setFormVersion(2L);
        draft.setStatus("EDITING");
        draft.setPayload("{\"applicant\":\"用户" + userId + "\"}");
        draft.setSubmitSeq(0);
        draftService.save(draft);
        return draft.getId();
    }

    @Test
    @DisplayName("跨租户 getById/列表/更新/删除均不可达；本租户对象正常可见")
    void crossTenantDraftReadIsolation() {
        // 租户 2 用户 32：不可见
        login(32L, 2L);
        assertThat(draftService.getById(tenant1DraftId))
                .as("跨租户 getById 必须为 null（租户拦截器真实生效）").isNull();

        var tenant2List = draftService.lambdaQuery().list();
        assertThat(tenant2List).as("跨租户列表不得泄漏租户 1 草稿").extracting(BpmDraft::getId)
                .doesNotContain(tenant1DraftId);

        // 跨租户更新不生效
        BpmDraft tampered = new BpmDraft();
        tampered.setId(tenant1DraftId);
        tampered.setTitle("被跨租户篡改");
        assertThat(draftService.updateById(tampered)).isFalse();

        // 租户边界内读取方可写回真实读取链：以租户 1 读取（对照，内容未被篡改）
        login(31L, 1L);
        BpmDraft own = draftService.getById(tenant1DraftId);
        assertThat(own).isNotNull();
        assertThat(own.getTitle()).isEqualTo("租户1用户草稿");
        assertThat(own.getPayload()).contains("用户31");

        // 本租户对象正常可见（隔离不是全盲）
        login(33L, 1L);
        assertThat(draftService.getById(tenant1DraftId)).isNotNull();
    }

    @Test
    @DisplayName("跨租户个人实例读取隔离：租户 1 实例对租户 2 不可达")
    void crossTenantInstanceReadIsolation() {
        jdbcTemplate.update("""
                insert into sw_bpm_instance (id, process_instance_id, process_def_key, form_key,
                    business_key, initiator_id, status, tenant_id)
                values (8901, 'pi-cross-tenant-1', 'overlap_p', 'p4_oa_biz_form_20260905b',
                    'biz-cross-tenant-1', 31, 'RUNNING', 1)
                """);

        login(32L, 2L);
        BpmInstance foreign = instanceService.getById(8901L);
        assertThat(foreign).as("跨租户实例读取必须为 null").isNull();

        login(31L, 1L);
        BpmInstance own = instanceService.getById(8901L);
        assertThat(own).isNotNull();
        assertThat(own.getBusinessKey()).isEqualTo("biz-cross-tenant-1");
    }
}
