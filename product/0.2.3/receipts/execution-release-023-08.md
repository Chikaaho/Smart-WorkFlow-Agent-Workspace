# 0.2.3 发布链执行回执 08（③ 验收同步 → ⑦ 结束）

2026-11-06｜Executor｜承接 `planning-execution-prompt-lifecycle-023-04.md` 与 `planning-review-lifecycle-023-04-passed.md`（实施验收 PASSED，A01—A08）。本文按阶段 ③—⑦ 分节记录实际结果，随各阶段完成即提交推送（防中断丢失）。整体七阶段计数随各节标注推进。

## EXT-023-01：真实供应商补测（外线恢复，已闭合）

- 环境重建：隔离 worktree `.lc023-mock/lc023-server-wt` 按 Server feature HEAD `30370877` 重新建立（原 worktree 已清理），`MAVEN_OPTS="-Xmx2g" mvn package -DskipTests` 重新打包 `bootstrap.jar`（220,812,073 B，2026-11-06 01:16，BUILD SUCCESS）；以 `--server.port=18081 --spring.profiles.active=local` + `SW_CIPHER_KEY`（仓库 local 默认值，非业务秘密）启动隔离候选，指向隔离库 `smart_workflow_lc023_01`（Flyway 终点 0.2.7，含上轮 Owner 授权只读复制的凭据密文组合 verify-real-cc/verify-real-m），health UP（17.091s 启动，PID 35536）。
- **补测结果（2026-11-06 01:21:45，1 次真实执行，有界：短提示词）**：
  - 图：`lc023-real-stream`（`2118380954316759042`，v2 发布，START→LLM→END 单 LLM 节点，模型 `verify-real-m`=deepseek/deepseek-v4.1-flash，供应商 verify-real-cc=OPENAI_CHAT/api.commandcode.ai）。
  - executionId `2118393347398721538`；异步受理 **566ms** 返回 executionId（Idempotency-Key `lc023-real-retest-1793899305973`）。
  - 终态 **SUCCESS**，执行延迟 **4300ms**（提交到完成墙钟 4960ms，事件轮询 9 次）。
  - 事件序列 **1—7 连续无缺口**：sequence 1 状态 RUNNING；**首个 MODEL_DELTA sequence=2**；增量 **5 条**（sequence 2—6）；终态事件 sequence 7。
  - 聚合输出（真实供应商返回）：`流式输出是指系统在生成内容的同时逐步把已生成的部分返回给用户，而不是等全部内容生成完成后一次性返回。`
  - **afterSequence 续传**：`afterSequence=2` 一次续传返回 sequence 3—7——有序、无重复、与全量事件集无漏片（机器判定 `resumeOrderedNoDup=true`、`noGap=true`）。
  - 原始结果存档：`.runtime-lc023/lc023-real-retest-result.json`（无密钥）；实测脚本 `.runtime-lc023/lc023-real-retest.mjs`（90s 硬超时 + 终态收敛条件）。
- 2026-11-05 首轮 5 次失败已定性为本机代理外线 TLS 握手（未达供应商）；本轮外线恢复（curl 对 api.commandcode.ai/github.com 均 TLS 200）后一次成功，证实凭据解密、调用链路、三协议流式解析与增量持久化全链真实可用。
- 不泄露：全程无明文密钥/密文/Authorization 头进入聊天、日志、回执；隔离库密文未再导出。
- 测后清理：隔离候选按精确 PID 35536 停止（18081 无监听）；隔离库、worktree、日志按 Owner 裁定保留。

## ③ 验收同步（完成时七阶段计数 **3/1/3**）

- 新建 `knowledge/features/0.2.3-agent-execution-lifecycle.md`：生命周期接口（异步受理/幂等/详情/事件 afterSequence 续传/取消）、状态机（QUEUED→RUNNING→SUCCESS/FAILED、CANCEL_REQUESTED→CANCELLED、重启收敛 INTERRUPTED/SERVICE_RESTART）、取消与恢复语义（排队取消 0 副作用、运行取消 1 次、不重放未知副作用）、三种协议流式（OPENAI_CHAT/OPENAI_RESPONSES/ANTHROPIC）、两 Key 429 轮换/冷却/首 delta 后不重放、已接受限制（无逐节点进度事件；事件为 JSON 轮询续传非 SSE）、EXT-023-01 实测结果、证据位置与固定计数。
- `knowledge/current-status.md`：新增 2026-11-06 当前状态段（实施 PASSED、EXT 闭合、③ 完成、七阶段 3/1/3、唯一下一动作=④）；旧 2026-11-05 段保留为历史。
- `knowledge/session-handoff.md`：当前续接改写为 ③ 完成态，旧 2026-11-05 段移入历史。
- 固定值不动：正式功能 **50**；M **59/18/13=90**；ADV **1/7/56=64**；实际 P **63**；问题 **57**；**P20 不核销**；已核销 P2/P4/P9/P15/P19/P29/P34/P47/P65 不变；P35 部分完成。
- Workspace 2285f045 已推送；本批（EXT+③ 证据与 knowledge）提交后推送并回读远端。

## ④ feature→develop→main（完成时七阶段计数 **4/1/2**）

- **Notify 三项（I6G1a/b/c）复测**：在 Server develop 当前 HEAD `2d81f3fe`（先 git fetch 回读）以独立 worktree 只对 `sw-basic/sw-basic-notify/sw-basic-notify-biz` 运行同三例（`-Dtest='I6G1aNotifyFailureBootTest,I6G1bRecoveryBootTest,I6G1cRecoveryExhaustedBootTest'`）：**develop 3/3 通过**（1/1/1，0 失败 0 错误，exit 0，日志 `.runtime-lc023/lc023-develop-notify-test.log`）。同命令在 feature HEAD `30370877` 复测：**feature 亦 3/3 通过**（`.runtime-lc023/lc023-feature-notify-test.log`）；且 feature 分支 CI run `42050128557`（@ `30370877`）**success**。结论：receipt 05 全量门禁中的三例失败为既有 Redis 依赖 Boot 用例偶发族（0.2.2 CI 有同款 attempt 失败→rerun 通过先例），非本分支回归，按提示 04 继续合并。
- **Server 合并**（普通合并 --no-ff，无强推）：`feature/023-agent-execution-lifecycle`（`30370877`）→ develop 合并 `383dcd31` + 版本收敛 `a5e5ec67`（pom `<revision>`/workflow 断言/build-prod.sh/check-version-identity.sh 全部 0.2.2→**0.2.3**-SNAPSHOT；`check-version-identity.sh develop` PASS：32/32 反应堆项目解析为 0.2.3-SNAPSHOT）→ main 合并 `9b86ff0d`。develop 推送远端回读 `a5e5ec67cb34e1082e668fdfe33bb8b949ffced8`，main 推送远端回读 `9b86ff0d0c0874ad6e04dca211f5cac12ca4d4ce`。
- **Web 合并**（merge worktree 进行，用户在途 `vite.config.ts` 未读改未暂存）：`feature/023-agent-execution-lifecycle`（`3ae42cb4`）→ develop 合并 `53684bb` + 版本收敛 `20f3f27`（package.json 0.2.2→**0.2.3**）→ main 合并 `47106e8`。develop 远端回读 `20f3f274a59a80ad270f6db49b04f4a39695140b`，main 远端回读 `47106e8ee1db92e4a51dd8fb8fee2a4f84bddd2e`。
- 两仓 develop/main 推送均触发 CI（结果见 ⑤ 节制品与 run 记录）。

## ⑤ 发布 0.2.3（完成时七阶段计数 **5/1/2**）

- **CI 实跑（main 推送触发既有 build-release workflow）**：Server run `42075329494`（@ `9b86ff0d`）attempt 1 failure——`AgentOrchestrationServiceImplTest`（既有工具编排偶发，receipt 05 已登记同族）＋`AgentGraphExecutionLifecycleControlledTaskTest` 5 例中 1 例（并发受控任务测试在 CI 负载下 5s await 界抖动；同代码 feature run `42050128557` 曾 success）——**同提交 rerun（attempt 2）success**；develop run `42075156949` 同因 attempt 1 failure → rerun success。Web run `42075343895`（@ `47106e8`）success、develop run `42075275948` success。
- **版本一致性**：Server CI 断言 0.2.3-SNAPSHOT 通过（workflow 解析→断言→-Drevision=0.2.3 贯穿测试/打包/制品门禁）；制品标记 `build.version=0.2.3` 实测；Web 包版本 0.2.3（`sw-web-dist-0.2.3.zip`）。
- **成对 annotated tag `0.2.3`**：Server→`9b86ff0d`（tag 对象 `4648da3d`，`rev-parse 0.2.3^{commit}` 回读一致）、Web→`47106e8`（tag 对象 `97d5e374`）。
- **语义 Release（latest 已回读）**：「CH-aPaaS Server 0.2.3」（id 435535394）资产 `bootstrap-0.2.3.jar` 220,811,858 B sha256 `ababcba649b991b381df9b68a2bec074b24664794b57d7a71bfebdbc146f9b29`（与 build-9b86ff0d CI 产物同源下载后核验一致，`build.version=0.2.3` 实测；发布说明含 EXT-023-01 实测结果与已接受限制）；「CH-aPaaS Web 0.2.3」（id 435518991）资产 `sw-web-dist-0.2.3.zip` 6,191,844 B sha256 `ad9a966fd8cd151cfc74481d02b2ff97c1d5153bc30e13f2954c799595fbe236`，入口 `assets/index-BPeKW0PB.js`。两仓 `releases/latest` 回读均为语义 `0.2.3`；既有 `build-<sha>` Release 全部保留未删未覆盖。
- **UAT 就地升级（0.2.2 → 0.2.3，既有通道）**：升级前备份——`bootstrap.jar.bak-0.2.2`（220,778,675 B）与 `web.bak-0.2.3-pre.tar.gz`（6,116,687 B）；上传后远端 sha256 与本地一致；`stop.sh` 停 0.2.2（PID 3208758）→ 换 jar（`build.version=0.2.3` 实测）→ 替换 web 静态 → 启动。
  - **如实记录一次启动失败**：首次 `start.sh` 未装载 `server.env`（PG SCRAM「no password was provided」→ druid create error → Application run failed，02:03:18），按运维手册 §6.4/§8.1 既有教训 `. ./server.env` 后重启成功（02:10:31 启动）；停服窗口约 02:03–02:14（约 11 分钟）。
  - **启动与迁移**：`Started StarterApplication in 181.01 seconds`（新 PID 3228289）；启动段 ERROR 0；Flyway **Migrating to version "0.2.7 - agent execution lifecycle"，Successfully applied 1 migration → now at v0.2.7**（DB 实测）。
  - **health 回读**：本机 `/api/actuator/health` = `{"status":"UP"}`；经 nginx `/sw-server/api/actuator/health` = `{"status":"UP"}`；HTTPS 根 200 且入口 `index-BPeKW0PB.js` 与发布 zip 一致。磁盘可用 1.6G（92% 已用）。

## ⑥ 发布后同步（未开始）

（待填：knowledge 版本事实、tag、来源 commit、部署结果）

## ⑦ 结束（未开始）

（待填：保留环境清单、不泄露核对结果）
