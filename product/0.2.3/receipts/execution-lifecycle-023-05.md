# 0.2.3 Agent 执行生命周期继续执行回执 05（草稿）

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
- 本轮没有可复用的非秘密浏览器登录态；正式页面提交→增量→刷新链未形成，不以 API 成功冒充 headed UI 通过。

### LC023-04 与工程门禁

- Server compile 通过。
- Server 全量 test 失败于 `sw-basic-notify-biz`：123 tests 中 2 failures、1 error，分别为 `I6G1aNotifyFailureBootTest`、`I6G1bRecoveryBootTest`、`I6G1cRecoveryExhaustedBootTest`；与本次 Agent 生命周期改动无代码交集。完整原文：`.runtime-lc023/server-test.log`。本方向聚焦测试随后通过，不能改写全量失败。
- Web typecheck、lint、test、build 四连全部通过；原文为 `.runtime-lc023/web-*.log`。用户 `vite.config.ts` 在途修改始终未暂存。
- 两仓候选分支均与各自远端一致；Server 最新远端为 `1cc4ad0e38889ce489e28c6249f0278057f59279`，Web 为 `646dc80aed8cba16029296efa48ec65e75eda9b3`。

## 精确剩余依赖

1. LC023-01 尚缺可控长任务的排队取消、运行取消竞争、服务重启恢复和副作用精确次数的真实 API 对端结果。
2. LC023-02 尚缺三格式可控协议对端的部分输出错误/429次数；真实供应商增量依赖既有授权配置在隔离候选中可用，且不能读取或复制秘密。
3. LC023-03 尚缺可用于候选浏览器的授权登录态或非秘密测试登录输入，才能完成 headed 提交→增量→取消或完成→刷新回查。
4. Server 全量门禁仍有三项 Notify 失败；本轮只保存并分列，不把无关失败顺手扩成修复范围。

整体七阶段保持 1/1/5：评估完成；实施进行中；验收同步、feature→develop→main、发布 0.2.3、发布后同步、结束未开始。
