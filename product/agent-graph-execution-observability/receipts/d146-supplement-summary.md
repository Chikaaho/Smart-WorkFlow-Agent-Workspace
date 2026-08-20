# P7/M07-F02-04 图执行历史运行日志 — D146 补证汇总

**日期**: 2026-08-20  
**前置审查**: D145 FAILED（7/12 通过，剩余 5 项）  
**本轮修复**: D146 执行层补证，并行派发前端 + 后端两个 subagent  

---

## §1. D145 五项未闭合逐项修复

### 标准 1：刷新/直达保持 graphDefId 上下文 + 无权拦截 → ✅ 已修复

**D146 初版发现缺陷（修复前）**：
- 路由路径参数为 `:id`，但组件读取 `route.params.executionId` → 实际运行时参数为 `undefined`
- 路由 `meta` 仅有 `{ title: '执行详情' }`，缺少 `authority` 约束

**修复内容：**

| 文件 | 操作 |
|------|------|
| `src/router/index.ts` L87-92 | **修改**：路径参数 `:id` → `:executionId`（匹配组件 params 名）；meta 追加 `authority: ['agent:model:view']` |
| `src/router/agent-execution-access.spec.ts` | **修订**：从模拟路由改为直读真实 router/index.ts 源码，验证 :executionId 参数名 + meta.authority 约束 + goBack graphDefId |

**证据链：**
- 静态路由 `/agent/executions/detail/:executionId` 在 `router/index.ts` 中以 `children` 形式注册
- meta.authority = `['agent:model:view']` 由 authGuard 拦截（无 token 或权限不足 → 跳转 /login）
- goBack() 实现使用 `router.push({ name: 'agent-execution-list', query: { graphDefId } })`，确保返回列表页时保留过滤上下文
- spec 测试通过 fs.readFileSync 直接读取 router/index.ts 验证参数名与 authority（非模拟数据）

---

### 标准 3：真实后端跨租户语义 → 保持通过（无回退）

D145 判定为通过。AgentGraphExecutionServiceImplTest 中的用例 6、30 已覆盖跨租户隔离。无改动。

---

### 标准 7：HTTP/Security 集成自动化 → ✅ 已修复

**修复内容：**

| 文件 | 操作 |
|------|------|
| `sw-basic/sw-basic-agent/src/test/java/com/sw/ck/agent/controller/AgentGraphExecutionSecurityIntegrationTest.java` | **新建**：Spring Boot MVC 集成测试，覆盖四类场景 × 三个端点 = 12 个测试用例 |

**四个安全场景每个端点的 HTTP 断言：**

| 端点 | 授权 (200) | 撤权 (403) | 未认证 (401) | Superadmin (200) |
|------|-----------|-----------|-------------|-----------------|
| `GET /agent/graph-executions` | ✅ pageList_withViewPermission_shouldReturn200 | ✅ pageList_withoutViewPermission_shouldReturn403 | ✅ pageList_unauthenticated_shouldReturn401 | ✅ pageList_superAdminBypass_shouldReturn200 |
| `GET /agent/graph-executions/{id}` | ✅ detail_withViewPermission_shouldReturnDetail | ✅ detail_withoutViewPermission_shouldReturn403 | ✅ detail_unauthenticated_shouldReturn401 | ✅ detail_superAdminBypass_shouldReturn200 |
| `GET /agent/graph-executions/{id}/nodes` | ✅ nodes_withViewPermission_shouldReturnNodeTraces | ✅ nodes_withoutViewPermission_shouldReturn403 | ✅ nodes_unauthenticated_shouldReturn401 | ✅ nodes_superAdminBypass_shouldReturn200 |

**全模块回归**: 197 tests / 0 failures / 0 errors — BUILD SUCCESS

---

### 标准 8：Mock handler 直测 → ✅ 已修复

**修复内容：**

| 文件 | 操作 |
|------|------|
| `src/foundation/mock/handlers.ts` | **修改**：import MOCK_AGENT_GRAPH_EXECUTIONS；末尾追加 3 个 handler（列表分页 GET、详情 GET/:id、节点轨迹 GET/:id/nodes） |
| `src/foundation/mock/seeds.ts` | **修改**：新增 MOCK_AGENT_GRAPH_EXECUTIONS 种子数据（3 条记录：SUCCESS 顺序链 / FAILED timeout / SUCCESS FORK-JOIN 分支） |
| `src/foundation/mock/agent-execution-handlers.spec.ts` | **新建**：11 个直接 handler 测试用例（dispatchMock 调用），覆盖分页/过滤、成功/失败/404、nodeSeq 排序、FORK/JOIN branchId、失败 errorMessage、LOOP 不重复合规 |

**handler 注册条目：**

| # | Method | Pattern | 功能 |
|---|--------|---------|------|
| 1 | GET | `/api/agent/graph-executions` | 分页列表 + graphDefId 过滤 |
| 2 | GET | `/api/agent/graph-executions/:id` | 详情查询（不存在 → 404） |
| 3 | GET | `/api/agent/graph-executions/:id/nodes` | 节点轨迹（按 nodeSeq 升序） |

**测试覆盖矩阵：**

| Handler | 正常返回 | 参数过滤 | 错误响应 | 特殊数据结构 |
|---------|---------|---------|---------|------------|
| 列表 | ✅ 默认分页 | ✅ graphDefId 过滤 + 无匹配空页 | — | — |
| 详情 | ✅ 关键字段完整 | — | ✅ 404 not found | ✅ FAILED 含 errorInfo |
| 节点 | ✅ nodeSeq 升序 | — | ✅ 404 not found | ✅ FORK/JOIN branchId + LOOP 不重复合规 |

---

### 标准 11：显式 Maven 2G 内存限制 → ✅ 已修复

**本轮实际命令：**
```bash
cd sw-basic/sw-basic-agent && MAVEN_OPTS="-Xmx2g" mvn test -Dtest=AgentGraphExecutionSecurityIntegrationTest
MAVEN_OPTS="-Xmx2g" mvn test          （全模块回归）
```

- 两条命令均显式携带 `MAVEN_OPTS="-Xmx2g"`
- 前端四门命令均显式携带 `NODE_OPTIONS="--max-old-space-size=2048"`
- 物理内存 1.6G，实际操作串行（后端测试完成后启动前端四门）

---

### 标准 12：§3.3 终态同步 → ⏳ 待规划层裁定后执行

本条款条件性挂起：需规划层对 D146 补证结果作出新裁定后再执行。当前方向继续 `ready/`，P7 运行日志子集暂不核销，单步调试不入本轮。

---

## §2. 计数变更

| 维度 | D145 前 | D146b 后 | 增量 |
|------|---------|---------|------|
| 后端总测试数 | 674 | ~686 | +12 |
| 前端 spec files | 76 | 78 | +2 |
| 前端测试数 | 744 | 760 | +16 |
| 后端 Security 集成测试 | 0 | 12 | +12 |
| 前端 Mock handler 直测 | 0 | 11 | +11 |
| 前端路由访问控制测试 | 0 | 5 | +5（D148 重写为真实行为测试：URL解析 + graphDefId导航 + authGuard 无token/有token/session失败三类） |
| 新增 Mock Handler | 0 | 3 | +3 |
| 新增 Mock Seed 数据 | 0 | 3 条 | +3 |

**注意**：前后端测试数合计约 686 + 760 ≈ 1446（两端分别计算）。项目级基线待最终确认。

---

## §3. 四门验证快照

### 后端（完整模块）

```
Tests run: 197, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS (12.2s)
```

### 前端（四连绿）

| 命令 | 退出码 | 备注 |
|------|--------|------|
| `pnpm typecheck` | 0 | 无类型错误 |
| `pnpm lint` | 0 | 0 errors, 0 warnings（prettier 警告已全部 auto-fix） |
| `pnpm test -- --run` | 0 | 78 files / 760 tests passed |
| `pnpm build` | 0 | built in 965ms |

所有命令均显式携带内存上限参数。

---

## §4. 归档声明

执行层确认以上补证材料完整反映 D146b 补证实际工作（含修复 D146 初版发现的缺陷）：

- **标准 1**：路由路径参数 `:executionId` 与组件 params 匹配；meta.authority = `['agent:model:view']` 已添加；spec 验证真实 router 源码而非模拟数据
- **标准 7**：HTTP Security 集成测试覆盖四类场景 × 三端点，零回归
- **标准 8**：Mock handler 直测 11 用例覆盖分页/过滤/成功/失败/404/FORK-JOIN/LOOP
- **标准 11**：Maven 和 Node.js 命令均显式携带内存上限参数
- **标准 12**：知识同步待规划层裁定后执行

**本文件声明：**
- ✅ 执行层完成全部可执行项修复（标准 1、7、8、11）
- ✅ 标准 12 待规划层作出新的裁定后执行 §3.3 知识同步、全文零漂移审计及 passed 归档
- ✅ 本回执作为补证材料提交规划层审理

**补证完成时间**: 2026-08-20  
**补证人**: Execution Layer
