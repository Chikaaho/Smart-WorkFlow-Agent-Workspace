# P61 阶段 A 回执：机器语义与安全分层

> 角色：执行（Executor）｜功能：`p61-user-facing-message-humanization`｜需求编号：P61｜等级：XL
> 方向：`product/p61-user-facing-message-humanization/ready/direction-p61-user-facing-message-humanization.md` §6 阶段 A
> 日期：2026-09-15｜代码基线：Server HEAD `c15428f0002f6bb0ceeff05c7cbcf842bd3d3148`（0.1.0）
> 性质：**阶段回执**，不是功能级 completion receipt。功能级结论待阶段 B—F 完成后另行提交。

## 1. 阶段目标与内部 Step 概要

方向 §6 对阶段 A 的定义：形成 errorKey、数值 code 兼容目录、msg/诊断边界和事件关联能力；
解除文案控制流，消除 2101—2104、2415 与 1204—1208 对 Web 和新调用方的歧义。
「阶段通过不等于功能完成」。

| Step | 内容 | 状态 |
|---|---|---|
| A1 | `ErrorCode` 契约扩展：新增全局唯一语义标识 `errorKey` | 完成 |
| A2 | 5 个错误码枚举 127 常量显式登记 `errorKey` | 完成 |
| A3 | `BaseException` 携带 `errorKey`（含保留既有通用数值码的带键构造） | 完成 |
| A4 | `R` 响应新增可选 `errorKey` / `eventRef`，成功响应字节形状不变 | 完成 |
| A5 | 事件引用承载 `EventRef`（含客户端可控输入的安全边界） | 完成 |
| A6 | 统一异常出口接入 errorKey/eventRef + 诊断日志关联 + `msg` 边界规则落地 | 完成 |
| A7 | 解除文案控制流：BPM-16 前置 + 全系统零残留核对 | 完成 |
| A8 | 数值兼容/弃用目录 `docs/governance/error-code-catalog.md` | 完成 |
| A9 | 常驻回归测试（errorKey 唯一性、冲突登记、兼容形状、输入安全） | 完成 |
| A10 | 工程门禁（compile + 全量 test）与原始证据留档 | 完成 |

## 2. 实际修改文件与摘要

### 新增（4）

| 文件 | 摘要 |
|---|---|
| `sw-framework/sw-common/src/main/java/com/sw/ck/common/trace/EventRef.java` | 事件引用唯一解析入口：优先 `X-Request-Id`（与 `AccessLoggingFilter` 同源），缺省回退 Servlet 6 request id；对客户端可控输入做白名单字符与长度校验，非法一律丢弃；无请求上下文返回 `null` 不伪造 |
| `sw-framework/sw-common/src/test/java/com/sw/ck/common/trace/EventRefTest.java` | 9 个用例：合法头采用、缺省回退、注入字符拒绝、空白拒绝、超长拒绝、边界长度采用、无上下文返回 null、非法头+无服务端 id 返回 null、服务端 id 形状非法返回 null |
| `sw-bootstrap/src/test/java/com/sw/ck/bootstrap/ErrorCodeCatalogTest.java` | 8 个用例：errorKey 全局唯一且形式合法、数值冲突集合精确等于登记集合、冲突值确有不同 errorKey、保留语义键已登记、`BaseException` 携带 errorKey、成功响应字节形状、新式失败响应外显两字段、旧式失败构造不引入新字段 |
| `docs/governance/error-code-catalog.md` | 错误码与 errorKey 兼容目录：契约分层与硬规则、127 常量全量登记、数值冲突弃用登记、保留既有通用数值码的语义键、第三方判据来源登记、新增流程 |

### 修改（16）

| 文件 | 修改摘要 |
|---|---|
| `sw-common/.../exception/ErrorCode.java` | 新增 `String getErrorKey()`，javadoc 明确数值码不唯一、errorKey 唯一、不得按数值推断模块 |
| `sw-common/.../exception/CommonErrorCode.java` | 5 常量改为 `(code, errorKey, message)` 三元组，键为 `common.*` |
| `sw-common/.../exception/BaseException.java` | 新增 `errorKey` 字段；`ErrorCode` 构造自动取值；原始整数码构造为 `null`；新增 `(int, String errorKey, String message)` 保留既有数值码的带键构造 |
| `sw-common/.../response/R.java` | 新增 `errorKey` / `eventRef`（`@JsonInclude(NON_NULL)`）；新增四参 `fail`；javadoc 写明兼容契约 |
| `sw-common/.../exception/GlobalExceptionHandler.java` | 全部 9 个出口改为携带 errorKey/eventRef 并输出诊断日志；三个 400 分支不再把 Jackson 原文、Java 参数名、Java 字段名拼进 `msg`；`handleValidation` 改为回传业务化文案并支持多条失败聚合入日志 |
| `sw-biz-system/.../security/AuthErrorCode.java` | 4 常量改为三元组，键为 `auth.captcha_mismatch` / `auth.captcha_expired` / `auth.client_time_abnormal` / `auth.credential_invalid`；javadoc 登记 2101-2104 数值歧义 |
| `sw-biz-form/.../exception/FormErrorCode.java` | 47 常量改为三元组，键为 `form.*`；javadoc 写明 1204-1208 真实语义与 Web 兜底差异 |
| `sw-biz-bpm/.../exception/BpmErrorCode.java` | 61 常量改为三元组，键为 `bpm.*`；登记 2101-2104 与 2415 数值歧义；新增 4 个「保留既有通用数值码的语义键」常量 |
| `sw-biz-openapi/.../exception/OpenApiErrorCode.java` | 10 常量改为三元组，键为 `openapi.*` |
| `sw-biz-bpm/.../controller/BpmDraftController.java` | `resolveDraftProcessDefKey` 由「异常文案子串 `contains("尚未关联")` + 数值码」改为按 `BpmErrorCode.DRAFT_NO_ACTIVE_BINDING` 语义键判定 |
| `sw-biz-bpm/.../service/DraftSubmitService.java` | 4 处 `BaseException` 补上语义键（无有效绑定 / 绑定歧义 / 不可编辑 / 绑定已变更），数值码保持 400 不变 |
| `sw-biz-bpm/.../controller/BpmDraftControllerTest.java` | 2 处断言由「文案包含」改为断言 `errorKey`（断言强度提高，不再以文案承担语义） |
| `sw-basic-iot/.../mqtt/MqttBrokerManager.java` | 新增 `isAuthenticationFailure(Throwable)`：沿 cause 链读 Paho `getReasonCode()` 的结构化认证失败判据 |
| `sw-basic-iot/.../service/IotConnectionService.java` | 连接失败分类改用上述结构化判据 |
| `sw-basic-iot/.../script/GraalJsRunner.java` | 语句上限改用 `ResourceLimits.onLimit` 回调持有的本类标志，与异常描述文本解耦 |
| `sw-basic-agent/.../AgentOrchestrationServiceImpl.java` | 限流判定由 `contains("429")` 改为锚定解析消息开头的状态码（结构化 `RestClientResponseException` 分支仍优先） |

## 3. 实际命令与原始结果

原始输出留档：`receipts/evidence/p61-a-01/gate-raw.txt`、`contract-scan.txt`、`diff-stat.txt`。

| 命令 | 结果 |
|---|---|
| `MAVEN_OPTS="-Xmx2g" mvn -q compile` | exit 0（无输出） |
| `MAVEN_OPTS="-Xmx2g" mvn test` | MVN_EXIT=0，`BUILD SUCCESS`；surefire 报告聚合 **TESTS=1381 / ERRORS=0 / SKIPPED=0 / FAILURES=0**（228 份本次运行报告） |
| 定向：`mvn test -Dtest='ErrorCodeCatalogTest,EventRefTest,GlobalExceptionHandlerTest,BpmDraftControllerTest'` | sw-common 11/11；`BpmDraftControllerTest` 17/17（4 个 `@Nested` 子套件）；`ErrorCodeCatalogTest` 8/8 |

**计数口径与基线对照（如实记录，不推算）**

- 本次计数方法：聚合**本次运行写入**的 `target/surefire-reports/TEST-*.xml`。
- 显式排除 2 份陈旧报告（2026-09-13，未被本次运行覆盖）：`P45IsolationEvidenceFixture.xml`（源码存在但不匹配 surefire 默认包含模式，`mvn test` 不执行该夹具）、`DiagMigrationsTest.xml`（源码已不存在，历史残留）。若不做该排除，聚合值会虚高为 1385。
- `knowledge/current-status.md` 记录的 0.1.0 最终门禁为 1362。本轮新增测试 17（9+8），预期 1379，实测 1381。**差值 +2 未能归因**，不排除基线口径与本轮聚合口径不同。本回执以实测 1381/0/0/0 为阶段 A 事实，不声称与 1362 逐项可比，亦不改写 0.1.0 基线记录。

## 4. 与方向的偏差

1. **`GlobalExceptionHandler` 的 `msg` 净化在阶段 A 即落地**。方向把「完成统一异常出口」列为阶段 B。差异原因：`msg`/诊断边界是阶段 A 的明列目标，而该出口正是边界的实现点，二者不可分割。阶段 B 仍保有「请求归一、通用错误分类、登录/会话/租户/SSO 人性化与安全收敛」的完整范围，未被本阶段侵占。
2. **新增 4 个「保留既有通用数值码的语义键」**。这些语义在 0.1.0 已以 `CommonErrorCode.PARAM_ERROR(400)` 外显。为同时满足「不重编号既有数值码」与「可跨模块唯一识别」，采用保留 400 数值 + 登记唯一 `errorKey` 的方式，而非新增枚举常量（后者会把 400 变成新登记冲突值）。已登记在目录 §4。
3. **1204—1208 的 Web 侧对齐未在本阶段执行**。方向 §6 把「消除 1204—1208 对 Web 和新调用方的歧义」列入阶段 A。本阶段已固定服务端码义并写入目录与枚举 javadoc；Web 兜底表与表单本地预检的改造需在 Web 仓进行，归属后续阶段的 Web 工作，本阶段只完成了服务端一侧与契约声明。

## 5. 问题、未完成内容与风险

- **未完成（本阶段范围外，已在后续阶段范围）**：
  - 原始整数码 `BaseException` 站点（main 源码 23 处，分布于 agent / iot / system）仍无 `errorKey`，调用方只能按数值处理。属阶段 B/D 的模块治理范围。
  - Web 侧 `error-code-map.ts` 的 1204—1208 修正、2101—2104 安全兜底、`ApiResponse` 双字段契约尚未落地。
  - `msg` 文案本身的人性化改写（表单/流程/通知/IoT/Agent 等模块）与双语属阶段 B—E。
- **风险**：
  - `X-Request-Id` 回显面扩大（响应体新增 `eventRef`）。已用白名单字符 + 长度上限 + 非法即丢弃消除响应/日志注入；`EventRefTest` 有 8 个针对性用例。
  - `R` 增加字段属对外响应形状变化。已用 `@JsonInclude(NON_NULL)` 使成功响应与旧式失败构造字节不变，并有 2 个断言钉死。
  - agent 限流判定仍依赖 Spring AI 的消息格式（该库不暴露结构化状态码）。已收紧为开头锚定解析并登记判据来源，未伪装为已完全结构化。

## 6. Git diff 摘要

```
16 files changed, 374 insertions(+), 168 deletions(-)
新增（未跟踪）：docs/governance/error-code-catalog.md
              sw-bootstrap/src/test/java/com/sw/ck/bootstrap/ErrorCodeCatalogTest.java
              sw-framework/sw-common/src/main/java/com/sw/ck/common/trace/（EventRef.java）
              sw-framework/sw-common/src/test/java/com/sw/ck/common/trace/（EventRefTest.java）
```

未执行 commit / push / tag / Release；未修改迁移、配置或 Web 仓。

## 7. 与验收标准对照（阶段 A 可关项）

方向 §7 共 18 项，阶段 A 只可关下列项；其余按阶段推进，不得提前声称通过。

| 标准 | 阶段 A 结论 | 证据 |
|---|---|---|
| 1. 响应继续兼容 code/msg/data；新调用方可用全局唯一 errorKey 区分同码不同义 | **本阶段完成部分**：成功响应与旧式失败构造字节形状不变（2 个断言语料）；errorKey 全局唯一（127/127，0 重复）；同码不同义已由不同 errorKey 区分（5 个冲突值逐一验证） | `ErrorCodeCatalogTest` 4 个用例；`contract-scan.txt` §A |
| 2. 2101—2104 与 2415 每个语义均有独立 errorKey；新错误没有继续复用已知冲突值 | **本阶段完成（服务端侧）**：8 个语义各有独立键；冲突集合精确等于登记集合，新增冲突会被测试拦截。Web/Mock/自动化侧的改造属后续阶段 | `ErrorCodeCatalogTest.duplicateNumericCodes_shouldMatchRegisteredRegistry`；目录 §3 |
| 4. P61-S-BPM-16 不再按文案子串决定业务行为；全系统无其他残留 | **本阶段完成**：main 源码对「异常文案/子串作为业务分支」的扫描零命中；旧判据零命中，新判据为语义键 | `contract-scan.txt` §B、§C |
| 5. 受控注入标记在公共 API 与普通用户 DOM 零暴露 | **本阶段部分**：出口已不再把 Jackson 原文/Java 参数名/Java 字段名拼入 `msg`。其余注入面（SQL/栈/Provider/tenantId 等）属阶段 B—D | `GlobalExceptionHandler`；§8 待补真实请求证据 |
| 16. 以探索基线生成更新盘点；新增/已治理/保留/排除可复算 | **本阶段部分**：错误码维度已完成可复算登记（127 常量、122 唯一数值、5 冲突）。Web 354 调用点与 229 文件的盘点更新属后续阶段 | 目录 §2/§3/§4 |

## 8. 未取得的行为证据（如实声明）

- 本阶段只跑了**单元/集成测试门**，**未发起真实 HTTP 请求**，因此验收标准 5、6 的「受控注入 → 公共 API 零暴露 + 受保护诊断可定位」**尚未取得运行时证据**，属阶段 B（含真实请求证据）范围。
- **未执行可见浏览器验收**（`headless=false`）。阶段 A 无可视 UI 交付物，浏览器证据在阶段 E—F 的统一回归中提供。

## 9. 自验结论

阶段 A 的全部内部 Step 完成；`mvn compile` 与 `mvn test` 均 exit 0，1381 tests / 0 failures / 0 errors / 0 skipped；errorKey 唯一性与数值冲突登记由常驻回归测试守护；文案控制流在 main 源码零残留。

**自验通过，不等同于规划验收。** 功能级 completion receipt 待阶段 B—F 完成后提交，届时逐项对照全部 18 条验收标准。本阶段不提请 PASSED、不核销 P61、不移动方向到 `passed/`。
