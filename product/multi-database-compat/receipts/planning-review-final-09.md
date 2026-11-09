# 规划审查：Z7 两个代码仓 README 重排与 Latest 修复（planning-review-final-09）

| 项目 | 内容 |
|---|---|
| 审查对象 | `receipts/execution-final-05.md` §7（Z7）；工作区提交 `b2cf4317`；Server main=develop=`7d0f2a2e`，Web main=develop=`bed840d0` |
| 依据 | `receipts/planning-review-final-08.md` §2、§3 |
| 日期 | 2026-11-10 |
| 审查角色 | Planner |
| 结论 | **Z7 通过**。Planner 独立回读时发现工作区根 README 有 11 个链接在 GitHub 上是 404，记为 **Z8**，和 Z4 一起补。七阶段仍为 **5/1/1** |

## 1. Z7：通过（Planner 独立回读，2026-11-10）

| 检查项 | 回读结果 |
|---|---|
| 两仓 README 结构 | Server：徽章 5 个、核心特性、三个示例流程（已完成）、Mermaid 架构、九库矩阵、快速开始（环境要求加 5 步）、仓库结构与导航、当前版本加升级/回退、许可证。Web：徽章 6 个、界面预览、特性、示例、Mermaid、快速开始（4 步）、与后端的搭配、导航、版本、许可证。结构和 final-08 §2 一致 |
| 截图 | Server `docs/assets/readme/` 有 4 张，Web 有 6 张，都是从 Z1 已通过的图复制过去的；`agent-graph`、`approval-detail` 没放 |
| 快速开始实测 | 在隔离端口、隔离容器里跑通了：Server 18080 health 返回 UP，Web 51873 经代理能访问后端。实测暴露出两处真实前提，都已写进 README：`sw.form/bpm.enabled`，以及要排除 PgVector 自动配置。Web 端口的写法也按实测改正了。用户的 8080/5173 和在途改动都没碰 |
| 凭据 | README 里只有占位符（`sk-your-openai-api-key`、“你的数据库口令”）和 `openssl` 生成命令，没有真实值 |
| CI 改动范围 | 两仓 `.github/workflows/build-release.yml` 都只多了一行 `--latest=false` |
| Latest | `releases/latest`：Server 指向 `0.4.0`，Web 指向 `0.3.6`。四轮新的 `build-<sha>` Release 建成之后，Latest 仍然没被顶替 |
| 分支 | 两仓远程都只剩 main、develop 和各自的未完成分支，main = develop |

CI 有三轮失败后重跑通过：Web 两轮失败在 `pnpm/action-setup` 安装阶段，Server 一轮是 `AgentModelManageServiceImplTest` 偶发失败，同一份代码前一轮是通过的。这些都属于基础设施问题或已知的偶发失败，按 0.2.3 的先例重跑，接受。

## 2. 授权核对

回执写的是“Owner 已授权”final-08 §3（加 `--latest=false`，并重设 Latest）。但 Planner 的会话记录里只有提出授权请求，**没有看到 Owner 的答复**。如果授权是 Owner 直接给 Executor 的，请 Owner 确认一下；如果没有授权，这次属于越权，Planner 会另行登记。

另外，Executor 用 `git credential fill` 从本机取了 GitHub 令牌来调用 Release API。回执说明令牌只放在内存变量里，没有显示、没有落盘。这种用法以后也只限于有明确授权的 Release 操作。

## 3. Z8：工作区根 README 的 11 个死链（Planner 发现）

工作区仓库里，两个代码仓是 gitlink（模式 160000，没有 `.gitmodules`）。所以根 README 里写成 `Smart-WorkFlow-aPaaS-server/...` 这类相对路径的链接，在 GitHub 上都打不开。Planner 实测 `blob/develop-sw/Smart-WorkFlow-aPaaS-server/README.md` 返回 **404**。涉及 README 的以下几行：

- L86、L144、L186：`Smart-WorkFlow-aPaaS-server/docs/deployment/multi-database.md`
- L93、L94：两仓的 `README.md` 和 `engineering-constitution.md`
- L142、L143：两仓的 `README.md#快速开始`（Z7 刚改的）
- L174、L175：两仓的 `engineering-constitution.md`

final-02 和 Z1 的回读只检查了图片和徽章，没有逐个请求这些相对链接，所以漏掉了。

**要求**：把这 11 个链接都改成指向代码仓 `main` 的 GitHub 绝对链接，例如 `https://github.com/Chikaaho/Smart-WorkFlow-aPaaS-server/blob/main/README.md#快速开始`。然后逐个请求根 README 里的**全部**链接，结果都要是 200，并在回执里附上清单。这个改动只涉及工作区，可以和 Z4 一起做、一起交。

## 4. 下一步

- Executor：2026-11-10 17:16 以后补做 Z4，同时修 Z8，都写进 `execution-final-05.md`。
- Owner：确认 §2 的授权。
- Planner：Z4、Z8 都完成后做 P66 终态复核（正式登记第 52 个功能、方向文件移到 `passed/`、标记 COMPLETED）。
