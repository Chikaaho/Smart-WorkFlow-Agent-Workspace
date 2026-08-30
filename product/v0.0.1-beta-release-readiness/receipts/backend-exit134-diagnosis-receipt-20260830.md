# F4 诊断回执：后端 exit 134（Abort trap 6）定向诊断与补证

> 任务：`search_task/v0.0.1-beta-backend-exit134-diagnosis.md`；会话角色：执行；2026-08-30。
> 结论：**F4 可核销**——abort 站点由两份 macOS crash report 唯一确定（候选外 JVM AWT/AppKit 注册路径异常），固定提交 `ba59539` 上定向测试 3 连过、后端全量 **2 次均为 955/0/0/0**，全程未修改任何仓库文件、未改变测试语义。

## 1. 隔离环境与基线

- 隔离 checkout：`git worktree add --detach /private/tmp/swf-exit134-diag.6118/backend ba59539`，HEAD=`ba5953977ef8b8684e0d551216283727b7540ad4`，工作树 clean（`git status --porcelain` 0 行）。核验后 worktree 已移除，原仓 develop 仍在 `ba59539` 且 clean。
- 隔离 Maven 仓：`/private/tmp/swf-exit134-diag.6118/m2`（自上轮终验隔离仓复制，485MB，独立于开发 `~/.m2`）。
- 环境基线（`env-baseline.txt`）：macOS 26.3.1 arm64；OpenJDK 21.0.11 Homebrew；Maven 3.8.6；内存 8GB；磁盘 `/System/Volumes/Data` 剩余 7.9Gi（96% 已用，仅记录，非 abort 栈相关）；fd 上限 1048575；负载 3.44；前后端编译互斥检测：无前端 pnpm/vite/vitest 进程（exit 1 = 无匹配）。

## 2. 根因事实（直接崩溃证据）

上轮两次崩溃各有一份 macOS crash report，位于 `~/Library/Logs/DiagnosticReports/`：

| 文件 | pid | 时间 | 触发线程栈（自上而下完全一致） |
|---|---|---|---|
| `java-2026-08-30-173744.ips` | 77818 | 17:37:44 | `__pthread_kill → pthread_kill → abort → ___RegisterApplication_block_invoke → _dispatch_once_callout → _RegisterApplication → +[JRSAppKitAWT registerAWTAppWithOptions:] → -[NSApplicationAWT registerWithProcessManager] → +[NSApplication sharedApplication] → +[AWTStarter starter:headless:]` |
| `java-2026-08-30-173833.ips` | 78005 | 17:38:33 | 同上 |

- exception 均为 `EXC_CRASH / SIGABRT`（对应 shell 报告的 `Abort trap: 6` / exit 134）。
- 对应关系：pid 77818 = 上轮全量 `backend-test.log` L12281 的 surefire fork `jvmRun1`（engine 模块 fork 的**首个**测试类 `ApprovalProcessIntegrationTest` 启动阶段，Tests run 0）；pid 78005 = 上轮进程内复核 `bpm-approval-inprocess-final.log`（日志止于 17:38:25 引擎初始化中，无后续输出）。
- 已检索且不存在的结果：诊断目录与隔离 checkout 内无 `hs_err_pid*`（abort 发生在原生 AppKit 路径，JVM 未走到 fatal-error 落盘）；surefire 目录无 `.dumpstream`/dump 文件；除上述两份 ips 外，`~/Library/Logs/DiagnosticReports/` 无其他相关 java 报告。
- 根因定性：abort 发生在 **JVM AWT 桌面集成初始化**（`AWTStarter` → AppKit `NSApplication` 注册）的 macOS 会话层，属**候选代码/测试之外的 JVM、原生库与会话环境异常**。候选排除依据：同一 `ba59539` 二进制、同一命令形态在窗口外全部通过（见 §3），且候选内无任何显式 AWT/图形依赖（测试类为纯 Flowable 内存引擎，AWT 由依赖栈深处触发加载）。

## 3. 根因事实 → 处置 → 复验 一一对应矩阵

| # | 根因事实 | 处置 | 复验结果 |
|---|---|---|---|
| 1 | abort 站点 = AWT/AppKit 注册（crash report 唯一直接证据） | 无需处置：非候选缺陷，未修改任何仓库文件/POM/Surefire/JVM 基线，未引入任何环境参数（含 headless） | 定向 3 连过 + 全量 2 次全过，均无新 crash report |
| 2 | 17:37:44 与 17:38:33 约 50 秒窗口内两次 abort；窗口外（17:37 前的全量、本轮 18:12 起）同类运行全部通过 | 无可实施处置：窗口级触发条件（推测为 macOS GUI 会话/WindowServer 可用性的瞬时状态——**此为推测**）无法事后唯一重建 | 因触发条件不可控，按方向保守口径完成**全量 2 次**稳定性补证，均 955/0/0/0 |
| 3 | 单独定向运行可稳定通过（本轮 run1 即通过） | 维持原命令原配置复验 | run2、run3 连续通过（共 3 连过） |

## 4. 行为证据汇总（全部可复算）

定向（`cd $D/backend/sw-biz/sw-bpm/sw-bpm-engine && MAVEN_OPTS="-Xmx2g" mvn -Dmaven.repo.local=$D/m2 test -Dtest=ApprovalProcessIntegrationTest`）：

| 轮次 | 退出码 | 计数 | 日志 |
|---|---|---|---|
| run1 | 0 | Tests run: 2, Failures: 0, Errors: 0, Skipped: 0 | `targeted-run1-reproduce.log` |
| run2 | 0 | 同上 | `targeted-run2.log` |
| run3 | 0 | 同上 | `targeted-run3.log` |

全量（`cd $D/backend && MAVEN_OPTS="-Xmx2g" mvn -Dmaven.repo.local=$D/m2 test`）：

| 轮次 | 退出码 | 逐模块汇总（12 模块） | BUILD | 日志 |
|---|---|---|---|---|
| full-run1 | 0 | **955 / 0 / 0 / 0** | SUCCESS | `backend-full-run1.log` |
| full-run2 | 0 | **955 / 0 / 0 / 0** | SUCCESS | `backend-full-run2.log`（grep "Process Exit Code" = 0 处） |

`$D` = `/private/tmp/swf-exit134-diag.6118`。证据目录同时保留 `env-baseline.txt` 与隔离 Maven 仓副本。两轮全量后 `~/Library/Logs/DiagnosticReports/` 均无新增 java 崩溃报告。

## 5. 执行边界确认

未修改业务代码、测试代码、POM、Surefire 参数、JVM 参数基线、README、需求或治理文件；未跳过/隔离/删除/弱化测试；未 commit/push/创建 tag；未替代固定提交（全部验证在 `ba59539` detached worktree 上完成，主仓工作树保持 clean）。前端、业务链、启动、Redis 三态、tag 事实（F1~F3、F5~F8）均未重验。

## 6. 结论

- exit 134 为可识别的候选外 JVM/原生/会话异常（AWT AppKit 注册 abort），非候选实现或测试缺陷；
- 触发条件的窗口级瞬态未能唯一重建，故按方向要求完成 2 次全量稳定性补证；
- 固定提交 `ba59539` 满足后端发布门禁的复算证据：定向 3 连过（2/2×3）+ 全量 2×955/0/0/0；
- 请规划据此复核 F4 核销并恢复最终发布裁决。
