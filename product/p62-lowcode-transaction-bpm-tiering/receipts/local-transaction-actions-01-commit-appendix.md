# 回执提交后附录：正文提交与远端包含性（local-transaction-actions-01）

日期：2026-09-30；角色：执行（Executor）。本附录只记录提交与推送后的回读事实，不改变正文结论。

## 提交与推送

| 仓库 / 分支 | 提交范围 | 主体提交 | 远端回读（`git ls-remote`） | 包含性 |
|---|---|---|---|---|
| `Smart-WorkFlow-Agent-Workspace` / `develop-sw` | `0a036d3..5e6cedd` | `5e6cedd`（回执正文、证据包、终态状态同步、子仓指针） | `refs/heads/develop-sw` = `5e6cedd8a9dc50627d16fec34c2579bdb779735f` | 远端 = 本地 HEAD（一致） |
| `Smart-WorkFlow-aPaaS-server` / `develop` | `47e5f6a..eca1b52`（6 提交：`e93824b`、`24e691e`、`b009ef9`、`3a0c436`、`dbf79a7`、`eca1b52`） | `eca1b52`（C1 整量写入闸门、菜单种子 id 修正、T02 证据、链测试断言、功能清单焦点） | `refs/heads/develop` = `eca1b524a7a4765cbdb37e1689ce9fa0f4c28669` | 远端 = 本地 HEAD（一致） |
| `Smart-WorkFlow-aPaaS-Web` / `develop` | `77fd92c..19e1c47`（1 提交） | `19e1c47`（事务动作管理界面实现与修正） | `refs/heads/develop` = `19e1c472ad8b8fbfd5939811572548d69bf8d4e7` | 远端 = 本地 HEAD（一致） |

## 提交前后门禁一致性

- Server：提交内容即终局门禁实跑内容（`mvn -B test` 分段合计 **1647/0/0/0**，BUILD SUCCESS），提交后工作树干净。
- Web：`pnpm typecheck/lint/test/build` 四门在提交内容上复跑全绿（lint 0 error / 90 既有 warning；vitest **1309 passed + 3 skipped**，144 文件通过 + 1 skipped；build `✓ built`）；lint-staged（eslint --fix + prettier）自动修复后复跑结果不变。
- Workspace：仅文档、证据与子仓指针；无工程动作。

## 说明

- 本次推送为既有跟踪分支的普通推送（无合并到发布分支、无 tag/Release、无历史改写、无强推）；远端分支领先/落后与包含性以上表回读为准。
- 回执正文提交后的补充记录（本附录）按同仓库追加提交处理；正文 SHA 无需预填自身提交。
