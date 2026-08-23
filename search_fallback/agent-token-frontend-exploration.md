# 探索结论：Agent 前端代码结构（Token 字段添加用）

## 问题1：Agent 运行日志列表/详情页面在哪个目录？使用哪些组件？

**运行日志 = "执行记录（Execution）"**，相关文件全部位于：

```
Smart-WorkFlow-Web/src/modules/agent/
├── views/
│   ├── ExecutionList.vue        ← 执行记录列表页
│   ├── ExecutionDetail.vue      ← 执行记录详情页（含节点轨迹）
│   ├── ExecutionList.spec.ts    ← 列表页测试
│   └── ExecutionDetail.spec.ts  ← 详情页测试
├── components/execution/
│   └── NodeTrajectory.vue       ← 节点轨迹子组件（在详情页中嵌入）
└── api/
    └── index.ts                 ← 所有 Agent API 调用
```

**路由（`router/index.ts`）**：
| 路由 name | path | 组件 |
|-----------|------|------|
| `agent-execution-list` | `agent/executions/list` | ExecutionList.vue |
| `agent-execution-detail` | `agent/executions/detail/:executionId` | ExecutionDetail.vue |

**组件使用关系**：
- `ExecutionList.vue` → 纯列表页，使用 `useRouter` 跳转详情
- `ExecutionDetail.vue` → 详情页，嵌入 `NodeTrajectory` 子组件，展示节点执行轨迹

## 问题2：会话历史页面在哪个目录？使用哪些组件？

**会话历史 = "会话记录（Conversation）"**，相关文件：

```
Smart-WorkFlow-Web/src/modules/agent/
├── views/
│   ├── AgentHome.vue            ← Agent 首页（运行入口，对话界面）
│   ├── ModelList.vue            ← 模型配置列表
│   └── ModelFormDialog.vue      ← 模型表单弹窗
```

**路由**：Agent 模块目前只注册了 graph-designer、execution-list、execution-detail 三个子路由。AgentHome 可能通过菜单/iframe 访问，未在 router/index.ts 中显式注册。

**注意**：前端有完整的 Conversation 类型定义和 API 接口，但**目前没有独立的会话历史列表/详情页面组件**。`AgentHome.vue` 可能承担对话功能，但没有专门的历史会话浏览视图。

## 问题3：现有的 API 调用使用哪个 API 类？

所有 Agent API 集中在单一文件：

```
Smart-WorkFlow-Web/src/modules/agent/api/index.ts
```

**API 常量**：
```
AGENT_GRAPH_API  = /api/agent/graphs
AGENT_EXECUTION_API  = /api/agent/executions
AGENT_CONVERSATION_API  = /api/agent/conversations
AGENT_MODEL_API  = /api/agent/models
```

**执行记录相关 API（直接相关 token 字段展示）**：
| 方法 | 常量 | 端点 | 用途 |
|------|------|------|------|
| `listExecutions(params)` | `AGENT_EXECUTION_API` | `/api/agent/executions` | GET 分页查询 |
| `getExecution(executionId)` | `AGENT_EXECUTION_API` | `/api/agent/executions/{id}` | GET 详情 |
| `listConversations(params)` | `AGENT_CONVERSATION_API` | `/api/agent/conversations` | GET 会话分页 |
| `getConversationDetail(conversationId)` | `AGENT_CONVERSATION_API` | `/api/agent/conversations/{id}` | GET 会话详情 |

所有请求走统一的 `request` 封装（`@/foundation/request`）。

## 问题4：TypeScript 类型定义在哪个文件？

```
Smart-WorkFlow-Web/src/contracts/agent.ts
```

**与 Token 字段直接相关的类型**：

```typescript
// 执行记录类型（列表+详情共用）
export interface AgentExecutionRecord {
  executionId: string
  graphId: string
  graphName: string
  graphVersion: number
  conversationId: string | null
  status: AgentExecutionStatus   // PENDING | RUNNING | SUCCESS | FAILED
  startTime: string              // ISO8601
  endTime: string | null
  latencyMs: number | null
  errorMessage: string | null
  metadata: Record<string, unknown> | null
  createdAt: string
}

// 节点执行记录
export interface AgentGraphExecutionNode {
  nodeId: string
  nodeName: string
  nodeType: string
  nodeSeq: number
  branchId: string
  input: string | null
  output: string | null
  status: string
  nodeLatencyMs: number
  errorMessage: string | null
  startTime: string | null
  endTime: string | null
}

// 会话记录
export interface AgentConversationRecord {
  conversationId: string
  graphId: string
  graphName: string
  title: string
  status: AgentConversationStatus
  lastMessage: string | null
  lastMessageTime: string | null
  messageCount: number
  createdAt: string
}

// 会话消息
export interface AgentConversationMessage {
  messageId: string
  conversationId: string
  role: 'user' | 'assistant' | 'system'
  content: string
  metadata: Record<string, unknown> | null
  createdAt: string
}
```

**关键发现：当前类型中没有 token/usage 相关字段。** 需要在以下位置添加：
1. `AgentExecutionRecord` — 添加 token 汇总统计
2. `AgentGraphExecutionNode` — 添加节点级 token 统计
3. 新增 `AgentTokenUsage` 接口定义

## 检查范围

实际读取了以下文件：
- `Smart-WorkFlow-Web/src/contracts/agent.ts` — 完整读取
- `Smart-WorkFlow-Web/src/modules/agent/api/index.ts` — 完整读取
- `Smart-WorkFlow-Web/src/modules/agent/views/ExecutionList.vue` — 完整读取
- `Smart-WorkFlow-Web/src/modules/agent/views/ExecutionDetail.vue` — 完整读取
- `Smart-WorkFlow-Web/src/modules/agent/components/execution/NodeTrajectory.vue` — 完整读取
- `Smart-WorkFlow-Web/src/modules/agent/views/AgentHome.vue` — 完整读取
- `Smart-WorkFlow-Web/src/modules/agent/views/ModelList.vue` — 完整读取
- `Smart-WorkFlow-Web/src/modules/agent/views/ModelFormDialog.vue` — 完整读取
- `Smart-WorkFlow-Web/src/router/index.ts` — Agent 相关路由行

## 已确定事实

1. Agent 执行记录的**详情页是添加 token 字段的最佳位置**：`ExecutionDetail.vue` 已有 `agentExecution` 响应对象，目前用 `metadata` 承载额外信息
2. `NodeTrajectory.vue` 展示节点级详情，可扩展显示节点级 token 使用
3. API 层 `getExecution(executionId)` 返回 `AgentExecutionRecord`，需要在类型定义和后端接口中同步增加 token 字段
4. 列表页 `ExecutionList.vue` 的表格列可选加 token 汇总列
5. 前端没有独立的"会话历史"页面组件，Conversation API 和类型已有但无专用视图

## 分析推测

1. **Token 字段的添加路径**（按依赖顺序）：
   - ① `contracts/agent.ts` — 新增 `AgentTokenUsage` 类型 + 扩展 `AgentExecutionRecord` 和 `AgentGraphExecutionNode`
   - ② `ExecutionDetail.vue` — 在详情卡片区域添加 token 使用统计展示
   - ③ `NodeTrajectory.vue` — 在节点元信息行添加 token 显示
   - ④ `ExecutionList.vue` — 可选：列表表格加 token 汇总列
2. 后端 `AgentExecutionRecordResponse` 需同步新增 `promptTokens`、`completionTokens`、`totalTokens` 字段

## 未确认事项

1. `AgentHome.vue` 是否已包含对话/会话历史功能（需进一步确认其完整实现）
2. 后端 `AgentExecutionRecordResponse` 是否已包含 token 字段（需确认后端 DTO）
3. 后端 `AgentGraphExecutionNodeResponse` 是否已包含 token 字段

## 是否需要继续探索

**否**。前端 Agent 代码结构已明确，足以支撑 token 字段的前端添加工作。

## 建议返回规划层的最小结论

- Agent 执行记录页面（`ExecutionList.vue` + `ExecutionDetail.vue` + `NodeTrajectory.vue`）是添加 token 字段的目标位置
- TypeScript 类型在 `contracts/agent.ts`，API 在 `modules/agent/api/index.ts`
- 当前类型中无 token 字段，需要新增 `AgentTokenUsage` 类型并在 3 个接口中扩展
- 后端 `AgentExecutionRecordResponse` / `AgentGraphExecutionNodeResponse` 需同步确认
