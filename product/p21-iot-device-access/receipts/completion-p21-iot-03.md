# P21 IoT 设备接入 — 一级补充提示修正轮回执（自验通过，待规划复验）

> 会话角色：执行（Executor）
> 唯一执行入口：`planning-execution-prompt-p21-iot-01.md`（G1a—G6c 原子账本）
> 前序：`completion-p21-iot-02.md`（追溯）；功能状态维持 `VERIFYING`
> 环境：dev profile + 真实 PG（smart_workflow）持久库 + Owner Broker（8.166.112.85:1883，凭证仅环境变量注入）
> 日期：2026-09-08

## 一、当前结论

补充提示账本 G1a—G6c 全部关闭；产品缺陷（G2a UI、G3a 类型契约、G5a 500、G6a 状态错位）均已修复并以正反侧行为证据验证。本轮回执无状态冲突：Owner Broker 认证成功（第一轮口令有误，Owner 核实后修复），A2/A5 于 Owner Broker 完成，公共 Broker 仅作历史替代记录。

## 二、逐原子四要素

### G1a Topic 越权拒绝
- 证据：`evidence/g3-round3.md` §G1a
- 对象：脚本 `g1a-topic-probe`（2097159978191728642）、主题 `owner/p21/down/cmd`（合法）/`owner/p21/down/evil`（越界）
- 结果：合法 → `{legal:{commandId:2097160517751189500,brokerAck:true}}`；越界 → `evilRejected:"主题未配置或未启用: owner/p21/down/evil"`；CLI 订阅 evil 收到 **0 条**；命令/trigger 计数不增
- 边界：以服务端 Topic 白名单真实拒绝（Broker 无 ACL）

### G1b 事件/行为结果映射
- 证据：`evidence/g3-round3.md` §G1b；修复记录见 §四.1
- 对象：设备 `dev-owner-01`、事件 `overheat`（物模型 v2）、命令 999999（不存在）
- 结果：`overheat` PARSED → `sw_iot_event_record` 可回查；未声明事件 → FAILED「事件未在已发布物模型中声明」；未知 commandId → FAILED「命令不存在」；已有命令经 ACTION_RESULT → `BROKER_ACK→SUCCESS`
- 边界：事件校验为本轮新增（修复前 hacker_event 曾入库，附件如实记录）

### G2a 流程设备动作配置 UI
- 证据：`evidence/screenshots/g2a-flow-actions.png`、`g2a-configured.png` + DOM 快照
- 对象：流程模板 `bpm_27eb397eab224743`、菜单 id=337（V65）
- 结果：新增「流程设备动作」页（`iot/views/IotFlowActions.vue`）：列出已发布模板；弹窗可配启用/设备来源（设计时固定/发起表单字段/流程变量）/目标设备（仅合格设备下拉）/能力标识/参数字段/失败策略；**保存回读显示「设计时固定 Owner温感 (dev-owner-01) reboot / BLOCK」**
- 边界：流程模板动作面板形态（补充提示允许），非设计器画布节点

### G2b 三来源关联表
- 证据：`evidence/g3-round3.md` §G2b（psql JOIN 导出：command↔trigger↔instance 同 flowInstanceId）
- 对象：命令 2097162534066409475/…9474/…1138/…1139 等，trigger 幂等键 `r<ruleId>-v1-<deviceId>-<dedup>`
- 结果：每 flowInstanceId 恰一条 FLOW 命令（group by having>1 为空）；BLOCK/CONTINUE 策略行为见 G2a/G4a 记录；重放（同 payload）不增命令（去重已锁定）
- 边界：MANUAL 策略未单独触发实例（策略实现为代码路径，CONTINUE/BLOCK 已实测）

### G3a 类型/枚举/引用契约
- 证据：本轮实调输出（附录 §G3a 于回执正文）
- 对象：表单 `iot_alert_form`（字段 temperature NUMBER / level DICT options=[high,low]）
- 结果：发布（NUMBER 固定值 "abc"）→ `400 字段 'temperature' 为 NUMBER，固定值非数值`；发布（DICT 固定值 "ultra"）→ `400 字段 'level' 枚举不含值: ultra`；合法映射（含 level=high）→ `0 PUBLISHED`
- 边界：按表单字段体系实际支持类型逐项覆盖（NUMBER/BOOL/DATE/DICT/REFERENCE）；触发时事件再校验沿用同一 checker 数据源

### G3b 流程侧表单详情
- 证据：本轮实调输出（`GET /workflow/instances/e8b406e6-ab33-11f1-9182-66ff24301f3c`）
- 对象：实例 e8b406e6…（businessKey=iot-2097162533537927170）
- 结果：新增 `BpmRuntimeFacade.getProcessVariables` → 实例详情 `formData={temperature:"55.5", deviceKey:"dev-owner-01"}`，与 MQTT 上报 55.5 及 trigger 快照一致
- 边界：formData 来自流程变量（发起映射快照）

### G4a 双语言可区分输出与宿主函数覆盖
- 证据：`evidence/g3-round3.md` §G4a（CLI 原始下行 + 执行记录 + 事件/命令记录）
- 对象：`owner-js-forward` v2（GraalJS）、`owner-java-forward` v3（子进程）
- 结果：同一消息 `{"g4a":"final-004"}` → CLI 收到 `JS:{"g4a":"final-004"}` 与 `JAVA:{"g4a":"final-004"}` 两条；执行记录输出分别携带 `scriptCode=owner-js-forward/owner-java-forward`，均 SUCCESS；合计覆盖 `fun_publish`（双方）+ `fun_emitEvent`（JS，事件记录 from=js-script）+ `fun_invokeAction`（Java，INVOKE_ACTION reset 命令）
- 边界：过程中发现并修复两个真实缺陷（§四.3/§四.4）

### G4b 异常脚本隔离
- 证据：`evidence/g3-round3.md` §G4b
- 对象：chaos 脚本（while(true)，timeout=800ms）绑定 `owner/p21/up/chaos`
- 结果：chaos → 执行记录 `TIMEOUT 73ms 脚本被终止`；8080 LISTEN 前后 1→1（主进程存活）；紧接正常消息 `after-chaos=normal-001` → `RECEIVED`，正常脚本 `owner-js-forward` 仍 SUCCESS
- 边界：GraalJS 语句数限额先于超时触发终止（500000 条）

### G5a 写请求四态矩阵
- 证据：`evidence/g3-round3.md` §G5a
- 对象：同一合法连接 body（code=g5a-probe），身份 admin/iotuser(test_3)/无认证
- 结果：admin → **200**（业务允许）；test_3 → **403**（服务端鉴权拒绝，零新增）；无认证 → **401**；畸形 JSON → **400**（受控，非 500——修复 `HttpMessageNotReadable/TypeMismatch/IllegalArgumentException` 三个处理器）
- 边界：受限用户导航无菜单入口（V61 权限串设计）+ API 403，符合替代口径

### G5b 多租户隔离（真实 PG）
- 证据：`evidence/g3-round3.md` §G5b
- 对象：tenant0（owner-mosquitto 等 2 条）vs tenant88 同形连接 id=88001（SQL 直插真实库）
- 结果：t0 列表插前/插后均 2 条（**读隔离**）；t0 `PUT /iot/connections/88001` → **400**（TenantLine 拦截器命中租户边界，受控错误非 500）；SQL 回读 88001 name 未被修改（**写隔离**）
- 边界：采用提示允许的 TenantContext/持久库等强度验证，未扩展非零租户登录

### G5c IoT 审计矩阵
- 证据：`evidence/g3-round3.md` §G5c（六类 SQL 导出）
- 结果：①连接测试/健康（health_status+last_check_result+时间）；②凭证轮换（密文非空长度 48，零明文）；③脚本发布（版本/状态/发布时间，7 条版本留痕）；④规则发布（code/status/rule_version）；⑤命令重试（新增 RETRY 端点实测：`retry:2097160779228295169` 关联原命令，PENDING）；⑥流程发起（trigger 幂等键+process_instance_id）
- 边界：复用 IoT 域记录（提示允许），未建通用审计模块；操作者=记录 create_by

### G6a 状态一致性
- 证据：`evidence/screenshots/g6a-connection-healthy.png`、`g6a-device-online.png` + API 回读（`g3-round3.md` §G6a）
- 对象：owner-mosquitto、dev-owner-01
- 结果：修复后 connect 成功 → 连接 HEALTHY（`CONNECT: 常驻连接已建立`）；上报后设备 **ONLINE** + lastReportTime；页面与 API 一致；修复前反证（UNKNOWN/OFFLINE）以旧截图 `g6-connection.png`/`g6-device.png` 锁定
- 边界：OFFLINE→ONLINE 由真实上报驱动；主动离线事件（Broker 断开回调）依赖设备会话语义，页面刷新语义已在修复后一致

### G6b 页面关键交互与流程入口
- 证据：浏览器实际操作（本轮 + 前轮归档）：连接测试按钮（真实 SUCCESS/AUTH_FAILED 分类输出）、流程设备动作配置保存回读（`g2a-configured.png`）、设备流程接入开关、Topic/规则/脚本发布交互、运行记录四 tab 与重试端点
- 结果：交互结果与 API 响应一致；无假按钮、无错误成功提示、无明文凭证
- 边界：设计器画布节点配置不在本轮（模板动作面板为补充提示允许形态）

### G6c 工程门禁与终态
- 证据：`evidence/g6c-gates.txt`（前端四门禁原始 exit）、`g6c-backend.txt` + `g6c-backend-raw.log`（后端全量）、Validator 原始输出（回执末行）
- 结果：前端 typecheck=0 / lint=0 error / test 124 files+1168 tests / build=0；后端全仓 `mvn test` BUILD SUCCESS（含迁移全链 H2 65 / PG 64 计数与升级链断言）；Validator exit=0
- 边界：lint 7 warnings 已评估为格式类（--fix 后本轮最后快照 0 error 0 warning 门禁通过）

## 三、本轮修复清单（产品缺陷）

1. 未声明事件被入库 → `validateEventDeclared`（G1b）
2. `fun_emitEvent` 命名映射错误（fun_emit_event→fun_emitEvent）（G4a）
3. deviceId JS Long 精度丢失 → 字符串传递 + asLong 字符串兼容（G4a）
4. 畸形请求/业务参数异常落 500 → 受控 400（G5a/G5b）
5. connect 成功不回写 HEALTHY、上报不置 ONLINE（G6a）
6. 流程设备动作 UI 缺失 → 新页面 + V65 菜单（G2a）
7. 命令重试能力缺失 → RETRY 端点（G5c）
8. 流程实例详情缺 formData → getProcessVariables + DTO 字段（G3b）

## 四、自验结论

账本 G1a—G6c 全部满足正向与反向断言并附原始证据；前端四门禁、后端全量门禁、Validator 属最后代码快照；凭证与临时对象已清理（/tmp 凭证文件删除、g5a-probe/tenant88-conn 本轮对象保留于 PG 供复验回读）。自验通过，提交规划复验，功能状态维持 VERIFYING。

ENGINE_TERMINAL {"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"XL","receipt":"product/p21-iot-device-access/receipts/completion-p21-iot-03.md","evidence":["product/p21-iot-device-access/receipts/evidence/g3-round3.md","product/p21-iot-device-access/receipts/evidence/g1-owner-broker.md","product/p21-iot-device-access/receipts/evidence/g5-identity-tenant.md","product/p21-iot-device-access/receipts/evidence/g6c-gates.txt","product/p21-iot-device-access/receipts/evidence/g6c-backend.txt","product/p21-iot-device-access/receipts/evidence/g6c-backend-raw.log","product/p21-iot-device-access/receipts/evidence/screenshots/g2a-flow-actions.png","product/p21-iot-device-access/receipts/evidence/screenshots/g2a-configured.png","product/p21-iot-device-access/receipts/evidence/screenshots/g6a-connection-healthy.png","product/p21-iot-device-access/receipts/evidence/screenshots/g6a-device-online.png"],"feature_status":"VERIFYING","work_items":[{"id":"G1a-topic-reject","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已完成：越界 Topic 服务端拒绝+evil 订阅零收到+合法对照"},{"id":"G1b-event-action-mapping","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已完成：EVENT 正反例+ACTION_RESULT 正反例+事件声明校验修复"},{"id":"G2a-flow-action-ui","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已完成：流程设备动作配置页+保存回读截图 DOM"},{"id":"G2b-three-sources-correlation","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已完成：SQL 关联表导出（command↔trigger↔instance 同 flowInstanceId，每实例一命令）"},{"id":"G3a-typed-contract","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已完成：NUMBER/DICT 拒绝+合法通过"},{"id":"G3b-form-detail","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已完成：getProcessVariables+实例详情 formData 与上报一致"},{"id":"G4a-dual-lang-distinct","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已完成：双语言可区分输出+fun_publish/fun_emitEvent/fun_invokeAction 真实覆盖"},{"id":"G4b-chaos-isolation","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已完成：chaos TIMEOUT+主进程存活+正常消息继续"},{"id":"G5a-write-matrix","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已完成：200/403/401/400 四态+500 修复"},{"id":"G5b-tenant-isolation","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已完成：真实 PG 双租户读写隔离矩阵"},{"id":"G5c-audit-matrix","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已完成：六类审计 SQL 导出+RETRY 端点实测"},{"id":"G6a-status-consistency","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已完成：HEALTHY/ONLINE 修复+前后截图反证"},{"id":"G6b-page-interactions","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已完成：关键交互矩阵+流程配置入口+无假按钮"},{"id":"G6c-gates-validator","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已完成：前端四门禁+后端全量+Validator exit=0（本回执末行）"}],"remaining_actionable_count":0,"independent_work_exhausted":true,"next_action":"等待 Planner 第三轮复验；通过后下发唯一终态值清单","next_action_type":"WAIT_PLANNER","progress_fingerprint":"p21-verifying-round3-20260908-g1a-g6c-closed","progress_basis":{"files_changed":["sw-framework/sw-common/src/main/java/com/sw/ck/common/exception/GlobalExceptionHandler.java","sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/service/MessageIngestService.java","sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/service/IotConnectionService.java","sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/service/IotScriptService.java","sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/script/GraalJsRunner.java","sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/controller/IotRuntimeController.java","sw-biz/sw-bpm/sw-bpm-api/src/main/java/com/sw/ck/bpm/api/facade/BpmRuntimeFacade.java","sw-biz/sw-bpm/sw-bpm-engine/src/main/java/com/sw/ck/bpm/engine/facade/BpmRuntimeFacadeImpl.java","sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/IotFormContractCheckerImpl.java","Smart-WorkFlow-Web/src/modules/iot/views/IotFlowActions.vue","sw-bootstrap/src/main/resources/db/migration/h2/V65__p21_iot_flow_actions_menu.sql"],"tool_actions":["mqtt pub/sub（Owner Broker）","curl HTTP（规则发布正反例/实例详情/四态矩阵/重试）","psql（G2b 关联表/G5c 审计矩阵/G5b 双租户矩阵）","browser-use（G2a UI 配置保存回读/G6a 页面截图）","mvn test/install/spring-boot:run","pnpm typecheck/lint/test/build"],"new_evidence":["evidence/g3-round3.md 全部章节","evidence/screenshots/g2a-*.png、g6a-*.png","evidence/g6c-gates.txt","evidence/g6c-backend.txt + raw.log"],"closed_work_items":["G1a","G1b","G2a","G2b","G3a","G3b","G4a","G4b","G5a","G5b","G5c","G6a","G6b","G6c"]},"stop_reason":"WAITING_FOR_PLANNER","tool_results":[{"tool":"mqtt CLI","outcome":"SUCCEEDED","detail":"G1a 正反对照、G1b 事件/ACK、G4a 可区分双消息、G4b chaos 序列均在 Owner Broker 真实完成"},{"tool":"curl HTTP","outcome":"SUCCEEDED","detail":"G3a 400 拒绝×2+通过、G3b formData 回查、G5a 200/403/401/400、G5c 重试 200"},{"tool":"psql","outcome":"SUCCEEDED","detail":"G2b 关联表、G5c 审计六类、G5b 88001 写隔离回读"},{"tool":"browser-use","outcome":"SUCCEEDED","detail":"G2a 配置保存回读（设计时固定 Owner温感 reboot/BLOCK）、G6a 两页截图"},{"tool":"mvn test","outcome":"SUCCEEDED","detail":"全仓 BUILD SUCCESS（g6c-backend.txt/raw.log）"},{"tool":"pnpm gates","outcome":"SUCCEEDED","detail":"typecheck=0 lint=0error test=1168 build=0（g6c-gates.txt）"},{"tool":"validate-terminal.sh","outcome":"SUCCEEDED","detail":"exit=0 无诊断输出（stdin 方式实际运行）"}],"browser_status":"OPERABLE"}
