# 0.2.3 Agent 执行生命周期继续执行回执 05

2026-11-05｜Executor｜承接 `planning-execution-prompt-lifecycle-023-01.md`。本文随 LC023-01—04 后续结果持续补充；当前不表示 Planner 验收通过，不声明 `PASSED/COMPLETED`，不核销 P20。

## 本轮归属与保护

- 唯一主方向：`product/0.2.3/ready/direction-023-agent-execution-lifecycle.md`。
- 本轮 Planner 在途归属文件：`memory/state.md`、`memory/handoff.md`、`planning-review-lifecycle-023-01.md`、`planning-execution-prompt-lifecycle-023-01.md`。本回执承接其当前口径，不覆盖 Planner 原文。
- Server 候选：`feature/023-agent-execution-lifecycle`，本地与远端均为 `a4c2ae180d30b7ee547230cde968e3f5d3885a6f`。
- Web 候选：`feature/023-agent-execution-lifecycle`，本地与远端均为 `646dc80aed8cba16029296efa48ec65e75eda9b3`。
- Web `vite.config.ts` 的 `allowedHosts` 是用户在途修改；8080 用户服务使用 `smart_workflow_f1v4b`；5173 为用户既有 Vite 服务。均未停止、替换、暂存或修改。未读取或外传秘密。

## LC023-04：既有原始输出定位

原始 Maven 测试输出保存在各模块 `target/surefire-reports/`，未复制进 Git：

| 类别 | 可回读原始输出 | 实际结果与层级 |
|---|---|---|
| Agent 全模块当前报告集 | `Smart-WorkFlow-aPaaS-server/sw-basic/sw-basic-agent/target/surefire-reports/TEST-*.xml` 及同名 `.txt` | 30 个报告、339 tests、0 failures、0 errors、0 skipped。文件时间集中在 2026-11-05 18:34；`AgentToolConfigServiceImplTest` 单类报告更新于 18:38。该集合是后续复验后的当前磁盘结果，不能改写此前全量曾失败的事实。 |
| Server 全量首次失败 | 既有完整 Maven 控制台原文未在工作区找到；对应 Surefire 报告已被后续单类复验覆盖 | 历史回执 02/04 记录：全量运行到 `sw-basic-agent` 的 339 项时，`AgentOrchestrationServiceImplTest` 有一个既有工具编排断言失败。当前该类 XML 为 13/13 通过，不能据此宣称首次全量通过。 |
| 单类复验 | `.../TEST-com.sw.ck.agent.service.impl.AgentOrchestrationServiceImplTest.xml`；`.../TEST-com.sw.ck.agent.service.impl.AgentToolConfigServiceImplTest.xml` | 当前分别 13/13、7/7 通过。与全量失败分列，只证明单类复验通过。 |
| 三格式装配 | `.../TEST-com.sw.ck.agent.orchestration.AgentChatModelAssemblerStreamingTest.xml` | 2/2 通过：三格式装配、未知格式拒绝且不泄漏 Key。仅属装配测试，不冒充协议对端或真实供应商增量。 |
| 三协议兼容 | `.../TEST-com.sw.ck.agent.orchestration.LangChain4jCompatibilityTest.xml` | 4/4 通过：OpenAI Chat、OpenAI Responses、Anthropic round-trip 与 Jackson 基线。 |
| 迁移 | `sw-bootstrap/target/surefire-reports/TEST-com.sw.ck.bootstrap.FlywayFullChainH2Test.xml`、`TEST-com.sw.ck.bootstrap.FlywayFullChainPostgresTest.xml`、`TEST-com.sw.ck.bootstrap.ApplicationCenterUpgradeContinuityTest.xml`、`TEST-com.sw.ck.bootstrap.ApplicationCenterLegacyUpgradeTest.xml` | 分别 20/20、13/13、4/4、7/7 通过。当前 PG 全链报告包含迁移链校验，但生命周期表的运行时行为仍待隔离服务验证。 |
| Web 四连 | 未找到本轮 typecheck/lint/test/build 的完整控制台原文；仓内现有 `vite-dev.log` 是开发服务日志，不是四连门禁原文 | 历史回执 03/04 记录：231 个测试文件通过、1 个跳过，typecheck/lint/test/build 通过。原始门禁输出缺失，不重跑以伪造旧原文；后续受影响门禁按实际条件另行保存。 |

## LC023-04：兼容行为分类

| 分类 | 当前可回读结果 | 尚缺结果 |
|---|---|---|
| 同步接口兼容 | `AgentGraphExecutionServiceImplTest` 48/48；覆盖同步成功/失败、超时、快照绑定、历史查询、跨租户、RAG/工具和 token 记录。`AgentGraphExecutionSecurityIntegrationTest` 12/12。 | 当前候选真实 HTTP 同步接口与异步接口并存的运行回归。 |
| 调试 stop | `AgentGraphDebugBehaviorIntegrationTest` 15/15、`AgentGraphDebugServiceTest` 15/15、`AgentGraphDebugSecurityIntegrationTest` 28/28、`AgentGraphDebugEngineTest` 13/13。覆盖 paused→stopped、仅暂停态可 stop、终态/版本冲突、工具 stale version 不重放、跨租户拒绝。 | 候选运行环境中 stop 后不再产生新动作/工具副作用的有界对端次数。 |
| 多 Key / 429 | 当前报告可证明 Provider Key 加密/掩码与配置兼容；生命周期实现包含首个可见 delta 后不轮换的代码路径。 | 尚无可控协议对端的 429 冷却/轮换次数、部分输出后禁止重放的真实调用次数；不能用装配测试替代。 |
| RAG | `AgentGraphInterpreterTest` 39/39 中包含 knowledge retrieve、缺失服务失败和变量写入；同步执行测试同时覆盖已发布图与错误持久化。 | 异步候选中的实际 RAG 执行与取消/恢复语义。 |
| 工具 | `AgentToolCallbackFactoryTest` 6/6、`AgentToolConfigServiceImplTest` 7/7、工具配置安全 8/8；覆盖内外部工具、超时、调用记录、绑定/清理及权限。 | 异步取消竞争、调试 stop、部分流式错误下的工具副作用精确次数。 |
| 迁移 | H2/PG 全链和旧基线升级报告通过；`target/classes` 已有 H2/PG `V0.2.7__agent_execution_lifecycle.sql`。 | 隔离数据库实际启动迁移及重启恢复状态。 |
| Web 代理 | 已提交的 `vite.config.ts` 将 `/api` 代理到 `VITE_PROXY_TARGET` 或 `http://localhost:8080`，`changeOrigin=true`；未发现 SSE 专用 buffering 配置。用户在途 `allowedHosts` 与本方向无关，保持不动。 | headed 验收时需用独立 Web 实例显式指向隔离 Server；不得改用户 5173 服务。 |

## 候选编译产物只读核对

- `sw-bootstrap/target/bootstrap.jar`：220,781,908 bytes，最后修改时间 2026-11-05 00:44:01。
- 当前 Server 候选 HEAD 提交时间为 2026-11-05 18:32:19；JAR 明显早于生命周期提交。
- JAR 条目检索未发现 `AgentGraphExecutionLifecycle*`、`AgentGraphExecutionEvent*` 或 `V0.2.7__agent_execution_lifecycle.sql`。
- 模块 `target/classes` 中存在候选 class（约 18:27）和 V0.2.7 迁移（约 17:49），但这些分散目录不是可独立启动的完整 Spring Boot 制品。
- 结论：现有 `bootstrap.jar` 不能代表当前候选，不能无需构建直接用于候选运行验收。未启动该旧 JAR。

## 真实运行、缺陷修复与门禁结果

Owner 授权后精确停止已核实的 Vite PID 9600；8080 Java、`smart_workflow_f1v4b` 和其他用户服务未动。Server 在隔离 worktree 构建，数据库为 `smart_workflow_lc023_01`，端口 18080；Web 使用 15173。任务自有 PID 和隔离 worktree 均已精确清理。

### LC023-01

- 当前候选真实 HTTP 创建并发布 START→END 图 `2118307199955574786`。
- 首次提交暴露 PostgreSQL `create_by varchar = bigint`，修复提交 `0a5f3917ab0d518779fdd115163331696dd9938a`；远端回读一致。
- 再次提交暴露执行线程在租户上下文恢复前领取队列，记录永久 QUEUED；修复提交 `1cc4ad0e38889ce489e28c6249f0278057f59279`；远端回读一致。
- 修复后执行 `2118309349947363329`：受理先返回 QUEUED，随后持久终态 SUCCESS；output=`hello-final`，底层结果执行 `2118309350287101953`，latency 68ms。
- 同一幂等键与同一输入回查同一 executionId；冲突输入返回结构化 400。终态后 cancel 保持 SUCCESS，不改写结果。
- 事件为 sequence 1 RUNNING、2 SUCCESS；`afterSequence=1` 只返回 sequence 2，证明有序补取与去重边界。
- PostgreSQL 表与 API 回读一致。历史执行、跨租户、调试权限的完整运行矩阵仍以现有安全测试为补充；本轮没有构造破坏性跨租户数据。

### LC023-02

- 聚焦回归实际通过：`AgentChatModelAssemblerStreamingTest`、`LangChain4jCompatibilityTest`、`AgentGraphInterpreterTest`、`AgentToolCallbackFactoryTest`、`AgentGraphDebugBehaviorIntegrationTest`、`AgentGraphDebugServiceTest`。
- 三格式装配和 round-trip、RAG、工具、调试 stop 均有可回读 Surefire 原文。
- 本轮隔离库没有复制用户供应商密钥，未读取或外传秘密，因此没有真实供应商增量；429 部分输出后的 Key 轮换仍只有实现和聚焦测试层证据，不能标成真实供应商通过。

### LC023-03

- 官方 `browser-use:control-browser`，IAB 可见模式，`headless=false`，视口 1440×900。
- 独立候选地址 `http://127.0.0.1:15173` 可见登录页；刷新/直达图设计器后因 token 只存内存按安全基线回到登录。
- 已直接使用 dev 固定契约（企业名 `CH-aPaaS`、账号 `admin`、开发口令、固定验证码 `1234`）填写并提交登录，不再把无预存登录态作为停止条件。登录请求由候选页面真实发出；页面返回“服务暂时不可用，请稍后重试”，因此正式页面提交→增量→刷新链未形成，不以 API 成功冒充 headed UI 通过。

### LC023-04 与工程门禁

- Server compile 通过。
- Server 全量 test 失败于 `sw-basic-notify-biz`：123 tests 中 2 failures、1 error，分别为 `I6G1aNotifyFailureBootTest`、`I6G1bRecoveryBootTest`、`I6G1cRecoveryExhaustedBootTest`；与本次 Agent 生命周期改动无代码交集。完整原文：`.runtime-lc023/server-test.log`。本方向聚焦测试随后通过，不能改写全量失败。
- Web typecheck、lint、test、build 四连全部通过；原文为 `.runtime-lc023/web-*.log`。用户 `vite.config.ts` 在途修改始终未暂存。
- 两仓候选分支均与各自远端一致；Server 最新远端为 `1cc4ad0e38889ce489e28c6249f0278057f59279`，Web 为 `646dc80aed8cba16029296efa48ec65e75eda9b3`。

## 续办结果（Server `335d34d6`）

### LC023-01：可控任务与副作用次数

新增 `AgentGraphExecutionLifecycleControlledTaskTest`，使用有界 latch 和虚拟线程夹具，不启动常驻服务：

- 排队取消：`QUEUED → CANCELLED`，外部执行调用 0 次，终态事件 1 次。
- 运行取消竞争：执行进入后发起取消，外部副作用精确 1 次，`finish(CANCELLED)` 精确 1 次，线程在 5 秒界内退出。
- 重启恢复：启动时先把不确定的 `RUNNING/CANCEL_REQUESTED` 批量标为 `INTERRUPTED/SERVICE_RESTART`，只重新派发 `QUEUED`；夹具中的队列任务执行 1 次，未重放不确定运行任务。
- 原始输出：`.runtime-lc023/lifecycle-controlled-task-test.log`。3 tests，0 failures/errors/skipped，`BUILD SUCCESS`。
- 提交与远端回读：`335d34d6db150f8f59723cfd917e9489e482543a`。

### LC023-02：三协议真实 HTTP 增量与失败语义

扩充 `AgentChatModelAssemblerStreamingTest`，以 JDK `HttpServer` 建立三个真实 HTTP/SSE 对端：

- `OPENAI_CHAT`：收到 `chat-`、`ok` 两个 delta，最终文本 `chat-ok`，HTTP 调用 1 次。
- `OPENAI_RESPONSES`：收到 `response.output_text.delta`，最终文本 `responses-ok`，HTTP 调用 1 次。
- `ANTHROPIC`：收到 Messages 事件序列及 `text_delta`，最终文本 `anthropic-ok`，HTTP 调用 1 次。
- 部分输出失败：首个可见 delta=`visible` 后注入损坏事件，客户端报告错误且请求调用仍为 1 次，没有重放。
- 429：流式对端返回 429，客户端报告错误，请求调用 1 次。
- `afterSequence` 续传继续引用本回执第 57 行的真实 API 结果：sequence 1/2，`afterSequence=1` 仅返回 sequence 2。
- 原始输出：`.runtime-lc023/streaming-http-protocol-test.log`。5 tests，0 failures/errors/skipped，`BUILD SUCCESS`。
- 提交与远端回读：`a4e73177a93bab1076730f6689a60af6808bf3e5`；随后生命周期提交包含该提交。

最终联合聚焦门禁：`.runtime-lc023/lifecycle-final-focused-test.log`，8 tests，0 failures/errors/skipped，`BUILD SUCCESS`。

### LC023-03：headed 登录与执行闭环

使用官方 `browser-use:control-browser` 的 IAB，`headless=false`、1440×900，候选 URL `http://127.0.0.1:15173/login?redirect=/agent/graph-designer/2118307199955574786`：

- 原“服务暂时不可用”根因是候选 Server 未存活，Web 代理目标 18080 连接失败；重新构建当前候选并用固定 dev 配置启动后，`/api/actuator/health` 返回 200，登录提交不再返回服务不可用。
- 隔离库 `smart_workflow_lc023_01` 是任务自有测试库。按正式迁移 `R__0.1.10_admin_password.sql` 写回固定 dev 管理员 BCrypt 散列，更新 1 行并核对 tenant_id=0、admin、is_admin=1、status=0、散列长度 60；原始输出为 `.runtime-lc023/isolation-admin-reset.log`。未触碰 `smart_workflow_f1v4b`，未读取真实秘密。
- 数据库中的固定租户名为 `默认租户`。使用 `默认租户` / `admin` / 固定 dev 口令 / 验证码 `1234` 登录成功，页面显示“系统管理员”并进入图 `2118307199955574786`（`lc023-start-end`，v1）。
- 在可见“执行测试”区域输入 `headed-lc023-final` 并触发“运行”；页面显示终态 `SUCCESS`、“执行成功”、输出 `headed-lc023-final`、耗时 53ms。START→END 图执行很快，UI 可见观察到受理后的终态与输出，没有供应商节点，故不伪称观察到供应商 token 增量。
- 点击页面提供的“查看详情”导航到 `/404`，暴露一个 Web 详情路由缺口；该缺口不影响执行成功，但详情按钮当前不可用。随后用已核实的图 URL 重进，登录态仍有效，图页面正常恢复；执行结果卡片不在重进后恢复，因此持久回查仍由既有真实 HTTP/API 记录证明，不能宣称 UI 已持久展示历史记录。
- 未提交日志或截图；浏览器视觉证据仅记录上述可见文本。

## 精确剩余依赖

唯一外部依赖为真实供应商密钥：三格式真实 HTTP 对端、部分输出失败、429、续传和禁止重放均已完成；对真实供应商的增量调用因任务明确禁止读取密钥，记为 `REQUIRES_SECRET`。

非秘密遗留分列：Web“查看详情”当前导航到 `/404`，且重进图设计器后不恢复刚才的执行结果卡片；Server 全量门禁的三个 Notify 既有失败仍按第 75 行分列。隔离身份、headed 登录与页面执行成功链已完成；未修改用户库，不扩修 Notify。

整体七阶段保持 1/1/5：评估完成；实施进行中；验收同步、feature→develop→main、发布 0.2.3、发布后同步、结束未开始。
