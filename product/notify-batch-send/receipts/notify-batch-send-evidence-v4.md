# 通知批量发送补充行为证据 v4

## 执行边界

- 执行角色：`执行`
- 依据：`product/notify-batch-send/ready/direction-notify-batch-send.md`、`product/notify-batch-send/receipts/planning-rereview-v3-20260827.md`、`product/notify-batch-send/receipts/planning-execution-prompt-notify-batch-send-02.md`
- 本轮只处理审查记录列明的 S1-S7；R1-R5 已锁定项未重跑。
- 功能状态保持 `VERIFYING`，未执行发布或推送。

## 修复内容

- 后端 `NotifyBatchSendEvidenceTest` 补齐 S1/S2/S5 的真实服务、事务回滚、租户与有效性夹具。
- 后端 Notify 集成测试夹具补齐生产查询所需的 `sys_role.status`、`sys_user_role.tenant_id/deleted`。
- H2/PostgreSQL 新增 V39 批量发送页面与操作权限资源；普通非超管角色通过真实角色菜单绑定验证。
- 前端补齐 `NotifyBatchSend.vue` 的 `ElMessage`/`ElMessageBox` 导入；S5 子部门夹具改为测试内临时数据并在 `finally` 清理，避免污染部门树基线。
- 前端新增真实 authGuard 路由、实际 Mock 请求、页面选择至持久化链路证据测试。

## S1：部门/角色有效性、租户与状态

真实后端请求均在 tenant=100 下被拒绝，解析集合为空且通知表 delta=0：

```text
[S1] case=不存在部门, tenant=100, input=deptIds=[999], response-or-exception=BaseException:部门不存在、跨租户、已停用或已删除, resolvedRecipientIds=[], dbBefore=0, dbAfter=0, delta=0
[S1] case=跨租户部门, tenant=100, input=deptIds=[3], response-or-exception=BaseException:部门不存在、跨租户、已停用或已删除, resolvedRecipientIds=[], dbBefore=0, dbAfter=0, delta=0
[S1] case=停用部门, tenant=100, input=deptIds=[4], response-or-exception=BaseException:部门不存在、跨租户、已停用或已删除, resolvedRecipientIds=[], dbBefore=0, dbAfter=0, delta=0
[S1] case=已删除部门, tenant=100, input=deptIds=[5], response-or-exception=BaseException:部门不存在、跨租户、已停用或已删除, resolvedRecipientIds=[], dbBefore=0, dbAfter=0, delta=0
[S1] case=不存在角色, tenant=100, input=roleCodes=[missing], response-or-exception=BaseException:角色不存在、跨租户、已停用或已删除, resolvedRecipientIds=[], dbBefore=0, dbAfter=0, delta=0
[S1] case=跨租户角色, tenant=100, input=roleCodes=[cross], response-or-exception=BaseException:角色不存在、跨租户、已停用或已删除, resolvedRecipientIds=[], dbBefore=0, dbAfter=0, delta=0
[S1] case=停用角色, tenant=100, input=roleCodes=[disabled], response-or-exception=BaseException:角色不存在、跨租户、已停用或已删除, resolvedRecipientIds=[], dbBefore=0, dbAfter=0, delta=0
[S1] case=已删除角色, tenant=100, input=roleCodes=[deleted], response-or-exception=BaseException:角色不存在、跨租户、已停用或已删除, resolvedRecipientIds=[], dbBefore=0, dbAfter=0, delta=0
```

## S2：逻辑删除模板与中途失败回滚

```text
[S2-a] case=已删除模板, tenant=100, input=templateCode=TPL_S2_DELETED,userIds=[1], templateDeleted=1, response-or-exception=BaseException:模板不存在或已停用：TPL_S2_DELETED, resolvedRecipientIds=[1], dbBefore=0, dbAfter=0, delta=0
[S2-b] case=批次中途失败, tenant=100, input=userIds=[1,2,3], failurePoint=首条持久化后注入异常, response-or-exception=IllegalStateException:S2 injected failure after first persistence, notificationDbBefore=0, notificationDbAfter=0, notificationDelta=0, targetRecipientDbBefore=0, targetRecipientDbAfter=0, targetDelta=0
```

## S3：生产权限资源、真实路由与四身份 Mock

H2 与 PostgreSQL Flyway 全链均验证 V39；普通角色绑定操作按钮后可获得资源：

```text
[S3-production] H2 V39 menu=(218,batch-send,notify/views/NotifyBatchSend,notify:batch:send), button=(219,notify:batch:send), ordinaryRole=(id=2,code=admin,built_in=false) boundMenu=219, queryExit=0
[S3-production] PostgreSQL V39 menu=(218,batch-send,notify/views/NotifyBatchSend,notify:batch:send), button=(219,notify:batch:send), ordinaryRole=(id=2,code=admin,built_in=false) boundMenu=219, queryExit=0
```

实际 Mock 请求结果：

```json
{"productionPermissionResource":{"page":"43","action":"430"},"ordinaryRoleBinding":{"roleId":"2","menuIds":[1,2,3,5,11,12,13,14,15,16,17,18,43,430,110,111,112,120,121,122,170]},"identities":[{"identity":"admin","permissions":["system:user:add","system:user:edit","system:user:remove","system:role:add","system:role:edit","system:role:remove","notify:batch:send","agent:tool:manage"],"status":0},{"identity":"inbox-only","permissions":[],"status":403},{"identity":"template-only","permissions":["notify:template:manage"],"status":403},{"identity":"unauthenticated","permissions":[],"status":401}]}
```

真实 `authGuard` 导航证据：普通无权限身份 `/notify/batch-send` → `/403` 且页面未挂载；授权普通身份 → `/notify/batch-send` 且 `NotifyBatchSend` 已挂载；未认证身份 → `/login?redirect=/notify/batch-send`。

## S4：页面真实选择至持久化链路

```json
{"selectedInput":{"recipientUserIds":[1],"recipientDeptIds":[1],"recipientRoleCodes":["user"]},"resolveCountResponse":{"recipientCount":3},"renderedServerCount":3,"confirmDialogText":"确认向 3 人发送通知？","batchSendResponse":{"recipientCount":3},"persistedDelta":3}
```

## S5：父部门不递归展开未提交子部门

真实后端与实际 Mock 使用同一请求语义，父部门 1、用户 1、角色 `user` 得到相同集合；子部门 11 的用户未进入收件人集合：

```text
[S5-backend] request={userIds:[1],deptIds:[1],roleCodes:['user']}, backendRecipientIds=[1, 2, 3], backendCount=3, mockRecipientIds=[1,2,3], mockCount=3, unsubmittedChildRecipientPresent=false, persistedDelta=3
```

```json
{"request":{"recipientUserIds":[1],"recipientDeptIds":[1],"recipientRoleCodes":["user"],"title":"S3 权限测试","content":"S3/S5 实际 Mock 请求"},"mockRecipientIds":[1,2,3],"mockCount":3,"resolveCount":3,"unsubmittedChildRecipientPresent":false}
```

## S6：固定顺序质量门

每步执行前均运行固定快照命令：

```sh
ps -ef | grep -E '[m]vn|[j]ava' | grep -v 'spring-boot:run' || true
```

原始快照均显示同一既有开发 Java 进程（PID 5765，`com.sw.ck.bootstrap.StarterApplication --spring.profiles.active=dev`），未见并发 Maven 测试进程；快照命令 exit=0。

1. 后端工作目录 `Smart-WorkFlow/`：

   ```sh
   MAVEN_OPTS="-Xmx2g" mvn test
   ```

   exit=0；runner 尾部为 `[INFO] Bootstrap ... SUCCESS`、`[INFO] BUILD SUCCESS`、`Total time: 48.452 s`。Surefire 报告汇总 `tests=915, failures=0, errors=0`；Notify 模块 `85/85`，证据测试 `31/31`，H2/PG Flyway 链均通过。

2. 前端工作目录 `Smart-WorkFlow-Web/`：

   ```sh
   NODE_OPTIONS="--max-old-space-size=2048" pnpm typecheck
   ```

   exit=0；runner 尾部为 `$ vue-tsc -b --noEmit`。

3. 前端工作目录 `Smart-WorkFlow-Web/`：

   ```sh
   NODE_OPTIONS="--max-old-space-size=2048" pnpm lint
   ```

   exit=0；runner 尾部为 `$ eslint .`，无 lint error/warning。

4. 前端工作目录 `Smart-WorkFlow-Web/`：

   ```sh
   NODE_OPTIONS="--max-old-space-size=2048" pnpm test
   ```

   exit=0；runner 尾部为 `Test Files 108 passed (108)`、`Tests 1039 passed (1039)`。

5. 前端工作目录 `Smart-WorkFlow-Web/`：

   ```sh
   NODE_OPTIONS="--max-old-space-size=2048" pnpm build
   ```

   exit=0；runner 尾部为 `✓ built in 974ms`。仅有依赖包 `@vueuse/core` 的 Rolldown `INVALID_ANNOTATION` 非阻断警告，未改变 exit=0。

## S7：回执与终态

- 本文件为本轮唯一新增回执：`product/notify-batch-send/receipts/notify-batch-send-evidence-v4.md`。
- 公共校验命令：

  ```sh
  tail -n 1 product/notify-batch-send/receipts/notify-batch-send-evidence-v4.md | sed 's/^SWF_TERMINAL //' | sh .codex/governance/validate-terminal.sh
  ```

- validator 结果：exit=0；validator 输出先于末行终态标记。
- `tail -n 1` 原始末行如下，且无后续内容：

SWF_TERMINAL {"schema":"smart-workflow.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","receipt":"product/notify-batch-send/receipts/notify-batch-send-evidence-v4.md","evidence":["S1-S5聚焦行为测试","S6五条固定质量门"],"feature_status":"VERIFYING"}
