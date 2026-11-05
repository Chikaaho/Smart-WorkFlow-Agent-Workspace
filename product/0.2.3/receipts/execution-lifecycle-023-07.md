# 0.2.3 Agent 执行生命周期继续执行回执 07

2026-11-06｜Executor｜承接 `planning-execution-prompt-lifecycle-023-03.md`（替代提示02，唯一剩余动作入口）与 `planning-review-lifecycle-023-03.md`。本文只报告两项本轮结果，不表示 Planner 验收通过，不声明 `PASSED/COMPLETED`，不核销 P20。未修改 receipt 06 既有原文。

## 本轮归属与保护

- 唯一主方向：`product/0.2.3/ready/direction-023-agent-execution-lifecycle.md`。
- Server 候选：`feature/023-agent-execution-lifecycle`，HEAD `30370877af8bd07d5f4309246c39f0539e069323`（本地与远端一致于 receipt 06 第 8 行的回读时点；本轮无 Server 代码改动，未造空提交）。本轮在 `.lc023-mock/lc023-server-wt` 工作树（HEAD `30370877`）重新打包并启动隔离候选 18081（工作树打包原因：主仓 `sw-bootstrap/target/bootstrap.jar` 被用户 8080 进程持锁无法 repackage，与上一轮建工作树的约束相同）。
- Web 候选：`feature/023-agent-execution-lifecycle`，本轮新增提交 `3ae42cb4fed56a71df5839df831ccf90e74284fe`（本地与远端一致，见下文第 2 节回读）。
- 用户 8080（PID 10620，`smart_workflow_f1v4b`）全程未停止、未触碰；5173 本轮无既有进程；Web `vite.config.ts` 在途改动（`allowedHosts` 一行）未读改、未暂存、未提交；Planner 未提交的 `memory/state.md`、`memory/handoff.md` 未暂存。
- 用户库 `smart_workflow_f1v4b` 只读：本轮对其执行的全部语句为只读 SELECT/COPY OUT（见 EXT-023-01 节），无任何写入。

## 1. LC023-03：取消终态展示修复（提示03唯一剩余动作）

### 根因

`src/modules/agent/views/GraphDesigner.vue` 执行测试面板的结果 `el-alert` 标题与样式此前只由 `executeResult.success`（即 `status === 'SUCCESS'`）二元映射：非 SUCCESS 一律落入 `error` 样式 + `t('agent.executionFailed')`（"执行失败"）分支。用户主动取消后终态为 `CANCELLED`、`success=false`，因此标签为 CANCELLED 而结果区显示红色错误样式与"执行失败"文案（证据：`assets/lc023-03-headed/05-designer-cancelled.png`、`headed-lc023-delta-observations.log` 第 72 行）。

### 修改（提交 `3ae42cb`，"fix(agent): 图执行取消终态展示为中性提示，不再显示失败样式"）

| 文件 | 修改摘要 |
|---|---|
| `Smart-WorkFlow-aPaaS-Web/src/modules/agent/views/GraphDesigner.vue` | alert 标题/样式改为按终态映射的计算属性 `executeAlertTitle`/`executeAlertType`：SUCCESS→success/"执行成功"（不变）；CANCELLED→info/新增 `t('agent.executionCancelled')`（"执行已取消"，中性提示，不用失败/错误样式）；其余（含 FAILED）→error/"执行失败"（不变）。运行中展示不变。输出内容、耗时、"查看详情"分支未动 |
| `Smart-WorkFlow-aPaaS-Web/src/locales/zh-CN.ts` | agent 段新增 `executionCancelled: '执行已取消'` |
| `Smart-WorkFlow-aPaaS-Web/src/locales/en-US.ts` | agent 段新增 `executionCancelled: 'Execution cancelled'` |
| `Smart-WorkFlow-aPaaS-Web/src/modules/agent/views/GraphDesigner.spec.ts` | 新增 2 个聚焦测试（见下）；api mock 补充生命周期 4 函数 |

复用排查：全仓检索 `submitGraphExecution`/`cancelGraphExecution` 的执行入口仅 `GraphDesigner.vue` 一处（模型连通性测试 `ModelList.vue` 为同步探测无取消，详情页/列表页 CANCELLED 展示此前已验证正确且属已锁定范围，均不在本次改动内）。

### 聚焦测试与 Web 门禁（NODE_OPTIONS 2G，与 Maven 互斥）

- 新增测试 2 个：① 取消终态——经 `refreshExecution` 消费 CANCELLED 生命周期态，断言 alert 含 `info` 且不含 `error`/`success`、文案"执行已取消"、不出现"执行失败"、保留输出/耗时/查看详情；② 终态回归——FAILED 仍 error/"执行失败"、SUCCESS 仍 success/"执行成功"。
- `pnpm test src/modules/agent/views/GraphDesigner.spec.ts`：27/27 通过。
- 完整四门（原始输出本地 `.runtime-lc023/lc023-07-web-gates.log`）：`pnpm typecheck` 0 错误；`pnpm lint` 首轮 2 条 prettier 警告经 `--fix` 归零后复跑通过；`pnpm test` 231 文件通过/1 跳过，2020 通过/3 跳过（与基线一致，无新增失败）；`pnpm build` 成功（首轮 4.18s，日志存档复跑 4.24s，均为 exit 0）。

### 提交推送与回读

- Web `feature/023-agent-execution-lifecycle` 推送（含一次远端 `commit_refs_rules` 瞬时拒绝后的成功重试）：`git ls-remote` 回读远端 = `3ae42cb4fed56a71df5839df831ccf90e74284fe` = 本地 HEAD（2026-11-06 00:13）。
- 用户在途 `vite.config.ts` 改动保持未暂存（`git status` 仅该文件 modified）。

### headed（headless=false）运行中取消复验

入口 `http://127.0.0.1:15174`（15174 Vite 代理 → 18081 候选，Vite 启动目录含本次修复源码），IAB 可见模式、视口 1440×900，会话沿用上轮登录态直达图设计器 `lc023-llm-stream`（2118354027912654850，v2 发布）：

1. 输入 `headed-lc023-cancel-fixed-07` → 点击"运行"→ 运行约 1.6 秒点击"取消执行"→ 状态标签 `CANCELLED`。
2. 结果区实际读数（`.runtime-lc023/headed-lc023-cancel-fixed-observations.log`，2026-11-06 00:31）：alert class = `el-alert el-alert--info is-light execute-result`（info 中性样式，无 `error`），标题"执行已取消"，输出保留 `增量-01 增量-02 增量-03 增量-04 增量-05 增量-06`，耗时 `1750ms`，"查看详情"按钮在。
3. 截图：`product/0.2.3/receipts/assets/lc023-03-headed/07-designer-cancelled-fixed.png`（1440×900 视口整页）。
4. 同会话前序一次自然完成的执行显示"执行成功"+成功样式（SUCCESS 展示不变）；FAILED/SUCCESS 的不变性另有聚焦测试 ② 钉死。未重跑增量/断流/详情链，未新增像素阈值。

## 2. EXT-023-01：真实供应商增量实测（Owner 本轮授权使用库内既有凭据）

### 授权与凭据处理边界

Owner 明确凭据上一轮已保存在用户库、授权只读复制后直接实测。本轮未在聊天、日志、回执、截图或临时文件中出现任何明文密钥、Authorization 头或掩码以外的密钥内容；密文仅在两个数据库之间的二进制 COPY 管道中传输，不落盘、不进日志。

- 选行（只读 SELECT，掩码外不输出密钥内容）：用户库 `smart_workflow_f1v4b` 中唯一同时具备真实 CHAT 能力的供应商配置 `verify-real-cc`（id `2117852938029363202`，OPENAI_CHAT，`https://api.commandcode.ai/provider/v1`）及其模型 `verify-real-m`（id `2117852938692063234`，`deepseek/deepseek-v4.1-flash`，CHAT）。用户库另一真实供应商 `openrouter-embed-p`（920001）仅挂 EMBEDDING 能力模型（`openai/text-embedding-3-small`），不构成图 LLM 流式增量验证的可用组合，未选用。
- 复制方式：`COPY (SELECT * FROM …) TO STDOUT (FORMAT binary)` 管道直通隔离库 `COPY … FROM STDIN (FORMAT binary)`，各 1 行（provider `2117852938029363202`、model `2117852938692063234`，id 不冲突），密文逐字节不变。隔离实例沿用隔离库既有 `application-local.yml` 的 `sw.agent.cipher-key`，与用户实例同源同代码库默认配置（主仓 `sw-bootstrap/src/main/resources/application-local.yml` 同值），用户实例凭据可解密的前提由此保证——实测也证实解密成功（错误发生在 TLS 层而非解密层，见下）。
- 最小充分：单图 `lc023-real-stream`（`2118380954316759042`，START→LLM→END 单 LLM 节点，发布 v2）、固定短提示词（`用一句话说明什么是流式输出。`）、单次真实执行目标；未做压测或多次重复消耗。

### 实测结果：5 次真实提交（00:33–00:46 有界重试）均失败于本机外部 TLS 通道，未及到达供应商

| # | executionId | 提交时刻 | 终态 | 延迟 | 事件序列 | 原始错误（不含密钥） |
|---|---|---|---|---|---|---|
| 1 | `2118381147791613953` | 00:33:17 | FAILED（GRAPH_EXECUTION_FAILED / MODEL_CALL_FAILED） | 379ms | 1: STATE RUNNING → 2: STATE FAILED，无 MODEL_DELTA | `javax.net.ssl.SSLHandshakeException: Remote host terminated the handshake`（节点 `llm1` 记录同文） |
| 2 | `2118381841621770241` | 00:37 前后 | FAILED（同上） | 316ms | 同形，无 MODEL_DELTA | 同上 |
| 3 | `2118382547221143554` | 00:41 前后 | FAILED（同上） | 293ms | 同形，无 MODEL_DELTA | 同上 |
| 4 | `2118382998092046337` | 00:45 前后 | FAILED（同上） | 307ms | 同形，无 MODEL_DELTA | 同上 |
| 5 | `2118384464148094977` | 00:46 前后 | FAILED（同上） | 310ms | 同形，无 MODEL_DELTA | 同上 |

原始输出存档：`.runtime-lc023/lc023-real-fail-events.json`（#1 事件原文）、`.runtime-lc023/lc023-headed2-server18081.log`（服务端 00:33:17–00:33:18 段：解密后调用发起 → TLS 握手被对端/通道终止 → AgentFailureSummarizer 记录"传输/服务商类"失败）。

### 环境事实（判断失败层位的依据）

- 本机出站外网依赖本地代理（FlClashCore，127.0.0.1:7890 + TUN 198.18.0.1）。本轮 00:33 起，对 `api.commandcode.ai`、`openrouter.ai`、`github.com` 的 TLS 全部在 Client Hello 后被通道终止（curl `SSL_ERROR_SYSCALL`，代理 CONNECT 隧道能建立但内层握手失败；直连同样失败）；同会话 00:12–00:13 Web 推送（github HTTPS）尚且成功，说明是本轮时段代理外线路由瞬时劣化，而非凭据或代码问题。
- 解密层位证据：三次失败延迟均在 300ms 上下且错误为 SSL 握手，说明供应商 API 密钥解密与请求构造均已完成、HTTP(S) 调用已发起，即"隔离实例密文可解密"成立；失败仅发生在本机外网 TLS 通道。
- 聚合输出：无（未产生任何 MODEL_DELTA）。afterSequence 续传证明：因无真实流产生，本轮不适用，未伪造。

### 结论与去向

按提示03硬边界"真实调用失败（网络/配额/凭据失效）时如实记录原始错误（不含密钥），该项保持外部依赖说明，不得伪造"：EXT-023-01 保持外部依赖登记，失败原因为本机代理外线在本轮时段不可用（网络层），凭据解密与调用链路已验证至 TLS 发起。待外线恢复后按同一隔离方法补一次真实执行与 afterSequence 续传记录即可闭合：隔离库（含复制的凭据密文与 `lc023-real-stream` 图）保持原样，对端/API 脚本在 `.runtime-lc023/lc023-mock-archive/`（`mock-sse-server.mjs`、`lc023-api.mjs`），无需重建任何环境。

## 精确剩余依赖

- EXT-023-01 真实供应商增量：外部依赖（本机外线恢复后补实测），本轮已有 5 次真实尝试的完整失败证据与环境层位判定。
- Workspace 本轮回执提交的远程推送：与本节同一外线故障期间被阻（github HTTPS TLS 同样被终止），本地提交保留（`develop-sw`，回执07+新截图07+Web gitlink 3ae42cb4），外线恢复后按 §0.8.1 补推并回读；Web 候选分支的推送不受影响（已于外线可用时段完成并回读）。
- 非秘密遗留仅 Server 全量门禁 `sw-basic-notify-biz` 三个既有失败（receipt 05 第 76 行原义保持），按审查03安排到第 ④ 阶段处理。

整体七阶段保持 1/1/5：评估完成；实施进行中（本轮闭合提示03唯一剩余动作）；验收同步、feature→develop→main、发布 0.2.3、发布后同步、结束未开始。
