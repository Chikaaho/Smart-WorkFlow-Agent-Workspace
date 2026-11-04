# 0.2.2 整版验收、同步、合并与发布方向

日期：2026-11-05。下发角色：规划；承接角色：执行（Executor）。状态：`READY`。

依据：
- F1 三阶段通过：`receipts/planning-review-f1-stage1-03.md`、`planning-review-f1-stage2-03.md`、`planning-review-f1-stage3-02.md`；
- F2 通过：`receipts/planning-review-f2-04.md`；
- 决策记录 `decision-records-022.md`（D022-01～16）；
- 已归档主方向：`passed/direction-022-f1-agent.md`、`passed/direction-022-f2-app-bundle.md`。

本方向覆盖七阶段的第 3—7 阶段。版本 0.2.2 已由 Owner 确认，不再询问。合并、tag/Release 和既有通道发布，按 `system.md` §3.0 的持续授权连续推进。

F1、F2 已通过的验收项全部锁定。本方向只要求一次整版回归：F2 分支包含 F1，两边的代码在同一个提交上合到了一起，需要确认合在一起后仍然正常。回归不重做各项断言。

## 唯一终态值

| 字段 | 单一目标值 |
|---|---|
| 0.2.2 交付状态 | 第 3 阶段同步完成后为 `PASSED`；发布及发布后同步完成、规划复核通过后为 `COMPLETED` |
| 功能验收结论 | F1 Agent 完善（XL，三阶段）`PASSED`；F2 应用导入导出（L）`PASSED` |
| 完成功能数 | **50**（49 + 1；D022-16：0.2.2 整版登记为一个功能，F1、F2 是它的两部分） |
| 清单计数 | 46/22/22＝90，不变 |
| ADV/问题数 | 64/57，不变 |
| P 编号 | 不新增核销，既有值不变 |
| 里程碑/明细 ID | 无新增；F1/F2、G1～G4 等编号只在本版回执内使用 |
| 正式验证基线新增/晋级集合 | []，保留全部既有正式基线 |
| 数据库迁移终点 | versioned 终点由 `V0.2.0` 变为 `V0.2.6`，实际值以 Executor 回读为准 |
| 正式/部署版本 | 目标 Web、Server 均为 0.2.2；实际值以第 5 阶段回读为准 |
| 开发版本 | 由 Executor 按既有惯例收敛并如实回传（参照 0.2.1：Server `0.2.2-SNAPSHOT`、Web `0.2.2`） |
| 活动功能 | 0.2.2，直到发布后同步复核通过；之后无活动交付 |
| 唯一下一动作（全部完成后） | 等待 Owner 安排下一目标 |
| 主方向目录 | F1、F2 主方向和范围草稿已归档到 `product/0.2.2/passed/`；本方向在规划终态复核后移入同一目录 |

## 执行步骤与完成条件

### 1. 第 3 阶段：整版回归、操作说明与同步

**整版回归。** 在两个业务仓 `feature/0.2.2-bundle` 的当前提交上完成（起点：Server `d61dceca`、Web `c8a2eb1`；如有更新的提交，写明实际提交）。

1. **门禁：**
   - Server 按工程宪法跑合并前要求的测试范围；
   - Web 跑 typecheck、lint、vitest 全量、build。
   - 日志存 `receipts/assets/close-022-gates-*.log`。
2. **冒烟：**
   - 用本地库 `smart_workflow_f1v4b` 启动当前提交的服务，Flyway 会把它升到 V0.2.6，回执写明迁移前后的版本。
   - 浏览器用 headless=false，每步一张截图，存 `receipts/assets/close-022-*.png`。
   - F1：执行一个已发布、含 LLM 节点和知识库检索节点的 graph，执行记录能看到真实输出和快照版本；
   - F2：在同一环境导出一个应用并导入，完成预检和确认，导入报告能正常显示。

冒烟不通过时报告规划，不要自行改范围。

**操作说明。** 在仓库已有的用户或运维文档入口里补“应用导入导出”说明，内容包括：
- 导出包里有什么；
- 导入时的两步流程；
- 意见表单 key 冲突怎么处理；
- 导入报告怎么看；
- 导入后全部是草稿，需要逐个发布；
- 目标环境的同名数据源要先给相关用户授权，否则导入后看不到。

找不到现成入口时，在回执里写明，并写进 knowledge 的本版事实。

**同步。** 先把上表写进 `knowledge/` 的权威状态和受影响的索引，再同步：
- `memory/`（state、handoff、features、README，必要时加 issues、decisions）；
- `todo/requirement-pool.md` 的本版状态；
- 确实受影响的项目声明。

memory 每份小于 5KB，总量小于 20KB。回执写到 `receipts/close-sync-022-01.md`，附覆盖矩阵（入口、写入内容、回读结果）。

### 2. 第 4 阶段：合并

1. Server、Web 各自按以下顺序合并：
   - 先把 `feature/0.2.2-bundle` 合入 `develop`，它已包含 `feature/0.2.2-agent` 的全部提交；
   - 在 `develop` 上收敛 0.2.2 版本号和当前生效的发布配置（CI 工作流、构建脚本、版本默认值与回退值、制品命名），完成发布要求的种子压缩和受影响验证；
   - 再合入 `main`。
2. `ApplicationCenterRecoveryDrillPostgresTest` 在本机会被跳过，CI 上必须实际跑通。回执写明它在 CI 里的运行结果。
3. 每次合并操作前报告远程、分支、精确范围、ahead/behind、工作树状态。推送后回读远端 SHA。
4. Web 的 `vite.config.ts` 在途改动不得进入提交。
5. 两个 feature 分支合并后是否删除远端，按 0.2.1 惯例处理并回读。

### 3. 第 5 阶段：发布

**发布与核实。** 沿既有通道发布 0.2.2，分别核实 tag、CI 结果、制品版本和实际部署版本。版本来源不一致时修真实配置，不用摘要代替。

**UAT 顺序（D022-07、D022-09）：**
1. **先装 pgvector，再升级。** 如果已经先升级了，装完后重启服务。
2. **回读扩展。** 按 `receipts/f1-stage3-2.md` 第三节的 SQL 确认扩展已启用。
3. **装不了就停。** 停在这一步并报告规划，由 Owner 决定是否延期 RAG，不得静默降级。
4. **健康检查。** 升级后服务 health UP，回执写明启动日志里的 ERROR 数和 Flyway 终点版本。

**Key。** UAT 上的模型供应商 Key 由 Owner 在页面录入。Executor 不从本地库迁移 Key，也不代为录入。

### 4. 第 6 阶段：发布后同步

按发布事实先更新 knowledge，再更新受影响的当前入口：分支与提交、正式/开发/部署版本、制品、迁移终点、pgvector 安装结果、下一动作。

回执写到 `receipts/release-sync-022-01.md`，含覆盖矩阵。

### 5. 第 7 阶段：结束

规划复核两份同步回执和发布事实，归档本方向，确认 `COMPLETED`。

## 边界

- **密钥：** 任何 API Key 都不得写进文件、提交、回执、日志或截图。截图前确认页面上没有明文 Key。本地库 `smart_workflow_f1v4b` 保留，不清库。
- **进程：** 只操作本轮自己启动、身份明确的进程；不按端口或进程名停掉用户的服务。不改迁移历史。
- **新缺陷：** 不再写功能代码。回归或发布中发现阻塞发布的真实缺陷时，报告规划，由规划判断是否在本版修。需求池里的候选不进本版。
- **新边界：** 真实凭据、MFA 或新环境边界先报告。
- **等待方式：** 遵守 `system.md` §0.8.2/§0.8.3：CI 和发布的等待要有界、可观测，不空转轮询，不起不可控的后台任务。
- **终态契约：** 按 `.codex/governance/terminal-contract.json`。`work_items` 保留合并、发布、发布后同步的剩余项及依赖，不能在第 3 阶段同步后删掉。

## 整体阶段与当前进度

总阶段 7：

1. 需求评估：已完成
2. 执行（F1、F2）：已完成
3. 验收与同步：进行中
4. 合并：未开始
5. 发布 0.2.2：未开始
6. 发布后同步：未开始
7. 结束：未开始

计数：已完成 2，进行中 1，未开始 4。

当前唯一下一动作：Executor 读取本方向，完成第 3 阶段并提交 `close-sync-022-01.md`，随后连续推进第 4—6 阶段。

```planner-convergence
{
  "schema": "agent-coding-engine.planner-handoff.v1",
  "feature": "0.2.2",
  "revision": 13,
  "previous_revision": 12,
  "decision": "FINISH",
  "source_receipt": "product/0.2.2/receipts/f2-04.md",
  "items": [],
  "history_summary": {"revision": 12, "review": "product/0.2.2/receipts/planning-review-f2-04.md", "retained_count": 22, "status_counts": {"RESOLVED": 22}}
}
```
