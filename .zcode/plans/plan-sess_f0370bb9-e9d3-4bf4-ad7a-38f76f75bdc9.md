# Context

0.2.3 已由 Planner 定为 XL、`READY`，唯一执行入口是 `product/0.2.3/ready/direction-023-agent-execution-lifecycle.md`。当前 graph 正式执行仍是同步 HTTP 长事务：服务端直到模型/工具结束才返回，Web 只有 loading 和最终结果；没有持久异步受理、真实模型增量、事件续传、运行中取消和重启收敛。目标是在保留发布快照、同步调用、多 Key、RAG、工具和调试兼容性的前提下，建立可回查、可重连、可取消且不会重复外部副作用的执行生命周期。

清单同步数值已经锁定，前一批提交也已推送，但最新主方向把“当前描述残留与三仓 Git 事实回读”纳入实施前置动作。它只作为阶段②实施的前置，不单独计为整版阶段完成。整版七阶段始终按：①评估、②实施、③验收同步、④feature→develop→main、⑤发布0.2.3、⑥发布后同步、⑦结束汇报；当前为 **1/1/5**。

# 实施方案

## 0. 接手、前置收口与方案回执

1. 在 `product/0.2.3/receipts/` 新增首份实施方案回执，记录：A01—A08 映射、内部 Step、关键决策、兼容窗口、回滚点、首轮证据清单、实际三仓状态和七阶段 **1/1/5**；不把方案或清单收尾写成 0.2.3 完成。
2. 分别核实 Workspace、Server、Web 的分支、HEAD、跟踪分支、ahead/behind、工作树、未跟踪项及远端 SHA。复核已推送的清单批次：Workspace `b4ffbffd…`、Server `2d81f3fe…` 是否仍被远端包含，并有限回读 knowledge、功能清单、P29/P65/issue 映射和当前入口的语义残留。
3. 仅修正确属已授权清单同步的当前描述；保护 `.tmp-a03-schema.json`、无关 search 文件、Web `vite.config.ts` 及其他用户成果。knowledge 优先；不改历史回执，不重新裁决计数。
4. 从核实后的两仓 `develop` 创建同名需求分支（建议 `feature/023-agent-execution-lifecycle`）。Web 的既有 `vite.config.ts` 改动原样保留且不纳入任务提交；若分支动作与在途修改发生真实冲突，保存事实并继续可独立的 Server/方案工作。
5. 每个内聚批次通过适用门禁后立即分别提交并推送任务分支；Workspace 规划/回执沿 `develop-sw` 提交。每次回读远端 SHA，不等整个迭代再堆成单一提交。

## 1. ADR 与契约先行

在 `product/0.2.3/receipts/` 记录本轮关键决策（可拆成 ADR/决策记录）：

- **数据库状态和事件日志为权威**，进程内 Future/订阅表只作快速中断和实时投影；断线不影响执行。
- **状态机**采用有限合法转换：`QUEUED → RUNNING → SUCCESS|FAILED`，取消经 `CANCEL_REQUESTED → CANCELLED`；排队取消直接收敛，终态不可改写。超时、重启和未知外部效果使用明确失败/中断分类，不永久停在 RUNNING。
- **事件表先持久化、再推送**，每个 execution 使用单调 `eventSeq`；GET 快照是最终一致性真源，鉴权流支持 cursor/`Last-Event-ID` 补发，避免漏片和重复拼接。
- **有界调度**使用 Spring 管理的有界执行器与明确容量拒绝；不沿用 Service 自建、无生命周期管理的 executor。
- **协作式取消**：持久取消令牌 + 节点/候选切换/工具调用边界检查 + 可中断请求尽力 abort；已发生的工具副作用只记录，不伪装回滚，不自动重放未知副作用。
- **恢复边界**：服务重启后可安全恢复尚未开始的排队意图；已经开始且外部效果不确定的执行不盲重放，收敛为可解释的中断/失败。现有 graph 快照冻结范围保持，不扩成完整模型/工具/知识内容冻结。
- **兼容窗口**：保留现有同步执行端点及响应契约，内部复用新执行核心并有界等待；新 Web 入口只用异步 API。
- **真实流式**：为 `OPENAI_CHAT`、`OPENAI_RESPONSES`、`ANTHROPIC` 各建立供应商原生增量解析/聚合路径，禁止把完整文本拆字。已输出增量后，429 不静默换 Key 重放；只能在尚未产生用户可见输出和外部副作用前安全轮换，否则明确失败。

## 2. Server：生命周期核心（第一业务验收段，A01/A02/A04/A05/A06）

1. **前向迁移与模型**
   - 为 PostgreSQL/H2 同步新增下一版本 Flyway 迁移，不修改既有迁移。
   - 扩展 `sw_agent_graph_execution`：幂等身份/输入指纹、状态、开始/结束/心跳、取消请求/取消人、当前节点、恢复/中断原因等；新增 `sw_agent_graph_execution_event`，使用 `(tenant_id, execution_id, event_seq)` 唯一约束。
   - 扩展 `AgentGraphExecution`、节点实体/DTO/Mapper，并增加事件实体、DTO、Mapper和状态枚举/转换服务。
2. **受理与幂等**
   - 在 `AgentGraphExecutionService`/实现中拆成“受理事务、调度执行、增量落库、终态条件更新”四类边界，移除覆盖模型/工具调用的长事务。
   - 新增异步启动 API：执行意图先提交，再返回稳定 executionId；同租户+操作者+幂等键+同输入回同一执行，键冲突明确拒绝，队列满明确拒绝。
   - 保留 `AgentGraphDefController` 现有同步契约，内部通过同一核心有界等待并返回旧响应形状。
3. **状态机、权限和数据范围**
   - 在 Mapper/Service 层使用条件更新/乐观锁保证取消、完成、失败竞争只有一个终态。
   - 统一列表、详情、节点、事件订阅和取消的对象级授权：普通用户仅本人；具管理权限者可管理本租户；跨租户继续用 404 隐藏对象存在性。后台 worker 从持久化受理身份重建可信租户/操作者上下文，不依赖原请求 ThreadLocal 长存。
4. **执行器、取消和恢复**
   - 增加 Spring 管理的有界 worker、运行句柄注册表、取消探针和恢复服务；运行句柄只辅助 interrupt/abort，数据库仍是权威。
   - `AgentGraphInterpreter` 增加节点生命周期 listener 和 cancellation probe；在节点调度、LLM、工具、RAG、循环、分支和 Key 候选切换边界检查取消。节点开始即落库，完成/失败后条件更新并写事件。
   - 排队取消不启动；运行取消不再调度新节点/工具；重复取消幂等；完成后取消不改终态。启动恢复扫描只恢复可证明安全的排队任务，遗留 RUNNING 依据心跳和恢复边界收敛，不重放未知工具副作用。
5. **第一段测试与证据**
   - 扩展现有 `AgentGraphExecutionServiceImplTest`、`AgentGraphInterpreterTest`、安全集成测试和 Flyway 全链测试。
   - 使用真实服务请求与持久状态覆盖：立即返回、幂等/冲突、容量拒绝、合法/非法转换、刷新回查、排队/运行取消、重复取消、完成竞争、超时、重启收敛、资源释放、本人/管理员/无权限/无 token/跨租户。
   - 用有界可控工具对端记录调用次数，证明取消/恢复不重复外部副作用。完成第一业务段回执后交 Planner 独立验收；等待验收期间继续不依赖其结论的第二段工程工作，已通过项后续锁定。

## 3. Server：真实增量、事件续传与兼容（A03/A07）

1. 在模型运行时按三种现有格式增加原生 streaming client/adapter：
   - `OPENAI_CHAT`：解析 chat completion delta；
   - `OPENAI_RESPONSES`：解析 response output text delta 与终止/错误事件；
   - `ANTHROPIC`：解析 content block delta 与终止/错误事件。
   每条增量写入有序事件并聚合为最终 `resultText`，协议错误、断线、超时均有可判定终态。
2. 调整 `AgentModelRuntimeService` 返回实际候选元数据并遵守流式 Key 轮换安全边界；不在事件、日志或错误中暴露 API Key/密文/Authorization。保持既有 429 冷却、RAG 和工具调用行为。
3. 在 `AgentGraphExecutionController` 提供：详情快照、增量事件查询、鉴权 SSE/流式订阅、取消。订阅先补发 cursor 后的持久事件，再进入实时投影；慢消费者/断开只清理订阅，不阻塞或取消执行。
4. 将共享解释器的取消探针接入 `AgentGraphDebugEngine`/调试 Service：调试 stop 后不产生新动作，step/continue 并发仍保持 version/409 和无重复副作用。
5. 测试三格式真实增量（可控协议对端）、最终聚合、顺序、断线、错误、cursor 重连、多订阅者、慢消费者、服务重启后补发、敏感信息负向；至少取得一条已授权真实供应商的实际增量证据。若真实凭据不可用，只将该项如实留作外部证据缺口，继续完成其他独立项，不读取秘密。

## 4. Web：异步入口、执行观察、取消与刷新恢复（A08）

1. 扩展 `src/contracts/agent.ts` 与 `src/modules/agent/api/index.ts`：异步启动、生命周期状态、事件、cursor、取消、恢复错误等契约。
2. 在 `src/foundation/request/` 增加唯一鉴权流入口，使用受控 fetch stream 注入 Bearer token、语言和 request id，支持 AbortSignal、SSE frame 解析、cursor 和错误归一；禁止页面裸用 `fetch`/Axios，禁止 token 放 URL。
3. 新增 `useExecutionStream`（或同职责 composable）和可测试的生命周期 reducer：GET 快照为真源，流只应用有序增量；断流先回查快照再续传；组件卸载只断开观察，不取消后台执行，不写 local/session storage。
4. 改造 `GraphDesigner.vue`：新 Web 入口异步启动，拿到 executionId 后立即进入稳定详情 URL，防重复提交。
5. 改造 `ExecutionDetail.vue`：展示排队/运行/取消处理中/终态、当前节点、增量文本、恢复提示；复用 `NodeTrajectory`、`SafeHtml` 和调试页的 action loading、409 后回查、操作后刷新、终态 gating。取消必须调用服务端命令并风险确认，不能以断流替代取消。
6. 更新 `ExecutionList.vue`、路由权限、i18n、mock/handlers 和状态标签；保持现有 UI token、桌面亮色规范，不顺手重构无关双域分页。
7. 补强组件、请求层、路由刷新、mock 与生命周期单测；Web 每个内聚批次运行 `NODE_OPTIONS="--max-old-space-size=2048"` 的 typecheck、lint、test、build 四连。

## 5. 集成验证、正式回执与阶段③路由

1. Server 按工程宪法先做受影响模块聚焦测试，再运行带 `MAVEN_OPTS="-Xmx2g"` 的全工程 compile/test；前后端编译互斥。Flyway 覆盖 H2/PG 新库与 0.2.2 升级链、旧记录兼容和事件唯一约束。
2. 用真实服务与可控对端逐项映射 A01—A08；保存完整原始输出到本机证据目录，回执只记摘要与可读位置，不提交日志/截图采样，不做无必要整包哈希。
3. 使用可见、可交互、`headless=false` 的浏览器完成正式链：设计器提交 → 立即取得 executionId → 节点/模型增量 → 流断开恢复 → 刷新/重进回查 → 取消及完成竞争 → 历史详情；权限负向覆盖无权限与跨租户。主视口为 1280×800、1440×1024、1920×1080，保存 URL、身份、对象、网络索引和视觉制品。
4. 在 `product/0.2.3/receipts/` 提交第二业务段及整体 completion 回执：文件和变更摘要、测试/GUI结果、A01—A08矩阵、偏差/限制、Git SHA/远端回读、实际剩余动作、正式浏览器证据和七阶段进度。自验完成只写“待 Planner 验收”，不得自行写 PASSED/COMPLETED、增加功能数或核销 P20。
5. Planner 独立验收并下发唯一终态值后，才进入阶段③的信息同步。阶段③完成也不代表整版结束；继续保留阶段④合并、⑤0.2.3发布、⑥发布后同步、⑦结束工作项。

## 6. 整版后续七阶段（不在局部回执中提前关闭）

- **阶段④**：Planner 验收与终态同步完成后，将两仓 feature 依次合入 `develop`、再合入 `main`；核实模块路径、依赖边界、CI/CD、版本默认值/回退值和实际版本选择，推送后回读。
- **阶段⑤**：使用 Owner 已指定的 **0.2.3**，沿既有 CI/Release/部署通道发布；分别核实 tag、Release、CI、制品版本和部署结果，不互相推断。
- **阶段⑥**：以发布后事实 knowledge 优先同步版本、分支/提交、制品、部署、功能摘要和下一动作，追加独立发布后同步回执。
- **阶段⑦**：仅在发布及再次同步完成、且本次授权内无剩余动作时结束整版。任何前置收口、内部 Step、第一验收段、业务自验或功能终态同步都不得单独冒充整版完成。

# 关键修改路径

- Server：`sw-basic/sw-basic-agent/.../AgentGraphExecutionServiceImpl.java`、`AgentGraphInterpreter.java`、`AgentGraphDebugEngine.java`、`AgentModelRuntimeService.java`、相关 Controller/Entity/Mapper/DTO，以及 `sw-bootstrap/src/main/resources/db/migration/{postgresql,h2}/`。
- Web：`src/contracts/agent.ts`、`src/foundation/request/`、`src/modules/agent/api/index.ts`、`GraphDesigner.vue`、`ExecutionDetail.vue`、`ExecutionList.vue`、新增执行流 composable、i18n/mock/测试。
- Workspace：`product/0.2.3/receipts/` 的实施方案、分段与整体回执；仅在授权范围内修正 knowledge/memory/todo/清单当前入口。

# 回滚与安全边界

- 数据库只加前向兼容字段/事件表，旧同步 API 和历史记录保持可读；业务切换异常时可回退 Web 到同步入口、停用异步入口，但不删除已持久执行/事件。
- 数据库是执行和事件权威；进程内对象不可成为唯一真源。
- 取消不承诺回滚已发生外部副作用；恢复不盲重放未知副作用。
- 不停止用户既有服务，不读取秘密，不覆盖 `vite.config.ts`，不将日志/凭据提交 Git。
- 工程失败、测试失败或普通 Git 限制默认继续定位、修复或推进独立项；只有真实外部秘密/MFA/人机验证、外部系统不可用、方向冲突或无法补齐的必要行为证据才进入合法阻塞。