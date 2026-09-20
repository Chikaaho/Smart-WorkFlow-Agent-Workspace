# P61 执行回执：R4a 支撑模块残留文案 + R8b 种子/迁移文本分类

> 执行角色：执行（Executor）
> 日期：2026-09-16
> 对应原子项：R4a、R8b（一级执行提示 01 §2）
> 证据目录：receipts/evidence/p61-r4a-r8b-01/

## 1. R4a：storage/job/IoT/Agent/notify/openapi 残留文案

**扫描口径**：六个支撑模块 main 源全部 .java；命中条件=「throw new / BaseException / message( / 字符串赋值」行中含中文，且同句出现内部泄漏特征（Exception、.class、Bean、SELECT/INSERT/WHERE、java.、com.sw、org.、.java、stackTrace）。

**结果：疑似内部泄漏 0 处**（`r4a-r8b-scan.txt`）。

**既有实现回读**（前轮已完成、本轮核实仍在位）：
- `OpenApiCallbackDeliveryService`：HTTP 客户端异常原文（DNS/TLS/内网地址）只进 `log.warn`；持久化到 `sw_openapi_callback_log` 的是 `callbackFailureSummary(e)` 分类摘要。
- `DiagnosticText`、`AgentFailureSummarizer`、`ScriptEngineService.sanitizeDiagnostic`、`MqttBrokerManager.safeDetail`、`SwJobBean`（exception_stack 只写 `ref=<eventRef> category=SYSTEM_FAULT`）。
- job 模块的「Bean 名称 / Spring Bean 名称」是任务表单的字段 label（设计者配置项），属正当文案而非泄漏。

**边界**：真实 Provider 成功链按补充提示明确不在本轮；设备/第三方可控 error 归 R8c。

## 2. R8b：种子/迁移用户文本分类

**扫描口径**：sw-basic / sw-biz / sw-bootstrap 全部 .sql（排除 target/）；逐行剔除 `--` 注释行后，匹配字符串字面量中的中文；含中文的文件逐个核对其 CJK 所在行。

**结果：DML/字符串中文命中 0 处**。全部 CJK 位于 `--` 头部注释（建表说明/约定文档），按路径与语法位置即可证明非用户文本。

**其他种子机制核查**：
- 不存在 data.sql / import.sql / seed*.sql。
- Java 种子入口 `JobStartupRunner` / `BpmDeployRunner`：中文仅出现在 `log.*` 调用（运维诊断层，正确承载）；`BpmDeployRunner` 在非 dev/test profile 跳过骨架部署，生产租户流程定义经正式发布链创建（dev/test 数据不进生产面）。

**结论**：迁移与种子层不存在需要治理的用户可见文本——这是对实际迁移目录的穷举扫描结果，非抽样推断。不涉及数据库改写。

## 3. 门禁

两份扫描脚本（`.p61-tmp/r4a-scan.mjs`、`.p61-tmp/r8b-scan.mjs`）原始输出存于 `evidence/p61-r4a-r8b-01/r4a-r8b-scan.txt`，可复算。

## 4. 状态

R4a 的「文案层」与 R8b 全部完成。R4a 的「受控标记注入 → API/持久化回读」行为验证与 R8c 合并推进（同一设备/消息对象），归 R8c 回执。
