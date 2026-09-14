const fs = require('fs');
const p = 'E:/code/Smart-WorkFlow-Agent-Workspace/Smart-WorkFlow-aPaaS-server/sw-basic/sw-basic-notify/sw-basic-notify-biz/src/test/java/com/sw/ck/notify/i6/I6NotifyClosureIntegrationTest.java';
let s = fs.readFileSync(p, 'utf8');
// cleanup tokens from previous patch
s = s.split('jdbc.deleteMessagesForBiz("t-g2e");').join('');
s = s.split('        testLoginContextBean().set(100L, 7L);').join('        testLoginContext.set(100L, 7L);');
s = s.split('testLoginContextBean().set').join('testLoginContext.set');
s = s.split('NotifyLinkTypes()').join('"WF_TASK"');
fs.writeFileSync(p, s);
console.log('OK');
