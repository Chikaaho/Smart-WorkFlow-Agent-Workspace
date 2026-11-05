# 0.2.3 Agent 执行生命周期继续执行回执 06

2026-11-05｜Executor｜承接 `planning-review-lifecycle-023-02.md` 与 `planning-execution-prompt-lifecycle-023-02.md`（替代提示01，作为唯一剩余动作入口）。本文只报告本轮结果，不表示 Planner 验收通过，不声明 `PASSED/COMPLETED`，不核销 P20。未修改 receipt 05 既有原文，本轮也没有需要追加的勘误行。

## 本轮归属与保护

- 唯一主方向：`product/0.2.3/ready/direction-023-agent-execution-lifecycle.md`。
- Server 候选：`feature/023-agent-execution-lifecycle`，本地与远端一致于 `30370877af8bd07d5f4309246c39f0539e069323`（含 `280e5fcb` 两Key流式429轮换、`9e7d5134` 权限与容量边界、`30370877` 传输线程增量事件持久化修复）。本轮未新增 Server 提交。
- Web 候选：`feature/023-agent-execution-lifecycle`，本地与远端一致于 `2e630c0bd75de59033e67edc8ef3a238f8c3ad10`。本轮未新增 Web 提交。
- 提示要求不重启的 18080 Server（21:42 包，PID 26788）与 15173 Vite（PID 12316）全程未停止、未替换。用户 8080（PID 10620，`smart_workflow_f1v4b`）、5173 既有服务、Web `vite.config.ts` 在途改动、Planner 未提交的 `memory/state.md`、`memory/handoff.md` 均未触碰。
- 本轮未读取、未复制任何用户密钥或用户库供应商配置；隔离库 `smart_workflow_lc023_01` 全程使用本地受控对端与非真实密钥。

## 候选实例说明（与提示的差异点）

提示告知候选包为 21:42 构建含 `9e7d5134`。经核对，该包不含其后推送的修复 `30370877`（MODEL_DELTA 事件在传输线程被线程本地查找静默丢弃，直接影响"页面观察真实增量"与"断流回查续传"）。前一执行者已按同一约束建好替代链：`.lc023-mock/lc023-server-wt` 工作树（HEAD `30370877`）22:59 构建、18081 端口、`/api` 上下文，15174 Vite 代理指向 18081，并已通过 API 自检。本轮仅恢复该任务自有链：重启已停止的 18080/18090 mock 与 18081 Server（未触碰 18080/15173 候选），15174 Vite（PID 17492）保持运行。23:11 该实例启动时执行了生命周期恢复扫描，隔离库 12 条执行记录全部为终态、无 `RUNNING/CANCEL_REQUESTED` 不确定行，因此本轮没有产生新的真实实例重启标记；重启恢复语义仍以既有受控夹具为证据层（按提示锁定清单未重跑）。

## LC023-01：权限、容量、重启、不可立即中断

已锁定（receipt 05）：基础受理/幂等/冲突400/终态后取消、受控取消恢复夹具、事件补取。

本轮结果——`9e7d5134` 五断言逐条映射到 LC023-01 原断言（测试类 `AgentGraphExecutionLifecycleControlledTaskTest`，5/5 通过，原始输出 `E:\code\Smart-WorkFlow-Agent-Workspace\.runtime-lc023\lifecycle-permission-capacity-test.log`，2026-11-05 21:38）：

| 测试断言 | 映射的原断言 | 实际结果 |
|---|---|---|
| 排队取消（QUEUED→CANCELLED，外部调用 0 次，终态事件 1 次） | 受控取消夹具（已锁定部分） | 保持通过 |
| 运行取消竞争（外部副作用精确 1 次、`finish(CANCELLED)` 1 次、5 秒界内退出） | A04/A05 无法立即中断的调用在结束前不谎报取消/超时完成 | 保持通过 |
| `capacityRejectsBeforePersistingAnotherRequest`（第三次 submit 抛"执行容量已满"且仅 insert 2 条） | A01 容量拒绝 | `9e7d5134` 新增，通过 |
| `ownershipProtectsStateEventsAndCancellation`（create_by=2 的记录对 get/`listEvents`/cancel 一律"执行记录不存在"；`eventMapper` 未查询、未触发取消调度） | A06 事件订阅权限：events/cancel 的对象级授权 | `9e7d5134` 新增，通过 |
| `restartMarksUncertainRunningAndReplaysQueuedExactlyOnce`（不确定运行批量标 `INTERRUPTED/SERVICE_RESTART`，QUEUED 恰好一次重派） | A05 重启恢复、未知副作用不重放 | 保持通过 |

结论：事件订阅权限（events/cancel 对象级授权）已被第 4 行断言覆盖，无需补测，本轮无新增测试提交。用户维度负向由该断言直接证明；租户维度依托 create_by 全局唯一 + 平台租户拦截层（`AgentDataScopeTest` 等既有覆盖）与超管旁路设计，未构造破坏性跨租户数据，与 receipt 05 第 59 行口径一致。

## LC023-02：运行时轮换与真实供应商

已锁定：三格式协议流式与损坏事件单请求失败（`a4e73177`）；两Key可控对端 429 轮换/冷却与已输出不重放（`280e5fcb`，`AgentModelRuntimeStreamingRotationTest` 2/2，原始输出 `E:\code\Smart-WorkFlow-Agent-Workspace\.runtime-lc023\lifecycle-remaining-focused-test.log`，2026-11-05 21:34）。

本轮未重跑。真实供应商单项保持外部依赖声明：等待 Owner 在隔离实例页面录入凭据（`REQUIRES_SECRET`）；不在聊天或文件收集凭据，不读取/复制任何密钥。该项不阻塞其他验证。

## LC023-03：持续增量 graph 的 headed 展示、断线接续、运行中取消、持久回查

环境：本地受控对端 `E:\code\Smart-WorkFlow-Agent-Workspace\.lc023-mock\mock-sse-server.mjs`（OPENAI_CHAT，固定 16 条增量、400ms/条后正常结束，`/_mode` 可注入第 N 条后销毁连接；脚本置于 `.runtime-lc023` 之外的自有目录）；供应商 `lc023-mock-provider` 指向 `http://127.0.0.1:18090/v1`；模型 `lc023-chat-model`；图 `lc023-llm-stream`（2118354027912654850，START→LLM→END，v2 发布）。隔离库凭据为正式种子迁移 dev 固定契约（登录本轮一次成功，无需再修复散列）。

官方 `browser-use:control-browser`，IAB 可见模式（`headless=false`），视口 1440×900，入口 `http://127.0.0.1:15174`（15174 Vite 代理 → 18081 候选）：

1. 登录：`默认租户` / `admin` / 固定 dev 口令 / 验证码 `1234`，页面进入"系统管理员"，直达图设计器（截图 01）。
2. 真实增量逐条显示：执行 `2118362057161105409`（输入 `headed-lc023-increment-06`），运行中连续读页面输出区：15:17:27.589 显示 `增量-01` → 15:17:28.219 `增量-01..03` → 15:17:29.458 `..05` → 15:17:30.091 `..08`，终态 SUCCESS 全量 `增量-01..16`、耗时 6999ms（截图 02；读数原文 `headed-lc023-delta-observations.log`）。另一执行 `2118361855079538690` 同样 SUCCESS（6969ms）。
3. 中途断流与回查/续传：mock 注入 `abortAfter=5` 后执行 `2118362310924886018`（`headed-lc023-break-06`）：页面先显示部分输出 `增量-01..05`，随后 FAILED 标签与失败提示（截图 03）；点击"查看详情"进入 `/agent/executions/detail/2118362310924886018`，显示失败、耗时 2.16s、失败分类 `GRAPH_EXECUTION_FAILED`、模型服务不可用文案（截图 04）。API 侧 `afterSequence=5` 仅返回 sequence 6（`增量-05`）与 7（STATE FAILED），无重复、无重放（`lc023-break-resume-afterSeq5.json`）；页面轮询循环在断流后继续从已见 sequence 续取直至终态。
4. 运行中取消：执行 `2118362815424159746`（`headed-lc023-cancel-06`），运行 1.5s 时点击页面"取消执行"，状态标签显示 `CANCELLED`，输出保留 `增量-01..06`、耗时 1691ms（截图 05）。
5. 刷新/重进回查：详情 URL `/agent/executions/detail/2118362815424159746` 显示同 executionId、快照 v2、CANCELLED、"执行已取消"；刷新同一 URL 后（页面重新水合后）同 executionId、状态、输入、错误信息完整回显（截图 06）。

可回读视觉与请求制品（相对 `product/0.2.3/receipts/assets/`）：`lc023-03-headed/01-designer-before-run.png`、`02-designer-stream-success.png`、`03-designer-stream-break-failed.png`、`04-detail-break-failed.png`、`05-designer-cancelled.png`、`06-detail-cancelled-after-reload.png`、`headed-lc023-delta-observations.log`、`lc023-break-resume-afterSeq5.json`。运行日志：`E:\code\Smart-WorkFlow-Agent-Workspace\.runtime-lc023\headed-lc023-delta-observations.log`、`headed-lc023-mock.log`、`headed-lc023-server18081-resume.log`。未新增像素标准，未做快图重跑。

## LC023-04：剩余兼容与实际路径

### a) 异步 RAG 实际链

- 首跑暴露前会话遗留夹具缺陷：图 `lc023-rag-chain`（2118354095126376449）v2 的 START 节点出边不唯一，执行 `2118363379675488257` 26ms 失败（"非条件节点的出边不唯一: start"）。本轮将拓扑修正为 START→KNOWLEDGE→LLM→END 并发布 v3（隔离库内自有测试数据修正）。
- 受控配置 `sw.knowledge.vector-store: memory` 的向量在 JVM 重启后不保留，重新摄取知识文档（`kb-doc-lc023.txt`，2 分片 READY）后，检索端点对"图执行生命周期支持哪些状态？"返回 2 个命中分片（相似度 0.423 / 0.231）。
- 异步执行 `2118364266020003842`（幂等键 `lc023-06-rag-4`）：QUEUED→RUNNING→SUCCESS，6997ms；事件序列 1:STATE(RUNNING)、2-17:MODEL_DELTA×16、18:STATE(SUCCESS)（`lc023-rag-exec-events.json`）。
- 检索副作用：mock 侧在检索时刻收到 `EMBEDDINGS model=text-embedding-mock inputs=1`，随后 LLM 请求的用户消息包含检索结果 `"[1] 文档：kb-doc-lc023.txt（相似度 0.423）…" 与 "[2] …（相似度 0.231）…"`（`lc023-mock-requests.log`，15:26:13-15:26:19）。
- 持久节点轨迹：底层同步执行 `2118364266082918402` 节点记录 START/KNOWLEDGE/LLM/END 全 SUCCESS，`kb1` 节点输出为文档名+相似度+分片正文，`llm1` 输出为 16 条增量拼接（`E:\code\Smart-WorkFlow-Agent-Workspace\Smart-WorkFlow-aPaaS-server\sw-basic\sw-basic-agent` 的 `/agent/graph-executions/{id}/nodes` 实际响应，存档 `lc023-rag-node-records.json`）。
- 层级说明：这是隔离候选实例上的真实异步链（HTTP API + PG 持久 + 本地受控对端），聚焦单测层（`AgentGraphInterpreterTest` 39/39 等）保持为既有补充证据，本轮未重跑。

### b) 实际代理流式路径

经 15174 Vite `/api` 代理（目标 18081）完成提交与事件拉取：POST + `Idempotency-Key` 提交执行 `2118364671063941121` 成功；随后 10 次经代理的增量拉取每次返回新事件（2/2/3/2/2/2/2/2/…/1 条，状态 RUNNING→SUCCESS，无缓存旧值）；终态后同 URL 代理响应与 18081 直连响应逐字节一致（各 2110 bytes）。原始记录：`E:\code\Smart-WorkFlow-Agent-Workspace\.runtime-lc023\lc023-04b-proxy-passthrough.json`（存档 `lc023-04-rag-proxy/lc023-04b-proxy-passthrough.json`）。已提交的 `vite.config.ts` 代理配置为 `/api` 转发 + `changeOrigin`，无 SSE 专用缓冲配置；用户在途 `allowedHosts` 修改未读改、未暂存。说明：候选生命周期事件接口为 JSON 分页轮询（无 SSE 端点），本项验证的层级是代理对事件接口的增量透传无缓冲/无改写。

### c) 同步兼容与调试 stop 工具次数（只引用，未重跑）

| 类别 | 可回读原始输出（绝对路径） | 计数 |
|---|---|---|
| 同步接口兼容 | `E:\code\Smart-WorkFlow-Agent-Workspace\Smart-WorkFlow-aPaaS-server\sw-basic\sw-basic-agent\target\surefire-reports\TEST-com.sw.ck.agent.service.impl.AgentGraphExecutionServiceImplTest.xml` | 48/48，0 失败/错误/跳过 |
| 调试 stop 行为 | `E:\code\Smart-WorkFlow-Agent-Workspace\Smart-WorkFlow-aPaaS-server\sw-basic\sw-basic-agent\target\surefire-reports\TEST-com.sw.ck.agent.AgentGraphDebugBehaviorIntegrationTest.xml` | 15/15，0 失败/错误/跳过 |
| 调试安全/服务/引擎 | 同目录 `TEST-com.sw.ck.agent.controller.AgentGraphDebugSecurityIntegrationTest.xml`、`TEST-com.sw.ck.agent.AgentGraphDebugServiceTest.xml`、`TEST-com.sw.ck.agent.AgentGraphDebugEngineTest.xml` | 28/28、15/15、13/13（receipt 05 第 32 行原始出处） |

以上均属 `Smart-WorkFlow-aPaaS-server` 仓 `sw-basic-agent` 模块 `target/surefire-reports/`（磁盘当前报告集，receipt 05 记录的 2026-11-05 18:34 批次）。本轮只读取核对计数，未重跑；Notify 全量三失败保持原义分列，不扩修。

## 精确剩余依赖

唯一外部输入：Owner 在隔离实例页面录入真实供应商凭据（真实供应商增量单项）；本轮未读取任何密钥，不在聊天或文件收集凭据。非秘密遗留仅 Server 全量门禁 `sw-basic-notify-biz` 三个既有失败（receipt 05 第 76 行原义保持）。

整体七阶段保持 1/1/5：评估完成；实施进行中；验收同步、feature→develop→main、发布 0.2.3、发布后同步、结束未开始。
