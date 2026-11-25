# 1.2.0 第十九批执行回执（execution-120-19）——阶段 6 部署、复测与同步

日期：2026-11-25｜执行（Executor）｜依据 `planning-execution-prompt-120-06.md`

## 1. 部署（演示环境 8.166.112.85，先 Server 后 Web）

### 1.1 前置与备份

- 磁盘巡检：部署前 `/` 可用 **2.9G（<3G 门槛）**——按手册 §9.2「定期归档或清理陈旧 server.log」把 970M 轮转日志 `logs/server.log-20261125` 压缩为 20M，可用回到 **3.8G**，随后部署。仅清理轮转日志，未动业务数据。
- 备份（命名 `*_pre120`）：
  - DB：`/data/backup/smart_workflow_20261125_1647_pre120.dump`（pg_dump -Fc，1.4M）
  - 后端：`/opt/smart-workflow/server/bootstrap.jar.bak-pre120`（233M）
  - 前端：`/opt/smart-workflow/web.bak-pre120.tar.gz`（6.0M）

### 1.2 Server（Release `457783510` 资产）

- 上传 `bootstrap-1.2.0.jar` → `bootstrap.jar.new`，远端 sha256 `e565b010…b0d5b`（与 Release 资产一致）、244,277,265 B。
- `set -a && . ./server.env` → `stop.sh`（旧 PID 3755779）→ 换包 → `start.sh`（新 PID 3908879）。
- 启动结果：`Started StarterApplication in 175.078 seconds`；Tomcat 8080；启动段 **ERROR 0**；`/api/actuator/health` = `{"status":"UP"}`。
- Flyway：`Successfully applied 1 migration … now at version v1.2.0`；`flyway_schema_history` **36 行**，`max(version)=1.2.0`，最新行 `1.2.0 graph exec business link and loglevel menu` success。
- 版本：在跑 jar 内 `META-INF/production-build.properties` 实读 `build.version=1.2.0`。

### 1.3 Web（Release `457827301` 资产）

- 上传 `sw-web-dist-1.2.0.zip` → `/tmp/sw-web-120.zip`，解压后 `mv web web.bak-pre120`（目录备份；另有 §1.1 的 tar.gz）→ 替换 `web` → `chown -R root:root` → `nginx -t` 通过 → `nginx -s reload`。
- 入口：`/opt/smart-workflow/web/assets/` 为 `index-Cu2bpF9U.js`（与 Release 制品入口一致）。
- 核对（Host `chikaho.cn`）：HTTPS 根 **200**、`https://…/sw-server/api/actuator/health` **200**、HTTP 根/sw-server **301** 跳 HTTPS、`/sw/…` **301** 到根路径。

## 2. 复测（按方向 §4 阶段 6 + 提示 §3 增项；全部通过）

截图均在本机可见浏览器（chikaho.cn 直连）拍摄，1280×900 或 1280×720；登录身份为系统管理员（默认租户）或演示集团A `demo_a_hq_1`（张伟）；不写口令。图存 `.iso120/evidence/s6-*.png`，sha1 互不相同。

| 项 | 证据（sha1・时刻） | URL / 身份 | 结果 |
|---|---|---|---|
| E1 Graph 驱动条件分支 | `s6-e1-instance-trace.png`（`c3379a3`・18:59:02） | `/workflow/instances` → 实例详情；系统管理员 | 「1.2.0演示Graph流程」实例 `de858aaf-e8be-11f1-b313-00163e0d142f`：流程图高亮路径 START→Graph 执行器→评分分流→高侧人工确认；Graph 执行记录 `#2125544147878699009`（1.2.0演示透传图 v2、SUCCESS、197ms）；流转记录「高侧人工确认 进行中」，随后同意后实例 APPROVED。图执行输入/输出 `{"score":"high"}`（DB），流程变量 `field_score=high`（act_ru_variable） |
| E1-6 表单调用 | `s6-e1-6-form-action.png`（`f97d3e2`・20:30:31） | `/form/form-render/t120_ga_demo`；系统管理员 | 表单「1.2.0演示表单动作」按钮「透传回填」：标题=high → 点按钮 → 部门=high（Graph 出参回填）+「操作成功」 |
| E2 日志等级调整与恢复 | `s6-e2-logger-debug.png`（`9ba29c3`・18:09）、`s6-e2-logger-restored.png`（`923e881`・18:09:41） | `/system/log-level`；系统管理员 | `com.sw.ck.bpm` INFO→DEBUG（审计 18:01:51），同一实例列表请求 18:04:09 出现 `DEBUG … BpmInstanceController 实例列表查询: total=64`；恢复 DEBUG→INFO（审计 18:09:24），之后同一请求无 DEBUG 行 |
| E3-1 列表总数 | `s6-e3-1-exec-list-total.png`（`c4a2a0e`・18:13:51） | `/agent/executions/list`；系统管理员 | 「共 40 条」+ 4 页分页；DB `sw_agent_graph_execution` count=**40**，一致 |
| E3-3 历史行 | SQL 回读（无截图要求） | 演示库 smart_workflow | 改前：执行 `2121178715751251970`=WAITING_HUMAN、人工任务 `2121178716673998849`=CANCELLED、受理行 `2121178715000471554`=CANCELLED；`UPDATE 1` 后回读执行=CANCELLED（18:15:03），人工任务与受理行仍 CANCELLED。仅改这一行 |
| E4-1 非文本意见 | `s6-e41-consensus-fields.png`（`40f6617`・17:40:12） | `/workflow/task/77f525c8…`→审批详情→会签记录；系统管理员 | 分公司技术委员会会签 3 人：风险评级：中 · 影响系统清单：办公系统、营销系统 · 预计停机时长：300 分钟（240/300 亦同）；无 `DynamicData@`/对象串 |
| E4-2 已办 | `s6-e42-processed-detail.png`（`3c51a31`・17:21:25） | 工作台「已办 3」→查看；系统管理员 | 按钮为「查看」，打开只读任务详情（`/workflow/task/615036bb…?source=processed`），表单与流转记录正常 |
| E4-2 抄送 | `s6-e42-cc-tab.png`（`fd9fabd`・17:50:54）、`s6-e42-cc-detail.png`（`2f0262f`・17:52:28） | 工作台「抄送 11」→查看；演示集团A `demo_a_hq_1` | 行标题为流程名「灾备演练审批」；详情 `my-cc?copyId=2112391168250138625` 显示表单数据与流转记录（10-20 11:51 总公司科技部会签 已同意）。同页其余行因定义已删/改名回退「未命名流程」（兜底文案） |
| X1 回归 | `s6-x1-def-list.png`（`ee99794`・20:46:54） | `/workflow/defs`；系统管理员 | 新建并发布**普通流程**「1.2.0演示普通流程」（`bpm_c13d99a4e0b74ef3`，v1 PUBLISHED）与**带 Graph 执行器节点的流程**「1.2.0演示Graph流程」（`bpm_3e963b8c15244674`，v3 PUBLISHED，发布校验通过）；全程无 schema null |

### 2.1 复测配套数据（专门建，保留）

- Graph：`1.2.0演示透传图`（`2125536831309635585`，PUBLISHED v2，START(score)→END(score)）。
- 流程：`1.2.0演示普通流程`；`1.2.0演示Graph流程`（GRAPH_EXEC 绑透传图 v2，入参 score←表单 title，出参 field_score←score；条件 `field_score == 'high'` 命中→高侧人工确认，默认→结束）。
- 表单：`1.2.0演示表单动作`（`ce3ac02c-9cdc-4b32-bd8b-c54a5097a241`，按钮动作 `ga1demo`，入参 score←title、出参 dept←score）。
- 实例：`de858aaf-e8be-11f1-b313-00163e0d142f`（已 APPROVED）；图执行 `2125544148260380673`（SUCCESS）。
- 表单提交/动作产生的业务记录按表单机制落库，保留。

### 2.2 新发现登记（演示复测）

- **E1-6 表单动作配置雪花 ID 精度丢失**：表单定义中的 `graphActions.graphDefId` 在前端按 JS number 建模，>2^53 的雪花 id 经「设计器加载 → 发布写回」被四舍五入（`2125536831309635585`→`…600`），按钮动作报「图不存在或跨租户不可达」。现场以 `POST /form/def/{id}/publish-version` 携带精确定义绕开；建议登记修复（前端字符串建模或服务端 id 序列化策略）。另：表单设计器「Graph 动作」的版本下拉对已选 Graph 显示「无数据」（同一精度问题导致版本接口查的是被四舍五入的 id）。
- P80（抄送节点参与人不可在设计器配置）、P81（通知模板表单不能选事件/渠道）、P82（抄送详情操作人显示「审批人」）维持登记。

## 3. 同步

| 项 | 状态 |
|---|---|
| `version.json` | 已更新：`version=1.2.0`、`featureCount=60`（P67 第 59、P41 第 60，按方向默认口径，待规划裁决）、development PUBLISHED、发布/部署/回滚/manifest 段 1.2.0 |
| `CHANGELOG.md` | 已前置 1.2.0 条目（E1—E4、迁移、CI 修复链、制品、部署、复测、已知限制/新登记） |
| knowledge | `current-status.md`/`session-handoff.md` 顶部状态块更新为 1.2.0（发布事实、UAT 部署与复测、新登记、S7 待复核后清理） |
| 两仓 README | 版本字样 1.1.3→1.2.0（Server `8f447c88`→main `77d31603`；Web `0866918`→main `77e4816`，对应 Build & Release 均 success） |
| 需求池（规划维护，执行方列依据） | **P67**（Graph 作为执行器，1.2.0 第 59 功能）；**P41**（日志等级管理，第 60 功能）；**P74**（列表「共 N 条」根因修复，E3-1）；**P76**（意见非文本字段显示，E4-1）；**P77**（已办按钮/只读详情，E4-2）。依据：本回执 §2 各行 + `execution-120-17.md` §3/§4 + 方向 §3 验收。 |

## 4. 环境与清理（阶段 7 未开始）

- 演示环境除 E3-3 那一行外未改存量业务数据；测试数据为 §2.1 所列新对象。UAT110 表单中途加过动作后已恢复为无动作定义（`publish-version` v5，原始字段不变）。
- 演示环境当前：Server 1.2.0（PID 3908879）、Web 1.2.0、Flyway 36 行、磁盘 3.5G 可用（换包后）。
- iso120 隔离环境按提示保留至规划终审：**S7（删 `sw_iso120`/`sw_iso120_x1`、停 18093/5275/56379、停 18094 worktree 并删除）等待复核后执行**，届时回读库列表与端口一行确认。
- 临时文件：本机 `/tmp/rel120`（制品下载）与密钥临时文件已删；回执不写口令。

## 5. 自验结论

阶段 6 完成：演示环境 1.2.0 部署成功（版本/health/Flyway 36 行/入口/SW 跳转全部核对），方向 §4 阶段 6 的全部复测项与提示新增的 X1、E4-2 抄送全部通过，同步文件与两仓 README 已更新。**待规划阶段 7 复核；复核通过后执行 S7 清理并出最后一行确认。**
