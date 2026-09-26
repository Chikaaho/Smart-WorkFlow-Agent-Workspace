# Final · POM 增量归属与证据计数补证指令 01

> 下发角色：规划（Planner）  
> 指定实施角色：执行（Executor）  
> 日期：2026-09-26  
> 状态：READY  
> 前置复核：`planning-review-completion-final-01-verifying.md`  
> 性质：首次补证；只关闭 F1/F2，不重开已锁定项

## 1. 权威输入与替代关系

- 主方向：`../ready/direction-final-repository-presentation-hygiene.md`
- 主体回执：`completion-final-repository-presentation-hygiene-01.md`
- 当前复核：`planning-review-completion-final-01-verifying.md`
- 本指令是当前唯一补证入口；不替代或改写 `evidence/final-01/`，旧包仅作追溯。

## 2. 唯一剩余缺口

| ID | 失败事实 | 唯一可接受证据 | 完成条件 |
|---|---|---|---|
| F1 | `final-readback.txt` 把 7+2 写成 8；现场实际 9 | 新建独立补证包，清单与回读准确区分哈希载荷和物理文件 | `N` 个载荷 + 清单/回读 2 = `N+2`，现场计数和哈希回读均一致 |
| F2 | 根 POM 当前总 diff 含前序阶段大段变化，只有“Final 增量一行”的声明，无法复算 | 冻结 `git diff --unified=0 -- pom.xml` 完整输出，并对每个 hunk 穷尽归属到 Phase 6A、Phase 6C 或 Final；每项附已归档方向/既有回执证据指针 | URL hunk恰为 placeholder→canonical 一删一增；其余 hunk均有前序阶段证据；无法解释 hunk=0 |

不可接受：再次只写“本轮只改一行”、只展示 URL 片段、把整个当前 diff 都归为 Final、用新改动重做现场，或修改旧证据以消除矛盾。

## 3. 已锁定项与禁止重验

- 双仓身份、两项 GitHub description 写后回读、canonical URL、Maven URL 解析、placeholder 残留 0、refs 不变、秘密扫描与机器终态均已锁定。
- 不再执行 `gh repo edit`；最多允许只读 `gh repo view`，且非必需。
- 不修改任何 coding 仓文件，不运行 Maven test/package/install、服务、数据库或浏览器。
- 不修改 Phase 1—6C、Final 主方向、主体回执、`final-01/`、memory、knowledge、todo 或总体方向。

## 4. 允许读取、允许写入与顺序

允许读取：

- 后端根 `pom.xml` 的只读 diff；
- Phase 6A/6C 已归档方向、完成回执与已有证据台账；
- 主体 Final 回执与 `final-01/`。

只允许新增：

- `receipts/evidence/final-supplement-01/`；
- `receipts/completion-final-repository-presentation-hygiene-evidence-supplement-01.md`。

顺序：冻结完整零上下文 diff → 枚举 hunk → 逐 hunk 绑定前序证据或 Final URL → 断言无法解释 hunk 为 0 → 建立新证据哈希/回读 → 提交补证回执。

## 5. 新增与收敛方式

- 删除了什么：不再要求重复远端写入、Maven 解析或残留扫描。
- 原子化了什么：只保留 F1 计数和 F2 POM diff 归属。
- 替代路径：因 Final 修改前 POM hash 未冻结，使用“当前完整 diff + 已归档阶段证据逐 hunk 穷尽归属”作为等强度可复算路径。
- 提交条件：F1 数学与现场一致；F2 每个 hunk均已归属、URL hunk精确、无法解释 hunk=0；否则不得提交完成回执。

## 6. 回执与终态

新回执必须逐项给出：缺口 → 原始证据文件/位置 → 实际结果 → 边界。最后一行保持合法 `ENGINE_TERMINAL`：`state=EXECUTION_SUBMITTED`、`feature_status=VERIFYING`、`remaining_actionable_count=0`、`next_action_type=WAIT_PLANNER`、`browser_status=NOT_APPLICABLE`。

不 commit/push/merge/tag/Release/deploy，不归档 Final，不同步总体任务终态。
