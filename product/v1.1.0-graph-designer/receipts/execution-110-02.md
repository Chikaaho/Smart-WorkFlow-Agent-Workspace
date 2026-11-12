# execution-110-02：1.1.0 阶段 3 返修完成（V1—V8）

方向 `product/v1.1.0-graph-designer/ready/direction-v1.1.0.md`（XL）｜执行（返修轮）｜2026-11-12｜两仓 `feature/1.1.0`。针对 `planning-review-110-02.md` 全部返修项 V1—V8；**本批全程未碰演示环境**，所有实测在隔离环境完成（隔离 Server 18093 + 隔离 Vite 5275 + 隔离 Docker 库），截图统一 `iso-` 前缀，未写本机 `smart_workflow`（5432）与用户端口 8080/5173。

## 1. 返修项逐条闭环（对照 planning-review-110-02 §2）

| ID | 处理 | 证据 |
|---|---|---|
| V1 节点卡片视觉 | 卡片外壳双层边框去除（`node-theme.css` 重做：卡片尺寸=外壳尺寸）；100% 缩放标题 ≥13px、摘要 ≥12px；≤8 节点打开与「适配画布」后缩放钳制 ≥80%（`index.ts` `clampAfterInitialFit`，只抬一次）；画布点阵底纹；节点面板与插入对话框改「图标+名称」分组样式（`icons.ts` 中性图标字形，GraphDesigner/插入对话框共用） | `iso-designer-cards-100.png`（100% 九类卡片合集）、`iso-designer-vs-process-ref.png` 对照、`iso-designer-small-fit.png`（小图 ≥80%） |
| V2 运行状态错标 | 仅实际等待的人工节点标「等待人工」，未运行节点不标；角标放大到 100% 可辨 | `iso-v5-partial-running.png`（START 成功 + HUMAN 等待人工，END 无标） |
| V3 暂停前后同一条执行 | 暂停走 `pause_state_json` + `WAITING_HUMAN`，恢复后沿用同一执行 ID；轨迹从 START 到 END 完整；轨迹左侧无意义的 `0`（根路径 branchId）不再显示，仅并行分支显示 | `iso-restart-resume.png`（同一条执行暂停→恢复成功）、`iso-human-inbox.png`；`NodeTrajectory.vue` V3 注释 |
| V4 待我处理显示 | 时间统一 `yyyy-MM-dd HH:mm:ss`；顶部空白卡片去除（筛选内容实置） | `iso-human-inbox.png` |
| V5 证据缺口 | 见 §3 对照表，全部补齐 | `receipts/evidence/iso-*.png` |
| V6 多库迁移 | 7/9 方言本机隔离容器全绿（见 §4）；DM8/Kingbase 无本机环境，写明原因留 Owner 实库自验 | §4 表 |
| V7 G4 截图 | 隔离环境浏览器截图三件套补齐 | `iso-g4-task-detail-bottom.png`、`iso-g4-monitor-iot-filter.png`、`iso-g4-intervene.png` |
| V8 环境措辞 | 本批与上批均未碰演示环境；全部 `iso-` 前缀 + 「隔离环境」措辞；上批误写「隔离 H2」处在本收据更正为隔离环境（上批后期为隔离 PostgreSQL 5433） | 本收据全文 |

## 2. 返修中发现并修复的两个产品缺陷（服务端）

1. **顶层执行的子图运行器缺失**（G3-4 连带）：`AgentGraphExecutionServiceImpl.runInternal` 此前仅在 `depth>0`（子调用）时注入 `subgraphRunner`，含子图节点的图从生命周期首跑必然报「子图运行器未配置」。修复：顶层 `RunOptions` 同样注入 `subgraphRunner`（指向 `runSubgraph`）。修复后父执行 SUCCESS、子执行落库并可跳转。
2. **取消父执行不连带等待中的子执行**：父执行 CANCELLED 时子执行可能永远停在 `WAITING_HUMAN`、人工任务悬挂。修复：`AgentGraphExecutionLifecycleServiceImpl` 在取消/终结父执行时调用新增的 `cancelChildWaitingExecutions(resultExecutionId)`，把 `parent_execution_id` 命中且 `WAITING_HUMAN` 的子执行置 `CANCELLED` 并关闭其 PENDING 人工任务（幂等、异常仅告警不上抛）。DB 实证：取消后子执行行 `CANCELLED`、子任务无 PENDING 残留（`iso-w.js` + psql 查询）。
3. 连带：两个生命周期测试按新构造签名补 mock（`AgentHumanTaskLifecycleTest`、`AgentGraphExecutionLifecycleControlledTaskTest`）。

## 3. 方向 §4 证据对照（G1/G3）

### G1（14 张，`receipts/evidence/`）

| 证据要求 | 文件 | 结果 |
|---|---|---|
| 9 节点卡片合集（100%） | `iso-designer-cards-100.png` | ✓ |
| 连续加 5 节点不重叠 | `iso-designer-add5-layout.png` | ✓（自动找空位，重叠 0） |
| START 参数 / END 输出声明 | `iso-v5-start-params.png`、`iso-v5-end-outputs.png` | ✓（必填文本+数字；输出声明） |
| 试运行参数表单 + 缺必填拒绝 | `iso-v5-run-form.png`、`iso-v5-missing-required.png` | ✓ |
| 变量选择器只列上游 | `iso-v5-variable-picker.png` | ✓（分支图上游可达分组） |
| 引用失效发布报错（节点+字段） | `iso-v5-invalid-ref.png` | ✓（「结束 · 输出参数 · ghost_var：变量 ghost_var 未定义」前端拦截） |
| 旧图（1.1.0 前）打开并运行 | `iso-v5-old-graph-run.png` | ✓（START→END 全成功，输出/耗时展示） |
| 部分节点运行中 | `iso-v5-partial-running.png` | ✓（START 成功 + HUMAN 等待人工） |
| 节点详情（耗时/入参/出参） | `iso-v5-node-detail.png` | ✓ |
| 失败节点显示 | `iso-v5-failed-node.png` | ✓（成功/失败/跳过三态） |
| 单节点运行确认 | `iso-v5-single-node-confirm.png` | ✓ |
| 只读账号 | `iso-v5-readonly.png` | ✓（租户 9002 只读角色：横幅提示、无色板/编辑按钮） |
| 100% 新设计器 vs 流程设计器对照 | `iso-designer-cards-100.png` + `iso-designer-vs-process-ref.png`（流程设计器同尺寸参照） | ✓（1440×900） |

### G3

| 证据要求 | 结果 |
|---|---|
| 非处理人提交被拒 | ✓ HTTP 404（租户 9002 obs 提交 mgr 的任务） |
| 重复提交报错 | ✓ HTTP 400（同任务二次 submit） |
| 超时边 walk / HUMAN_TIMEOUT | ✓ 单测覆盖（`AgentHumanTaskLifecycleTest`：timeoutKeyword 边与 HUMAN_TIMEOUT 失败两路径） |
| 等待中取消 | ✓ 请求级 CANCELLED + 任务关闭（psql 实证） |
| 重启恢复同一执行 | ✓ `iso-restart-resume.png`（`pause_state_json` 恢复，同一执行 ID） |
| 子图引用环发布拒绝 | ✓ 服务端 400「子图引用存在环」（`iso-r-gaps.js`） |
| 嵌套深度 >3 拒绝 | ✓ 服务端 400「子图嵌套深度超过上限 3」（`iso-p-structure.js`） |
| 取消父 → 子执行状态 | ✓ 级联 CANCELLED（§2 缺陷 2 修复后，DB 实证） |

## 4. V6 多库迁移证据（P66 口径：迁移 + 启动 + `/api/actuator/health`）

统一口径：`SPRING_PROFILES_ACTIVE=prod` + 各方言 `db/migration/{vendor}`，判据 = 日志 `Started StarterApplication` + health `{"status":"UP"}`，迁移由 `SwVendorMigrationRunner`/Flyway 执行到 V1.1.0（`V1.1.0__agent_structured_io_and_human_task.sql` 在列）。

| 方言 | 容器/环境 | 结果 |
|---|---|---|
| PostgreSQL 17 | `iso-pg5433`（隔离） | started=1，health UP，33 迁移 |
| MySQL 8 | `v110-mysql8`，`utf8mb4_bin` + `explicit_defaults_for_timestamp=ON` | started=1，health UP，33 迁移 |
| MySQL 5.7 | `v110-mysql57`，同上守卫口径 | started=1，health UP，33 迁移 |
| MariaDB 10.6 | `v110-mariadb`，同上 | started=1，health UP，33 迁移 |
| Oracle | `v110-oracle`（APP_USER=v110 独立 schema，避开 SYSTEM baseline） | started=1，health UP，33 迁移 |
| SQL Server 2022 | `v110-sqlserver`，库级排序规则 `SQL_Latin1_General_CP1_CS_AS`（满足区分大小写守卫） | started=1，health UP（首跑 33 迁移，复跑 schema=1.1.0） |
| openGauss 5.0 | `v110-opengauss`，库级 `ENCODING='UTF8' DBCOMPATIBILITY='PG'`（满足 UTF8 + PG 兼容模式守卫） | started=1，health UP，32 迁移（含 V1.1.0） |
| DM8 | 本机无 DM8 环境 | 未跑：无驱动可用的隔离容器镜像与授权；留 Owner 实库自验（迁移脚本 DM=Oracle 去 `CHAR` 单位口径已对齐） |
| KingbaseES | 本机无 Kingbase 环境 | 未跑：同上；脚本按 PG 逐字节口径 |

日志：`.runtime-v110/v6/*.log`（本地，不入 Git）。

## 5. 门禁证据

- **Web 四连**（`NODE_OPTIONS=--max-old-space-size=2048`）：typecheck 0；lint 0 error（56 条既有 prettier warning）；test **2099 passed / 3 skipped / 0 failed（2102）**；build 成功（rolldown 5.06s）。
  - 本轮修了三处测试/类型债：`GraphDesigner.spec.ts` 补 `FLOW_ICON_PATHS` mock（适配层新增图标字形导出）与 `@/foundation/permission` mock（G1-9 `canEdit` 走 Pinia store）；`flow-graph/index.ts` 三处 TS6133/TS2339（`initialFitPending` 真接入钳制判定 + store 取值显式类型）；`NodeTrajectory.spec.ts` D140-N02 按 V3 语义更新（根路径 branchId「0」不再渲染）。
  - `LastLimitCorpusTest`（Server 守卫测试）：本批生命周期实现新增 1 处可移植 `.last("LIMIT 1")` 站点，计数 133→134 同步盘点更新（写法本身通过 Oracle/SQL Server 改写断言）。
- **Server**：全反应堆 `mvn test` **2515 tests / 0F / 0E / 45 skipped，BUILD SUCCESS**（`MAVEN_OPTS=-Xmx1024m`，29:38 min）；定向 `AgentHumanTaskLifecycleTest`、`AgentGraphExecutionLifecycleControlledTaskTest` 全绿。

## 6. 裁决与已知限制（沿用 planning-review 口径）

1. 子图剩余时间：不换算（裁决 #1 通过）——父级 `Future.get` 总时限兜底，子图超时只会更早失败。
2. 角色处理人多选：角色 code 多值输入（裁决 #2 通过）。
3. 待办按执行+节点聚合（裁决 #3 通过）。
4. 超时扫描单实例（裁决 #4 通过）：认领 SQL 原子，多实例安全空转。
5. 取消契约：cancel/提交走**请求级** executionId（受理行 ID）；真实执行行（`sw_agent_graph_execution`）通过 `resultExecutionId` 关联，执行详情按其回查。
6. 隔离库事故说明：返修中途隔离库容器被重建（`iso-pg5433`），此前隔离测试数据丢失；受影响的验证（重启恢复、待办聚合等）已在重建后的隔离库复跑通过。用户 5432 实库全程未动。

## 7. 下一步

阶段 4：两仓 `feature/1.1.0` → `develop` → `main` 合并并跑 CI；阶段 5 tag/Release；阶段 6 演示环境复测与同步；阶段 7 复核。
