# P61 用户可见错误码与提示语人性化治理：现状探索回传

> 对应任务：`search_task/p61-user-facing-message-humanization-current-seams.md`
> 执行角色：Executor（只读探索，未修改任何代码/资源/迁移/远端状态）
> 日期：2026-09-15
> 代码基线：Workspace `develop-sw`；Server main `c15428f…`（0.1.0）；Web main `963df360…`（0.1.0）

## 1. 结论摘要

1. **"登录挑战"确实是用户可见文案，但只有 2 处**，位于 Web 登录页，不在 Server 枚举/日志里。Server 侧 `挑战` 仅出现在 Java 注释、javadoc、类名（`LoginChallengeService`）与日志中，不构成用户文案。
2. **全系统没有 i18n 层**。Server 无 `MessageSource`/`messages.properties`/`LocaleResolver`；Web 的 `src/locales/zh-CN.ts` 只有 1 个键 `app.name`，且**全仓零消费**（`useI18n`/`$t(`/`i18n.global.t` 命中 0）。全部用户可见文本为硬编码字面量。
3. **文案唯一权威在 Server**。`R<T>` 只有 `code`/`msg`/`data` 三个字段，无诊断通道；Web `getErrorMessage(code, backendMessage)` 规则是"后端 msg 非空即胜出"。因此**改 Server 枚举文案会直接改用户所见**，Web 的 `ERROR_CODE_MAP` 只在后端 msg 为空时兜底。
4. 发现 **3 个已核实的机器码契约缺陷**：认证码 2101-2104 与流程码 2101-2104 完全重叠；`BpmErrorCode` 内部 2415 重复；前端 `ERROR_CODE_MAP` 的 1204-1208 兜底文案与后端同码语义**不同**。
5. 主要风险不是"措辞不好看"，而是三类**内部实现细节外泄到响应体**：Java 字段名（校验分支）、原始异常 message（表单 SQL/JDBC/POI、SSO Provider、IoT 脚本引擎）、以及 Job 执行日志的**完整 Java 栈**。
6. 最大体量的同质问题是：**Web 侧非 `ApiError` 失败一律塌缩为同一句通用文案**，导致网络故障/5xx/超时/权限/不存在共用一句"操作失败""加载 XX 失败"。

## 2. 覆盖方法与边界

### 2.1 扫描入口

| 层 | 入口 | 结果 |
|---|---|---|
| Server 统一响应 | `sw-framework/sw-common/src/main/java/com/sw/ck/common/response/R.java` | 3 字段 `code`/`msg`/`data`；`ok()` 写 `msg="success"`；无 detail/traceId |
| Server 异常出口 | `sw-framework/sw-common/src/main/java/com/sw/ck/common/exception/GlobalExceptionHandler.java` | 9 个 handler，见 §3.1 |
| Server 错误码枚举 | 5 个 `implements ErrorCode`，共 **127** 常量 | 见 §3.2 |
| Server 过滤器出口 | `sw-framework/sw-security/.../handler/RestAuthenticationEntryPoint.java`、`RestAccessDeniedHandler.java`、`filter/JwtAuthenticationFilter.java`、`filter/DebugAuthenticationFilter.java` | 401/403/503 直出写 body |
| Web 唯一 HTTP 入口 | `Smart-WorkFlow-aPaaS-Web/src/foundation/request/index.ts` | 5 条归一管线汇入 `getErrorMessage` |
| Web 兜底映射 | `src/foundation/request/error-code-map.ts` | 37 键 + `业务错误(${code})` 兜底 |
| Web i18n | `src/locales/{index.ts,zh-CN.ts}` | **1 键、0 消费** |
| Web EP 本地化 | `src/main.ts` | **无 `ElConfigProvider`**，EP 内建文案为英文 |

### 2.2 实际体量（本次实测，均为非 test / 非 target / 非 mock 口径）

| 指标 | 数值 |
|---|---|
| Server main Java 文件 | 808 |
| Server `throw new` 站点 | 1183 |
| Server `new BaseException(` 站点 | 713 |
| Server 含 CJK 的 main Java 文件 | 971 |
| Server `ErrorCode` 枚举 / 常量 | 5 / 127 |
| Web 非 spec 非 mock 含 CJK 的 ts+vue 文件 | 229 |
| Web `ElMessage.*` / `ElMessageBox.*` 调用点 | 354 |
| Web i18n 键（已消费） | 0 |

### 2.3 无法覆盖的边界（如实声明）

- **未执行后端启动、未请求真实接口、未做可见浏览器验收**。本任务为只读探索，全部证据为源码静态事实 + 已核实的前后端调用链。
- Server 端**未逐条核对 1183 个 `throw new` 的运行时可达性**；`BaseException`/`IllegalArgumentException` 类消息按异常类型确定可见，`IllegalStateException`/`RuntimeException` 默认被 500 兜底吞掉、仅在 Controller 显式 `catch` 再 `R.fail` 时才可见（已逐处标注）。
- Web 端**未在真实浏览器确认 354 个 toast 的最终渲染**，展示位置按调用类型（`ElMessage`=toast、`ElMessageBox`=对话框、`el-alert`/`formError`=行内）推定。
- **未清点数据库种子/迁移里的菜单说明与状态说明**：`sw-*.sql` 中 CJK 仅出现在 SQL 注释与列注释（comment 字段），未发现可外显的用户文案；`sw_notify_template` 无种子行，默认站内信模板不在本仓。此项按"未发现"记录，不是"已确认无"。
- 未评估 `sw-basic-iot` 设备侧上报的原始 `error` 字段内容（设备/第三方可控，属外部输入）。

## 3. 已核实的契约事实（硬证据）

### 3.1 Server 统一响应与异常出口

`R.java:13-15` 字段为 `int code` / `String msg` / `T data`。**注意 Web 侧契约不符**：`Smart-WorkFlow-aPaaS-Web/src/contracts/common.ts:19-23` 把响应体类型定义为 `ApiResponse<T> { code; message; data }`，而 Web 请求层实际读 `payload.msg ?? payload.message`（`request/index.ts:151`、`:181-183`）。后端从不发 `message`，即该类型声明与实现存在双字段隐性约定。

`GlobalExceptionHandler` 的 9 个出口逐个如下（HTTP 状态 / body）：

| 异常 | HTTP | 返回 msg |
|---|---|---|
| `BaseException` | 200 | `ex.getMessage()`（**直接外显**） |
| `AuthorizationDeniedException` | 403 | `CommonErrorCode.FORBIDDEN.getMessage()` = `"无权限"` |
| `HttpMessageNotReadableException` | 400 | `"请求体非法: " + ex.getMostSpecificCause().getMessage()` ← **Jackson 原文外泄** |
| `MethodArgumentTypeMismatchException` | 400 | `"参数非法: " + ex.getName()` ← **Java 参数名外泄** |
| `IllegalArgumentException` | 400 | `ex.getMessage()`（**直接外显**） |
| `MethodArgumentNotValidException` | 400 | `"参数非法: " + f.getField() + " " + f.getDefaultMessage()` ← **Java 字段名外泄** |
| `NoResourceFoundException` | 404 | `"资源不存在"` |
| `Exception` | 500 | `"系统异常"`（原文不外显，仅日志） |

`IllegalStateException` / `RuntimeException` / `UnsupportedOperationException` 无专用 handler，统一落入 `Exception` → `"系统异常"`，**其 message 不外显**，除非某个 Controller 自己 `catch` 后 `R.fail(..., e.getMessage())`。

### 3.2 错误码枚举与码段（实测）

| 枚举 | 路径 | 常量数 | 码段 |
|---|---|---|---|
| `CommonErrorCode` | `sw-framework/sw-common/.../exception/CommonErrorCode.java` | 5 | 400/401/403/404/500 |
| `FormErrorCode` | `sw-biz/sw-biz-form/sw-biz-form-api/.../exception/FormErrorCode.java` | 47 | 1000-1508 |
| `AuthErrorCode` | `sw-biz/sw-biz-system/sw-biz-system-biz/.../security/AuthErrorCode.java` | 4 | 2101-2104 |
| `BpmErrorCode` | `sw-biz/sw-bpm/sw-bpm-api/.../exception/BpmErrorCode.java` | 61 | 2000-2420 |
| `OpenApiErrorCode` | `sw-biz/sw-biz-openapi/sw-biz-openapi-api/.../exception/OpenApiErrorCode.java` | 10 | 3000-3009 |

另有非 `ErrorCode` 但会外显的裸整数码：`sw-basic-iot` 多处 `new BaseException(400/404/500, "...")`；`agent` 用 `new BaseException(409, "并发冲突，请重试")`。

### 3.3 三个已核实的机器码缺陷

**（a）认证码与流程码 2101-2104 完全重叠**（脚本比对码集合得出交集 `{2101,2102,2103,2104}`）：

| 码 | `AuthErrorCode`（登录链） | `BpmErrorCode`（流程链） |
|---|---|---|
| 2101 | `验证码错误` | `流程定义已有发布版本，process_key 不可变更` |
| 2102 | `验证码已过期` | `图翻译为 BPMN 失败` |
| 2103 | `机器时间异常` | `BPMN 部署失败` |
| 2104 | `密码错误` | `流程未发布，无法获取 BPMN XML` |

`AuthErrorCode.java:10` 的 javadoc 声称"区间 2100-2149 为认证登录专用，与 form 模块 1000-1505 区间互不重叠"——该断言只对 form 成立，未考虑 bpm。因后端 `msg` 恒非空，当前用户不会看到错文案，但**任何按 code 分流的调用方（前端、开放 API 消费者、自动化断言）无法区分两义**。

**（b）`BpmErrorCode` 内部 2415 重复**：`NODE_FUNCTION_TIMEOUT(2415, "节点函数执行超时")`（`:79`）与 `OPINION_FORM_GONE(2415, "意见表单不可用（未发布或版本缺失）")`（`:80`）。

**（c）前端 `ERROR_CODE_MAP` 的 1204-1208 兜底文案与后端同码语义不符**：

| 码 | 后端 `FormErrorCode` 实际语义 | 前端 `error-code-map.ts` 兜底文案 |
|---|---|---|
| 1204 | `字段类型未知` | `字段名不合法（仅允许字母/数字/下划线，且不能以数字开头）` |
| 1205 | `字段类型暂不允许发布` | `缺少必填属性` |
| 1206 | `字段缺少必要属性` | `字典字段未绑定字典类型` |
| 1207 | `表格字段不能嵌套` | `引用字段未指定目标表单` |
| 1208 | `表单定义配置异常` | `子表格字段未定义子列` |

前端注释 `error-code-map.ts:31` 写"对齐后端 FormPublishValidator"，但**全仓不存在该类**（`FormPublishValidator` 在 Web 仅此 1 处命中，Server 无该类）。这些文案实际来源是 `src/modules/form/views/FormDesigner.vue:456-465` 的**前端本地预检**，被误当作后端码语义登记。

同类语义重复（非跨端）：`FormErrorCode` 的 1208 与 1404 同为 `表单定义配置异常`；1506 与 1507 同为 `记录不存在或已删除`。

## 4. 问题清单（稳定 ID）

**分类代号**：`T1` 非行业惯用/AI 化措辞｜`T2` 内部实现术语外露｜`T3` 无行动指引的空泛提示｜`T4` 直译/中英混杂/标点不一致｜`T5` 同错异文或码义错配｜`T6` 状态混淆（成功/处理中/可重试/权限/不存在/故障）｜`T7` 安全敏感状态泄露｜`T8` 字符串即契约（改文案破坏兼容）
**严重度**：`S1` 安全/契约/阻断｜`S2` 显著影响理解与处置｜`S3` 一致性/风格
**受众**：`EU` 终端用户｜`ADM` 平台管理员/运维｜`DEV` 集成开发者（开放 API）｜`FP` 表单/流程设计者

### 4.1 Server — 跨模块（框架层，影响全体模块）

| ID | 位置 | 当前原文 | 触发条件 | 展示位置 | 受众 | 类 | 级 |
|---|---|---|---|---|---|---|---|
| P61-S-SEC-01 | `sw-framework/sw-security/.../filter/JwtAuthenticationFilter.java:119-120` | `"登录上下文装载失败（认证基础设施未就绪，非账号或权限问题）: " + cause.getMessage()` | 登录用户装载抛异常（Redis 未就绪、装配缺陷） | HTTP 503 响应体 `msg` | EU/ADM | T2·T7 | S1 |
| P61-S-FW-01 | `GlobalExceptionHandler.java:51` | `"请求体非法: " + ex.getMostSpecificCause().getMessage()` | JSON 非法/类型不匹配 | HTTP 400 `msg` → 前端 toast | EU | T2 | S1 |
| P61-S-FW-02 | `GlobalExceptionHandler.java:61` | `"参数非法: " + ex.getName()` | 路径/查询参数类型不匹配 | HTTP 400 `msg` → toast | EU | T2 | S2 |
| P61-S-FW-03 | `GlobalExceptionHandler.java:82-85` | `f.getField() + " " + f.getDefaultMessage()` 外层再包 `"参数非法: "` | `@Valid` 失败 | HTTP 400 `msg` → toast | EU/ADM | T2 | S2 |
| P61-S-FW-04 | `CommonErrorCode.java:8-12` | `系统异常` / `参数错误` / `未认证` / `无权限` / `资源不存在` | 各类兜底 | 500/403/404 `msg` | EU | T3 | S2 |
| P61-S-FW-05 | `sw-common/.../crypto/AesGcmCipher.java:49` | `"AES cipher key is not valid base64: " + base64Key.substring(0, Math.min(8, ...)) + "..."` | 启动期密钥非法 | 启动日志 | ADM | T7 | S2 |
| P61-S-FW-06 | `sw-common/.../config/mybatis/tenant/CommonTenantLineHandler.java:29` | `"租户上下文缺失，拒绝生成租户过滤条件（业务请求必须携带已认证身份）"` | 无认证身份的 MyBatis 查询 | 500 `msg` = `系统异常`（原文仅日志） | ADM | T2 | S3 |

P61-S-FW-01/02/03 是同一条管线：**把 Java 侧标识符（Jackson 原文、参数名、字段名）拼进用户可见文本**。这是全系统出现频次最高的外泄形态，波及所有含 `@Valid`/`@NotBlank` 的端点（已清点：system 5 处、bpm 10 处、iot 5 处）。

### 4.2 Server — 认证 / 会话 / 租户 / SSO

| ID | 位置 | 当前原文 | 触发条件 | 展示位置 | 受众 | 类 | 级 |
|---|---|---|---|---|---|---|---|
| P61-S-AUTH-01 | `AuthErrorCode.java:16-22` | `验证码错误` / `验证码已过期` / `机器时间异常` / `密码错误` | 登录链各失败分支 | 200 + body `msg` → 登录页行内 | EU | T3·T4 | S2 |
| P61-S-AUTH-02 | `AuthController.java:173,316` | `账号已锁定` / `账号已停用` | 账号状态非正常 | 200/401 `msg` | EU | T3·T7 | S2 |
| P61-S-AUTH-03 | `RefreshTokenService.java:101,111,120` | `refresh token 无效` / `refresh token 已被使用过，全部会话已失效，请重新登录` / `refresh token 已过期，请重新登录` | 刷新令牌各失败态 | `/auth/refresh` body `msg` | EU | T2·T4 | S2 |
| P61-S-AUTH-04 | `AuthMeController.java:46,86` | `未登录或 token 已失效` | 会话失效 | 401 `msg` | EU | T2 | S3 |
| P61-S-SSO-01 | `SsoAuthController.java:126` | `"SSO 回调被拒绝: " + e.getMessage()`（e 可能为 `"钉钉换票失败: HTTP 401"`、`"飞书换票被拒绝: code=…"`、`"企业微信换票被拒绝: errcode=…"`、`"腾讯…"`） | 三方回调失败 | 400 `msg` → 登录页 | EU/ADM | T2·T7 | S1 |
| P61-S-SSO-02 | `SsoAuthController.java:94,207,245,262` | `R.fail(400, e.getMessage())` 直出内部 message，含 `"该 Provider 未启用: " + provider`、`"登录前发起必须显式指定租户"`、`"回调地址不在受控白名单内: " + callbackUrl` | 授权/绑定/解绑参数或状态异常 | 400 `msg` | EU | T2·T7 | S1 |
| P61-S-SSO-03 | `TenantValidityService.java:74` | `"租户无效或已停用/过期: tenantId=" + tenantId` | 租户校验失败 | 经 SSO 路径 → 400 `msg` | EU | T2·T7 | S1 |
| P61-S-SSO-04 | `SsoAuthService.java:409,415,429,446` | `"该外部身份已绑定其他本地账号"` / `"该本地账号已绑定其他外部身份"` / `"该外部身份已在其他租户绑定，不能跨租户重复绑定"` | 绑定冲突 | 400 `msg` | EU | T7 | S2 |
| P61-S-SSO-05 | `SsoAuthService.java:299` / `:744-746` / `:187` | 审计 `detail` 写入 `"pre-login tenant=" + tenantId`、`e.getClass().getSimpleName() + ":" + e.getMessage()`、`"enabled=" + enabled` | 每次 SSO 事件 | `GET /auth/sso/audit` 响应体 | ADM | T2·T7 | S2 |
| P61-S-SUBJ-01 | `NotifySubjectBindingServiceImpl.java:66,70,77,81,87` | `"用户/Provider/主体不能为空"` / `"未支持的 Provider: " + providerKey` / `"该用户已存在同 Provider 的有效绑定"` / `"主体加密密钥未装配，拒绝绑定"` | 主体绑定校验 | 200 + body `msg` | EU/ADM | T2 | S2 |
| P61-S-AUTH-05 | `UserGroupController.java:39,41`、`AuthController.java:343,346`、`UserController.java:37` | `@NotBlank(message="业务标识不能为空"/"组名称不能为空"/"旧密码不能为空"/"新密码不能为空"/"用户名不能为空")` | `@Valid` 失败 | 400 `"参数非法: <字段名> <文案>"` | EU/ADM | T2 | S2 |

防枚举现状（**正面事实，必须保持**）：首方登录对"账号不存在"与"密码错误"统一返回 2104 `密码错误`（`AuthController.java:150-166`）；验证码 UUID 缺失/挑战不存在/内容不匹配统一 2101 `验证码错误`；登录后刷新未知用户返回 `账号已停用`（`:221`）。**任何改写都不得削弱这组收敛。**

上述 SSO 项（P61-S-SSO-01/02/03）与 P61-S-SEC-01 是本模块唯一的 S1：它们把基础设施/三方/租户标识直接送到未认证可达的响应体。

### 4.3 Server — 表单（`sw-biz-form`）

| ID | 位置 | 当前原文 | 触发条件 | 展示位置 | 受众 | 类 | 级 |
|---|---|---|---|---|---|---|---|
| P61-S-FORM-01 | `FormDefServiceImpl.java:245`、`:933` | `"字段名不合法: '" + physicalName + "' — " + e.getMessage()`，其中内层为 `ColumnValidation` 英文原文（`Column name is a reserved SQL keyword: 'x'`、`Column name must not start with 'x'`…） | 发布时物理列名违规 | 200 + body `msg`（1200）→ toast | FP | T2·T4 | S1 |
| P61-S-FORM-02 | `FormDefServiceImpl.java:261` | `"创建动态宽表失败: " + e.getMessage()`（原始 DDL/JDBC 文本） | 动态建表失败 | body `msg` → toast | FP/ADM | T2 | S1 |
| P61-S-FORM-03 | `FormDataDeleteService.java:219` | `"记录被表单 '" + refTableName + "' 引用（字段 " + colName + "），不能删除"` | 删除被引用记录 | body `msg`（1505）→ toast | EU | T2 | S1 |
| P61-S-FORM-04 | `FormDataQueryService.java:239,259,331`、`FormDataUpdateService.java:220`、`FormSubmitService.java:617,626`、`FormImportExportService.java:327,561,679` | `"查询失败: " + e.getMessage()` / `"更新…"` / `"序列化失败: " + e.getMessage()` / `"解析 Excel 文件失败: " + e.getMessage()` 等 | SQL/JDBC/POI 异常 | body `msg` → toast | EU/FP | T2 | S1 |
| P61-S-FORM-05 | `FormDataQueryService.java:678` | `"无法将 " + value.getClass().getSimpleName() + " 转换为布尔值"` | 筛选值类型不符 | body `msg` → toast | EU | T2 | S2 |
| P61-S-FORM-06 | `FormDefServiceImpl.java:1010` | `"FieldType " + fieldType + " is not enabled (disabled placeholder)"` | 发布禁用字段类型 | body `msg` | FP | T2·T4 | S2 |
| P61-S-FORM-07 | `FormDefServiceImpl.java:917,923` | `"… 的类型 '" + typeStr + "' 不在 FieldType 枚举中"` / `"… (disabled)，v1 不支持发布"` | 发布字段类型未知/禁用 | body `msg` | FP | T2 | S2 |
| P61-S-FORM-08 | `FormDataUpdateService.java:434,491` | `"UPDATE 子表行缺少 id"` / `"DELETE 子表行缺少 id"` | 子表行动作缺 id | body `msg` | EU/FP | T2 | S2 |
| P61-S-FORM-09 | `FormDataQueryService.java:576,580` | `"系统列 'id' 仅支持 EQ 过滤"` / `"过滤字段 'id' 的值为空"` | 列表筛选用系统列 | body `msg` | FP | T2 | S3 |
| P61-S-FORM-10 | `FormDataDeleteService.java:97`、`FormDataQueryService.java:188,302`、`FormDataUpdateService.java:139` | `"表单 '" + formKey + "' 无物理表"` | 表单缺物理表 | body `msg` | FP/ADM | T2 | S2 |
| P61-S-FORM-11 | `FormExtDataService.java:241,273`、`FormFieldEnrichmentService.java:141,159,190,289` | `"…服务未装配"` / `"…执行引擎未装配"` | 可选依赖未装配 | body `msg` | FP/ADM | T2 | S2 |
| P61-S-FORM-12 | `FormExtDataService.java:74,148,217,231` | `"queryKey 必须匹配 [a-z][a-z0-9_]{0,63}"` / `"dsBinding 的 valueField/displayField 不在契约输出 schema 内"` / `"契约输出 schema 解析失败"` | 外部数据源配置错误 | body `msg` | FP | T2 | S2 |
| P61-S-FORM-13 | `FormFieldValidator.java:118,169,179,188,196,228,232,241,248,260,268,274,280,287,300`、`FormFieldEnrichmentService.java:145,163,178,185,242,247,255,261,270,284,293,327`、`FormVisibilityRules.java:76-99,246` | `"字段 '" + def.name + "' …"`、`"字典字段 'x' 的值 'y' 不在字典类型 'z' 的值域内"`、`"显隐规则 target 'x' 不是已定义字段"` 等 | 提交/发布校验 | body `msg` → toast | EU/FP | T2 | S2 |
| P61-S-FORM-14 | `FormErrorCode.java` 1208/1404、1506/1507 | 同文案不同码（`表单定义配置异常`×2、`记录不存在或已删除`×2） | — | 按码分流失效 | DEV/前端 | T5 | S2 |
| P61-S-FORM-15 | `FormImportExportService.java:574,581` | `"模板映射不匹配（…）：期望 'x'，实际 'y'，请重新下载模板"` / `"模板存在未知列 'x'，…请重新下载模板"` | 导入模板版本不符 | body `msg` → toast | EU | T3（**正面范例**） | — |
| P61-S-FORM-16 | `FormExtDataService.java:170`、`FormImportExportService.java:465` | `"外部数据源返回结果超过行数上限，未返回不完整数据"` / `"模板已过期与表单当前版本不匹配，请重新下载模板"` | 上限/版本 | body `msg` | EU | T3（**正面范例**） | — |

注意 **1204-1208 的真实后端语义**与前端兜底表不一致（§3.3c）。发布校验在前端已有本地预检（`FormDesigner.vue:456-465`），所以真正的发布文案归属层需要在治理时明确一次。

### 4.4 Server — 流程 / BPM（`sw-biz-bpm`，61 个码 / 259 个主源文件）

| ID | 位置 | 当前原文 | 触发条件 | 展示位置 | 受众 | 类 | 级 |
|---|---|---|---|---|---|---|---|
| P61-S-BPM-01 | `BpmErrorCode.java:31`、`BpmProcessDefServiceImpl.java:296` | `"流程定义已有发布版本，process_key 不可变更"` | 已发布流程改 key | body `msg` | FP | T2 | S2 |
| P61-S-BPM-02 | `BpmErrorCode.java:32,33,34` | `"图翻译为 BPMN 失败"` / `"BPMN 部署失败"` / `"流程未发布，无法获取 BPMN XML"` | 发布链失败 | body `msg` | FP/ADM | T2 | S2 |
| P61-S-BPM-03 | `BpmErrorCode.java:19,23,24,37,38,44,50` | `"节点入/出边基数违规"` / `"未注册的节点类型"` / `"节点注册契约非法"` / `"节点缺少必要能力"` / `"流程变量中缺少 tenantId，无法构建审批人上下文"` / `"参与人适配器不存在"` | 图校验 / 参与者解析 | body `msg` / `GraphValidationError` 列表 | FP | T2 | S2 |
| P61-S-BPM-04 | `ApprovalUserTaskTranslator.java:104,122,134,160,175,181,190,196,204,209,215` | `"审批节点缺少 approver 配置"` / `"未实现的参与人策略: " + approverType` / `"FIXED_USER 只能配置正整数用户 ID"` / `"DEPT_POST 必须配置 {deptId, postCode}（…）"` | 设计器节点配置非法 | 图校验错误列表 → 设计器 | FP | T2 | S2 |
| P61-S-BPM-05 | `ConsensusNodeTranslator.java:56-109`、`DynamicParallelNodeTranslator.java:72-127`、`ServiceTaskNodeTranslator.java:54-130`、`NotificationNodeTranslator.java:29,36` | `"会签缺少参与人配置"` / `"动态并行来源类型不合法: " + sourceType` / `"通知渠道不合法: " + channel` / `"失败策略不合法: " + strategy` 等 | 同上 | 图校验错误列表 | FP | T2 | S2 |
| P61-S-BPM-06 | `GraphValidator.java:58-267`（21 处 `err()`） | 全部为 `BpmErrorCode.*.getMessage()` 原文，并回填 `elementId`/`nodeKey`/`edgeKey` | 图结构校验 | `GraphValidationError` 列表 | FP | T2 | S2 |
| P61-S-BPM-07 | `GraphToBpmnTranslator.java:273,279,284,342` | `"节点类型缺失: " + node.getId()` / `"节点类型未注册或缺少翻译能力: " + type` / `"非默认分支缺少条件表达式: " + edge.getId()` | 翻译失败 | 400 `msg` | FP | T2 | S2 |
| P61-S-BPM-08 | `SqlExecutor.java:89,92,145,154,158,166` | `"External datasource not found: id=…"` / `"Multiple statements (stacked queries) are not allowed. Only a single SELECT is permitted."` / `"Failed to parse SQL: " + e.getMessage() + …` / `"Only SELECT statements are allowed. Got: " + statement.getClass().getSimpleName()` / `"Dangerous SQL keyword detected: " + keyword + …` | 外部数据源 SQL 校验 | 400 `msg` | ADM/DEV | T2·T4 | S1 |
| P61-S-BPM-09 | `ExternalDatasourceServiceImpl.java:66` | `"ExternalDatasource or password_cipher is null"` | 实体或密文为空 | 400 `msg` | ADM | T2·T7 | S1 |
| P61-S-BPM-10 | `ProcessStartService.java:151` | `"tenantId must not be null when starting process; formKey=" + cmd.getFormKey()` | 缺租户上下文 | 400 `msg` | EU | T2·T4 | S2 |
| P61-S-BPM-11 | `FixedApproverResolver.java:34`、`ApprovalLifecycleServiceImpl.java:635,701,750,784,970,987`、`BpmLifecyclePortConfiguration.java:110` | `"ApproverContext 或 submitter 不能为空"` / `"…缺少租户上下文: processInstanceId=…/taskId=…"` | 内部上下文缺失 | 400 `msg` | EU/ADM | T2 | S2 |
| P61-S-BPM-12 | `PersistentBpmCommandQueue.java:67` | `"requeueFailed 仅接受已存在且 FAILED 的命令: " + envelope.getCommandKey()` | 队列重排非法 | 400 `msg` | ADM | T2 | S2 |
| P61-S-BPM-13 | `InstanceStatusEnum.java:37`、`CommandTypeEnum.java:39` | `"Unknown InstanceStatusEnum code: " + code` / `"未知命令类型: " + code` | 枚举反序列化失败 | 400 `msg` | DEV | T2·T4 | S3 |
| P61-S-BPM-14 | `BpmProcessDefController.java:289,292` | `R.fail(404, "流程定义不存在: id=" + id)` / `R.fail(400, "仅已发布流程定义可开启 IoT 接入: " + def.getProcessKey())` | 直出 body | 400/404 `msg` | ADM | T2 | S3 |
| P61-S-BPM-15 | `BpmBatchServiceImpl.java:68,76,81` | `row.put("message", e.getMessage())` / `row.put("message", response.getMsg())` | 批量审批逐项结果 | 批量结果行 `message` | EU | T2·T6 | S2 |
| P61-S-BPM-16 | `BpmDraftController.java:223` ↔ `DraftSubmitService.java:236` | 控制流判定 `ex.getMessage().contains("尚未关联")` 绑定文案 | 保存草稿无有效绑定 | 无展示，**业务分支** | — | **T8** | S1 |
| P61-S-BPM-17 | `BpmErrorCode.java:79,80` | 2415 重复占用（见 §3.3b） | — | 按码分流失效 | DEV/前端 | T5 | S2 |
| P61-S-BPM-18 | `BpmDeployFacadeImpl.java:112`、`AgentGraphDefServiceImpl.java:243` | `"Flowable 流程定义不存在，processDefinitionId=…"` / `"Failed to serialize graph"` / `"Failed to parse graph_json: " + e.getMessage()` | 引擎/序列化失败 | 500（原文不显） | ADM | T2 | S3 |
| P61-S-BPM-19 | `TaskActionService.java:124-143`、`BpmTaskFacadeImpl.java:94,118`、`ApprovalLifecycleServiceImpl.java:139,148` | `"节点已被处理"` / `"任务不存在或已被处理"` / `"无权处理该任务"` / `"当前状态不允许该动作"` | 审批动作竞态/越权 | body `msg` → toast | EU | T3（**正面范例**） | — |

**P61-S-BPM-16 是本次发现的最强 T8 证据**：`BpmDraftController.resolveDraftProcessDefKey` 用 `ex.getMessage().contains("尚未关联")` 判定"无有效绑定"这一业务分支。任何人改写 `DraftSubmitService.java:236` 的原文字符串，都会**静默改变业务流程**（草稿保存从"允许"变成"拒绝"）。同类风险见 `BpmErrorCode` 文案被当作稳定断言时的外部依赖。

### 4.5 Server — 通知 / 存储 / 任务 / IoT / Agent / 开放接口

| ID | 位置 | 当前原文 | 触发条件 | 展示位置 | 受众 | 类 | 级 |
|---|---|---|---|---|---|---|---|
| P61-S-NOTIFY-01 | `TemplateRenderService.java:69,87,109,131,137,143,155,180,189,198,217` | `"非法变量声明: " + trimmed` / `"变量未登记白名单: " + provided.getKey()` / `"变量 " + name + " 类型不符（应为 NUMBER）"` / `"缺少变量: " + String.join(", ", missing)` | 模板变量校验 | 模板编辑器 body `msg`（经 `NotifyTemplateServiceImpl.java:133,147,158,230` 包 `PARAM_ERROR`） | ADM | T2 | S2 |
| P61-S-NOTIFY-02 | `WeComNotifyChannelAdapter.java:85,90`、`FeishuNotifyChannelAdapter.java:75,91,108,112`、`DingtalkNotifyChannelAdapter.java:88,93`、`EmailNotifyChannelAdapter.java:77` | `"企业微信发送失败: errcode=" + errCode` / `"飞书发送失败: HTTP " + httpCode + " code=" + feishuCode` / `"邮件投递失败: " + e.getClass().getSimpleName()` | 三方投递失败 | `failureReason` 列 → 记录页 | ADM | T2·T4 | S2 |
| P61-S-NOTIFY-03 | `NotifyChannelConfigServiceImpl.java:64-65` | `"生产渠道适配器未装配或租户配置校验未通过，禁止启用: " + value` | 启用渠道配置 | body `msg` | ADM | T2 | S3 |
| P61-S-NOTIFY-04 | `NotifyRecordServiceImpl.java:135-136,143-159` | `"重发过于频繁，请约 " + N + " 秒后再试"` / `"记录当前状态为 " + current + "，仅明确失败且无进行中重发的记录可重发"` | 重发护栏 | body `msg` | ADM | T3（**正面范例**，含可重试/不可重试区分） | — |
| P61-S-JOB-01 | `SwJobBean.java:121,166-171` + `JobLog.java:53` + `JobLogController.java` | `jobLog.setExceptionStack(getStackTrace(e))`（`e.printStackTrace(pw)` 全文），`JobLog.exceptionStack` 由 `page`/`getById` 原样返回 | 任务执行异常 | `POST /job/log/page`、`GET /job/log/{id}` 响应体 | ADM | T2·T7 | **S1** |
| P61-S-JOB-02 | `SwJobBean.java:111,142,145,153` | `"未知任务类型: " + jobInfo.getJobType()` / `"BEAN 类型任务缺少 beanName"` / `"未找到 JobHandler Bean: " + jobInfo.getBeanName()` / `"FLOW 类型任务缺少 flowDefKey"` | 任务配置错误 | `job_log.result_msg` | ADM | T2 | S2 |
| P61-S-JOB-03 | `JobInfoController.java:78,81` | `"任务名称不能为空"` / `"Cron 表达式不能为空"` | 表单校验 | 400 `msg` | ADM | T4（Cron 为通用术语，可保留） | — |
| P61-S-STORE-01 | `StorageFacadeImpl.java:72-73` | `"存储提供商不可用: " + file.getProviderType()` | 无可用 Provider | 500 `msg` | ADM | T2 | S2 |
| P61-S-STORE-02 | `LocalStorageProvider.java:88,101` | `"非法的文件路径: " + storageKey` | 路径穿越尝试 | 500 `msg`=系统异常 | ADM | T3 | S3 |
| P61-S-STORE-03 | `StorageController.java:53,81,104` | `"上传文件不能为空"` / `"文件不存在"` | 上传/下载 | 400/404 `msg` | EU | T3 | S3 |
| P61-S-STORE-04 | `application.yml:12-17`（`max-file-size: 6MB`）无 `MaxUploadSizeExceededException` handler | 容器层 413/超限 → 落 `Exception` 分支 → `系统异常` | 超 6MB 上传 | 500 `msg` | EU | T6 | S2 |
| P61-S-IOT-01 | `IotScriptService.java:122,145` + `ScriptEngineService.java:122` + `GraalJsRunner.java:102,105,109,141` + `JavaSubprocessExecutor.java:144,159,167,171,173,183` | `"校验失败: " + result.getError()` 等，`error` 内容为 GraalVM/javac 原文（`"编译失败: " + String.join("; ", errors)`、`"脚本类必须实现 com.sw.ck.iot.script.api.IotJavaScript"`） | 脚本校验/试运行 | `POST /iot/scripts/{id}/validate`、`/dry-run`、`GET …/execs` | ADM | T2·T4 | S1 |
| P61-S-IOT-02 | `OnlineConfirmControlUtil.java:65,110`、`TencentCloudProvider.java:96,123` | `"腾讯云 API 调用失败: " + result.errorMessage()` | 腾讯云 SDK 失败 | body `msg`（500） | ADM | T2 | S2 |
| P61-S-IOT-03 | `IotConnectionService.java:182-184` + `MqttBrokerManager.java:74,76,123,143,155,168` | `"连接失败(" + category + "): " + e.getMessage()` / `"MQTT 连接失败: " + e.getMessage()` | MQTT/TLS 连接失败 | `last_check_result` 列 → 连接页 + toast | ADM | T2 | S2 |
| P61-S-IOT-04 | `MessageIngestService.java:149,288,364,374,384` | `msgLog.setParseError(trim(e.getMessage(), 500))`；`"无法定位设备（Topic 配置需绑定产品且可解析 deviceKey）: " + topic` | 上报解析失败 | `parse_error` 列 → `GET /iot/runtime/messages` | ADM | T2 | S2 |
| P61-S-IOT-05 | `IotTopicController.java:34`、`IotRuntimeController.java:79,82`、`IotDeviceController.java:65`、`IotConnectionController.java:38`、`IotProductService.java:181`、`IotScriptService.java:249` | `"Topic 不存在: id=" + id` / `"命令不存在: id=" + id` / `"设备不存在: productId=…, deviceName=…"` / `"脚本不存在: id=" + id` | 对象不存在 | 404 `msg` | ADM | T2 | S3 |
| P61-S-IOT-06 | `IotTopicService.java:97,104,107`、`IotDeviceServiceImpl.java:136`、`IotRuleList.vue` 对应项 | `"方向仅支持 UP/DOWN/BOTH: " + direction` / `"载荷类型仅支持 PROPERTY/EVENT/ACTION_RESULT/RAW: " + payloadType` / `"结果状态只能是 SUCCESS / FAILED"` | 配置校验 | body `msg` | ADM | T2 | S3 |
| P61-S-AGENT-01 | `AgentToolCallbackFactory.java:119-198` | `"内部工具方法不存在（白名单配置错误，须 String 入参签名）: " + beanName + "." + methodName + "(String)"` / `"内部工具执行失败: " + toolName + " - " + cause.getMessage()` | 工具装配/调用失败 | 反馈给 LLM，并可能进入会话输出 | EU | T2 | S2 |
| P61-S-AGENT-02 | `AgentOrchestrationServiceImpl.java:196,201,394-408` | `"编排引擎执行未产生结果"` / `"编排引擎执行未产生输出"`；`summarizeError` 取最深 `cause.getMessage()` | 编排失败 | `errorMessage` → 会话/执行详情 | ADM | T2·T3 | S2 |
| P61-S-AGENT-03 | `AgentGraphInterpreter.java:291,306,320,345,394,421,462,469,480,514,620,633,703,728`、`AgentGraphDebugEngine.java` 同套 | `"执行步数超限，图可能存在环路"` / `"循环迭代次数超限: " + current.getId()` / `"不支持的节点类型: " + type + "（节点 " + id + "）"` / `"所有执行点已终止但未到达 END 节点（JOIN 汇合入边数无法满足）"` | 图执行/调试 | `errorMessage` → 设计器/执行详情 | ADM | T2 | S2 |
| P61-S-AGENT-04 | `AgentModelConfigServiceImpl.java:184-185` | `resp.setMessage(detail != null ? detail : "网络不可达")`（detail 为网络/DNS 原文） | 连通性测试失败 | `ModelList.vue` toast | ADM | T2 | S2 |
| P61-S-OPENAPI-01 | `OpenApiErrorCode.java:12-21` | `开放应用不存在` / `开放应用已停用` / `签名校验失败` / `请求时间戳超出允许窗口` / `随机串已使用（防重放拒绝）` / `应用未被授权该操作范围` / `幂等键已绑定其他业务对象` / `流程实例不存在或不属于应用授权范围` / `回调投递失败` / `应用所属租户不可用` | 开放 API 各失败 | body `msg` | DEV | T3（**总体正面范例**；含防重放/幂等/范围语义） | — |
| P61-S-OPENAPI-02 | `OpenApiAuthService.java:60-61` | `"缺少鉴权头（X-App-Id / X-Timestamp / X-Nonce / X-Signature）"` | 缺鉴权头 | body `msg`（3002） | DEV | T3（**正面范例**） | — |
| P61-S-OPENAPI-03 | `OpenApiCallbackDeliveryService.java:137,170` | `summarize(e.getMessage())`（Hutool HTTP 客户端 DNS/TLS 原文）+ `row.setUrl(app.getCallbackUrl())` | 回调投递失败 | `GET /openapi/v1/callbacks` 响应体 | DEV | T2·T7 | S2 |
| P61-S-OPENAPI-04 | `OpenApiProcessController.java:157-189` | `"event 与 processInstanceId 不能为空"` / `"未知事件类型: " + eventName` / `"仅实例终态事件支持重发"` / `"请求体不是合法 JSON"` | 参数校验 | 400 `msg` | DEV | T2 | S3 |

### 4.6 Web — 全局 / 登录 / SSO / 布局

| ID | 位置 | 当前原文 | 触发条件 | 展示位置 | 受众 | 类 | 级 |
|---|---|---|---|---|---|---|---|
| P61-W-LOGIN-01 | `src/views/LoginPage.vue:37` | `'无法获取登录挑战，请检查网络'` | 登录前置（`fetchChallenge`）失败 | 登录页行内 `errorMessage` | EU | T1 | **S1** |
| P61-W-LOGIN-02 | `src/views/LoginPage.vue:48` | `'登录挑战未就绪，请刷新验证码'` | 挑战未签发时点提交 | 登录页行内 | EU | T1 | **S1** |
| P61-W-LOGIN-03 | `src/views/LoginPage.vue:120`、`:111` | `'刷新'`（验证码加载兜底文案）/ `title="点击刷新验证码"` | 验证码图加载中 | 登录页 | EU | T3 | S3 |
| P61-W-LOGIN-04 | `src/views/LoginPage.vue:61` | `error instanceof Error ? error.message : '登录失败'` —— 直接透出 `ApiError.message` | 登录失败 | 登录页行内 | EU | T3 | S3 |
| P61-W-SSO-01 | `src/views/SsoBindPage.vue:74-75` | `将外部身份（标识摘要 <code>…</code>）绑定到当前本地账号。 同一外部身份仅可绑定一个账号。` | 进入绑定页 | 绑定页 | EU | T2 | S2 |
| P61-W-SSO-02 | `src/views/SsoReturnPage.vue:31,45`、`SsoBindPage.vue:27,38,57` | `'SSO 登录失败，请重试'` / `'绑定票据缺失，请从登录入口重新发起'` | SSO 回调/绑定失败 | 页面行内 | EU | T3（**正面范例**，有恢复指引） | — |
| P61-W-LAYOUT-01 | `src/layouts/components/AppTopbar.vue:31` | `'未登录'` | 用户态未加载 | 顶栏显示名 | EU | T3 | S3 |
| P61-W-LAYOUT-02 | `src/layouts/components/AppTopbar.vue:73` | `aria-label="toggle sidebar"`（英文） | 读屏 | 无障碍标签 | EU | T4 | S3 |
| P61-W-ROUTE-01 | `src/router/index.ts:297,303,309` | `'无权限访问'` / `'页面不存在'` / `'服务异常'` | 路由错误页 | `ErrorPage.vue` | EU | T3（**正面范例**） | — |
| P61-W-ROUTE-02 | `src/router/guard.ts:180,188`、`src/foundation/request/index.ts:108` | 无文案，静默 `next('/403')` / `push('/login?redirect=…')` | 越权/401 | 无提示 | EU | T6 | S2 |
| P61-W-EP-01 | `src/main.ts:20-27` 无 `ElConfigProvider` | Element Plus 内建文案为英文（分页 `Total`/`Go to`、表格 `No Data`、下拉 `No data`） | 任意分页/空表 | 组件内建 | EU/ADM | T4 | S2 |
| P61-W-CONTRACT-01 | `src/contracts/common.ts:19-23` | `ApiResponse<T> { code; message; data }` —— 与后端 `R.msg` 不符，请求层读 `msg ?? message` | 全部接口 | 类型层 | DEV | T5 | S2 |
| P61-W-MAP-01 | `src/foundation/request/error-code-map.ts:32-36` | 1204-1208 兜底文案与后端语义不符（§3.3c） | 后端 msg 为空时 | toast | EU/FP | T5 | S2 |
| P61-W-MAP-02 | `src/foundation/request/error-code-map.ts:56,69` + mock `handlers.ts:1888,1908,1928` | `2105:'流程已发布，不能修改'` 落在 auth 注释块内；mock 用 2104/2105 发流程文案 | 按码兜底 | toast | EU | T5 | S2 |
| P61-W-REQ-01 | `src/foundation/request/index.ts:110` | `// TODO(skeleton): 5xx / 网络层基础设施异常分级处理…`；非 403 的 HTTP 错误按裸 `AxiosError` 抛出 | 5xx/网络故障 | 各页各自兜底 | EU | T6 | **S1** |
| P61-W-REQ-02 | `src/foundation/request/index.ts:154-156` | 403 分支丢弃后端 body，固定替换为 `getErrorMessage(403, '无权限')` → `'无权限执行该操作'` | 403 | toast | EU | T5 | S3 |
| P61-W-REQ-03 | `src/foundation/request/index.ts:172` | `'下载响应解析失败'` | blob 返回 JSON 且解析失败 | toast | EU | T3 | S3 |
| P61-W-EMPTY-01 | `src/components/page-layout/ListEmpty.vue:7` + `StandardListTemplate.vue:46` | `'暂无数据'`（约 20 个列表页共用同一兜底） | 任意空列表 | 列表空态 | EU/ADM | T3 | S3 |
| P61-W-EMPTY-02 | `src/components/BlankPage.vue:9` | `'占位页面'` | `route.meta.title` 缺失 | 页面正文 | EU | T3 | S3 |
| P61-W-CONST-01 | `src/modules/system/constants.ts:32-34,39-40,61-67,78` | `'正常'`/`'停用'`/`'锁定'` 硬编码映射，与 `src/foundation/dict/index.ts:93` "禁止硬编码枚举到文案的映射" 冲突 | 系统管理各页 | 表格标签 | ADM | T5 | S3 |

**P61-W-LOGIN-01/02 是任务点名的"登录挑战"的全部用户可见落点**，且是本模块唯一 S1 级 T1 问题：它们把内部实现词汇（挑战）呈现给未登录用户，且第 2 条把"挑战未就绪"这一实现状态直接作为失败原因，用户无法据此判断该做什么（实际动作与第 1 条相同：刷新）。

### 4.7 Web — 业务模块（同质问题按规则归并）

354 个 toast/dialog 调用点中，**绝大多数属同一形态**，按规则归并如下（代表性证据逐条给出，其余同类不逐一枚举，方法见 §2）：

| ID | 规则 | 代表性证据 | 受众 | 类 | 级 |
|---|---|---|---|---|---|
| P61-W-GEN-01 | **非 `ApiError` 失败塌缩为同一句通用文案**：网络断开、5xx、超时、JS 异常、未归一 403 共用一句 | `notify/views/NotifyHome.vue:90` `'加载通知列表失败'`；`:144`/`NotifyChannelList.vue:54`/`NotifyRuleList.vue:148`/`JobList.vue:244,258`/`TemplateCenter.vue:62` `'操作失败'`；`DeptList.vue:262` 等 7 处 `'删除失败'`；`DeptList.vue:237` 等 7 处 `'保存失败'`；`agent/views/DebugSessionView.vue:222,240,256,275,301` `'单步执行失败'`/`'继续执行失败'`/`'停止失败'`/`'更新断点失败'`/`'添加断点失败'` | EU/ADM | T6 | S2 |
| P61-W-GEN-02 | **猜单一成因**：`catch` 无错误信息却断言某个具体原因 | `iot/views/IotScriptList.vue:129-130` `catch { ElMessage.error('发布失败：先通过校验') }`；`IotDeviceList.vue:82-83` `'发布失败：需绑定已发布物模型的产品'`；`:99-100` `'未发布设备不能开启流程接入'`；`workflow/views/ProcessCatalogAdmin.vue:96` 在任意删除失败后追加 `（分类下仍有事项时须先解除归属）` | ADM | T6 | S2 |
| P61-W-GEN-03 | **系统故障呈现为空态**：加载失败无错误面，直接渲染"暂无…" | `src/modules/iot/views/*` 全模块无 `el-alert`/`errorMsg`；失败即显示 `'暂无连接配置'`/`'暂无设备'`/`'暂无脚本'` 等 | ADM | T6 | S2 |
| P61-W-GEN-04 | **失败无任何反馈**：handler 无 try/catch，仅有成功 toast | `iot/views/{IotScriptList,IotRuleList,IotDeviceList,IotProductList,IotRuntimeLogs,IotConnectionList}.vue` 的 save/publish/disable/retry/rotate 分支；`IotFlowActions.vue:58-60` 吞异常返回 null，渲染 `'未启用'` | ADM | T6 | S2 |
| P61-W-GEN-05 | **裸枚举/ID 直出** | `iot/views/IotRuntimeLogs.vue:118,141,167,199` 渲染 `row.parseStatus`/`row.status` 原文；`:73` `已重试：新命令 ${result.id}（${result.status}）`；`IotDeviceList.vue:107` `连接状态：${status}`；`IotScriptList.vue:122` `试运行 ${exec.status}`；`notify/views/NotifyRecordList.vue:122` `重发结果：${status}` 及表格列；`workflow/views/TaskHandover.vue:94` `— {{ result.status }}`；`MobileWorkspace.vue:396-400` 展示 `refInstance.status`/`initiatorId`/`formKey`；`agent/views/ExecutionList.vue:62` `图 #${s.graphDefId}`；`DebugSessionView.vue:343` `图 #{{ session.graphDefId }}` | ADM/EU | T2 | S2 |
| P61-W-GEN-06 | **原始后端/JS 文本直出** | `workflow/views/ProcessInstanceList.vue:157`、`ProcessDefList.vue:151`、`form/designer/draft-actions.ts:84` `err.message \|\| fallback`（English Axios/JS 原文）；`TaskDetail.vue:302`/`TodoList.vue:99`/`MyDrafts.vue:150`/`MobileWorkspace.vue:309` 直出 `failureReason`；`BatchApproval.vue` 逐行 `row.message`；`MyInstances.vue:185-189` 直出 `resp.detail`；`IotConnectionList.vue:103-105` 直出 `result.category`+`result.detail` | EU/ADM | T2 | S2 |
| P61-W-GEN-07 | **同码异文（本地映射漂移）** | `form/views/FormRender.vue:234-242` 本地 MAP：`1401:'必填字段缺失，请检查所有必填项'` vs 中央 `'必填字段未填'`；`1403:'字段值超出字典允许范围，请重新选择'` vs `'字典值不在允许范围'`；`1507:'记录已被删除'` vs `'记录不存在或已被删除'`。同一码在 FormData.vue（走中央映射）与 FormRender.vue（走本地映射）显示不同文案 | EU | T5 | S2 |
| P61-W-GEN-08 | **同义异文（跨入口漂移）** | `APPROVED` → `ProcessInstanceList.vue:25-36` `'已完成'` vs `MyInstances.vue:29-39` `'已通过'` vs `TaskDetail.vue:484-489` `'通过'`；处理中 → PC `'处理中，可稍后在结果中查看'` vs 移动端 `MobileWorkspace.vue:309` `'处理中，请稍后在列表确认'`；`'请填写必填审批意见'` 在 `TaskDetail.vue:281` 与 `MobileWorkspace.vue:282` 重复定义 | EU | T5 | S3 |
| P61-W-GEN-09 | **实现/路线图术语面向业务用户** | `form/designer/config/ConfigSeamNote.vue:18` `'以下配置待契约扩展后接入（本刀不自造键）'`；`FieldConfigPanel.vue:97` `'「该字段」配置项待接入（后续刀）'`；`workflow/views/ProcessDesigner.vue:392-395,403,406` `'发布将按服务端完整校验冻结当前草稿为新版本；任何校验错误都会零部署拒绝。继续？'` / `'发布成功：图、节点配置、表单与函数版本已冻结'` / `'发布失败（零部署）'`；`ProcessGraphView.vue:136` `'历史图缺少画布坐标，已按确定性兼容布局展示；图形拓扑完整可用'`；`form/designer/config/DateConfig.vue:31` `'v1 固定为年-月-日，暂不支持自定义。'` | FP | T1·T2 | S2 |
| P61-W-GEN-10 | **裸技术标识作为字段名/校验文案** | `agent/views/ModelFormDialog.vue:180,183,186,404,422,363` `'temperature 取值范围为 0 ~ 2'`/`'maxTokens 需为正整数'`/`'topP 取值范围为 0 ~ 1'`/`'多 Key 分组'`；`agent/views/InternalToolFormDialog.vue:206,108,212` `'Spring 容器中的 Bean 名称（白名单值）'`/`'Bean 名称不能为空'`/`'约定签名：String execute(String params)'`；`ExternalToolFormDialog.vue:138` `'入参 Schema 不是合法的 JSON 格式'`；`agent/views/GraphDesigner.vue:246` `'LOOP 节点 maxIterations 必须 ≥ 1'`；`workflow/views/InstanceMonitor.vue:167` `'流程定义 Key'`；`workflow/views/TaskHandover.vue:80` `'processDefKey，逗号分隔；留空=全部范围'`；`MyCc.vue:147` `'流程实例ID（精确）'`；`bpm WorkflowAttachmentController.java:92` `"storageKey 不能为空"` | ADM | T2 | S2 |
| P61-W-GEN-11 | **标点/空格/省略号不一致** | 半角引号内嵌中文：`job/views/JobList.vue:218,266`、`storage/views/StorageList.vue:159`、`workflow/views/MyDrafts.vue:214`；省略号混用 `'加载中...'`（`HistoryVersionsDialog.vue:71`）vs `'（计算中…）'`（`NotifyBatchSend.vue:453`）；`'流程实例ID'`（无空格）vs `'实例 ID'`（有空格）vs `'业务ID'`；`'耗时(ms)'` vs `'耗时 (ms)'`（`ExecutionList.vue:269`） | EU/ADM | T4 | S3 |
| P61-W-GEN-12 | **批量结果缺少失败明细** | `form/views/FormData.vue:292` `` `导入完成：成功 ${successCount} 条，失败 ${errorCount} 条` ``（有计数但 `importResult.errors` 未在模板使用）；`NotifyBatchSend.vue:324` `` `成功向 ${recipientCount} 人发送通知` ``（无失败计数）；`BatchApproval.vue:136-159` 有逐项无汇总；`FormData.vue:289` 仅在 `errorCount===0` 时报成功数 | EU/ADM | T6 | S2 |
| P61-W-GEN-13 | **`el-empty` 与 `el-table` 空态并存致英文 `No Data`** | `system/views/DeptList.vue:329-380` 表格常驻渲染（EP 默认 `No Data`）叠加 `:383-390` 自定义中文空态块 | ADM | T4 | S3 |
| P61-W-FORM-01 | 设计器本地预检文案（与后端 1204-1208 兜底同源） | `FormDesigner.vue:456-465` `字段名 "${field.name}" 不合法（仅允许字母/数字/下划线，且不能以数字开头）` / `字典字段 "…" 未绑定字典类型` / `引用字段 "…" 未指定目标表单` / `子表格字段 "…" 未定义子列` | 发布预检 | EU/FP | T2 | S2 |
| P61-W-FORM-02 | 必填校验文案三处不一 | `adapters/form-designer/index.ts:239` `'必填'`（裸词）；`FormRender.vue:314` `'此字段为必填项'`；`FormRender.vue:329,527` `'请完善必填项后再提交'` | 表单渲染 | EU | T5 | S3 |
| P61-W-JOB-01 | 任务页术语面向管理员但含实现词 | `job/views/JobList.vue:187,377,509,460` `'Cron 表达式不能为空'`/`'Cron 表达式'`/`'Misfire 策略'`/`'Bean（Spring Bean 处理器）'` | 任务管理 | ADM | T2 | S3 |
| P61-W-NOTIFY-01 | 通知规则/模板面向管理员，含协议常量 | `notify/views/NotifyRuleList.vue:240,245` `'如 IN_APP,EMAIL'`/`'如 ASSIGNEE / ROLE:admin / INITIATOR'`；`NotifyTemplateFormDialog.vue:193,205` `'支持 ${userName} 占位符…'` | 通知管理 | ADM | T2 | S3 |

## 5. 三类接缝归属（治理论断）

### A. 机器码保持兼容，仅改用户文案

适用：文案唯一存在于枚举 `message` / 字面量，无按文案分流、无外部消费者断言。
- 全部 `FormErrorCode` / `BpmErrorCode` / `AuthErrorCode` / `OpenApiErrorCode` 的 `message` 字面量（**除 P61-S-BPM-16 关联的 `DraftSubmitService.java:236`**）。
- 全部 Web 硬编码 toast/校验/空态/标签文案（354 个调用点 + 229 个含 CJK 文件）。
- `CommonErrorCode` 的 5 条与 `GlobalExceptionHandler` 内的字面量。
- 需同步的**成对点**：`error-code-map.ts` 兜底文案必须与后端同码语义对齐（否则修好后端仍会露出错语义）。

### B. 需要新增"用户层 / 诊断层"双层消息

适用：同一失败同时需要"给用户一句可行动的话"和"给运维/开发者可定位的原因"。当前 `R<T>` **没有第二通道**，所有诊断信息只能挤进 `msg` 或落日志。至少以下必须双层：
- P61-S-FW-01/02/03（Jackson 原文、Java 参数名、Java 字段名）：用户层要"请求数据格式不正确，请检查后重试"；诊断层需保留原文（日志或新字段）。
- P61-S-FORM-01/02/04、P61-S-BPM-08、P61-S-IOT-01/03/04（SQL/JDBC/POI/GraalVM/javac/MQTT/Tencent 原文）。
- P61-S-SEC-01、P61-S-SSO-01/02/03（基础设施与三方原文 + 租户标识）。
- P61-S-JOB-01（完整 Java 栈）。
- P61-S-OPENAPI-03（HTTP 客户端原文）——开放 API 受众是开发者，可保留技术细节，但应分类而非原样倾倒。

### C. 需要前后端共同改契约

- **P61-S-BPM-17 / P61-W-MAP-02**：2101-2104 码段双占用必须由两端共同确认归属（改码 or 分段）。
- **P61-W-CONTRACT-01**：`ApiResponse<T>.message` 与后端 `R.msg` 不一致，需统一字段名或明示双字段兼容窗口。
- **P61-W-MAP-01**：1204-1208 需两端共同确定"发布校验文案的真实产生层"（后端发布校验 vs 前端本地预检）。
- **P61-W-REQ-01**：非 403 的 HTTP 错误目前未归一，前端需与后端确认 5xx/网络层的分级语义后再落地文案。
- **P61-S-BPM-16（T8，最高优先）**：`BpmDraftController:223` 用文案子串做业务分支，必须先改为按 `code`/专用异常类型判定，才允许改写 `DraftSubmitService:236` 的文案。这是"仅改表层字符串会破坏行为"的实例。
- **P61-S-STORE-04**：容器超限上传需后端补 `MaxUploadSizeExceededException` handler，前端才能给出可行动文案。

## 6. 特殊处理约束（不可忽略）

| 主题 | 约束 |
|---|---|
| **认证安全 / 防枚举** | 必须保持：`AuthErrorCode` 2104 统一覆盖"账号不存在/密文非法/解密失败/密码不匹配"；2101 统一覆盖"UUID 缺失/挑战不存在/内容不匹配/已消费"；登录链不得区分账号存在性。改写只能改措辞，不得拆分这组收敛。**P61-S-AUTH-02 / P61-S-SSO-04 的账号与绑定状态披露需单独评估**：前者是刻意的状态提示，后者暴露"该外部身份已绑定其他账号/其他租户"，属防枚举边界讨论项。 |
| **多语言** | 当前无 i18n 层，引入需从零建设（Server `MessageSource` + Web `vue-i18n` 实际接入 + EP `ElConfigProvider`）。**不得把"抽 key"当作低风险重构**：Web 的 i18n 已装但零消费，locale 文件仅 1 键；抽取会触碰 229 个文件与全部自动化断言。 |
| **第三方原文** | 钉钉/飞书/企业微信/腾讯云/Feishu/Email 的 `errcode`/`code`/HTTP 状态、GraalVM/javac 编译输出、MQTT broker 文本、Hutool HTTP 客户端文本、Jackson 解析文本，**均为外部可控或含环境细节**。不得简单删除（会损失可运维性），应迁移到诊断层；用户层只留可行动结论。 |
| **批量结果** | 现状三种形态：`FormData.vue:292` 有成功/失败计数但无明细链接；`BatchApproval.vue` 有逐项无汇总；`NotifyBatchSend.vue:324` 只有成功数。治理需统一为"汇总计数 + 可下钻失败明细"，且失败明细不能是 P61-W-GEN-06 式的原始文本直出。 |
| **恢复指引** | 现有正面范例可作模板：`'模板已过期或与表单当前版本不匹配，请重新下载模板'`、`'重发过于频繁，请约 N 秒后再试'`、`'绑定票据缺失，请从登录入口重新发起'`、`'记录已被他人修改，请刷新后重试'`。反面：`'机器时间异常'`、`'登录挑战未就绪，请刷新验证码'`、`'操作失败'` 均无下一步。 |
| **不删除诊断信息** | 任务 §5 明确：内部诊断信息需识别正确承载层，保留可运维性与可审计性。SSO 审计 `detail`、Job 执行栈、IoT `parse_error`、脚本 `error` 列的**内容本身有价值**，问题在于"暴露给谁、通过哪个通道"。 |

## 7. 统一写作原则与代表性改写建议

### 7.1 写作原则（提议，供 Planner 裁决）

1. **一件事一句话**：说明"发生了什么 + 我现在要做什么"。可行动优先于精确。
2. **不出现实现标识符**：Java 字段名、枚举类名、JSON 键、DB 列名、bean 名、`process_key`/`storageKey`/`formKey`/`tenantId` 等不出现在用户层；如需指代对象，用业务名（表单名、节点名、任务标题）。
3. **术语分层**：设计者/管理员界面可用领域术语（BPMN、会签、外部数据源契约），但必须是**产品术语**而非代码术语；终端用户界面不出现 BPMN/Provider/节点能力/宽表/物理表。
4. **状态不可混**：成功、处理中、可重试、不可重试、权限不足、对象不存在、系统故障各用各的话，且失败必须能区分"重试有用"与"重试无用"。
5. **可枚举文案收敛**：同一语义在同一码上只有一个文案源；跨入口同义文案用同一句式（`APPROVED`、处理中、必填校验）。
6. **中英与标点一致**：中文句子内嵌专名用空格分隔（`实例 ID`）；引号统一为 `「」` 或全角 `“”`，不再混用半角 `"`；省略号统一 `…`；句末标点统一。
7. **诊断与用户分离**：内部原因进日志/诊断字段，不进 `msg`。
8. **不牺牲安全**：防枚举收敛不可为"更友好"而拆分。

### 7.2 代表性改写（仅示例，不在探索阶段落地）

| 位置 | 当前 | 建议 |
|---|---|---|
| `LoginPage.vue:37` | `无法获取登录挑战，请检查网络` | `登录信息加载失败，请检查网络后重试` |
| `LoginPage.vue:48` | `登录挑战未就绪，请刷新验证码` | `请先完成验证码校验（可点击图片刷新）` |
| `AuthErrorCode:20` | `机器时间异常` | `本机时间与服务器相差过大，请校准系统时间后重试` |
| `GlobalExceptionHandler:51` | `请求体非法: <Jackson 原文>` | 用户层 `请求数据格式不正确，请检查后重试`；原文留日志 |
| `GlobalExceptionHandler:85` | `参数非法: <java 字段名> <文案>` | `表单填写有误：<业务字段名> <文案>` |
| `CommonErrorCode:8` | `系统异常` | `系统暂时无法处理该请求，请稍后重试；若持续出现请联系管理员` |
| `RefreshTokenService:111` | `refresh token 已被使用过，全部会话已失效，请重新登录` | `您的登录状态已失效，请重新登录` |
| `JwtAuthenticationFilter:119` | `登录上下文装载失败（…）: <cause>` | 用户层 `登录服务暂时不可用，请稍后重试`；cause 落日志 |
| `FormErrorCode:31`（1206） | `字段缺少必要属性` | `字段配置不完整，请在设计器中补全后重新发布` |
| `BpmErrorCode:32` | `图翻译为 BPMN 失败` | `流程发布失败：流程图结构校验未通过，请检查节点与连线` |
| `AuthErrorCode:16`（2101） | `验证码错误` | `验证码不正确，请重新输入`（**保持与"账号不存在"不可区分**） |
| `IotScriptList.vue:129` | `发布失败：先通过校验`（猜成因） | `发布失败：请先通过脚本校验` 改为按 `ApiError.msg` 分流，非 ApiError 用 `脚本发布失败，请稍后重试` |

## 8. 分批实施接缝与验证

### 8.1 提议的原子批次（每批可独立验证、独立回退）

| 批 | 范围 | 原子性依据 | 预计文件集 |
|---|---|---|---|
| **B0（前置，必须先做）** | 解除文案即契约：把 `BpmDraftController.java:223` 的 `getMessage().contains("尚未关联")` 改为按 `code` + 业务状态判定 | 不改任何文案，纯解耦；后续所有批次的合法前提 | `sw-biz/sw-bpm/sw-bpm-process/.../controller/BpmDraftController.java`、对应测试 |
| **B1** | Server 校验出口三条（`GlobalExceptionHandler` 的 3 个 400 分支）+ `CommonErrorCode` 5 条 | 收敛在 2 个文件，全站生效 | `GlobalExceptionHandler.java`、`CommonErrorCode.java`、`GlobalExceptionHandlerTest.java` |
| **B2** | 认证/SSO 用户文案 + 基础设施 503 泄漏（P61-S-SEC-01、SSO-02/03、AUTH-01～04） | 同属登录链，可整体走可见浏览器回归 | `sw-security/.../filter/JwtAuthenticationFilter.java`、`sw-biz-system/.../AuthController.java`、`SsoAuthController.java`、`AuthErrorCode.java`、`TenantValidityService.java`、`RefreshTokenService.java` |
| **B3** | 表单模块文案与内部术语（P61-S-FORM-01～13）+ 前端 1204-1208 兜底对齐 | 表单发布/提交/查询/导入四条已发布路径 | `sw-biz-form`（`FormDefServiceImpl.java`、`FormData*Service.java`、`FormFieldValidator.java`、`FormFieldEnrichmentService.java`、`FormExtDataService.java`、`FormErrorCode.java`）+ `Web/src/foundation/request/error-code-map.ts` |
| **B4** | 流程模块文案 + 码段冲突（P61-S-BPM-01～15、BPM-17）+ `BpmErrorCode` 2415 | 图校验文案集中在 translator/validator 与 1 个枚举 | `BpmErrorCode.java`、`sw-bpm-engine/.../translator/*`、`sw-bpm-process/.../validator/*`、`BpmBatchServiceImpl.java` |
| **B5** | 支撑模块（notify/job/storage/iot/agent/openapi） | 按模块可再拆；**P61-S-JOB-01 与 P61-S-IOT-01 优先** | `SwJobBean.java`/`JobLog.java`、`ScriptEngineService.java`、`IotConnectionService.java`、`MessageIngestService.java`、各 `*NotifyChannelAdapter.java`、`TemplateRenderService.java`、`OpenApiCallbackDeliveryService.java` |
| **B6** | Web 通用层：异常分级 + 兜底映射 + 空态/EP 本地化（P61-W-REQ-01/02、MAP-01/02、EMPTY-01、EP-01、CONTRACT-01） | 收敛在 4 个文件，但影响全部页面 | `src/foundation/request/{index.ts,error-code-map.ts}`、`src/contracts/common.ts`、`src/main.ts`、`src/components/page-layout/ListEmpty.vue` |
| **B7** | Web 业务模块文案（P61-W-GEN-*、各模块专有项） | 数量最大（354 调用点），建议按模块再分 7 个原子 | `src/modules/{form,workflow,agent,notify,job,iot,storage}/**`、`src/modules/system/**`、`src/views/**` |

排序理由：B0 是其他批次的前置（否则改写 B4 文案会改变业务行为）；B1/B2 是全站高频且含 S1 泄漏；B3/B4 是任务点名的关注模块；B5 含两处 S1 外泄；B6 影响面最广但耦合最低；B7 体量最大、最适合作末端批次。

### 8.2 回归测试接缝

- **Server 文案断言现状很薄**：仅 `sw-bootstrap/src/test/.../I5PgTenantBehaviorBootTest.java` 等少数文件出现中文文案断言（本次实测：含指定中文文案的测试文件 1 个）。**这意味着 Server 侧改写文案的主要风险不在单测，而在前端与文档**。
- **Web 侧风险显著更高**：`src/foundation/request/index.spec.ts`、`src/foundation/auth/index.spec.ts`、`src/foundation/auth/permission.spec.ts`、`src/router/notify-template-route-guard.evidence.spec.ts`、`src/modules/system/views/{RoleList,UserGroupList}.spec.ts`、`src/modules/notify/views/NotifyTemplateList.spec.ts`、`src/modules/form/views/FormDesigner.spec.ts`、`src/modules/agent/views/*.spec.ts` 断言命中中文文案。**改写 Web 文案前必须先跑一遍这些 spec 并逐个核对断言性质**（是否为"用文案代替语义断言"的脆弱断言）。
- 建议每个批次交付门：Server `MAVEN_OPTS="-Xmx2g" mvn test`；Web `NODE_OPTIONS="--max-old-space-size=2048" pnpm typecheck && pnpm lint && pnpm test && pnpm build`（前后端编译互斥，见 `knowledge/shared-constraints.md` §9）。

### 8.3 可见浏览器验收页面（`headless=false`，正式流程证据）

按批次需覆盖的用户可达页面：
- B1/B2：`/login`（含验证码刷新、密码错误、验证码过期、账号停用、SSO 发起）、`/sso/return`、`/sso/bind`、`/account/bindings`。
- B3：`/form/designer`（发布预检与发布失败）、`/form/render`（必填/字典/版本冲突）、`/form/data`（导入失败、删除被引用、导出）、`/form/def-list`。
- B4：`/workflow/process-designer`（图校验错误列表、发布失败）、`/workflow/task/:id`（审批竞态与越权）、`/workflow/batch-approval`（批量逐项结果）、`/workflow/my-drafts`（草稿保存/提交）。
- B5：`/job/log`（执行失败栈不再外显）、`/iot/scripts`（校验/试运行错误）、`/iot/connections`（连接失败）、`/iot/runtime`（解析失败）、`/notify/records`（投递失败与重发）、`/agent/models`（连通性测试失败）。
- B6/B7：各模块列表页空态与加载失败态、`/403`、`/404`、`/500`、任意分页组件。

### 8.4 治理前置的判定项（需 Planner/Owner 裁决，探索不自行决定）

1. 是否引入 `R<T>` 的诊断字段（影响面：后端全部 handler + 前端契约 + 开放 API 消费者）。
2. 2101-2104 码段归属（改哪一端、是否设兼容窗口）。
3. 是否真正启用 i18n（当前 Web i18n 为空壳，Server 无 MessageSource）。
4. 全站文案是"逐条改写"还是"先建术语表 + 文案源单一化再改写"。

## 9. 未确认事项与冲突

1. **`knowledge/current-status.md` 登记的探索任务名为 `search_task/v0.1.0-p61-user-facing-message-humanization-current-seams.md`，实际文件为 `search_task/p61-user-facing-message-humanization-current-seams.md`**（缺 `v0.1.0-` 前缀）。本文按实际文件名回传。属治理事实偏差，需 Planner/管理员校准。
2. `BpmErrorCode` 2415 双占用与 2101-2104 跨枚举重叠是**已核实**事实；但"当前是否有生产路径同时触发同码不同义"未验证（需运行时请求）。
3. Web `ERROR_CODE_MAP` 的 1204-1208、2104、2105 属**潜在**错显（因后端 `msg` 恒非空，当前不触发）。是否纳入本轮治理范围需裁决。
4. `max-file-size: 6MB` 超限上传的实际响应（500 `系统异常` vs 容器 413）**未做真实请求验证**，按 handler 缺失推定。
5. 未清点数据库种子/迁移中的用户可见文案（仅确认 `sw_*` SQL 中 CJK 集中于注释）；如存在菜单说明/状态说明种子，需补一轮定向扫描。
6. 未评估前端 `src/foundation/mock/**`（约 239 条后端错误文案 + 379 条种子文案）。仅 dev 模式可达，**不计入用户文案**，但其中 2104/2105 的码义混用暴露了 §3.3 的契约问题。

## 10. 覆盖自证（禁止关键词冒充）

本次未以"`挑战` 命中数"作为覆盖依据。全系统覆盖按以下可复核口径完成：

- Server：`ErrorCode` 实现枚举全量枚举（5/127 条已逐条读出原文）；`GlobalExceptionHandler` 9 个出口逐条核对；`sw-security` 4 个响应写出点逐条核对；按模块遍历全部 Controller 与错误枚举；`throw new` 共 1183 站点的可见性按异常类型分区（`BaseException`/`IllegalArgumentException` 可见，`IllegalStateException`/`RuntimeException` 默认不可见，Controller 显式 `catch` 再 `R.fail` 的逐处标注）。
- Web：`foundation/request` 5 条归一管线与 37 键兜底表逐条读出；354 个 `ElMessage`/`ElMessageBox` 调用点按规则归并并给出代表性证据；229 个含 CJK 文件按模块清点；i18n 键数与消费点实测为 0；EP 本地化实测缺失。
- 码空间用脚本做集合交集/去重验证（得出 2101-2104 交集与 2415 重复），非人工目测。
- 无法覆盖的边界已在 §2.3 与 §9 显式声明，未把推定写成已确认。

本回传为只读探索结论，不构成产品方向，也未在任何代码仓、迁移、测试、文案资源或远端状态上产生修改。
