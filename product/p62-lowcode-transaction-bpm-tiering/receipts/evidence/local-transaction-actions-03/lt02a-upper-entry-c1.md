# LT02a 补证：两个上层可达写入口的 C1 约束（真实 HTTP + 真实消费链）

日期：2026-09-30；角色：执行（Executor）。用途：闭合审查02 LT02a「草稿提交/OpenAPI 两个可达入口只有源码委托链与底层闸门，缺上层请求实际到达并拒绝的证据」。
实现：`sw-bootstrap/src/test/java/com/sw/ck/bootstrap/p62/P62UpperEntryC1PgTest.java`（新增 4 用例）；原始输出见 `lt02a-lt04a-lt05a-raw-output.txt`；门禁身份见 `lt01a-gate-report.md`（树 `6e73a11`，段 B 158/0/0/0）。

## 1. 方法与身份

| 项 | 值 |
|---|---|
| 运行层级 | **真实 HTTP**（内嵌 Tomcat，`server.port=0`，本轮端口 `64149`，`/api` context-path）+ 真实 PostgreSQL（zonky 17.5.0 内嵌）+ 真实 Spring 上下文（`ProdBootTestApplication`） |
| 身份 | 租户 0 / 用户 `1`（基线种子管理员，`superadmin`）；草稿入口 JWT 由 `JwtTokenProvider` 签发；OpenAPI 入口为应用身份 `p62-upper-entry-app`（绑定 `act_as_user_id=1`），请求头签名在测试侧独立实现 `HMAC-SHA256(secret, appId+timestamp+nonce+sha256(body))`，未使用服务端签名工具 |
| 表单对象 | 受保护 `p62_upper_c1`（C1 启用，受保护字段 `qty_available/qty_reserved`，真实 `C1PolicyService.save` 生效）；对照 `p62_upper_plain`（同字段集，未启用 C1） |
| 流程绑定 | `sw_bpm_form_binding` 两行（`form_key`→`process_def_key=p62_upper_flow`，active=true），提交时由产品自行解析 |
| 消费驱动 | 自动轮询车道以 1 小时间隔配置静默（`sw.bpm.command.poll-interval-millis`），由测试直驱 `CommandDispatcher#pollNormal()`——生产调度器调用的同一方法；不复制消费逻辑、不 mock 写入与 C1 服务 |
| 未 mock 的边界 | `submitForm`/C1 闸门/C1 策略/命令队列/草稿状态机全部为真实实现；仅"触发时机"由测试决定 |

## 2. 入口 5：BPM 草稿提交 `POST /api/workflow/drafts/{id}/submit`

| 步骤 | 受保护表单（负向） | 未保护表单（对照） |
|---|---|---|
| 建草稿（真实 HTTP `POST /api/workflow/drafts`） | 200/R `code=0`，draft `2105238059301269505` | 200/R，draft `2105238060182073346` |
| 提交（真实 HTTP） | `code=0` 受理，command `2105238059506790401`（`DRAFT_SUBMIT:…:1`，NORMAL） | 受理，command `…0339467009` |
| 消费者（`pollNormal`） | 到达 `FormSubmitService.submitForm` → C1 闸门抛 `BaseException`（栈帧：`C1PolicyService.assertDirectWriteAllowed:194` ← `assertBulkWriteAllowed:219` ← `FormSubmitService.submitForm:368`） | 落库成功；同事务受理 `FLOW_START` |
| 终态 | 命令 `FAILED`（`failure_reason=字段 qty_available 为 C1 受保护数据，只能通过受控事务动作写入`）；草稿 `FAILED` + `last_error` 同因（WARN「草稿提交终态失败」） | 草稿 `SUBMITTED` + `result_record_id=5e70e977-b032-4710-8a20-caee93f5f468`；日志「草稿已提交」 |
| 副作用 | 动态宽表行 **0 增量**；`FLOW_START` 子命令 **0 增量**；流程实例 **0 增量**（`act_hi_procinst`） | 行 +1；`FLOW_START` 子命令 +1 |
| 拒绝记录 | 按既有契约保留：命令队列表终态 + 失败原因 + 草稿 `last_error`（可修正重提，内容保留） | — |

原始证据行：`[P62-EV] lt02a.draft protected entry=accepted command=… status=FAILED reason=C1 draft=…/FAILED rows=0 flowStart=0 instances=0`、`lt02a.draft-plain entry=written row=… draft=SUBMITTED rowsDelta=1 flowStartDelta=1`。

## 3. 入口 6：OpenAPI 发起 `POST /api/openapi/v1/processes`

| 步骤 | 受保护表单（负向） | 未保护表单（对照） |
|---|---|---|
| 签名请求 | 鉴权通过（时间窗/nonce/scope 全真实），到达 `OpenApiProcessService.start` → Facade → `submitForm` | 同链路 |
| 结果 | HTTP 200 + R 信封 `code=1612`、`errorKey=form.c1_write_protected`、`eventRef` 非空、`msg` 含"C1 受保护"（同步返回，P61 契约） | `code=0`，`data.recordId=13cb1b88-e92e-4a81-a5fe-375bb487d00d`，`idempotentReplay=false` |
| 副作用 | 动态宽表行 0 增量；`sw_openapi_idempotency` 0 增量（拒绝不登记）；`FLOW_START` 0；流程实例 0 | 行 +1；幂等登记 +1 |
| 重放（同 businessKey/idempotencyKey，新 nonce） | — | `recordId` 相同、`idempotentReplay=true`、行数不再增（幂等 +1 不含重放） |

原始证据行：`lt02a.openapi protected code=1612 errorKey=form.c1_write_protected rows=0 idem=0 flowStart=0 instances=0`、`lt02a.openapi-plain entry=written record=… replay=same-recordId rowsDelta=1 idemDelta=1`。

## 4. 结论与边界

- 两入口**合法身份可达**（受理/签名鉴权成功、模型解析到绑定）**且受 C1 约束**：写入前置闸门在上层请求到达后按 `form.c1_write_protected` 拒绝，且拒绝在真实消费链内发生（含异常栈）；对照用例证明同入口同身份在未保护表单上真实写入——排除"整链不可用导致一律拒绝"的替代解释。
- 非预期副作用为零：动态行、流程发起命令、流程实例、幂等登记均无增量；拒绝记录按各入口既有契约保留（命令队列终态/草稿 `last_error`；R 信封 `errorKey`+`eventRef`）。
- 边界一：未保护对照用例的 `FLOW_START` 子命令在隔离上下文中因"流程定义未发布或不可用"失败（无 Flowable 定义部署），这是本隔离环境的已知边界，不影响本项断言——表单行已先提交、C1 断言发生在写入之前；回执口径不把该子命令结果当流程验收。
- 边界二：其余入口（导入/批量/脚本/Agent/流程节点/外部数据源）维持回执02清单的结论与依据，本项只补审查指名的两个可达入口，不重跑其余。
- 边界三：隔离对象（表单/绑定/app 行）随内嵌 PG 销毁；日志中保留其当轮标识（上表），不宣称与 dev 库对象同 ID。
