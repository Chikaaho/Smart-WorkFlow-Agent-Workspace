# 回执 02 提交附录：提交 SHA 与远端回读

日期：2026-09-30；角色：执行（Executor）。本附录记录补证回执 02 批次的提交身份与远端包含性（提交后回读）。

| 仓库 | 分支 | 本批次提交 | 说明 | 远端回读（`git ls-remote`） | 一致 |
|---|---|---|---|---|---|
| `Smart-WorkFlow-Agent-Workspace`（workspace） | `develop-sw` | `277d955` | Owner 0.1.3 裁决机械传播（knowledge 两入口/Server 清单指针/memory/todo/审查记录与裁决文档） | `277d955b7daecdb7ef4da68ebf204e7da9df9141` | ✅ |
| 同上 | `develop-sw` | `82104da` | 补证回执 02 与证据包 + knowledge/memory/todo 下一动作同步 | `82104da76d5227e20d19cc93921748bc75ac8515` | ✅ |
| `Smart-WorkFlow-aPaaS-server` | `develop` | `e6b44ae` | 功能清单同步（审查01 状态 + 0.1.3 Owner 完成裁决） | `e6b44ae2f82227a1787a408db201df12af79bef9` | ✅ |
| 同上 | `develop` | `5f9e066` | **补证修复批次**：结算冻结语义、停用边界与幂等前移、非法声明拒绝 + 7 个用例（全量门禁 1654/0/0/0 四段 exit 0） | `5f9e066190707c80ad099f7f2ddd3f234716164e` | ✅ |
| 同上 | `develop` | `9efe451` | 功能清单同步（补证回执 02 状态 + 提交身份） | `9efe4519fafbad1b5d43b19817537b15e1b9b045` | ✅ |
| `Smart-WorkFlow-aPaaS-Web` | `develop` | `19e1c47`（本轮无改动） | 补证期间 Web 无代码变更；四门与界面验收均运行于该提交 | `19e1c472ad8b8fbfd5939811572548d69bf8d4e7` | ✅ |

补充事实：

- Workspace 提交中的子仓指针：`Smart-WorkFlow-aPaaS-server` → `9efe451`（与 Server `origin/develop` 一致）、`Smart-WorkFlow-aPaaS-Web` → `19e1c47`（未变）。
- 提交范围：仅本批次文件（Server 8 个源/测试文件 + 功能清单；Workspace 回执/证据/knowledge/memory/todo）；未包含无关改动（`.zcodeignore` 等未跟踪文件未纳入）。
- 未执行：合并到发布分支、tag/Release、部署、历史改写或强制推送。
- 本附录自身的提交在提交后以同样的 `git ls-remote` 回读关联（不预填自身 SHA，遵循执行角色 §4.5 第 5 条）。
