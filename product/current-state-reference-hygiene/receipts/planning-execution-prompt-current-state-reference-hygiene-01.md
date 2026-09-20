# 当前状态引用卫生整改执行补充提示 01

> 下发角色：规划（Planner）  
> 指定角色：执行（Executor）  
> 日期：2026-09-20  
> 级别：首次补充提示  
> 唯一权威审查：`planning-review-current-state-reference-hygiene-01-not-passed.md`

## 1. 替代关系与输入

本提示替代原方向作为当前状态引用卫生任务的唯一执行入口；原方向和完成回执 01 只作已锁定证据与追溯，不同时作为待办。允许读取：

- `product/current-state-reference-hygiene/receipts/planning-review-current-state-reference-hygiene-01-not-passed.md`；
- `product/current-state-reference-hygiene/ready/direction-current-state-reference-hygiene.md`；
- `product/current-state-reference-hygiene/receipts/completion-receipt-current-state-reference-hygiene-01.md`；
- `product/current-state-reference-hygiene/receipts/evidence/receipt-01/`；
- G2/G3 指向的三个当前文件及对应工程宪法、终态契约与 Validator。

本任务继续保持独立，不发送或并入 P53/P61 执行、回执、提交或验收。

## 2. 唯一剩余缺口矩阵

| 原子ID | 失败事实 | 完成条件 | 必要反向断言 | 对象身份 | 最小充分证据 | 允许替代 | 下一动作 | 合法停止条件 |
|---|---|---|---|---|---|---|---|---|
| G1 | 回执01物理末行不是其声明的终态 JSON | 新回执02以契约接受的 `ENGINE_TERMINAL {...}` 作为物理最后非空行；该行与 Validator 输入逐字节一致，Validator exit 0 | 最后非空行之后无正文；不得只保存独立 JSON 文件便宣称末行一致 | `completion-receipt-current-state-reference-hygiene-02.md` 最后非空行及其 validator input | 末行提取、逐字节比较、SHA/字节数、Validator stdout/stderr/exit | 回执01的 H1—H13 证据全部沿用；只补正确终态封装 | 最后生成回执02终态并回读物理末行 | 仅真实契约/Validator 文件不可用且已有工具结果；其他项继续 |
| G2 | `knowledge/session-handoff.md:24/:29` 当前交接仍指向 P60 `ready/` | 主方向指向 `product/v0.1.0-oa-completion/passed/direction-v0.1.0-oa-completion.md` 并标已归档；“当前唯一规划入口”改为 P53 提示07，P60/I6 无活动入口；R8 P2 待办边界保留 | 该文件当前段不再以两个 P60 `ready/` 路径作为当前入口；历史事件不全局替换 | `knowledge/session-handoff.md` 当前交接段 | 修改后两行全文回读 + 仅针对当前段的反向扫描 | 允许引用回执01中 P53/P60/P61 已锁定事实，不重扫 H1—H13 | 精确修改两处当前语义锚点 | 文件出现无法无损合并的在途修改时保留现场并如实报告；不得覆盖 |
| G3 | 两仓 README 互链目录名与实际目录不一致 | Server README 指向 `../Smart-WorkFlow-aPaaS-Web/README.md`；Web README 指向 `../Smart-WorkFlow-aPaaS-server/README.md`；两条目标文件均可解析存在 | 两个错误目录名在互链位置零残留；不得改其他 README 内容 | 两仓根 README 的对仓链接及其本地目标 | 两行回读 + 从各 README 父目录解析目标存在的工具结果 + 聚焦 diff | H7—H10 已锁定，不重写版本段 | 精确修正两条互链并验证目标存在 | 无外部阻塞 |

## 3. 锁定项与禁止重验

- H1—H13 全部锁定，不得重新修改或重新提交其扫描包；
- 合法历史抽样、三仓差异足迹、零业务动作声明继续有效；
- 不运行构建、测试、服务、浏览器、数据库或迁移；
- 不修改 P53 在途文件、P61 八值、版本标签、Release、Git 历史或远端；
- 不扩大到新的全工作区审计，也不顺手清理其他历史措辞。

## 4. 修改与命令范围

| 维度 | 允许范围 |
|---|---|
| 允许修改 | `knowledge/session-handoff.md` 两个当前锚点；两仓根 README 各一条互链；新的回执02与 `evidence/receipt-02/` |
| 禁止修改 | 回执01及其证据、H1—H13 目标行、原规划审查、P53/P61 文件、业务代码和测试 |
| 允许命令 | 定向文本回读/扫描、相对链接目标存在检查、聚焦 diff/`diff --check`、终态 Validator 与末行一致性检查 |
| 顺序 | 修正 G2 → 修正 G3 → 聚焦回读/反向扫描/链接解析 → 生成回执02 → 最后写入并验证终态行 |

## 5. 相对上一版变化

- 删除：删除 H1—H13 的全部重复执行要求；
- 原子化：只保留终态封装、当前交接两处入口、README 两条互链三项；
- 替代路径：不再做宽扫描，改为精确行回读、相对链接解析和物理末行比较；
- 提交条件：G1—G3 三项正反断言全部有工具结果，且新回执物理末行与已通过 Validator 的输入一致。

## 6. 证据包与自检

每项只写：`缺口 → 原始文件/位置 → 实际结果 → 边界`，原始输出单独放入 `evidence/receipt-02/`。

- [ ] G1 物理末行已提取、逐字节比较并通过 Validator；
- [ ] G2 两个当前锚点正确，错误 `ready/` 当前入口零残留；
- [ ] G3 两条互链使用真实目录名且解析目标存在；
- [ ] H1—H13 和 P53/P61 均未重做或改动；
- [ ] 聚焦 `diff --check` 通过，无业务、测试、Git 远端动作；
- [ ] `remaining_actionable_count=0`，终态为 `EXECUTION_SUBMITTED`、`feature_status=VERIFYING`、`next_action_type=WAIT_PLANNER`。

完成后提交：

`product/current-state-reference-hygiene/receipts/completion-receipt-current-state-reference-hygiene-02.md`

