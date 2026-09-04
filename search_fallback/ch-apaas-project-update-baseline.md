# P59 统一任务现状核实回执

日期：2026-09-04。角色：执行。委派：`search_task/ch-apaas-project-update-baseline.md`。仅探索，未修改任何配置、分支或说明。

## 1. 工作区 main 误提交范围（已证实）

- main=cece784（`Merge branch 'develop-sw'`，parents: aa9da33+26ec7b3），与 origin/main 差异 0/0 → **全部已推送**。develop-sw=0712bb9，与 origin/develop-sw 差异 0/0 → 已推送。
- main 独有提交 **19 个**；其中**代码类 7 个**（engine/governance）：
  - `2b2ca2d refactor(engine): main 通用化为 Agent Coding Engine 默认分支`（删 skel、改 .gitignore/AGENTS.md/README、knowledge 大改）
  - `2bd193e feat(engine): main 根级标准工作区与唯一项目说明入口`
  - `d3e85af fix(engine): Harness Hook 从任意根内 cwd 可定位工作区根`
  - `45f2c98 feat(engine): P51 二级收敛——运行时契约通用化与项目声明制收口`
  - `23e4f74 feat(governance): 引入 S/M/L/XL 分级执行流程`（system.md、roles 重写）
  - `505fc83 feat(governance): 闭合执行代理自动续跑门禁`（与 develop-sw `5b44220` 同主题但不完全同，patch-id 不同，差异在 settings.json/hooks.json 行数）
  - `aa9da33 merge(governance): 将执行代理门禁合并到主干`
- 另 12 个为 docs 类：README.en/md 双语、MIT LICENSE、P51 回执与阶段三收口（f738cef/a609783/f80b02c/7d59297/7cf6361 等）。
- **两分支现有实质差异很小**：develop-sw 已通过 5b44220 引入等价 `.codex/governance/` 全套；`git diff --stat develop-sw main -- .codex .claude system.md roles` 仅 .claude/plans/async-stirring-music.md（main 删除）+ AGENTS.md 文本差异（main=「Agent Coding Engine · Codex 入口」通用版，develop-sw=「Smart-WorkFlow · Codex 入口」实例版）。
- main 已作引擎通用化清理：knowledge/ 仅 23 文件（通用初始库），develop-sw 86 文件（实例完整库）；main 合并的是较早 develop-sw（26ec7b3），develop-sw 现有 2 个新提交（P58 终态、知识库整理）未回 main。

**归属待裁决**：Owner 所述「代码相关改动提交到 main」最可能即上述 7 个 engine/governance 提交；保留/回退策略（留 main 并合并回 develop-sw，或改写历史）需 Planner 裁决，改写历史另需 Owner 明确授权。

## 2. 远端配置（已证实，三仓本地均仍为旧地址）

| 仓库 | 本地 origin（现状） | 需求文件新地址 |
|---|---|---|
| 工作区 | `git@github.com:Chikaaho/Smart-WorkFlow-Knowledge.git` | `…/Smart-WorkFlow-Agent-Workspace.git` |
| 后端 | `git@github.com:Chikaaho/Smart-WorkFlow-Server.git` | `…/Smart-WorkFlow-sPaaS-server.git` |
| 前端 | `git@github.com:Chikaaho/Smart-WorkFlow-Web.git` | `…/Smart-WorkFlow-aPaaS-Web.git` |

- 当前工作分支：工作区 develop-sw、后端 develop、前端 develop；三仓本地均有 main 分支，origin/main 与 origin/develop(-sw) 均存在。
- 后端 main 与 develop 分叉（main 独有 10、develop 独有 12，merge-base cd79856，main 为 develop 定期合入）；前端同（main 独有 2、develop 独有 9，merge-base c24ba3b）。远端改址后的分支跟踪与推送动作属任务范围，推送需授权。

## 3. 项目说明入口（已证实）

- 入口：工作区根 `project.md`（唯一项目说明入口：身份「Smart-WorkFlow / 低代码 OA 与 AI Agent 平台」、仓储关系表列 Knowledge/Server/Web、实例分支 develop-sw）；根 `README.md`、`AGENTS.md`（实例版）；后端 `Smart-WorkFlow-Server/README.md`、前端 `Smart-WorkFlow-Web/README.md`（互指配套入口，均无硬编码 URL，grep 无 github.com 命中）。
- 需改：名称 Smart-WorkFlow→CH-aPaaS、类型 OA→PaaS、project.md 仓储关系三行、AGENTS.md 实例名、三仓 README 项目名表述。

## 4. 编译发版配置（已证实缺失）

- 三仓均无 `.github/`（含 workflows）；工作区根无 Dockerfile/Makefile/Jenkinsfile/CI 配置。**自动编译发版配置完全缺失，需新建**。
- 版本与产物约定：后端 pom.xml `1.0.0-SNAPSHOT`；前端 package.json `0.0.0`；`knowledge/evidence/v0.0.1-beta-release-readiness/` 为历史发布准备日志，非当前正式约定；knowledge 无版本/发版规则文件；两仓工程宪法无 git/发版条款。
- 构建命令依据（约发布用）：`project.md` §3——后端 `MAVEN_OPTS=-Xmx2g mvn install`；前端 `NODE_OPTIONS=--max-old-space-size=2048 pnpm typecheck && lint && test && build`；前后端编译互斥。

## 5. 示例流程记录（未证实）

- knowledge/product/docs 未检索到三示例（灾备演练/MQTT、校园出入异常 P0/P1、MES 温度阈值）对应记录；无场景/案例目录。记录位置需方向指定（建议新建知识库条目或产品方案文档）。

## 待确认（供 Planner 方向）

1. main 误提交修复策略（保留并同步 / 回退 / 改写历史）；2. 新远端替换范围（仅 remote URL 或含分支跟踪/推送）；3. 发版配置形态（GitHub Actions？触发条件、构建产物、发布目标）；4. 示例流程记录位置与格式。