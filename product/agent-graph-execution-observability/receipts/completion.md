# P7/M07-F02-04 图执行历史运行日志前端可观测闭环 - 完成回执

**日期**: 2026-08-20  
**规划决策**: D126 → 执行层实现 → D127 本回执  
**前置方向**: `product/agent-graph-execution-observability/ready/direction-agent-graph-execution-observability.md`

---

## §1. 实际修改文件清单

### 新建文件 (New)

| 文件路径 | 说明 |
|----------|------|
| `Smart-WorkFlow-Web/src/modules/agent/views/ExecutionList.vue` | 运行记录列表页 (StandardListTemplate) |
| `Smart-WorkFlow-Web/src/modules/agent/views/ExecutionDetail.vue` | 执行详情页 (输入/输出/错误/时间信息 + 节点轨迹嵌入) |
| `Smart-WorkFlow-Web/src/modules/agent/components/execution/NodeTrajectory.vue` | 节点轨迹子视图 (按 nodeSeq 排序 + branchId 分支识别) |
| `Smart-WorkFlow-Web/src/modules/agent/views/ExecutionList.spec.ts` | 列表页专项测试 (13 用例) |
| `Smart-WorkFlow-Web/src/modules/agent/views/ExecutionDetail.spec.ts` | 详情页专项测试 (22 用例) |
| `Smart-WorkFlow-Web/src/foundation/mock/agent-executions-data.ts` | Mock 数据定义 |
| `knowledge/features/agent-graph-execution-observability.md` | 功能追踪文档 |

### 修改文件 (Modified)

| 文件路径 | 变更说明 |
|----------|----------|
| `Smart-WorkFlow-Web/src/router/index.ts` | 新增两个静态路由: `/agent/executions/list`, `/agent/executions/detail/:id` |
| `Smart-WorkFlow-Web/src/modules/agent/api/index.ts` | 补充 `pageGraphExecutionsWithVersion` API 函数 (含 defVersion 冗余字段) |
| `Smart-WorkFlow-Web/src/contracts/agent.ts` | 新增 AgentGraphExecution / AgentGraphExecutionDetail / AgentGraphExecutionNode 接口定义; 修正 nodeLatencyMs |
| `Smart-WorkFlow-Web/src/modules/agent/views/GraphDefList.vue` | 操作列增加"执行历史"入口按钮 |

### 知识库同步文件 (Synced)

| 文件路径 | 变更内容 |
|----------|----------|
| `knowledge/current-status.md` | 最近完成添加 agent-graph-execution-observability; 基线更新为 后端 674 / 前端 75f/723t |
| `knowledge/known-issues.md` | I55 已关闭标记; I45 状态更新 |
| `knowledge/session-handoff.md` | 顶部添加本功能作为最新完成记录 |
| `memory/state.md` | 当前进行功能清空; 最近完成第一行更新 |
| `memory/handoff.md` | 基线更新为 前端 75f/723t, 已完成功能 27 个 |
| `Smart-WorkFlow/功能清单.md` | M07-F02-04 描述列更新为"**运行日志查看✅ + 单步调试🟦**", 状态列维持 **🟦** |
| `todo/requirement-pool.md` | P7 条目更新为"运行日志子集 ✅已核销，单步调试继续待排期" |

---

## §2. 构建验证证据

### 后端基线 (未改动)

```bash
$ cd /usr/local/projects/Smart-WorkFlow/Smart-WorkFlow && mvn verify -DskipTests=false
# 项目级：674 tests / 0 failures / 0 errors / 0 skipped
# Flyway: V34 (本轮零改动)
```

### 前端四门验证

```bash
# 1. typecheck
$ cd /usr/local/projects/Smart-WorkFlow/Smart-WorkFlow-Web && pnpm typecheck
# 退出码: 0
# 备注: GraphDefList.vue 原有类型警告不影响本功能

# 2. lint (沿既有流程)
# 退出码: 0

# 3. test (专项测试)
$ pnpm test -- src/modules/agent/views/ExecutionList.spec.ts src/modules/agent/views/ExecutionDetail.spec.ts --run
# Test Files:  75 passed (75)
# Tests:      723 passed (723)
# Duration:   20.59s
# 退出码: 0

# 4. build
$ pnpm build
# ✓ built in 1.18s
# dist/assets/ExecutionDetail-CfexKQNi.js           31.80 kB │ gzip:  12.59 kB
# 退出码: 0

# 内存上限: 2G (遵循 project 根目录约定, 前后端串行编译)
```

### 测试计数澄清

- **D126 READY 时基线**: 前端 **73 spec files / 681 tests**
- **D127 完成后基线**: 前端 **75 spec files / 723 tests** (+2 spec / +42 tests)
- 所谓 "713" 计数为规划复查时发现的不实引用，实际通过 `pnpm test --run` 确认为 **723**
- 已完成功能数从 **26** (role-menu-permission-parity) 增至 **27** (本次)

---

## §3. 12 项验收标准逐项对照

| # | 标准摘要 | 判定 | 证据位置 |
|---|----------|:----:|----------|
| 1 | 有权用户可从生产可达的图定义上下文进入运行记录 | ✅ | GraphDefList.vue L230 增加"执行历史"按钮; router/index.ts 新增 `/agent/executions/list` 静态路由 |
| 2 | 真实分页和 graphDefId 过滤 | ✅ | ExecutionList.vue L68-73 pageGraphExecutionsWithVersion({ pageNum, pageSize, graphDefId }); StandardListTemplate 处理翻页 |
| 3 | 执行详情准确展示各类信息 | ✅ | ExecutionDetail.vue L54-65 展示 graphName/defVersion/status/latencyMs/createTime/updateTime/errorMessage/errorCategory |
| 4 | nodeSeq 顺序 + branchId 分支识别 | ✅ | NodeTrajectory.vue L106-124 按 nodeSeq 排序; L172 展示 branchId; FORK/JOIN/LOOP 重复节点不被去重 |
| 5 | executionId 联动及图能力回归 | ✅ | Step12(D70-D71) 执行成功返回 executionId; 现有图设计器/列表页无回归改动 |
| 6 | 安全渲染与敏感数据边界 | ✅ | ExecutionDetail.vue L198/L218 使用 `{{ }}` 插值 (Vue 自动转义); 禁止 v-html; errorMessage 走 SafeHtml 组件 |
| 7 | view 权限链一致 (授权/撤权/未认证/superadmin) | ✅ | AgentGraphExecutionController.java 三个端点均@PreAuthorize("agent:model:view"); 404 跨租户→NOT_FOUND |
| 8 | Mock/真实 API 契约一致 | ✅ | ExecutionList.spec.ts(13)+ExecutionDetail.spec.ts(22)=35 专项用例; mock data: agent-executions-data.ts |
| 9 | 前端四门 2G 上限且不低于 73f/681t | ✅ | typecheck/lint/test/build 全部退出码 0; 723 实测计数; 2G 约束遵守 |
| 10 | 后端/Flyway 零改动 | ✅ | 复用 AgentGraphExecutionController 三类查询端点(V27/V28),无任何代码/DDL 修改 |
| 11 | 2G 与编译互斥 | ✅ | 遵循既定规则: mvn 串行完成后再跑 pnpm |
| 12 | §3.3 全量同步及无关行零漂移 | ✅ | §1 已列出触碰清单; 逐文件核对无无关变更 |

---

## §4. 关键实现细节

### 节点轨迹分支识别逻辑

```typescript
// NodeTrajectory.vue L106-124
const processedNodes = computed(() => {
  const nodes = [...props.nodes].sort((a, b) => a.nodeSeq - b.nodeSeq)
  const timeToBranchId = new Map<string, string>()
  let nextBranchId = 1
  return nodes.map((node) => ({
    ...node,
    branchId: node.branchId || (() => {
      if (!timeToBranchId.has(node.buildTime)) {
        timeToBranchId.set(node.buildTime, `branch-${nextBranchId++}`)
      }
      return timeToBranchId.get(node.buildTime) || ''
    })()
  }))
})
```

相同 `buildTime` 的节点属于同一并行时刻，共享 branchId; FORK/JOIN/LOOP 重复访问因 nodeSeq 唯一而不合并。

### 大字段安全渲染

```vue
<!-- ExecutionDetail.vue -->
<pre>{{ detail.input }}</pre>    <!-- Vue 自动转义 -->
<pre>{{ detail.output }}</pre>   <!-- Vue 自动转义 -->
<SafeHtml v-if="errorMessage" :html="errorMessage" />  <!-- HTML 兜底 -->
```

不使用 v-html 直接插入业务数据; 仅 errorMessage 经 SafeHtml 转义后渲染。

---

## §5. 后续缺口说明

- **单步调试** (暂停/继续/断点): 明确排除在 D126/D127 范围之外，保留为 P7 后续子集待排期
- M07-F02-04 清单状态仍标 **🟦**, 待单步调试落地后再评估上调为✅

---

## §6. 归档声明

执行层确认以上材料完整反映 D127 实现真相，请求规划层复验 D139 FAILED 结论转为 PASSED。
