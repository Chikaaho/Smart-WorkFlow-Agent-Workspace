# P51 分支解耦探索回执

## 探索结论

根仓当前无 `develop-sw` 分支（本地/远端均无），但远端有 `develop` 分支（用于日常开发/发布）。根目录文件可分为三类：**通用 Engine 治理协议**（system.md / roles / .codex / .claude）、**Smart-WorkFlow 实例事实**（README / AGENTS.md / memory / knowledge / product / todo / search_task / search_fallback / .claude/plans）、**混合**（knowledge 等两者兼有）。"README 指向示例分支"不足以满足 P51——至少还需要最小项目说明入口和实例隔离机制。

## 检查范围

- 根仓 Git 元数据（分支、远端、工作树）：`git branch -a`、`git remote -v`、`git log --oneline -3`、`git status --short`
- 两端子仓 Git 元数据：同上（只读）
- 根目录全部非代码文件：README.md、AGENTS.md、system.md、roles/、.codex/、.claude/、memory/、knowledge/、product/、todo/、search_task/、search_fallback/
- 文本搜索：Smart-WorkFlow、develop、branch、分支

## 关键证据

### 1. 分支、远端与工作树

| 仓 | 当前分支 | 远端 | develop-sw | 工作树 |
|---|---|---|---|---|
| 根仓 (Smart-WorkFlow) | `main` (clean) | origin→`git@github.com:Chikaaho/Smart-WorkFlow.git` | **不存在** | 干净，50 files changed（vs origin/main，均为旧 untracked 历史文件） |
| 后端 (Smart-WorkFlow-Server) | `develop` | origin→`git@github.com:Chikaaho/Smart-WorkFlow-Server.git` | — | 干净 |
| 前端 (Smart-WorkFlow-Web) | `main` | origin→`git@github.com:Chikaaho/Smart-WorkFlow-Web.git` | — | 干净 |

根仓 `origin/develop` 存在（与 main 同 SHA `a86cbbd`），即 `develop` 就是日常开发/发布分支。`develop-sw` 需新建，起点建议从当前 `main` HEAD (`a86cbbd`) 切出。

### 2. 文件分类：通用 Engine vs Smart-WorkFlow 实例

**A. 通用 Engine 治理协议（应留在 main）**

| 文件/目录 | 说明 |
|---|---|
| `system.md` | 工作区宪法入口——三角色定义、权限、状态机、工程约束速查。内容已通用化（"本工作区""三种会话角色"），不含 Smart-WorkFlow 品牌。 |
| `roles/` (planner.md / executor.md / admin.md) | 三角色完整定义。已通用化，无 Smart-WorkFlow 引用。 |
| `.codex/governance/` (terminal-contract.json, validate-terminal.sh/ps1, test-terminal-contract.sh/ps1) | 终态机器契约与公共 Validator。完全通用，无项目引用。 |
| `.codex/config.toml` | Codex 配置（tool_policy=full-auto）。通用。 |
| `.codex/hooks/` (stop-execution-completeness.sh) | Stop hook。路径硬编码 `/usr/local/projects/Smart-WorkFlow/`——这是**实例绑定**的，需改为可配置或下沉。 |
| `.claude/hooks/` (stop-execution-completeness.sh) | 同上，路径硬编码同一本地路径。 |
| `.claude/settings.json` | Claude 运行时设置（hooks、tools）。通用。 |

**B. Smart-WorkFlow 实例事实（应下沉到 develop-sw）**

| 文件/目录 | 说明 |
|---|---|
| `README.md` | 全文以 Smart-WorkFlow 低代码 OA+AI Agent 为定位，含项目关系、技术栈、快速开始、Agent Coding Engine 说明。 |
| `AGENTS.md` | Claude 入口，路径硬编码 `Smart-WorkFlow/system.md`。 |
| `memory/` (state.md, handoff.md, features.md, decisions.md, issues.md, constraints.md, architecture.md, README.md) | 全部是 Smart-WorkFlow/OA 的状态、决策、问题、架构摘要。 |
| `knowledge/` (current-status.md, architecture.md, decisions.md, known-issues.md, session-handoff.md, shared-constraints.md, governance-authority-matrix.md, development-workflow.md, model-registry.md, features/, evidence/, history/) | Smart-WorkFlow 完整知识库。内容大量引用 OA 功能、BPM、表单、权限、Agent 模块。 |
| `product/` (50 个功能目录) | 全部是 Smart-WorkFlow 功能的方向/回执/归档。 |
| `todo/` (README.md, requirement-pool.md) | Smart-WorkFlow 暂不修复清单和需求缺口池。 |
| `search_task/` + `search_fallback/` | Smart-WorkFlow 探索任务与回执。 |
| `.claude/plans/` | Smart-WorkFlow 的 IoT 功能计划（含大量 Smart-WorkFlow 路径引用）。 |

**C. 混合/需重新设计**

| 文件/目录 | 问题 |
|---|---|
| `.codex/hooks/` + `.claude/hooks/` | 路径硬编码 `/usr/local/projects/Smart-WorkFlow/`，是实例绑定的。作为通用 Engine 应改为相对路径或可配置。 |
| `knowledge/governance-authority-matrix.md` | 内容本身是通用治理架构（权威归属矩阵），但引用了 Smart-WorkFlow 相关文件路径。 |
| `knowledge/shared-constraints.md` | 通用约束（Flyway 双方言、动态宽表等）来自 Smart-WorkFlow 项目经验，但概念上可复用。 |

### 3. 身份引用分析

**把 Smart-WorkFlow 当默认项目的引用**：

- `README.md`：全文定位为 Smart-WorkFlow OA+AI Agent 平台（标题、快速开始、项目关系、技术栈、开发哲学）
- `AGENTS.md`：`require Smart-WorkFlow/system.md` 和 `Smart-WorkFlow/roles/planner.md` 等路径硬编码
- `.codex/hooks/stop-execution-completeness.sh`：路径 `/usr/local/projects/Smart-WorkFlow/`
- `.claude/hooks/stop-execution-completeness.sh`：同上
- `knowledge/` 全部文件：内容以 Smart-WorkFlow 功能为主体
- `memory/` 全部文件：Smart-WorkFlow 状态摘要
- `product/` 全部：Smart-WorkFlow 功能方向
- `todo/` 全部：Smart-WorkFlow 需求缺口

**已通用化的协议**：

- `system.md`：三角色定义、权限边界、状态机、工程约束速查——已无 Smart-WorkFlow 品牌
- `roles/`：角色定义文件——已通用化
- `.codex/governance/`：终态契约和 Validator——完全通用
- `.claude/settings.json`：运行时配置——通用

### 4. develop-sw 可追溯性处理建议

| 内容 | 处理方式 |
|---|---|
| 历史回执 (product/*/receipts/) | 全部随 Smart-WorkFlow 实例内容下沉到 develop-sw，历史完整保留 |
| 状态单一源 (knowledge/current-status.md) | 下沉到 develop-sw，main 不保留业务状态 |
| P/I 条目 (known-issues.md, requirement-pool.md) | 下沉到 develop-sw |
| 三仓代码引用 | Smart-WorkFlow-Server/ 和 Smart-WorkFlow-Web/ 作为 git submodule 或在 develop-sw 中保留引用说明 |
| 当前示例说明 | develop-sw 的 README 说明"本分支是 Smart-WorkFlow OA 示例"，指向根仓 main 作为 Engine |

### 5. "README 指向示例分支"是否足够

**不足**。仅靠 README 指向 develop-sw 不能满足 P51，还需：

- **最小项目说明入口**：main 需要一份简明的 Engine 使用说明（如何基于治理协议搭建新项目），不能只有一句"参见示例"
- **Hook 路径可配置化**：当前 `.codex/hooks/` 和 `.claude/hooks/` 硬编码了本地绝对路径，作为通用 Engine 必须改为相对路径或环境变量
- **实例初始化模板**：至少说明 memory/knowledge/product/todo/search_task/search_fallback 各目录的用途和初始化方式
- **AGENTS.md 适配**：当前路径硬编码 `Smart-WorkFlow/system.md`，通用 Engine 入口需要改为相对路径

### 6. 迁移顺序建议

| 阶段 | 动作 | 验收事实 |
|---|---|---|
| 0. 备份 | 标记当前 main HEAD 为 pre-p51 tag | `git tag pre-p51 a86cbbd` |
| 1. 切 develop-sw | 从 `a86cbbd` 切 `develop-sw` 分支并推送远端 | `git branch develop-sw && git push origin develop-sw` |
| 2. main 清理 | 从 main 移除 Smart-WorkFlow 实例文件（README/AGENTS.md/memory/knowledge/product/todo/search_task/search_fallback/.claude/plans） | main 只剩 system.md/roles/.codex/.claude/settings.json/.claude/hooks |
| 3. main 补充 | 新写 README（Engine 定位+用法）、适配 AGENTS.md 路径、Hook 路径可配置化 | 新 README 无 Smart-WorkFlow 品牌、路径可配置 |
| 4. develop-sw 补充 | 新写 README（说明本分支是示例、指向 main Engine）、保留完整实例内容 | develop-sw README 指向 main、实例内容完整 |

**风险与回滚**：
- 阶段 0 的 tag 是安全回滚点——`git reset --hard pre-p51` 可恢复
- 阶段 1 无风险（仅切分支）
- 阶段 2-3 是高风险：如误删通用文件可从 pre-p51 tag 恢复
- 建议在阶段 2-3 之间做一次中间提交，便于逐阶段回滚
- 远端 main 已发布过 `v0.0.1-beta`，改写 main 需 force push——建议先在本地验证完成再推远端
