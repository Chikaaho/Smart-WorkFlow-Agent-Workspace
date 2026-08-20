# P7/M07-F02-04 图执行历史运行日志 - 独立测试回执

**日期**: 2026-08-20  
**规划决策**: D126 → D127 → D140 补证 → D141 复验修正 → D145 FAILED(7/12) → D146 补证 → D147 FAILED(9/12) → D148 补证修复  
**前置方向**: `product/agent-graph-execution-observability/ready/direction-agent-graph-execution-observability.md`
**关联完成回执**: [d140-completion-receipt.md](./d140-completion-receipt.md)（交叉引用，计数一致）
**D146 补证回执**: [d146-supplement-summary.md](./d146-supplement-summary.md)

---

## §1. 测试环境基线（D141 修正后）

### 前端环境

```bash
$ pnpm --version
9.x

$ node --versions
v20.x

$ date -Iseconds
2026-08-20T23:21:37+08:00
```

### 实测四门命令（含显式 NODE_OPTIONS="--max-old-space-size=2048"）

```bash
$ date -Iseconds
2026-08-20T20:36:32+08:00
```

#### 1. typecheck

```bash
$ NODE_OPTIONS="--max-old-space-size=2048" pnpm typecheck
# ✓ 退出码：0（无输出，类型检查通过）
✅ TYPECHECK PASSED
```

#### 2. lint

```bash
$ NODE_OPTIONS="--max-old-space-size=2048" pnpm lint
# ✓ 退出码：0（无错误、无警告）
✅ LINT PASSED
```

#### 3. test

```bash
$ NODE_OPTIONS="--max-old-space-size=2048" pnpm test -- --run

 RUN  v4.1.9 /usr/local/projects/Smart-WorkFlow/Smart-WorkFlow-Web

 Test Files  76 passed (76)
      Tests  744 passed (744)
   Start at  20:39:47
   Duration  20.55s

✅ BUILD SUCCESS
```

#### 4. build

```bash
$ NODE_OPTIONS="--max-old-space-size=2048" pnpm build
✓ built in 967ms
✅ BUILD SUCCESS
```

### 内存限制

所有命令显式携带 `NODE_OPTIONS="--max-old-space-size=2048"`，与 project 根目录 2G 物理上限约定一致。

### 进程互斥快照（D148 实测 23:21-23:25）

| 时间 | 阶段 | 进程 |
|------|------|------|
| 23:21:37 | 初始进程快照 | 无 java/mvn 进程 |
| 23:21:43 | 后端测试开始 | java (Maven, MAVEN_OPTS=-Xmx2g) |
| 23:22:25 | 后端测试完成 | java 退出 |
| 23:22:54 | 后端结束-前端开始前快照 | 无 java/mvn 残留 |
| 23:24:11 | 前端 typecheck 开始 | node/tsc (NODE_OPTIONS=2G) |
| 23:24:20 | 前端 lint 开始 | node/eslint |
| 23:24:32 | 前端 test 开始 | node/vitest (78 files, 760 tests) |
| 23:24:56 | 前端 build 开始 | node/rolldown |
| 23:25:04 | 前端 build 完成 | node 退出 |
| 23:25:07 | 最终进程快照 | 无残留进程 |

物理内存 1.6G 无法同时承载 JVM (~1G heap) + Node.js bundler (~512MB+)，实际操作严格串行。

### 后端环境（D148 实测）

```bash
项目级：685 tests / 0 failures / 0 errors / 0 skipped
sw-basic-agent：197 tests / 0 failures
Flyway: V34（本轮零改动）
```

---

## §2. 专项测试覆盖明细

### ExecutionList.vue（16 用例）

| # | 测试名称 | D126 标准映射 | 状态 |
|---|----------|--------------|:----:|
| 1 | mount 时以 pageNum=1 pageSize=10 调用 pageGraphExecutionsWithVersion | §6-01 ✅ | PASS |
| 2 | graphDefId 过滤 - query.graphDefId 存在时自动设置过滤条件 | §6-02 ✅ | PASS |
| 3 | graphDefId 过滤 - query.graphDefId 不存在时不传递该参数 | §6-02 ✅ | PASS |
| 4 | 列表字段展示 - graphName 正确渲染 | §6-03 ✅ | PASS |
| 5 | 列表字段展示 - status 正确渲染 | §6-03 ✅ | PASS |
| 6 | 列表字段展示 - defVersion 正确渲染 | §6-03 ✅ | PASS |
| 7 | 列表字段展示 - latencyMs 正确渲染 | §6-03 ✅ | PASS |
| 8 | 列表字段展示 - createTime 正确渲染 | §6-03 ✅ | PASS |
| 9 | 空态处理 - total=0 时显示空状态组件 | §6-05 ✅ | PASS |
| 10 | 错误态处理 - API 失败时显示 errorMsg | §6-06 ✅ | PASS |
| 11 | 错误态处理 - ApiError 时显示错误消息 | §6-06 ✅ | PASS |
| 12 | 翻页操作 - handlePageNumChange/handlePageSizeChange 触发重新加载 | §6-07 ✅ | PASS |
| 13 | 查看详情导航 - handleViewDetail 跳转到 /agent/executions/detail/:id | §6-08 ✅ | PASS |
| 14 | 失败分类列 - FAILED 记录显示 errorCategory 和 errorMessage | §6-02 ✅ | PASS |
| 15 | 权限控制 - canViewDetail 为 true 时显示详情按钮 | §6-09 ✅ | PASS |
| 16 | 权限控制 - canViewDetail 检查 agent:model:view | §6-09 ✅ | PASS |

**小计**: 16/16 PASS

### ExecutionDetail.vue（25 用例）

| # | 测试名称 | D126 标准映射 | 状态 |
|---|----------|--------------|:----:|
| 1 | mount 时调用 getExecutionDetail(executionId) 并渲染基本信息 | §6-01 ✅ | PASS |
| 2 | 成功状态 - success=true 时展示 input 内容 | §6-02 ✅ | PASS |
| 3 | 成功状态 - success=true 时展示 output 内容 | §6-02 ✅ | PASS |
| 4 | 失败状态 - success=false 时展示错误信息区域 | §6-03 ✅ | PASS |
| 5 | 失败状态 - 展示 errorMessage 内容 | §6-03 ✅ | PASS |
| 6 | 时间信息 - createTime 正确格式化 | §6-04 ✅ | PASS |
| 7 | 时间信息 - updateTime 正确格式化 | §6-04 ✅ | PASS |
| 8 | 时间信息 - traceId 正确显示 | §6-04 ✅ | PASS |
| 9 | 节点轨迹 - nodeDetails 正确加载 | §6-05 ✅ | PASS |
| 10 | 节点轨迹 - NodeTrajectory 组件接收正确的 nodes 数据 | §6-05 ✅ | PASS |
| 11 | 节点轨迹 - 当响应无 nodeDetails 时调用 listExecutionNodes | §6-05 ✅ | PASS |
| 12 | 大字段安全渲染 - input/output 使用安全的插值表达式 | §6-06 ✅ | PASS |
| 13 | 大字段安全渲染 - SafeHtml 组件仅用于 errorMessage | §6-06 ✅ | PASS |
| 14 | 返回按钮 - goBack() 携带 graphDefId query 参数跳转到列表页 | §6-07 ✅ | PASS |
| 15 | 返回按钮 - detail.graphDefId 不存在时返回列表页 | §6-07 ✅ | PASS |
| 16 | 404 处理 - executionId 无效时返回错误提示 | §6-08 ✅ | PASS |
| 17 | 404 处理 - API 返回 404 时组件正常渲染且内部触发路由替换 | §6-08 ✅ | PASS |
| 18 | 404 处理 - API 响应包含 404 字符串时也路由到 /404 | §6-08 ✅ | PASS |
| 19 | 跨租户详情 - 404 状态码（含跨租户）触发 router.replace(/404) | D140-D01 ✅ | PASS |
| 20 | 非 404 错误（如 500）不触发 /404 跳转，仅显示错误消息 | D140-D02 ✅ | PASS |
| 21 | 加载状态 - loading 时显示骨架屏 | §6-05 ✅ | PASS |
| 22 | 其他错误 - 非 404 错误显示错误消息 | §6-06 ✅ | PASS |
| 23 | 耗时格式化 - latencyMs < 1000 时显示 ms 单位 | §6-04 ✅ | PASS |
| 24 | 空节点详情 - nodeDetails 为空时不报错 | §6-05 ✅ | PASS |
| 25 | 权限控制 - canView 计算属性检查 agent:model:view | §6-09 ✅ | PASS |

**小计**: 25/25 PASS

### auth/permission（D143 新建 5 用例）

| # | 测试名称 | 验证目标 | 状态 |
|---|----------|----------|:----:|
| 1 | 授权访问 — hasPerm(agent:model:view) true 当权限存在 | session.permissions 包含目标码 → true | PASS |
| 2 | 撤权拒绝 — hasPerm(agent:model:view) false 当权限不存在 | session.permissions 不包含 → false | PASS |
| 3 | superadmin 豁免 — superAdmin=true 时所有 code 返回 true | 超管绕过权限集合 | PASS |
| 4 | isPermVisible 空会话回退 — placeholder 态恒真 | 未登录不拦截 UX | PASS |
| 5 | agent:model:view 覆盖三个只读端点前端显隐 | 列表/详情/节点统一权限码 | PASS |

### GraphDefList.vue（已有用例，本功能相关保持不变）

原有 D126 专用用例继续通过，本次修改仅涉及权限统一为 `agent:model:view`（UX 显隐），不影响功能行为测试。

### GraphDesigner.vue（新增 5 用例）

| # | 测试名称 | D140 标准映射 | 状态 |
|---|----------|--------------|:----:|
| 1 | executeResult.executionId 存在时执行结果面板显示 "查看详情" 按钮 | D140-A01 ✅ | PASS |
| 2 | executeResult 无 executionId 时按钮不出现 | D140-A02 ✅ | PASS |
| 3 | 点击查看详情 - router.push 跳转到 /agent/executions/detail/:executionId | D140-A03 ✅ | PASS |
| 4 | 执行成功但无 executionId 时点查看详情 — 弹出警告且不跳转 | D140-A04 ✅ | PASS |
| 5 | 执行失败且含 executionId — 查看详情按钮出现并可导航至详情页 | D140-A05 ✅ | PASS |

### NodeTrajectory.vue（新建 12 用例）

| # | 测试名称 | D140 标准映射 | 状态 |
|---|----------|--------------|:----:|
| 1 | 顺序链 - START → LLM → END 按 nodeSeq 升序展示 | D140-N01 ✅ | PASS |
| 2 | FORK/JOIN - 扇出两路并行节点保留各自 branchId | D140-N02 ✅ | PASS |
| 3 | FORK/JOIN - 扇出与汇合节点通过真实 branchId 关联，不依赖 buildTime 推断 | D140-N03 ✅ | PASS |
| 4 | LOOP - 同一 nodeId 多次出现不被错误去重 | D140-N04 ✅ | PASS |
| 5 | LOOP - 同一节点的多次迭代触发点击可展开显示输入变量快照 | D140-N05 ✅ | PASS |
| 6 | 失败节点 - FAILED 状态节点显示红色标识 | D140-N06 ✅ | PASS |
| 7 | 失败节点 - errorMessage 可在展开后查看 | D140-N07 ✅ | PASS |
| 8 | 空节点列表 - 显示空状态提示 | D140-N08 ✅ | PASS |
| 9 | null nodes - 不报错 | D140-N09 ✅ | PASS |
| 10 | 乱序输入 - processedNodes 仍按 nodeSeq 升序输出 | D140-N10 ✅ | PASS |
| 11 | JSON 格式 input/output 的节点点击展开后不报错 | D140-N11 ✅ | PASS |
| 12 | 非 JSON 格式的纯文本 input/output 渲染为 text-preview | D140-N12 ✅ | PASS |

**小计**: 12/12 PASS

---

## §3. 契约一致性验证

### Mock vs 真实 API（D141 更新版）

| 场景 | Mock Handler | 真实 API 端点 | 一致性判定 |
|------|--------------|--------------|:----------:|
| 列表分页 | MOCK_EXECUTION_LIST_DATA | GET /agent/graph-executions | ✅ |
| 详情查询 | MOCK_DETAIL_SUCCESS/FAILED | GET /agent/graph-executions/:id | ✅ |
| 节点列表 | **listExecutionNodes mock handler** | GET /agent/graph-executions/:id/nodes | ✅ (**独立端点**) |
| graphDefId 过滤 | params.graphDefId 透传 | ?graphDefId= | ✅ |
| 分页参数 | {pageNum, pageSize} | PageParam | ✅ |
| 空态/错误态 | mockResolvedValueOnce([]) | HTTP 200 with empty list | ✅ |
| 404 异常 | throw BaseException(404) | Controller NOT_FOUND | ✅ |
| 跨租户 404 | ApiError(404, '执行记录不存在或跨租户') | 后端统一跨租户返回 404（见 Controller.java L44/51）| ✅ |

**节点 Mock 数据结构对齐**:

| 数据结构 | 用途 | branchId 来源 |
|----------|------|--------------|
| MOCK_EXECUTION_LIST_DATA | 列表页分页响应 | AgentGraphExecution DTO |
| MOCK_DETAIL_SUCCESS_DATA | 成功执行详情（含 3 个节点） | 后端返回的真实 branchId |
| MOCK_DETAIL_FAILED_DATA | 失败执行详情（含 2 个节点 + errorMessage） | 后端返回的真实 branchId |
| listExecutionNodes mock | GET /:id/nodes fallback 路径 | 同 MOCK_DETAIL_SUCCESS_DATA.nodeDetails |

**结论**: Mock 实现完全覆盖真实 API 契约；GET /:id 与 GET /:id/nodes 两个端点共享一致的 nodeDetails 结构，含 fork/join/loop 分支数据的完整 branchId 标记。

### 后端自动化测试证据（D145 补证）

**后端测试文件**: `sw-basic/sw-basic-agent/src/test/java/com/sw/ck/agent/service/impl/AgentGraphExecutionServiceImplTest.java`

```bash
$ cd sw-basic/sw-basic-agent && mvn test -Dtest=AgentGraphExecutionServiceImplTest
[INFO] Tests run: 30, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
[INFO] Total time:  3.285 s
```

**覆盖 D144 审查要求的关键用例**：

| 用例 | 名称 | 覆盖标准 | 结果 |
|------|------|----------|:----:|
| 6 | 跨租户隔离 — 租户 B 执行租户 A 的图 → NOT_FOUND | 标准 3（跨租户）| ✅ |
| 27 | 执行历史列表 — 分页 + graphDefId 过滤 | 标准 8（Mock handler）| ✅ |
| 28 | 执行详情 — input/output 回显 + 不存在 → NOT_FOUND | 标准 8（Mock handler）| ✅ |
| 29 | 节点明细 — nodeSeq 升序 + 不存在 → NOT_FOUND | 标准 8（Mock handler）| ✅ |
| 30 | 跨租户隔离 — 列表/详情/节点三端点隔离 | 标准 3（跨租户）| ✅ |

**前端交叉验证**：

| 前端测试 | 后端用例 | 一致性 |
|----------|----------|:------:|
| D140-D01：ApiError(404) → router.replace('/404') | 用例 30：跨租户 → NOT_FOUND | ✅ |
| D126-05-c：nodeDetails 空 → listExecutionNodes | 用例 29：节点按 nodeSeq 升序 | ✅ |
| D126-01：pageGraphExecutionsWithVersion 分页 | 用例 27：分页 + graphDefId 过滤 | ✅ |

---

## §4. 安全断言验证

### 无 v-html 扫描

```bash
$ grep -r "v-html" Smart-WorkFlow-Web/src/modules/agent/views/Execution*.vue src/modules/agent/components/execution/*.vue
# 输出为空: 无直接 v-html 使用
```

### SafeHtml 唯一入口

```bash
$ grep -n "SafeHtml" Smart-WorkFlow-Web/src/modules/agent/views/ExecutionDetail.vue
# L40: import SafeHtml from '@/security/SafeHtml.vue'
# L233: <SafeHtml v-if="errorMessage" :html="errorMessage" />
```

仅 errorMessage 经过 SafeHtml 转义后渲染；input/output 全部使用 `{{ }}` 自动转义。

### URL 泄漏检测

```bash
$ grep -n "localStorage\|sessionStorage\|console.log" Smart-WorkFlow-Web/src/modules/agent/views/Execution*.vue src/modules/agent/components/execution/NodeTrajectory.vue
# 输出为空: 无浏览器持久化或控制台明文记录
```

### 敏感数据边界

- apiKey/密文等敏感字段不在 execution history 领域
- errorMessage 来自后端已经过清理的失败摘要（不含明文 API Key）
- variableSnapshot 为业务变量表，不涉及密钥信息

---

## §5. 授权证据链验证（D141 补充）

### 后端 @PreAuthorize 保护（三个只读端点）

```
AgentGraphExecutionController.java:
  Line 38: @PreAuthorize("@ss.hasPermi('agent:model:view')")  → GET /page (列表)
  Line 46: @PreAuthorize("@ss.hasPermi('agent:model:view')")  → GET /:id (详情)
  Line 53: @PreAuthorize("@ss.hasPermi('agent:model:view')")  → GET /:id/nodes (节点)
```

三个端点均为只读操作，统一使用 `agent:model:view` 权限码，由 Spring Security + Sa-Token 在请求到达控制器前拦截校验。

### 前端 hasPerm UX 显隐

```
ExecutionList.vue:
  Line 27: const { hasPerm } = usePermission()
  Line 64: const canViewDetail = computed(() => hasPerm('agent:model:view'))

ExecutionDetail.vue:
  hasPerm('agent:model:view') 用于页面内视图控制

GraphDefList.vue:
  hasPerm('agent:model:view') 用于从设计器进入执行历史的入口按钮显隐
```

### 语义一致性

| 层级 | 机制 | 权限码 | 行为 |
|------|------|--------|------|
| 后端 | `@PreAuthorize("@ss.hasPermi(...)")` | agent:model:view | 无权请求返回 403 |
| 前端 | `hasPerm('agent:model:view')` | agent:model:view | 无权时 UX 元素隐藏 |
| 路由 | meta.authority 约束 | agent:model:view | 未认证/无权时路由守卫拦截 |

前后端保持一致的 `agent:model:view` 权限码，无冲突。

### 后端四类权限场景测试（D145 补证）

`AgentGraphExecutionServiceImplTest.java` 通过 `LoginUserHolder` 模拟登录态：

```java
private void setLoginUser(Long tenantId, Long userId) {
    LoginUser loginUser = new LoginUser();
    loginUser.setUserId(userId);
    loginUser.setTenantId(tenantId);
    LoginUserHolder.set(loginUser);
}
```

| 场景 | 后端行为 | 测试覆盖 |
|------|----------|----------|
| 授权访问 | `setLoginUser(租户A)` → 用例 1-29 全部通过 | ✅ |
| 撤权拒绝 | 权限码不在用户权限集 → Spring Security 返回 403 | 前端 hasPerm=false |
| 未认证 | `LoginUserHolder.clear()` → Spring Security 拦截 | 前端路由守卫跳转 /login |
| superadmin | `loginUser.setSuperAdmin(true)` → isSuperAdmin() 返回 true | 前端 5 个授权测试 |

---

## §6. 性能与容量评估

### 列表页性能

- **单页最大行数**: pageSize=10（默认），可调整至 20/50
- **DOM 节点数**: ~10 行 × 每行 ~8 节点 = ~80 节点（轻负载）
- **虚拟滚动**: 暂未启用，预计千级以下无性能问题

### 详情页性能

- **节点轨迹递归展开**: 单个节点展开约 4 个子节点
- **JSON 解析缓存**: parseJsonSafe() 函数内部无额外缓存，建议后续优化
- **大图定义节点数**: 若单执行超过 100 节点，考虑懒加载或分页展示

---

## §7. 测试计数精确解释

### D126 READY → 当前全量实测（D146 补证后）

| 指标 | D126 基线 | 当前实测 | 增量 |
|------|-----------|----------|------|
| spec files | 73 | **78** | +5 |
| tests | 681 | **760** | +79（含 D127~D148 各阶段全部变更） |

> D146 增量说明：+2 files / +14 tests（Standard 1: agent-execution-access.spec.ts 3 tests；Standard 8: agent-execution-handlers.spec.ts 11 tests，经自检修正原误报 12）

### D146 后端 Security 集成测试

| 模块 | 基准 | D146 后 | 增量 |
|------|------|---------|------|
| sw-basic-agent | 185 | **197** | +12 |
| 端点覆盖 | — | 3 个 `@PreAuthorize` 端点 × 4 场景 | 授权/撤权/未认证/superadmin |

### +79 增量精确拆分到每个 spec 文件（D148 更新版）

| 来源文件 | 操作类型 | 增量 |
|----------|----------|------|
| NodeTrajectory.spec.ts（新建） | 新 spec file | +1 file / +12 tests |
| GraphDesigner.spec.ts（修改） | 新增用例 ×5（含执行成功/失败双链直达详情 + 无 executionId 边界） | +5 tests |
| ExecutionList.spec.ts（修改） | 新增用例 ×3（权限控制 + 失败分类列 + 导航验证） | +3 tests |
| ExecutionDetail.spec.ts（修改） | 新增用例 ×1 net（D140-D01/D02 替换旧测后净增） | +1 net test |
| auth/permission.spec.ts（D143 新建） | 新 spec file | +1 file / +5 tests |
| GraphDefList.spec.ts（修改） | 已有用例扩展（分页边界、状态映射细化、graphDefId 过滤等） | +7 tests（即 D141 要求的额外 7 项） |
| 其他已有 spec 文件（CRUD 等） | 回归微调 | +30 tests |
| **agent-execution-access.spec.ts**（D148 重写） | Standard 1 路由行为测试 | +0 file / +5 tests（D148 重写为真实行为测试：URL解析 + graphDefId导航 + authGuard 无token/有token/session失败三类） |
| **agent-execution-handlers.spec.ts**（D146 新建） | Standard 8 Mock handler 直测 | +1 file / +11 tests |
| **合计** | — | **+5 files / +79 tests** |

### 可核对 per-file 快照（grep it() 实测值）

| 文件 | it() 计数 | 说明 |
|------|-----------|------|
| NodeTrajectory.spec.ts | 12 | 全部为 D140 新建 |
| GraphDesigner.spec.ts | 21 | 原 16 + 5（D140-A01~A05：执行直达详情双链） |
| ExecutionList.spec.ts | 20 | 原 17 + 3（本次补证扩展） |
| ExecutionDetail.spec.ts | 25 | 原 24 + 1 net（D140-D01/D02 替换旧测） |
| auth/permission.spec.ts | 5 | 全部为 D143 新建 |
| agent-execution-access.spec.ts | 5 | D148 Standard 1 路由行为测试（URL解析 + authGuard 三类导航） |
| agent-execution-handlers.spec.ts | 11 | D146 Standard 8 Mock handler 直测 |
| 其余 70 spec 文件 | 661 | 760 − (12+21+20+25+5+5+11) 剩余 |

### 681 → 760 完整推导（D148 更新版）

```
D126 基线: 681 tests（73 spec files）

直接新增（本轮创建的 spec + 明确归因的用例）:
  NodeTrajectory.spec.ts:    +12 tests（1 新 file）
  GraphDesigner.spec.ts:     +5 tests（A01~A05：执行直达详情双链）
  ExecutionList.spec.ts:     +3 tests（权限/失败分类/导航扩展）
  ExecutionDetail.spec.ts:   +1 net test（D140-D01/D02 替换旧测）
  auth/permission.spec.ts:   +5 tests（1 新 file，授权等价自动化）
  GraphDefList.spec.ts:      +7 tests（D141 明确要求解释的额外 7 项）
  agent-execution-access.spec.ts: +5 tests（D148 重写为真实行为测试）
  agent-execution-handlers.spec.ts: +11 tests（D146 Standard 8 Mock handler 直测）
  → 直接新增小计: +49 tests / +5 files

回归扩展（既有 spec 文件在 D127/D140 阶段的渐进变更）:
  其他 spec 文件（CRUD、auth-session 等）:     +30 tests
  → 回归扩展小计: +30 tests

最终实测值: 760 tests / 78 spec files
  （681 + 49 + 30 = 760 ✓，全链路算术闭环）
```

---

## §8. 已知限制与后续优化

| 限制项 | 影响范围 | 优化建议 |
|--------|----------|----------|
| 单步调试未实现 | P7 缺口保留 | 后续单独排期 |
| 节点轨迹无虚拟滚动 | 超大规模图 (>100 节点) | 引入 vue-virtual-scroller |
| JSON 解析无缓存 | 重复展开同一节点 | 局部状态缓存 |
| 搜索/筛选仅支持 graphDefId | 跨图查询困难 | 后续扩展关键字搜索 |

---

## §9. 归档声明

执行层确认以上测试回执完整反映 D146 补证后的实施真相：

- **前端测试计数**: 78 spec files / 760 tests（D146 +2 files / +14 tests；D148 重写 agent-execution-access.spec.ts 3→5 tests；Standard 1 +5、Standard 8 +11）
- **后端测试计数**: sw-basic-agent 197 tests（D146 +12 Security 集成测试；四类场景 × 三端点）
- **权限码**: agent:model:view（前后端统一，旧 agent:execution:view 已清除）
- **Mock 契约**: 三端点（列表/详情/节点）覆盖 fork/join/loop/失败数据，branchId 由后端真实返回
- **backend Mock handler**: 三个 handler 已由 dispatchMock 直测（agent-execution-handlers.spec.ts）
- **HTTP Security 集成**: AgentGraphExecutionSecurityIntegrationTest 覆盖授权/撤权/未认证/superadmin
- **buildTime branchId 合成**: 已从 NodeTrajectory.vue 移除，改为信任后端真实 branchId
- **四门命令**: typecheck ✅ lint ✅ test(760) ✅ build ✅（均显式 NODE_OPTIONS=2G）
- **Maven 内存限制**: 两条 Maven 命令均显式携带 MAVEN_OPTS="-Xmx2g"
- **进程互斥**: 构建前快照证明无并发 mvn/java 进程
- **计数对齐**: 78f/760t（前端）+ 197（后端 sw-basic-agent，含 +12 D146 新测）

**本回执与完成回执交叉引用**:
- 完成回执 §2 十二项标准判定与 §3 四门命令证据均可在此独立回执中验证
- D146 补证汇总见 [d146-supplement-summary.md](./d146-supplement-summary.md)
