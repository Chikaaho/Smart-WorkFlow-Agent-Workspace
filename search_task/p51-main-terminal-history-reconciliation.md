# P51 `main` 终态历史对账

> 本会话角色：规划
> 委派角色：执行
> 日期：2026-09-01
> 性质：只读探索，不实施、不修复、不发布
> 任务状态：已回执并完成规划终态裁决

## 任务目标

以远端实时 `main@e0711fbb7b3a345f3136910af9e71c31ee022ad3` 为固定对象，读取并压缩回传其中既有 P51 正式方向、执行/管理员回执、规划审查和阶段三最终审查，判断 P51 是否已经在 `main` 完成合法终态闭环，以及这些既有证据是否已覆盖当前 develop-sw 审查中的 P51-G01～G07。不得重新执行已经通过的事项。

## 需要回答的问题

1. `main@e0711fb` 的 `product/p51-agent-coding-engine-decoupling/` 下完整 tracked 文件清单是什么？按 `ready/`、`receipts/`、`passed/` 分类并给出数量。
2. 下列已在重校验附件中出现的文件，其完整标题、角色、日期、审查对象、最终结论、生命周期状态和关键授权值分别是什么：
   - `product/p51-agent-coding-engine-decoupling/README.md`
   - `passed/direction-p51-root-runtime-workspace.md`
   - `passed/direction-admin-p51-engine-governance-consolidated.md`
   - `passed/direction-admin-engine-governance-generalization.md`
   - `receipts/planning-review-p51-agent-coding-engine-decoupling-20260831.md`
   - `receipts/planning-rereview-p51-root-runtime-20260831-01.md`
   - `receipts/planning-rereview-admin-p51-consolidated-20260831-01.md`
   - `receipts/planning-final-review-admin-p51-consolidated-2.md`
   - `receipts/planning-final-stage3-review-p51-20260831.md`
   - 对应 completion receipts 与 evidence 目录。
3. 这些文件构成的实际时序是什么？逐项绑定引入它们的提交 SHA、父提交和提交主题，明确主方向、管理员收口、运行时收口、阶段三同步是否依次完成。
4. 是否存在规划角色明确写出的 P51 功能级 `PASSED` 和阶段三 `COMPLETED`？若存在，逐字回传结论段、唯一终态值清单核销结果和最终下一动作；若不存在，明确缺哪份正式裁决。
5. 既有 main 审查是否已经用行为证据覆盖当前 P51-G01～G07？输出映射表：G 编号 → 既有证据文件 → 原始行为证据位置 → 当时规划结论。不得仅凭文件名或执行层自述判定。
6. G04 的非 Smart-WorkFlow 示例完整生命周期、G06 的两个无关实例隔离/切换/移除/回滚，是否在 main 既有 evidence 中真实执行并被规划锁定？如有，回传固定输入、命令、关键原始输出、退出码和规划核销语句；如无，明确未覆盖。
7. `main` 上 P51 最终状态与当前 `develop-sw` 的 P51 `VERIFYING` 摘要为何不同？属于分支分叉后的摘要未同步、两个不同方向、重复任务，还是其他原因？用提交与文件时序解释。
8. 重校验主回执的 tracked 计数 `70` 与附件 02 的 `83` 哪个正确？给出固定 SHA、完整命令、原始输出和退出码，解释差异。
9. 对本任务开始和结束分别执行一次远端只读引用查询，证明任务期间 `origin/main` 与 `origin/develop-sw` 是否变化；不得据此执行任何远端写操作。
10. 给规划角色一个单值建议：
    - A：main 已合法 `COMPLETED`，当前 develop-sw 仅需摘要纠偏；
    - B：main 仅 `PASSED`，仍缺阶段三；
    - C：main 未通过，继续当前 G 缺口；
    - D：证据冲突无法裁决。
    建议必须逐条引用正式规划审查，不能由执行角色自行创造终态。

## 搜索范围

- 固定远端实时 `main@e0711fbb7b3a345f3136910af9e71c31ee022ad3` 的 tracked tree、P51 product 文件及其 Git 历史。
- 当前本地 `develop-sw` 只读取以下对账入口：`memory/state.md`、`memory/handoff.md`、`todo/requirement-pool.md`、P51 当前方向与两轮规划审查。
- 如需读取 main 内容，使用 Git 对象读取或 `/tmp` 隔离副本；不得切换、fetch、reset 或清理当前工作区。

## 禁止范围

- 禁止修改任何工作区文件、分支、索引、配置、Git 引用或远端状态。
- 禁止重新运行 G04/G06 或其他实现/验收流程；本任务只回收既有证据。
- 禁止覆盖、移动或改写任何历史方向、回执和审查。
- 禁止将执行层自验当作规划 `PASSED`，禁止自行写 P51 状态。
- 禁止读取后端、前端业务源码。

## 预期证据

- 每条结论绑定 `main@e0711fb` 和具体文件路径、行号或提交 SHA。
- 对正式结论仅允许逐字短摘或准确压缩，不得省略 `FAILED/PASSED/COMPLETED/BLOCKED` 等状态词。
- Git 命令必须附执行目录、完整命令、原始输出和退出码。
- 若回传内容超过 5KB，主回执只保留结论与映射表；必要原文放入 `search_fallback/p51-main-terminal-history-reconciliation-evidence/`，逐项编号引用。

## 完成标准

- 十个问题全部回答。
- 能唯一判断 main 的 P51 是否已经完成正式终态闭环。
- 能唯一解释 main 与 develop-sw 当前摘要差异。
- 能判断 G01～G07 是否已被既有审查覆盖，避免重复验证。
- 全程未改变本地或远端状态。

## 失败处理

若对象缺失、远端变化或历史文件互相矛盾，写明已确认事实、冲突文件、无法裁决原因和最小后续条件，不得用当前 develop-sw 摘要替代 main 正式历史。

## 回执位置

`search_fallback/p51-main-terminal-history-reconciliation.md`
