# 下一功能候选刷新探索回执（2026-08-24）

> 执行角色回执，结论优先格式。

---

## 一、候选核实

### P48：M07-F03-02 工具/函数调用前端配置管理

- **后端：完整**。V20 双表 + V23 日志；Entity/Mapper/DTO/Service/Controller 全链（`AgentToolConfigController`：GET 列表/详情、POST 创建、PUT 更新/启停切换、DELETE 删除）；`AgentToolCallbackFactory` 运行时转换。
- **前端：仅只读下拉**。`ToolPanel.vue` 仅 `el-select`，无 CRUD 管理页、无 API CRUD 函数、无路由、无菜单种子。
- **缺口**：前端工具配置管理 CRUD 页面（类 ModelList 模式）+ 菜单种子 + 路由。后端零改动。
- **一致性**：清单 M07-F03-02 🟦 / P48 一致。

### P9：M07 图节点级多 Key 轮询

- **F01 编排层：完整**。`AgentOrchestrationServiceImpl` L133-262 已实现 429 检测 + 锁定冷却 + 候选切换 + `triedIds` 去重。V24 四列已就位。
- **图解释层：零轮询**。`AgentGraphInterpreter.callLlmNode()` L389-444 按 config id 取单一配置，异常直接上抛，无 429/重试/切换。调试引擎同理。
- **缺口**：LLM 节点 config 支持 `groupKey` + `callLlmNode()` 集成轮询 + `validateForExecution()` 扩展加载 + 调试引擎同步。
- **复杂度**：中高，涉及核心执行引擎改造。

### P18/P19/P20：助手配置/知识库 RAG/SSE 对话窗口

- **零代码**。I13「选型未定」，无任何实现。三项均为新功能，涉及架构选型，无既有资产可复用。

### P2：M03 表单模块剩余缺口

- **I38 控件库 8/17（confirmed）**：`FieldType.java` 17 成员，8 enabled（TEXT/RICH_TEXT/NUMBER/DATE/BOOL/DICT/REFERENCE/TABLE），9 disabled。
- **I39 表单无删除（confirmed）**：`FormDefinitionController` 无 `@DeleteMapping`。
- **I40 列表配置未持久化（confirmed）**：`derive-list-config.ts` 仅自动派生。
- **可独立最小子集**：I39 表单删除（后端 DELETE + 前端删除按钮/确认弹窗）。

### P3：M05 通知模块剩余缺口

- **I41 无删除（confirmed）**：`NotifyController` 仅 GET + POST read，无 `@DeleteMapping`。
- **I42 无过滤（confirmed）**：`findByRecipient()` 仅按 recipientId 全量倒序。
- **缺口**：后端 DELETE + GET 加 status/keyword 参数 + 前端删除按钮 + 查询条件区。标准 CRUD 扩展。

### P49：M10-F01-01 运行监控

- **现状**：Actuator 仅 `health/info/metrics/prometheus`。无自定义监控 UI、无在线用户追踪、无 Redis/JVM 面板。前端无监控模块目录。
- **缺口**：需新建前端仪表板 + 可能扩展后端端点。选型未定（Redis 依赖、在线用户机制、图表库）。

---

## 二、排序

| # | 候选 | 价值 | 复用 | 契约 | 风险 | 测试 | 解锁 |
|:---:|------|:---:|:---:|:---:|:---:|:---:|:---:|
| **1** | **P48 工具配置前端** | 高 | 极高 | 极高 | 极低 | 极高 | 高 |
| 2 | P3 通知缺口 | 中 | 高 | 高 | 低 | 高 | 中 |
| 3 | P2 表单删除 | 中 | 高 | 高 | 低 | 高 | 低 |
| 4 | P9 图节点多Key | 中 | 中 | 中 | 中高 | 中 | 中 |
| 5 | P49 运行监控 | 中 | 低 | 低 | 中 | 中 | 低 |
| 6 | P18/19/20 | 高 | 无 | 极低 | 高 | 低 | 高但远 |

### 推荐：P48 工具配置前端管理页

**理由**：后端零改动（API 已完整）、ModelList 先例可复制、纯前端独立闭环、解锁 TOOL 节点可用性、Mock 模式可完整验证。不选 P3 因为通知非核心链路且涉及前后端双栈。

---

## 三、P48 方向素材

**目标**：为工具/函数调用提供前端 CRUD 管理页面，使用户可注册、编辑、删除、启停内部和外部工具。

**非目标**：不改后端 API / 不做工具调试界面 / 不做调用日志查看 / 不改 ToolPanel。

**影响范围**：`Smart-WorkFlow-Web/src/modules/agent/` — 新增 ToolInternalList + ToolExternalList + 表单弹窗 + API 函数 + 路由 + 菜单种子迁移。零后端改动。

**风险**：菜单种子迁移编号需确认（V37+）；内部工具 `inputSchema`（JSON Schema）展示可能需简化。

**验收行为**：
1. 内部/外部工具列表页：分页、搜索、新增/编辑弹窗、启停、删除确认
2. 菜单可达：Agent 模块下「工具管理」入口
3. Mock 模式 CRUD 全流程
4. 新增工具后图设计器 TOOL 节点下拉可选

---

## 四、前置检查

- 无已下发未完成方向、无重复 P/I 编号、无阻塞前置任务
- 菜单种子迁移编号需确认（V37 或更高）
- 所有候选事实与 knowledge/、功能清单、需求池一致，无冲突
