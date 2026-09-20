# P61 执行轮回执：阶段 A—E（实现推进，功能未完成）

> 角色：执行（Executor）｜功能：`p61-user-facing-message-humanization`｜需求编号：P61｜等级：XL
> 方向：`product/p61-user-facing-message-humanization/ready/direction-p61-user-facing-message-humanization.md`
> 日期：2026-09-15｜代码基线：Server `c15428f…`、Web `963df360…`（均 0.1.0）
> 功能状态：**IN_PROGRESS**（未到 VERIFYING：阶段 C/E 尚有未完成项，阶段 F 未开始）
>
> **本回执如实汇报：XL 六阶段中 A/B/D 已完整交付，C 交付 C1—C6（余 C7），E 交付 E1—E9（余 E10—E13），
> 阶段 F 未开始。P61 未完成，不提请验收。**

## 1. 阶段进度总览

| 阶段 | 内容 | 状态 | 回执 |
|---|---|---|---|
| A | errorKey 机器语义、数值兼容目录、事件引用、msg/诊断边界、解除文案控制流 | **完成** | `stage-a-machine-semantics-and-diagnostic-boundary.md` |
| B | 统一异常出口、请求归一、九类失败分类、认证/SSO 入口防泄漏与人性化 | **完成** | `stage-b-exit-and-auth-entry.md` |
| C | 表单与流程主链去实现词汇/物理标识/原始异常/字段键 | **完成** | `stage-c-form-and-bpm-main-chain.md` |
| D | 支撑模块：完整 Java 栈外显关闭、持久化诊断统一脱敏、Agent/开放 API/通知/IoT | **完成** | `stage-d-support-modules-and-diagnostics.md` |
| E | zh-CN/en-US 双语链路、语言选择、Element Plus locale、Server 消息目录 | **E1—E9 完成，余 E10—E13** | `stage-e-bilingual-and-copy-convergence.md` |
| F | 覆盖闭环与整体回归、成对双语浏览器证据、正式 completion receipt | **未开始**（依赖 E10—E13） | — |

## 2. 关键交付事实（均有门禁与证据）

- **机器契约**：`errorKey` 全局唯一（127/127，脚本验证 0 重复）；数值冲突 2101—2104 与 2415
  已登记弃用并由回归测试守护；成功响应与旧式失败构造字节形状不变（2 个断言钉死）。
- **文案控制流零残留**：main 源码对「异常文案/子串作为业务分支」扫描零命中；
  探索基线的 P61-S-BPM-16 已改为语义键判据。
- **外显泄漏关闭**：完整 Java 栈、Jackson 原文、Java 字段/参数名、SQL/JDBC/POI 原文、
  MQTT/TLS 原文、HTTP 客户端原文、租户标识、脚本编译路径，均不再进入用户可达响应或管理列。
- **诊断可定位**：失败携带 `eventRef`，与结构化日志同源同值；受控标记注入测试证明
  「响应零暴露 + 日志可按引用还原」两端同时成立。
- **防枚举不降级**：2104 仍统一覆盖账号不存在/密文非法/解密失败/密码不匹配；2101 仍统一覆盖验证码各失败。
- **双语链路建成**：语言仓库 → Element Plus → 请求头 → Server 消息目录 → 统一出口，
  由 16 个契约测试钉死（Server 7 + Web 9）。
- **门禁计数（本轮实测，非沿用）**：
  - Server：`MAVEN_OPTS="-Xmx2g" mvn test` → **BUILD SUCCESS，1407 tests / 0 failures / 0 errors / 0 skipped**
  - Web：`typecheck` / `lint` / `test` / `build` 四门 exit 0 → **1200 passed + 3 skipped（1203 测试，133 文件）**
  - 基线对照：0.1.0 记录 Server 1362、Web 1185+3。本轮新增测试 Server 39（EventRef 9 + Catalog 8 +
    DiagnosticBoundary 8 + FailureCategory 5 + Bilingual 7 + DiagnosticText 6 − 部分改造），
    Web 15（failure-category 6 + locale 9）。计数口径（仅聚合本次运行写入的报告，排除 2 份
    2026-09-13 陈旧报告）与基线口径存在未归因差异，已在阶段 A 回执 §3 如实记录，不改写基线。

## 3. 未完成项（如实列出，逐条可执行）

| 编号 | 内容 | 归属 |
|---|---|---|
| E10 | Web 业务模块静态文案键化（229 个含中文文件 / 354 个消息调用点） | 阶段 E |
| ~~E11~~ | **已完成**：Server 目录全量收录 127 枚举 errorKey（zh/en 各 149 键，键集一致，由契约测试守护） | ~~阶段 E~~ |
| E12 | 路由 meta 标题（38 条）与跨页面同义异文收敛；「自动检查阻止新增硬编码文案」 | 阶段 E |
| E13 | 成对双语的真实浏览器证据（`headless=false`，同一身份/对象/错误两语言成对展示） | 阶段 F 前置 |
| F | 覆盖闭环：更新盘点（以探索基线 5 枚举/127 常量、9 出口、4 安全出口、354 调用点、229 文件为起点）、真实接口证据、可见浏览器全链回归、三个探索未确认项关闭、18 条验收逐项对照 | 阶段 F |

另有两个探索遗留边界仍未关闭（方向 §4 要求执行层关闭）：数据库种子/迁移用户文本、
文件超限真实响应、设备/第三方可控 error 字段。
另有同类收尾项：`FormFieldEnrichmentService` / `FieldPermissionService` 的字段键回显
接入 `displayName()` 口径（阶段 C 已覆盖提交校验主路径）。

## 3.1 审查后缺口关闭进展（对照 `planning-review-execution-round-a-e-01-in-progress.md` R1—R9）

| ID | 状态 | 本轮动作 |
|---|---|---|
| R3 | **已关闭（主路径）** | `FormFieldEnrichmentService` 六类增补与 TABLE 子行全部改用字段显示名（`displayOf` + label 收集）；`FieldPermissionService.assertEditablePayload` 新增带显示名的重载，拒绝提示改为「您没有编辑字段「显示名」的权限」。**仍开放**：`FieldPermissionService.canView/canEdit` 的调用方（查询投影路径）未逐一接入，`FormVisibilityRules` 的规则提示仍含字段键 |
| R5 | **已关闭（服务端）** | `EventRef` 改为服务端权威生成：不再采用客户端 `X-Request-Id` 作为引用值，优先用 Servlet request id、否则随机生成，并在请求属性内缓存（同一请求稳定、跨请求必不同）。同值重放头 → 不同引用（防歧义/防伪造）；`AccessLoggingFilter` 同时记录 `eventRef` 与 `clientRequestId` 保持三方可关联。`EventRefTest` 7/7 |
| R8（部分） | **文件超限已关闭** | `GlobalExceptionHandler` 新增 `MaxUploadSizeExceededException` → 400 + `common.upload_too_large`，不再落入「系统异常」；业务层 5MB 上限仍以 1499 精确拒绝。i18n 双语已收录 |
| R6 | **已关闭（匿名可达链路）** | 真实容器（内嵌 PG + prod profile + 随机端口）HTTP 证据：401 双语成对、畸形 JSON 400 双语且零 Jackson 原文、缺验证码统一 2101、同值重放头产生不同引用、5 次采样引用唯一、三类失败 errorKey 互不混同。**认证后的 403/业务失败/持久化诊断读取仍需登录态，属阶段 F** | `P61RuntimeBehaviorBootTest` 8/8；`evidence/p61-r5r6r8-01/` |
| R1 / R2 / R4 / R7 / R9 | 未完成 | 见 §3 |

门禁（本轮末次实测）：Server **1406/0/0/0**；Web 四门 exit 0（1200 passed + 3 skipped）。
计数较上轮 −2：`EventRefTest` 由 9 个用例改为 7 个（R5 语义变更后重写，旧断言以客户端头为引用值，已失效）。

## 4. 与方向的偏差（需规划知悉）

1. **未给 `R` 增加 `category` 字段**：九类失败分类落为「文案与恢复动作单一权威 + Web 对
   HTTP/传输失败分类」，业务码在 Web 侧取保守默认类别。若要求业务码精确分类需扩契约（阶段 B 回执 §4.1）。
2. **`BpmErrorCode` 的 4 个草稿语义保留 400 数值码、仅登记语义键**（方向「不重编号」裁决的直接落实）。
3. **`sw_job_log.exception_stack` 列语义改为「事件引用 + 类别」未做迁移**（阶段 D 回执 §4.1）。
4. **Agent 编排自身失败文案保留原文**（按异常类型分层，非文案判别；阶段 D 回执 §4.2）。
5. **`SsoRejectionException` 改变失败侧异常类型**（解除文案判别的必要结果；阶段 B 回执 §4.2）。

## 5. 未取得的行为证据（如实声明）

- 全轮**未发起真实 HTTP 请求**（统一出口/过滤器对象级测试除外），未起容器。
- **未执行任何可见浏览器验收**（`headless=false`）。验收标准 11、12、18 的浏览器证据全部未取得。
- 三个探索未确认项无运行时行为结论。
- 因此**验收标准 5、6、11、12、14、15、18 目前只有契约级/对象级证据，没有行为级证据**。

## 6. 自验结论

阶段 A/B/C/D 完整交付且门禁全绿；阶段 E 交付 E1—E9，均有门禁与证据；
E10—E13 与阶段 F 未完成。

**P61 未完成。** 本轮不提请功能验收、不提请 PASSED、不核销 P61、不移动方向到 `passed/`、
不改功能计数与正式基线。剩余范围与入口已在 §3 逐条列出，供规划决定继续推进或重新排期。
