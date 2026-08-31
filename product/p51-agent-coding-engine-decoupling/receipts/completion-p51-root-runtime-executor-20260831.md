# 执行补充回执：P51 根级运行时工作区修正

> 执行角色：Executor
> 依据方向：`ready/direction-p51-root-runtime-workspace.md`
> 关联评审：`receipts/planning-review-p51-agent-coding-engine-decoupling-20260831.md`（G1/G2/G4/G5/G6 未通过项）
> 日期：2026-08-31
> 性质：功能级补充回执 · 自验通过 · 待规划验收（P51 不 PASSED/COMPLETED）
> 前置：管理员方向 `direction-admin-engine-governance-generalization.md` 已由 Admin 回执完成（system.md/roles 通用化，工作树 pending 提交）

## 1. 核销矩阵（G1/G2/G4/G5/G6）

| 缺口 | 方向要求 | 证据 | 状态 |
|---|---|---|---|
| G1 | main 根级标准工作区完整 | 六目录 + 初始文件提交 `2bd193e`；隔离 clone 验证目录齐全 | ✅ |
| G2 | 只填 project.md 的 coding 仓库目录即可接入 | `project.md`/`project.example.md` 模板 + README 最短配置；隔离 clone 填仓验证 | ✅ |
| G4 | 非 SW 项目完整工作流闭环 | demo-todo-cli 隔离工作区完整行为链（探索→方向→回执→审查） | ✅ |
| G5 | 双工作区零交叉 | demo-todo-cli vs data-pipeline 零交叉命中（0 文件） | ✅ |
| G6 | Harness Hook 从非默认 cwd 可定位 | `git rev-parse --show-toplevel` 定位 + 合法/非法终态行为验证；提交 `d3e85af` | ✅ |
| （G3） | system.md/roles 通用化 | 管理员回执完成；工作树 pending 提交 | 管理员项 |

## 2. 根级标准目录与初始入口清单

main 提交 `2bd193e` 建立：

| 目录/文件 | 内容 |
|---|---|
| `memory/` | README + state/handoff/features/decisions/issues/constraints/architecture（通用初始） |
| `knowledge/` | README + current-status（唯一状态入口）+ features/evidence/history 空骨架 |
| `product/` | README（方向/回执/归档规则）|
| `todo/` | README（暂不修复）+ requirement-pool（需求池通用入口）|
| `search_task/` | README（探索任务通道）|
| `search_fallback/` | README（探索回执通道）|
| `project.example.md` | 唯一项目说明模板（身份/仓储/工程规则/生命周期/Engine）|
| `README.md` | 最短配置方法 + develop-sw 示例导航 |

## 3. 非 SW 示例完整工作流的产物路径与行为输出

隔离工作区 `/tmp/g4-ws/demo-workspace`（已清理但产物已录，以下为行为链）：

| 步骤 | 产物路径 | 行为输出 |
|---|---|---|
| 角色门禁 | 会话声明 | 声明执行角色后执行系统读入 `system.md`/`roles/executor.md` |
| 探索任务 | `search_task/explore-todo-persistence.md` | Planner 下发 JSON 持久化探索 |
| 探索回执 | `search_fallback/explore-todo-persistence.md` | 935 bytes，结论优先 |
| 需求方向 | `product/demo-todo-persistence/ready/direction-*.md` | 目标/非目标/影响/风险/待确认 |
| 执行回执 | `product/demo-todo-persistence/receipts/completion-*.md` | 自验通过·待规划验收 |
| 规划审查 | `product/demo-todo-persistence/receipts/planning-review-*.md` | PASSED（示例）|

> 项目名为 `demo-todo-cli`（单仓 CLI），与 Smart-WorkFlow 完全无关；完整走通根级通道。

## 4. 双工作区正向断言与反向零交叉断言

- 工作区 A：`/tmp/p51-runtime-verify/ws-demo`（project: demo-todo-cli）
- 工作区 B：`/tmp/p51-runtime-verify/ws-pipeline`（project: data-pipeline）
- 正向：A 的 `memory/state2.txt` 含 `demo-todo-cli`；B 的 `data-pipeline/state.txt` 含 `data-pipeline`（各自判真）
- 反向零交叉（重放后复核）：
  - A 内全部 `.md`/`.txt` 搜索 `data-pipeline` = **0 文件**
  - B 内全部 `.md`/`.txt` 搜索 `demo-todo-cli` = **0 文件**
  - 覆盖范围：memory/knowledge/product/todo/search_task/search_fallback + coding 仓
- 隔离机制：不同项目通过独立 Engine 工作区隔离（方向 §四），同一工作区不切换多项目
- 证据产物保留：`/tmp/p51-runtime-verify/`（两个独立工作区，供规划复核）

## 5. Harness/Hook 从不同当前目录触发原始结果

- 从 Engine 根内子目录 `knowledge/`（非默认 cwd）触发：
  - `git rev-parse --show-toplevel` → `/usr/local/projects/Smart-WorkFlow`（子目录可定位根）
  - 合法终态（含 `SWF_TERMINAL` JSON + `feature_status=VERIFYING`）→ Hook EXIT=0，无 block 决策
  - 非法终态（缺 marker）→ Hook 输出 `{"decision":"block","reason":"...marker: missing"}`
- 改造：`.claude/settings.json`、`.codex/hooks.json` command 改为 `sh "$(git rev-parse --show-toplevel)/.claude/hooks/...`（不依赖绝对路径、任意根内 cwd 可达），提交 `d3e85af`

## 6. 通用性全文检查

针对工作树实际内容（系统.md/roles 为管理员修改后状态）：

| 模式 | 命中 | 结论 |
|---|---|---|
| 品牌 `Smart-WorkFlow`（非 README/导航） | 0 | ✅ |
| 绝对路径 `/usr/local/projects`、`/Users/` | 0 | ✅ |
| 端口 5173/8080/3306/5432 | 0 | ✅ |
| 固定技术栈命令 mvn/pnpm/gradle/spring-boot/vite | 0 | ✅ |
| P/I 编号 | 1（system.md:245 通用治理语汇"P 编号登记/P 编号机制"） | 管理员已判非 OA 事实，保留 |
| `git diff --check` | 0 输出 | ✅ |

## 7. Git diff 与未远端发布证据

- 本次执行提交：
  - `2bd193e`（根级标准工作区 + 项目说明入口；26 files +213/-161）
  - `d3e85af`（Hook 定位改造；2 files +2/-2）
- 未执行 `git push`/`force push`/远端分支删除；未改写历史。
- 管理员 system.md/roles 修改仍 pending 提交（工作树 M）；本回执不代管理员提交。

## 8. 与方向验收逐项对照

| §七 | 验收标准 | 结果 |
|---|---|---|
| 1 | 新工作区根级目录齐全无需复制 | ✅ 隔离 clone 验证 |
| 2 | 只填 project.md 后角色入口可读身份/仓关系 | ✅ |
| 3 | 非 SW 项目完整工作流 | ✅ demo-todo-cli 链 |
| 4 | 双工作区无交叉 | ✅ 0 命中 |
| 5 | Hook 非默认 cwd 可定位 | ✅ git rev-parse + 行为验证 |
| 6 | README 首用者可完成配置并进入 develop-sw | ✅ README 最短配置节 |
| 7 | 根级全文无 OA 状态/编号/仓名/端口/基线/绝对路径 | ✅（P 编号为通用机制，见 §6）|
| 8 | 不触碰业务代码/迁移/远端；diff 可复核 | ✅ |

## 9. 偏差与边界说明

- **管理员 system.md/roles 提交**：本回执不代管理员提交其工作树修改（管理员回执声明未执行 Git 写操作）；规划验收时应将管理员 4 文件工作树修改计入 main 最终内容。
- **G3 后续**：`product/p51/` 的 direction 与 receipts 均在 main 工作区（untracked），未纳入本回执提交；由规划统一归档。
- **待确认项（方向 §四→§十口径）**：coding 仓库可多仓、仅 project.md 建立关系；删除 coding 仓库不破坏 Engine（本轮以单仓 demo 验证单仓模型，多仓映射由项目说明结构支持）。
- **无未完成实现项**：G1/G2/G4/G5/G6 全部核销；P51 状态保持未完成（待新回执返回后规划重验收）。

## 10. 最终自验结论

自验通过·待规划验收。G1/G2/G4/G5/G6 已逐项核销，P51 交由规划角色重新验收（依据两份回执：管理员 G3 + 本执行 G1/G2/G4/G5/G6）。