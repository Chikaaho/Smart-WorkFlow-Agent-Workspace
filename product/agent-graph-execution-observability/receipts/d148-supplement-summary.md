# P7/M07-F02-04 图执行历史运行日志 — D148 补证汇总

**日期**: 2026-08-20
**前置审查**: D147 FAILED（9/12通过，剩余标准 1/11/12）
**本轮修复**: 标准1 行为测试重写 + 标准11 进程互斥快照 + 计数全文统一

---

## §1. D147 三项未闭合逐项修复

### 标准 1：刷新/直达保持 graphDefId 上下文 + 无权拦截 → ✅ 已修复

**D147 缺陷**：spec 以 `fs.readFileSync` 静态读取 router 源码字符串，没有创建真实 router、模拟刷新挂载、调用 authGuard。

**修复内容**：

| 文件 | 操作 |
|------|------|
| `src/router/agent-execution-access.spec.ts` | **完全重写**：移除全部 `fs.readFileSync`，改为真实行为测试 |

**5 个行为测试用例**：

| # | describe | 测试名称 | 验证方式 |
|---|----------|----------|----------|
| 1 | route resolution | resolve 详情 URL 正确解析 :executionId 参数 | 真实 `createRouter` + `createMemoryHistory`，`router.resolve('/agent/executions/detail/exec-123')` 断言 `params.executionId === 'exec-123'` |
| 2 | route resolution | 从详情 URL 构造携带 graphDefId query 的返回列表 | `router.resolve({ name: 'agent-execution-list', query: { graphDefId: 'gd-456' } })` 断言 `fullPath` 含 `graphDefId=gd-456` |
| 3 | authGuard behavior | 无 token + refresh 失败 → 重定向 /login 并携带 redirect 参数 | 直接调用 `authGuard()`，mock `getAccessToken=null` + `refresh=reject`，断言 `next({ path: '/login', query: { redirect } })` |
| 4 | authGuard behavior | 有 token + 动态路由已构建 → next() 正常通过 | 先触发动态路由构建（mock router），再对真实 router resolve 的 detail 路由调用 `authGuard()`，断言 `next()` 无参数调用 |
| 5 | authGuard behavior | session 构建失败 → logout + 重定向 /login | mock `loadSession=reject`，断言 `logout` 被调用 + next redirect 到 /login |

**关键实现细节**：
- 测试 1-2：使用 `createRouter({ history: createMemoryHistory(), routes: [...] })` 真实路由实例
- 测试 3-5：使用 mock router `{ addRoute, removeRoute, hasRoute }` + 直接调用 `authGuard()` 函数（与 `guard.spec.ts` 模式一致）
- 全部移除 `fs.readFileSync`/`node:fs`/`node:path` 依赖
- mock 依赖：`getAccessToken`, `refresh`, `logout`, `loadSession`, `loadMenu`, `buildRoutesFromMenu`, `findFirstLeafPath`
- 每个测试前调用 `clearDynamicRoutes(router)` 重置 guard 模块内部状态
- 使用 Pinia `setActivePinia(createPinia())` 隔离 store

**测试通过**：78 files / 760 tests 全绿（D148 +2 tests vs D146 758）

---

### 标准 11：显式 2G 内存 + 前后端编译互斥 → ✅ 已修复

**D147 缺陷**：沿用 21:54-21:55 的 76/744 旧轮次快照，不匹配当前后端 197 / 前端 760。

**本轮实测**（2026-08-20 23:21—23:25）：

#### 后端

```bash
$ date -Iseconds
2026-08-20T23:21:43+08:00
$ cd Smart-WorkFlow && MAVEN_OPTS="-Xmx2g" mvn test
[INFO] Tests run: 685, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
[INFO] Total time: 40.583 s
$ date -Iseconds
2026-08-20T23:22:25+08:00
```

**sw-basic-agent 模块**: 197 tests（含 D146 +12 Security 集成测试）

#### 进程互斥快照

```
初始快照 (23:21:37): 无 java/mvn 进程
后端结束-前端开始前 (23:22:54): 无 java/mvn 残留 ✅
前端结束后 (23:25:07): 无残留进程 ✅
```

#### 前端四门

```bash
$ date -Iseconds
2026-08-20T23:24:11+08:00
```

| 门 | 命令 | 退出码 | 时间 |
|----|------|--------|------|
| typecheck | `NODE_OPTIONS="--max-old-space-size=2048" pnpm typecheck` | 0 | 23:24:11-23:24:17 |
| lint | `NODE_OPTIONS="--max-old-space-size=2048" pnpm lint` | 0 (0 errors, 0 warnings) | 23:24:20-23:24:28 |
| test | `NODE_OPTIONS="--max-old-space-size=2048" pnpm test -- --run` | 0 (78 files / 760 tests) | 23:24:32-23:24:53 |
| build | `NODE_OPTIONS="--max-old-space-size=2048" pnpm build` | 0 | 23:24:56-23:25:04 |

**串行时序**:
| 时间 | 阶段 | 进程 |
|------|------|------|
| 23:21:43 | 后端测试开始 | java (Maven) |
| 23:22:25 | 后端测试完成 | java 退出 |
| 23:22:54 | 确认后端进程清零 | — |
| 23:24:11 | 前端 typecheck | node/tsc |
| 23:24:20 | 前端 lint | node/eslint |
| 23:24:32 | 前端 test | node/vitest (78 files, 760 tests) |
| 23:24:56 | 前端 build | node/rolldown |
| 23:25:04 | 前端 build 完成 | node 退出 |

---

### 标准 12：§3.3 终态同步 → ⏳ 待规划层裁定后执行

本条款条件性挂起：需规划层对 D148 补证结果作出新裁定后再执行。

---

## §2. 计数变更

| 维度 | D147 前 | D148 后 | 增量 |
|------|---------|---------|------|
| 前端 spec files | 73 (D126基线) | **78** | +5 |
| 前端 tests | 681 (D126基线) | **760** | +79 |
| agent-execution-access.spec.ts | 3 (D146 静态检查) | **5 (D148 行为测试)** | +2 |
| 后端 sw-basic-agent | 197 | **197** | 0（D146 已固定） |
| 后端项目级 | — | **685** | — |

**D146 净增**: +2 files / +14 tests（744→758，access 3 + handlers 11）
**D148 净增**: +0 files / +2 tests（758→760，access 重写 3→5）
**D126→D148 累计**: +5 files / +79 tests（681→760）

**计数全文统一**: test-receipt.md 和 d146-supplement-summary.md 中所有 "+76" 已修正为 "+79"，"758" 已修正为 "760"。算术闭环：681 + 49（直接新增）+ 30（回归扩展）= 760 ✓

---

## §3. 十二项状态

| 标准 | 状态 | 说明 |
|------|------|------|
| 1 | ✅ | 真实行为测试：createRouter URL 解析 + authGuard 三类导航（无token/有token/session失败）|
| 2 | ✅ | 列表分页 + graphDefId 过滤（保持） |
| 3 | ✅ | 跨租户隔离（保持，后端用例6/30） |
| 4 | ✅ | 节点轨迹 nodeSeq/branchId（保持） |
| 5 | ✅ | GraphDesigner executionId 直达（保持） |
| 6 | ✅ | 安全渲染 SafeHtml（保持） |
| 7 | ✅ | HTTP Security 集成 12 tests（保持） |
| 8 | ✅ | Mock handler 直测 11 tests（保持） |
| 9 | ✅ | 前端四门 78f/760t 全绿 |
| 10 | ✅ | 后端 + Flyway 零改动 |
| 11 | ✅ | 带时间戳进程互斥快照，后端 685 / 前端 760 |
| 12 | ⏳ | 待规划层 PASSED 后执行 §3.3 同步 |

**合计**：11/12 通过（标准 12 条件性 pending）。

---

## §4. 归档声明

执行层确认以上补证材料完整反映 D148 修复实际工作：

- ✅ 标准 1：完全移除 fs.readFileSync，5 个真实行为测试
- ✅ 标准 11：23:21-23:25 带时间戳全量测试 + 进程互斥快照
- ✅ 计数全文统一："+76"→"+79"，758→760
- ⏳ 标准 12：待规划层 PASSED 后执行 §3.3 知识同步

**补证完成时间**: 2026-08-20
**补证人**: Execution Layer
