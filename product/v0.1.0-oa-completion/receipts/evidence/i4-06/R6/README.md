# R6 最终候选 C4 与机械收尾（iteration-06）

- **原子ID**：`R6-final-package-terminal`
- **原始位置**：`candidate.txt`（C4）、`gate-web-four-gates.txt` 与四份原始日志（`gate-web-{lint,typecheck,test,build}.log`）、`manifest.sha256`、`manifest-files.txt`、`manifest-verify.txt`、`assert-validator.txt`、`path-validator.txt`、`terminal-validator.txt`。
- **实际结果**：C4 = server HEAD `c18d074…` + web HEAD `192e064…` + 本轮唯一代码改动 `MobileWorkspace.vue` worktree SHA-256（`2cd73695…`）；Web 四门全部 exit 0（lint / typecheck / test 1183 passed+3 skipped / build），Server 无实现变化不重跑（沿用验收 05 锁定的 523/0）；manifest 工具清单回读 **OK=计数、BAD=0**（实际数字见 `manifest-verify.txt`，workspace root 相对路径、GNU `*` 标记、排除 manifest 三件套自身、**包含本轮回执 06 与全部最终证据**）；terminal 仅指向最终断言（`R5/asserts-final.json` failed=0）且 18 条路径全部存在；`validate-terminal.ps1` exit 0。
- **边界**：R1—R4 不重验；本轮涉及目录/文件的清理仅限本会话临时脚本与监听进程，证据与业务数据保留只读；凭据不入包（登录令牌在 /tmp，包内仅无密文常量）。
