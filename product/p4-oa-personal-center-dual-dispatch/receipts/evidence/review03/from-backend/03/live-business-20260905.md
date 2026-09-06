# P4 个人中心双通道补证：真实业务与重启证据

> 证据日期：2026-09-05（Asia/Shanghai）
>
> 环境边界：G1/G2/G3/G5/G6 使用 loopback 调试身份与主服务 H2 实例；G4 使用独立文件 H2、独立端口 18082/18083，服务进程在验证后已停止。未访问生产、远程环境或真实设备，以下身份与 ID 均为本地测试夹具。

## G3a：会签 ANY 的首个有效动作

| 对象 | 值 |
|---|---|
| 表单 | `p4_oa_consensus_20260905` / `ef3b77fd-a334-4a7c-835d-e6a337b14ee1` |
| 流程 | `bpm_7a28db2aac93481b` / `2096164892743176193` |
| 发起草稿 | `2096165100843569153` |
| 发起命令 | `2096165101011341314` |
| 业务结果 | `d2655409-ca9c-40b3-b371-5d36b703e2eb` |
| Flowable 实例 | `39662b74-a90a-11f1-9c50-66ff24301f3c` |

会签节点参与人是 dispatcher 与 business，模式为 `ANY`。提交后真实查询得到两个活动任务；dispatcher 完成自己的任务后，原子读回为：

```text
POST /api/workflow/tasks/396a222a-a90a-11f1-9c50-66ff24301f3c/complete -> code=0
GET  instance -> status=APPROVED, progress=[]
```

随后 business 使用已取消的另一任务重放：

```text
POST /api/workflow/tasks/396b33a0-a90a-11f1-9c50-66ff24301f3c/complete
HTTP 200 {"code":404,"msg":"任务不存在","data":null}
```

处理记录只保留 dispatcher 的 `ACTION=APPROVE`；business 没有新增处理记录，证明首个有效动作完成会签并阻断后续动作。

## G3b：退回到指定历史节点

| 对象 | 值 |
|---|---|
| 表单 | `p4_oa_return_20260905` / `3103be7a-782e-41fc-88b7-25d0869b04ff` |
| 流程 | `bpm_9c091e2a5f784015` / `2096165528423501826` |
| 发起草稿 | `2096165638704336897` |
| 发起命令 | `2096165638859526146` |
| 业务结果 | `9059d37c-37cc-4903-bd22-8c3364af4d05` |
| DB 实例 / Flowable 实例 | `2096165641631961090` / `85cdcc3d-a90a-11f1-9c50-66ff24301f3c` |

节点 `a1` 为 dispatcher，`a2` 为 admin，`a2.returnTargets=["a1"]`。真实动作结果：

```text
POST /api/workflow/tasks/85ce1a6a-a90a-11f1-9c50-66ff24301f3c/complete -> code=0
POST /api/workflow/tasks/9a4b76f0-a90a-11f1-9c50-66ff24301f3c/complete
     body={"returnTargetNodeId":"a1"} -> code=0
GET  instance -> status=RUNNING
GET  progress -> active node=a1, assignee=2096158370415906818
```

历史查询显示原 `a1`、`a2` 任务均已结束，并重新生成 `a1` 活动任务；退回动作不是伪造前端状态。

## G4a：持久队列重启恢复

独立文件 H2 的第一次进程在命令入队后立即停止：

```text
commandId=2096166921557463042
before shutdown: status=PENDING, result=null, matching instance=none
```

同一数据库由第二次进程在端口 18083 启动后，按原 `commandId` 查询并等待消费：

```text
after restart: status=COMPLETED
result={"status":"SUBMITTED","recordId":"0141a5b5-a430-4a09-8ba9-f65606c5ac0e"}
retryCount=0
instance status=RUNNING, todo=4d971fd3-a90a-11f1-ad65-726b834c251e
```

随后真实完成待办并读回：

```text
POST /api/workflow/tasks/4d971fd3-a90a-11f1-ad65-726b834c251e/complete -> code=0
final instance status=APPROVED, progress=[], todo=[]
```

这证明命令与结果均从持久存储恢复，未依赖第一次进程内存。

## G6：身份、P0 权限与消费侧复核

真实 `GET /api/auth/me` 读回的最小权限差异：

```text
business   permissions=[workflow:view, workflow:todo:view, workflow:my:view]
           roles=[p4_business_role], superAdmin=false
dispatcher permissions=[workflow:view, workflow:todo:view, workflow:my:view, workflow:p0:dispatch]
           roles=[p4_dispatch_role], superAdmin=false
```

business 身份提交 P0 命令的真实结果：

```text
HTTP 403 {"code":403,"msg":"缺少 P0 调用专用权限: workflow:p0:dispatch"}
draft status=EDITING, commandId=null
```

消费侧动态撤权由 `CommandDispatcherTest.p0ShouldRejectWhenPermissionRevokedAfterAccept` 覆盖，并已纳入目标测试与完整 Maven 测试；本轮未宣称完成一次线上式“入队后实时撤权”窗口实验。

