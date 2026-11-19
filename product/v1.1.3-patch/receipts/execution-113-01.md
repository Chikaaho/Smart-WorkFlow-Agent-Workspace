# execution-113-01：1.1.3 补丁 阶段 3 验收（P72+P73）

方向 `product/v1.1.3-patch/ready/direction-v1.1.3.md`（L）｜执行｜2026-11-19｜Server `feature/1.1.3`（5f19d2d4、6770ff7b、583f1a38）、Web `feature/1.1.3`（169df9d）。隔离环境实测：PG 5433（iso113 专库，36 行迁移）、Redis 56379、Server 18093（dev profile）、Vite 5275（`--strictPort`，环境变量代理 18093）——iso112 环境（18093/5275/5433/56379）已确认清理，本轮全部重建，未连接本机任何现有库。

## 1. 开工三问（方向 §3）

1. **为什么恢复后旧行停在「等待人工」**：人工节点超时自动恢复走 `scanHumanTaskTimeouts` → 重派发 → `runSubgraph` 恢复轮。V3 的「恢复复用暂停前执行行」只做到了顶层执行（planning-review-110-02），`runSubgraph` 恢复轮无条件 `insert` 新子执行行——旧子行在暂停时就已写入（WAITING_HUMAN），恢复轮既不复用也不再写它，永远停在「等待人工」。
2. **为什么详情按执行编号打不开（404）**：列表行读 `sw_agent_graph_execution`（含子执行行），详情入口 `requireOwned` 只认受理簿（受理行 id / resultExecutionId）。子执行行两者都不匹配，且行上没有向受理行的回链字段入口被利用（parent_execution_id 存在但 get 未消费）——数据完整，是读取路径不认。
3. **修复改了什么**：两处都改。① `PauseState` 增加 `executionRowId`：人工暂停时把子执行行 id 写进暂停态（随 request.pauseStateJson 持久化），恢复轮凭它 `selectById` 复用同一行（置 RUNNING、轨迹续写时删除旧 WAITING 轨迹行、终态回写同行；行被人工删除时防御性新建）；② `get()/cancel()` 入参沿 `parent_execution_id` 回链（最多 3 跳）到顶层执行行再入受理簿，子执行行返回「受理号 + 子行」视图（状态/耗时/输出取子行）。

## 2. B1：人工超时自动恢复后假等待行 + 详情 404

### 代码（Server 5f19d2d4）

- `AgentGraphInterpreter.PauseState` + `executionRowId`；`AgentGraphExecutionServiceImpl.runSubgraph` 恢复复用分支、三终态 `persistNodeTraces(childId, traces, resumedChild)`、人工暂停写入行 id。
- `AgentGraphExecutionLifecycleServiceImpl`：`toChildDto`（子行视图 VO）、`executionRowIfChild` / `requestByChildExecutionRow`（回链）、`requireOwned` 第三回链 fallback；`cancel()` WAITING_HUMAN 分支与级联取消对子行调 `markWaitingNodesCancelled`（P73 见 §3）。
- 选型理由：不新建「子执行受理簿」也不改表结构，把 V3 已确立的「恢复复用暂停前执行行」原则扩展到子图层，暂停态本就随受理行持久化，复用键顺带解决跨重启（§2 实测第 3 组）。

### 隔离环境实测（全部 DOM 断言 + 视口截图，截图存 `.iso113/evidence/`，不入 Git）

新造「人工任务超时（8s）→ 自动恢复」实测 3 组 + kill 重启 1 组，执行行恒为每受理 2 行（父+子），无新增、无孤儿：

| 组 | 受理号 | 父执行行(E0)/子执行行 | 等待窗口内 | 恢复后 |
|---|---|---|---|---|
| 实拍 | 2123369933378695169 | 2123369933429026817 / 2123369933458386946 | 两行 WAITING_HUMAN（列表「等待人工」+待办有人工任务） | 同两行 SUCCESS，行数 8→8；待办清空 |
| 受理号取消前置轮 | 2123369742294593537 | 2123369742378479617 / 2123369742441394177 | — | 同两行 SUCCESS |
| 早期两轮 | 2123356779122798594、2123362877854724097 | （run1/run2，DB 断言） | — | 同两行 SUCCESS，旧 WAITING 轨迹 deleted=1，恢复轨迹 seq 续写 |
| kill -9 重启（等待中杀死） | 2123371450202697729 | 2123371450278195202 / 2123371450320138241 | kill 时两行 WAITING_HUMAN | 重启后超时扫描**复用同两行**恢复 SUCCESS（人工任务 TIMEOUT 收口），未产生旧行卡死 |

- **列表截图**：恢复前 `113-B1-during-waiting.png`（本轮两行「等待人工」，其余行全部「成功」）；恢复后 `113-B1-recovered-list.png`（同两行「成功」，无「等待人工」行，待办区「暂无待处理任务」）。
- **详情截图（都能打开，修复前子执行行 404）**：子图行 `113-B1-child-detail.png`（头部 `#2123362877942804482`、**受理号 #2123362877854724097**、人工任务「已超时」、轨迹 开始→人工处理→结束 全「成功」）；父图行 `113-B1-parent-detail.png`（轨迹「子图」节点成功，带「查看子执行 #2123362877942804482」入口——父子/恢复关系在详情可见）。
- 方向要求「恢复后旧行、新行详情页各一张」：修复后恢复轮**复用同一子执行行**，不再产生「旧行/新行」两行——上两张即该受理的两行（父+子）详情。
- **kill 重启说明**：WAITING_HUMAN 的暂停态是持久化设计（pauseStateJson 落库、任务 PENDING），跨重启等待继续有效，重启后由超时扫描按新代码复用原行恢复——这正是 P72 原始场景（重启后旧行卡死）的对照实测。`recover()` 的 INTERRUPTED 收尾覆盖 RUNNING/CANCEL_REQUESTED 受理行（内存线程已死、效果不可确认的场景，单测覆盖），不强行打断可恢复的持久等待。

### 旧数据行（演示环境，未动，提案待规划确认）

隔离库为新建库，无 1.1.2 时代旧行可纠正。演示环境 `sw_agent_graph_execution` 中可能存在的存量 WAITING_HUMAN 子执行行：修复代码不追溯改写历史行。提案——部署后按「parent_execution_id 非空 且 status=WAITING_HUMAN 且其受理行已终态」口径查询列行，经规划确认后将这些行置 INTERRUPTED 并补一句说明性文案（不删数据、不动演示环境其他内容）。本轮未执行任何演示环境数据改动。

## 3. B2：取消后节点轨迹仍显示「等待人工」（P73）

### 代码（同 5f19d2d4）

`cancel()` WAITING_HUMAN 分支与级联取消 `cancelChildWaitingExecutions` 对每个子行调用新增 `markWaitingNodesCancelled`：节点轨迹表 WAITING 行置 CANCELLED（含子执行行级联）。Web `NodeTrajectory.vue` STATUS_MAP 补 CANCELLED（已取消）/INTERRUPTED（已中断）中文映射（沿用 1.1.2 B3 文案键）。

### 实测：受理号、执行编号各取消一次，结果一致

| 取消方式 | 受理号 | 取消时状态 | 取消后 E0/子行 | 人工任务 |
|---|---|---|---|---|
| 受理号 2123370528823062530 | 同左 | 两行 WAITING_HUMAN | 同两行 CANCELLED（原地） | CANCELLED（关闭） |
| 执行编号（子执行行 2123370735610638338） | 2123370735535140866 | 两行 WAITING_HUMAN | 同两行 CANCELLED（原地） | CANCELLED（关闭） |

- 详情截图（滚动含节点轨迹）：受理号取消子行 `113-B2-cancel-by-request-child-detail.png`、父行 `113-B2-cancel-by-request-parent-detail.png`；执行编号取消子行 `113-B2-cancel-by-exec-id-child-detail.png`。三张画面一致：头部「已取消」，轨迹 人工处理/子图 节点显示「**已取消**」，无「等待人工」。
- 取消前待办截图 `113-B2-before-cancel-inbox.png`（待办含本轮人工任务）。

## 4. B3：发生时间格式

Web 169df9d：`ExecutionList.vue` 「发生时间」列走新增 `agent/utils/format-time.ts` `formatOccurredTime`（`yyyy-MM-dd HH:mm:ss`；空值 `-`；不可解析原文前 19 位兜底），收件箱时间同口径复用。截图 `113-B3-time-column.png`：列表时间列 `2026-11-19 19:02:58` 等格式正确，无 `T`/微秒。单测 3 例（ISO 两种、空值、兜底）。

## 5. 回归（用 B2 两次取消复测）

- **G1 取消后三处一致**：列表两行「已取消」（`113-G1G2-after-cancel-list.png`）与两张详情「已取消」一致。第三处「设计器入口」被既有问题阻断：图定义列表「更多→执行历史」跳 `/agent/executions/list?graphDefId=…` 显示 **0 行**（截图 `113-G1-designer-entry-precision-bug.png`）——`ExecutionList.vue` 以 `Number(route.query.graphDefId)` 转换雪花 ID 精度丢失（2123356778938249217→…9200），后端按错误 ID 过滤返回空。该转换由 955aa6e（2026-08-21，P7）引入，**与本补丁无关**，登记待排期（建议改走字符串透传）。受此影响入口显示 0 行，不存在「不一致显示」。
- **G2 取消后待办无残留**：两次取消后待办区「暂无待处理任务」（`113-G1G2-after-cancel-list.png` 顶部），DB 人工任务无 PENDING 残留（CANCELLED×2）。

## 6. 范围外发现（登记，不在本轮处理）

1. 上述 graphDefId 精度丢失（955aa6e 引入）。
2. 本会话浏览器会话令牌为内存态，整页刷新后 API 静默 401、页面不跳登录且列表显示「暂无数据」——重新登录即恢复，登记观察。

## 7. 门禁与 CI

| 门禁 | 结果 |
|---|---|
| Server 定向（agent 模块） | 93 tests / 0 failures / 0 errors（含新增 `AgentGraphExecutionLifecycleRecoveryTest` 4、`AgentGraphSubgraphExecutionRowReuseTest` 2，真实解释器反射跑 runSubgraph 验证恢复轮不 insert 新行） |
| Server `.last` 语料门禁 | LastLimitCorpusTest 135→136（新站点：`requestByChildExecutionRow` 的 LIMIT 1） |
| Web 四连 | typecheck 0 错、lint 0 错、test 2120 通过 +3 skip（新增 format-time 3、NodeTrajectory 追加 2）、build 通过 |
| Server 全量 `mvn test` | 未全绿：Phase4 PG 族 5 类（V0.2.5 "type vector does not exist"，远程证据库 8.166.112.85:3897 状态漂移）+ P61 zonky——经 `git stash -u` 在干净 develop 同样复现，**既有环境问题，与本补丁无关** |

- **测试侧解堵披露（6770ff7b）**：`StorageControllerAuthorizationTest` 在干净 develop 即失败——d0f82c46 治理批次把列表改走 PageConverter 后未桩 mock 返回 null 页 NPE。测试补空页桩（鉴权用例只关心状态码），单独提交。
- **启动回归修复披露（583f1a38）**：d53c7fb6 字段注入改造把 `BpmScriptRunner` 的 sharedEngine 从可选注入（1.1.2 单参构造器）改成必注字段，宿主无 Engine bean 时**全应用无法启动**（隔离环境实测发现）。改回 `@Autowired(required = false)`，单独提交。
- **CI 冲突登记（按用户 2026-11-19 裁定）**：方向 §4 要求回执附两仓功能分支 CI run 号 success；实际 build-release.yml 经 100ab622 收窄为**仅 main push 触发**，功能分支无法跑 CI。裁定口径：**只在合并时跑 CI**，CI run 号在阶段 4 合并 main 后取得并补记。请 Planner 验收时认可该替代口径。

## 8. 阶段 4—7 待办

合并 develop→main（CI run 号补记）→ 两仓 tag 1.1.3 + Release Latest + 版本号同批 → 部署演示环境（先 Server 后 Web、备份、≥3G 空间、health/Flyway 核对）→ 演示环境复测 B1/B2/B3 + 旧数据行提案执行 → 文档同步（version.json/CHANGELOG/knowledge/需求池 P72、P73 核销/README）→ Planner 复核后清理隔离环境、memory 记一行。
