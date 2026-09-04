# P58 流程节点能力完善三级零裁量提示 03

> 指定角色：执行（Executor）  
> 功能状态：VERIFYING  
> 提示等级：三级零裁量  
> 日期：2026-09-03

## 1. 权威输入

1. `product/p58-workflow-node-capabilities/receipts/planning-review-p58-workflow-node-capabilities-04.md`
2. `product/p58-workflow-node-capabilities/receipts/planning-execution-prompt-p58-workflow-node-capabilities-02.md`
3. `product/p58-workflow-node-capabilities/receipts/execution-receipt-20260903-debug-auth-03.md`

只处理 Z1—Z9。L1—L16 全部删除，不得再次提交其主体。

## 2. 总门禁

- 所有原始输出必须保存到 `product/p58-workflow-node-capabilities/receipts/attachments/z*-20260903-05.*`；禁止引用 `/tmp`、`/private/tmp`、终端滚动区或不可读外部文件。
- `ids-z1-z9.env` 必须包含本轮所有非秘密 user/role/form/opinionForm/definition/processKey/deployment/business/instance/task/message ID。
- 每个 Z 项一份独立证据包，必须同时包含正向目标断言和反向零残留断言。
- 任一 Z 项缺字段、引用临时路径、只有摘要或自检为“否”，不得提交回执。

## 3. Z1—Z9 唯一证据包

### Z1 证据持久化与 ID 索引

执行动作：重新执行 Z3—Z9 所需最小场景；把命令 stdout/stderr、HTTP headers/body、access log、SQL 输入输出直接保存到工作区附件。创建 `ids-z1-z9.env`。

通过条件：附件中引用的每个路径均位于 receipts/attachments 且可读；ID 索引字段齐全，回执中的每个对象都能反查。

零残留断言：`rg '/private/tmp|/tmp/'` 对本轮回执及 Z 附件零命中；附件不含 token、密码或数据库秘密。

### Z2 浏览器存储安全

执行动作：在 admin/operator/viewer 三个 dev 浏览器会话中读取 `document.cookie`、localStorage、sessionStorage 的键和值摘要；分别在登录态和 debug-off 后执行。

通过条件：页面仍以对应真实身份访问；调试 token 仅存在内存认证状态。

零残留断言：三个存储介质均无 `test_` token；debug-off 刷新后 `/auth/me` 为 401 且受保护页回到未认证状态。

### Z3 四类选人浏览器与失败零写入

执行动作：真实浏览器依次打开 FIXED_USER、ROLE、EXPRESSION、ADAPTER 配置，保存后立即由 API 回读 graph_json；对四个非法配置分别记录发布前后 PG 的 definition/deployment/binding 数量和 graph_json 哈希。

通过条件：四类 DOM 均显示选中值；运行任务候选与预期用户一致。

零残留断言：四个非法发布均明确失败，计数增量 0/0/0，graph_json 哈希不变；原始 HTTP/SQL 输出均在 Z3 附件。

### Z4 审批意见剩余行为

执行动作：
1. 一个默认备注节点提交备注并历史回看；
2. opinion v1 运行实例提交后发布 v2，再回看 v1 历史仍按 v1；
3. v2 使用 amount/risk 初始化，显示一个条件字段、隐藏一个条件字段，提交后回读；
4. 两候选浏览器同时可见，operator 首次处理，viewer 刷新后显示已处理；
5. 完成一次 APPROVE、RETURN、REJECT 页面操作。

通过条件：每步 DOM、access log requestId、HTTP 和意见 SQL 对应同一 task/instance；页面只显示正确成功提示。

零残留断言：无“成功+失败”双提示；隐藏字段不可提交绕过，篡改仍被拒绝；历史 v1 不被 v2 改写。

### Z5 三人会签意见与原始矩阵

执行动作：创建第三个真实普通用户；RATIO 使用三人 67%，每人提交不同意见。把 ANY 通过/驳回、ALL 驳回、RATIO 通过/不可达、RETURN、重复/并发的完整 HTTP 和 SQL 输出持久保存。

通过条件：RATIO 两票达到 67% 后结算；三人身份和每份意见均可独立回读；其他模式与 L12 语义一致。

零残留断言：任一场景动作计数不重复，终态后活动任务为 0，取消任务有原因，第三用户最终恢复且无测试权限残留。

### Z6 分支运行期类型错误

执行动作：使用一个发布时合法、运行时 `amount` 实际为非数字文本的实例触发类型错误；记录发布成功、运行请求、错误状态、分支轨迹和 PG/Flowable 状态。

通过条件：实例进入明确受控失败状态并能定位条件与输入类型。

零残留断言：不得命中 DEFAULT、不得到 End、不得产生 COPY/NOTIFICATION 成功记录；清理后实例/轨迹为 0。

### Z7 通知剩余证据

执行动作：分别执行 RETURN 和 REJECT，查询发起人消息的 bizType、instance/node/action/opinion 摘要；对同一幂等键重放 Adapter；构建生产 jar 与前端 dist 后扫描验证 Adapter 类名、Bean 标识、fixture 标识。

通过条件：RETURN/REJECT 各一条正确通知；同幂等键只有一组实际发送记录；失败/超时状态与原因可回读。

零残留断言：生产 jar/classes/resources/dist 对验证 Adapter/fixture 零命中；不得宣称真实厂商发送。

### Z8 浏览器 RETURN/REJECT 三方关联

执行动作：各执行一条真实浏览器 RETURN 和 REJECT 链。每个点击动作记录秒级时间、DOM/截图、后端 access log 的 method/path/status/requestId/debug userId，并立即查询同一 task/instance 的 API 和 PG/Flowable。

通过条件：RETURN 最终重新流转后完成，REJECT 终止；页面提示、接口、业务状态、Flowable 活动任务和意见动作一致。

零残留断言：无双提示；RETURN 不提前终止，REJECT 无活动任务；不存在 trace 到 End 而业务仍 RUNNING 等矛盾。

### Z9 最终门禁与清理

执行顺序固定为：完成全部修正 → Z2—Z8 → 精确清理 → 后端聚焦 → 后端 `mvn -q test` → Flyway H2/PG → 前端 typecheck → lint → test → build → 三仓 diff-check → 生产产物扫描 → 端口检查。

通过条件：保存完整原始输出；计数与 Surefire/Vitest 实际结果一致；PG/H2 均到同一最新版本。

零残留断言：按 `ids-z1-z9.env` 和 `p58_z_` 前缀逐表查询，业务/Flowable/意见/抄送/通知/表单/用户角色临时绑定均为 0；专属端口和 PID 为 0；生产产物零调试入口和验证 Adapter。

## 4. 允许修改范围

- 仅允许修复 Z2—Z9 实际暴露的 P58 后端、前端、迁移、测试与 dev-only 验证接缝。
- 允许新增本轮回执、`ids-z1-z9.env`、Z1—Z9 原始附件与截图。
- 禁止修改规划审查、P57 归档、功能正式计数、清单核销和正式基线。

## 5. 逐包固定字段

每个 Z 附件必须包含：

```text
GAP_ID
INPUT_IDS
IDENTITIES
BROWSER_TIME_AND_DOM
ACCESS_LOG_REQUEST_IDS
HTTP_RAW
PG_AND_FLOWABLE_SQL_RAW
POSITIVE_ASSERT
NEGATIVE_ASSERT
ZERO_RESIDUE_ASSERT
COMMAND_AND_EXIT
CLEANUP_RESULT
```

## 6. 提交前零裁量门禁

以下全部为“是”才能提交：

| 门禁 | 必须结果 |
|---|---|
| Z1—Z9 是否各有工作区内可读原始附件？ | 是 |
| 本轮附件是否零 `/tmp` 引用、零秘密？ | 是 |
| `ids-z1-z9.env` 是否包含全部对象 ID？ | 是 |
| 浏览器动作是否均有 access requestId 和 API/SQL 关联？ | 是 |
| 默认备注、v1/v2、联动/显隐和双候选是否齐全？ | 是 |
| 三人会签及每人意见是否齐全？ | 是 |
| 运行期类型错误是否未走 DEFAULT/End？ | 是 |
| RETURN/REJECT 通知、幂等和生产零 Adapter 是否齐全？ | 是 |
| 最终全量门禁是否在所有修正与清理之后通过？ | 是 |
| 最终逐表、端口、进程、生产产物是否全部零残留？ | 是 |

任一为“否”时继续执行，不得再次提交相同不完整回执。若真实工具结果证明某项能力不可达，必须附三条不同路径的实际失败结果及解除条件，才能如实报告 `BLOCKED`。

## 7. 合法终态

全部门禁为“是”后提交 `EXECUTION_SUBMITTED`，功能保持 `VERIFYING` 等待 Planner。禁止写 `PASSED` 或 `COMPLETED`。
