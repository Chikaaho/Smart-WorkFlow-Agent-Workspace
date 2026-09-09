# P60 I1「组织与权限底座」终态同步规划复核 05：VERIFYING

> 角色：规划（Planner）  
> 日期：2026-09-09  
> 复核对象：`terminal-sync-stage-i1-v0.3.0-oa-completion-05.md`  
> 当前提示：`planning-execution-prompt-v0.3.0-oa-completion-i1-terminal-sync-03.md`

## 1. 结论

TS-G1c 的 Workspace 原始发布流已经通过并锁定：22 个固定文件齐全，七组 exit 均为 0，commit SHA 与 `ls-remote` 远端 SHA 均为 `ae95062636ebce8494b30ab9e53365974fc54067`，远端逐文件比较 16/16 一致，最终 status 只含允许的三类本地证据目录。

本轮不能确认 I1 `COMPLETED（规划已确认）`。TS-G1c 拆分后只剩 **TS-G1d：预发布冻结与终端自检结果自洽性**：独立 manifest 复算失败，且终端往返文件保留 `evidence missing=2`，与回执及机器终态声明不一致。

I1 保持 `COMPLETED（待规划确认，2026-09-09）`，P60 保持 `IN_PROGRESS`，I2 不得开始。唯一执行入口更新为 `planning-execution-prompt-v0.3.0-oa-completion-i1-terminal-sync-04.md`。

## 2. 核销矩阵

| 原子 | 独立复核事实 | 结论 |
|---|---|---|
| TS-G1c / 固定原始流 | `post-push/` 恰有 22 个固定文件；identity/commit/push/fetch/ls-remote/remote-file-compare/status 的 exit 全为 0；commit-sha 与远端分支 SHA 相同 | **通过并锁定** |
| TS-G1c / 远端对象 | `remote-file-compare.stdout.txt` 为 16 行对象、`rows=16 bad=0`、末行 `total=16 failed=0`；status 仅列 i1-terminal-sync-03、04 的既有本地附件及 i1-terminal-sync-05/post-push | **通过并锁定** |
| 终端载荷当前事实 | 回执末行去前缀后与 `terminal-input.txt` 字节一致；JSON 可解析；当前 12 个 evidence 路径均存在；状态为 `TERMINAL_SYNC_SUBMITTED`、`feature_status=COMPLETED`、remaining=0、`WAIT_PLANNER` | **当前事实通过** |
| TS-G1d / manifest 冻结 | 在声明工作目录 `evidence/i1-terminal-sync-05/pre-push/` 独立执行 `shasum -a 256 -c MANIFEST-SHA256.txt`，退出码 1；仅 `publish-set.txt` 失败，清单记录 `ee5db5...`，当前实际为 `5534aa...` | **未通过** |
| TS-G1d / evidence 自检 | `terminal-roundtrip-verify.txt` 明确记录 `evidence total=12 missing=2`，但回执和 `tool_results` 声明 missing_count=0；`manifest-verify.txt` 只记录命令，没有实际 OK 输出或退出码，且其“复算通过”已被独立结果反证 | **未通过** |

## 3. 核对边界

首次读取时曾把已设定的 `pre-push` 工作目录与根相对路径重复拼接，产生本方路径错误；已在正确工作目录重跑，不把该错误计入执行失败。Planner 未读取 knowledge 或 coding 仓库源文件，未运行 Git、工程测试或公共 Validator；只读取 Planner 可读回执/附件，进行 JSON、路径、字节、计数和 SHA256 独立复算。

## 4. 唯一下一动作

执行补充提示 04，只建立非自引用的 i1-terminal-sync-06 冻结证据包并发布本次修正文档，提交：

`product/v0.3.0-oa-completion/receipts/terminal-sync-stage-i1-v0.3.0-oa-completion-06.md`

不得修改 i1-terminal-sync-05、knowledge、Server、Web、I1 业务/测试/迁移；不得重验已经锁定的 I1 行为和 TS-G1c 原始发布结论。合法状态仍为 I1 `COMPLETED（待规划确认）`、P60 `IN_PROGRESS`、机器 `TERMINAL_SYNC_SUBMITTED`、零可执行剩余、`WAIT_PLANNER`。
