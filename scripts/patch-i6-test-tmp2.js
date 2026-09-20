const fs = require('fs');
const p = 'E:/code/Smart-WorkFlow-Agent-Workspace/Smart-WorkFlow-aPaaS-server/sw-basic/sw-basic-notify/sw-basic-notify-biz/src/test/java/com/sw/ck/notify/i6/I6NotifyClosureIntegrationTest.java';
let s = fs.readFileSync(p, 'utf8');
const map = [
  ['templateServiceBean()', 'notifyTemplateService'],
  ['templateVersionService()', 'versionService'],
  ['notifyFacadeBean()', 'notifyFacade'],
  ['messageServiceBean()', 'notifyMessageService'],
  ['recordServiceBean()', 'notifyRecordService'],
  ['routingServiceBean()', 'notifyRoutingService'],
  ['testLoginContextBean()', 'testLoginContext'],
];
for (const [a, b] of map) s = s.split(a).join(b);
// fields
s = s.replace('    @Autowired\n    private NotifyRoutingService notifyRoutingService;',
`    @Autowired
    private NotifyRoutingService notifyRoutingService;

    @Autowired
    private com.sw.ck.notify.service.NotifyTemplateService notifyTemplateService;

    @Autowired
    private com.sw.ck.notify.service.NotifyTemplateVersionService versionService;

    @Autowired
    private com.sw.ck.notify.service.NotifyRecordService notifyRecordService;`);
// jdbc helper add queryForLong
s = s.replace('        long queryCount(String sql) {',
`        long queryForLong(String sql) {
            Long v = jdbc.queryForObject(sql, Long.class);
            return v == null ? 0L : v;
        }

        long queryCount(String sql) {`);
fs.writeFileSync(p, s);
console.log('OK');
