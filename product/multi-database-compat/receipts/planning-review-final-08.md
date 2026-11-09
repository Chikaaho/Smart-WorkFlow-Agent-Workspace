# 规划审查：Z6 代码仓 README 版本同步，及两仓 README 重排遗漏（planning-review-final-08）

| 项目 | 内容 |
|---|---|
| 审查对象 | `receipts/execution-final-05.md` §6（Z6）；工作区提交 `87e40a40`；Server `3b4f1c92`/`7d009021`，Web `9e6ba33`/`e181e25` |
| 依据 | `receipts/planning-review-final-07.md` §3、§7；`ready/direction-multi-database-compat.md` 阶段 D「README 重排」 |
| 日期 | 2026-11-09 |
| 审查角色 | Planner |
| 结论 | **Z6 通过**：版本已同步，渲染和链接都回读过。但 Owner 指出两个代码仓的 README 也应该按开源结构重排并配截图，这次漏了，**新增 Z7，阻塞终态**。另外两仓的 Latest 被 CI 自动产物顶替，需要 Owner 授权修复（§3）。七阶段仍为 **5/1/1** |

## 1. Z6：通过

- 盘点出 3 个文件、7 处过期表述，排除项也说明了理由；顺手把两仓“项目入口”里的死链改成了 GitHub 绝对链接。
- 流程是 develop → main（`--no-ff`）→ develop 对齐，全程普通推送；两仓现在 main = develop（Server `7d009021`，Web `e181e25`）。语义 tag 和 Release 资产都没动。
- 版本历史如实写了 0.3.0 被退回；Web 没有 0.2.5，0.3.1 也没有 Web tag，这些都说清楚了。
- Web 的 `vite.config.ts` 在途改动没碰。为了避开 lint-staged，Executor 改在临时工作树里提交，钩子里的检查逐项手工执行，这个处理合适。
- Executor 自己纠正了 `sleep` 重试的问题，接受。

## 2. 遗漏：两仓 README 也要重排（Z7，阻塞终态）

Owner 2026-11-09：“我前面说的 README 放截图和整理包括两个代码仓库，现在看起来是漏了。”

**根因在 Planner**：方向的「README 重排」一节把范围写成了“工作区根 README；Server 和 Web 仓库的 README 只需同步版本与链接”，把 Owner 的要求收窄了。Executor 是按方向执行的，没有过错。方向已经更正。

现在两仓 README 仍然是旧的“说明文档”结构：没有徽章、没有截图、没有架构图，也没有快速开始。final-05 §6.7 也指出，工作区 README 的“快速开始”让人去两仓 README 看启动步骤，但两仓 README 里根本没有。

### Z7 要求（Executor）

参照工作区根 README 和方向阶段 D 的编排，按各仓的定位来写，**不要把根 README 照搬过来**：

**Server README**
1. 项目名、一句话定位（后端），徽章：版本 0.4.0、许可证、Java/Spring Boot、九种数据库。
2. 首图：用 `workflow-designer.png` 或 `form-designer.png`，说明是“配合 Web 0.3.6 的界面”。
3. 核心特性：表单/流程引擎、审批意见驱动流转、Agent 图编排与工具、知识库与 RAG、IoT 规则、多数据库、渠道通知。
4. 三示例流程：A/B/C 各配一张图（`sample-a/b/c.png`）加 2—3 句话，着重写后端链路，比如 B 的告警升级、C 的智能体研判。
5. 架构图（Mermaid）：模块分层 `sw-framework`/`sw-basic`/`sw-biz`/`sw-bootstrap`，以及数据库、Redis、外部渠道。
6. 多数据库矩阵（保留 Z6 已写的内容）。
7. **快速开始**：环境要求（JDK、Maven、数据库、Redis 的版本）、克隆、配置数据源和 Redis（给 `application-local.yml` 示例，**不写真实凭据**）、`mvn` 构建、启动命令、默认端口和健康检查地址、首次登录说明。要逐项照实际 `pom.xml` 和配置文件核对，并在本机实测能启动；启动必须用隔离端口和隔离库，不能动用户的 8080 服务和 `smart_workflow_f1v4b`。
8. 仓库结构与文档导航（工程宪法、`docs/deployment/multi-database.md`、运维文档链接）。
9. 版本：只写当前版本和升级/回退要点，历史链接到工作区 `CHANGELOG.md`；Z6 写的版本历史表可以压成 3—5 行加链接。
10. 许可证与致谢。

**Web README**
1. 项目名、一句话定位（前端），徽章：版本 0.3.6、Vue 3、Vite、TypeScript、Element Plus（按 `package.json` 实际依赖写）。
2. 首图：`workspace.png`。
3. 界面预览：`form-designer.png`、`workflow-designer.png`，以及 A/B/C 三张示例图。
4. 核心特性：从界面角度写（门户和工作台、设计器、审批与意见展示、Agent 配置界面、主题）。
5. 架构图（Mermaid）：路由/模块/适配层（如 `adapters/flow-graph`）/API 层与后端的关系。
6. **快速开始**：Node 和包管理器版本、安装、配置后端代理地址（按 `vite.config.ts` 已提交的版本写，**不要读也不要引用用户的在途改动**）、`dev` 与 `build` 命令、默认访问地址；在本机实测，用隔离端口，不动用户的 5173 服务。
7. 与后端的搭配（保留 Z6 的内容）、仓库结构、版本、许可证。

**截图**
- 用 P66 Z1 已经通过的 6 张图（`workspace`、`form-designer`、`workflow-designer`、`sample-a/b/c`），**复制**进两仓各自的 `docs/assets/readme/`，不跨仓库引用图片。如果 `.gitignore` 拦住了 png，按工作区的做法加例外。
- `agent-graph.png` 和 `approval-detail.png` 仍然**不放**，和 final-03 §7 的方案 A 一致；Web 补丁修好后，三份 README 一起补图。

**提交与 CI**
- 和 Z6 一样：develop → main（`--no-ff`）→ develop 对齐，普通推送；Web 只提交 README、图片，以及有必要时的 `.gitignore`。
- **注意**：合入 main 会再触发 CI，又会生成一个 `build-<sha>` Release 并把它设成 Latest（见 §3）。所以要按 Owner 对 §3 的裁决先处理工作流，再合入 main。
- 回读：GitHub 首页渲染（徽章、图片、Mermaid）正常，所有链接 200，图片 ≤500KB。
- 同时修正工作区根 README「快速开始」第 3 步，指向两仓 README 新写的快速开始章节（锚点链接要能打开）。

回执写入 `execution-final-05.md` 的新一节（Z7）。

## 3. Latest 被 CI 自动产物顶替（需要 Owner 授权）

事实（final-05 §6.5）：两仓 main 的 CI 建 `build-<sha>` Release 时，没有带 `--latest=false`，所以现在 Server 的 Latest 是 `build-7d009021…`，Web 的 Latest 是 `build-e181e25…`。从 Latest 下载，拿到的是和正式版同名、但字节不同的制品。UAT 和 README 不受影响。

Planner 的建议：
1. **把这项并进 Z7**：两仓 `.github/workflows` 里建自动产物的 `gh release create` 加上 `--latest=false`（只改这一个参数），和 README 一起合入 main。这样 Z7 合入时就不会再顶掉 Latest。
2. **Z7 合入以后**，把 Server `0.4.0`、Web `0.3.6` 重新设为 Latest（`gh release edit <tag> --latest`）。只改 Latest 标记，不改资产、不改说明、不动 tag。

第 2 步属于修改已发布的 Release，需要 Owner 授权；第 1 步改的是两仓的 CI 配置，也一并请 Owner 确认。不授权的话，Z7 照做，但 Latest 会继续被顶替，留到以后单独处理。

## 4. 下一步

- Owner：§3 是否授权（推荐 1 和 2 一起做）。
- Executor：按 Owner 裁决做 Z7；2026-11-10 17:16 以后补做 Z4。都写进 `execution-final-05.md`。
- Planner：Z4、Z7 都完成后，回读三个 README 和两仓的 Latest，然后做 P66 终态复核。
