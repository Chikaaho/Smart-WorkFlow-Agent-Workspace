# execution-110-04：1.1.0 阶段 3 返修完成（X1—X4）

方向 `product/v1.1.0-graph-designer/ready/direction-v1.1.0.md`（XL）｜执行（返修轮 3）｜2026-11-13｜两仓 `feature/1.1.0`。针对 `planning-review-110-04.md` 全部 4 项（X1 阻塞 + X2—X4 小修）；**全程未碰演示环境**，实测在隔离环境（隔离 Server 18093 + 隔离 Vite 5275 + 隔离库 `iso-pg5433`）。本回执的每张截图描述均逐张对照截图内容书写。

## 1. 返修项逐条闭环

| ID | 处理 | 证据（`receipts/evidence/`） |
|---|---|---|
| X1（阻塞）审批操作区盖住明细表 | 根因：操作卡是 `position: sticky` 且位于内容流末端——滚到底时卡片停在内容末尾、下方还留着预留的空白带，看起来悬在页面中部盖住内容。修复：`TaskDetail.vue` 操作卡改为 `position: fixed; left/right:24px; bottom:0`——**固定在视口底部边缘**；滚动容器保留按操作卡实测高度（ResizeObserver）预留的 `padding-bottom`，滚到底时最后一行明细与审批历史都在操作卡上方完整露出；嵌入统一详情弹窗的场景（`.task-detail--embedded`）保持容器内吸底。 | 四张**浏览器视口截图**（非整页拼接，1440×900）：`iso-x1-table-top.png`（明细表顶部，操作卡钉在视口底部 y=619—900）、`iso-x1-table-middle.png`（滚动中部）、`iso-x1-table-bottom.png`（滚到底：最后一行「路由器 AR-200」完整可见，流转记录/审批详情标签与操作卡均完整）、`iso-x1-opinion-bottom.png`（意见框展开后滚到底）。页面内实测：卡片 boundingRect 在滚动 0%/50%/100% 三处均为 [619, 900]，与视口底边（900）齐平。 |
| X2 连线标签离开所属连线 | 上一轮「标签落下方空白带」的启发式改回**贴线**：标签取贝塞尔中点（白色底片压线，线条在标签下断开，归属明确），横向按标签估计宽度钳制在两卡之间的间隙内；仅当手工把两卡拖得连标签都放不下时才回退到下方空白带。 | `iso-x2-layout-labels.png`（整理布局后 49%：通过/驳回标签位于各自连线的中点）、`iso-x2-labels-100pct.png`（100% 缩放分支区域：通过贴在人工处理→LLM 的直线上、驳回贴在人工处理→子图的曲线上，均不压卡片） |
| X3 超时失败分类不一致 | 根因：执行行写入 `classifyError(failure)`（HUMAN_TIMEOUT），生命周期受理行却硬编码 `GRAPH_EXECUTION_FAILED`。修复：`AgentGraphExecuteRespDTO` 增加 `errorCategory`，执行服务把分类随响应返回；生命周期 `finish` 沿用该分类（仅在为空时回退 `GRAPH_EXECUTION_FAILED`）。 | 接口：`GET /agent/graph-execution-lifecycle/executions/{id}` → `{"status":"FAILED","errorCategory":"HUMAN_TIMEOUT","errorMessage":"人工节点等待超时且未配置超时分支: h"}`；`iso-x3-human-timeout-detail.png`（详情页「失败分类：HUMAN_TIMEOUT」）；`iso-x3-human-timeout-list.png`（列表「失败分类」列 HUMAN_TIMEOUT） |
| X4 干预历史动作为英文 | 干预历史动作列接入既有 `ACTION_LABELS` 中文映射（挂起/恢复/终止/转办），未知动作回退原值。 | `iso-x4-intervention-history-cn.png`：动作「挂起」、前状态「运行中」→ 后状态「已挂起」、时间 `2026-11-13 10:28:33` |

## 2. 代码落点

- Web：`modules/workflow/views/TaskDetail.vue`（操作卡固定视口底部 + 嵌入场景吸底）、`adapters/flow-graph/EdgeWithInsert.vue`（标签贴线 + 间隙钳制）、`modules/workflow/views/InstanceMonitor.vue`（历史动作中文）。
- Server：`AgentGraphExecuteRespDTO.errorCategory`、`AgentGraphExecutionServiceImpl`（分类随响应返回）、`AgentGraphExecutionLifecycleServiceImpl`（受理行沿用执行分类）。

## 3. 门禁证据

- **Web 四连**（`NODE_OPTIONS=--max-old-space-size=2048`）：typecheck 0；lint 0 error；test **2099 passed / 3 skipped / 0 failed（2102）**；build 成功。
- **Server**：全反应堆 `mvn test` **2515 tests / 0F / 0E / 45 skipped，BUILD SUCCESS**。

## 4. 说明

1. X1 的操作卡为固定底栏：滚动过程中内容从栏后经过属吸底栏的正常交互；滚到底时所有表单内容（含明细表最后一行）完整露出在栏上方，即验收要求的「页面底部留出和栏一样高的空白」。
2. 本轮未新增已知限制；此前裁决（子图剩余时间不换算、超时扫描单实例）不变。

## 5. 下一步

阶段 4：两仓 `feature/1.1.0` → `develop` → `main` 合并并跑 CI；阶段 5 tag/Release 1.1.0；阶段 6 演示环境复测与同步；阶段 7 复核。
