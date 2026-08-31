# 执行回执 · P51 Agent Coding Engine 解耦

> 功能目录：`product/p51-agent-coding-engine-decoupling/`
> 方向：`ready/direction-p51-agent-coding-engine-decoupling.md`
> 执行角色：执行（Executor）
> 日期：2026-08-31
> 回执性质：功能级 completion receipt · 自验通过 · 待规划验收

## 1. 功能名称与内部 Step 概要

方向 P51：将根知识/治理仓调整为通用 Agent Coding Engine，`main` 作为通用默认分支，`develop-sw` 保留 Smart-WorkFlow/OA 示例实例。

内部 Step 概要：

| Step | 内容 | 状态 |
|---|---|---|
| S1 | 基线核对与回滚点建立 | ✅ |
| S2 | 创建 `develop-sw` 实例分支（完整 OA 实例） | ✅ |
| S3 | `main` 通用化改造（Engine README / Harness 入口 / 骨架 / 实例剥离） | ✅ |
| S4 | `develop-sw` 示例分支补说明（示例定位 / project.md / P51 记录） | ✅ |
| S5 | 隔离行为验证（空白 Engine / OA 示例 / 两个无关项目 / 切换/移除/回滚） | ✅ |
| S6 | 完成回执 | ✅ |

## 2. 实际读取的文件

| 文件 | 目的 |
|---|---|
| 方向文档 `ready/direction-p51-agent-coding-engine-decoupling.md` | 任务输入 |
| `system.md`（§0.2/§0.4/§0.8/§3/§11） | 角色边界与工作区规则 |
| `roles/executor.md`（全部） | 执行角色边界 |
| `README.md`、`AGENTS.md`、`CLAUDE.md`（原始 OA 版） | 入口改造基线 |
| `.claude/settings.json`、`.codex/hooks.json`、`.claude/hooks/*.sh`、`.codex/hooks/*.sh` | Harness Hook 路径 |
| `.gitignore` | 子仓/系统文件忽略 |
| `.codex/governance/terminal-contract.json` + validate/test 脚本 | 终态契约与自检 |
| `memory/state.md`、`memory/handoff.md`、`todo/requirement-pool.md` | 工作树 dirty（规划侧状态） |
| 探索回执 `search_fallback/p51-branch-decoupling-exploration.md`、探索任务 `search_task/p51-branch-decoupling-exploration.md` | 前置探索 |
| `knowledge/` 顶层文件清单、`product/` 目录清单、`docs/governance/claude-document-migration-2026-08-18.md` | 实例内容识别 |

## 3. 实际修改的文件

**main 分支（2b2ca2d）**：

| 类型 | 文件 |
|---|---|
| 重写 | `README.md`（Engine 定位 + 示例指引） |
| 重写 | `AGENTS.md`（通用入口，相对路径） |
| 改写 | `.claude/settings.json`（Hook 相对路径） |
| 改写 | `.codex/hooks.json`（Hook 相对路径） |
| 改写 | `.gitignore`（移除 OA 仓库名忽略，新增工程产物/示例仓） |
| 新增 | `project.example.md`（项目说明入口模板） |
| 新增 | `skel/README.md` + `skel/{memory,knowledge,product,todo,search_task,search_fallback}/README.md`（目录骨架） |
| 删除 | `memory/`、`knowledge/`、`product/`、`todo/`、`search_task/`、`search_fallback/`、`docs/`、`.claude/plans/`（OA 实例内容，共 812 文件） |

**develop-sw 分支（3cbd550 → 5c64ae8）**：

| 类型 | 文件 |
|---|---|
| 新增（提交1） | `memory/handoff.md`、`memory/state.md`、`todo/requirement-pool.md`（P51 活动方向状态） |
| 改写（提交2） | `README.md`（示例分支定位 + Engine 关系） |
| 新增（提交2） | `project.md`（OA 实例项目说明）、`product/p51-agent-coding-engine-decoupling/ready/direction-*.md`、`search_task/`+`search_fallback/` P51 记录 |
| 新增（提交3） | `product/p51-agent-coding-engine-decoupling/receipts/completion-*.md`（本回执） |

## 4. 每个文件的修改摘要

- **README.md（main）**：从"Smart-WorkFlow 产品手册"改为"Agent Coding Engine 通用定位 + 接入说明 + 指向 develop-sw 示例分支"。
- **AGENTS.md（main）**：标题改为 Engine，去掉产品名，入口路径相对化，增加 project.md 声明仓关系。
- **.claude/settings.json / .codex/hooks.json（main）**：Hook 命令由绝对路径 `/usr/local/projects/Smart-WorkFlow/.claude/hooks/...` 改为相对路径 `sh .claude/hooks/...`。
- **.gitignore（main）**：移除对 `Smart-WorkFlow-Server/`、`Smart-WorkFlow-Web/` 的硬编码忽略，改为通用工程产物 + 注释化的示例仓忽略。
- **project.example.md / skel/**：新增最小项目接入模板与工作区目录骨架。
- **develop-sw**：补示例定位、项目说明、P51 方向/探索/回执记录。

## 5. 实际执行的命令

| 命令 | 目的 |
|---|---|
| `git branch -vv` / `git remote -v` / `git merge-base` | 基线核对 |
| `git branch develop-sw main` | 创建实例分支 |
| `git checkout develop-sw` / `git add` / `git commit` | develop-sw 提交 |
| `git rm -r memory knowledge product todo search_task search_fallback docs .claude/plans` | main 剥离实例 |
| `git add skel/ project.example.md README.md AGENTS.md .claude/settings.json .codex/hooks.json .gitignore` + `git commit` | main 通用化提交 |
| `git clone -b main …/engine-blank`、`git clone -b develop-sw …/oa-example` | 隔离验证 |
| `sh .codex/governance/test-terminal-contract.sh` | 契约自检 |
| `echo {json} \| sh .codex/governance/validate-terminal.sh` | Validator 行为 |

## 6. 命令输出摘要

- 契约自检：`terminal-governance cases=35 passed=35 failed=0`（EXIT=0）
- Validator 合法终态：EXIT=0；非法组合：`terminal: feature_status: incompatible with state TERMINAL_SYNC_SUBMITTED`（EXIT=1）
- 隔离验证：engine-blank 契约自检通过；oa-example 含 `knowledge/current-status.md` + 454 receipts；project-alpha 写入后 beta/blank 无交叉；移除 alpha 不影响 beta/blank；main/develop-sw 切换后内容独立。

## 7. 与原方案的偏差

| 项 | 方向原描述 | 实际执行 | 说明 |
|---|---|---|---|
| develop-sw 起点 | `a86cbbd` | 当前 `main` HEAD `93ce28c` | `a86cbbd` 不在当前 main 链（`merge-base` 为 `9b97ddc`，main 已新增 9 提交 till `93ce28c`）；起点取最新可分叉点保留最新实例状态 |
| system.md/roles 通用化改写 | «留在 main 并通用化核对» | 保留在 main 但未改写 | 属管理员维护范围（§0.8），执行角色不越权；作为边界项上报 |

## 8. 遇到的问题

1. **工作树 dirty（3 env 文件）**：memory/state.md、handoff.md、todo/requirement-pool.md 有规划侧未提交修改（P51 已登记为活动方向）。将其归属 develop-sw 并提交（`3cbd550`），既保留实例状态又避免 main 污染。
2. **a86cbbd 不在 main 链**：探索快照过时。重新核对后以当前 main HEAD 为分叉点。
3. **gitignore 复现子仓 untracked**：移除 OA 仓库名忽略后 `Smart-WorkFlow-Server/`、`Smart-WorkFlow-Web/` 变为 untracked；以"示例仓忽略"注释保留在 gitignore，避免 main 跟踪。
4. **system.md/roles 权限边界**：见 §10 风险与边界报告。

## 9. 未完成内容

- **system.md、roles/ 的 Smart-WorkFlow 事实清理**：未执行（属管理员维护范围）。当前 main 上 `system.md` 含 18 处、`roles/*.md` 含 17 处 Smart-WorkFlow 引用（主要用于"本工作区/当前代码仓"指代），并含 3 处 `/usr/local/projects/Smart-WorkFlow` 绝对路径。见 §10 边界报告。
- **远端发布**：未授权 / 未执行（方向 §二明确远端 push 不在默认授权内）。

## 10. 风险和注意事项

### 10.1 权限边界报告（关键）

方向 §3 规定 `system.md`、`roles/` 保留在 main 并"通用化核对"，§九.3 要求 main 完整发布内容不存在 Smart-WorkFlow 专属业务状态、固定项目事实和本地绝对路径耦合。

但 **`system.md` 与 `roles/` 属于管理员维护范围**（system.md §0.8：«`system.md` 与 `roles/` 只允许管理员角色维护»；roles/admin.md §2-3 定义管理员可写）。执行角色无权改写这两类文件。

当前事实（main 2b2ca2d）：

| 文件 | Smart-WorkFlow 引用 | 绝对路径 |
|---|---|---|
| system.md | 18 处 | 3 处（/usr/local/projects/Smart-WorkFlow） |
| roles/planner.md | 4 处 | 0 |
| roles/executor.md | 10 处 | 0 |
| roles/admin.md | 3 处 | 0 |
| README.md | 2 处（指向 develop-sw 示例） | 0 |
| .gitignore | 2 处（示例仓忽略注释） | 0 |

**建议**：将"system.md/roles 的 OA 事实通用化"列入管理员授权任务（或由 Owner 明确裁决执行角色是否可改）。若不处理，`main` 的 §九.3 全覆盖将打折扣——尽管**实例业务状态、P/I 编号、功能事实、技术栈/端口/基线已全部从 main 剥离**（上述残留仅为宪法级"当前仓指代"与绝对路径）。

### 10.2 可追溯性

- main / develop-sw 分叉点 `93ce28c`；backup-main-20260831（含 a86cbbd）作为额外安全回滚点。
- develop-sw 完整保留 OA 实例（830→833 文件，含 P51 记录）；main 剥离 812 文件。无历史覆盖/改写/force push。

### 10.3 实例隔离

- 空白 Engine（main）、OA 示例（develop-sw）、两个无关项目（基于 main 骨架）已验证互不交叉。
- 同一工作区切换分支 = 切换实例；移除/回滚不互相影响。

### 10.4 Hook 相对路径的注意点

- `.claude/settings.json`、`.codex/hooks.json` 改为 `sh .claude/hooks/...`（相对工作区根）。需 Harness 从项目根启动 hook 才能解析；若 Harness 使用非标准 cwd，需项目在启动脚本中 `cd` 到根。方向 §四允许"相对定位或明确的可配置项目根"，此为相对定位方案。

## 11. Git diff 摘要

```
main 2b2ca2d   - 825 files changed, 263 insertions(+), 205705 deletions(-)
develop-sw 3cbd550   - 3 files changed, 6 insertions(+), 6 deletions(-)
develop-sw 5c64ae8   - 5 files changed, 331 insertions(+), 1 deletion(-)
```

- main 净变化：+8 新增（project.example + skel 7）、+5 改写（README/AGENTS/settings/hooks/gitignore）、-812 删除（OA 实例）。
- develop-sw：新增 P51 活动方向记忆 + 示例说明 + project.md + P51 记录。

## 12. 与方向验收标准逐项对照

| 方向 §九 验收点 | 证据 | 结论 |
|---|---|---|
| 1. develop-sw 可追溯到 OA 成果起点，实例资料/回执/状态单一源完整 | develop-sw HEAD `5c64ae8` 从 `93ce28c` 切出；完整含 knowledge/current-status.md、product/ 454 receipts、todo、search_*、823 文件 | ✅ |
| 2. main 独立自检（无 OA 资料） | engine-blank clone 契约自检 `cases=35 passed=35`；Validator 合法/非法判定 EXIT 0/1 | ✅ |
| 3. main 发布内容无 SW 专属状态/固定事实/绝对路径耦合 | main tracked 26 文件无 P/I 编号、无技术栈/端口/基线、Harness 入口无绝对路径；**残留** system.md/roles 宪法级引用（见 §10.1） | ⚠️ 部分（待管理员授权清理 system.md/roles） |
| 4. 仅填最小 project.md 接入即可进入角色门禁/探索/方向/回执/验收流程 | 隔离验证 E：骨架复制 + project.md + system.md/roles/validator/契约/探索通道全部可用 | ✅ |
| 5. main README 指向 develop-sw 示例；develop-sw README 反向说明 | main README"示例分支"节指向 develop-sw；develop-sw README 顶部"示例分支定位 + Engine 来源" | ✅ |
| 6. 空白 Engine / OA 示例 / 两个无关项目的隔离验证；切换/移除/回滚不交叉 | 验证 A-E：契约自检、完整实例、交叉检测、切换、移除 | ✅ |
| 7. 分支/提交/修改范围/回滚点可复核；未授权远端动作未执行 | §11 diff 摘要、merge-base 记录、未 push/未 force push | ✅ |

## 13. 最终自验结论与合法 Executor terminal

自验通过·待规划验收。

- 核心交付（分支组织、Engine 通用化、实例隔离）已完成并有行为证据。
- system.md/roles 通用化属管理员边界，已如实上报（§10.1），不越权完成。
- 按执行角色纪律，本功能终态使用 `EXECUTION_SUBMITTED`（自验通过待规划验收），不自行标记 PASSED/COMPLETED。
- 待确认项（方向 §十）：develop-sw 长期维护 vs 迁移快照、Engine 兼容标记、子仓引用方式、独立工作区 vs 可切换实例、远端发布时机——均在回执中如实提交，不自行解释为 Owner 授权。