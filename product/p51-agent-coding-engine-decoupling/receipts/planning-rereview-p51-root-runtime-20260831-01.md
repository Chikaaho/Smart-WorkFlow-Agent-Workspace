# P51 根级运行时与治理通用化复审记录 01

> 审查角色：规划（Planner）
> 日期：2026-08-31
> 审查对象：管理员回执与执行补充回执
> 功能级结论：FAILED

## 一、结论

P51 仍不能裁决 `PASSED`。根级标准目录已经恢复，但初始入口完整性、项目化资源约束、跨角色示例闭环和嵌套 coding 仓场景下的 Hook 定位仍未满足方向要求。

## 二、本轮锁定通过项

以下项目后续禁止重做：

1. `main` 已直接提供 `memory/`、`knowledge/`、`product/`、`todo/`、`search_task/`、`search_fallback/`；
2. 根级目录不再依赖额外结构复制；
3. `system.md`、`roles/` 中 Smart-WorkFlow 品牌、固定仓名和本地绝对路径已清除；
4. `main` 与 `develop-sw` 的分支、分叉和回滚记录保持有效；
5. 未执行远端发布和历史改写。

## 三、缺口核销结果

| 缺口 | 本轮证据 | 复审结果 |
|---|---|---|
| G1 根级初始入口完整 | 根级目录已存在；但 `memory/constraints.md`、`decisions.md`、`issues.md`、`architecture.md` 分别引用 `knowledge/shared-constraints.md`、`decisions.md`、`known-issues.md`、`architecture.md`，执行提交清单中没有这些目标文件 | 部分通过，剩余死引用未核销 |
| G2 只配置项目说明即可接入 | 回执声明已填写项目说明，但没有保留可复核的配置读入输出 | VERIFYING |
| G3 治理入口通用化 | 品牌、仓名、绝对路径已清除；`system.md` 与 `roles/executor.md` 仍把“每种编译工具上限 2G”固化为 Engine 硬约束，与资源限制由项目说明声明的方向不一致 | 部分通过 |
| G4 非 Smart-WorkFlow 项目真实闭环 | Executor 在同一执行任务内生成了标为规划 `PASSED` 的示例审查文件，且临时产物已清理。执行角色无权代替 Planner 裁决，该文件不能证明真实跨角色闭环 | 未通过 |
| G5 双工作区零串扰 | 仅回执摘要；原始命令、完整搜索范围和结果未追加到持久证据包 | VERIFYING |
| G6 Harness/Hook 定位 | 只从 Engine 自身 `knowledge/` 子目录验证；未覆盖具有独立 `.git` 的 coding 仓目录。该目录中 `git rev-parse --show-toplevel` 会优先解析 coding 仓根，现有证据不能证明可回到 Engine 根 | 未通过 |

## 四、证据纪律

- 临时目录路径和执行者摘要不构成长期可复核证据；后续行为输出必须追加在本功能 `receipts/` 下。
- 执行角色不得创建或填写 Planner `PASSED` 审查结论；真实规划审查必须由规划会话在独立回合完成。
- 管理员回执中“固定资源约束已通用化”的声明与文件事实不一致，以文件事实为准。
- 当前 `system.md`、`roles/` 的管理员改动仍未提交；未提交不影响本轮内容审查，但不得宣称形成可发布基线。

## 五、后续入口

- 执行角色只处理最新提示 `planning-execution-prompt-p51-root-runtime-1.md`；
- 管理员只处理最新提示 `planning-admin-prompt-engine-governance-generalization-1.md`；
- 已锁定通过项不进入后续验证范围；
- P51 保持 `FAILED`，不得进入阶段三。
