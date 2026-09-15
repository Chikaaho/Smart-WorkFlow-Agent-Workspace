# P60 main 合并就绪性只读探索证据

> 任务入口：`search_task/v0.1.0-p60-main-merge-readiness.md`
> 采集时间：2026-09-15 14:47—14:55（本地）
> 性质：只读。未执行 commit / push / merge / rebase / tag / Release / checkout / reset / stash / worktree 清理。

## 只读保证与试算机制

- 合并试算使用 `git merge-tree --write-tree --name-only`，并把 `GIT_OBJECT_DIRECTORY`、`GIT_INDEX_FILE` 指向
  `%TEMP%/p60-mp/<repo>/` 一次性临时目录，`GIT_ALTERNATE_OBJECT_DIRECTORIES` 指向原仓对象库。
  新对象只落在临时目录，共享仓库 refs、reflog、索引与工作树均未改变。
- 探针后复核：三仓 refs / reflog 与探针前一致；三仓 `.git/objects` 5 分钟内无新增松散对象。
- R7 指纹复算复制脚本到 `%TEMP%/p60-fp/` 执行，未覆盖仓内 R7 制品。

## 文件清单

| 文件 | 内容 |
|---|---|
| `ws-refs.txt` | Workspace 远端 heads 与本地 refs |
| `ws-merge-base.txt` | Workspace merge-base、ahead/behind、完整 porcelain 状态、gitlink 记录值与嵌套 HEAD |
| `ws-commits.txt` | Workspace 未推送 19 与 main-only 22 提交列表 |
| `code-repo-commits.txt` | Server 未推送 8 / main-only 16；Web 未推送 4 / main-only 8 |
| `status-all.txt` | 三仓完整 porcelain（`-uall`）原始输出 |
| `merge-probe-workspace.txt` | Workspace 试算合并原始输出（27 冲突，退出码 1） |
| `merge-probe-server.txt` | Server 试算合并原始输出（1 冲突，退出码 1） |
| `merge-probe-web.txt` | Web 试算合并原始输出（0 冲突，退出码 0） |
| `r7-recompute-p60-run1.json` / `-run2.json` | 用仓内 R7 脚本副本复算本机当前工作树的两次输出（含 baseHead 与指纹） |
| `r7-fingerprint-verify.txt` | 记录值与各自 files 列表的自洽校验；两份 manifest 的顺序差异定位 |
| `r7-manifest-diff.txt` | 仓内 R7 manifest 与本次复算的文件级 ADDED / REMOVED / CHANGED 明细 |
| `r7-recompute-output-p60.json` | 复算脚本自身产出的 recompute 记录 |
| `generate-fingerprint-utf8-copy.ps1` | 复算所用脚本副本（在仓内版本基础上加 `[Console]::OutputEncoding=UTF8`，否则非 ASCII 路径被跳过） |

## R7 指纹复算注意事项

仓内 `generate-fingerprint.ps1` 通过 PowerShell 原生命令读取 `git ls-files`。未设置 UTF-8 输出编码时，
非 ASCII 路径会被解码破坏并被 `Test-Path` 静默跳过（Workspace 少 44 个、Server 少 1 个文件）。
本次复算的脚本副本显式设置 UTF-8，文件集合与仓内记录一致后再做差异比较。
