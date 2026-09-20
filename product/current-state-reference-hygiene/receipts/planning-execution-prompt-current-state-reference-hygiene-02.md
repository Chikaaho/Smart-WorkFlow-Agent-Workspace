# 当前状态引用卫生整改执行补充提示 02

> 下发角色：规划（Planner）  
> 指定角色：执行（Executor）  
> 日期：2026-09-20  
> 级别：单原子收尾  
> 唯一权威审查：`planning-review-current-state-reference-hygiene-02-not-passed.md`

## 1. 替代关系

本提示替代补充提示01，成为本任务唯一当前执行入口。原方向、回执01/02、审查01及其证据只作锁定证据，不同时作为执行待办。

本轮仍是独立任务，不发送或并入 P53/P61 执行、回执、提交或验收。

## 2. 唯一剩余缺口

| 原子ID | 失败事实 | 完成条件 | 必要反向断言 | 对象身份 | 最小充分证据 | 允许替代 | 下一动作 | 合法停止条件 |
|---|---|---|---|---|---|---|---|---|
| G4 | `knowledge/session-handoff.md:63` 当前任务指针把 P60 标为“当前活动”，并引用 P60 `ready/` 目录及主方向 | 该任务指针把 P60 表达为 `COMPLETED（规划已确认，2026-09-15）`/已完成，主方向与终态方向均指向 `product/v0.1.0-oa-completion/passed/`；P60 无活动入口；P53 提示07仍是当前唯一主功能入口 | `knowledge/session-handoff.md` 的当前任务指针区不再出现 `P60，当前活动`、`product/v0.1.0-oa-completion/ready/` 或 `ready/direction-v0.1.0-oa-completion.md`；不得改写明确历史事件 | `knowledge/session-handoff.md` 任务指针区的 P60 行 | 修改前后完整行、当前任务指针区定向反向扫描、聚焦 diff 与 `diff --check` | H1—H13、G1—G3 全部沿用，不重验 | 唯一命中后精确改写该行并回读 | 文件发生无法无损合并的在途修改时保留现场并按契约报告；不得覆盖 |

## 3. 锁定与禁止事项

- H1—H13、G1—G3 全部锁定，禁止重做、重扫或修改；
- 只允许修改 `knowledge/session-handoff.md` 的 G4 单行、新回执03及 `evidence/receipt-03/`；
- 禁止修改两仓 README、其他 knowledge/todo 当前行、P53/P61 文件、业务代码、测试、迁移、Git 历史和远端；
- 禁止构建、测试、服务、浏览器、数据库、提交、合并、推送和发布；
- 不做新的全工作区审计，不顺手处理未列入 G4 的历史措辞。

## 4. 相对上一版变化

- 删除：移除已通过的 G1—G3 全部执行要求；
- 原子化：只保留任务指针区 P60 单行；
- 替代路径：从两锚点扫描收敛为该任务指针区的完整行回读与定向零残留；
- 提交条件：G4 正向值和三个反向模式全部满足，新回执终态末行再次按已锁定的 G1 方法正确封装。

## 5. 提交要求

证据包只需：

1. G4 修改前后完整行；
2. 当前任务指针区三个错误模式零命中；
3. 聚焦 diff 与 `diff --check`；
4. 回执03物理终态末行提取、逐字节比较与 Validator exit 0。

完成后提交：

`product/current-state-reference-hygiene/receipts/completion-receipt-current-state-reference-hygiene-03.md`

终态保持 `EXECUTION_SUBMITTED`、`feature_status=VERIFYING`、`remaining_actionable_count=0`、`next_action_type=WAIT_PLANNER`。

