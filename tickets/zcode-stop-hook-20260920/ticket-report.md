# 工单报告：ZCode 宿主 Stop hook 间歇性执行失败（spawn/启动早期快速失败）

- **报告日期**：2026-09-20
- **产品**：ZCode 桌面版（Electron）+ 内置引擎 CLI
- **版本**：应用会话记录 version 0.16.5；CLI `zcode --help` 自报 0.16.9
- **操作系统**：Windows 10.0.19045 x64
- ** hook 运行环境**：Windows PowerShell 5.1（`SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe`）；hook 声明位于用户级 `~/.zcode/cli/config.json`（`hooks.enabled: true`）
- **工作负载特征**：长时编码会话（单回合 2–4.5 小时、300–460 次工具调用，并发 dev server / vitest / 浏览器自动化）

---

## 1. 问题摘要

用户级配置注册的 **Stop 事件 hook 在回合结束时间歇性执行失败**。失败呈统一签名：
**派发后 170–309ms 内进程死亡**，宿主只记一条 `warn` 级 `hook.run.failed`
（context 仅含 `hookEventName/hookIndex/source/durationMs`，**无 stderr、无退出码、无错误消息**），
回合照常结束，hook 的裁决结果（block/continue）丢失。

四天内累计 **13 次 Stop hook 失败**（另有 4 次 workspace 声明时代的 UserPromptSubmit 失败），
横跨两种声明形态（`process`/argv 直启与 `command`+cmd 包装器），失败签名完全一致。
同窗口、同期的 UserPromptSubmit hook（`command` 型）自迁移用户级配置后 **零失败**。

## 2. 失败清单（全部 13 次 Stop 失败，UTC 时间）

| # | 时间 (UTC) | 耗时 | 声明形态（source） | 会话 |
|---|---|---|---|---|
| 1 | 09-17 18:36:59 | 246ms | workspace process 型 | sess_8484d0d8… |
| 2 | 09-17 19:05:15 | 209ms | workspace process 型 | sess_8484d0d8… |
| 3 | 09-18 01:13:56 | 223ms | workspace process 型 | sess_8484d0d8… |
| 4 | 09-18 02:01:08 | 197ms | workspace process 型 | sess_8484d0d8… |
| 5 | 09-18 13:53:57 | 171ms | workspace process 型 | sess_d6033e49… |
| 6 | 09-18 14:37:58 | 256ms | workspace process 型 | sess_d6033e49… |
| 7 | 09-19 07:45:49 | 270ms | user-level process 型 | sess_1348a24a… |
| 8 | 09-19 08:29:54 | 309ms | user-level process 型 | sess_1348a24a… |
| 9 | 09-19 10:53:38 | 224ms | user-level process 型 | sess_84757316… |
| 10 | 09-19 12:21:30 | 226ms | user-level process 型 | sess_84757316… |
| 11 | 09-19 12:35:15 | 170ms | user-level process 型 | sess_84757316… |
| 12 | 09-19 21:21:22 | 246ms | user-level process 型 | sess_d85555b2… |
| 13 | 09-19 23:54:43 | 174ms | user-level process 型 | sess_d85555b2… |

原始记录见附件 `evidence/hook-run-failed-all.jsonl`（含 traceId / turnId / source_log）。

## 3. 现象特征（所有失败的共同点）

1. **只发生在回合结束的 Stop hook**；同窗口同配置的 UserPromptSubmit hook 正常。
2. **耗时 170–309ms**——远低于 hook 超时（60s），也低于/接近 PowerShell 冷启动常量，
   即进程在启动最早期即死亡，未进入脚本主体逻辑。
3. **全部发生在回合收尾时点**（与 `turn.completed` 前后秒级相邻），且集中在长时、
   高负载的窗口（回合 2–4.5 小时、数百次工具调用、并发构建/测试/浏览器进程）。
4. **失败完全静默**：除 warn 行外无任何 stderr/退出码可观察，排障时极易误判为
   "未派发"。
5. **重启应用后暂时恢复**：两次实测（09-19 16:08 重启后 16:24 成功拦截；
   09-20 00:28 重启后 00:16/00:18 成功执行），失败在窗口持续运行数小时后复发
   （09-20 07:54 再次失败，距重启约 7.5 小时）。

## 4. 决定性证据：失败发生在进程启动早期，与脚本内容无关

09-19 21:21:22Z 的失败（sess_d85555b2，246ms）发生时，被调用的 gate 脚本
（stop-gate.ps1）**第一条可执行语句即派发回执**（写 `invocations.log`，
先于 StrictMode/编码设置/dot-source 执行）。该次失败**没有留下任何回执**——
即 PowerShell 进程在执行脚本任何语句之前就已死亡。据此可定位失败层：

> **宿主对 hook 子进程的 spawn/启动早期（参数绑定、宿主侧 stdio/管道建立、
> .NET 运行时初始化之前）即失败**，而非脚本逻辑、路径或载荷问题。

旁证：同会话 5 分钟内先成功后失败（09-19 08:24:14 Stop 正常执行并产生 block
裁决 → 08:29:54 同会话 Stop 失败），排除配置/脚本/路径因素，指向窗口运行时状态
（长时间高负载后的进程生成能力退化）。

## 5. 我方已排除项（均有一手验证记录）

| 排除项 | 验证方式 |
|---|---|
| hook 脚本逻辑缺陷 | 手工全链路重放（argv 直启 + stdin 载荷）100% 正确裁决（block/pass 均验证）；契约测试 38/38、终态回归 49/49 |
| 声明形态（process/command） | 两种形态均出现同签名失败；command 型 UserPromptSubmit 在同窗口零失败 |
| 脚本路径/权限 | 绝对路径（%SystemRoot% 与部署盘符）；同路径手工调用稳定成功 |
| stdin 载荷通道 | UserPromptSubmit 经同一载荷管道一直正常；失败时脚本首语句回执缺失，未走到读取环节 |
| 载荷内容/大小 | 成功案例载荷 14.6KB 与失败案例（推测同量级）无形态差异 |
| 引擎 hook 装配 | 引擎源码核对：runStopHooks 在正常回合收尾路径无条件调用；runner 对用户级 Stop hook 无事件特定过滤 |
| 工作区信任层 | 失败源标签为 `config.Stop.0.0`（用户级），不经过 workspace trust 准入 |

## 6. 影响

Stop hook 承载执行会话的收尾门禁（拒绝无终态契约的中间汇报并自动续行）。
失败导致门禁静默旁路：长任务执行会话以中间态汇报结束回合且不被拦截，
需要人工判断是否继续。我方已部署宿主外监督器作为补偿控制，但宿主侧的
失败本身仍需修复。

## 7. 请求事项

1. **可观测性（最迫切）**：`hook.run.failed` 的 warn 日志请包含失败详情——
   子进程退出码、status、stderr/stdout 预览（引擎内 `processHookExecutionResult`
   抛出的 context 已含 `stderrPreview/stdoutPreview`，但日志行未输出），否则
   用户侧无法区分 spawn 失败、启动崩溃与脚本失败。
2. **根因排查**：长时高负载窗口内 hook 子进程 spawn/启动早期（首语句之前）
   间歇性死亡的原因；建议在引擎侧对 hook 子进程 spawn 的 CreateProcess 返回值、
   退出码与启动超时分类记录。
3. **可靠性**：Stop hook 承载收尾治理，失败应可重试或以可观察方式降级
   （当前一次失败即静默旁路回合收尾）。

## 8. 附件（evidence/）

| 文件 | 内容 |
|---|---|
| `hook-run-failed-all.jsonl` | 全部 17 条 hook 失败原始日志行（含 Stop ×13、UserPromptSubmit ×4，标注来源日志文件） |
| `stop-gate-audit.jsonl` | 我方门禁自身审计：成功拦截（MARKER_MISSING/CONTRACT_REJECTED）与放行（TERMINAL_ACCEPTED，含 EXECUTION_SUBMITTED）记录，证明 hook 被执行时裁决链路完好 |
| `stop-gate-invocations.jsonl` | 门禁派发回执（invoked → payload-read 生命周期，含字节量与会话归因）；失败案例在同时段无回执 |
| `affected-turn-completions.jsonl` | 受影响会话的全部回合完成记录（时长、工具调用数），用于对照失败时间点 |

---

### 附：成功/失败对照（同一用户级声明、同一窗口内的典型序列，09-19 UTC）

```
08:20:45 UserPromptSubmit 正常（角色绑定 + 状态行注入）
08:24:14 Stop        正常执行 → block（CONTRACT_REJECTED，模型补正后续行）
08:29:54 Stop        失败（309ms，无脚本痕迹）→ 回合静默结束
```
