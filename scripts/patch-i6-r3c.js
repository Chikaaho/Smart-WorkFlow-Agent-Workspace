const fs = require('fs');
const p = 'E:/code/Smart-WorkFlow-Agent-Workspace/Smart-WorkFlow-aPaaS-server/sw-basic/sw-basic-notify/sw-basic-notify-biz/src/test/java/com/sw/ck/notify/i6/I6NotifyClosureIntegrationTest.java';
let s = fs.readFileSync(p, 'utf8');
if (!s.includes('previewReq(invalid)')) {
  s = s.replace('com.sw.ck.notify.dto.TemplatePreviewRequest("标题 ${name}", "正文 ${name}", invalid)', 'previewReq(invalid)');
}
if (!s.includes('private com.sw.ck.notify.dto.TemplatePreviewRequest previewReq(')) {
  s = s.replace('    private void deleteMessagesForBizPlaceholder() { }',
`    private com.sw.ck.notify.dto.TemplatePreviewRequest previewReq(java.util.Map<String, String> vars) {
        com.sw.ck.notify.dto.TemplatePreviewRequest r = new com.sw.ck.notify.dto.TemplatePreviewRequest();
        r.setTitleTemplate("标题 " + "$" + "{name}");
        r.setContentTemplate("正文 " + "$" + "{name}");
        r.setVariables(vars);
        return r;
    }`);
}
fs.writeFileSync(p, s);
console.log('OK');
