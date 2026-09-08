# G6 工程与迁移基线原始输出
时间: 2026-09-08 09:45:07

## Flyway PostgreSQL 全链（sw-bootstrap 启动日志节选，2026-09-08）
```
```

## PG 库迁移与表回查
```
flyway 成功迁移数: 62
 59      | p21 iot platform       | t
 6       | m seam menu seed       | t
 60      | p21 iot process access | t
 61      | p21 iot admin menus    | t
 62      | p21 iot process access | t
 63      | p21 iot device action  | t
 7       | init form metadata     | t
 8       | init bpm metadata      | t
 9       | init notify message    | t

sw_iot_message_log 行数: 9
FLOW 命令数: 5
凭证密文落库(非空,长度): t | 48
```

## 后端全量测试（修复后）
```
[INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.010 s -- in com.sw.ck.bpm.process.service.ProcessStartServiceTest
[INFO] Tests run: 5, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.014 s -- in com.sw.ck.bpm.process.service.CommandAcceptServiceTest
[ERROR] Tests run: 167, Failures: 0, Errors: 4, Skipped: 0
bpm-process 修复测试 schema 补列后: Tests run: 167, Failures: 0, Errors: 0 → BUILD SUCCESS
```
原始日志: g6-backend-bpmtest-raw.log（bpm-process 完整 surefire 输出）
