# P62 openapi 回调产品缺口核实回传（2026-10-18）

承接 `search_task/p62-openapi-callback-product-gap.md`。核实时点：Server main=f58e3ae（本核实只读，未改代码/未并分支/未重启装置；0.1.7 发布身份保持 c6a7c06·b016b5cc）。

## 结论

**缺陷确认：真实生产路径缺口，非装置独有条件。** `08ed4c4` 修复的是正式代码在无请求线程租户上下文时的既有失效路径，生产与 CI 均已实证复现；建议按现行流程单独重落地（该提交两文件改动本身无装置耦合）并补回归断言；去留由规划裁决，分支保留。

## 事实链

**1. main 后台投递三路径与归属行为（读码）**
- 意图登记器（同步监听，发布线程/事务内）：按 `event.getTenantId()` 显式过滤应用、显式租户列写任务；请求/队列线程均有身份还原，正确。
- **提交后加速监听器（`@Async` AFTER_COMMIT）：异步线程无任何身份（纯 ThreadLocal，全仓无 TaskDecorator/传播配置），而 openapi 表不在 ignore-tables，租户拦截器无身份即 fail-closed 抛 `IllegalStateException`（"租户上下文缺失，拒绝生成租户过滤条件"）——查询即失败，投递一次都不会发生，且每次终态事件都记一条 ERROR 栈。**
- 恢复调度（`@Scheduled`）：扫描/回收用挂起＋显式过滤，逐任务 `withTenantScope(task 租户)` 还原权威身份后投递与落账——main 的 MUST_DELIVER 兜底路径归属正确、无跨租户行为。

**2. 生产实证（UAT，官方 main 代码，无此修复）**
- 轮转日志：`server.log-20261016` 该消息 10 次、`server.log-20261017` 5 次；async 未捕获栈 2＋1 条，均为 `SimpleAsyncUncaughtExceptionHandler ... OpenApiCallbackListener.onEvent(OpenApiCallbackListener.java:48)`，线程 `task-N`，Cause 同上 fail-closed 文本。
- 时间与业务对齐：栈出现于 10-15 17:04:13 / 17:50:41，与库内真实回调任务创建时间一致（`sw_openapi_callback_task` 3 条 RETRY_EXHAUSTED，attempts=5；`sw_openapi_callback_log` 45 条，10-15 17:04→10-16 13:01）；UAT 库现 1 个回调应用（tenant 0）。即：发布线程登记成功（有身份），加速监听即刻失败，恢复调度随后兜底——解释了"现网投递未见异常"。

**3. CI 实证（与制品 CI 同 run）**
- 制品 CI 成功 run `39115050365`（c6a7c06，**success**）日志中同样出现该 ERROR 栈（`task-3` 线程、`OpenApiCallbackListener.onEvent:48`）。
- 覆盖判定：P4 测试以 `sw.form.enabled=true` 引导（`@EnableAsync` 生效），`Phase4PgCommitBoundaryBehaviourTest` 在事务内真实发布终态事件 → 与生产同路径同条件；但无任何断言检查监听器结果（`Phase4PgDeliverySeamBehaviourTest` 直接驱动登记器＋恢复 Job，不走监听器）。**结论：现有 CI 覆盖了同一路径与条件，但该失败不被断言，绿 run 内静默发生。**

**4. 装置条件判定**
- 非装置独有：生产（10-15/16/17）与 CI（10-18）双重复现，根因（异步线程无身份＋表未豁免＋fail-closed）与装置无关；RA06b"454 次/窗"仅是高频事件下首次被计数之处。

**5. 两租户归属（正反结论）**
- 修复前：监听器 fail-closed，无投递也无跨租户读写（失败即拒绝，非串租户）。
- 若重落地 08ed4c4：挂起窗口内全部语句均显式定域——应用查询 `event.getTenantId()` 过滤；成功去重按全局唯一 appId＋事件＋业务对象；落账显式租户列；窗口有界且无第二租户数据入口 → 两租户事件各自归属正确、无跨租户读写。事件租户为发布处显式权威值（actor/实例），缺失即发布侧抛错。
- 修复形态与 main 既有范式同构（恢复调度即"挂起＋显式范围＋身份还原"）。

## 限制与未决

- 未运行新负载、未真实向外部用户投递、未使用线上数据改写验证；仅只读核实＋既有日志/测试事实引用，不回传源码或 diff 正文。
- CI 证据来自既有 run 日志（本回执描述性引用，未外传日志原文）。
- 重落地去向（今轮仅裁决"是否重落地"）与回归测试设计待规划；当前发布候选不变。

---

2026-10-18 追加：规划已裁决独立重落地（`planning-review-close-maintenance-017-02.md`），修复已交付并随 0.1.7 第二次同版本覆盖发布（`00e0a73`·`d8b390c1`；两租户正确性经真实 PG e2e 实测通过）。回执 `product/0.1.7-bugfix/receipts/openapi-callback-017-01.md`。
