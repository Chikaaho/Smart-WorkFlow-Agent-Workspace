# 管理记录：ZCode Stop 入口守卫与兜底派发（2026-11-03）

## 现象

2026-11-03 22:16:12、22:40:24（本地）执行会话 `sess_93390488` 两次回合结束未裁决：

- 宿主日志 `hook.run.failed`：Stop、252ms / 196ms、source `config.Stop.0.0`。
- `runtime/zcode/invocations.log` 没有 `launcher-invoked`。
- `runtime/zcode/audit.jsonl` 没有对应 Stop 记录。

回合以 `in_progress` 或非契约终态收尾后被放行，Owner 需要手工输入“继续”。

## 原因

1. **非受治理工作区假失败**：用户级 Windows Stop 声明直接 `-File ${ZCODE_PROJECT_DIR}/.codex/governance/zcode-stop-launcher.ps1`，没有 UserPromptSubmit 那样的 `if exist` 守卫。近两天 10 条 `hook.run.failed` 中 8 条来自 `C:\Users\hjxch\.zcode\workspace\...` 的临时/草稿会话。同命令复现：172ms、exit≠0、零回执。291 次成功 Stop 载荷全部来自受治理工作区。
2. **宿主启动早期失败**：受治理工作区内 3 条（11-02 16:39:36Z 188ms、11-03 14:16:12Z 252ms、22:40:24 196ms）与 `tickets/zcode-stop-hook-20260920/ticket-report.md` 记录的 ZCode 宿主缺陷签名一致：派发后 170–309ms 在脚本首语句前死亡，日志没有 stderr/退出码，集中在长时/高负载窗口。

## 变更

- `.codex/governance/zcode-hooks-declaration.json`：Windows Stop 两个入口改用 `-Command` + `Test-Path` 守卫；第二个入口追加 `-Fallback`。
- `.codex/governance/zcode-stop-launcher.ps1`：按 `session + turnId + 消息哈希 + toolCallCount + stop_hook_active` 生成去重键并写入 `decisions.log`；同一回合的兜底入口只写 `deduped`，不重复调用 gate。
- 机器级 `~/.zcode/cli/config.json` 已由安装器同步（备份 `config.json.bak-20261103224835`）。

## 验证

- `install-zcode-hooks.ps1 -Check`：`in-sync`。
- `hook-selfcheck.ps1`：`drift=false`、`command_ok=true`、`audit.records=585`；`host_hook_failures.recent_count=10`，`live=false` 仍受 24h 窗口内的真实宿主失败影响。
- `test-zcode-stop-launcher.ps1`：PASS（守卫静默、同回合兜底去重、新 turnId 重新调用 gate）。
- `test-stop-gate.ps1`：46/46 PASS。
- `test-zcode-gate.py`：35 项中 19 failures / 7 errors，均为 Windows 下 POSIX 入口 `select()` 的 `WSAStartup` 环境问题，与本次改动无关；Windows 入口由 `test-stop-gate.ps1` 覆盖。

## 残余风险

同一回合两次派发都启动失败时，兜底也无法裁决；仍需下次提示词纠偏或宿主外 Supervisor。`hook.run.failed` 缺少 stderr/退出码的问题仍待 ZCode 侧修复（2026-09-20 工单）。
