# P61 二级执行进展记录（R10 轮）— 非完成回执

> 执行角色：执行（Executor）
> 日期：2026-09-16
> 功能：p61-user-facing-message-humanization
> 任务等级：XL
> 唯一执行入口：receipts/planning-execution-prompt-p61-user-facing-message-humanization-02.md
> 证据根目录：receipts/evidence/p61-r10-01/
> **性质声明：本文件不是 completion receipt，不声明自验通过，不声明任何原子项已完成验收。**
> 按提示 02 §9，仍有授权内可执行项时不得提交完成回执；本文件只记录本轮已取得的原始结果与剩余项。

## 1. 本轮服务与工作树事实

| 项 | 值 |
|---|---|
| Server 构建 | `MAVEN_OPTS="-Xmx2g" mvn -o -DskipTests package` → `sw-bootstrap/target/bootstrap.jar`（复制到仓库根 `bootstrap.jar`） |
| Server 启动 | `SPRING_PROFILES_ACTIVE=dev` + `SW_DEBUG_AUTH_ENABLED=true` + 仓内 dev `SW_CIPHER_KEY` + 本地一次性 JWT/digest/RSA 密钥（口径同上一轮 `.p61-tmp/start-dev.sh`） |
| Server 进程 | PID 26400（采集时段内单一进程，H2 内存库） |
| Web 构建 | `vite dev`（`VITE_USE_MOCK=false`，代理 → localhost:8080），PID 41528 |
| 浏览器 | ZCode 内置可见浏览器（headless=false），主视口 1280×720，移动视口 390×844 |
| 身份 | A = `test_1`（admin，超级管理员）；B = 本轮创建的无角色用户；对端 = 本轮创建的普通用户 |
| **快照一致性** | **未达成。** 本轮在浏览器采集之后仍有代码修改（R2b/R7 缺陷修复），因此 R7-F 的「实现冻结 → manifest → 采集」顺序尚未满足，现有浏览器证据不构成最终快照证据。 |

## 2. 本轮已取得原始结果的项（均为真实工具结果，未达“完成”判定）

### 2.1 R2c-N —— 批量通知四项计数与安全逐项失败（实现 + 真实 HTTP + 真实 UI）

**实现**（Server）：

- 新增 `NotifyBatchItemFailure`、`NotifyBatchFailureCategory`；`NotifyBatchSendResp` 增加 `phase/totalCount/successCount/failureCount/processingCount/failures`，保留兼容字段 `recipientCount`。
- `batchSendWithOutcome`：站内信同步原子入口，`totalCount == successCount + failureCount + processingCount` 由服务端一次判定。
- `invalidRecipientFailures`：站内信与渠道两条路由共用同一无效对象判定。
- 控制器渠道分支把 TIMEOUT 计为「处理中」（已写入下次重试时间），配置类失败归 `CHANNEL_NOT_CONFIGURED`。
- i18n 目录新增 `error.notify.batch.*` 四条（zh/en）。

**实现**（Web）：`NotifyBatchSend.vue` 结果面板 + 结果计数全部取服务端返回值；locale 单源新增 8 键。

**真实 HTTP 原始结果**（`evidence/p61-r10-01/runtime-http.txt`，同一服务进程）：

| 场景 | 原始结果 |
|---|---|
| N1 站内信混合批次（合法 2 + 不存在 1） | `totalCount=3 successCount=2 failureCount=1 processingCount=0`，勾稽 `true`，`failures=[{recipientRef:"999999",category:"RECIPIENT_NOT_DELIVERABLE",errorKey:"notify.batch.recipient_not_deliverable"}]`，`recipientCount=2` |
| N2 同一失败 en-US | 计数完全相同；`errorKey` 不变；`message` 本地化为英文 |
| N3 结果回读 | admin 与对端各自真实收到本批次 2 条（收件箱命中数 = 成功数） |
| N4 渠道 SMS 正常 | `total=3 success=2 failure=1 processing=0` |
| N5 渠道 SMS 受控超时 | `total=3 success=0 failure=1 processing=2`（处理中来自真实 TIMEOUT 分类） |

**真实 UI 原始结果**（`evidence/p61-r10-01/r2cn-ui-result.json`，登录会话内真实操作，1280×720，en-US）：

```
Batch send result
Total 2  Succeeded 1  Failed 1  In progress 0
In-app delivery is synchronous, so this batch has no recipients in progress.
Failed rows: Recipients | Reason
  2100163023885492226 | This recipient is not deliverable. Remove it from the list and try again.
```

构造方式：真实选中 2 个接收人（服务端确认 2 人）→ 发送前删除其中 1 个用户 → 发送。失败项是真实的服务端判定，不是前端伪造。

**边界**：该页面的结果面板**视觉制品未采集成功**（见 §4）。面板文本与计数来自对话框 DOM 回读。

### 2.2 R2b —— 失败分类（组件 + 真实 HTTP 分类矩阵）

**实现**：新增 `LoadErrorState.vue`（分类结论 + 恢复动作 + 重试入口，配置/权限类不给重试按钮）；接入 `IotConnectionList.vue` 与 `form/views/FormData.vue`（后者此前 `errorMsg` 赋值后**从未渲染**，失败会渲染成空表）。`failure-category.ts` 增 `categoryRecovery`。

**真实 HTTP 分类原始结果**：401→`common.unauthenticated`、403→`common.forbidden`、对象不存在→`form.not_found`、请求体不可解析→`common.request_body_unreadable`、业务参数→`common.param_error`；采集 6 行得到 5 个互异 `errorKey`（`runtime-http.txt` B1—B6）。

**边界**：页面级九类矩阵（含网络中断/超时/客户端异常的真实页面渲染与「重试实际发出新请求并恢复」）尚未采集，归剩余项。

### 2.3 R4b-E —— 同一 eventRef 的响应↔受保护诊断一一对应

**原始结果**（`runtime-http.txt` E1—E4）：

- 公共响应：`status=400 errorKey=common.request_body_unreadable eventRef=req-b7f2acf2799f875d1055a5562a41b2fb`，零堆栈/类名/路径。
- 服务端受保护日志命中同一 eventRef **2 行**：诊断事实行（含 `cause=Unexpected end-of-input…`）与访问事实行（含 method/path/status/costMs）。
- 反向：身份 B 访问管理资源 403，响应体 `栈帧=false 内部包名=false 路径=false`。

### 2.4 R7 部分 —— 页面族成对采集（未含最终快照）

- **已采集**：27 个桌面路由族 + 2 个移动 H5 族，zh-CN 与 en-US 各一轮，共 **62 张 PNG**（`evidence/p61-r10-01/shots/`）与逐页 JSON 度量（`.tmp/r7-*.json`）。
- **成对断言结果**：所有页 `htmlLang` 与选择一致、`localStorage['sw.locale']` 同步、**零 locale 键名外显**、**零横向溢出**（`scrollWidth == clientWidth`）。
- **语言切换**：应用壳下拉真实点击 zh↔en 双向成功并持久化（刷新后仍生效）。
- **英文残留分类**：剩余中文均为运行时业务数据（登录用户姓名、角色名、部门名、字典标签、通知正文），按方向 §3.3「动态业务名称保持原值」判定为数据而非静态文案。

### 2.5 本轮由真实可见行为发现的三个真实缺陷（均已修复并复验）

| 缺陷 | 原始事实 | 修复 | 复验 |
|---|---|---|---|
| `/tool` 按钮文案混语 | 英文界面渲染 `新建Internal tool`：模板里 `新建` 前缀硬编码，且 `新建外部工具` 在目录中**根本没有键** | `agent.newExternalTool` 补键；`ToolList.vue` 改用 `agent.newInternalTool` / `agent.newExternalTool` | `/tool` 现渲染 `New internal tool`，零中文残留 |
| 英文界面显示中文菜单名 | `/openapi` 占位页显示 `开放接口`：`route.meta.title` 是建路由时固化的服务端快照，不随语言重新求值 | 路由 meta 增 `menuName`；`BlankPage.vue` 改走 `useNodeTitle()` 语义键解析 | `/openapi` 现渲染 `Open API`，零中文残留 |
| 批量发送无法选中 64 位 ID 接收人 | 页面「服务端确认人数」恒为 0、发送按钮始终禁用：`recipientUserIds.map(u => Number(u.id))` 把雪花 ID 截断成另一个 ID（`Number("2100163023885492226") = 2100163023885492200`） | 契约放宽为 `Array<number \\| string>`；页面按字符串原值透传（接收人与部门 ID 两处） | 同一用户现显示 `Server-confirmed recipient count: 1`，并可真实发送 |

### 2.6 工程门禁（本轮实际输出）

- **Web 12 项**全绿，退出码 0（`evidence/p61-r10-01/web-gates.txt`）：typecheck / lint / test / build / hardcode-gate / locale-single-source / dictionary-validate / key-coverage / term-audit / failure-audit / frozen-locale-audit / locale-reconcile。
- 测试计数：**134 文件通过 + 1 跳过；1212 passed / 3 skipped / 0 failed**（较审查 03 采信的 1207 +5，增量来自本轮新增的 R2c-N 常驻回归 `NotifyBatchSend-r2cn.evidence.spec.ts`）。
- **Server 侧全量门禁本轮尚未重跑**（代码已改：notify 模块）。已跑 `-pl sw-basic/sw-basic-notify/sw-basic-notify-biz -am test` → notify 模块 118 tests / 0 failures / 0 errors。

## 3. 逐条对照提示 02 §2 原子账本

| 原子项 | 本轮状态 | 依据 |
|---|---|---|
| R2b-H | **未关闭** | 组件已具备分类+恢复+重试；HTTP 层已证 5 类互异分类。页面级九类矩阵（网络中断/超时/401/403/404/409/5xx/客户端异常的真实渲染与重试恢复）未采集 |
| R2c-I | **未关闭** | 导入面板已显式呈现「处理中 0」与说明；缺真实混合导入批次（总量/成功/失败/处理中 + 逐行安全明细 + 与服务端回读一致） |
| R2c-A | **未关闭** | 审批面板已显式呈现「处理中 0」与说明；缺真实混合批量审批集合 |
| R2c-N | **接近关闭，仍标未关闭** | 四项计数、勾稽、安全明细、zh/en、真实 UI 面板均已有原始结果；结果面板视觉制品缺失，且需在最终快照下重采 |
| R3a-H | **未关闭** | 未做真实 HTTP 拒绝 + 页面 DOM + 内部 key 反向扫描 |
| R3b-H | **未关闭** | 同上 |
| R4a-S | **未关闭** | 未生成 11 类来源覆盖表 |
| R4a-A | **未关闭** | 未补五类受众载体的 A/B 行为矩阵 |
| R4b-E | **接近关闭，仍标未关闭** | 同一 eventRef 的响应↔日志一一对应已有原始结果；需在最终快照下重采 |
| R7-C | **未关闭** | 27+2 页面族 zh/en 已成对采集，但采集早于本轮后续代码修改，快照失效 |
| R7-P | **未关闭** | 无键名/404/空白页；但结果面板截图缺失、且快照失效需重采 |
| R7-F | **未关闭** | 未生成最终 manifest；采集后仍有实现变化 |
| R8c-D | **未关闭** | IoT 页面 DOM 未验证 |
| R9-I | **未关闭** | 未生成六类探索基线综合盘点 |
| R9-S | **未关闭** | 需在最终 manifest 下统一封装 |
| R9-C | **不具备提交条件** | 尚有授权内可执行项，按提示 02 §9 不得提交完成回执 |

## 4. 诚实边界与未完成内容

1. **快照一致性未达成**：浏览器采集发生于本轮后续修改之前。按提示 02 §5，必须先冻结实现、生成 manifest、重启服务、再采集，最后跑门禁；因此现有浏览器证据需在关闭剩余实现项后整体重采。
2. **批量结果面板视觉制品缺失**：该次 `tab.screenshot()` 因浏览器截图管线短暂阻塞连续失败；管线在导航后恢复。面板的计数与文案已由对话框 DOM 回读留存（`r2cn-ui-result.json`），但缺少同时点 PNG。
3. **模型无图像输入能力**：本会话模型的图像输入被宿主拒绝（`Read` 返回 “selected model does not support image input”），因此「无溢出/无遮挡/无混语」的本轮判定全部来自 DOM/页面上下文探针与 `scrollWidth` 比对，视觉制品仅供规划侧目视复核。这不是产品阻塞。
4. **剩余项**：R2b-H、R2c-I、R2c-A、R3a-H、R3b-H、R4a-S、R4a-A、R8c-D、R9-I，以及需要在最终快照下重采的 R2c-N / R4b-E / R7-C / R7-P / R7-F / R9-S，最后才是 R9-C 十八项回执。
5. 未触碰：远端分支/tag/Release、历史审查与历史失败附件、`memory/`、`knowledge/`、P60/0.1.0 发布事实。
6. 本轮创建的运行期对象（两个测试用户及其通知记录）随 dev H2 内存库进程销毁；对端用户已在构造混合批次时删除，删除与回读见 `runtime-http.txt`。

---

## 5. 补充（同一轮继续执行，非新回合汇报）

### 5.1 R2b-H 页面级九类矩阵已取得原始结果

见 `evidence/p61-r10-01/r2b-h-page-failure-matrix.md`。要点：

- 8 类失败在页面上均有可见错误态，且**无一渲染成空态**（`el-empty` 全为 false）。
- 恢复动作按类别分化：403「Ask an administrator for access」、404「Back to the list and refresh」
  均**不提供**重试入口（重试无意义的类别不诱导重复操作）；409/5xx/传输类提供重试。
- 401 走会话失效路径（清会话跳登录），与页内 403 拒绝态区分。
- **重试真实恢复**：清除注入后点击重试，请求日志新增一条非注入的 `GET /api/iot/connections`
  （总调用 2→3），错误态消失、页面恢复为正常加载态。
- 边界：客户端异常未单独构造页面探针（与 5xx 同归 `SYSTEM_FAULT`）。

### 5.2 R2c-I 存在方向↔契约冲突（需规划裁决）

**事实**：`FormImportExportService.importData` 明确采用**整批原子失败策略**
（`status.setRollbackOnly()`，任一行失败则零落库，`new ImportResult(rows.size(), 0, errorRows.size(), ...)`），
服务端注释与实现一致。因此「同一导入批次至少一项成功、一项失败」在现有契约下**结构上不可达**。

**本轮处置（未改契约）**：保留原子语义不变，只把展示改诚实——新增
`form.importAtomicRollbackNote`，当失败行数多于实际不合法明细时明示
「本次导入未落库 {failed} 行：其中 {invalid} 行不合法，其余为整批原子策略连带回滚」，
避免把「失败 N」读成「N 行都错」。四项计数仍勾稽。

**请求规划裁决**：若必须满足「同一批次部分成功」，则需要把导入从整批原子改为逐行提交，
这是业务语义变更（影响既有回滚保证与相关测试），超出执行角色可自行裁定的范围。

### 5.3 门禁复跑（FormData 改动后）

Web 12 项全部退出码 0，`Tests 1212 passed | 3 skipped`，`Test Files 134 passed | 1 skipped`。

### 5.4 仍未关闭项（保持不变）

R2c-I（方向冲突 + 真实混合批次不可达）、R2c-A（真实混合批量审批集合）、R3a-H、R3b-H、
R4a-S、R4a-A、R8c-D、R9-I，以及需在实现冻结+manifest 后整体重采的
R2b-H / R2c-N / R4b-E / R7-C / R7-P / R7-F / R9-S，最后是 R9-C。
Server 侧全量门禁（`mvn -q test`，基线 1418）本轮尚未重跑。

---

## 6. 补充（R3 验证轮）

### 6.1 R3a-H / R3b-H：发现新真实缺陷，未关闭

见 `evidence/p61-r10-01/r3-field-display-name-finding.md`。要点：

- **根因定位**：服务层已按显示名构造消息（`FormDataQueryService:603/610`、`FormVisibilityRules:95`），
  但 `LocalizedMessages.text(errorKey, 字面量)` 在目录命中时**以目录文案为权威**，而目录条目是
  **无参通用句**（如 `该字段类型不支持筛选`）。因此显示名细节在真实响应中**必然丢失**——
  上一轮 R3a/R3b 的显示名改造在真实路径上**失效**；单测通过是因为单测直接断言异常消息，未经过目录覆盖层。
- **反向断言成立**：内部 key（content/salary/dept）零出现。
- **正向断言不成立**：四条消息均不含「内容」「月薪」「部门」中任何一个，用户无法知道是哪个字段出错。
- **本轮已实现的修复链**：`LocalizedMessages.textArgs` + `BaseException.messageArgs` +
  handler 参数分支（`javap -c` 已确认 `sw-common/target/classes` 字节码含 `getMessageArgs()` 分支）+
  目录 4 条参数化 + 两个服务传入参数。**运行期未生效**：全量 `mvn clean install`、删除并重建
  `bootstrap.jar`、重启后响应仍是未填充模板，说明 `getMessageArgs()` 在运行期为 null；
  该构建/制品一致性问题本轮未定位完成。
- **已做的回归防护**：参数化会让 `{0}` 直接暴露给用户（比原状更差），故已把 4 条目录条目
  **回退为无占位原文案**并重建复验，用户可见文本不再出现 `{0}`。
- **状态**：R3a-H、R3b-H 均**未关闭**；新增用户可见缺陷已登记。

### 6.2 本轮工程事故记录（如实）

调试过程中发现本仓构建存在**增量编译/打包漏更新**：修改 `sw-common` 源码后
`mvn -o -DskipTests package` 产出的 `sw-bootstrap/target/bootstrap.jar` 内嵌的
`sw-common-0.1.0.jar` 仍是旧内容（字节数与时间戳不变），必须 `rm` 掉 jar 或对相应模块
`clean` 后才更新。同一现象也出现在 `GlobalExceptionHandler` 的 `target/classes` 上。
最终快照生成时必须对相关模块 `clean` 并核验内嵌制品内容，不能只跑 `package`。

## 7. R3a-H / R3b-H 关闭（R10 第二轮）

### 7.1 上一节未定位问题的真正根因

1. **制品层误诊纠正**：上节「运行期 `getMessageArgs()` 为 null」的判断是错的。直接原因是
   `javap` 不带 `-p` 时会**静默省略 private 方法**——filter 校验方法恰为 private，导致上一轮
   从字节码里"看不到" 3-arg 构造调用，误判为制品陈旧。带 `-p` 重新核验 `bootstrap.jar` 内嵌
   两个 jar：`FormDataQueryService` 4 处 3-arg `invokespecial`、`GlobalExceptionHandler`
   `getMessageArgs` 分支、`FormVisibilityRules.invalid` 3-arg 均在制品内，参数链路没有断。
2. **代码层真缺陷**：`R.fail(code, errorKey, msg, eventRef)` 内部委托 `R.fail(code, msg)`，
   后者按 `error.<errorKey>` **再查一次目录并覆盖 msg**。GlobalExceptionHandler 已用目录+参数
   拼好的「字段「月薪」…」在 R.fail 里被无参通用句整体二次覆盖。服务端日志
   `message=字段「月薪」存在多条显隐规则…` 与响应体 `msg=表单定义配置异常` 并存，即此二次覆盖所致。

### 7.2 修复（均在 `sw-framework/sw-common`）

1. `R.failResolved(code, errorKey, msg, eventRef)`：终版文案不再二次解析；
   `GlobalExceptionHandler.handleBaseException` 改用之（其余 R.fail 调用方语义不变）。
2. `LocalizedMessages.textArgs`：目录条目无占位符而调用方传参时，优先调用方文案。
3. `LocalizedMessages.text`：目录条目含 `{n}` 而调用无参时回退调用方文案，`{0}` 永不透给用户。
4. 目录 `query_filter_field_unknown/not_filterable/op_type_mismatch` 三条参数化（zh/en），
   `definition_invalid` 保持无参通用句（约 20 处无参 throw 不受影响）。

### 7.3 复验（真实 HTTP，重启后 `p61-r3-battery.mjs`）

- A1 `字段「内容」（类型 RICH_TEXT）不支持筛选` / en `Field "内容" (type RICH_TEXT) cannot be filtered.`
- A2 `过滤操作符与字段「月薪」的类型不匹配` / en `That filter does not match the type of field "月薪".`
- A3 `过滤字段「p61nosuchfield」不在表单定义中`（回显用户自输串，非内部泄露）
- B1 `字段「月薪」存在多条显隐规则（每字段至多一条）`（zh/en 同文，args 细节优先）
- 内部 key 反向扫描全部命中 0；无参 key（`form.query_form_not_exist`）zh/en 仍正常本地化（回归防护实测）。
- **R3a-H 关闭、R3b-H 关闭**；详见 `evidence/p61-r10-01/r3-field-display-name-finding.md` §5。

### 7.4 运行环境事实（如实）

- 服务启动口径：`bootstrap.jar` 默认 `prod` profile（PG 5433，本机不可用）；本轮取证沿用的
  真实口径是 dev profile + H2 内存库 + `SW_CIPHER_KEY`/`SW_LOGIN_RSA_PRIVATE_KEY`（本地 dev 值），
  已固化为 `.p61-tmp/start-dev.sh`。dev 的 H2 随进程销毁，此前建好的表单已不存在，
  `p61-r3-battery.mjs` 自建自验不受影响；**最终快照重采时凡依赖既有表单/数据的取证脚本需先跑各自的 setup**。

## 8. R4a-S 十一类泄漏源覆盖（探针全绿）

- 覆盖表 + 探针设计见 `evidence/p61-r10-01/r4a-s-leak-source-coverage.md`；
  探针脚本 `p61-r4a-s-battery.mjs`（内置零依赖 STORED-zip 最小 xlsx 构造器）。
- 运行结果 `pass=10 fail=0`（探针 5/8/9 合并覆盖脚本编译原文、绝对路径、栈帧三源）：
  Jackson 原文、Java 字段名、SQL/JDBC、POI 导入、栈帧、Provider、tenantId、文件路径、
  脚本编译、MQTT、第三方原文 —— 公共响应唯一标记与噪声扫描全部零命中，
  机器可读结果 `.tmp/r4a-s-probe-results.json`。
- **探针发现并修复的真实缺陷（2 个）**：
  1. `MqttBrokerManager.testConnect` 只捕获 `MqttException/IllegalArgumentException`，
     JDK 21 下 Paho 反射 `java.net.URI` 抛 `InaccessibleObjectException` 使连接测试直接 500，
     「分类结论」契约被击穿。已补 `RuntimeException → PROTOCOL_FAILED` 安全分类（原文进日志）。
  2. 必填请求参数缺失（`MissingServletRequestParameterException`）落 500 系统异常；
     已在 `GlobalExceptionHandler` 补 400 `common.param_error` 受控分支（参数名只进日志）。
- **快照有效性**：阶段 A–D 注入证据产自更早快照，本轮 `R.failResolved`/`LocalizedMessages`
  改动后的公共响应以本节探针重跑为准；最终快照下按 R7-F 口径再跑一遍。

## 9. R2c-A 真实混合批量审批（HTTP 层闭环）

- 链路取证脚本 `p61-r2c-a-batch-approval.mjs`：建表单→发布→`POST /workflow/defs`→
  保存图（首节点 `DESIGNATED` 用户1）→发布→提交两个表单实例（流程启动异步）→
  轮询 `GET /workflow/tasks/todo` 取两个 taskId→`POST /workflow/tasks/batch-action`
  （1×APPROVE 成功 + 1×RETURN 无目标失败）→业务回读。
- 结果 `.tmp/r2c-a-results.json`：四项计数 `{total:2, success:1, failed:1, processing:0}` 勾稽成立；
  逐项下钻 `errorCode=2306 退回目标节点不合法`；处理中由服务端显式给出；
  回读待办成功项消失、失败项保留；响应无异常原文。
- **探针发现并修复的真实缺陷（3 处）**：
  1. `BpmBatchServiceImpl` 逐项 message 直用 `e.getMessage()`（未过目录解析，en 请求得到 zh 字面量）；
     `RuntimeException` 分支把未预期异常原文放进逐项明细（泄漏通道）。已改为
     `LocalizedMessages.textArgs` 解析 + `common.system_error` 安全分类（原文进日志）。
  2. `BpmOpsController` 批量响应缺 `processing` 维度。已补（同步契约显式 0）。
  3. 批量计数用 `long` → 全局 Jackson 的 Long→String 序列化（防雪花精度丢失）把计数变字符串；
     已改 int 保持数值类型。
- Web `BatchApproval.vue`/`api/i4.ts`/spec 同步改为消费服务端 `processing`（不再前端臆算 0）。
- 可见结果面板：`BatchApproval.vue` 结果对话框（testids `batch-approval-*`）在最终快照浏览器
  采集时随 R7-C 流程族一并成对取证。

## 10. R2c-I 真实混合导入 + R4a-A 五载体 A/B 矩阵

### 10.1 R2c-I（HTTP 层闭环，一处结构性冲突移交规划）

- 采证脚本 `p61-r2c-i-mixed-import.mjs`：下载官方模板（含签名）→ 内存解包/改写
  （「模板」sheet 追加 2 有效 + 1 无效行：NUMBER 字段填 `abc`）→ 重新上传。
- 真实结果：`totalRows=3, successCount=0, errorCount=1, processing=0`，
  逐行错误 `{rowNum:4, message:"字段「月薪」需要数字，当前填写的内容不是数字"}`（显示名存活），
  回读导入前后记录数 `0 → 0`（整批原子回滚，零落库）。
- 服务端补 `ImportResult.processing=0`（同步契约显式），Web `FormData.vue`/`api/form.ts`
  改为消费服务端值；`ImportResult` 类型同步。
- **结构性冲突**：完成条件「同批 1 成 1 败」与整批原子契约不可同时成立，
  详见 `evidence/p61-r10-01/r2c-i-import-atomic-finding.md`（其余断言全部闭环）。
- 附带登记（不扩权处理）：TEXT 字段声明的 `length` 在提交/导入链路均不校验
  （100 字符 dept 单条与导入均成功），属表单校验产品缺陷，移交。

### 10.2 R4a-A 五类受众载体 × 身份 A/B（6/6 全绿）

- 采证脚本 `p61-r4a-a-carrier-matrix.mjs`，机器可读结果 `.tmp/r4a-a-results.json`。
- C1 任务日志（IoT 设备命令，写回含栈/路径的受控失败结果）：A 读到 DiagnosticText 脱敏后
  摘要（无噪声命中）；B（无角色 `test_9101`）403。
- C2 IoT 脚本诊断（受控抛错脚本 dry-run）：A 经 `/iot/scripts/{id}/execs` 读到脱敏 error；
  B 403。
- C3 通知失败（SMS 渠道 + 不存在接收人）：A 响应含安全逐项失败 `RECIPIENT_NOT_DELIVERABLE`
  （category/errorKey，无原文）；B 记录视图 403、自己收件箱 200 仅本人可见。
- C4 SSO 审计（未认证 WECOM callback → REPLAY_REJECTED 审计行）：A 读到受控审计；
  B 403（权限 + 租户双隔离）。
- C5 开放 API 回调（HMAC 应用凭据 `i5-openapi-t100`，无 callback_url 受控失败 3 次）：
  应用凭据读到 `status=FAILED` + 安全 `responseSummary`；会话身份（含 superadmin，无凭据）
  一律 code=3002 拒绝 —— 受众隔离最严格的一环。
- 兜底：不存在用户 `test_99999` → 401 fail-closed。
- 过程修正（如实）：探针脚本首版的 language 枚举（JAVASCRIPT→JS）与 IoT 设备 `deviceKey`
  必填、通知批量字段名（`userIds`→`recipientUserIds`）为取证脚本侧错误，已修正并复跑。

## 11. 最终快照浏览器采集（R7-C/R7-P/R8c-D/R2b-H）+ 第二处契约缺陷修复

### 11.1 修复（冻结前最后一处，已纳入 manifest 再生成）

- **errorKey/msg 不一致缺陷**：`R.fail(2参)` 按数值码反查 errorKey（400→common.param_error），
  导致 GEH 全部 400 分支的**预解析文案被 param_error 目录句覆盖**（如 B4 响应 errorKey=
  `common.request_body_unreadable` 但 msg=「请求参数有误」）。已将 GEH 全部分支与
  `SsoAuthController` 21 处改为 `R.failResolved`（调用方解析权威）；SSO 字面量站点改为
  `text(语义键, 字面量)` 目录解析（目录已有 zh/en 条目）；`handleIllegalArgument` 改为
  目录安全文案（原文只进日志）。实测：B4 msg=「请求数据格式不正确，请检查后重试」与 key 一致；
  SSO 票据拒绝 msg=「登录票据无效或已过期，请重新发起第三方登录」+ key=`system.sso_ticket_invalid`。
- 连带：`I5SsoBindingSessionBootTest` 2 处断言引用旧字面量「租户无效或已停用/过期」，
  已改为断言稳定语义键 `system.sso_tenant_invalid`（该类单测复跑通过）。

### 11.2 R7-C/R7-P：28+2 页面族 zh/en 成对采集（全部通过）

- 采集会话：IAB 1280×720，真实登录（admin/admin123 + dev 验证码），`sw.locale` 切换 zh-CN/en-US。
- 28 个桌面页面族 + 移动 H5 两页（m_workflow/m_notify，桌面视口已登记）：
  每页 lang 属性正确、零横向溢出、零 locale 键名外显、动态业务名（DB 中文数据）显式登记。
  结构化检查：`final-capture-checks.json`；截图 `shots/final-zh-*.png` / `final-en-*.png`（62 张）。
- 错误页 403/404/500 双语零残留；收件箱等含中文为业务数据（收件人/标题），符合「动态业务名显式标注」。

### 11.3 可见结果面板（R2c-A / R2c-N）

- 批量审批面板（`final-zh-batch-approval-panel.png`）：勾选 2 任务 → 批量通过 →
  逐项结果对话框 `总量2/成功2/失败0/处理中0` + 同步说明 + 逐项明细
  （testids `batch-approval-total/success/failed/processing` 实测值一致）。
- 通知批量面板（`final-zh-notify-batch-result-panel.png`）：选 2 接收人（服务端确认人数=2）→
  发送 → 确认弹窗 → 结果面板 `总量2/成功2/失败0/处理中0` + 站内信同步说明。

### 11.4 R8c-D / R2b-H 最终证据

- R8c-D：`r8c-d-final-dom.md`（授权 DOM 零泄漏 + 未授权身份 404/403 全拦截，截图各 1）。
- R2b-H：`r2b-h-final-matrix.md`（8 类故障页面级矩阵 + 重试真实恢复验证 + 401 跳登录带 redirect）。

### 11.5 门禁（采集后运行，冻结后零实现变更）

- Web 12 门禁全绿：typecheck/lint/test(1212 passed|3 skipped)/build + hardcode-gate(0 未治理行)、
  locale-single-source、dictionary-validate、key-coverage、term-audit、failure-state-audit(0/0/0)、
  frozen-locale-audit、locale-reconcile —— `web-gates-final-recovered.txt`。
- Server 全量 `mvn -q test`：见 `server-gate-final.txt`（结果见 §12）。

## 12. 门禁终值与最终回执

- Server：`mvn -q test` EXIT=0；surefire 234 报告聚合 **tests=1422 failures=0 errors=0 skipped=0**
  （基线 1418 → +4：本轮新增 N1–N4 批量通知契约集成测试；`I5SsoBindingSessionBootTest` 2 处
  字面量断言更新为语义键断言，见 §11.1）。证据：`server-gate-final.txt`、`server-test-counts.txt`。
- Web：12 门禁全绿，vitest **1212 passed | 3 skipped**。证据：`web-gates-final-recovered.txt`
  （第一遍动态门禁明细从后台任务日志恢复，如实登记）、`web-gates-final2.txt`（8 项静态门禁，
  其中 failure-audit 首次误用不存在脚本名 `p61-failure-audit.mjs` EXIT=1，改用正确脚本
  `p61-failure-state-audit.mjs` 后 EXIT=0=0=0 三项零命中，已如实登记）。
- 最终回执：`completion-receipt-p61-r10.md`（十八条逐项对照，remaining_actionable_count=0，
  3 项移交规划裁决：导入原子契约、TEXT length 校验缺失、真实 Provider 成功链延期）。
- 证据索引：`evidence/p61-r10-01/r9-s-evidence-index.md`。
