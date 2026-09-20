# R4a-S 十一类泄漏源覆盖表（映射 → 代表探针 → 证据）

> 方向依据：R4a-S 完成条件「对 11 类来源使用唯一标记或等强度确定性输入；公共响应为安全分类，
> 授权诊断保留可定位事实」。同一净化器覆盖的来源按授权可用**代表项 + 路径清单**组合。
> 本表先固定映射与探针设计；探针在**最终快照 manifest 下重跑**（R7-F 约束），脚本
> `p61-r4a-s-battery.mjs` 输出写入 `r4a-s-probe-results.json`。

## 1. 来源 → 公共层出口/净化器 → 代表探针映射

| # | 泄漏源 | 公共层唯一出口 / 净化器 | 唯一标记 / 确定性输入 | 代表探针（真实 HTTP） | 授权诊断保留通道 | 既有独立证据 | 空白 |
|---|---|---|---|---|---|---|---|
| 1 | Jackson 原文 | `GlobalExceptionHandler.handleMessageNotReadable`（400，`common.request_body_unreadable`） | 畸形 JSON 体内嵌 `P61INJ_JACKSON` | POST `/api/form/def` 非法 JSON | `log.warn` cause 原文 | 阶段 B：`P61DiagnosticBoundaryTest` 8/8 | 无 |
| 2 | Java 字段名/参数名 | `handleTypeMismatch` / `handleValidation`（400，业务化文案） | @Valid 违例字段 + 值内嵌 `P61INJ_FIELDNAME` | POST `/api/form/def` 缺字段/超限 | `log.warn` fieldErrors 明细 | 阶段 B：同上 | 无 |
| 3 | SQL/JDBC 原文 | 表单数据服务列白名单 + `ColumnValidation`；异常兜底 `handleException`（500→系统错误） | 过滤值 1000 字符含 `P61INJ_SQL`（超 H2 VARCHAR 上限触发 JDBC 拒绝） | POST `/api/form/data/{formKey}/query` 超长 filter value | 结构化日志（含 eventRef） | 阶段 C：物理表/列名、JDBC 原文零命中扫描 | 无 |
| 4 | POI 原文 | `FormImportExportController` 1499 受控拒绝 + 导入逐行 message | 构造 xlsx，单元格内容含 `P61INJ_POI` 且行结构非法 | POST `/api/form/{formKey}/import`（multipart） | 导入日志 | 阶段 C：POI 原文零命中 | 无 |
| 5 | 栈帧 | `handleException`（500，`common.system_error`）+ `DiagnosticText.sanitize`（持久化文本去栈帧） | 触发未预期异常路径（开放 API 状态查询畸形 recordId） | GET 开放 API 状态接口畸形输入 | 日志保留完整栈 | 阶段 B/D：响应体零栈帧 | 无 |
| 6 | Provider 原文/配置 | `SsoRejectionException` 类型化拒绝（`SystemErrorKeys`） | 未配置/非法 provider 标识内嵌 `P61INJ_PROVIDER` | GET `/api/sso/authorize`（未认证身份） | SSO 日志 | 阶段 B：`SsoAuthServiceTest` 22/22；不披露 Provider 配置 | 无 |
| 7 | tenantId | `TenantValidityService`（异常文案去 tenantId）；BPMN 文案治理 | 非法/跨租户租户标识 `P61INJ_TENANT` | SSO 登录带非法租户参数 | 日志 | 阶段 B/C：tenantId 零命中 | 无 |
| 8 | 文件路径（绝对路径） | `DiagnosticText.sanitize`（绝对路径 → `<path>`）；附件 404 受控码 | 不存在的附件 id；脚本错误文本内嵌绝对路径样式 `C:\P61INJ_PATH\...` | GET 附件下载不存在 id；IoT 脚本错误回读 | 日志原文 | 阶段 D：`DiagnosticText` 6 形态测试 | 无 |
| 9 | 脚本编译/引擎原文 | `ScriptEngineService.sanitizeDiagnostic`（剥路径→截断→`iot_script_exec.error`） | 发布含 `P61INJ_SCRIPT` 的语法错误脚本 | POST IoT 脚本发布校验 | `iot_script_exec.error`（已脱敏）+ 日志原文 | 阶段 D：脚本诊断脱敏 | 无 |
| 10 | MQTT 原文 | `MqttBrokerManager` 连接测试分类结论（原文回显路径已移除） | broker URL 内嵌 `P61INJ_MQTT` 的连接测试 | POST IoT 连接测试 | 日志原文 | 阶段 D：MQTT 测试结论安全化 | 无 |
| 11 | 第三方 HTTP 原文 | `AgentFailureSummarizer`（类型化摘要）+ 通知失败 `NotifyBatchItemFailure`（category+errorKey） | Agent 模型指向不可达端点（含 `P61INJ_3RD` 主机名）触发传输类失败 | Agent 模型对话一次（受控失败） | Agent 日志 | 阶段 D：Agent 摘要类型化 | 无 |

## 2. 快照有效性声明（引用既有证据的边界）

- 阶段 A–D 的注入/扫描证据（`P61DiagnosticBoundaryTest`、阶段 C 零命中扫描、`DiagnosticText`
  6 形态测试、`SsoAuthServiceTest`）产自**早于本轮**的服务快照。本轮改动涉及
  `R.failResolved`（异常→响应路径）、`BpmBatchServiceImpl`（逐项 message 解析）、
  `LocalizedMessages`（text/textArgs 守卫）。这些改动**不触碰**各净化器本体，但公共响应路径
  的最终有效性必须以**最终快照下的探针重跑**为准（`p61-r4a-s-battery.mjs`）。
- 探针 4（POI）需构造合法 xlsx 容器；探针 9/10/11 需要 IoT/Agent 最小对象，若依赖此前内存库
  对象则按 R8c-D 同一口径「登记旧 ID 后创建等价新对象」。

## 3. 状态

- 映射与探针设计：**已固定**（本文件）。
- 预检结果（R10 第二轮，重启后真实 HTTP）：`pass=10 fail=0`（探针 5/8/9 首轮因脚本 language 枚举实为 JS/JAVA 而**空转**，
  已修正为真实创建脚本+dry-run+回读 error 的强断言后复跑仍全绿）；
  机器可读结果 `.tmp/r4a-s-probe-results.json`。最终快照下按 R7-F 口径重跑。
- 历史记录（首轮探针执行后运行并回填 `r4a-s-probe-results.json`；
  每行结论以「公共响应不含标记 + 授权诊断含可定位事实」双向断言收口。
