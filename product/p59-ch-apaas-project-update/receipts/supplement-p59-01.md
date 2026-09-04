# P59 首轮审查补充回执（supplement-p59-01）

日期：2026-09-04。角色：执行（Executor）。等级：L。
输入：`receipts/planning-review-p59-01.md`。性质：**按缺口逐项补证与修复，自验通过，待规划验收**。
原回执 `completion-p59-ch-apaas-project-update.md` 保留；本回执为分项实际状态与新证据。

---

## 0. 审查裁决承接矩阵

| ID | 裁决 | 本轮处理 | 状态 |
|---|---|---|---|
| A1 | 待补证 | 附实际差异与链接核对 | ✅ 已补证 |
| B1 | 待补证 | 附三仓回读原始输出 | ✅ 已补证 |
| C1 | 待补证 | 附 222 文件完整清单、归属依据、双向保留核对 | ✅ 已补证 |
| D1 | 未通过 | **修复** Server main Flyway 测试与迁移集合不一致，完整构建通过 | ✅ 已修复（提交 096f707） |
| D2 | 待补证 | 附两份工作流副本、校验；修正 jar 定位缺陷 | ✅ 已补证+修正（提交 946c0fe） |
| D3 | 未完成 | 本地证据齐备，列精确待发布范围，仍待 Owner 授权 | ⏸ 待授权（如实保留） |
| E1 | PASSED 锁定 | 不重复处理 | ✅ 锁定 |
| E2 | 待补范围证据 | 附本轮全部候选提交与变更集合 | ✅ 已补证 |

---

## 1. A1 项目说明——实际差异与链接核对

### 1.1 实际差异（三仓各自提交）

**工作区 develop-sw，提交 24c4be8**（`docs(project): 项目说明更新为 CH-aPaaS...`），3 文件 22+/22−：

- `AGENTS.md`：标题 `# Smart-WorkFlow · Codex 入口` → `# CH-aPaaS · Codex 入口`（仅名称，正文不变）
- `README.md`：标题/示例分支定位/产品描述（"低代码 OA 与 AI Agent 平台"→"低代码 PaaS 与 AI Agent 平台"）/三个仓库表/运行关系图/clone 命令/实例边界，共 14 处名称与引用
- `project.md`：入口声明、项目名称 CH-aPaaS、一句话目标 PaaS、仓储关系三行（Agent-Workspace/sPaaS-server/aPaaS-Web）、实例生命周期

**后端 Smart-WorkFlow-Server develop，提交 fca198d**（`docs(readme): 项目名称更新为 CH-aPaaS...`），README 3+/3−：标题 `# Smart-WorkFlow-sPaaS-server`、首段产品名 CH-aPaaS、配套入口 `Smart-WorkFlow-aPaaS-Web`（链接保留本地路径 `../Smart-WorkFlow-Web/README.md`）。

**前端 Smart-WorkFlow-Web develop，提交 db297d0**（`docs(readme): 项目名称更新为 CH-aPaaS...`），README 3+/3−：标题 `# Smart-WorkFlow-aPaaS-Web`、首段 CH-aPaaS、配套入口 `Smart-WorkFlow-sPaaS-server`（链接保留本地路径）。

### 1.2 上下行链接核对（本地文件系统实际回读）

| 检查 | 结果 |
|---|---|
| project.md 仓储表三行新名与 README 仓库表三行一致 | 一致 ✓ |
| README 三处 `git clone` 地址 = 方向 B 目标地址 | 逐字一致 ✓ |
| README 配套入口相对链接存在（`Smart-WorkFlow-Server/README.md`、`Smart-WorkFlow-Web/README.md` 均存在） | 存在 ✓ |
| 本地目录名保留（`Smart-WorkFlow-Server/`、`Smart-WorkFlow-Web/` 未改名），历史可追溯 | 保留 ✓ |
| 范围核对：仅名称/类型/仓库引用，未触碰工程规则、目录结构、包名 | ✓ |
| 旧名残留检查：三仓说明文件 grep "Smart-WorkFlow-Knowledge"/"低代码 OA 与 AI Agent 平台" 无命中 | 无残留 ✓ |

## 2. B1 仓库地址——回读原始输出（脱敏：无密钥，均为公开仓库地址）

### 2.1 工作区（develop-sw）

```
$ git remote -v            # 修改后回读
origin  git@github.com:Chikaaho/Smart-WorkFlow-Agent-Workspace.git (fetch)
origin  git@github.com:Chikaaho/Smart-WorkFlow-Agent-Workspace.git (push)

$ git branch -vv
* develop-sw  7701125 [origin/develop-sw: ahead 3] docs(p59): ...执行完成回执

$ git ls-remote origin
cece784...  HEAD
0712bb9...  refs/heads/develop-sw
cece784...  refs/heads/main
```

### 2.2 后端（develop）

```
$ git remote -v
origin  git@github.com:Chikaaho/Smart-WorkFlow-sPaaS-server.git (fetch)
origin  git@github.com:Chikaaho/Smart-WorkFlow-sPaaS-server.git (push)

$ git branch -vv
* develop  fca198d [origin/develop: ahead 1] docs(readme): 项目名称更新为 CH-aPaaS...

$ git ls-remote origin
e0e899d...  HEAD / refs/heads/main
11612df...  refs/heads/develop
（另有既有 tags v0.0.1、v0.0.1-beta）
```

### 2.3 前端（develop）

```
$ git remote -v
origin  git@github.com:Chikaaho/Smart-WorkFlow-aPaaS-Web.git (fetch)
origin  git@github.com:Chikaaho/Smart-WorkFlow-aPaaS-Web.git (push)

$ git branch -vv
* develop  db297d0 [origin/develop: ahead 1] docs(readme): 项目名称更新为 CH-aPaaS...

$ git ls-remote origin
9a22a66...  HEAD / refs/heads/main
4b62076...  refs/heads/develop
（另有既有 tags v0.0.1、v0.0.1-beta）
```

三仓 origin 均与方向 B 目标地址逐字一致；远端可达且分支（main/develop(-sw)）与本地一致；本地分支对 origin 的跟踪关系完整。

## 3. C1 main 修复——完整变更清单、归属与双向保留核对

### 3.1 修复提交与对照基点

- 修复前：`cece784`（Merge branch 'develop-sw'，parents=aa9da33+26ec7b3）
- 修复提交：**29f7033**（`fix(workspace): 移除误并入 main 的 develop-sw 实例内容，恢复 Engine 通用定位`）
- 保留点（正确分支）：develop-sw = 0712bb9（此后新增 24c4be8/75cbb3b/7701125 属本轮，不在此核对范围）

### 3.2 完整文件变化清单（附件 `attachments/c1-main-repair-filelist.txt`，222 行）

- **211 删除**：`docs/ops/production-ops.md`（实例运维手册）；`knowledge/features/p45/p52/p56/p57`（4 实例业务功能状态）；`knowledge/history/current-status-through-*p45/p52/p56/p57*`（4 实例历史快照）；`knowledge/session-handoff.md`（实例会话交接）；`product/p45-login-security/`（106）、`product/p52-form-workbench/`（49）、`product/p56-form-grid-layout/`（15）、`product/p57-bpm-node-extension/`（22）、`product/p58-workflow-node-capabilities/`（2，2026-09-04 当天回执）；`project.md`（实例项目说明）；`search_task/`、`search_fallback/` 下 p45/p57 实例探索（6）
- **11 修改**：`README.md`、`knowledge/current-status.md`、`knowledge/development-workflow.md`、`knowledge/history/README.md`、`knowledge/known-issues.md`、`memory/README.md`、`memory/features.md`、`memory/handoff.md`、`memory/issues.md`、`memory/state.md`、`todo/requirement-pool.md` —— 全部恢复为 aa9da33（Engine 通用初始）版本

### 3.3 归属依据与异常项说明

- **归属判定**：上述内容全部由 cece784 从 develop-sw 合入（原 aa9da33 中不存在），且均为 Smart-WorkFlow/OA 实例业务内容。P51 裁决（planning-final-reconciliation-p51-main-terminal-authority-03.md）已确认 main 的 Engine 演进合法——本轮删除集**不含**任何 P51 Engine 提交，main 上 2b2ca2d…23e4f74、505fc83、aa9da33 等提交与文件全部原样保留。
- **无异常项**：删除集 100% 属实例内容；修改集 100% 为恢复 aa9da33 通用版本；无任何在 aa9da33 中不存在却被新增进 main 的文件。

### 3.4 双向保留核对（附件 `attachments/c1-main-retained-vs-aa9da33.txt`，25 项）

**（a）移出内容在正确分支（develop-sw）完整保留**（实际回读计数）：

```
p45-login-security:  develop-sw=106 文件   main=0
p52-form-workbench:  develop-sw=49 文件    main=0
p56-form-grid-layout:develop-sw=15 文件    main=0
p57-bpm-node-extension:develop-sw=22 文件  main=0
p58-workflow-node-capabilities:develop-sw=85 文件 main=0
project.md、knowledge/session-handoff.md 等均在 develop-sw
```

**（b）合法 Engine/治理内容在 main 保留差异**（修复后 main 相对 aa9da33，25 项）：

- `roles/executor.md`、`roles/planner.md`（M，26ec7b3 补充提示生成规范——治理更新，保留）
- `product/p51-agent-coding-engine-decoupling/` 5 文件（ready/direction + 4 receipts，含 P51 终态裁决 03，方向文件引为归属依据）
- `product/governance/supplemental-execution-prompt-template.md`（26ec7b3 治理模板，roles 引用）
- `search_task/`、`search_fallback/` 下 p51 对账探索 16 文件（P51 治理对账材料，与上述回执配套）

**结论**：变更集合（删除 211 + 修改 11）与归属集合逐项吻合；无错删、无遗漏合法内容。

## 4. D1 后端 main 构建阻塞——按真实迁移集合修复

### 4.1 失败原因核实（第一轮实际输出）

```
FlywayFullChainH2Test.migrateFullChain:79 —— 全链迁移计数应为 44（41 基线 + V42 + V43 + V44），实际: 46
FlywayFullChainPostgresTest.startPostgresAndMigrateFullChain:91 —— 应为 43（39 基线 + V40 + V42 + V43 + V44），实际: 45
```

### 4.2 真实迁移集合核对（main 分支 src 全 locations 枚举）

- H2 侧 8 个 classpath location **46 条唯一版本**：V1…V46（V7/V8/V9/V12/V14/V40/V41 等位于 bpm/notify/form/iot 模块目录，h2/pg 双份无冲突）
- PG 侧同 locations **45 条**（无 V41 `form_definition_json_to_clob`——form/postgresql 仅 V7/V12，与既有断言语义一致）
- **V45 系统 CRUD 按钮权限**（bef8506 引入 main）、**V46 lowcode 命名清理**（cd79856 引入 main）均在 main 的 src 中，测试断言却停留 V44 时代 → 计数滞后而非迁移缺陷

### 4.3 修复差异（提交 096f707，2 文件）

`FlywayFullChainH2Test.java`：44→46（全链 2 处）、V32→链尾 12→14、V33→链尾 11→13、V36→链尾 8→10、终点版本 V44→V46；类注释 35→46。
`FlywayFullChainPostgresTest.java`：43→45（全链 2 处 + legacy 既有库 43→45）、V32→链尾 11→13（PG 无 V41 语义保留）；类注释 35→45。
未删除/修改任何迁移文件，未跳过断言，未改迁移逻辑；断言语义与迁移集合逐条对齐。

### 4.4 该 main 候选提交的完整构建结果（工程宪法 L 门，实际输出）

```
$ MAVEN_OPTS="-Xmx2g" mvn -B -ntp install
[INFO] BUILD SUCCESS
[INFO] Total time:  56.875 s
全模块 surefire：Tests=957, Failures=0, Errors=0, Skipped=0（135 份报告）
FlywayFullChainH2Test: Tests run: 15, Failures: 0, Errors: 0, Skipped: 0
FlywayFullChainPostgresTest: Tests run: 12, Failures: 0, Errors: 0, Skipped: 0
产物：sw-bootstrap/target/bootstrap.jar（finalName=bootstrap，89e404e 配置）
```

> 注：main 全模块 957 为 main 快照值；develop 基线（1035/1110 等）属 develop 分支，二者不混用。

## 5. D2 工作流与提交关联

### 5.1 配置副本（附件）

- `attachments/d2-server-main-build-release.yml`（源提交 142f279 + 946c0fe，Server main）
- `attachments/d2-web-main-build-release.yml`（源提交 d1ad771，Web main）
- 两份均通过 Ruby YAML 解析校验

### 5.2 触发/构建/发布关联

| 要素 | Server main | Web main |
|---|---|---|
| 触发分支 | `push: branches: [main]` | 同左 |
| 构建提交 | 触发时 checkout 的 main HEAD（GITHUB_SHA） | 同左 |
| tag | `build-<sha8>`（与构建提交一一对应，重跑删除重建同名 tag，不覆盖其他提交发行物） | 同左 |
| 产物 | `sw-bootstrap/target/bootstrap.jar`（修正后定位：`ls target/*.jar | grep -v '\.original$'`，实测输出 bootstrap.jar） | `dist-<sha8>.zip`（dist 由 vite build 产出，实测 2.9M） |
| Release 名 | `CH-aPaaS-Server <pom版本> build <sha8>` | `CH-aPaaS-Web <pkg版本> build <sha8>` |
| 构建失败 | 后续步不执行，不产生 Release（满足方向约束） | 同左 |

### 5.3 实测证据（本轮重新执行）

- **前端 main（9a22a66+d1ad771）**：`NODE_OPTIONS="--max-old-space-size=2048" pnpm typecheck && pnpm lint && pnpm test && pnpm build` → exit 0，Test Files 108 passed|1 skipped，Tests 1055 passed|3 skipped，dist 2.9M
- **后端 main（e0e899d+D1 修复）**：见 §4.4 BUILD SUCCESS
- **修正说明**：`946c0fe ci(server): 修正可执行 jar 定位以匹配 main 的 finalName=bootstrap 产物` —— 首版 workflow 用 `sw-bootstrap-*.jar` 匹配不到 main 的 `bootstrap.jar`，已修正为通用定位并实测命中

### 5.4 删除重建行为

`gh release view "${TAG}" && gh release delete --yes || true; gh release create ...`：仅对**同一构建提交**的 tag 删除重建（幂等重跑），不同提交不同 tag，不覆盖其他提交发行物。该行为在本地工作流文件层面完成审查，**未在远端触发**（无推送，无真实 Release 产生）。

## 6. E2 完整跨仓变更范围（本轮全部候选提交）

| 仓库/分支 | 提交 | 变更集合 |
|---|---|---|
| 工作区 develop-sw | 24c4be8（说明）、75cbb3b（探索回执）、7701125（P59 回执） | 文档/说明，无代码 |
| 工作区 main | 29f7033 | 211 删除 + 11 恢复（§3） |
| Server develop | fca198d | README 文档 |
| Server main | 142f279（workflow）、096f707（Flyway 测试计数）、946c0fe（workflow jar 定位） | workflow + 2 测试文件，无业务代码 |
| Web develop | db297d0 | README 文档 |
| Web main | d1ad771 | workflow |

无场景实施、无业务功能代码变更、无迁移文件变更、无数据变更。

## 7. D3 真实发版（未完成，待授权——如实保留）

本地证据已齐。待发布提交与相对远端差异：

- **工作区 main**：29f7033（相对 origin/main=cece784，1 提交）——推送与启用由 Owner 授权
- **Server main**：142f279+096f707+946c0fe（相对 origin/main=e0e899d，3 提交）
- **Web main**：d1ad771（相对 origin/main=9a22a66，1 提交）
- **三仓 develop**：24c4be8/fca198d/db297d0（A 项说明，相对各自 origin/develop，各 1 提交）

授权执行后补真实 main 事件、工作流结果、Release/目标提交与产物关联；两仓分别给出结果。**现阶段未推送、未启用、未触发任何远端动作**。

## 8. E1 三个示例（PASSED 锁定）

不重新处理。`todo/ch-apaas-project-update.md` 3.1/3.2/3.3 原文未经任何修改。

---

## 9. 自验结论与未完成项

- D1 修复完成并全模块 BUILD SUCCESS（957/0/0/0，135 份报告）；A1/B1/C1/D2/E2 证据齐备
- 未完成：D3 真实发版（等待 Owner 授权，非执行可自行推进项）；三仓 develop/main 本地提交均未推送
- 未新增业务功能；正式功能数 41 及既有验证基线不变；未触碰 memory/、todo/ 中 Planner 侧未提交内容

**自验通过（分项：A1/B1/C1/D1/D2 补证+修复完成，D3 待授权），待规划验收。**