# P21 IoT 设备接入：第五轮执行修正回执

> 会话角色：执行（Executor）
> 唯一执行入口：`planning-execution-prompt-p21-iot-03.md`（H1—H10 原子矩阵）
> 前序验收：`planning-review-p21-iot-04.md`
> 功能状态：`VERIFYING`（本回执提交规划复验，不改写 `PASSED` / `COMPLETED`）
> 环境：dev profile + 真实 PostgreSQL `smart_workflow` + Owner Broker；调试认证仅用于 loopback 验证，凭证只短时注入环境变量
> 日期：2026-09-08

## 一、执行结论

已按第四轮问题清单修复并重新核验 H1—H10。代码、测试、真实 PG、Owner Broker、浏览器交互和工程门禁均有本轮直接证据；全部当前可执行项已收口，等待 Planner 复验裁决。P21 功能状态维持 `VERIFYING`。

## 二、问题修复

1. H2：终态 `SUCCESS` / `FAILED` 的重复 ACK 不再覆盖原结果或回退状态；ACK 必须匹配命令 correlationId。
2. H4a：`REFERENCE` 合同使用 `targetFormId`，校验目标记录存在、已发布、同租户且当前用户可访问；缺失、跨租户或不可访问时拒绝发布。
3. H4b：`BOOL`、`DATE`、`REFERENCE` 逐字段校验，发布响应一次返回全部错误，规则保持 `DRAFT`。
4. H5：Java 子进程编译/运行补齐宿主 API 与工作目录 classpath，解包真实调用异常；Java/JS action、publish、event、execution、command 全链路携带同一 correlationId。
5. H8：新增 IoT 审计记录及六类动作落库：`COMMAND_DISPATCH`、`COMMAND_RETRY`、`CONNECTION_TEST`、`FLOW_TRIGGER`、`RULE_PUBLISH`、`SCRIPT_PUBLISH`；记录操作者、系统身份、对象、结果、时间、correlationId 和详情。
6. H9：运行记录消息、命令、脚本执行、流程触发四类详情支持行点击 JSON 查看；脚本试运行对副作用调用给出受控失败提示；设备开关和连接测试保持真实 API/数据库回读一致。

## 三、H1—H10 证据矩阵

| 原子 | 本轮直接证据 | 结果 |
|---|---|---|
| H1 | `evidence/final-h1/index.json`、`raw.exec.json`、`raw.topic.stdout.log` | 合法上报执行成功；越权主题被服务端拒绝 |
| H2 | `evidence/final-h2/index.json`、`raw.jsonl` | 合法 ACK 完成；重复 ACK 保持终态、原结果和 correlation 不变 |
| H3a | `evidence/final-h3a/index.json`、`raw.mvn.log` | BLOCK / CONTINUE / MANUAL 三策略单元测试通过，回调行为分别符合策略 |
| H3b | `evidence/final-h3b/index.json`、`raw.api.json` | 流程动作来源和合格设备 API/UI 证据齐全 |
| H4a | `evidence/final-h4a/index.json`、`raw.http`、`raw.reference.sql` | 合法 REFERENCE 发布成功；缺失和跨租户目标均受控拒绝且无流程增长 |
| H4b | `evidence/final-h4b/index.json`、`raw.http` | BOOL / DATE / REFERENCE 三类错误一次返回，规则保持草稿 |
| H5 | `evidence/final-h5/index.json`、`raw.filtered.json`、`raw.detail.txt` | Java 与 JS 的 execution/action/publish/event/command 关联使用同一 correlationId |
| H6 | `evidence/final-h6/index.json`、`raw.http` | 同一请求体得到 200 / 403 / 401 / 400 四态，未授权和畸形请求不写入 |
| H7 | `evidence/final-h7/index.json`、`raw.mvn.log`、`raw.cleanup.sql` | 真实 PG 租户四象限隔离测试通过，探针行已逻辑删除 |
| H8 | `evidence/final-h8/index.json`、`raw.csv`、`raw.retry.json` | 六类审计动作及原命令/重试命令关联齐全 |
| H9a | `evidence/final-h9a/index.json`、`raw.api.txt` | 设备流程接入开关完成关闭/刷新/开启/刷新回读，终态为开启 |
| H9b | `evidence/final-h9b/index.json`、`raw.http` | Owner 连接测试 HEALTHY；错误凭证分类为 AUTH_FAILED |
| H9c | `evidence/final-h9c/index.json`、`raw.api.json` | Java/JS 脚本发布和试运行副作用拦截均有 API/UI 证据 |
| H9d | `evidence/final-h9d/index.json`、`raw.api.json` | 规则发布、触发记录和触发详情可回读 |
| H9e | `evidence/final-h9e/index.json`、`raw.api.json` | 消息、命令、脚本执行、流程触发四类详情均完成行点击 JSON 查看 |
| H10a | `evidence/final-h10a/index.json`、`raw.backend-package.log`、`raw.frontend-gates.log` | 后端 package、前端 typecheck/lint/test/build 全部 exit 0 |
| H10b | `evidence/final-h10b/index.json`、`raw.manifest.sha256`、`raw.coverage.log` | 最终证据 manifest 和覆盖检查完成 |
| H10c | `evidence/final-h10c/index.json`、`raw.validator.log` | 回执末行 Validator 输入、stdout/stderr/exit 均归档 |
| H10d | `evidence/final-h10d/index.json`、`raw.cleanup.log` | 临时服务、进程、端口、探针和临时 RSA 文件清理回读完成 |

## 四、工程与行为验证

- 后端 `MAVEN_OPTS="-Xmx2g" mvn -pl sw-bootstrap -am -DskipTests package`：`BUILD SUCCESS`。
- 后端 IoT ACK/队列、Flyway PostgreSQL/H2、Java 子进程沙箱、REFERENCE 合同、H3a 三策略、H7 真实 PG 四象限测试均通过。
- 前端 `pnpm typecheck`、`pnpm lint`、`pnpm test`、`pnpm build` 均 exit 0；测试结果为 124 个文件通过、1 个跳过，1168 个测试通过、3 个跳过。
- H5 使用真实 Owner Broker 完成 Java/JS action 与 event 关联回读；H2 使用真实 MQTT ACK 重复投递完成终态不变回读。
- H8 直接数据库导出六类审计记录；H9 通过浏览器完成运行记录详情、设备开关、连接测试、脚本试运行、规则触发等交互回读。

## 五、变更范围

- 后端：表单记录访问合同、IoT correlationId 传播、ACK 幂等、审计实体/服务/迁移、脚本子进程 classpath 与异常解包、流程动作失败策略测试。
- 前端：IoT API 类型补充、运行记录四类详情弹窗、流程触发记录详情交互及格式门禁修正。
- 证据：新增 `evidence/final-h1` 至 `evidence/final-h10d` 的索引、原始输出、验证和清理回读；未覆盖历史回执。

## 六、边界与下一步

- 本回执是 Executor 自验和执行提交，不是 Planner 终态确认；不宣称 P21 已 `PASSED` 或 `COMPLETED`。
- 真实 Broker 使用 Owner 已配置连接；没有扩展为未授权的外部生产账号验证。
- 等待 Planner 对 `completion-p21-iot-05.md` 及 final-h1—final-h10d 证据包进行第五轮复验；若回执仍有差异，按新差异原子继续处理。

ENGINE_TERMINAL {"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"XL","receipt":"product/p21-iot-device-access/receipts/completion-p21-iot-05.md","evidence":["product/p21-iot-device-access/receipts/evidence/final-h1/index.json","product/p21-iot-device-access/receipts/evidence/final-h2/index.json","product/p21-iot-device-access/receipts/evidence/final-h3a/index.json","product/p21-iot-device-access/receipts/evidence/final-h3b/index.json","product/p21-iot-device-access/receipts/evidence/final-h4a/index.json","product/p21-iot-device-access/receipts/evidence/final-h4b/index.json","product/p21-iot-device-access/receipts/evidence/final-h5/index.json","product/p21-iot-device-access/receipts/evidence/final-h6/index.json","product/p21-iot-device-access/receipts/evidence/final-h7/index.json","product/p21-iot-device-access/receipts/evidence/final-h8/index.json","product/p21-iot-device-access/receipts/evidence/final-h9a/index.json","product/p21-iot-device-access/receipts/evidence/final-h9b/index.json","product/p21-iot-device-access/receipts/evidence/final-h9c/index.json","product/p21-iot-device-access/receipts/evidence/final-h9d/index.json","product/p21-iot-device-access/receipts/evidence/final-h9e/index.json","product/p21-iot-device-access/receipts/evidence/final-h10a/index.json","product/p21-iot-device-access/receipts/evidence/final-h10b/index.json","product/p21-iot-device-access/receipts/evidence/final-h10c/index.json","product/p21-iot-device-access/receipts/evidence/final-h10d/index.json"],"feature_status":"VERIFYING","work_items":[{"id":"H1-topic-reject","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已完成：合法上报执行与越权主题拒绝证据已归档"},{"id":"H2-terminal-ack-idempotency","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已完成：终态重复 ACK 保持原结果、状态和 correlationId"},{"id":"H3a-failure-policy","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已完成：BLOCK、CONTINUE、MANUAL 三策略测试通过"},{"id":"H3b-action-source-ui","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已完成：动作来源、合格设备和失败策略 UI/API 证据已归档"},{"id":"H4a-reference-access","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已完成：REFERENCE 目标存在性、发布态、租户和访问权校验"},{"id":"H4b-typed-contract","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已完成：BOOL、DATE、REFERENCE 反例拒绝证据已归档"},{"id":"H5-correlation-chain","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已完成：Java/JS 执行至设备命令和事件的关联链已回读"},{"id":"H6-auth-four-state","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已完成：200、403、401、400 同体请求矩阵通过"},{"id":"H7-tenant-isolation","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已完成：真实 PG 四象限读写隔离和清理回读通过"},{"id":"H8-audit-retry","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已完成：六类审计动作与重试关联证据已归档"},{"id":"H9a-device-toggle","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已完成：设备流程接入开关往返回读"},{"id":"H9b-connection-test","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已完成：健康和认证失败分类回读"},{"id":"H9c-script-run","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已完成：脚本发布、试运行和副作用拦截回读"},{"id":"H9d-rule-trigger","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已完成：规则发布、触发记录和详情回读"},{"id":"H9e-runtime-detail","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已完成：四类运行记录行详情回读"},{"id":"H10a-gates","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已完成：后端和前端工程门禁全通过"},{"id":"H10b-manifest","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已完成：最终证据文件 manifest 与覆盖检查"},{"id":"H10c-validator","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已完成：终端回执 Validator 输入和结果已归档"},{"id":"H10d-cleanup","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已完成：服务、进程、端口、探针和临时凭证文件清理回读"}],"remaining_actionable_count":0,"independent_work_exhausted":true,"next_action":"等待 Planner 对 completion-p21-iot-05.md 及 final-h1—final-h10d 证据包进行第五轮复验","next_action_type":"WAIT_PLANNER","progress_fingerprint":"p21-verifying-round5-20260908-h1-h10d-final-packs","progress_basis":{"files_changed":["Smart-WorkFlow-Server/sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/service/MessageIngestService.java","Smart-WorkFlow-Server/sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/service/IotFormContractCheckerImpl.java","Smart-WorkFlow-Server/sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/service/FormDataQueryService.java","Smart-WorkFlow-Server/sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/service/IotAuditService.java","Smart-WorkFlow-Server/sw-basic/sw-basic-iot/src/main/resources/db/migration/iot/h2/V66__p21_iot_audit_and_correlation.sql","Smart-WorkFlow-Server/sw-basic/sw-basic-iot/src/main/resources/db/migration/iot/postgresql/V66__p21_iot_audit_and_correlation.sql","Smart-WorkFlow-Server/sw-biz/sw-bpm/sw-bpm-process/src/test/java/com/sw/ck/bpm/process/listener/IotProcessTriggerListenerPolicyTest.java","Smart-WorkFlow-Server/sw-bootstrap/src/test/java/com/sw/ck/bootstrap/p21/H7TenantIsolationIntegrationTest.java","Smart-WorkFlow-Web/src/modules/iot/views/IotRuntimeLogs.vue","Smart-WorkFlow-Web/src/modules/iot/views/IotRuleList.vue","product/p21-iot-device-access/receipts/completion-p21-iot-05.md"],"tool_actions":["mvn package and targeted Maven tests","pnpm typecheck/lint/test/build","MQTT real Owner publish and duplicate ACK replay","curl HTTP H4/H6/H9 checks","psql direct behavior and audit readback","CUA browser H3b/H9 interactions","manifest coverage and validate-terminal.sh","temporary service, process, port and file cleanup"],"new_evidence":["product/p21-iot-device-access/receipts/evidence/final-h1 through final-h10d","completion-p21-iot-05.md"],"closed_work_items":["H1","H2","H3a","H3b","H4a","H4b","H5","H6","H7","H8","H9a","H9b","H9c","H9d","H9e","H10a","H10b","H10c","H10d"]},"stop_reason":"WAITING_FOR_PLANNER","tool_results":[{"tool":"mvn","outcome":"SUCCEEDED","detail":"Backend package, targeted IoT tests, Java sandbox, form contract, H3a policy and H7 isolation all passed"},{"tool":"pnpm","outcome":"SUCCEEDED","detail":"typecheck, lint, test and build all exit 0; 124 files passed, 1 skipped; 1168 tests passed, 3 skipped"},{"tool":"MQTT","outcome":"SUCCEEDED","detail":"Owner Broker H5 execution and H2 duplicate terminal ACK behavior read back directly"},{"tool":"curl and psql","outcome":"SUCCEEDED","detail":"H4a/H4b/H6/H9 HTTP and PostgreSQL behavior evidence captured directly"},{"tool":"CUA browser","outcome":"SUCCEEDED","detail":"H3b and H9 required UI interactions and row details were completed"},{"tool":"manifest and terminal validator","outcome":"SUCCEEDED","detail":"Final evidence coverage and terminal payload validation completed"},{"tool":"cleanup verification","outcome":"SUCCEEDED","detail":"H6 probe deleted; ports, temporary processes and RSA path verified clear"}],"browser_status":"NOT_APPLICABLE"}
