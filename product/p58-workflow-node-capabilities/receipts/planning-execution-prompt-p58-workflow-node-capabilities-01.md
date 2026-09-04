# P58 流程节点能力完善一级执行补充提示 01

> 指定角色：执行（Executor）  
> 功能状态：VERIFYING  
> 提示等级：一级（同类证据失败第 2 次）  
> 日期：2026-09-03

## 1. 权威输入

1. `product/p58-workflow-node-capabilities/ready/direction-p58-workflow-node-capabilities.md`
2. `product/p58-workflow-node-capabilities/ready/direction-p58-development-debug-auth.md`
3. `product/p58-workflow-node-capabilities/receipts/planning-review-p58-workflow-node-capabilities-01.md`
4. `product/p58-workflow-node-capabilities/receipts/planning-review-p58-workflow-node-capabilities-02.md`
5. `product/p58-workflow-node-capabilities/receipts/execution-receipt-20260903-debug-auth-01.md`

本提示不改变产品方向，只规定剩余缺口的唯一可接受证据。

## 2. 本轮唯一剩余缺口矩阵

| 编号 | 失败事实 | 不可接受证据 | 唯一可接受证据 |
|---|---|---|---|
| G1 | 调试认证只有摘要 | 单测名、配置截图、只测 admin、登录页、声称无验证码 | dev/test 真实 HTTP 正向与全部负向、两个不同权限普通用户、原始 headers/日志/存储零新增、非 dev/test 强开负向、关闭后同 token 失效。 |
| G2 | 设计/发布无认证浏览器全链 | API 脚本单独造图、Mock、BPMN 字符串摘要 | 认证后真实浏览器配置四类选人和全部 P58 节点；逐次 Network、graph_json 回读、发布/部署前后值、非法配置零写入。 |
| G3 | 普通审批与意见缺多人/低代码 | 单人动作、DTO/表存在、前端字段截图 | 两个普通候选、首个胜出与另一个失效、重复/并发；APPROVE/RETURN/REJECT；默认备注和自定义意见表单的必填、显隐、主表单联动、篡改拒绝、版本历史。 |
| G4 | 会签只做 ALL 正向 | 单参与人探针、Flowable XML、服务测试 | ALL/ANY/RATIO 各自通过与不通过；阈值边界、提前结算、RETURN、重复/并发、取消任务、每人意见和一致终态。 |
| G5 | 分支矩阵缺失 | 只有 CONDITION 节点出现在图中 | 同一发布定义运行两个条件路径及默认路径；优先级、非法表达式、运行类型错误、失败记录和部署零残留。 |
| G6 | 抄送/通知只有成功消息计数 | 只查消息总数、事件/Bean 存在 | 全员命中去重、抄送人只读权限、退回与驳回通知；通知节点；隔离 Adapter 成功/失败/超时/幂等及生产构建零残留。 |
| G7 | 组合链只有 API 正向 | 多个对象拼接、无浏览器、只到 End 不核业务状态 | 认证后真实浏览器以同一 processKey/businessKey/instanceId/taskId 完成正向和拒绝/退回链，勾稽 DOM、Network、Flowable、业务状态和数据库。 |
| G8 | 门禁与清理不是最终完整证据 | 退出码自述、旧输出、仅停止内存库 | 最终文件状态上的后端聚焦/全量、H2/PG、前端四门原始输出与计数；测试对象逐表清理和零残留查询。 |

## 3. 已锁定通过项和禁止重验项

暂无功能级锁定通过项。不得花篇幅重复实现文件清单、治理文件列表、登录页 DOM 或旧 H2 对象 ID；这些不核销任何 G 项。

## 4. 允许范围

### 允许读取

- 两端工程宪法、P58 主方向/补充方向/两轮审查与既有回执。
- P58 直接涉及的 BPM、认证调试接缝、表单/意见、通知、前端 workflow/notify、Mock 与测试文件。
- 为生成证据所需的数据库表、Flowable 历史/运行表和应用日志。

### 允许修改

- 仅限补齐 G1—G8 所需的 P58 任务内后端、前端、迁移、测试与开发调试配置。
- 新增回执及 `receipts/attachments/` 下的原始输出、截图索引和数据对照附件。
- 禁止写 P58 `PASSED/COMPLETED`、核销 P58、晋级正式基线或修改已归档 P57 结论。

### 允许命令与顺序

1. 记录根/Server/Web HEAD、分支、工作树和本轮允许差异。
2. 启动隔离开发后端与前端，显式记录 profile、调试开关、端口、数据库和进程 ID。
3. 完成 G1 调试认证全部正负向，确认两个普通用户身份和权限。
4. 通过真实前端注入 `test_<userId>`，由页面请求发出 `Authorization: Bearer test_<userId>`；以 `/auth/me` Network 和页面身份确认登录态，不要求验证码。
5. 严格按 G2→G7 执行同一批固定测试对象的浏览器/API/运行/持久化证据。
6. 清理测试对象并执行逐表零残留查询；关闭调试开关后重放同一 token 得到 401。
7. 在最终文件状态运行后端聚焦/全量、H2/PG 和前端 typecheck/lint/test/build，保存原始输出。
8. 最后重新记录 HEAD、工作树、端口/进程和生产产物零验证夹具结果，再提交追加式回执。

## 5. 浏览器登录的固定处理方式

- 不点击验证码登录，不等待人工会话，不直接在浏览器地址栏访问后端 API。
- 在 `dev` 前端中使用现有 token 注入/存储接缝写入 `test_<userId>`；若现有接缝无法令前端按标准 Bearer 头发送，只允许在开发构建范围补齐该接缝，生产构建必须零入口。
- 刷新真实受保护页面，保存 `/auth/me` 的请求头、响应体、状态码和页面用户身份 DOM；随后所有设计器/待办操作都在该会话完成。
- 切换用户时清除上一身份状态，再注入另一真实普通用户 token，并以 `/auth/me` 回读确认；不得复用同一会话自称双身份。

## 6. 每个缺口的独立证据包格式

每个 G 项单独一节，并提供：

```text
GAP_ID:
INPUT_IDS:
IDENTITY_AND_PERMISSIONS:
PROFILE_AND_SWITCH:
URL_OR_COMMAND:
RAW_OUTPUT_PATH:
HTTP_STATUS_AND_BODY:
DOM_ASSERT:
NETWORK_ASSERT:
FLOWABLE_BEFORE_AFTER:
BUSINESS_DB_BEFORE_AFTER:
POSITIVE_ASSERT:
ZERO_RESIDUE_ASSERT:
EXIT_CODE:
CLEANUP_RESULT:
```

不适用字段必须写明原因，不得省略。原始附件必须能从回执路径直接读取，不能引用会话临时输出或 `/tmp` 中会消失的文件。

## 7. 禁止事项

- 禁止再次以验证码、无既有会话、浏览器直接访问后端被拦截为停止理由。
- 禁止用 Mock、测试类名、Bean/表/字段存在、整理后的成功摘要替代真实行为。
- 禁止使用 super-admin 代替普通候选、审批人、抄送人和越权身份。
- 禁止伪造第三方真实发送；隔离 Adapter 必须清楚标注边界并在生产产物零残留。
- 禁止把多个历史对象拼成一条“同一实例”组合证据。
- 禁止只停止 H2 进程代替业务表清理与零残留查询。
- 禁止重复上轮主体、重新展开无关实现或改变产品方向。

## 8. 相对上一版新增/收紧约束

首次提示。新增的硬约束是：真实浏览器必须使用已授权调试认证完成登录态；G1—G8 必须各有独立原始证据包；组合链必须绑定同一组 ID；最终门禁必须在全部修正和清理之后运行。

## 9. 提交前自检矩阵

| 自检项 | 必须为“是” |
|---|---|
| G1—G8 是否各有独立证据包及可读原始附件？ | 是 |
| 是否至少使用两个独立普通用户真实权限会话？ | 是 |
| 浏览器是否已认证进入设计器和待办，而非停在登录页？ | 是 |
| 普通审批、会签三模式、分支三路径、抄送/通知是否全部有正负向？ | 是 |
| 审批意见低代码联动、篡改拒绝和历史版本是否真实发生？ | 是 |
| 同一组合实例的页面、HTTP、Flowable、业务库是否一致？ | 是 |
| 调试认证生产负向、关闭后失效和零正式 token/Cookie 是否成立？ | 是 |
| 最终前后端/Flyway 门禁和逐表清理是否在最后完成？ | 是 |

任一项为“否”时不得提交完成回执，应继续执行；只有遇到真实外部条件且独立路径已经穷尽时，才能按终态契约如实报告。

## 10. 合法终态

本轮完成全部 G1—G8 后提交 `EXECUTION_SUBMITTED`，功能仍为 `VERIFYING`，等待 Planner 复核。不得写 `PASSED` 或 `COMPLETED`。
