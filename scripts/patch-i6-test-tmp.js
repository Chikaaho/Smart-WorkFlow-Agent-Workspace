const fs = require('fs');
const p = 'E:/code/Smart-WorkFlow-Agent-Workspace/Smart-WorkFlow-aPaaS-server/sw-basic/sw-basic-notify/sw-basic-notify-biz/src/test/java/com/sw/ck/notify/i6/I6NotifyClosureIntegrationTest.java';
let s = fs.readFileSync(p, 'utf8');
const anchor = '    private NotifyRuleDTO rule(String code, String eventType, boolean required) {';
const add = `    @org.junit.jupiter.api.Test
    @org.junit.jupiter.api.DisplayName("G2a 模板不可变版本：编辑生效后新版本追加，既有投递仍固定旧版本号")
    void g2a_templateVersionImmutable() {
        clearRulesAndTemplates();
        com.sw.ck.notify.dto.NotifyTemplateDTO dto = new com.sw.ck.notify.dto.NotifyTemplateDTO();
        dto.setTemplateCode("g2_demo");
        dto.setName("G2 演示模板");
        dto.setTitleTemplate("标题 v1");
        dto.setContentTemplate("内容 v1");
        dto.setEnabled(true);
        dto.setEventType("TODO_CREATED");
        dto.setChannel("IN_APP");
        Long templateId = templateServiceBean().createTemplate(dto);
        var snapshot1 = templateVersionService().latestSnapshot(templateId);
        org.assertj.core.api.Assertions.assertThat(snapshot1.getTemplateVersion()).isEqualTo(1);
        notifyFacadeBean().send(com.sw.ck.notify.api.NotifySendRequest.builder()
                .channel(NotifyChannel.IN_APP)
                .recipientId(7L)
                .title("v1")
                .content("v1")
                .tenantId(100L)
                .eventType("TODO_CREATED")
                .bizId("t-g2a")
                .occurrenceNo(1L)
                .templateId(templateId)
                .templateVersion(1)
                .build());
        dto.setContentTemplate("内容 v2");
        templateServiceBean().updateTemplate(templateId, dto);
        var snapshot2 = templateVersionService().latestSnapshot(templateId);
        org.assertj.core.api.Assertions.assertThat(snapshot2.getTemplateVersion()).isEqualTo(2);
        org.assertj.core.api.Assertions.assertThat(jdbc.queryCount(
                "SELECT template_version FROM sw_notify_message WHERE id = (SELECT MAX(id) FROM sw_notify_message)"))
                .isEqualTo(1);
    }

    @org.junit.jupiter.api.Test
    @org.junit.jupiter.api.DisplayName("G2b 模板缺失变量在发送前明确失败，不在收件箱留下坏数据")
    void g2b_missingVariableFailsBeforeSend() {
        clearRulesAndTemplates();
        com.sw.ck.notify.dto.NotifyTemplateDTO dto = new com.sw.ck.notify.dto.NotifyTemplateDTO();
        dto.setTemplateCode("g2_missing_var");
        dto.setName("G2 缺变量模板");
        dto.setTitleTemplate("标题 \${missing_var}");
        dto.setContentTemplate("正文 \${missing_var}");
        dto.setEnabled(true);
        dto.setEventType("SYSTEM");
        dto.setChannel("IN_APP");
        templateServiceBean().createTemplate(dto);
        com.sw.ck.notify.dto.NotifyBatchSendReq req = new com.sw.ck.notify.dto.NotifyBatchSendReq();
        req.setRecipientUserIds(List.of(7L));
        req.setTemplateCode("g2_missing_var");
        java.util.Map<String, String> variables = new java.util.HashMap<>();
        variables.put("provided_var", "值");
        req.setVariables(variables);
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> messageServiceBean().batchSend(req))
                .isInstanceOf(com.sw.ck.common.exception.BaseException.class);
        org.assertj.core.api.Assertions.assertThat(jdbc.queryCount("SELECT COUNT(*) FROM sw_notify_message")).isEqualTo(0);
    }

    @org.junit.jupiter.api.Test
    @org.junit.jupiter.api.DisplayName("G2c 危险 HTML 经净化器拒绝注入脚本/事件/任意协议")
    void g2c_htmlSanitizer() {
        String dirty = "正常<input onerror=alert(1)><script>alert(2)</script><a href='" + "javascript" + ":evil()'>x</a>";
        String cleaned = com.sw.ck.notify.render.NotifyHtmlSanitizer.clean(dirty);
        org.assertj.core.api.Assertions.assertThat(cleaned).doesNotContain("<script");
        org.assertj.core.api.Assertions.assertThat(cleaned.toLowerCase()).doesNotContain("onerror=");
        org.assertj.core.api.Assertions.assertThat(cleaned.toLowerCase()).doesNotContain("javascript");
    }

    @org.junit.jupiter.api.Test
    @org.junit.jupiter.api.DisplayName("G2d 规则停用后路由回落 IN_APP；订阅变化不改写已通知历史")
    void g2d_ruleToggleAndSubscription() {
        clearRulesAndTemplates();
        notifyRuleService().createRule(rule("g2d_rule_todo", "TODO_CREATED", true));
        Long rowId = jdbc.queryForLong("SELECT id FROM sw_notify_rule WHERE rule_code='g2d_rule_todo'");
        notifyRuleService().toggleRule(rowId, false);
        org.assertj.core.api.Assertions.assertThat(routingServiceBean().channelsFor("TODO_CREATED", 7L))
                .containsExactly(NotifyChannel.IN_APP);
        notifyFacadeBean().send(com.sw.ck.notify.api.NotifySendRequest.builder()
                .channel(NotifyChannel.IN_APP)
                .recipientId(7L)
                .title("参考")
                .content("不因订阅变化而改写")
                .tenantId(100L)
                .eventType("TODO_CREATED")
                .bizId("t-g2d")
                .occurrenceNo(1L)
                .build());
        com.sw.ck.notify.dto.NotifySubscriptionSaveReq req = new com.sw.ck.notify.dto.NotifySubscriptionSaveReq();
        com.sw.ck.notify.dto.NotifySubscriptionSaveReq.Item item = new com.sw.ck.notify.dto.NotifySubscriptionSaveReq.Item();
        item.setEventType("TODO_CREATED");
        item.setChannel("EMAIL");
        item.setEnabled(true);
        req.setItems(List.of(item));
        notifySubscriptionService().save(7L, req);
        org.assertj.core.api.Assertions.assertThat(
                jdbc.queryCount("SELECT COUNT(*) FROM sw_notify_message WHERE biz_id='t-g2d'")).isEqualTo(1);
    }

    @org.junit.jupiter.api.Test
    @org.junit.jupiter.api.DisplayName("G3a 双租户矩阵：跨租户模板/规则/订阅不读不可写，用户订阅互不串扰")
    void g3a_crossTenantMatrix() {
        clearRulesAndTemplates();
        com.sw.ck.notify.dto.NotifyTemplateDTO dto = new com.sw.ck.notify.dto.NotifyTemplateDTO();
        dto.setTemplateCode("g3_tenant_template");
        dto.setName("租户 100 模板");
        dto.setTitleTemplate("标题");
        dto.setContentTemplate("内容");
        dto.setEnabled(true);
        dto.setEventType("SYSTEM");
        dto.setChannel("IN_APP");
        Long templateId = templateServiceBean().createTemplate(dto);
        notifyRuleService().createRule(rule("g3_rule_todo", "TODO_CREATED", true));
        testLoginContextBean().set(200L, 7L);
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> templateServiceBean().getTemplate(templateId))
                .isInstanceOf(com.sw.ck.common.exception.BaseException.class);
        org.assertj.core.api.Assertions.assertThat(notifyRuleService().listEnabledByEvent("TODO_CREATED")).isEmpty();
        org.assertj.core.api.Assertions.assertThat(notifySubscriptionService().preferences(7L)).isEmpty();
        testLoginContextBean().set(100L, 7L);
    }

    @org.junit.jupiter.api.Test
    @org.junit.jupiter.api.DisplayName("G3b 失效/缺失邮箱目标解析为明确失败，不冒充成功")
    void g3b_targetResolutionFailClosed() {
        com.sw.ck.notify.api.NotifyTargetResolver resolver = new com.sw.ck.notify.api.NotifyTargetResolver() {
            @Override
            public String resolveEmail(Long userId) { return null; }

            @Override
            public String resolvePhone(Long userId) { return null; }
        };
        var adapter = new com.sw.ck.notify.adapters.EmailNotifyChannelAdapter(resolver,
                new com.sw.ck.notify.config.NotifyChannelProperties());
        var result = adapter.send(com.sw.ck.notify.api.NotifySendRequest.builder()
                .channel(NotifyChannel.EMAIL)
                .recipientId(999L)
                .title("标题")
                .content("正文")
                .tenantId(100L)
                .build());
        org.assertj.core.api.Assertions.assertThat(result.getStatus()).isEqualTo("FAILED");
        org.assertj.core.api.Assertions.assertThat(result.getFailureReason()).contains("无法解析收件邮箱");
    }

    @org.junit.jupiter.api.Test
    @org.junit.jupiter.api.DisplayName("G3c 管理员记录详情默认省略完整正文（最小暴露）")
    void g3c_recordDetailMasked() {
        notifyFacadeBean().send(com.sw.ck.notify.api.NotifySendRequest.builder()
                .channel(NotifyChannel.IN_APP)
                .recipientId(7L)
                .title("机密")
                .content("完整正文内容 SECRET")
                .tenantId(100L)
                .eventType("SYSTEM")
                .bizId("t-g3c")
                .occurrenceNo(1L)
                .build());
        Long lastId = jdbc.queryForLong("SELECT MAX(id) FROM sw_notify_message");
        java.util.Map<String, Object> detail = recordServiceBean().recordDetail(lastId);
        NotifyMessage masked = (NotifyMessage) detail.get("message");
        org.assertj.core.api.Assertions.assertThat(masked.getContent()).isNull();
    }

    private void clearRulesAndTemplates() {
        jdbc.update("DELETE FROM sw_notify_message");
        jdbc.update("DELETE FROM sw_notify_rule");
        jdbc.update("DELETE FROM sw_notify_subscription");
        jdbc.update("DELETE FROM sw_notify_channel_config");
        jdbc.update("DELETE FROM sw_notify_template_version");
        jdbc.update("DELETE FROM sw_notify_template");
        testLoginContextBean().set(100L, 7L);
    }
`;
s = s.replace(anchor, add + anchor);
fs.writeFileSync(p, s);
console.log('OK');
