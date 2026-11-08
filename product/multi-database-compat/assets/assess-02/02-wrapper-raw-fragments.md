# B0 证据：MyBatis-Plus Wrapper 原生片段

- `.apply` / `.having` / `.inSql`：3 处；其中真实 Wrapper 原生片段 1 处（BpmCommandController:156 的 `(command_key LIKE {0} OR command_key LIKE {1})`），另外 2 处是 `Function.apply`/`appNameOf.apply`，不是 Wrapper。
- `.last(...)`：129 处；其中非 LIMIT：0 处。大写 `"LIMIT"` 97 处、小写 `"limit"` 32 处；assess-01 的 97 只覆盖大写，B0 修正为 129。
- `.orderBy*` 原生字符串（非方法引用）：8 处；都是简单列名/别名（`create_time`、`cnt`、`process_def_key`、`lastTime`），没有函数或表达式。
- `.select(...)` 含 SQL 表达式：7 处；其中 `count(*) as cnt`、`MAX(round_no) AS max_round`、`COUNT(*) AS branch_total`、`COUNT(DISTINCT participant_id) AS total` 的别名未加引号，Oracle/达梦会折成大写，消费端按小写读取会取不到（详见 `04-case-folding-and-empty-string.md`）。
- `.groupBy(...)`：3 处；都是 `process_def_key`。

## apply / having / inSql

| # | 文件:行 | 方法 | 片段 |
|---:|---|---|---|
| 1 | sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/service/IotDeviceManageService.java:170 | apply | `patch` |
| 2 | sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/controller/FormWorkspaceAnalyticsController.java:71 | apply | `appId` |
| 3 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/controller/BpmCommandController.java:156 | apply | `"(command_key LIKE {0} OR command_key LIKE {1})", "TASK_%:" + taskId + ":" + loginUser.getUserId(), "TASK_%:" + taskId + ":" + loginUser.getUserId() + ":R%"` |

## .last(...) 非 LIMIT

| # | 文件:行 | 片段 |
|---:|---|---|

## .orderBy* 原生字符串

| # | 文件:行 | 片段 |
|---:|---|---|
| 1 | sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/txn/port/FormTxnActionPortImpl.java:124 | `com.sw.ck.form.txn.entity.TxnInvocationEntity::getCreateTime` |
| 2 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/queue/PersistentBpmCommandQueue.java:559 | `"create_time"` |
| 3 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/BpmProcessFavoriteService.java:100 | `"cnt"` |
| 4 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/BpmProcessFavoriteService.java:101 | `"process_def_key"` |
| 5 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/BpmProcessFavoriteService.java:117 | `"lastTime"` |
| 6 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/impl/BpmCatalogServiceImpl.java:79 | `com.sw.ck.bpm.process.entity.BpmCategory::getSortNo` |
| 7 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/impl/BpmMonitorServiceImpl.java:277 | `com.sw.ck.bpm.process.entity.DynamicBranchSnapshot::getBranchIndex` |
| 8 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/impl/BpmMonitorServiceImpl.java:441 | `com.sw.ck.bpm.process.entity.BpmTaskDeadline::getDueAt` |

## .select(...) 含 SQL 表达式

| # | 文件:行 | 片段 |
|---:|---|---|
| 1 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/controller/BpmProcessDefController.java:364 | `"process_def_key as \"processKey\"", "count(*) as cnt"` |
| 2 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/queue/PersistentBpmCommandQueue.java:157 | `"DISTINCT tenant_id"` |
| 3 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/BpmProcessFavoriteService.java:98 | `"process_def_key as \"processKey\"", "count(*) as cnt"` |
| 4 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/BpmProcessFavoriteService.java:114 | `"process_def_key as \"processKey\"", "max(create_time) as lastTime"` |
| 5 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/impl/ApprovalLifecycleServiceImpl.java:960 | `"MAX(round_no) AS max_round"` |
| 6 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/impl/ApprovalLifecycleServiceImpl.java:971 | `"COUNT(*) AS branch_total"` |
| 7 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/impl/ApprovalLifecycleServiceImpl.java:988 | `"COUNT(DISTINCT participant_id) AS total"` |

## .groupBy(...)

| # | 文件:行 | 片段 |
|---:|---|---|
| 1 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/controller/BpmProcessDefController.java:366 | `"process_def_key"` |
| 2 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/BpmProcessFavoriteService.java:99 | `"process_def_key"` |
| 3 | sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/BpmProcessFavoriteService.java:116 | `"process_def_key"` |
