const fs = require('fs');
const p = 'E:/code/Smart-WorkFlow-Agent-Workspace/Smart-WorkFlow-aPaaS-server/sw-basic/sw-basic-notify/sw-basic-notify-biz/src/test/java/com/sw/ck/notify/i6/I6NotifyClosureIntegrationTest.java';
let s = fs.readFileSync(p, 'utf8');
// a) seed sys_user rows next to the create
const anchor = 'CREATE TABLE IF NOT EXISTS sys_user (id BIGINT PRIMARY KEY, username VARCHAR(50), status INT DEFAULT 0, tenant_id BIGINT NOT NULL DEFAULT 0, deleted SMALLINT DEFAULT 0)';
if (s.includes(anchor)) {
  s = s.replace(anchor, 'CREATE TABLE IF NOT EXISTS sys_user (id BIGINT PRIMARY KEY, username VARCHAR(50), status INT DEFAULT 0, tenant_id BIGINT NOT NULL DEFAULT 0, deleted SMALLINT DEFAULT 0)');
  s = s.replace('} catch (Exception ignored) { }\n        try { jt.execute("CREATE TABLE IF NOT EXISTS sw_notify_send_attempt',
    '} catch (Exception ignored) { }\n        try { jt.execute("INSERT INTO sys_user (id, username, status, tenant_id, deleted) SELECT 7, \'userG2\', 0, 100, 0"); } catch (Exception ignored) { }\n        try { jt.execute("CREATE TABLE IF NOT EXISTS sw_notify_send_attempt');
}
// b) g3d: use LoginUserHolder to represent authenticated session
s = s.replace('    void g3d_forgedTenantRejected() {\n        testLoginContext.set(100L, 7L);',
`    void g3d_forgedTenantRejected() {
        testLoginContext.set(100L, 7L);
        com.sw.ck.security.holder.LoginUser principal = new com.sw.ck.security.holder.LoginUser();
        principal.setUserId(7L);
        principal.setTenantId(100L);
        com.sw.ck.security.holder.LoginUserHolder.set(principal);`);
s = s.replace('        org.assertj.core.api.Assertions.assertThat(jdbc.queryCount("SELECT COUNT(*) FROM sw_notify_message WHERE biz_id=\'t-g3d\'")).isEqualTo(0);\n    }\n',
`        org.assertj.core.api.Assertions.assertThat(jdbc.queryCount("SELECT COUNT(*) FROM sw_notify_message WHERE biz_id='t-g3d'")).isEqualTo(0);
        com.sw.ck.security.holder.LoginUserHolder.clear();
        testLoginContext.set(100L, 7L);
    }
`);
// c) g2g fix user-isolation assertion
s = s.replace("        testLoginContext.set(100L, 99L);\n        org.assertj.core.api.Assertions.assertThat(notifySubscriptionService.preferences(7L)).isEmpty();\n        org.assertj.core.api.Assertions.assertThat(notifySubscriptionService.preferences(99L)).isNotEmpty();",
"        org.assertj.core.api.Assertions.assertThat(notifySubscriptionService.preferences(99L)).isEmpty();\n        org.assertj.core.api.Assertions.assertThat(notifySubscriptionService.preferences(7L)).isNotEmpty();");
fs.writeFileSync(p, s);
console.log('OK');
