# P51 当前 `main` 分支状态重校验

> 本会话角色：规划
> 委派角色：执行
> 日期：2026-09-01
> 性质：只读探索，不实施、不修复、不发布
> 任务状态：已回执并完成规划复核

## 任务目标

以当前时间点的本地根仓与远端 `origin/main` 为对象，重新建立 P51 可验收的 `main` 事实快照，消除早期探索、执行回执和多轮 Owner 裁决之间可能存在的滞留信息。探索结果只回答当前事实，不修改 P51 方向，不替规划角色作验收裁决。

## 需要回答的问题

按优先级逐项回答，禁止省略：

1. 当前根仓 checkout 分支、工作树状态、本地 `main`、本地缓存的 `origin/main`、远端实时 `origin/main` 分别指向什么提交？这些提交之间是什么祖先/分叉关系？
2. 远端实时 `origin/main` 是否等于完成回执所称的通用 Engine 提交 `2b2ca2d`，或已经被后续用户裁决更新？必须以实时远端引用和固定提交内容回答，不能沿用旧回执。
3. 当前本地 `main` 与远端实时 `origin/main` 各自 tracked 内容中，哪些属于：
   - 通用 Engine 协议与模板；
   - 允许存在的 Smart-WorkFlow/OA 示例指引；
   - 不应存在的 Smart-WorkFlow/OA 业务状态、P/I 编号、固定模块/仓库事实、端口、测试计数、迁移版本或本机资源条件；
   - 本地绝对路径耦合。
4. 对 `system.md`、`roles/*.md` 中每一处 `Smart-WorkFlow` 和 `/usr/local/projects/Smart-WorkFlow` 命中，提供文件、行号、最小上下文，并逐条分类为“通用规则中的项目示例指引”“项目实例事实”“本地路径耦合”或“其他”。不得只报总数。
5. 早期探索称 `system.md/roles` 已无 Smart-WorkFlow 引用，而完成回执称仍有 35 处引用和 3 处绝对路径。哪个结论符合当前本地 `main`，哪个符合当前远端 `origin/main`？差异由提交变化、分支混淆、扫描口径还是其他事实造成？
6. 当前 `main` 是否仍 tracked OA 实例数据目录或历史内容：`memory/`、`knowledge/`、`product/`、`todo/`、`search_task/`、`search_fallback/`、`.claude/plans/`；若只保留 `skel/` 骨架，逐类说明其内容性质和是否为空白通用模板。
7. 当前 `main` 的 `README.md`、`AGENTS.md`、Harness/Hook 配置是否仍存在固定工作区绝对路径或强制依赖当前后端、前端仓库？README 指向 `develop-sw` 的内容属于示例导航还是把 OA 当默认项目？
8. 当前 `main` 是否可以在不包含后端、前端和 OA 实例数据的隔离副本中运行治理契约自检？本任务只做一次最小只读/临时隔离验证，粘贴完整命令、原始输出和退出码。
9. 当前本地 `develop-sw` 与当前本地/远端 `main` 的分叉点、实例资料保留位置和 P51 审计文件位置是什么？只回答可追溯事实，不创建或推送分支。
10. 将 P51-G01～G07 分成三类：本次新鲜事实已经直接回答、仍需独立行为补证、因当前事实变化应撤销或重写。每项必须说明依据；不得自行判定功能 `PASSED`。

## 搜索范围

- 根仓 Git 元数据与 tracked tree，只读检查本地当前分支、本地 `main`、本地 `develop-sw`、缓存远端引用和远端实时 `origin/main`。
- 固定提交上的根入口和治理文件：`README.md`、`AGENTS.md`、`CLAUDE.md`、`system.md`、`roles/`、`.codex/`、`.claude/`、`.gitignore`、`project*.md`、`skel/`。
- 固定提交上的标准实例目录存在性与 tracked 文件清单：`memory/`、`knowledge/`、`product/`、`todo/`、`search_task/`、`search_fallback/`、`.claude/plans/`。
- P51 既有探索、方向、完成回执和第 1 轮规划审查，仅用于建立差异表：
  - `search_fallback/p51-branch-decoupling-exploration.md`
  - `product/p51-agent-coding-engine-decoupling/ready/direction-p51-agent-coding-engine-decoupling.md`
  - `product/p51-agent-coding-engine-decoupling/receipts/completion-p51-agent-coding-engine-decoupling.md`
  - `product/p51-agent-coding-engine-decoupling/receipts/planning-review-p51-agent-coding-engine-decoupling-01.md`
- 如本地对象不足以读取远端实时 `main` 内容，可在 `/tmp` 新建隔离只读 clone；不得 fetch、checkout、reset 或清理当前工作区。

## 禁止范围

- 禁止修改当前工作区任何文件、分支、索引、配置或 Git 引用。
- 禁止执行 `git fetch`、`git pull`、`git checkout`、`git switch`、`git reset`、`git clean`、`git branch`、`git tag`、commit、push、force push、远端分支创建/删除。
- 禁止修改 `system.md`、`roles/` 或任何 P51 实现内容；发现残留只报告。
- 禁止读取或修改后端、前端业务源码；本任务只判断 Engine 是否依赖它们，不审查业务实现。
- 禁止把历史回执中的提交号、计数或结论当作当前事实重复粘贴。
- 禁止裁决 P51 `PASSED`、`COMPLETED` 或修改功能状态。

## 预期证据

1. 每条结论标明取证对象：当前 checkout、本地 `main`、本地 `develop-sw`、缓存 `origin/main` 或远端实时 `origin/main`，并给出固定 SHA。
2. Git 关系、tracked tree、引用扫描、目录存在性和最小隔离自检必须提供完整命令、执行目录、原始输出和退出码。
3. 所有 `system.md`、`roles/*.md` 相关命中逐条列出，不允许用总数替代内容分类。
4. 对业务状态、P/I 编号、固定端口/基线/迁移版本/绝对路径分别给出正向扫描和零命中结果；零命中必须保留命令和退出码语义。
5. 输出一张“旧主张 → 当前新鲜事实 → 是否滞留 → 影响的 P51-G 编号”差异表。
6. 若原始输出超过 5KB，将摘要写入主回执，并把未经改写的必要输出按编号放入 `search_fallback/p51-main-current-state-revalidation-evidence/`；摘要中逐项引用附件。不得把无关全仓日志塞入附件。

## 完成标准

- 10 个问题全部有单值答案或明确的“无法确认 + 原因”。
- 本地与远端 `main` 严格区分，所有关键事实绑定固定 SHA。
- `system.md/roles` 冲突得到可复核解释。
- 能让规划角色在不读取 Git 或代码的情况下，判断首轮 P51-G01～G07 中哪些是当前真实缺口、哪些只是旧快照残留。
- 未发生任何工作区或远端状态变更。

## 失败处理

如远端不可达、对象缺失、权限不足或输出无法在只读范围内取得，仍须生成回执，列出已确认事实、未确认问题、失败命令原始输出和所需最小后续条件；不得用旧快照填补未知值。

## 回执位置

探索摘要写入：

`search_fallback/p51-main-current-state-revalidation.md`
