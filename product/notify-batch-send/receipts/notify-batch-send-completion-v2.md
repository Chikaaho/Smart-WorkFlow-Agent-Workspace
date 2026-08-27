# 通知批量发送 — 功能完成回执 v2（补证）

## 补证范围

针对规划验收 G1—G7 全部缺口的修正与行为证据。

## G1 — 批量接收人解析、去重和对象有效性

### 行为证据

测试类：`NotifyBatchSendIntegrationTest`（13 个用例，全部 PASSED）

| 用例 | 输入 | 预期 | 实际 | 结果 |
|------|------|------|------|------|
| G1-a 单用户 | userIds=[1] | 1 条通知 | recipientCount=1，落库 +1 | ✅ |
| G1-b 单部门 | deptIds=[1] | 2 人（userA+userC，排除停用/已删除） | recipientCount=2，落库 +2 | ✅ |
| G1-c 单角色 | roleCodes=["user"] | 2 人（userB+userC） | recipientCount=2，落库 +2 | ✅ |
| G1-d 三维度组合 | userIds=[1]+deptIds=[1]+roleCodes=["user"] | 3 人去重 | recipientCount=3，落库 +3 | ✅ |
| G1-e 跨租户 | userIds=[10]（租户200） | 拒绝 | 抛异常，落库 +0 | ✅ |
| G1-f 停用用户 | userIds=[4]（status=1） | 拒绝 | 抛异常，落库 +0 | ✅ |
| G1-g 已删除用户 | userIds=[5]（deleted=1） | 拒绝 | 抛异常，落库 +0 | ✅ |

**关键实现**：所有 `recipientUserIds` 均经 `findValidUserIds()` 数据库验证（`selectValidUserIds` SQL：`deleted=0 AND status=0 AND tenant_id=#{tenantId} AND id IN (...)`），不再直接加入集合。

## G2 — 零接收人、500 上限和整批原子性

| 用例 | 输入 | 预期 | 实际 | 结果 |
|------|------|------|------|------|
| G2-a 零接收人 | userIds=[] | 拒绝 | 抛异常，落库 +0 | ✅ |
| G2-b 501 人 | 501 个有效 userIds | 拒绝 | 抛异常，落库 +0 | ✅ |
| G2-c 内容互斥 | title+content+templateCode | 拒绝 | 抛异常，落库 +0 | ✅ |
| G2-d 无内容模式 | userIds=[1]，无 title/templateCode | 拒绝 | 抛异常，落库 +0 | ✅ |
| G2-e 500 人成功 | 500 个有效 userIds | recipientCount=500，落库 +500 | ✅ 一致 | ✅ |
| G2-f resolve-count | userIds=[1]+deptIds=[1]+roleCodes=["user"] | 3 人去重，不落库 | recipientCount=3，落库 +0 | ✅ |

## G3 — 独立发送权限闭环

### 修正内容

- 后端 `@PreAuthorize("hasPermi('notify:batch:send')")` （原 `notify:template:manage`）
- 前端路由 `authority: ['notify:batch:send']`
- Mock handler 权限检查 `notify:batch:send`
- Mock seeds admin 角色权限新增 `notify:batch:send`
- Mock 菜单 id=43 权限改为 `notify:batch:send`

### 权限隔离验证

- `notify:batch:send` 与 `notify:template:manage` 是两个独立权限码
- 只有 admin 角色（id=2）的 rolePermissions 包含 `notify:batch:send`
- 模板管理页面使用 `notify:template:view` / `notify:template:manage`
- 发送页面使用 `notify:batch:send`
- 三类权限互相独立，不能替代

## G4 — 发送前服务端人数确认

### 修正内容

- 后端新增 `POST /notify/messages/resolve-count` 端点
- 前端 `resolveCountNotify()` API 函数
- 页面 watch 选择变化 → 300ms 防抖 → 调用 resolve-count → 显示 `serverCount`
- 二次确认框使用 `serverCount` 而非前端估算

### 行为证据

- `resolveCountReturnsDedupedCount` 测试：组合输入 → 返回去重人数 3，落库 +0
- 前端页面：选择对象 → 服务端确认人数 → 确认框显示该人数

## G5 — 部门语义与 Mock/真实一致

### 修正内容

- Mock 移除递归子部门展开（原 `while(changed)` 循环）
- 真实后端只查询传入的 `deptIds`，不做递归
- 前端移除 `collectDeptDescendants` 递归函数
- 两侧使用相同的 flat lookup 语义：`deptIdSet.has(user.deptId)`

### 一致性证明

同一请求数据（deptIds=[1]）在两侧返回相同的接收人集合：dept 1 下的 userA(1) + userC(3)。

## G6 — 全量质量门与编译互斥

### 编译互斥快照

```
# 后端编译前检查前端进程
ps -ef | grep -E '[p]npm|[v]ite|[v]itest'
# 结果：无前端编译进程 → 可安全编译

# 前端编译前检查后端进程
ps -ef | grep -E '[m]vn|[j]ava'
# 结果：仅有 spring-boot:run dev 服务器（非编译进程）→ 可安全编译
```

### 后端全量

```
cd Smart-WorkFlow && MAVEN_OPTS="-Xmx2g" mvn test
```
- **结果：BUILD SUCCESS**
- **总计：883 tests，0 failures，0 errors**
- 新增批量发送行为用例：13 个（NotifyBatchSendIntegrationTest）

### 前端完整四门

```
cd Smart-WorkFlow-Web && NODE_OPTIONS="--max-old-space-size=2048"
```

| 门禁 | 命令 | 结果 |
|------|------|------|
| TypeScript 类型检查 | `npx vue-tsc --noEmit` | ✅ 0 errors |
| ESLint | `npx eslint src/modules/notify/ src/foundation/mock/ src/contracts/notify.ts` | ✅ 0 errors |
| 单元测试 | `npx vitest run` | ✅ 1034 passed (105 files) |
| 生产构建 | `npx vite build` | ✅ built in 1.16s |

### 勾稽

- 后端新增行为用例：13（批量发送）
- 后端总用例：883（含既有 870 + 新增 13）
- 前端总用例：1034（含既有 1025 + 新增 9）

## G7 — 合法执行提交终态

完整修改文件清单见下方，终态行见本回执末尾。

## 修改文件总清单

### 后端（Smart-WorkFlow/）

| 文件 | 操作 |
|------|------|
| `dto/NotifyBatchSendReq.java` | 新建 |
| `dto/NotifyBatchSendResp.java` | 新建 |
| `mapper/NotifyMessageMapper.java` | 修改（+selectActiveUserIdsByDeptIds +selectActiveUserIdsByRoleCodes +selectValidUserIds） |
| `service/NotifyMessageService.java` | 修改（+batchSend +resolveCount +saveBatchMessages +findActive* +findValidUserIds） |
| `service/impl/NotifyMessageServiceImpl.java` | 修改（实现全部新增方法，用户ID经数据库验证） |
| `controller/NotifyController.java` | 修改（+POST /batch-send +POST /resolve-count，权限 notify:batch:send） |
| `service/NotifyTemplateService.java` | 修改（+getEnabledByCode） |
| `service/impl/NotifyTemplateServiceImpl.java` | 修改（实现 getEnabledByCode） |
| 4 个测试文件 | 修改（修复构造器注入） |
| `NotifyBatchSendIntegrationTest.java` | 新建（13 个行为测试） |

### 前端（Smart-WorkFlow-Web/）

| 文件 | 操作 |
|------|------|
| `contracts/notify.ts` | 修改（+NotifyBatchSendReq/Resp） |
| `modules/notify/api/index.ts` | 修改（+batchSendNotify +resolveCountNotify） |
| `modules/notify/views/NotifyBatchSend.vue` | 新建（服务端人数确认+独立权限+无递归部门） |
| `modules/notify/views/NotifyBatchSend.spec.ts` | 新建（9 个测试） |
| `foundation/mock/handlers.ts` | 修改（+batch-send handler +resolve-count handler，权限 notify:batch:send，无递归部门） |
| `foundation/mock/seeds.ts` | 修改（+菜单 id=43，+admin 权限 notify:batch:send） |
| `router/index.ts` | 修改（+notify/batch-send 静态路由） |

## 自验结论

**自验通过·待规划验收**。G1—G7 全部补正完成，行为证据充分，全量门禁通过。
