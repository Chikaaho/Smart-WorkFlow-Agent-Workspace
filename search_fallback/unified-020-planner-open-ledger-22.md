# 0.2.0 当前开放账本事实（提示22回传）

2026-10-29｜执行回传｜只读，未改账本/治理/业务/测试/权限/数据；未启动服务、未取图、未跑构建。完整机器事实：`E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-planner-open-ledger-22.json`（500 全 ID 集合与逐项差量）。

## 1. 账本实际值

- 来源：`.git/planner-convergence/0.2.0.json` → `history[-1]`（accepted path `product/0.2.0/receipts/planning-execution-prompt-unified-020-22.md`）。
- 实际 revision **23**、previous 22、feature 0.2.0、decision CONTINUE。
- 实际计数：**总 500 = 187 RESOLVED / 0 REWORK / 313 PLANNER_ACTION**（与提示22预期一致）。
- 完整性：500 个 origin_id 唯一，无重复；开放/已解集合交集 0；并集=500。开放集合 SHA256 前16 `ce52980a658fb307`，已解集合 `3bcd39abf79a0ef2`（JSON 内为完整数组）。

## 2. 与现存提示的最近显式记录比对

规则：`product/0.2.0/receipts/planning-execution-prompt-unified-020-*.md` 中同 ID 最近一条显式记录（01/02 无 convergence 块；22 个文件解析 20 个）。313 项均有显式记录。

- **309 项存在差异**，差异字段均为 **evidence / next_action / acceptance**：
  - `next_action`：账本 PLANNER_ACTION 项不存该字段（handoff 顶层字段），属结构性缺失；
  - `evidence`、`acceptance`：现存提示最近记录与已接纳账本项内容不同（本任务不判定哪方为最新业务事实）。
- **subject / criterion / failed_rounds / scope：313 项全部无差异**。
- **4 项三字段完全一致（只列 ID）**：`P3/273:1642`、`P3/4:2`、`P3/6:2`、`P3/7:2`。
- 309 项的最近显式记录均来自 `planning-execution-prompt-unified-020-03.md`；逐项差异字段见 JSON `diff.items`。

## 3. knowledge 当前活动状态

- 位置：`knowledge/current-status.md`（169 行）；最后条目 `2026-10-29 执行提示21：2个原项收口（待规划复核；VERIFYING 2/1/4 不变）`。
- 值：**0.2.0 IN_PROGRESS/VERIFYING，未核销P、未晋级基线、未发布**。
- 该文件无独立“下一动作”字段；最近入口为提示21“待规划复核”。

## 4. 边界

未修改机器历史/治理实现/业务/测试/权限/数据库/已过证据；未运行会写接纳状态的治理检查；未做 Git 变更；未启动服务、页面采集、构建测试或全仓扫描；未复制历史长文/实现正文/秘密。Planner 据上述实际结果继续消费原件。
