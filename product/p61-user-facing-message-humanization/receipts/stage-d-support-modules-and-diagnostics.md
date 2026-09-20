# P61 阶段 D 回执：支撑模块与受保护诊断

> 角色：执行（Executor）｜功能：`p61-user-facing-message-humanization`｜等级：XL
> 方向：`product/p61-user-facing-message-humanization/ready/direction-p61-user-facing-message-humanization.md` §6 阶段 D
> 日期：2026-09-15｜代码基线：Server `c15428f…`（0.1.0）
> 性质：**阶段回执**，不是功能级 completion receipt。

## 1. 阶段目标与内部 Step

方向 §6 阶段 D：完成通知、任务、存储、IoT、Agent 和开放 API；特别关闭完整 Java 栈、
脚本/编译器原文、MQTT/第三方 HTTP 原文和设备可控 error 字段的暴露，同时保持授权运维可定位。

| Step | 内容 | 状态 |
|---|---|---|
| D1 | **完整 Java 栈不再经任务日志接口外显（探索 P61-S-JOB-01，S1）** | 完成 |
| D2 | 任务执行失败给出安全结论 + 事件引用；任务配置类错误人性化 | 完成 |
| D3 | **持久化诊断文本统一脱敏出口 `DiagnosticText`**（栈帧/异常类名/绝对路径） | 完成 |
| D4 | IoT：脚本引擎诊断脱敏、发布前校验文案、MQTT 连接健康与测试结论、上报解析错误 | 完成 |
| D5 | 通知：投递失败原因脱敏（Facade / 重发 / 恢复投递） | 完成 |
| D6 | 开放 API：回调失败摘要按类别给出，不再透出 HTTP 客户端原文 | 完成 |
| D7 | Agent：执行失败摘要按异常类型分层（业务/传输/编排自身） | 完成 |
| D8 | 门禁与零残留扫描留档 | 完成 |

## 2. 实际修改文件与摘要

### 新增（2）

| 文件 | 摘要 |
|---|---|
| `sw-common/.../trace/DiagnosticText.java` | 持久化诊断文本的唯一清洗出口：去栈帧行、去异常类名前缀、把绝对路径替换为 `<path>`、折叠空白（并去除两汉字间多余空格）、截断。完整原文仍可经结构化日志 + `EventRef` 定位 |
| `sw-basic-agent/.../orchestration/AgentFailureSummarizer.java` | 执行失败摘要按**异常类型**分层：`BaseException`（平台业务）原样使用其安全文案；传输/服务商类（IO、HTTP 客户端、模型 SDK）替换为安全结论并写日志带引用；其余（编排器自身状态/校验失败）保留原文供图设计者定位 |

### 修改（7）

| 文件 | 摘要 |
|---|---|
| `sw-basic-job/.../scheduler/SwJobBean.java` | 失败时不再 `printStackTrace` 落库：`resultMsg` 改为安全结论，`exception_stack` 改存 `ref=<事件引用> category=SYSTEM_FAULT`；完整栈写 `log.error` 并绑定同一引用；BEAN/FLOW 配置类错误文案人性化（不再回显 beanName/flowDefKey） |
| `sw-basic-iot/.../script/ScriptEngineService.java` | 新增 `sanitizeDiagnostic`：GraalVM/javac/子进程失败文本先剥绝对路径再截断后落 `iot_script_exec.error` |
| `sw-basic-iot/.../service/IotScriptService.java` | 发布前校验失败改为可行动结论；引擎原文进日志 |
| `sw-basic-iot/.../mqtt/MqttBrokerManager.java` | 连接测试失败对外只给分类 + 安全结论（原样回显 broker/TLS 原文的路径移除），原文进日志；参数非法不再回显解析原文 |
| `sw-basic-iot/.../service/IotConnectionService.java` | 连接健康 `last_check_result`、连接失败异常经 `DiagnosticText` 清洗；认证/协议分类沿用 `getReasonCode()` 结构化判据 |
| `sw-basic-iot/.../service/MessageIngestService.java` | 上报解析错误 `parse_error` 经清洗落库 |
| `sw-basic-notify/.../impl/NotifyFacadeImpl.java`、`service/impl/NotifyRecordServiceImpl.java`、`service/impl/NotifyDeliveryRecoveryServiceImpl.java` | 投递/重发/恢复失败原因不再直出异常原文或类名 |
| `sw-biz-openapi/.../service/OpenApiCallbackDeliveryService.java` | 回调失败摘要改为 `category=…` + 可执行建议；HTTP 客户端原文（DNS 主机、TLS 细节、内网地址）只进日志 |

## 3. 实际命令与原始结果

证据：`receipts/evidence/p61-cd-01/scan-and-gate.txt`（§4—§9）。

| 命令 | 结果 |
|---|---|
| `MAVEN_OPTS="-Xmx2g" mvn -q compile` | exit 0 |
| `MAVEN_OPTS="-Xmx2g" mvn test` | **BUILD SUCCESS；TESTS=1400 / ERRORS=0 / SKIPPED=0 / FAILURES=0** |

关键零残留事实（main 源码）：

- `SwJobBean` 中 `printStackTrace` / `getStackTrace`：**零命中**；`setExceptionStack` 仅剩安全引用行。
- `DiagnosticText.sanitize` 复用点：IoT（MQTT / 连接 / 上报解析）、通知（Facade / 重发 / 恢复）共 6 处。
- `AgentFailureSummarizer` 复用点：编排执行、图执行、单步调试 3 处。

## 4. 与方向的偏差

1. **`exception_stack` 列语义改变（未做迁移）**。该列由「完整 Java 栈」改为「`ref=…` + 失败类别」。
   选择不改 schema 的原因：加列需要 Flyway 前向迁移并双库逐字节一致，而本列在本轮已无栈内容需求。
   代价是列名与内容不再字面一致，已在代码注释与本回执说明。**若规划要求列名与语义一致，需另立迁移**。
2. **Agent 编排自身失败仍保留原文**。图设计/调试场景下「循环迭代次数超限」「所有执行点已终止但未到达
   END 节点」等文案是设计者定位图的必要信息，且由本平台抛出、不含第三方细节。判别按异常类型而非文案。
3. **设备可控 error 字段未清洗**。`MessageIngestService:288` 附近设备上报的 `error` 属外部输入，
   按方向 §4 属「设备/第三方可控 error 字段」边界，**探索未覆盖项之一**，本阶段未动，
   需在阶段 F 前给出行为结论（见 §5）。

## 5. 未完成内容与风险

- **未完成**：
  - 探索边界「数据库种子/迁移用户文本」「文件超限真实响应」「设备/第三方可控 error 字段」
    三个未确认项仍未关闭（方向 §4 要求执行层在对应阶段关闭）。
  - 存储模块（`StorageFacadeImpl` / `StorageController`）文案未改写（多为 S3 级「文件不存在」「上传文件不能为空」）。
  - 任务模块 `JobInfoController` / `JobLogController` 的表单校验文案未改写（S3）。
- **风险**：
  - `AgentFailureSummarizer` 用类型名前缀判定传输类异常，依赖第三方类名不被混淆（当前未混淆）。
  - `DiagnosticText` 的绝对路径正则按常见形态覆盖，非常规路径形式可能漏替；已用 6 个测试钉死已知形态。
  - Job 日志的消费方（管理页面）此前展示完整栈，改为引用后**运维排障需要按引用查日志**——
    这是方向要求的语义变化，页面文案已在阶段 E/F 的 Web 工作中补齐指引。

## 6. Git diff 摘要

```
Server: 9 files changed（sw-common 1 新增；job 1；iot 4；notify 3；openapi 1；agent 2 新增/改）
未执行 commit / push / tag / Release；未修改迁移。
```

## 7. 与验收标准对照

| 标准 | 结论 | 证据 |
|---|---|---|
| 5. 受控注入标记零暴露（栈 / 脚本编译 / MQTT / 第三方原文） | **本阶段完成（支撑模块范围）**：完整 Java 栈、脚本编译器路径、MQTT/TLS 原文、HTTP 客户端原文均不再进入用户可达响应或管理列 | 扫描 §4—§7；全量门禁 |
| 14. 任务日志、IoT 解析/脚本错误、通知失败原因、SSO 审计与开放 API 回调记录按受众展示分类和脱敏摘要 | **本阶段完成（主体）**：任务日志 = 事件引用 + 类别；脚本/连接/解析/回调 = 分类 + 摘要；SSO 审计维持授权访问。**「无权限身份不能读取更深诊断」的越权回归证据待阶段 F** | `DiagnosticText` + 6 处复用；`AgentFailureSummarizer` |
| 6. 诊断可按同一事件引用定位 | **本阶段完成（异步任务场景）**：任务失败以 `job-<id>-<毫秒>` 为引用写入日志与日志行 | `SwJobBean` 改动 |

## 8. 未取得的行为证据（如实声明）

- 本阶段仍是**单元/集成测试证据**，未发起真实 HTTP 请求、未真实投递外部渠道。
- **未执行可见浏览器验收**（`headless=false`）。
- 探索遗留的三个未确认项（种子文本 / 文件超限 / 设备可控 error）未取得运行时行为结论。

## 9. 自验结论

阶段 D 的 8 个内部 Step 完成：完整 Java 栈不再外显；脚本/编译、MQTT、上报解析、通知投递、
开放 API 回调、Agent 执行失败的持久化诊断统一经脱敏出口；按异常类型分层的 Agent 摘要保留设计者可定位信息；
全仓门禁 1400/0/0/0。

**自验通过，不等同于规划验收。** 三个探索未确认项与存储/任务表单文案遗留项已如实列出。
本阶段不提请功能 PASSED、不核销 P61。
