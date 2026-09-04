# P58 流程节点能力完善 · 执行回执 02

- 执行日期：2026-09-03
- 执行角色：Executor
- 执行状态：`EXECUTION_SUBMITTED`
- 功能状态：`VERIFYING`
- 上游审查：`planning-review-p58-workflow-node-capabilities-02.md`
- 执行提示：`planning-execution-prompt-p58-workflow-node-capabilities-01.md`
- 本轮目标：按 G1—G8 补齐开发认证、认证后真实浏览器和可复核行为附件；不改变 Planner 的未通过裁决。

## 1. 版本与环境绑定

本轮未提交、未推送，证据绑定以下 checkout HEAD：

```text
root   develop-sw  5b44220cc33ea0e61ec2dab3034eece10e43f2f9
server develop     451bd9a2dd979db574fbdb2923f26881ea11af8d
web    develop     802971df711397a9d7c9bc20c6c8f5ba60ec70b0
```

正向行为使用隔离 dev 后端、H2 memory、端口 18082，以及三个独立 dev 前端端口 5174/5175/5176。管理员、操作者、查看者分别使用正式用户/角色/菜单权限链；认证接缝只注入内存中的 `test_<userId>` access token，不写浏览器持久化存储。

## 2. 本轮实现

### 2.1 开发认证接缝

- 前端新增 `src/foundation/auth/dev-debug.ts`，仅在 `import.meta.env.DEV` 且显式开关开启时初始化内存 access token。
- `src/main.ts` 在开发开关开启时先初始化 token，再挂载应用；生产构建不加载该模块。
- `.env.mock` 提供开发验收开关与真实用户 ID；默认 `.env` 与生产配置不打开该接缝。
- 后端继续执行 profile、显式开关、loopback、正式用户状态、租户、角色和菜单权限检查；接受/拒绝写结构化安全日志，不输出 token 全文。

### 2.2 任务详情低代码审批意见

- `TaskDetailRespDTO` 与 `/workflow/todo/{taskId}` 详情回读审批意见表单版本。
- `TaskDetail.vue` 真实渲染轻量 `TEXTAREA`、`SELECT`、`RADIO`、数字/日期等控件，提交 `opinionFormId`、`opinionFormVersion` 与 `opinionData`；后端仍是必填与版本校验权威。
- 本轮验证使用 `p58-opinion v2`，包含必填意见和风险等级字段。

## 3. G1—G8 独立证据包

附件目录：`product/p58-workflow-node-capabilities/receipts/attachments/`。每个附件均按提示要求保留 `GAP_ID`、输入 ID、身份/权限、profile/开关、命令、HTTP/DOM/Network、Flowable、业务数据、正向断言、零残留断言、退出码和清理结果；令牌与密钥已脱敏。

### G1 调试认证：部分证据完成，未功能级锁定

- `dev + debug-auth=true + loopback + 启用正式用户`：`/api/auth/me` 对 admin、viewer、operator 分别回读对应正式身份；viewer 可读取节点能力但创建流程为 HTTP 403，未变成管理员。
- 非法格式、未知用户、无认证均 HTTP 401；合法认证响应没有 `Set-Cookie` 或 `Authorization` 响应头。
- `dev,prod + 强制开关=true` 的启动日志为：`调试认证仅允许在 dev/test profile 使用，当前 profile 不满足 fail-closed 门禁`，18083 随后无监听。
- 关闭开关后同 token 的 `/api/auth/me` 与节点能力接口均 HTTP 401；独立新 H2 实例同时清空了正向运行态对象。
- 过滤器结构化日志覆盖 `DISABLED`、`INVALID_FORMAT`、`NON_LOOPBACK_SOURCE`、`USER_NOT_FOUND_OR_INACTIVE`、`IDENTITY_INFRASTRUCTURE_ERROR` 和正式身份加载成功。
- 尚未捕获真实运行态的非回环 HTTP 请求；`NON_LOOPBACK_SOURCE` 目前是过滤器原始测试日志，不能替代该证据。

附件：

- [g1-http-20260903-03.txt](attachments/g1-http-20260903-03.txt)
- [g1-prod-negative-20260903-03.txt](attachments/g1-prod-negative-20260903-03.txt)

### G2 设计与发布：部分证据完成，未功能级锁定

- 认证后的 admin 页面看到已发布 `P58 真实组合运行流程 20260903-03`；operator 页面看到同一流程待办入口，viewer 页面具备待办/流程读取权限。
- 同一 `formKey=p58_combined_runtime_20260903_03`、`processKey=bpm_0a1fb00cf221403c` 的定义真实保存、校验、发布并回读；校验响应 `data=[]`，发布状态 `PUBLISHED`，Flowable deployment/processDefinition ID 已回读。
- 回读图包含 `START/APPROVAL/CONSENSUS/CONDITION/COPY/NOTIFICATION/END`；BPMN 回读包含 consensus collection、并行会签和 serviceTask `nodeConfig` 扩展。
- 真实浏览器 DOM 已进入流程定义、待办和任务详情；browser-client 当前不提供 Network 事件读取，因此没有伪造浏览器 Network 附件。
- 四类选人全量交互、非法配置零写入及数据库前后值尚未形成完整原始包。

附件：[g2-browser-dom-20260903-03.txt](attachments/g2-browser-dom-20260903-03.txt)

### G3 普通审批与意见：部分证据完成，未功能级锁定

- operator 真实浏览器打开普通审批任务，DOM 显示 `p58-opinion v2`、必填意见文本域、必填风险等级下拉框；填写意见、选择 `LOW` 并执行通过。
- 同一实例回读普通审批历史：`APPROVE`、意见 `P58 浏览器意见 03`、风险等级 `LOW`、表单 ID/版本均在历史数据中出现；普通任务完成后生成两个会签任务。
- 页面动作后同时出现业务成功提示与通用“审批操作失败”提示；后端实例/历史已证明动作完成，但该 UI 矛盾保留为未闭环缺陷。
- 多人候选任一结算、重复/并发、其他候选失效、默认备注、显隐/联动、篡改拒绝、版本历史尚未完成矩阵。

附件：[g3-browser-opinion-20260903-03.txt](attachments/g3-browser-opinion-20260903-03.txt)

### G4 会签：仅 ALL 正向证据完成

- 同一组合实例创建两个独立会签任务：viewer `378eb318-a77f-11f1-9a47-66ff24301f3c`、operator `378f9d7c-a77f-11f1-9a47-66ff24301f3c`。
- viewer 先通过后 operator 任务仍保持活动；operator 再通过后实例 `status=APPROVED`、`activeNodeIds=[]`，每个身份使用独立认证浏览器会话。
- Flowable/API 轨迹包含并行会签任务和最终结算；viewer 详情回显当前审批人为 `P58 查看者 03`、`consensusTotal=2`。
- ANY、RATIO、阈值边界、提前不通过、RETURN、每人意见、取消任务、重复/并发尚未形成原始行为矩阵。

### G5 条件分支：仅 TRUE 正向证据完成

- 同一组合定义运行时回读 `form.amount > 0`，实例命中 TRUE 分支，轨迹为 `CONDITION(TRUE) -> COPY -> NOTIFICATION -> END`。
- DEFAULT 边已存在于已发布图中，但本轮没有同一发布定义的 FALSE/DEFAULT 运行证据。
- 多出口优先级、非法表达式、运行类型错误、失败记录和零残留未锁定。

### G6 抄送与通知：成功路径部分完成

- 同一实例产生 operator `WF_APPROVED` 通过通知、operator 组合通知、viewer `WF_TODO` 抄送消息，回读 `deliveryStatus=SUCCESS`；通知幂等键包含 instance/node/recipient。
- 抄送与通知经过统一业务入口，真实消息可按两个普通身份回读；未将第三方厂商发送伪装为成功。
- 抄送只读权限、退回/驳回通知、全员去重、隔离 Adapter 的成功/失败/超时/幂等完整矩阵尚未形成。

### G7 组合闭环：正向 API/浏览器链部分完成

- 同一链路固定为：

```text
processKey=bpm_0a1fb00cf221403c
businessKey=dcc7d58d-a04a-46e0-8eae-2cfb455cd6b4
instanceId=1f793b98-a77f-11f1-9a47-66ff24301f3c
ordinaryTask=1f7c9705-a77f-11f1-9a47-66ff24301f3c
consensusTasks=378eb318-a77f-11f1-9a47-66ff24301f3c,378f9d7c-a77f-11f1-9a47-66ff24301f3c
```

- 认证后真实浏览器完成普通审批详情与两份会签详情操作；Flowable/API 最终回读 `APPROVED`、无活动节点、轨迹到 End。
- 业务表单记录同一 businessKey 回读 `amount=250.000000`、`note=P58 G7 browser positive run 03`；通知和抄送记录同一 instance/node 关联。
- 页面动作存在通用失败提示；浏览器 Network、直接 SQL 前后值、拒绝链和退回链尚未具备，因此不能将该组合标为功能级通过。

附件：[g4-g7-runtime-20260903-03.txt](attachments/g4-g7-runtime-20260903-03.txt)

### G8 回归、迁移与清理：质量门通过，残留查询未锁定

- 后端全量：148 份 Surefire，`TESTS=1024 FAILURES=0 ERRORS=0 SKIPPED=0 EXIT=0`。
- Flyway focused（刷新当前模块依赖后）：嵌入式 PostgreSQL 17.5 验证 48 条并迁移到 v49；H2 验证 49 条并迁移到 v49；退出码 0。
- 前端：`typecheck=0`；`lint=0 errors, 39 warnings`；`test=117 files passed/1 skipped, 1107 passed/3 skipped`；`build=0`，`✓ built in 5.90s`。
- 生产构建扫描 `dev-debug|DEBUG_AUTH|test_[0-9]` 无命中，记为 `PRODUCTION_DEBUG_ENTRY=ABSENT`。
- debug-off 新 dev/H2 实例健康检查 HTTP 200；同 token 访问认证和节点能力均 HTTP 401；拥有的 18082/18083/5174/5175/5176 进程已停止并复核无监听。
- 本轮没有真实 PG 业务数据库连接，也没有逐表 `SELECT count(*)` 前后原始附件；H2 memory 重启清空运行态不能替代 Planner 要求的 PG 逐表零残留证明。

附件：

- [g8-quality-gates-20260903-03.txt](attachments/g8-quality-gates-20260903-03.txt)
- [cleanup-20260903-03.txt](attachments/cleanup-20260903-03.txt)

## 4. 当前未锁定缺口

以下内容本轮已实事求是保留为 Planner 待复核缺口：

1. 真实非回环运行态 HTTP、完整浏览器 Network 原始事件及浏览器请求头附件。
2. 四类选人完整设计交互、非法配置零写入与直接数据库前后值。
3. 普通审批多人候选任一结算、并发/重复/候选失效，以及意见默认值、显隐联动、篡改拒绝、版本历史。
4. 会签 ANY/RATIO、阈值边界、失败/RETURN/取消/并发矩阵和每人意见。
5. 条件 FALSE/DEFAULT/优先级/非法表达式/类型错误矩阵。
6. 抄送权限隔离、退回/驳回通知、通道 Adapter 失败/超时/幂等。
7. 认证后拒绝/退回终态的真实浏览器组合链；正向链仍存在 UI 通用失败提示待修复。
8. 真实 PG 业务库逐表前后计数与逐表零残留 SQL。

## 5. 清理与状态边界

- 正向运行使用的 H2 memory 实例已通过服务重启清空；debug-off 重放确认同一 token 立即失效。
- 关闭后的服务健康，但不保留验收用户、角色、表单、流程、任务及通知对象；拥有的测试服务和前端进程已停止。
- 未修改既有规划审查和旧回执，未移动方向到 `passed/`，未核销 P58，未声明功能 `PASSED` 或 `COMPLETED`。
- 工作区保留本轮代码、状态同步、附件和本追加回执，等待 Planner 独立复核。

## 6. Executor 结论

本轮已完成开发认证接缝、认证后真实浏览器正向链、低代码审批意见展示/提交、PG/H2 迁移门禁、前后端回归和可读取证据附件；但 G1—G8 仍有上述未锁定行为与持久化缺口，故按治理要求提交：

```text
EXECUTION_SUBMITTED
feature_status=VERIFYING
next_action=WAIT_PLANNER
```

