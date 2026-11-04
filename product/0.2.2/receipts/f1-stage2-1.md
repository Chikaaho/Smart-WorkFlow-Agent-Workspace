# F1 阶段 2（graph 完善）回执 · 第 1 轮

- 执行入口：`product/0.2.2/ready/direction-022-f1-agent.md` 阶段 2，并处理 `planning-review-f1-stage1-03.md` 的“带入阶段 2 的事项”
- 代码状态：server `feature/0.2.2-agent` @ `4acde6c1`；web `feature/0.2.2-agent` @ `1667d80`
- 验证环境：本地 PG 18（`smart_workflow_f1v4b`，保留）、server 8080（local profile）、vite 5174、本地模型/工具桩 9998/9999；可见浏览器（ZCode 应用内浏览器，headless=false，1440×900）
- 密钥处理：Owner 提供的真实 Command Code Key 仅经本地 API 写入 `sw_agent_provider.api_key_cipher`（AES-GCM 密文，密文长度 164），**按 Owner 指示保留在本地验证库，不再删除**；未进入 git、种子、迁移、回执、日志或截图。回执中的请求/输出均不含 Key。

## 一、实现内容

### 1. D022-06 发布版本快照 ✅

- 新增 `sw_agent_graph_snapshot`（V0.2.3，PG/H2），发布时固化该版本完整 `graph_json`；已发布存量图在迁移中按当前 `defVersion` 回填（更早历史内容无法重建）。
- 执行与调试改为按 `graphDefId + defVersion` 读取快照，不再读取可被草稿编辑覆盖的 `graph_json`；缺失快照时按当前内容补写（存量兼容）。
- 新增 `GET /agent/graph-defs/{id}/versions`（版本列表，不含 graph_json）与 `PUT /agent/graph-defs/{id}/settings`（图级设置）。
- 前端：图列表“更多 → 发布版本”弹窗；“执行详情/调试页”显示“快照版本：vN”。

### 2. LLM 节点两级选择 + 节点内工具循环 ✅

- `GET /agent/models/enabled` 只返回“模型启用且供应商启用”的模型；模型列表 DTO 增加 `providerEnabled`。
- 前端 LLM 面板改为“供应商 → 模型”两级选择（旧图无 providerId 时按已选模型回显归属），并可多选挂载工具。
- 解释器 LLM 节点支持 `toolNames`：按启用工具构造规格随请求下发，模型请求工具时在节点内执行并回喂结果，直到最终文本或轮次上限（默认 5）；图执行与单步调试共用同一循环。
- 执行轨迹节点新增 `tool_calls`（工具名/入参/输出），执行详情节点展开可见“工具调用”区块。
- 带入事项：模型列表对“供应商停用”的模型显示“停用（供应商停用）”，且该模型不出现在 LLM 节点可选列表。

### 3. 图级执行超时 ✅

- `sw_agent_graph_def.execution_timeout_seconds`（默认 300 秒，V0.2.3），图设置弹窗可改（1–3600）。
- 执行服务在虚拟线程中运行解释器并 `Future.get(timeout)`；超时取消工作线程后，主线程仍把执行记录从 RUNNING 收尾为 FAILED，错误分类 `GRAPH_TIMEOUT`，不留下半完成记录。

### 4. Agent 统一工作台首页 ✅

- `/agent` 由空白页改为工作台：供应商与模型、图定义、知识库、最近执行的概览卡片 + 快捷入口 + 最近执行表。
- 知识库入口指向阶段 3 占位页（明确“知识库将在阶段 3 开放”）；其余入口均打开既有页面。

## 二、本轮发现并修复的缺陷

1. **执行线程丢失认证上下文**：超时改造把解释器移入工作线程后，模型/工具运行时查询拿不到租户 → “租户上下文缺失”。修复：提交任务前捕获 `LoginUserHolder`，工作线程设置/清理；新增 `ContextCheckingChatModel` 回归用例。
2. **工具表 `enabled` 仍为 SMALLINT**：实体/查询按 Boolean 使用，PG 上工具列表/白名单查询报 `boolean = integer`。V0.2.3 将 `sw_agent_tool_internal/external.enabled` 统一为 BOOLEAN（PG/H2 双迁移），移除 `BooleanSmallintTypeHandler` 绑定。
3. **雪花 id 前端精度丢失**：详情/设计器路由把 19 位执行/会话/图 id 转 `Number` 导致 404。新增 `parseRouteId`（安全整数转 number，雪花 id 保留字符串），API 入参类型兼容 `number | string`。

## 三、门禁结果

| 项 | 结果 | 原始输出 |
|---|---|---|
| sw-basic-agent 全量测试 | **335/335 通过**，BUILD SUCCESS | `assets/f1-stage2-1-agent-full.log` |
| sw-bootstrap 迁移/升级演练（7 类） | **47 run / 0 fail / 0 error / 1 skipped**（缺 pg_dump/pg_restore），BUILD SUCCESS | `assets/f1-stage2-1-migration-tests.log` |
| Web typecheck | 0 错误 | — |
| Web lint | 0 错误（仅既有 prettier 警告） | — |
| Web vitest | **2003 passed + 3 skipped**（230 文件通过/1 跳过） | `assets/f1-stage2-1-web-vitest.log` |
| Web build | ✓ built in 4.59s | — |

迁移计数随 V0.2.3 更新：全链 22 条（V0.2.0 + V0.2.2 + V0.2.3 + 19 R__）；I6G7 升级演练新增“已发布旧图回填快照”断言。

## 四、阶段 2 完成断言逐条结果

### 1. 同一 graph 发布两次生成两个快照，第一版执行记录仍显示第一版 ✅

- 图 `verify-tool-graph`（id `2117845851056472066`）：v2 发布后执行 → 记录 `graphDefVersion=2`；修改图内容再发布 v3 后：
  - 版本列表 = **v3、v2**（截图 `assets/f1-stage2-1-versions.png`）；
  - 第一次执行详情仍显示 **快照版本：v2**（截图 `assets/f1-stage2-1-tool-trace.png`），输出 `TOOL-DONE`；
  - v3 执行（输出 `SNAP-OK`）的版本为 v3。
- 数据库回读见 `assets/f1-stage2-1-db-evidence.txt`。

### 2. 挂了工具的 LLM 节点在真实模型下完成工具调用，轨迹可见输入输出 ✅

- 真实供应商：`verify-real-cc`，`OPENAI_CHAT`，`https://api.commandcode.ai/provider/v1`；模型 `deepseek/deepseek-v4.1-flash`。
- 图 `verify-real-tool-graph`（id `2117852939107299330`），LLM 节点挂载 `echo_tool`（本地回显 HTTP 工具）。
- 真实执行（id `2117852944224350209`）：`success=true`，耗时 8.84s，输入 Token 728 / 输出 Token 104；
  - 模型真实发起了工具调用，工具入参 `{"input":"hello"}`，工具输出 `TOOL-ECHO:{"input":"hello"}`；
  - 模型最终回答引用了工具输出（“我调用了 echo_tool…工具输出为 TOOL-ECHO…”）。
- 截图：`assets/f1-stage2-1-real-tool-trace.png`（真实执行详情，工具调用入参与输出可见）。
- 本轮同时用本地桩复验了工具循环与轨迹落库（`assets/f1-stage2-1-tool-trace.png`）。

### 3. 超时场景返回超时错误，不留半完成记录 ✅

- 图 `verify-timeout-graph`（id `2117845854609047554`），超时 1 秒，模型端阻塞 5 秒。
- 执行（id `2117845854994923522`）：`success=false`，错误 `图执行超时（超过 1 秒）`；数据库记录 `status=FAILED`、`error_category=GRAPH_TIMEOUT`，耗时 1.00s（不存在 RUNNING 残留）。
- 截图：`assets/f1-stage2-1-timeout.png`。

### 4. 首页各入口都能打开对应页面 ✅

- `/agent` 工作台可见概览卡片与快捷入口（`assets/f1-stage2-1-home.png`）：大模型管理、图定义管理、工具管理、执行历史、会话历史、知识库。
- 已实际打开：模型页、图定义页、执行详情页、设计器、知识库占位页；最近执行行可跳转详情。

## 五、带入事项处理

1. **供应商停用的模型**：模型列表显示“停用（供应商停用）”（截图 `assets/f1-stage2-1-model-provider-disabled.png`）；`/models/enabled` 已排除该类模型，LLM 节点无法选到。
2. **连通性标题与消息格式**：本轮未改连通性消息格式；标题仍取消息冒号前类别，无回归。

## 六、证据与清理

- 截图（本地）：`f1-stage2-1-home.png`、`f1-stage2-1-model-provider-disabled.png`、`f1-stage2-1-versions.png`、`f1-stage2-1-tool-trace.png`、`f1-stage2-1-timeout.png`、`f1-stage2-1-llm-panel.png`、`f1-stage2-1-real-tool-trace.png`。
- 数据库证据：`assets/f1-stage2-1-db-evidence.txt`（快照、执行、工具轨迹、可选模型过滤回读）。
- 本地验证库 `smart_workflow_f1v4b` **保留**（含 `verify-real-cc` 供应商密文与模型，按 Owner 指示不删除）；停止 server/vite 进程，删除临时 RSA/摘要/JWT/桩脚本等本地文件（Key 不在其中）。
- 真实 Key 只以 AES-GCM 密文存在于本地库；仓库密钥扫描 0 命中。

## 七、限制与偏差

- 本地自动化登录使用 local profile 的 `ch.dev.test-mock` 固定验证码（仅本地验收便利，未改产品代码/生产配置）。
- 真实工具调用中的工具为本地回环 HTTP 回显工具（模型为真实 Command Code 模型）；工具调用链路、参数与结果均为真实模型决策产生。
- 执行详情节点“时间信息”仍显示 Invalid Date（后端节点 DTO 无开始/结束时间，属既有展示问题，不影响本阶段断言）。
- 工作台“最近执行”图名称取图当前名称，快照版本列取执行绑定版本；历史快照名称未单独落执行记录。
