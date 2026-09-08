# P21 IoT 设备接入 — 二级补充提示修正轮回执（自验通过，待规划复验）

> 会话角色：执行（Executor）
> 唯一执行入口：`planning-execution-prompt-p21-iot-02.md`（H1—H10 原子矩阵）
> 前序：`completion-p21-iot-03.md`（追溯）。功能状态维持 `VERIFYING`
> 环境：dev profile + 真实 PG（smart_workflow）+ Owner Broker（凭证仅环境变量注入）
> 最后代码快照：本轮全部门禁与证据采集后无再变更（指纹见终态 progress_fingerprint）
> 日期：2026-09-08

## 一、当前结论

H1—H10 逐原子完成，全部满足正向与反向断言；锁定项 L1—L13 未重验（本轮代码变更触及时按门禁重跑：后端全量、前端四门禁已重跑并通过）。

## 二、逐原子四要素（原子 → 附件 → 实际结果 → 边界）

### H1 Topic 越权拒绝
- 附件：`evidence/h1-topic.stdout.log`（含 `mqtt sub --help` 原文证明无消息数参数，采用后台受控订阅+受控终止）
- 结果：合法主题订阅收到 `{"h1":"nonce-a77b3c"}`（JS/JAVA 两条，见 L10 联动）；越界主题拒绝原文 `主题未配置或未启用: owner/p21/down/evil`；evil 订阅 **0 条**
- 边界：服务端 Topic 白名单拒绝（Broker 无 ACL）

### H2 ACTION_RESULT 完整序列
- 附件：`evidence/h2-action-result.jsonl`（before/ack-input×2/after/others 六行原始）
- 对象：nonce 命令 `2097176766916956161`（capabilityId=owner/p21/down/cmd）
- 结果：`BROKER_ACK →（ACK h2=ack-1）→ SUCCESS`；重复 ACK 后 `resultJson={"h2":"ack-2-duplicate"}`（覆盖结果字段，状态不重复翻转副作用）；其他 37 条命令状态零变化
- 边界：重复 ACK 覆盖 result 字段属设备重报语义，命令状态机未回退

### H3 三来源 UI + 三策略
- 附件：`evidence/screenshots/h2a-*.png`（UI 弹窗/保存回读）、`evidence/h3-sources.jsonl`（三来源命令）、`evidence/h3-strategies.jsonl`（三策略 trigger）
- 对象：模板 `bpm_27eb397eab224743`、设备 dev-owner-01
- 结果：sourceRef 携带来源标识——`h3_fixed`/`:FIXED`、`h3_formfield`/`:FORM_FIELD`、`h3_variable`/`:VARIABLE`，三命令均 `BROKER_ACK`，每实例一条；策略实测——**BLOCK**→trigger FAILED（设计时固定设备不存在），**CONTINUE**→trigger SUCCESS（真实流程实例 7499147c…，记录后继续），**MANUAL**→trigger 保持 **PENDING**（人工处理）；UI 弹窗三来源切换 DOM 证明（h9-flow-action-formfield.png）
- 边界：失败注入经「指向不存在 deviceId」的运行时校验拒绝路径；策略判定统一收敛于 `handleFailure`（本轮修复点）

### H4 REFERENCE/BOOL/DATE 契约与流程表单详情
- 附件：`evidence/h4-instance-detail.json`（实例详情原始响应）+ `g3-round3.md` §H4
- 对象：表单 `iot_alert_form`（v3：含 ref_record REFERENCE / escalate BOOL / occur_day DATE）
- 结果：反例三连 `400`——REFERENCE 非数字「REF-ABC」、BOOL「yes」、DATE「2026/09/08」；正例（42/true/2026-09-08）PUBLISHED；MQTT 上报 82.3 → trigger SUCCESS → 实例 f52c9360…，`formData={deviceKey, occur_day:2026-09-08, escalate:true, ref_record:42}` 原文在附件
- 边界：REFERENCE 校验为「数字对象标识」契约（引用目标存在性按现有表单能力边界）

### H5 双语言完整对象关联
- 附件：`evidence/h5-scripts.jsonl`（4 行 API/SQL 直接导出，无省略号）
- 结果：JS v2 executionId=2097177231314489345 → commandId=2097177231205437400；Java v3 executionId=2097177231129939969 → actionCommandId=2097177230974750721 + publishCommandId=2097177231016693761；JS `fun_emitEvent` → eventId=2097177231301906433；Java `fun_invokeAction` → 命令 `INVOKE_ACTION:reset PENDING sourceRef=script:…:v3`
- 边界：INVOKE_ACTION 命令保持 PENDING（设备未回报），如实呈现不伪装成功

### H6 四态同 body 矩阵
- 附件：`evidence/h6-auth.http`（四次请求/响应原文 + SQL 前后计数）
- 结果：admin → 200（`{code:0}` 业务允许）；iotuser 同 body → **403**；无认证 → **401**；畸形 JSON → **400 受控**；前后计数：nonce 连接全库仅 1 条（admin 创建），受限/未认证/畸形零新增
- 边界：畸形请求 400 文本含 REDACTED 源标记（框架安全脱敏）

### H7 双租户四象限（真实 PG + TenantContext）
- 附件：`evidence/h7-tenant-test.log`（集成运行原始输出）、`h7-tenant.sql.log`（清理回读）
- 对象：t0 `h7-tenant0-conn`、t88 `h7-tenant88-conn`（真实 PG smart_workflow + TenantLineInnerInterceptor + LoginUserHolder 上下文切换）
- 结果：四象限断言全部通过——t0→t0 写读成功、t88→t88 写读成功、t0→t88 读 null/写 0 行、t88→t0 读 null/写 0 行；各自列表仅见自身；清理后业务查询 0 行（逻辑删除）
- 边界：集成运行形态（提示 01/02 允许），未扩展非零租户登录

### H8 审计矩阵与重试
- 附件：`evidence/h8-audit.csv`（128 行，列：action,object_id,result,actor,action_time,correlation）+ `evidence/h8-retry.json`（重试原/新命令完整关联）
- 结果：六类动作（连接测试、脚本发布、规则发布、命令下发/重试、流程触发、凭证落库）每行含操作者/动作/对象/结果/时间/关联 ID；秘密扫描：附件与 CSV 中明文口令 **0 命中**
- 边界：复用 IoT 域记录组合导出（提示允许），未建通用审计模块

### H9 页面关键交互与网络索引
- 附件：`evidence/h9-browser.md`（7 项交互矩阵）+ `screenshots/h9-*.png`
- 结果：命令重试（toast 新命令 id）、连接测试（真实分类 toast）、设备开关往返（SQL 终态=1）、流程动作弹窗三来源切换（DOM 证明）与保存回读、脚本试运行/发布、规则发布/触发三态、运行记录四 tab——操作结果与网络响应一致
- 边界：设计器画布节点配置仍为模板动作面板形态（L8 锁定基础 UI）

### H10 工程门禁、manifest、Validator
- 附件：`evidence/h10-gates.log`（前端四门禁原始 exit：typecheck=0、lint exit=0（**如实记录 7 warnings, 0 errors**）、test 124 files/1168 tests、build=0）、`h10-backend.txt` + `h10-backend-raw.log`（后端全仓 BUILD SUCCESS，代码变更后按门禁重跑）、`h10-manifest.sha256`（21 附件）+ `h10-manifest-verify.txt`（**21/21 OK**）、`h10-cleanup.log`（秘密临时文件全部已删除/不存在）、`h10-validator.log`（Validator 输入为回执末行 ENGINE_TERMINAL JSON、命令 `bash .codex/governance/validate-terminal.sh`、**exit=0 无诊断输出**）
- 边界：lint warnings 为 prettier 格式类（0 errors，门禁 exit=0），如实记录未虚报

## 四、本轮代码变更（H 允许范围内）

- H3：`IotDeviceFacade.dispatchByDeviceKey` 增 sourceTag 重载；listener 来源标识写入 sourceRef、三策略统一收敛 `handleFailure`（含 MANUAL 保持 PENDING）
- H4：REFERENCE 数字标识契约
- H6：`GlobalExceptionHandler` 补 HttpMessageNotReadable/TypeMismatch/IllegalArgument → 受控 400
- G3b（上轮遗留闭环）：`getProcessVariables` + 实例详情 formData
- 前端：`IotFlowActions.vue` 类型 cast 修复、运行记录页命令重试按钮、api 扩展
- 测试：`H7TenantIsolationIntegrationTest`（真实 PG 四象限）

## 五、自验结论

提交前核对矩阵 H1—H10 全部为「是」；所有附件由工具直接输出、无截断/省略号/手抄哈希；秘密临时文件清理已回读；终态账本与证据一致。自验通过，提交规划复验，功能状态维持 `VERIFYING`。

ENGINE_TERMINAL {"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"XL","receipt":"product/p21-iot-device-access/receipts/completion-p21-iot-04.md","evidence":["product/p21-iot-device-access/receipts/evidence/h1-topic.stdout.log","product/p21-iot-device-access/receipts/evidence/h2-action-result.jsonl","product/p21-iot-device-access/receipts/evidence/h3-sources.jsonl","product/p21-iot-device-access/receipts/evidence/h3-strategies.jsonl","product/p21-iot-device-access/receipts/evidence/h4-instance-detail.json","product/p21-iot-device-access/receipts/evidence/h5-scripts.jsonl","product/p21-iot-device-access/receipts/evidence/h6-auth.http","product/p21-iot-device-access/receipts/evidence/h7-tenant-test.log","product/p21-iot-device-access/receipts/evidence/h7-tenant.sql.log","product/p21-iot-device-access/receipts/evidence/h8-audit.csv","product/p21-iot-device-access/receipts/evidence/h8-retry.json","product/p21-iot-device-access/receipts/evidence/h9-browser.md","product/p21-iot-device-access/receipts/evidence/h10-gates.log","product/p21-iot-device-access/receipts/evidence/h10-backend.txt","product/p21-iot-device-access/receipts/evidence/h10-backend-raw.log","product/p21-iot-device-access/receipts/evidence/h10-manifest.sha256","product/p21-iot-device-access/receipts/evidence/h10-manifest-verify.txt","product/p21-iot-device-access/receipts/evidence/h10-cleanup.log","product/p21-iot-device-access/receipts/evidence/h10-validator.log","product/p21-iot-device-access/receipts/evidence/screenshots/g2a-flow-actions.png","product/p21-iot-device-access/receipts/evidence/screenshots/g2a-configured.png","product/p21-iot-device-access/receipts/evidence/screenshots/h9-commands-before.png","product/p21-iot-device-access/receipts/evidence/screenshots/h9-retry-after.png","product/p21-iot-device-access/receipts/evidence/screenshots/h9-connection-test.png","product/p21-iot-device-access/receipts/evidence/screenshots/h9-device-switch-off.png","product/p21-iot-device-access/receipts/evidence/screenshots/h9-device-switch-on.png","product/p21-iot-device-access/receipts/evidence/screenshots/h9-flow-action-formfield.png"],"feature_status":"VERIFYING","work_items":[{"id":"H1-topic-reject","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已完成：合法 nonce 订阅收到+越界拒绝原文+三计数前后（h1-topic.stdout.log）"},{"id":"H2-action-result-sequence","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已完成：ACK 前后/重复 ACK/其他命令零变化 jsonl"},{"id":"H3-ui-three-sources","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已完成：UI 弹窗三来源+合格设备+保存回读截图 DOM"},{"id":"H3b-sources-strategies","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已完成：三来源 sourceRef 可辨识命令+BLOCK/CONTINUE/MANUAL 三策略 trigger 实测"},{"id":"H4-reference-bool-date","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已完成：REFERENCE/BOOL/DATE 三反例 400+正例 PUBLISHED"},{"id":"H4b-form-detail-raw","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已完成：实例详情 formData 原始响应 h4-instance-detail.json"},{"id":"H5-full-correlation","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已完成：h5-scripts.jsonl 完整 ID 关联无截断"},{"id":"H6-auth-four-state","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已完成：同 body 200/403/401/400 原始流+零新增计数"},{"id":"H7-tenant-four-quadrant","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已完成：真实 PG TenantContext 四象限集成测试全过+SQL 回读"},{"id":"H8-audit-matrix","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已完成：h8-audit.csv 128 行六类动作+retry 完整 JSON+秘密零命中"},{"id":"H9-browser-interactions","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已完成：7 项交互矩阵+前后截图+网络响应索引 h9-browser.md"},{"id":"H10-gates-manifest-validator","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已完成：manifest 21 项 21 OK+门禁 exit 全 0（lint 7 warnings 如实记录）+Validator exit=0+清理回读"}],"remaining_actionable_count":0,"independent_work_exhausted":true,"next_action":"等待 Planner 第四轮复验；通过后下发唯一终态值清单","next_action_type":"WAIT_PLANNER","progress_fingerprint":"p21-verifying-round4-20260908-h1-h10-closed","progress_basis":{"files_changed":["sw-framework/sw-common/src/main/java/com/sw/ck/common/exception/GlobalExceptionHandler.java","sw-biz/sw-bpm/sw-bpm-api/src/main/java/com/sw/ck/bpm/api/facade/BpmRuntimeFacade.java","sw-biz/sw-bpm/sw-bpm-engine/src/main/java/com/sw/ck/bpm/engine/facade/BpmRuntimeFacadeImpl.java","sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/listener/IotProcessTriggerListener.java","sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/IotFormContractCheckerImpl.java","sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/api/IotDeviceFacade.java","sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/api/impl/IotDeviceFacadeImpl.java","sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/api/impl/IotDeviceMqttDispatchService.java","sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/script/GraalJsRunner.java","sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/service/IotScriptService.java","sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/service/MessageIngestService.java","sw-bootstrap/src/test/java/com/sw/ck/bootstrap/p21/H7TenantIsolationIntegrationTest.java","Smart-WorkFlow-Web/src/modules/iot/views/IotFlowActions.vue","Smart-WorkFlow-Web/src/modules/iot/views/IotRuntimeLogs.vue"],"tool_actions":["mqtt sub/pub（--help 确认参数后受控订阅）","curl HTTP（H2/H3/H4/H6 全部原始请求响应）","mvn test（最后快照全仓 BUILD SUCCESS）","pnpm typecheck/lint/test/build（四门禁）","H7 集成测试（真实 PG 四象限）","psql 导出（G2b/G5c/H5/H8）","browser-use（H9 关键交互）","validate-terminal.sh（exit=0）"],"new_evidence":["h1-topic.stdout.log","h2-action-result.jsonl","h3-sources.jsonl","h3-strategies.jsonl","h4-instance-detail.json","h5-scripts.jsonl","h6-auth.http","h7-tenant-test.log","h7-tenant.sql.log","h8-audit.csv","h8-retry.json","h9-browser.md","h10-manifest.sha256 + verify 21/21","h10-cleanup.log","h10-validator.log"],"closed_work_items":["H1","H2","H3","H4","H5","H6","H7","H8","H9","H10"]},"stop_reason":"WAITING_FOR_PLANNER","tool_results":[{"tool":"mqtt CLI","outcome":"SUCCEEDED","detail":"H1 合法订阅收到 nonce（JS/JAVA 两条）、越界主题零收到；--help 归档证明 -C 参数不存在"},{"tool":"curl HTTP","outcome":"SUCCEEDED","detail":"H2 ACK 序列、H3 三来源命令+三策略 trigger、H4 三反例 400+正例、H6 四态 200/403/401/400"},{"tool":"mvn test","outcome":"SUCCEEDED","detail":"最后快照全仓 BUILD SUCCESS（含 H7 四象限集成测试 0/0/0）"},{"tool":"browser-use","outcome":"SUCCEEDED","detail":"H9 七项关键交互前后截图与 DOM"},{"tool":"psql","outcome":"SUCCEEDED","detail":"H2 其他命令零变化、G2b/G5c/H5/H8 导出、H7 清理回读"},{"tool":"validate-terminal.sh","outcome":"SUCCEEDED","detail":"exit=0 无诊断（h10-validator.log 归档）"},{"tool":"pnpm gates","outcome":"SUCCEEDED","detail":"typecheck=0/lint exit=0（7 warnings 如实记录）/test 1168/build=0"}],"browser_status":"OPERABLE"}
