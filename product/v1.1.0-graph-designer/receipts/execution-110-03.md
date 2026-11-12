# execution-110-03：1.1.0 阶段 3 返修完成（W1—W6）

方向 `product/v1.1.0-graph-designer/ready/direction-v1.1.0.md`（XL）｜执行（返修轮 2）｜2026-11-13｜两仓 `feature/1.1.0`。针对 `planning-review-110-03.md` 全部 6 项（W1—W6）；**全程未碰演示环境**，全部实测在隔离环境（隔离 Server 18093 + 隔离 Vite 5275 + 隔离库 `iso-pg5433`，全新迁移后实测），未写本机 `smart_workflow`（5432）与用户端口 8080/5173。

## 1. 返修项逐条闭环

| ID | 处理 | 证据（`receipts/evidence/`） |
|---|---|---|
| W1 角色选择器 | 角色选择器已在代码中（上一轮误报「通过」）：`/system/role/options`（登录即可调，仅返回启用角色 id/code/name，RoleController `ec87ee8e`）→ `listRoleChoices` → HumanPanel `el-select multiple`，保存仍是角色编码；本轮修正误导性文案为「选择角色（可多选，保存角色编码）」，并在 `execution-110-02.md` §6-2 原地更正措辞 | `iso-w1-role-picker.png`（面板下拉列出角色、多选标签、占位文案） |
| W2 G4-1 任务详情 | 新造带明细表的表单（6 主表字段 + 6 列明细表、10 行数据）+ 采购审批流，任务详情滚到底 | `iso-w2-task-detail-bottom.png`（明细表最后一行「路由器 AR-200」完整可见、不被底部操作栏遮挡）、`iso-w2-opinion-expanded.png`（意见框填入审批意见展开态） |
| W3 干预历史 | 实例挂起（SUSPEND）后从监控「更多 → 历史」打开干预历史 | `iso-w3-suspend-dialog.png`、`iso-w3-intervention-history.png`（动作 SUSPEND、前状态「运行中」→ 后状态「已挂起」中文、时间 `2026-11-13 01:02:02`） |
| W4 连线标签与布局 | ①适配层 `EdgeWithInsert.vue`：标签位置改为「两卡水平空间放不下即落到两卡下方空白带」（整理布局后相邻列间距 60px < 标签半宽×2，必然落带内），不再压卡片；②「整理布局」后自动适配视口；③适配画布优先完整可见——小图 ≥80% 钳制仅在 0.8 放大后画布装得下时抬升（宽图不再为凑 80% 而裁切首尾节点） | `iso-w4-before-layout.png`（整理前）、`iso-w4-after-layout.png`（整理后：从左到右无回绕线、通过/驳回标签在空白带、全部节点可见） |
| W5 统一执行编号 | 统一展示**执行编号**（结果执行行 id）：①待办行显示 `task.resultExecutionId`；②设计器「查看详情」跳转与展示统一；③详情页头部显示执行编号、受理编号降级为「受理号 #…」次标识；④服务端读取/取消/提交/任务/事件入口双编号互认（`requireOwned` 回链 `result_execution_id`；任务/事件按受理行 id 查询）；⑤取消/提交契约不变（仍可用受理编号）。三个入口同一编号 | `iso-w5-todo.png`（待办「执行 #2120923130179432449」）+ `iso-w5-detail.png`（详情 `#2120923130179432449` + 「受理号 #2120923129936162818」）——与设计器运行面板「查看详情」跳转同编号 |
| W6 真实人工超时 | 隔离环境 `timeoutSeconds=30`、扫描间隔 5s（`--sw.agent.human-task.timeout-scan-ms=5000 --sw.agent.human-task.timeout-initial-delay-ms=5000`）真跑两条执行：①配超时边（timeoutKeyword=「超时自动通过」，30 秒后走该边）→ **SUCCESS**；②未配超时边 → **FAILED**，`errorCategory=GRAPH_EXECUTION_FAILED`，错误「人工节点等待超时且未配置超时分支: h」 | `iso-w6-human-timeout.png`（执行详情：等待超时失败）；接口响应：`{"status":"SUCCESS","output":"go"}` / `{"status":"FAILED","errorCategory":"GRAPH_EXECUTION_FAILED","errorMessage":"人工节点等待超时且未配置超时分支: h"}` |

## 2. 代码落点

- Web：`adapters/flow-graph/EdgeWithInsert.vue`（标签落带）、`adapters/flow-graph/index.ts`（fitView 完整可见优先 + 钳制条件化）、`modules/agent/views/GraphDesigner.vue`（整理布局后适配、查看详情统一编号）、`ExecutionDetail.vue`（执行编号 + 受理号次标识、任务按受理号查询）、`ExecutionList.vue`（待办显示执行编号）、`contracts/agent.ts`（AgentHumanTask/ExecuteResp 增 resultExecutionId）、`locales`（角色选择占位、受理号标签）。
- Server：`AgentGraphExecutionLifecycleServiceImpl`（`requireOwned` 双编号互认、任务/事件按受理行 id、`toHumanTaskDto` 回链执行编号、提交用受理行 id）、`AgentHumanTaskDTO.resultExecutionId`、`LastLimitCorpusTest` 站点计数 134→135（新增 1 处可移植 `.last("LIMIT 1")` 回链查询，写法通过 Oracle/SQL Server 改写断言）。

## 3. 门禁证据

- **Web 四连**（`NODE_OPTIONS=--max-old-space-size=2048`）：typecheck 0；lint 0 error；test **2099 passed / 3 skipped / 0 failed（2102）**；build 成功。
- **Server**：定向 `AgentHumanTaskLifecycleTest`、`AgentGraphExecutionLifecycleControlledTaskTest`、`LastLimitCorpusTest` 全绿；全反应堆 `mvn test` **2515 tests / 0F / 0E / 45 skipped，BUILD SUCCESS**。

## 4. 其他说明落实（planning-review-110-03 §3）

1. **证据目录**：上一轮旧截图（`iso-designer-parent/after-insert/layout/overview/graph-list`）已挪入 `evidence/round1/`，主目录仅保留现行 UI 证据。
2. **`iso-v5-run-form.png` 画面矛盾说明**：该图摄于「缺必填提交被拒」用例之后约 3 秒内——上一步点击「运行」时 title 为空触发「请填写必填参数：title」提示（`ElMessage` 存续 ~3s），随后回填 title 以展示表单态，提示仍在存续期内被一并拍入。缺必填被拒的独立证据是 `iso-v5-missing-required.png`（空参数点击运行、无回填）。表单填写与运行成功路径由 `iso-v5-run-form.png` + `iso-v5-partial-running.png` 覆盖。
3. `iso-designer-vs-process-ref.png` 为流程设计器参照图，保持原样。
4. DM8/KingbaseES 未实跑（无本机环境），已在 1.0.0/1.1.0 迁移口径静态核对，发布说明将作为已知限制记录（静态核对口径同 1.0.0）。
5. 隔离容器（本轮重建的 `iso-pg5433` 等）按惯例留待阶段 7 结束后清理。

## 5. 已知限制（沿用）

1. 子图剩余时间不换算（裁决 #1）；2. 超时扫描单实例 @Scheduled（裁决 #4）；3. 角色处理人为角色编码多选（W1 后为选择器多选）。

## 6. 下一步

阶段 4：两仓 `feature/1.1.0` → `develop` → `main` 合并并跑 CI；阶段 5 tag/Release 1.1.0；阶段 6 演示环境复测与同步；阶段 7 复核。
