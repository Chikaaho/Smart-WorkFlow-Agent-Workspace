# 0.2.3 Agent 执行生命周期现状（执行回执）

2026-11-05｜执行｜只读；基线 Server `3c4942f0`／Web `9dd7e7b`；证据见同名 `-evidence/` 目录。未运行工程动作；层级=静态+既有回执。

## 结论

三项均无实现：graph、调试、会话全同步请求-响应；主代码无 SSE/WS/Flux/StreamingChatModel；前端 10s 超时。可作单主功能；取消粒度、持久化、流式协议待规划裁决。

## 1 起点

knowledge `current-status.md:3-5`、`memory/state.md`、`planning-final-review-022-completed.md` 一致：0.2.2 COMPLETED、7/0/0、功能50、46/22/22、ADV64/57。Git 15:34：Server develop=main=origin=`3c4942f0` 干净；Web=`9dd7e7b`，仅 `vite.config.ts` +1 行 `allowedHosts`；tag `0.2.2`→`0bf4c938`/`3bcd7c2`。从两仓 develop 起。

## 2 三入口

- 执行：`POST /agent/graph-defs/{id}/execute`（`AgentGraphDefController:112`）同步；`execute` 全程 `@Transactional`（`AgentGraphExecutionServiceImpl:143`）。id `:169-171` 生成、`:247` 返回；状态 RUNNING/SUCCESS/FAILED（`:86-92`）；轨迹完成时批量落库（`:258`）。超时默认300s/上限3600，虚拟线程 `future.get`（`:217`），超时 `cancel(true)`+`GRAPH_TIMEOUT`；失败为校验抛错或 `success=false`。
- 调试：`AgentGraphDebugController:41/70/78/85` 创建/单步/继续/停止全同步；sessionId 即时返回；PAUSED/COMPLETED/FAILED/STOPPED/EXPIRED，30min 过期（`AgentGraphDebugServiceImpl:54-60,500`）；stateJson 每步落库可续跑。
- 会话：`POST /agent/orchestration/run`（`AgentOrchestrationController:32`）同步；成功才写消息/工具日志（`AgentOrchestrationServiceImpl:154-157`），会话行先建；无页面。
- 流式：均无。

## 3 格式与依赖

LC4j 1.23.0（`sw-dependencies/pom.xml:112`）；装配器只建同步 ChatModel：OPENAI_CHAT/OPENAI_RESPONSES/ANTHROPIC（`AgentChatModelAssembler:44-113`）；Chat/Anthropic 有 timeout/retries，Responses 无（`:80-95`）。依赖层有流式类/取消接口，项目未接入。多 Key：`chatWithRotation`（`AgentModelRuntimeService:294-321`）覆盖图/调试，编排自有轮换；429 锁定+冷却惰性过期。快照只冻结 graph_json，模型/工具/知识库为实时引用，历史不可完全回放。RAG 阻塞/租户显式/全表扫描；工具循环默认 5 轮（`AgentGraphInterpreter:593`），外部工具超时、内部 bean 无超时，失败回喂、副作用不回滚。

## 4 调度/恢复

Quartz 单节点 cron；BPM 持久队列有租约/重试/stale 回收/对账（`.../BpmCommandQueue.java:15-30`），但在 sw-biz，sw-basic-agent 不可反依赖；通知有投递恢复；事件仅进程内。断线时请求继续、结果丢失；RUNNING 提交前不可见（静态推断）。重复提交无幂等；重启回滚无记录、无对账。

## 5 取消/竞争

graph 无取消端点；debug stop 仅 PAUSED（manage），无 CANCELED。无法区分未开始/节点间/模型/工具/完成：graph 仅三态且轨迹末尾落库；debug PAUSED 兼覆盖节点间与调用中。不可回滚/中断：LLM、外部 GET/POST/PUT、内部 bean、Embedding/上传。`cancel(true)` 只置中断位，解释器无中断检查（`AgentGraphInterpreter:316-395`），SDK/HTTP 响应未验证。竞争（静态推断）：debug 执行中 stop 可成功，step/continue 随后乐观锁失败回滚轨迹但副作用已发生；并发 step 可重复；超时 worker 可能继续、轨迹不落库；长事务占连接并隐藏 RUNNING。租户拦截器+向量显式 tenant，跨租户404；同租户详情/调试无 data scope/归属。

## 6 对账/兼容

P9 能力已由 D022-05 交付（`f1-stage1-3` G5），P 未核销。P18 无实现，缺口。P19 已由 0.2.2 F1 阶段3 交付（`planning-review-f1-stage3-02`），索引仍 ⬜、P 未核销。P20 会话列表/详情已有，聊天窗口与 SSE 未交付。D022-06 已交付（快照/绑定）；D022-08 排除项，三者均无。兼容：同步调用方为 Web 五个页面；execute 响应已追加 executionId。硬约束：前端 10s 超时（`foundation/request/index.ts:27`）远小于后端 300s。受影响：agent/knowledge、双方言迁移、Web agent/request、菜单 seed、nginx。

## 7 F2 v-perm

未证实服务端越权：无权限用户页面/导出/预检均 403（`f2-01.md:98`）；v-perm 在 EP teleport 下拉项仅前端可见，已改 v-if（`:54,108`）；规划不扩大排查（`planning-review-f2-01.md:71`），不支持改排。

## 矩阵

| 能力 | 现状/依赖 | 兼容影响 | 待裁决 |
|---|---|---|---|
| 异步 | 无；同步长事务；BPM 队列跨层不可用 | execute 契约、10s 超时、迁移 | 受理/持久化/恢复/幂等 |
| 流式 | 无；依赖有流式类 | SSE/WS、nginx、请求层 | 协议/重连/部分失败 |
| 取消 | 仅 debug stop/超时 | 新权限、状态机、竞态 | 粒度/权限/副作用 |

## 未确认/继续

未验证：SDK 中断响应、客户端断开后容器行为、UAT nginx buffering、本机类路径。探索充分；实施前先验证依赖与中断行为。
