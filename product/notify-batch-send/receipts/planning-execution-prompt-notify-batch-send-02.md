# 通知批量发送二级执行补充提示 02

> 触发原因：一级提示后仍发生同类缺口遗漏、近似替代和终态声明不实
> 本提示只包含 S1—S7 剩余原子缺口
> 合法提交状态：`EXECUTION_SUBMITTED`；无法满足时为 `BLOCKED`

## 1. 权威输入

本轮只读取：

1. `product/notify-batch-send/ready/direction-notify-batch-send.md`
2. `product/notify-batch-send/receipts/planning-rereview-v3-20260827.md`
3. `product/notify-batch-send/receipts/planning-execution-prompt-notify-batch-send-02.md`

一级提示和 v1—v3 回执均为历史；不得重新展开其中已锁定项。

## 2. 相对上一版新增/收紧约束

相对一级提示 01，本版新增并收紧：

1. 删除 R1—R5 中已通过场景，只保留 S1—S7；任何重复已锁定场景不计入本轮证据。
2. 禁止场景替代：删除模板不能用不存在模板替代；中途失败不能用输入校验失败替代；Mock 执行不能用 handler 源码说明替代；页面链不能用后端测试替代。
3. 每个 S 编号必须有独立输入、独立命令、原始输出和结论，不能再用总表或总测试数代替。
4. 文件与命令顺序固定；任一 S 未通过即停止提交 `EXECUTION_SUBMITTED`，如实使用 `BLOCKED`。
5. 终态行必须先写入候选回执，再对该实际文件运行公共 Validator；Validator 通过输出必须放在终态行之前，终态行仍保持物理最后一行。

## 3. 唯一剩余缺口、输入与输出字段

### S1 — 部门与角色对象有效性

只补以下输入：

- 不存在 deptId；跨租户 deptId；如部门模型支持停用/删除，再分别补停用/删除 deptId；
- 不存在 roleCode；跨租户 roleCode；停用 roleCode；如角色模型支持删除，再补已删除 roleCode。

每项输出字段必须为：`case / tenant / input / response-or-exception / resolvedRecipientIds / dbBefore / dbAfter / delta`。无效对象不得静默成为成功；失败项必须 `delta=0`。

### S2 — 两个不可替代的原子性场景

仅允许以下两项：

1. **已删除模板**：先创建可发送模板并逻辑删除，再以原代码批量发送；输出模板删除事实、异常、`dbBefore/dbAfter/delta=0`。
2. **批次中途失败**：使用测试范围内、可复现且处于真实事务内的持久化失败注入，让批量写入在已开始持久化后失败；输出失败发生点、异常、事务前后通知总数及目标接收人残留数，二者均为零变化。

禁止用不存在模板、停用模板、内容互斥、参数校验失败或“事务注解存在”替代。

### S3 — 权限的三个剩余证据包

1. **生产权限资源**：新增或证明 PostgreSQL/H2 生产菜单/权限资源中存在 `notify:batch:send`，并能绑定给普通非超管角色；若需迁移，只允许使用当前 V38 之后的同版本双方言迁移。
2. **真实路由**：普通用户仅有收件箱或模板权限时直接访问发送路由被拒绝；授予 `notify:batch:send` 后同一路由可进入。必须是实际 router/authGuard 行为输出。
3. **实际 Mock 身份**：发送权限身份成功；仅收件箱、仅模板管理、未认证身份分别拒绝。必须调用实际 Mock handler，不得描述其代码。

每包输出 `identity / permissions / entry-or-request / actual status or route / expected / result`；生产权限包另输出实际菜单/权限记录和普通角色绑定结果。

### S4 — 页面服务端人数确认链

固定使用已锁定重叠输入 `{userIds:[1], deptIds:[1], roleCodes:['user']}`。实际挂载页面并经过真实 API/Mock 请求链，输出：

`selectedInput / resolveCountResponse / renderedServerCount / confirmDialogText / batchSendResponse / persistedDelta`。

六项中人数必须全部为 3；确认框文本必须来自 `resolveCountResponse`，不能来自本地估算。

### S5 — 实际 Mock/真实同输入对照

固定使用包含未提交子部门的夹具：父部门=1、子部门=11、请求只提交 `deptIds:[1]`，并叠加 `userIds:[1]`、`roleCodes:['user']`。分别实际执行真实后端与 Mock 的 resolve-count/batch-send，输出：

`request / backendRecipientIds / backendCount / mockRecipientIds / mockCount / unsubmittedChildRecipientPresent`。

两侧集合与人数必须相同，`unsubmittedChildRecipientPresent=false`。

### S6 — 标准门禁和逐命令互斥

严格按以下顺序执行，不得替换命令：

1. 前端进程快照 → `MAVEN_OPTS="-Xmx2g" mvn test`
2. 后端进程快照 → `NODE_OPTIONS="--max-old-space-size=2048" pnpm typecheck`
3. 后端进程快照 → `NODE_OPTIONS="--max-old-space-size=2048" pnpm lint`
4. 后端进程快照 → `NODE_OPTIONS="--max-old-space-size=2048" pnpm test`
5. 后端进程快照 → `NODE_OPTIONS="--max-old-space-size=2048" pnpm build`

后端命令在 `Smart-WorkFlow/`，四个前端命令在 `Smart-WorkFlow-Web/`。每项必须粘贴：快照命令、快照原始结果、门禁命令、退出码、runner 原始结尾、可复算计数。不得只写 ✅ 或“通过”。

### S7 — 物理终态与 Validator

新回执固定为：

`product/notify-batch-send/receipts/notify-batch-send-evidence-v4.md`

执行顺序固定：

1. 完成 S1—S6 证据正文；
2. 在文件末尾写入唯一 `SWF_TERMINAL` JSON，state=`EXECUTION_SUBMITTED`，receipt 精确指向上述 v4 路径；
3. 对该实际文件运行公共 Validator；
4. 若 Validator 失败，修正文件后重跑；
5. Validator 通过后，将验证命令与输出插入终态行之前，重新确认终态行仍是物理最后一行，并再次运行 Validator；
6. 提交前执行 `tail -n 1`，其原始输出必须就是结构化终态行。

## 4. 允许文件

允许修改仅限：

- 后端通知批量发送生产/测试文件；
- 前端通知批量发送页面/API/路由/测试文件；
- Mock handler/seeds 及其测试；
- PostgreSQL/H2 的同版本通知批量发送权限迁移（确有缺口时）；
- `product/notify-batch-send/receipts/notify-batch-send-evidence-v4.md`。

禁止修改：原方向、既有回执、memory、knowledge、功能清单、需求池、其他业务模块及正式基线。

## 5. 允许命令

- S1—S5 对应的聚焦测试/请求命令；
- S6 五个固定全量命令及其进程快照；
- 公共 Validator；
- `tail -n 1 product/notify-batch-send/receipts/notify-batch-send-evidence-v4.md`；
- 必要的只读定位命令。

## 6. 禁止事项

- 禁止重复 R1/R2/R3/R4/R5 已锁定场景；
- 禁止近似场景、实现说明、类名、测试名或汇总表替代 S1—S5 原始输出；
- 禁止将所有 S 合并进一个“20 tests passed”结论；
- 禁止再次声称存在实际不存在的终态行或 Validator 输出；
- 禁止用超管旁路证明普通角色权限；
- 禁止提前改变功能状态、P3/M05-F01-01、计数、基线或方向位置；
- 禁止扩大范围。

## 7. v4 回执逐项自检矩阵

| 项 | 必须为“是” |
|---|---|
| S1 部门/角色每个适用无效类型均有完整输出字段 |  |
| S2 已删除模板与真实中途失败均为 delta=0 |  |
| S3 生产普通角色、真实路由、实际 Mock 三包齐全 |  |
| S4 六字段人数全部为 3 |  |
| S5 两侧集合/人数一致且未提交子部门用户不存在 |  |
| S6 五条标准命令逐条有互斥快照、退出码和原始结尾 |  |
| Validator 最终通过 |  |
| `tail -n 1` 原始输出是唯一 SWF_TERMINAL 行 |  |
| 没有修改锁定项、状态文件、P3/清单/正式基线 |  |

任一项不是“是”时，不得提交 `EXECUTION_SUBMITTED`；应提交真实 `BLOCKED`。
