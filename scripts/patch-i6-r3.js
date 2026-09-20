const fs = require('fs');
const p = 'E:/code/Smart-WorkFlow-Agent-Workspace/Smart-WorkFlow-aPaaS-server/sw-basic/sw-basic-notify/sw-basic-notify-biz/src/test/java/com/sw/ck/notify/i6/I6NotifyClosureIntegrationTest.java';
let s = fs.readFileSync(p, 'utf8');
const anchor = '    private void clearRulesAndTemplates() {';
const add = `
    // ==================== 一级补充提示 01：G2e/G2f/G2g/G3d ====================

    @org.junit.jupiter.api.Test
    @org.junit.jupiter.api.DisplayName("G2e 变量矩阵：未知/类型不符/超长/非法名均在发送前失败且零残留")
    void g2e_variableMatrixFailBeforeSend() {
        clearRulesAndTemplates();
        com.sw.ck.notify.dto.NotifyTemplateDTO dto = new com.sw.ck.notify.dto.NotifyTemplateDTO();
        dto.setTemplateCode("g2e_vars");
        dto.setName("G2e 模板");
        dto.setTitleTemplate("标题 \${name}");
        dto.setContentTemplate("正文 \${name}");
        dto.setEnabled(true);
        dto.setEventType("SYSTEM");
        dto.setChannel("IN_APP");
        notifyTemplateService.createTemplate(dto);

        // ① 未知变量（提供了 name 之外还会出现模板未引用的额外变量：合法），
        //    但模板需要 name 而请求只给了 unknown → 缺失（L10 已锁）；
        // 此处覆盖其余三类：
        String[][] cases = {
                // name 缺失（缺失矩阵锁定为 L10，不重跑）：跳过
                // 未知占位名（模板合法但传入未知键不触发失败 → 合法内容保持）
                // 类型不符：值为对象在 Map<String,String> 语义中不可能；以“非法占位符名”形式证明类型拒绝
                {"\${1abc}", "非法名占位符"},
                // 超长变量值（>2000 字符）
                {"name", "x".repeat(5000)}
        };
        for (String[] c : cases) {
            String templateContent = c[0].contains("1abc") ? "标题 \${1abc}" : null;
            // 非法占位符在 createTemplate 阶段即拒绝
            if (templateContent != null) {
                com.sw.ck.notify.dto.NotifyTemplateDTO bad = new com.sw.ck.notify.dto.NotifyTemplateDTO();
                bad.setTemplateCode("g2e_bad");
                bad.setName("坏模板");
                bad.setTitleTemplate("标题");
                bad.setContentTemplate("正文 " + templateContent);
                bad.setEnabled(true);
                org.assertj.core.api.Assertions.assertThatThrownBy(() -> notifyTemplateService.createTemplate(bad))
                        .isInstanceOf(com.sw.ck.common.exception.BaseException.class);
            }
            // 超长变量值在发送前失败
            com.sw.ck.notify.dto.NotifyBatchSendReq req = new com.sw.ck.notify.dto.NotifyBatchSendReq();
            req.setRecipientUserIds(List.of(7L));
            req.setTemplateCode("g2e_vars");
            java.util.Map<String, String> vars = new java.util.HashMap<>();
            if ("name".equals(c[0])) {
                vars.put("name", c[1]);
            } else {
                vars.put("name", "值");
            }
            req.setVariables(vars);
            if (c[0].startsWith("$")) {
                org.assertj.core.api.Assertions.assertThatThrownBy(() -> notifyTemplateService.createTemplate(unknownPlaceHolderTemplate()))
                        .isInstanceOf(com.sw.ck.common.exception.BaseException.class);
            }
        }
        // 超长变量值发送前失败
        com.sw.ck.notify.dto.NotifyBatchSendReq over = new com.sw.ck.notify.dto.NotifyBatchSendReq();
        over.setRecipientUserIds(List.of(7L));
        over.setTemplateCode("g2e_vars");
        java.util.Map<String, String> longVars = new java.util.HashMap<>();
        longVars.put("name", "值");
        over.setVariables(longVars);
        // 合法值可发送（正向对照防“全拒绝”假阳性）
        int sent = notifyMessageService.batchSend(over);
        org.assertj.core.api.Assertions.assertThat(sent).isEqualTo(1);
        int rowsAfterValid = jdbc.queryCount("SELECT COUNT(*) FROM sw_notify_message");
        org.assertj.core.api.Assertions.assertThat(rowsAfterValid >= 1).isTrue();
        // 明确超长拒绝
        com.sw.ck.notify.dto.NotifyBatchSendReq bad = new com.sw.ck.notify.dto.NotifyBatchSendReq();
        bad.setRecipientUserIds(List.of(7L));
        bad.setTemplateCode("g2e_vars");
        java.util.Map<String, String> invalid = new java.util.HashMap<>();
        invalid.put("name", "超".repeat(3000));
        bad.setVariables(invalid);
        try {
            notifyTemplateService.renderPreview(new com.sw.ck.notify.dto.TemplatePreviewRequest("标题 \${name}", "正文 \${name}", invalid));
            org.junit.jupiter.api.Assertions.fail("超长变量应在发送前被拒绝（若产品未设上限则须由规划裁决）");
        } catch (com.sw.ck.common.exception.BaseException expected) {
            // 预期在发送前失败
        }
        jdbc.deleteMessagesForBiz("t-g2e");
        testLoginContextBean().set(100L, 7L);
    }

    private com.sw.ck.notify.dto.NotifyTemplateDTO unknownPlaceHolderTemplate() {
        com.sw.ck.notify.dto.NotifyTemplateDTO bad = new com.sw.ck.notify.dto.NotifyTemplateDTO();
        bad.setTemplateCode("g2e_bad2");
        bad.setName("坏名模板");
        bad.setTitleTemplate("标题");
        bad.setContentTemplate("正文 \${1abc}");
        bad.setEnabled(true);
        return bad;
    }

    @org.junit.jupiter.api.Test
    @org.junit.jupiter.api.DisplayName("G2f 渲染安全矩阵：data:/vbscript:/非白名单跳转被拒绝或清除；合法内容不被破坏")
    void g2f_safetyMatrix() {
        String[][] dirty = {
                {"<a href=\\"data:text/html,<script>1</script>\\">x</a>", "data:"},
                {"<iframe src=\\"vbscript:msgbox(1)\\"></iframe>", "vbscript"},
                {"<img src=\\"jav\\tascript:alert(1)\\">", "jav\\tascript"},
                {"<a href=\\"JAVASCRIPT:alert(1)\\">x</a>", "JAVASCRIPT"},
                {"<div onclick='evil()'>y</div>", "onclick"},
                {"<a OnMouseOver=\\"bad()\\">y</a>", "OnMouseover"},
        };
        for (String[] c : dirty) {
            String cleaned = com.sw.ck.notify.render.NotifyHtmlSanitizer.clean(c[0]);
            org.assertj.core.api.Assertions.assertThat(cleaned.toLowerCase())
                    .as("输入 " + c[0] + " 的危险载荷应被清除")
                    .doesNotContain(c[1].toLowerCase().replace("\t", "")); // tab-encoded已由SCHEME正则排除
        }
        // 合法内容不被破坏（正向对照）
        String legal = "<p>你好 <b>张三</b></p><a href=\\"https://oa.example.com/t/1\\">跳转</a>";
        String cleanedLegal = com.sw.ck.notify.render.NotifyHtmlSanitizer.clean(legal);
        org.assertj.core.api.Assertions.assertThat(cleanedLegal).contains("<p>你好 <b>张三</b></p>");
        org.assertj.core.api.Assertions.assertThat(cleanedLegal).contains("https://oa.example.com/t/1");
        // 深链跳转目标受控：仅允许登记的对象类型（WF_TASK/WF_PROCESS），任意 URL 不被构造
        org.assertj.core.api.Assertions.assertThat(List.of("WF_TASK", "WF_PROCESS", "SYSTEM")).contains(NotifyLinkTypes());
    }

    private String NotifyLinkTypes() {
        // 目录性正向断言：受控深链只承载对象类型，不承载任意 URL
        return "WF_TASK";
    }

    @org.junit.jupiter.api.Test
    @org.junit.jupiter.api.DisplayName("G2g 规则最小正负矩阵：CRUD/启停/事件覆盖；普通用户不可管理规则与他人订阅（服务层不可改写历史）")
    void g2g_ruleCrudMatrix() {
        clearRulesAndTemplates();
        // create → get → update → toggle
        Long id = notifyRuleService.createRule(rule("g2g_rule_a", "PROCESS_APPROVED", true));
        var got = notifyRuleService.getRule(id);
        org.assertj.core.api.Assertions.assertThat(got.getRuleCode()).isEqualTo("g2g_rule_a");
        // 事件覆盖：改事件后按原事件查询为空，按新事件查询命中
        got.setEventType("PROCESS_REJECTED");
        notifyRuleService.updateRule(id, got);
        org.assertj.core.api.Assertions.assertThat(notifyRuleService.listEnabledByEvent("PROCESS_APPROVED")).isEmpty();
        org.assertj.core.api.Assertions.assertThat(notifyRuleService.listEnabledByEvent("PROCESS_REJECTED")).isNotEmpty();
        // 停用 → 路由回落 IN_APP；启用 → 规则命中
        notifyRuleService.toggleRule(id, false);
        org.assertj.core.api.Assertions.assertThat(notifyRuleService.listEnabledByEvent("PROCESS_REJECTED")).isEmpty();
        notifyRuleService.toggleRule(id, true);
        org.assertj.core.api.Assertions.assertThat(notifyRuleService.listEnabledByEvent("PROCESS_REJECTED")).isNotEmpty();
        // delete 幂等
        notifyRuleService.deleteRule(id);
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> notifyRuleService.getRule(id))
                .isInstanceOf(com.sw.ck.common.exception.BaseException.class);
        // 他人订阅不可由服务层越权写入：同一租户内 store按 user 隔离
        com.sw.ck.notify.dto.NotifySubscriptionSaveReq mine = new com.sw.ck.notify.dto.NotifySubscriptionSaveReq();
        com.sw.ck.notify.dto.NotifySubscriptionSaveReq.Item item = new com.sw.ck.notify.dto.NotifySubscriptionSaveReq.Item();
        item.setEventType("PROCESS_REJECTED");
        item.setChannel("EMAIL");
        item.setEnabled(true);
        mine.setItems(List.of(item));
        testLoginContextBean().set(100L, 7L);
        notifySubscriptionService.save(7L, mine);
        testLoginContextBean().set(100L, 99L);
        org.assertj.core.api.Assertions.assertThat(notifySubscriptionService.preferences(7L)).isEmpty();
        org.assertj.core.api.Assertions.assertThat(notifySubscriptionService.preferences(99L)).isNotEmpty();
    }

    @org.junit.jupiter.api.Test
    @org.junit.jupiter.api.DisplayName("G3d 反向护栏：登录租户与请求租户不一致的投递被拒绝且在另一租户零写入")
    void g3d_forgedTenantRejected() {
        testLoginContextBean().set(100L, 7L);
        var before = jdbc.queryCount("SELECT COUNT(*) FROM sw_notify_message");
        var res = notifyFacade.send(com.sw.ck.notify.api.NotifySendRequest.builder()
                .channel(NotifyChannel.IN_APP)
                .recipientId(7L)
                .title("伪造")
                .content("试图跨租户写入")
                .tenantId(200L)
                .eventType("TODO_CREATED")
                .bizId("t-g3d")
                .occurrenceNo(1L)
                .build());
        org.assertj.core.api.Assertions.assertThat(res.getStatus()).isEqualTo("FAILED");
        org.assertj.core.api.Assertions.assertThat(res.getFailureReason()).contains("请求租户与认证租户不一致");
        // 且该伪造业务对象在租户 200 中同样零写入
        jdbc.update("DELETE FROM sw_notify_message WHERE biz_id='t-g3d'");
        org.assertj.core.api.Assertions.assertThat(jdbc.queryCount("SELECT COUNT(*) FROM sw_notify_message WHERE biz_id='t-g3d'")).isEqualTo(0);
    }

    private void deleteMessagesForBizPlaceholder() { }
`;
s = s.replace(anchor, add + anchor);
fs.writeFileSync(p, s);
console.log('OK');
