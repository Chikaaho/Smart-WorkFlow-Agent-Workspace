# P58 流程节点能力完善二级执行补充提示 02

> 指定角色：执行（Executor）  
> 功能状态：VERIFYING  
> 提示等级：二级（一级提示后同类失败）  
> 日期：2026-09-03

## 1. 权威输入

1. `product/p58-workflow-node-capabilities/ready/direction-p58-workflow-node-capabilities.md`
2. `product/p58-workflow-node-capabilities/ready/direction-p58-development-debug-auth.md`
3. `product/p58-workflow-node-capabilities/receipts/planning-review-p58-workflow-node-capabilities-03.md`
4. `product/p58-workflow-node-capabilities/receipts/planning-execution-prompt-p58-workflow-node-capabilities-01.md`
5. `product/p58-workflow-node-capabilities/receipts/execution-receipt-20260903-debug-auth-02.md`

## 2. 已锁定并从本轮删除的内容

L1—L9 以规划审查 03 为准。不得重新提交：已有 viewer/operator 身份差异、混合 profile fail-fast、debug-off 401、生产前端零入口、意见 v2 基本填写、ALL 正向、TRUE 正向、站内成功消息和正向后端到 End。除最终回归外，不为这些已锁定原子再次建立证据包。

## 3. 本轮唯一剩余缺口矩阵

| 编号 | 精确目标 | 正向断言 | 反向/零残留断言 |
|---|---|---|---|
| R1 | 调试认证剩余安全边界 | 停用用户恢复启用后可认证；浏览器身份只存在内存 token。 | 停用、软删除用户分别 401；真实非回环请求 401；localStorage/sessionStorage/cookie 无 `test_`；关闭开关后同 token 401。 |
| R2 | 四类选人与发布校验 | 真实浏览器分别配置 FIXED_USER、ROLE、EXPRESSION、ADAPTER，保存回读与运行解析结果一致。 | 每类至少一个非法配置被发布拒绝；流程定义/部署/绑定计数和 graph_json 在失败前后不变。 |
| R3 | 普通多人候选与意见剩余矩阵 | 两个候选均可见，首个有效动作唯一推进；默认备注、自定义意见联动/显隐/版本历史成立。 | 第二候选、重复及并发请求不重复推进；必填缺失、篡改版本/字段被后端拒绝；修复动作后成功/失败双提示。 |
| R4 | 会签剩余模式 | ANY 两人第一动作结算；RATIO 三人 67%，两票通过后提前通过；每人意见独立保存。 | ALL 任一 REJECT 不通过；ANY 第一 REJECT 不通过；RATIO 在剩余全通过也达不到阈值时提前不通过；RETURN 取消其余任务；重复/并发不重复计数。 |
| R5 | 分支剩余矩阵 | 同一已发布定义至少两个非默认条件与一个 DEFAULT，固定输入分别命中三条路径，轨迹记录优先级和输入摘要。 | 非法表达式/字段/类型发布拒绝且零部署；运行期类型错误形成受控失败，不静默走默认。 |
| R6 | 抄送与通知剩余矩阵 | 多策略命中同一用户时去重；收件人看到授权摘要；退回/驳回通知到发起人；隔离 Adapter 成功一次。 | 抄送人不能审批或看越权字段；Adapter 失败/超时有真实失败记录；同幂等键重放不重复发送；生产产物零验证 Adapter。 |
| R7 | 浏览器负向组合链 | 使用真实浏览器和独立普通用户分别完成一条 RETURN 链和一条 REJECT 链，页面最终状态与审批意见一致。 | 页面不出现成功/失败双提示；RETURN 不误终止，REJECT 不保留活动任务；所有表示层无 RUNNING/终态矛盾。 |
| R8 | PG 勾稽与最终收口 | 在隔离 PostgreSQL 上至少执行 R7 的一个完整业务链，保存业务表、BPM 表、Flowable 表、意见、抄送和通知的直接 SQL 前后值；最终质量门全过。 | 清理后所有固定前缀/ID 逐表 count=0；端口/进程为零；生产构建零调试入口/验证 Adapter；最终回归无失败。 |

## 4. 精确输入

- 本轮所有对象统一前缀：`p58_r2_`；所有实例和任务 ID 在产生后写入同一 `ids.env` 证据索引（只保存非秘密 ID，不保存 token）。
- 普通候选：两个不同普通用户；角色包含两人且其中一人同时被固定用户策略命中，用于去重。
- 主表单固定字段：`amount`（NUMBER）、`risk`（TEXT）、`applicantNote`（TEXT）。
- 意见表单至少两个版本：v1 默认/基础字段，v2 新增必填字段；联动把 `amount` 与 `risk` 初始化到意见字段，并设置一个基于 `amount` 的显隐条件。
- RATIO 固定三名参与人，阈值 67%；非法阈值固定为 0 和 101。
- 分支固定为：优先级 10 `amount > 100`、优先级 20 `amount < 0`、DEFAULT；输入 250、-1、0 分别命中三条路径。
- 渠道 Adapter 固定四场景：SUCCESS、FAILURE、TIMEOUT、同幂等键 REPLAY。

## 5. 允许修改文件范围

- Server：P58 直接涉及的 debug-auth、BPM participant/approval/consensus/condition/copy/notification、意见/审计、通知渠道、对应迁移和测试文件。
- Web：`src/foundation/auth/dev-debug.ts`、`src/main.ts`、workflow 设计器/任务详情、相关 contracts/API/mock/test 文件。
- Product：仅新增本轮 execution receipt、`receipts/attachments/` 原始证据和非秘密 `ids.env` 索引。
- 不得修改 P57 归档、规划验收结论、P58 状态为 PASSED/COMPLETED、正式计数或基线。

## 6. 允许命令及固定顺序

1. 记录三仓 HEAD/分支/工作树；修复 UI 双提示及 R1—R8 必要实现。
2. 启动隔离 PostgreSQL，运行迁移并记录连接目标、版本与初始逐表 count。
3. 启动 dev 后端/前端，记录 profile、开关、端口、PID；完成 R1。
4. 创建 `p58_r2_` 用户、角色、表单、意见表单和流程定义；完成 R2。
5. 严格按 R3→R6 执行，每个场景使用固定输入并立即保存原始输出，禁止最后凭记忆整理。
6. 完成 R7 两条浏览器链；每次页面动作记录时间、DOM、后端 access/auth 日志 requestId，并立即回读 API/Flowable/SQL。
7. 完成 R8 PG 直接 SQL 勾稽和逐表清理；关闭 debug 后重放；停止精确 PID 并检查端口。
8. 在最终文件状态运行 Server 聚焦/全量、Flyway H2/PG、Web typecheck/lint/test/build、三仓 diff-check 和生产产物扫描。
9. 写追加回执并逐项填写提交前矩阵；任一“否”不得提交。

## 7. 浏览器证据替代路径

browser-client 不提供 Network 事件时，每个浏览器动作必须同时包含：

1. 动作前后真实 DOM 文本或截图路径；
2. 同一秒级时间窗口的后端访问日志，含 method、path、status、requestId 和 debug userId；
3. 用该 requestId 或同一 task/instance ID 回读的 API、Flowable 与 SQL 结果。

三者齐全可替代 HAR；只提供 DOM 或只提供 curl 不通过。不得再次以 Network API 不可用为停止理由。

## 8. 每个剩余缺口的证据包

R1—R8 每项一个独立附件，必须填写：

```text
GAP_ID:
INPUT_IDS_AND_PREFIX:
IDENTITIES:
PROFILE_SWITCH_DB:
BROWSER_DOM_OR_SCREENSHOT:
ACCESS_LOG_REQUEST_IDS:
HTTP_RAW:
FLOWABLE_SQL_BEFORE_AFTER:
BUSINESS_SQL_BEFORE_AFTER:
POSITIVE_ASSERT:
NEGATIVE_ASSERT:
ZERO_RESIDUE_ASSERT:
COMMAND_EXIT_CODES:
CLEANUP_RESULT:
RAW_OUTPUT_PATHS:
```

## 9. 相对一级提示新增/收紧约束

- 删除 L1—L9，禁止重复已锁定原子。
- 将剩余范围原子化为 R1—R8，并固定用户数、比例、分支条件、表单字段、对象前缀和 Adapter 场景。
- 将不可用的浏览器 Network 要求替换为 DOM + access log requestId + API/SQL 三方关联。
- PG 不再只做迁移测试，必须运行真实 P58 业务链并直接查询业务/Flowable表。
- 正向组合链不再重验；只补 RETURN 和 REJECT 两条浏览器链并修复 UI 双提示。

## 10. 提交前自检

| 检查项 | 必须结果 |
|---|---|
| R1—R8 是否每项独立附件且字段齐全？ | 是 |
| 双提示是否修复，并有 RETURN/REJECT 页面结果？ | 是 |
| 四类选人及各自非法发布零写入是否齐全？ | 是 |
| 普通多人候选、意见联动/版本/篡改是否齐全？ | 是 |
| ANY/RATIO/失败/RETURN/并发矩阵是否齐全？ | 是 |
| 三条分支路径和发布/运行负向是否齐全？ | 是 |
| 抄送权限、拒绝通知、Adapter 四场景是否齐全？ | 是 |
| PG 业务链、逐表前后值和清理 count=0 是否齐全？ | 是 |
| 最终质量门是否在全部修正与清理后执行？ | 是 |

全部为“是”才允许提交 `EXECUTION_SUBMITTED`；否则继续执行或按机器契约如实报告真实外部阻塞。
