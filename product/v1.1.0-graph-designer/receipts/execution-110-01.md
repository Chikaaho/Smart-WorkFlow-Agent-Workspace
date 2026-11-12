# execution-110-01：1.1.0 阶段 2 实施完成（G1 / G3 / G4）

方向 `product/v1.1.0-graph-designer/ready/direction-v1.1.0.md`（XL）｜执行｜2026-11-12｜两仓 `feature/1.1.0`；先验收后合并。本批覆盖 G1-1—G1-8、G3-1—G3-6、G4-1—G4-4，含本机门禁与隔离 H2 浏览器实测；多库/CI/演示环境证据留阶段 4—6。

## 1. 提交与版本

- Server `feature/1.1.0`（起点 `708d3a36`）：`4c396ed7` 结构化入参出参+节点事件+监控流程名+沙箱竞态 → `1b966596` 单节点试运行与 G3 执行链路 → `1dcb55f2` 版本 1.1.0-SNAPSHOT+发布断言 → `c39703f8` 升级衔接计数/DM 对齐 → `4c113077` 子执行 id 落库与超时扫描租户上下文（UAT 发现）。
- Web `feature/1.1.0`（起点 `b4b2d25`）：`ebd639c` 适配层扩展 → `b7514e4` 设计器重做 → `4edb9ce` 变量引用/发布校验 → `d330656` 运行可视化/单节点/G4 → `29d22f9` G3 人工与子图 UI → `f55c571` `package.json` 1.1.0。
- 工作区 `version.json` 发布时同步（方向 §2 口径）。

## 2. 功能落点

- **G1-1**：`adapters/flow-graph` 自定义节点/边组件、边/画布/拖停事件、命令式节点/边更新、插入目标与视口控制；流程设计器未改，`known-issues` I48 改「1.1.0 已扩展」。
- **G1-2/3/6**：节点卡片（图标/主色/摘要/运行状态）、分组色板点击/拖入、节点与连线中点「+」插入、自动找空位、整理布局、撤销/重做（50 步）、缩放/适配、配置/连接双页签、边关键词编辑。
- **G1-4/5**：START `params` / END `outputs` 声明；`{{var}}` 与 `{{nodeId.var}}` 上游可达校验（含 CONDITION/LOOP 入边来源）；设计器发布前预校验；服务端 required 入参校验与 END outputs 解析。
- **G1-7/8**：NODE_STARTED/NODE_FINISHED 事件（截断载荷）、节点卡片状态色、配置面板「运行」页签、单节点运行（LLM/TOOL/KNOWLEDGE，不落正式记录）、执行详情按 resultExecutionId 回查轨迹、结构化入参表单。
- **G3-1/2**：HUMAN 节点配置（说明/字段/按钮/用户或角色/超时与超时边）；暂停快照 `pause_state_json` + `WAITING_HUMAN`；人工任务表按处理人生成；提交校验处理人/单次认领/兄弟任务关闭后恢复派发；设计器与执行详情等待卡片、执行列表「待我处理」、提交弹窗。
- **G3-3**：超时扫描（默认 30s，`sw.agent.human-task.*` 可调/关闭）按 `payload.timeoutSeconds` 走 `timeoutKeyword` 边，无超时边按 `HUMAN_TIMEOUT` 失败；等待中取消；暂停状态持久化，重启后仍可恢复；调度线程跨租户扫描（UAT 修复）。
- **G3-4/5/6**：SUBGRAPH 固定 `graphDefVersion`、父子执行记录与节点 `childExecutionId`、入出参映射、子图人工暂停逐层透传；发布校验环/深度≤3/已发布/版本快照；取消父执行连带子执行（同一执行线程中断链）；父子超时由父 `Future.get` 总时限兜底；执行详情子执行跳转。
- **G4-1/2/3/4**：任务详情底部操作栏不再遮挡明细；`UserFilterSelect` 支持姓名搜索+「系统（IoT）」；监控发起/干预时间统一 `yyyy-MM-dd HH:mm:ss`、状态中文化、流程名称字段；`JavaSubprocessExecutor` 有界等待+「子进程未返回输出」失败及稳定复现测试。

## 3. 门禁证据

- **Web 四连**（`NODE_OPTIONS=--max-old-space-size=2048`）：typecheck 0；lint 0 error（55 条既有 prettier warning）；test **2099 passed / 3 skipped / 0 failed（2102）**；build 成功 4.10s。
- **Server**：`MAVEN_OPTS=-Xmx2g mvn -q test` 全反应堆 **2513 tests / 0F / 0E / 45 skipped**（含 UAT 修复后最终代码复跑）；定向 `AgentGraphExecutionServiceImplTest`、`AgentGraphHumanSubgraphTest`、`AgentHumanTaskLifecycleTest` 全绿。
- **迁移**：V1.1.0 九方言合并且仅 1 条：request `inputs_json/outputs_json/pause_state_json/parent_execution_id`、execution `parent_execution_id`、execution_node `child_execution_id`、`sw_agent_graph_human_task`（角色编码）；DM=Oracle 去 `CHAR` 单位、Kingbase=PG 逐字节、SQL Server 真实增量；32 条迁移/终点 1.1.0 断言同步。

## 4. 隔离 H2 浏览器实测（1440×900）

环境：dev 构建 `bootstrap-dev.jar` + H2 内存库，Server `http://127.0.0.1:18093`，Web Vite `http://127.0.0.1:5275`（strictPort），登录 `admin`（租户「默认租户」），未写本机 `smart_workflow`/用户端口。

- G1：色板新增「人工处理/子图」；加 LLM 节点 4→5、撤销 4、重做 5；整理布局后节点重叠 0；开始节点「+」插入对话框含全部 9 类可插入节点，插入后 5→6；缩放 57%→69%。图 `2120797156125204481`。
- G3：父图 `2120797156125204481`（v2）含 HUMAN→SUBGRAPH；子图 `2120797155638665218`（v2）。运行父图后 `WAITING_HUMAN`，等待卡片显示「等待 系统管理员 处理」；「待我处理」出现执行 `2120797169966407681`；填写意见「同意发布」+「通过」后父执行 `2120797188350042114` SUCCESS，输出「同意发布」；节点轨迹子图节点显示「查看子执行 #2120797188396179458」并可跳转。
- 证据（`product/v1.1.0-graph-designer/receipts/evidence/`，本地不入 Git）：
  - `uat-designer-parent.png`：新设计器总览（卡片/分组色板/人工与子图）
  - `uat-human-panel.png`、`uat-subgraph-panel.png`：两类节点配置面板
  - `uat-run-waiting.png`、`uat-human-inbox.png`、`uat-human-dialog.png`：等待/待办/提交
  - `uat-execution-detail.png`、`uat-child-execution.png`：节点轨迹与父子跳转
  - `uat-designer-layout.png`、`uat-insert-dialog.png`、`uat-designer-after-insert.png`：布局/插入
  - `graph-designer-1440x900.png` 等 3 张：1.0.0 改造前对照

## 5. 偏差与决策项（如实）

1. **子图剩余时间**：未做「子图超时 ≤ 父剩余时间」的独立换算；子图内联在父执行线程，父级 `Future.get(父超时)` 与取消中断链已形成总时限上限，子图自身超时只可能更早失败。若要求可见的剩余时间提示，需后续版本补。
2. **角色处理人 UX**：无角色 options 接口，人工面板为「用户多选 + 角色 code 逗号输入」；服务端按登录用户角色 code 匹配。是否补角色选择器由 Planner 决定。
3. **待办去重**：同一人工节点同时配置用户与角色时会生成多行 PENDING，按行展示可能重复；提交一次关闭同节点全部兄弟行。是否按执行+节点聚合展示待 Planner 裁决。
4. **超时扫描多实例**：当前为单实例应用内 `@Scheduled`；认领 SQL 原子，重复扫描安全但会多一次空转。多实例部署如需严格单跑，后续接分布式锁。
5. **G4 浏览器复测**：本批以 Web spec（TaskDetail/InstanceMonitor/UserFilterSelect）与 Server 测试覆盖；页面级截图与真实流程实例留阶段 6 演示环境复测。

## 6. 全量复跑与下一步

- 服务端 UAT 修复后全量 `mvn test`：**2513 tests / 0F / 0E / 45 skipped，BUILD SUCCESS**（提交 `4c113077`）。
- 下一步：Planner 阶段 3 验收 → 阶段 4 两仓 feature→develop→main 合并并跑 CI → 阶段 5 tag/Release 1.1.0 → 阶段 6 演示环境（备份≥3G、Flyway +1 行、G1/G3/G4 复测、README `agent-graph.png` 重拍、`version.json`/CHANGELOG/knowledge/memory 同步）→ 阶段 7 复核。
