# P64阶段Ⅱ完成回执02：人员与父子协作（自验通过，待规划独立验收）

2026-10-10；Executor；XL。依据[阶段Ⅱ方向](../ready/direction-p64-phase2-personnel-parent-child.md)、[主方向](../ready/direction-p64-mes-advanced-orchestration.md)、[方案](../ready/solution-p64-mes-advanced-orchestration.md)、[完整实施授权](../ready/authorization-p64-implementation-20261008.md)与[审查01](planning-review-phase-2-01.md)（唯一差异账本）。阶段Ⅰ由[验收08](planning-review-phase-1-08-passed.md)锁定 PASSED；本回执**不写功能 PASSED/COMPLETED、不核销 P 或计数**。证据树 [phase2-02](evidence/phase2-02/INDEX.md)（32 件，`MANIFEST.sha256` 工具生成并 `sha256sum -c` 回读全 OK）。

## 0. 自验结论

审查01 八项差异全部处置：P2-01/P2-02/P2-03/P2-04/P2-05/P2-06 完成实机或原件级处置；P2-07a/P2-07b/P2-07c 完成封装与收尾。本轮修复 3 项实机反证缺陷（⑤分组多行回写、⑥恢复版本清理、⑦BLOCKED 重结算）并复验；实机全链（含冲突→有权恢复→结算推进）通过。**限制（如实，非外部阻塞）**：正式可见会话的登录后页面视觉原件受宿主截图面能力限制（错误原样归档；替代证据见 P2-02 行），聚合会签本轮为单测原断言、完整多角色会签链属阶段Ⅲ A09。整体 P64 保持 IN_PROGRESS。

## 1. 差异账本逐项（对象→行为→实际结果→原件/层级→快照与限制）

### P2-01 CHILD 可视化配置（产品未完成）
- **对象/行为**：设计器「触发器→编辑→命中动作」内 CHILD 配置面板（子流程模式/等待策略/回写开关/结果节点/子表格字段/来源行列/行级列映射/主记录字段映射），业务用户经可见控件编辑 →「保存修改」提交到图 →「保存」草稿 →「发布」确认。
- **实际结果**：可见会话内完成编辑（主记录映射 summary→title）→「草稿已保存」→发布确认「确定发布」→ 冻结版本 `graph_version=2`（PUBLISHED）含 `mainFields`（DB position=2715）；草稿图（def_version=2）与发布版本、API 回读三层一致。UI 交互为真实控件路径（含 `tab.click` 提交、`保存修改` 提交语义）。
- **原件/层级**：`raw/live/p64p2b-scenario.json`、`raw/db/parent-main.txt`、`raw/git/server.txt`；UI（可见会话真实交互）+ DB/API 回读。
- **快照/限制**：发布后页面视觉原件受截图面限制（见 P2-02）；面板结构与控件状态经 domSnapshot 结构化回读（角色/名称/文本）。

### P2-02 可见会话与视觉原件（工具限制待核）
- **对象/行为**：可见可交互配置→多角色父/子办理→回写/等待→回查。
- **实际结果**：可见会话内完成真实 UI 交互：设计器配置发布（P2-01）；张三登录→任务详情（节点表单已预填其 2 行来源行，数据表单面板显示其本人记录）→填两行反馈→「通过」→确认框；李四登录→同链（1 行）；冲突恢复后父链推进、父记录回写值回读。**视觉原件**：登录页 PNG 3 张（1280×720、URL/视口可见）。**截图能力错误原样归档**：`BrowserCommandError: browser screenshot surface preparation timed out after 3000ms`（含栈）；已穷尽路径：元素级截图/裁剪截图/禁用动画/注入重绘驱动/窗口置前/重载冷启动续登/录制（对象不可用）/桌面级捕获（面板内容空白）。窗口置前后登录页截图可复现；登录后页面（SPA 跳转）持续同错误。
- **原件/层级**：`raw/ui/`（login-page-*.png、desktop-capture-*.png、capability-error-archive.txt、captcha-*.png）；UI（可见会话真实交互 + 结构化页面状态）+ 请求级（后端 AccessLoggingFilter 逐请求 method/path/status/costMs）+ API/DB 回读。
- **快照/限制**：登录后页面**未取得像素原件**（真实工具限制，非冒充通过）；窄屏 `setViewportSize` 可用但截图受同一限制。正式 A11 视觉验收在具备可用截图通道的会话中补采。

### P2-03 A05 实机派发与四策略（缺证据）
- **对象/行为**：父实例（3 行：张三×2/李四×1）→ node_ops 完成 → CHILD 动作 START_GROUPED(owner)+ALL 派发冻结 → 两子实例（FORM_FIELD owner_id 解析到张三/李四）→ 双项 WRITTEN → 结算一次 → 等待节点推进 → 复核任务。
- **实际结果**：批次 `expected_count=2`、`wait_policy=ALL`、项冻结来源行（`source_row_id`+`source_rows_json`）；两项 WRITTEN 后 `status=SETTLED、settled_count=2/2、settled_at=2026-10-10T17:07:36`；复核任务单次生成；父 APPROVED。**冲突不凑数**：主字段同字段冲突时批次 `BLOCKED`（`block_reason` 可诊断），不计成功；**恢复后结算**（见 §4）。四策略中 ALL 实机；ANY/COUNT/NONE/迟到留痕/取消退回/重试不增预期＝原单测断言+结果（`raw/unit/`）。
- **原件/层级**：`raw/live/p64p2b-run2.json`、`raw/db/child-batch.txt`、`raw/db/child-items-recovery.txt`、`raw/unit/ChildOrchestrationServiceTest.txt`、`raw/unit/TriggerExecutionServiceChildDispatchTest.txt`；IT（实机 HTTP+PG）+ UNIT 原件。
- **快照/限制**：单/N 中的 N=2 实机；N>2 与策略组合的实机覆盖留待阶段Ⅲ S3（不新增本阶段业务范围）。

### P2-04 A06 行级回写与隔离（缺证据）
- **对象/行为**：派发把本组授权来源行预填到子记录表格 → 各负责人只看到并只办理自己的行 → 节点表单提交 → 行级回写（逐行版本守卫）+ 主字段回写 → 父表逐行 feedback 与主字段回读。
- **实际结果**：张三子记录 `result_table` 仅 2 行（其行 ID）、李四仅 1 行（`raw/db/child-rows.txt`）；父表 3 行 feedback 分别 `host-01正常`/`host-02需复检`/`host-03正常`（`raw/db/parent-rows.txt`）；回写记录含行身份与逐行值（`writeback_json.rows`）。**集合外行拒绝**：单测断言（`groupedItemWritesBackAllAuthorizedRowsOnly`：row-other 不写）；**冲突/重放/排序/旧轮次**＝原单测断言+实机冲突恢复链；授权读取：张三经其角色权限读取本实例记录成功（仅本组行）。
- **原件/层级**：`raw/db/{child-rows,parent-rows,child-items-recovery}.txt`、`raw/unit/ChildOrchestrationServiceTest.txt`；IT（实机 PG 行级回读）+ UNIT 原件。
- **快照/限制**：本轮修复⑤后成立（此前分组多行仅单行可写）；主字段映射按配置原样写入（空值含 null，不做隐式跳过，见 ADR-002 §5）。

### P2-05 A07 委托生效与聚合（缺证据）
- **对象/行为**：后台源岗位→受托岗位委托（ORG 范围）配置/启停/审计；POST 参与人解析经委托链到实际办理人；聚合会签按上一轮节点表单人员字段并集去重。
- **实际结果**：未启用委托时 POST 参与人任务落在源岗位（运维岗）持有者张三待办；配置委托（`sys_post_delegate`：src=运维岗、tgt=主管岗、ORG、ENABLED，API 回读）后新实例任务落在受托岗位持有者李四待办；停用后新实例重新解析回张三（合法新轮次重算）；同轮已生成任务保持原名单（批次项冻结与任务归属不回改）。聚合：`AggregateNodeFormParticipantResolverTest` 原断言（并集去重/失效整体拒绝/轮次偏移）＋委托解析/配置拒绝单测原断言。
- **原件/层级**：`raw/live/p64p2b-delegate.json`、`raw/db/post-delegate.txt`、`raw/unit/`；IT（实机 HTTP+PG）+ UNIT 原件。
- **快照/限制**：聚合会签本轮无实机多角色链（属阶段Ⅲ A09 场景；本阶段按单测原断言+解析器设计交付，如实登记）。

### P2-06 A12 升级与护栏（缺证据/范围覆盖）
- **对象/行为**：存量实例沿原义、新发布配置生效、启停/回退边界、深度/派发/累计护栏实际有效。
- **实际结果**：0.1.6→0.1.9 追加迁移、非空基线原义、六新表零写入沿用阶段Ⅰ锁定原件（未变，不重建）；本轮受影响项实机：新发布配置生效（UI 发布 v2 后新实例按 v2 派发回写）、委托启停边界（见 P2-05）、批次 BLOCKED/CANCELLED 处置语义（BLOCKED 可恢复结算、CANCELLED 停止写回推进权）、派发集合护栏（expected 与冻结一致、N=2 实机）、嵌套/根链护栏＝单测原断言（默认 3/硬 8、根链 1000）。
- **原件/层级**：`raw/gates/`、`raw/db/`、`raw/unit/`；阶段Ⅰ `evidence/phase1-07`（升级演练原件指针）；IT+UNIT。
- **快照/限制**：受影响模块复验（本轮 process 360/0、engine 109/0、链 19/0）；未变阶段Ⅰ矩阵不重跑。

### P2-07a 命令/断言/报告封装与 ADR（缺证据/快照关联）
- **对象/行为**：归档命令/退出/结果与关键断言/测试报告，标注最后产物快照；提供阶段Ⅱ ADR 可读指针。
- **实际结果**：`raw/gates/`（本轮 Web 四门与 Server 门禁摘要）、`raw/unit/`（编排/派发/等待翻译/聚合/委托 surefire 摘要）、`raw/db/`（PG 行级回读）、[ADR-002](../ready/adr-p64-002-phase2-personnel-parent-child.md)（D1—D7 决策、7 项修复、兼容窗口/回退责任、已知边界）；哈希清单工具生成并回读（32/32 OK），未复制全量源码。
- **原件/层级**：本目录 + ADR-002。
- **快照/限制**：命令原输出为文件摘要（关键断言在单测类内，摘要含用例名与结果）。

### P2-07b 三仓 Git 与 knowledge 覆盖（缺证据）
- **对象/行为**：三仓固定截止分支/HEAD/跟踪/远端与工作树原输出；knowledge-first 逐入口覆盖（阶段Ⅱ VERIFYING、整体 IN_PROGRESS、唯一动作＝回执02）。
- **实际结果**：`raw/git/{server,web,workspace}.txt`（截止时点：Server `8b5bb10`=origin、Web `fbfb44a`=origin、工作区见 §8 提交；工作树仅 `logs/` 未跟踪=本机证据留存）；knowledge 侧本轮逐入口更新（current-status/session-handoff/P64 功能登记/architecture）；ready 路由为审查01 轮 Planner 写入（VERIFYING/回执02）。根 Server gitlink `78495dc` 保持。
- **原件/层级**：`raw/git/`；GIT 原输出。
- **快照/限制**：回执自身 SHA 不循环；提交后 SHA 见 §8。

### P2-07c 验证任务与收尾（缺证据/生命周期）
- **对象/行为**：实机验证任务身份/有界工作量/结果/退出/自身清理与最终业务对象状态。
- **实际结果**：见 §6（后端 8080 多轮受控启停、前端 dev 5173、IAB 会话、脚本有界轮询；业务对象终态＝实例/批次/回写/委托行级回读；清理记录）。
- **原件/层级**：`raw/live/`、`raw/db/`；本机运行记录。
- **快照/限制**：验证库 `smart_workflow_p64p2c` 保留（不清库，供规划复核）；`logs/` 本机留存不提交 Git。

## 2. 本轮修改（相对回执01/审查01）

| 提交 | 内容 |
|---|---|
| Server `da11534` | 实机缺陷③：等待节点监听改类委托+静态桥接（含测试断言同步） |
| Server `86ae3fe` | 修复⑤：`V0.1.8` 增 `source_rows_json`；分组项冻结授权来源行集合、逐行回写（集合外拒绝）、派发预填子记录表格；编排+1/派发+1 用例 |
| Server `8b5bb10` | 修复⑥⑦：冲突恢复清空集合内冻结版本与主记录冻结守卫（按当前权威版本重放）；BLOCKED 批次全项成功后结算；编排+2 用例 |
| Web `fbfb44a` | 办理页节点表单表格按业务记录现值预填（无值才填、编辑不回退；去除行编辑内部键） |
| 工作区 | 审查01 归档与阶段Ⅱ VERIFYING knowledge-first 同步（`b54b1737`）；ADR-002、证据树 phase2-02、本回执（见 §8） |

## 3. 本轮命令与门禁（实跑原值，快照＝§5）

| 验证 | 命令 | 结果 |
|---|---|---|
| engine | `mvn -pl sw-biz/sw-bpm/sw-bpm-engine -am test -o` | **109/0/0/0** BUILD SUCCESS（缺陷③复验） |
| process | `mvn -pl sw-biz/sw-bpm/sw-bpm-process -am test -o` | **360/0/0/0**（基线 357 → +3：分组多行回写/预填、恢复版本清理、BLOCKED 重结算） |
| H2 全链+升级演练 | `mvn -pl sw-bootstrap -am test -Dtest='FlywayFullChainH2Test,I6G7UpgradeDrillH2Test,P64AppendMigrationUpgradePostgresTest'` | **19/0**（H2 17、I6G7 1、真实 PG 追加 1） |
| Web 四门 | `pnpm typecheck && pnpm lint && pnpm test && pnpm build` | typecheck exit0；lint **0 error/3 warning**；vitest **153 文件+1 跳过 / 1382 通过+3 跳过**；build ✓3.17s |
| 实机全链 | 见 §4 | 通过（含冲突→恢复→结算→父 APPROVED） |

## 4. 实机链证据（专用库 `smart_workflow_p64p2c`，Flyway 0.1.9，真实 HTTP+PG）

1. 场景：父表单（title+hosts[host_name,owner(USER),feedback]）/子表单（summary+owner_id+result_table[src_row_id,feedback]）/子流程（FORM_FIELD owner_id 选人）/父流程（node_ops→SUBFLOW_WAIT→node_review）+CHILD 动作（START_GROUPED owner、ALL、行级+主字段回写）；设计器 UI 发布 v2（含 mainFields）。
2. 派发冻结：父实例 `02434573…`（记录 `bb8652b2…`）→ 批次 `2108846864182882306`（expected=2、ALL）→ 两项冻结来源行（张三 2 行、李四 1 行）→ 子实例任务分别落张三/李四待办。
3. 多角色办理：张三（UI）填 2 行 → 子实例 APPROVED、项 WRITTEN（`writeback_json.rows` 两行）；李四（UI）填 1 行 + 汇总 → 行级已写、**主字段同字段版本冲突 → CONFLICT**（"回写与父记录当前版本冲突（当前权威版本 1）"）→ 批次 **BLOCKED**（不计成功）。
4. 有权恢复：`POST /workflow/child-items/{id}/retry-writeback`（admin）→ "回写已按当前版本应用" → 项 WRITTEN（主字段 title=李四汇总-主机03正常）→ 批次 **SETTLED 2/2（17:07:36）** → 等待节点推进 → 复核任务生成（单次）→ 复核通过 → 父 **APPROVED**。
5. 终态回读：父记录 title=`李四汇总-主机03正常`；父表 3 行 feedback=`host-01正常`/`host-02需复检`/`host-03正常`。
6. 委托实机：未启用→张三待办；启用（ORG/ENABLED）→李四待办；停用→新实例回张三。

## 5. 快照标注（最后产物）

- Server HEAD `8b5bb10`（含修复⑤⑥⑦；工作树除 `logs/` 未跟踪外干净）；Web HEAD `fbfb44a`（工作树干净）；工作区见 §8。
- 运行产物：后端以本快照源码 `mvn spring-boot:run` 运行（PID 记录见 §6）；验证库 `smart_workflow_p64p2c`（Flyway 17 迁移至 0.1.9）。
- 门禁/实机证据均取自上述快照（§3/§4 与 `raw/gates`、`raw/live`、`raw/db` 一致）。

## 6. 自身验证任务与收尾（P2-07c）

- 后端：`mvn -pl sw-bootstrap spring-boot:run -o`（会话内多轮受控启停：缺陷修复后各重启一次；每轮以端口/健康探测有界等待）。前端：dev server（5173，代理 /api→8080）。IAB 可见会话：登录/交互/截图（见 P2-02）。脚本：有界轮询（≤60s/步），无不可控后台任务。
- 业务对象终态：RUNNING 父实例=0（历史链全部终态化或废弃）；批次终态回读（SETTLED/BLOCKED/CANCELLED 语义）；委托关系 1 条 DISABLED；验证用户/岗位/部门保留（供复核）。
- 清理：旧后端进程树与旧 dev 会话已按 PID 精确停止；验证库与 `logs/` 本机留存（不删除取证数据，不提交 Git）；**收尾时点状态**：后端 8080 与前端 5173 进程为验证会话自身任务，按 P2-07c 要求登记（如规划复核需继续实机，可保持；否则按同一 PID 方式停止）。

## 7. 限制与边界（如实）

- 登录后页面视觉原件未取得（宿主截图面真实能力限制，错误与已穷尽路径已归档）；正式 A11 视觉层与窄屏像素原件待可用通道补采。
- 聚合会签本轮为单测原断言（无实机多角色链；属阶段Ⅲ A09 范围）。
- ANY/COUNT/NONE 与迟到/取消退回等负例为单测原断言+结果（审查01 允许）。
- 主字段映射空值按配置原样写入（不做隐式跳过）。

## 8. Git 与终态

- 三仓固定截止与提交：Server `da11534`→`86ae3fe`→`8b5bb10`、Web `fbfb44a`、工作区（本批次：ADR-002+证据树+回执02，SHA 以提交后回读为准）；均推送后远端回读一致。根 Server gitlink `78495dc` 保持不修改。
- Executor terminal：`EXECUTION_SUBMITTED`（自验通过，待规划独立验收）；不写功能 PASSED/COMPLETED、不核销 P 或计数、整体 P64 保持 IN_PROGRESS。
