# P51 当前 `main` 分支状态重校验 · 探索回执

> 会话角色：执行（Executor）｜委派：规划｜日期：2026-09-01｜性质：只读探索，未实施/修复/发布
> 取证对象：本地根仓 + 远端 `origin/main`（完整命令/原始输出见 `search_fallback/p51-main-current-state-revalidation-evidence/01..05`）

## 结论（TL;DR）

**当前本地与远端实时 `main` = `e0711fb`**，是已全面通用化的 Agent Coding Engine 默认分支：`system.md`、`roles/*.md` 对 `Smart-WorkFlow` 与 `/usr/local/projects/Smart-WorkFlow` **零命中**；`memory/knowledge/todo/search_*` 全为通用初始模板；隔离副本契约自检 **`cases=43 passed=43（EXIT=0）`**；Validator 正反例 EXIT 0/1 正确；无绝对路径/业务编号/端口/基线残留。

完成回执所称通用 Engine 提交 `2b2ca2d` 存在且位于 `main` 链上，但它是 **16 步祖先**；其上的 35 处引用已在后续 P51 管理员收口（`7cf6361`/`45f2c98`）与分级收口（`23e4f74`）中清除。**「早期探索已无引用」与「完成回执有 35 处」都曾正确，但对象是不同提交**——差异由提交推进造成，非滞留残留（附件 `04`）。

## 十问逐项

1. **refs**：checkout=`develop-sw`@`a2b8342`（工作树含未提交修改：memory/handoff.md·state.md·todo/requirement-pool.md·direction 文件）。本地 `main`、缓存 `origin/main`、**远端实时 `origin/main` 均=`e0711fb`**。`develop-sw` 本地/缓存/远端=`a2b8342`。merge-base(main,develop-sw)=`93ce28c`；`a2b8342→5c64ae8→3cbd550→93ce28c`（附件 `01`）。
2. **`2b2ca2d` ≠ 远端实时 main**：远端=`e0711fb`；`2b2ca2d` 是 16 步祖先，其后 15 提交 = 运行时契约通用化 + 阶段三收口 + README/license/分级流程（附件 `01`）。
3. **main tracked 70 文件**（附件 `02`）分类：通用协议与模板（system.md/roles/.codex/.claude/README/AGENTS/project.example/各标准目录通用版）；允许的示例指引（README 6 处 + README.en 6 处 = 「仅 develop-sw」导航，.gitignore 2 处注释忽略）；**Smart-WorkFlow 业务状态/P/I/端口/迁移版本/测试基线/本机资源：零命中**（附件 `03`）；绝对路径仅存于 P51 审计证据文本（描述「已移除/扫描对象」，非运行耦合）。`product/` 仅含 P51 自身归档与审计回执；**`skel/` 已不存在**（骨架已落为实际初始结构）。
4. **system.md/roles 逐条命中**：`main@e0711fb` 四个文件 **零命中**；命中全在 P51 审计/证据文本的「旧值→新值/已移除」描述中（附件 `03`）。对比 `2b2ca2d`：system.md 13、planner 13、executor 13、admin 4。
5. **冲突解释**：早期探索（`a86cbbd` 时代对称）与完成回执（`2b2ca2d`）均曾是事实；**当前 `e0711fb` 已由管理员收口清零**。成因=提交推进 + 扫描对象不同，无滞留（附件 `04`）。
6. **标准目录 tracked**：memory(8)/knowledge(14)/todo(2)/search_task(1)/search_fallback(1)/product(36) 均 tracked，但前五类为**通用初始模板**（如 `memory/state.md`「Engine 通用初始版」）；`.claude/plans/`、`docs/` 零命中。
7. **入口/Hook**：AGENTS 仅相对路径引用 `system.md`；Hook 命令用 `$(git rev-parse --show-toplevel)` 相对定位，脚本内无品牌/绝对路径（附件 `03`）；README 分支身份表明确 `main`=通用引擎（功能数 0 为初始态）、`develop-sw`=OA 示例。**根仓远端正名 `Chikaaho/Smart-WorkFlow-Knowledge`**，README 的该链接即本仓自身（`git ls-remote` 可达，HEAD=`e0711fb`）。
8. **隔离自检**（`/tmp/p51-reval/main-e0711fb`，`git archive` 纯隔离）：契约 `43/43 passed EXIT=0`；Validator 合法(`EXECUTION_SUBMITTED`+`VERIFYING`)EXIT=0，非法(`TERMINAL_SYNC_SUBMITTED`+`IN_PROGRESS`)→`incompatible`消息 EXIT=1，旧 `SWF_TERMINAL` marker EXIT=1；契约标识 `agent-coding-engine.executor-terminal.v2`、marker `ENGINE_TERMINAL`（附件 `05`）。注：完成回执为 35/35，阶段三收口增至 43。
9. **分叉/审计**：分叉点 `93ce28c`；OA 实例资料保留在 `develop-sw`（三提交链完整）；P51 审计文件在 `product/p51-agent-coding-engine-decoupling/`（main tracked）+ `search_fallback/p51-branch-decoupling-exploration.md`（develop-sw）。当前 `planning-review-*.md` 与本次 search_task 为未提交。
10. **G01～G07 分类**：
    - **已直接回答**：G01（merge-base=`93ce28c`，develop-sw 链完整）、G02（隔离 43/43 + Validator 正反例）、G03（system.md/roles 零命中 + 业务/编号/路径零命中）、G05（README 双向指引均存在且远端目标可达）、G07（分支/提交/祖先/隔离差异全输出，无新增/覆盖远端引用）。
    - **仍需独立行为补证**：G04（仅确认空 Engine 自检与 project.example 入口，无示例实例完整生命周期产物+合法终态证据）、G06（未做两无关实例的初始化/切换/移除/回滚行为快照）。
    - **无应撤销/重写项**（G01/G03 的旧缺口随 e0711fb 已实质清零，但最终裁决属规划层）。

## 已完成 / 未确认 / 需继续

- **已确认**：十问均给出单值答案或明确分类（G04/G06 附依据）。
- **未确认**：无（远端可达、对象齐全）。
- **需继续**：G04/G06 行为补证（固定夹具+命令+原始输出+退出码）；P51 功能判决属规划层。
- **未发生任何工作区或远端状态变更**：全程只读，未 fetch/push/checkout/reset/clean/branch。