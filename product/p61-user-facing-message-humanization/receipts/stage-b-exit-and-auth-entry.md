# P61 阶段 B 回执：统一异常出口与认证入口治理

> 角色：执行（Executor）｜功能：`p61-user-facing-message-humanization`｜需求编号：P61｜等级：XL
> 方向：`product/p61-user-facing-message-humanization/ready/direction-p61-user-facing-message-humanization.md` §6 阶段 B
> 日期：2026-09-15｜代码基线：Server `c15428f…`（0.1.0）、Web `963df360…`（0.1.0）
> 性质：**阶段回执**，不是功能级 completion receipt。

## 1. 阶段目标与内部 Step

方向 §6 对阶段 B 的定义：完成统一异常出口、请求归一、通用错误分类、登录/会话/租户/SSO
的人性化与安全收敛，使未认证入口不再泄露内部原因，并保留可追踪诊断。

| Step | 内容 | 状态 |
|---|---|---|
| B1 | 九类失败分类词汇 `FailureCategory` + HTTP 层分类器 | 完成 |
| B2 | 统一出口 `msg` 边界落地（Jackson 原文 / Java 参数名 / Java 字段名不再进响应） | 完成 |
| B3 | 认证与 SSO 入口防泄漏（503 根因、回调原文、Provider 配置、白名单、租户标识） | 完成 |
| B4 | 登录/会话/租户/SSO 文案人性化并保持防枚举收敛 | 完成 |
| B5 | Web 请求归一（网络/超时/401/403/404/409/5xx 分级，不再塌缩为裸 AxiosError） | 完成 |
| B6 | 受控标记注入的行为证据（响应零暴露 + 日志可定位） | 完成 |
| B7 | 两仓工程门禁与证据留档 | 完成 |

## 2. 实际修改文件与摘要

### Server 新增（4）

| 文件 | 摘要 |
|---|---|
| `sw-common/.../exception/FailureCategory.java` | 九类失败语义（输入可修正 / 认证失效 / 权限不足 / 对象不存在 / 业务冲突 / 处理中 / 可重试基础设施 / 不可重试配置 / 系统故障），每类带默认结论、可重试标记与恢复动作；是语气与恢复动作的单一权威 |
| `sw-biz-system/.../security/SystemErrorKeys.java` | 认证会话、租户与 SSO 的 16 个稳定语义键；保留既有通用数值码不重编号 |
| `sw-biz-system/.../sso/SsoRejectionException.java` | SSO 用户可见拒绝：只承载安全结论 + 语义键，不承载 Provider 配置/租户标识/三方原文 |
| `sw-bootstrap/src/test/.../P61DiagnosticBoundaryTest.java` | 8 用例：受控标记注入 → 公共响应零暴露 + 日志可按同一 `eventRef` 定位 |
| `sw-bootstrap/src/test/.../FailureCategoryContractTest.java` | 5 用例：九类恰好齐备、分类与文案自洽（可重试类给时机、不可重试类不写「稍后重试」） |

### Server 修改（10）

| 文件 | 摘要 |
|---|---|
| `sw-common/.../ErrorCode.java` | 新增 `default FailureCategory getCategory()`，默认系统故障兜底 |
| `sw-common/.../CommonErrorCode.java` | 5 常量补 `FailureCategory`；文案按分类规则人性化（系统/参数/未认证/无权限/不存在） |
| `sw-common/.../GlobalExceptionHandler.java` | 400 三分支不再拼 Jackson 原文 / Java 参数名 / Java 字段名；校验分支改为业务化结论并把全部字段级失败（含 Java 字段名）写日志；全出口输出 `eventRef` |
| `sw-security/.../filter/JwtAuthenticationFilter.java` | 503 不再拼接 `cause.getMessage()`；根因与栈进日志并绑定 `eventRef` |
| `sw-security/.../filter/DebugAuthenticationFilter.java` | 503 统一走 `CommonErrorCode.SYSTEM_ERROR` 单一文案源 |
| `sw-security/.../handler/RestAuthenticationEntryPoint.java` | 401 给出统一安全结论 + 语义键 + `eventRef`（不区分缺失/过期/被撤销） |
| `sw-security/.../handler/RestAccessDeniedHandler.java` | 403 给出可行动结论 + 语义键 + `eventRef`，不披露所需权限点 |
| `sw-biz-system/.../sso/SsoAuthService.java` | 20 处用户可见拒绝改为类型化 `SsoRejectionException`；未认证路径统一结论，绑定冲突保留可行动文案但不披露对方账号身份；跨租户冲突不披露跨租户存在性 |
| `sw-biz-system/.../controller/SsoAuthController.java` | 6 个出口按语义键渲染；非类型化异常一律给统一结论，绝不回显 `e.getMessage()`；原始原因进日志并带 `eventRef` |
| `sw-biz-system/.../controller/AuthController.java` | 14 处失败补语义键；租户不可用、未提供刷新令牌、未登录、旧密码错误等文案人性化；**防枚举收敛不变**（账号不存在/密文非法/解密失败/密码不匹配统一 2104） |
| `sw-biz-system/.../service/RefreshTokenService.java` | 3 处刷新令牌失败补语义键并人性化 |
| `sw-biz-system/.../service/TenantValidityService.java` | 异常文案不再携带 `tenantId` |
| `sw-biz-system/.../security/LoginChallengeService.java` | `AuthException` 增 `getErrorKey()`，登录链前置校验可按键分流 |

### Web 新增/修改（2）

| 文件 | 摘要 |
|---|---|
| `src/foundation/request/failure-category.ts`（新增） | 与后端同一词汇的九类分类 + HTTP 状态映射 + 传输层（网络/超时）映射 + 可重试判定 |
| `src/foundation/request/index.ts` | `ApiError` 增 `category`/`errorKey`/`eventRef`；无响应（网络/超时）与有状态码的失败不再抛裸 `AxiosError`；读取后端新契约字段（旧后端不返回时行为不变） |
| `src/foundation/request/failure-category.spec.ts`（新增） | 6 用例：九类齐备、状态码互不混同、4xx 与 5xx 不混、网络与超时与系统故障区分、可重试标记与文案自洽 |

### 测试断言改造（6 个既有测试类）

`DebugAuthenticationFilterTest`、`NotifyTemplateSecurityIntegrationTest`、`RefreshTokenServiceTest`、
`SsoAuthServiceTest`、`BpmProcessTemplateServiceTest`、`I5PgTenantBehaviorBootTest`
——由「断言完整文案 / 异常类名」改为「断言 `errorKey` + 状态 + 不泄漏」，并新增反向排除
（不得出现依赖异常原文、类名、`DuplicateKeyException` 等）。

## 3. 实际命令与原始结果

证据：`receipts/evidence/p61-b-01/server-gate.txt`、`web-gate.txt`。

| 端 | 命令 | 结果 |
|---|---|---|
| Server | `MAVEN_OPTS="-Xmx2g" mvn -q compile` | exit 0 |
| Server | `MAVEN_OPTS="-Xmx2g" mvn test` | **BUILD SUCCESS；TESTS=1394 / ERRORS=0 / SKIPPED=0 / FAILURES=0** |
| Web | `pnpm typecheck` / `lint` / `test` / `build` | 四门 exit 0；**131 passed + 1 skipped（132 文件）；1191 passed + 3 skipped（1194 测试）** |

计数口径与阶段 A 相同（仅聚合本次运行写入的 surefire 报告，排除 2 份陈旧报告）。

## 4. 与方向的偏差

1. **`Category` 未上公共响应契约**。方向要求九类作为共享词汇，但未要求新增线上字段。
   本阶段把分类落为「文案与恢复动作的单一权威 + 客户端对 HTTP/传输失败的分类能力」，
   未给 `R` 增加 `category` 字段。代价：业务码（非 HTTP 形态）在 Web 侧取保守默认类别
   （不可重试、不归咎用户），文案仍由后端 `msg` 承载。**该取舍需规划确认**；若要求业务码也
   精确分类，需在后续阶段扩展响应契约。
2. **`SsoRejectionException` 改变了失败侧异常类型**（原为 `IllegalStateException`）。
   这是「解除文案判别」的必要结果：控制器不再靠异常文案分支。`bind` 并发竞争的
   `I5PgTenantBehaviorBootTest` 断言已同步为该类型，并保留「不得暴露原始 DuplicateKey」的反向断言。
3. **`CommonErrorCode` 5 条文案被改写**，`BpmProcessTemplateServiceTest` 相应由
   `hasMessageContaining("无权限")` 改为断言 `errorKey`。这是 §3.4「测试不得用完整文案承担唯一语义断言」的直接落实。

## 5. 未完成内容与风险

- **未完成（后续阶段范围）**：表单/流程/通知/任务/存储/IoT/Agent/开放 API 的模块级文案与
  原始异常治理（阶段 C/D）；服务器端消息目录与 locale（阶段 E）；Web 各模块本地映射收敛（阶段 E/F）。
- **未完成（阶段 B 内、需规划裁决）**：业务错误码的精确分类若需线上字段承载，须先扩契约。
- **风险**：
  - 改 `CommonErrorCode` 文案会改变所有通用出口文案。已通过 6 个测试类的断言改造与全量门禁确认无回归。
  - SSO 未认证路径统一结论会降低攻击者可见信息量（预期收益），但也降低了排障信息量——
    精确原因已进 SSO 审计与结构化日志，由 `eventRef` 关联。
  - Web `ApiError(0, ...)` 用于网络/超时（无 HTTP 状态），`code=0` 与后端成功码同值。
    调用方若仅看 `code` 可能误判，故同时提供 `category`；后续阶段应统一为专用码。

## 6. Git diff 摘要

```
Server: 14 files changed（另 4 新增：FailureCategory / SystemErrorKeys / SsoRejectionException / 2 测试类）
Web:    3 files changed（1 新增 failure-category.ts，1 新增 spec，index.ts 改造）
未执行 commit / push / tag / Release；未修改迁移。
```

## 7. 与验收标准对照（阶段 B 可关项）

| 标准 | 阶段 B 结论 | 证据 |
|---|---|---|
| 5. 受控注入标记在公共 API 零暴露 | **本阶段完成（出口与认证入口范围）**：Jackson 原文、Java 参数名、Java 字段名、栈、依赖原文、租户号在响应体零出现；日志保留完整原因 | `P61DiagnosticBoundaryTest` 8/8（含反向排除断言） |
| 6. 诊断可按同一事件引用定位 | **本阶段完成**：响应 `eventRef` 与日志 `eventRef` 同源同值，`EventRefTest` 覆盖取值与注入边界 | `P61DiagnosticBoundaryTest`、`EventRefTest` |
| 7. 首方登录防枚举收敛；未认证 SSO 不披露账号/租户/绑定/Provider 配置/三方原文 | **本阶段完成**：2104 统一覆盖账号不存在/密文非法/解密失败/密码不匹配；2101 统一覆盖验证码各失败；SSO 未认证路径统一结论，跨租户冲突不披露存在性 | `AuthController`、`SsoAuthService`、`SsoAuthController`；`SsoAuthServiceTest` 22/22 |
| 8. 网络/超时/401/403/404/409/5xx 可区分，加载失败不伪装空数据，失败不静默吞错 | **部分完成**：请求层分类与不回抛裸 `AxiosError` 已落地并有契约测试；**「加载失败不伪装空数据」与「失败不静默吞错」属 Web 各模块页面（阶段 E/F）** | `failure-category.spec.ts` 6/6 |
| 9. 可重试提示含恢复动作；不可重试不误导重复操作 | **部分完成**：分类规则与文案自洽由测试强制；**逐条模块文案待阶段 C/D** | `FailureCategoryContractTest` 5/5 |

## 8. 未取得的行为证据（如实声明）

- 未发起真实 HTTP 请求穿越完整 `DispatcherServlet`（本阶段用统一出口与过滤器的真实对象驱动，
  未启动容器）；契约级真实请求证据留待阶段 F 的整体回归。
- **未执行可见浏览器验收**（`headless=false`）。阶段 B 无新可视图元；统一回归在阶段 E/F 提供。

## 9. 自验结论

阶段 B 的 7 个内部 Step 完成：两仓门禁全绿（Server 1394/0/0/0；Web 四连 exit 0，1191 passed/3 skipped）；
受控标记注入证明公共响应零暴露且日志可按同一事件引用定位；认证与 SSO 入口不再输出内部原因；
Web 请求层对网络/超时/HTTP 状态分级且不再抛裸 `AxiosError`。

**自验通过，不等同于规划验收。** 功能级 completion receipt 待阶段 C—F 完成后提交。
本阶段不提请 PASSED、不核销 P61、不移动方向到 `passed/`。
