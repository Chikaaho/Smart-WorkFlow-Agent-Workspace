# Server 0.3.3 补丁第 1 步：影响核实（execution-033-02）

| 项目 | 内容 |
|---|---|
| 任务 | Server 0.3.3 智能体工具 `enabled` 整数绑定：第 1 步完整影响核实 |
| 依据 | `product/server-033-agent-tool-enabled-hotfix/ready/direction-server-033-hotfix.md` §2.1、§4；`product/uat-recovery-20261109/receipts/planning-review-uat-recovery-01.md` §3、§4 W1 |
| 日期 | 2026-11-09 |
| 执行角色 | Executor |
| 复现代码 | Server `de8ec017`（tag `0.3.2`）独立 worktree |
| 状态 | **第 1 步完成；结论：UAT 不受影响，建议停止 0.3.3** |
| 结论 | UAT `sw_agent_tool_internal/external.enabled` 实为 **BOOLEAN**，`V0.2.3` 已成功应用；UAT 校园 Agent 图的 TOOL 节点与 LLM 内部工具调用均已成功执行。`smallint = boolean` 只在把列人为改成 SMALLINT 后复现，不是 UAT 现状。按方向 §2.1 停在第 1 步，交 Planner/Owner 决定是否取消 0.3.3 |

## 1. 结论摘要

1. UAT 实际列类型是 `boolean`，不是 `smallint`：
   - `information_schema.columns` 两表均为 `boolean`/`bool`；
   - `flyway_schema_history` 中 `V0.2.3__f1_stage2_graph_snapshot.sql`（rank 29）成功，正是把 `enabled` 从 `SMALLINT` 转为 `BOOLEAN` 的迁移。
2. 用 `de8ec017` 在真实 PostgreSQL 空库执行完整迁移后，两表 `enabled` 也是 `boolean`；`enabled=true` 查询正常返回。
3. 只有把列人为改成 `SMALLINT` 后，同一接口才报
   `operator does not exist: smallint = boolean`。这证明缺陷取决于**旧列类型**，而 UAT 已完成类型迁移。
4. UAT 校园 Agent 图（`agent_c3d661f91bbf4569`）历史执行成功，包含
   `node_procq` TOOL、`node_search` TOOL、`node_p0` LLM 内部工具调用“发起工单流程”；
   这些路径正是 `toolExists` 与 `buildToolCallbacks` 的调用点，说明 UAT 实际走过且未报错。
5. 反向验证：在 PG `boolean` 列上执行 `enabled = 1` 会报
   `operator does not exist: boolean = integer`。因此**不能**把 P66 的 `1/0` 绑定直接移植到 0.3.2；否则会把 UAT 从“正常”改成“报错”。
6. 建议：取消 0.3.3 发版；如 Owner 仍要做跨库整数归一，放到 0.4.0，按数据库实际列类型做方言绑定，并补真实 PG 测试。P66 的 `1/0` 改动也需复核。

## 2. 复现环境与方法

| 项 | 值 |
|---|---|
| 代码 | `de8ec017` detached worktree `../.worktrees/sw033-de8ec017` |
| 构建 | `mvn -o -q -pl sw-bootstrap -am -DskipTests package` → `bootstrap.jar` 211M |
| 数据库 | 本机 Docker `postgres:18.4`，端口 5432，临时库 `sw033_repro` |
| 应用 | `java -jar bootstrap.jar --server.port=18080`，prod profile，Flyway 自动迁移到 `0.2.9` |
| 登录 | `/api/auth/challenge` + RSA-OAEP(SHA-256) + 验证码；仅本地临时库，凭据不记录 |
| 调用 | `GET /api/agent/tool/internal?pageNum=1&pageSize=10&enabled=true` |

复现库仅用于本次验证，验证后已停止应用并删除；未连接、未写入 UAT 数据库。

## 3. 复现结果

### 3.1 空库迁移后的真实 PostgreSQL：`enabled` 是 BOOLEAN，查询正常

```text
sw_agent_tool_internal.enabled  boolean
sw_agent_tool_external.enabled  boolean
```

插入一行 `enabled=true` 后调用启用过滤：

```json
{"code":0,"msg":"success","data":{"records":[{"id":"990001","name":"repro_tool","enabled":true}],"total":"1"}}
HTTP 200
```

结论：0.3.2 代码 + 真实 PG + 0.3.2 迁移链 = 无类型错误。

### 3.2 人为改成 SMALLINT 后才复现

```sql
ALTER TABLE sw_agent_tool_internal ALTER COLUMN enabled DROP DEFAULT;
ALTER TABLE sw_agent_tool_internal ALTER COLUMN enabled TYPE SMALLINT
  USING (CASE WHEN enabled THEN 1 ELSE 0 END);
ALTER TABLE sw_agent_tool_internal ALTER COLUMN enabled SET DEFAULT 1;
```

同一接口返回：

```text
HTTP 500
{"code":500,"msg":"系统暂时无法处理该请求...","errorKey":"common.system_error","eventRef":"req-92ac04651e1623a6c1fb8713aeaeefd5"}
```

PostgreSQL 日志：

```text
ERROR:  operator does not exist: smallint = boolean at character 85
HINT:   No operator matches the given name and argument types.
STATEMENT:  SELECT COUNT(*) AS total FROM sw_agent_tool_internal
            WHERE deleted = 0 AND (enabled = $1)
```

Java 栈关键帧：

```text
com.sw.ck.agent.service.impl.AgentToolConfigServiceImpl.pageInternalTools(AgentToolConfigServiceImpl.java:69)
org.postgresql.util.PSQLException: ERROR: operator does not exist: smallint = boolean
```

结论：`smallint = boolean` 可复现，但前提是**列仍为 SMALLINT**；UAT 不是这个前提。

### 3.3 反向验证：`1/0` 绑定会破坏 BOOLEAN 列

把列恢复为 `boolean` 后执行：

```sql
select count(*) from sw_agent_tool_internal where enabled = 1;
```

PostgreSQL 日志：

```text
ERROR:  operator does not exist: boolean = integer at character 59
STATEMENT:  select count(*) from sw_agent_tool_internal where enabled = 1
```

因此 P66 `26d0e8a7` 的 `1/0` 绑定若直接移植到 0.3.2，会在 UAT 的 `boolean` 列上产生同类错误。该点需 P66 复核（P66 的 PG `V0.2.3` 同样把列转为 BOOLEAN）。

## 4. UAT 实际证据（只读）

### 4.1 列类型与迁移

```text
sw_agent_tool_internal.enabled  boolean  bool
sw_agent_tool_external.enabled  boolean  bool

installed_rank 29 | 0.2.3 | V0.2.3__f1_stage2_graph_snapshot.sql | success=t
```

### 4.2 工具配置数据

```text
internal: 3 行，enabled=3
external: 1 行，enabled=1
```

三行内部工具为“发起工单流程 / 查询近期流程记录 / 发送通知告警”，一行为外部“联网搜索”。

### 4.3 Agent 图实际执行

校园图 `agent_c3d661f91bbf4569`（校园启闭门流量异常智能研判）有 `"type":"TOOL"` 节点；
执行 `2118916386716200961` 于 2026-11-07 12:00:08 成功：

| node_seq | node_id | 类型 | 状态 | 证据 |
|---:|---|---|---|---|
| 2 | `node_procq` | TOOL | SUCCESS | 内部工具“查询近期流程记录” |
| 5 | `node_search` | TOOL | SUCCESS | 外部工具“联网搜索” |
| 8 | `node_p0` | LLM | SUCCESS | `tool_calls` 含“发起工单流程”，内部工具实际调用 |

这些节点分别覆盖：
- `AgentGraphExecutionServiceImpl.toolExists` 内部/外部查询；
- `AgentToolCallbackFactory.buildToolCallbacks` 内部/外部查询与 LLM 工具回调。

UAT 在这些路径上成功完成，直接证明 `boolean` 列与 Boolean 绑定一致，不存在
`smallint = boolean`。

### 4.4 UAT 访问日志

只读统计 2026-11-08 00:00—2026-11-09 13:39：

```text
/api/agent  ACCESS 行 = 0
/api/agent/tool ACCESS 行 = 0
/api/form/integration ACCESS 行 = 0
```

说明管理端“智能体工具”页面与表单外部集成页面在该窗口未通过 HTTP 访问；
但 4.3 的图执行记录是更直接的后端路径证据。

## 5. 调用点映射

方向正文写“5 个类、10 处 `.eq(getEnabled, true/false)`”。实际清点：
**10 处 Boolean 字面量 + 2 处动态 `query.getEnabled()` = 12 处**。
P66 `26d0e8a7` 的 diff 也覆盖了这 12 处（该提交同时含大量换行符变化）。

| # | 代码位置（de8ec017） | 业务路径/入口 | UAT 是否走过 | 说明 |
|---:|---|---|---|---|
| 1 | `AgentExternalCapabilityFacade.java:53` | 表单外部能力列表（`FormDefServiceImpl:987`） | 未见 | ACCESS 0；布尔列下不会报错 |
| 2 | `AgentExternalCapabilityFacade.java:136` | 表单外部能力查找/执行（`FormIntegrationService:136`） | 未见 | 同上 |
| 3 | `AgentToolCallbackFactory.java:89` | Agent 图 LLM 工具回调构建（`AgentGraphInterpreter:583`、`AgentOrchestrationServiceImpl:128`） | **走过** | 校园图 `node_p0` 内部工具调用 SUCCESS |
| 4 | `AgentToolCallbackFactory.java:94` | 同上（外部工具） | **走过** | 构建回调时同时查外部表；布尔列正常 |
| 5 | `AgentGraphDebugServiceImpl.java:931` | 图调试/工具白名单校验（`:812`） | 未见 | 无 debug session 访问证据 |
| 6 | `AgentGraphDebugServiceImpl.java:938` | 同上（外部） | 未见 | 同上 |
| 7 | `AgentGraphExecutionServiceImpl.java:684` | 图执行 TOOL 节点白名单（`:525/:538`） | **走过** | `node_procq` TOOL SUCCESS |
| 8 | `AgentGraphExecutionServiceImpl.java:691` | 同上（外部） | **走过** | `node_search` TOOL SUCCESS |
| 9 | `AgentToolConfigServiceImpl.java:116` | 服务层 `listEnabledInternalTools` | 无生产调用方 | 仅接口/测试引用，当前为死代码 |
| 10 | `AgentToolConfigServiceImpl.java:182` | 服务层 `listEnabledExternalTools` | 无生产调用方 | 同上 |
| 11 | `AgentToolConfigServiceImpl.java:66-67` | 管理端内部工具列表启用筛选（`AgentToolConfigController:46`） | 未见 | `/api/agent/tool` ACCESS 0 |
| 12 | `AgentToolConfigServiceImpl.java:131-132` | 管理端外部工具列表启用筛选（`AgentToolConfigController:93`） | 未见 | 同上 |

结论：真正可能被 UAT 三示例流程触发的 3/4/7/8 已实际成功执行；其余路径要么未见访问，
要么当前无生产调用方。没有任何一条在 UAT 现状下报 `smallint = boolean`。

## 6. UAT 恢复 W1：PM2 整体移除后的影响确认

- 删除前 `pm2 list` 输出未留存；无法事后补打（PM2 daemon 已停止，`/root/.pm2` 已删除）。
  本项如实记录为证据缺口。
- 删除后回读：
  - `pm2-root`：`disabled` / `inactive`；`/root/.pm2` 不存在；
  - `journalctl -u pm2-root`：2026-11-09 13:21:41 启动后显示 **“No process found”**，
    随后 “All Applications Stopped / PM2 Daemon Stopped”；
  - `systemctl --failed`：无失败单元；
  - 当前监听端口：80/443/3897（nginx）、22（sshd）、1883（mosquitto）、5433（postgres）、
    6379（redis）、7890（mihomo）、45535（frps）、8080（java 后端）；
  - 当前 Node 进程只有 Codex harness（`codex app-server`），没有其他 PM2 托管应用。
- 结论：现有证据支持“PM2 只托管 reasonix，移除后没有其他服务停止”；因缺少删除前
  `pm2 list` 原件，W1 以“已核实、附证据缺口”关闭，供 Planner 判断是否还需要 Owner 补证。

## 7. 判定与建议

1. 按方向 §2.1，第 1 步已满足停止条件：**UAT 不受影响**。不进入第 2—6 步，
   不创建 `hotfix/0.3.3-agent-tool-enabled`，不打 tag、不发 Release、不部署 UAT。
2. 建议 Planner 报告 Owner：**取消 0.3.3 补丁**；UAT 维持 0.3.2。
3. 若 Owner 仍希望统一“整数 enabled”语义，应放到 0.4.0：
   - 先决定每个方言的列类型（PG 保持 BOOLEAN 或全库统一 SMALLINT，但不能只改代码）；
   - 绑定值必须与列类型一致：BOOLEAN 列用 `true/false`，SMALLINT 列用 `1/0`；
   - 补真实 PG 集成测试覆盖 12 处查询，而不是只跑 H2/单测。
4. **P66 风险**：`26d0e8a7` 的 `1/0` 绑定与 P66 PG `V0.2.3` 的 BOOLEAN 列不一致；
   需在 0.4.0 合并前复核，否则 0.4.0 上智能体工具查询可能出现
   `boolean = integer`。本回执仅报告，不修改 P66 分支。

## 8. 约束与证据

- UAT 仅执行 `SELECT`/日志读取；未写 UAT 数据库、未改 UAT 服务。
- 本机复现只写临时库 `sw033_repro`，验证后已删除；未改 Server 仓库代码。
- 未强推、未改 tag、未发布；凭据未写入本回执。
- 本机证据目录（未提交 Git）：

```text
E:/code/Smart-WorkFlow-Agent-Evidence/sw033/
  sw033-repro.log
  challenge.json
  login-response.json
  page-internal-boolean.txt
  page-internal-smallint.txt
  pg-smallint-error.txt
  uat-agent-tool-schema.txt
  uat-agent-graph-execution.txt
  uat-agent-access-counts.txt
  uat-w1-pm2.txt
```
