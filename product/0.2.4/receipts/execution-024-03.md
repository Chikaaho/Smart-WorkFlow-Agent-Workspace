# 0.2.4 执行回执 03：示例二/三剩余动作与真实链路

2026-11-06｜Executor｜XL｜**VERIFYING**（提交 Planner 验收；未合并、未发布）

依据：`product/0.2.4/ready/direction-024-readme-examples-2-3.md`、`product/0.2.4/receipts/planning-execution-prompt-024-01.md`、`product/0.2.4/receipts/planning-review-024-01.md`。本回执只覆盖补充提示列出的 REWORK/REAL 项；已锁定项未重验。

## 1. 代码与迁移（候选分支）

| 仓库 | 提交 | 内容 |
|---|---|---|
| Server `feature/024-readme-examples-2-3` | `984af5f3` | 失败升级通用配置（`agent_failure_config_json`：升级模板/表单补充字段/负责人双渠道通知，按 executionId 幂等一次）；渠道凭据 `config_cipher` 密文入库（AES-256-GCM，接口只写不回显，Email 适配器优先租户密文凭据、缺省回落 yml/env）；V0.2.9 PG/H2 镜像迁移 |
| Server | `40dc0f08` | 恢复调度：AGENT 的 FAILED 为执行终态不再按流程重投；PENDING 重投补齐 actionType/agentGraphKey/agentInput/ruleId |
| Server | `d54395e6` | 通知工具接受数字字符串形式的接收人 ID（页面 fixed 参数与模型工具参数均可能为字符串） |
| Web `feature/024-readme-examples-2-3` | `5d531ce` | IoT 规则页新增编辑动作；研判参数键值维护（保存合并为 fixed 条目）；失败升级配置 JSON 维护；非法 JSON 前端拦截 |

迁移：隔离库 `smart_workflow_024_01` 启动时应用 `V0.2.9__agent_failure_channel_secret.sql`（PG/H2 镜像，`flyway_schema_history` 已到 0.2.9）。

## 2. REWORK 项

### S2-03 联网搜索失败显式记录（完成）

- 受控搜索对端增加 `search_fail` 场景（HTTP 503 + 明确错误体）；示例二规则触发一次。
- 执行 `2118595998363193345`（生命周期 `2118595997054570497`）：`node_search` TOOL 节点 **FAILED**，错误 `503 Service Unavailable: {"success":false,"error":"controlled search peer unavailable (503 drill)"}`；执行终态 FAILED / `TOOL_CALL_FAILED`，**未进入 SPECIAL_EVENT/P1**。
- 失败升级：触发 `2118596001022382081`（FLOW，模板 `bpm_67ecfca91b734804`），实例 `dfabbe1e-d9ad-11f1-af78-00ff9e2a8dfb`（主题 GD-20261106-0016）；站内信 `2118596000200298497` 与邮件 `2118596000246435842` 均 SUCCESS（幂等键 `iot-fail-<executionId>-<channel>`）。

### S2-04 失败支：P0 工单 + 双渠道告警，单次一次（完成）

- 规则 `rule-gate-flow` 配置失败升级：`templateKey=bpm_67ecfca91b734804`，`formDataExtra.level=P0`，`notify={channels:[IN_APP,EMAIL],recipientId:1}`。
- LLM 对端 503 时执行 `2118597655423737858`（生命周期 `2118597654203195394`）FAILED；升级触发 `2118597658103898113`，实例 `cb274060-d9ae-11f1-95ca-00ff9e2a8dfb`（GD-20261106-0018），表单快照 `field_level=P0 / level=P0`。
- 通知记录：`iot-fail-2118597654203195394-IN_APP`、`-EMAIL` 各一条且 SUCCESS；同 executionId 未产生重复升级/通知（稳定幂等键）。

### S3-03 失败支：80–85℃ 且 LLM 不可用按“异常”升级（完成）

- 规则 `rule-mes-judge` 复用同一能力：`formDataExtra.level=异常` + 双渠道通知。
- 序列 78.1→81.7（81–84℃ 区间）触发执行 `2118598141841367041`（生命周期 `2118598141681983489`）FAILED（`模型服务暂时不可用`）；升级触发 `2118598142248214529`，实例 `0fe4c163-d9af-11f1-95ca-00ff9e2a8dfb`（GD-20261106-0019），表单 `field_level=异常 / level=异常`。
- 通知 `2118598142101413890`（IN_APP）、`2118598142130774017`（EMAIL）SUCCESS，单次各一条。
- >85 确定性链并行复验：触发 `2118598255595085826` → FLOW 实例 `20024646-d9af-11f1-95ca-00ff9e2a8dfb`；同一触发窗口 `sw_agent_graph_execution` 新增 **0** 条，Agent 未参与。

### S3-01 页面参数维护生效 + 同租户无权拒绝（完成）

- 驱动源核实：判定参数由 IoT 规则页“研判参数（键值）”维护，保存时写入 `agent_input_mapping_json` 的 `fixed` 字段，经 `{{input}}` 进入研判提示词；对端按 `slopeThreshold` 消费。本次将 `recentSeries.windowSeconds` 设为 60（使同一输入序列窗口可控），`slopeThreshold` 初值 2.0。
- 业务角色 `biz_ops_1` 在页面把 `slopeThreshold` 改为 **0.5** 并保存（截图 `024-03-s3-param-edit-biz.png`；DB 回读 `slopeThreshold=0.5`，`windowSeconds=60` 等非 fixed 映射保持不变）。
- 同一输入序列对照（78.9→80.1，窗口内温升约 1.2–1.9℃）：
  - 改前（阈值 2.0）：执行 `2118598470553165825`（生命周期 `2118598470393782273`），判定 `SLOW_RISE`（温升 1.9℃，未超过 2）。
  - 改后（阈值 0.5）：执行 `2118605629991018497`（生命周期 `2118605629768720386`），判定 `RAPID_RISE`（温升 1.2℃，超过 0.5），工单 `3804381d-d9b3-11f1-95ca-00ff9e2a8dfb`，IN_APP+EMAIL SUCCESS。
- 同租户无权限用户：新建 `biz_viewer_1`（租户 0，无角色）。`GET /iot/rules` 与 `PUT /iot/rules/{id}` 均 **403**（`errorKey=common.forbidden`，`eventRef=req-86ca131178b4605951d1d84a46961e91`）；业务角色同接口 200。

### S3-04 页面可追溯（完成）

headed（IAB，非 headless，1280×720；身份 `李工（业务运维）/biz_ops_1`；截图左下角标注 URL/身份/视口）存于 `product/0.2.4/receipts/assets/`（PNG 由仓库 `.gitignore` 忽略，本机留存）：

| 截图 | 内容 |
|---|---|
| `024-03-s3-04-success-trace-tools.png` | S3 成功执行 `2118608513151393793` 节点轨迹（RAPID_RISE、样本/输入） |
| `024-03-s3-04-success-tool-calls.png` / `-notify-result.png` | 节点 #5 工具动作：`发起工单流程` → `processInstanceId=d1b6ba0a-…`；`发送通知告警` → IN_APP/EMAIL 均 SUCCESS |
| `024-03-s3-04-s2-success-tool-calls.png` | S2 成功执行 `2118610833050198017`：P0 工单 `1bb666d9-d9b6-11f1-ad4e-00ff9e2a8dfb` + 双渠道 SUCCESS |
| `024-03-s3-04-failure-escalation-chain.png` | MES 触发记录页：LLM 不可用 FAILED 行 + `iot-esc-…` 升级行（实例 `0fe4c163…`） |
| `024-03-s3-04-failure-trigger-detail.png` | 失败触发详情 JSON（`agentExecutionId=2118598141681983489`、完整错误） |
| `024-03-s3-04-over85-stop-chain.png` | 停机规则触发记录：FLOW 实例 `20024646…`（>85 确定性链） |
| `024-03-s3-04-sample-hit-real-provider.png` / `-detail.png` | 知识样本命中 `mes-rapid-rise-sample.txt（0.201）` + 真实模型判定与 token |

### X-01 业务角色 headed 搭建/运行（完成）

- 角色 `9601 / biz_ops`（租户 0，非 admin）；用户 `92001 / biz_ops_1`（李工，业务运维）。授权菜单：流程/待办、智能体（含知识库读写所需 `agent:model:view/manage`）、物联网（`iot:view`、`iot:rule:manage`、`iot:product:manage`）。图/流程/表单沿用管理员已建版本（归属见本表）。
- headed 完成：S3 参数维护（`slopeThreshold 2.0→0.5`、负责人 `ownerId→92001`）、知识样本上传（`mes-biz-sample.txt`，可检索）、`rule-gate-flow` Agent 联动与失败升级配置保存并发布（停用→发布，截图 `024-03-x01-biz-rule-publish.png`）、工单办理（GD-20261106-0026 同意，完成于 15:38:17，截图 `024-03-x01-biz-ticket-processed.png`）。
- 该身份配置对象实际触发：S3 执行 `2118608512559996929`（RAPID，工单 `d1b6ba0a…`，通知双渠道 SUCCESS）；S2 执行 `2118610831489916929`（P0 工单 `1bb666d9…`，通知双渠道 SUCCESS）。知识样本截图 `024-03-x01-biz-knowledge-upload.png`。

### X-02 门禁、示例一回归与配置兼容

**① 受影响模块门禁（完成）**

- 首轮全量（`.runtime-lc024/gates-server.log`）：Agent 模块 `AgentOrchestrationServiceImplTest` 1 error —— 测试 DDL 将 `sw_agent_model.enabled` 建为 SMALLINT，而生产/H2 迁移均为 BOOLEAN，查询 `enabled=true` 触发 H2 类型不可比。属测试夹具与生产 DDL 漂移，已将测试 DDL 对齐 BOOLEAN。
- 第二轮（`.runtime-lc024/gates-server-2.log`）：Common/Security/Notify/Knowledge/Agent/IoT/BPM-API/BPM-Process 全 **SUCCESS**，`EXIT=0`。
- 通知工具接收人修复后复跑通知模块（`.runtime-lc024/gates-notify-2.log`）：**133 tests，0 failures/errors，BUILD SUCCESS**。

**② 示例一自有对象回归（阻塞，如实）**

- 工作区内无示例一应用导出包（0.2.2 应用整包导出物）；0.1.10 回执提到的 `sw_0110_run` 仍有「灾备演练」表单/流程，但该库 **无任何 IoT 设备/规则**（`sw_iot_device/sw_iot_event_rule` 均为 0），且 Flyway 历史含当前候选已不存在的 `0.1.7`，在候选上启动被校验拒绝（`Detected applied migration not resolved locally: 0.1.7`）。复制库尝试后已删除，未改动 `sw_0110_run`。
- 结论：无法在候选上以示例一**自己的对象**复跑 IoT→流程→通知。本轮共用链路的实跑证据为 S2/S3 的 IoT 触发、流程实例与双渠道通知（实例 ID 见 §2），但它不冒充示例一对象回归；该项保持阻塞，待提供 0.2.2 应用包或可升级的示例一源库。

**③ 部署/UAT `sw.notify.channels.*` 键位（完成）**

- 仓库内检索（yml/yaml/properties/env/md/sh）：除 `application.yml` 的 `sw.notify.enabled` 外，无任何 `sw.notify.channels.*` 键位，因此不存在需同步修改的部署/UAT 文件。
- 绑定回归 `NotifyChannelPropertiesBindingTest`：`sw.notify.channels.EMAIL.enabled/host/port/from` 正确绑定到 `NotifyChannelProperties.channels`；修正前缀后此前会被解析为 `channels.channels.*` 的键位恢复生效。外部 UAT 若存在仓外配置，需按同一键位核对（本回执不接触 UAT）。

## 3. 真实链路补跑

### REAL-02 真实大模型研判（完成）

- 使用库中 `verify-real-cc` 供应商（`https://api.commandcode.ai/provider/v1`，模型 `deepseek/deepseek-v4.1-flash`）创建两张真实模型图并临时切换规则（完成后已恢复原图 key）：
  - 示例二图 `agent_50b2fad6be134d00`：执行 `2118600263907532802`，真实输出 `NO_EXPLANATION：知识库与联网搜索均未发现…`，随后 P0 工单 + 双渠道通知（工具结果 SUCCESS）。
  - 示例三图 `agent_e79d8a59a16f458e`：执行 `2118600491763097601`，真实输出 `RAPID_RISE：…升温 5℃且远超斜率阈值 2.0…`，token 293/161；工单 `60b3bea0-d9b0-11f1-95ca-00ff9e2a8dfb`，IN_APP/EMAIL SUCCESS。
- 层级：**REAL_PROVIDER**（判定文本由真实模型生成；动作节点与工具链真实执行；联网搜索仍为受控对端，见 REAL-01）。

### REAL-03 真实 SMTP（完成）

- 按 Owner 指令将 163 SMTP 凭据经 `POST /notify/channels/EMAIL` 写入 `sw_notify_channel_config.config_cipher`（AES-256-GCM，与模型 Key 同口径），接口只回 `hasSecret=true`，明文不回显；**未进入任何提交/回执/日志/截图**，`.runtime-lc024/` 已加入 `.gitignore`。
- 真实 P0 告警：执行 `2118599004295127042` 的 P0 分支，EMAIL 记录 `2118599004899106818` SUCCESS（`external_message_id=smtp-402051609586000`）；适配器日志 `source=db`，即使用库内密文凭据而非 yml。回执只记“真实 SMTP（163）”，不写账号/授权码。

### REAL-01 真实联网搜索（阻塞，如实）

- 库中仅有 `verify-real-cc`（Command Code）一个真实供应商，无 OpenRouter 行。探测结果：
  - `deepseek/deepseek-v4.1-flash:online` → 400 `unsupported_model`；
  - `/provider/v1/search` → 404 未注册路由；
  - `gpt-6-luna`/`gpt-5.6-luna` Responses API 携带 `web_search`/`web_search_preview`/`tool_choice=required` → 200 但输出仅 `reasoning,message`，无 `web_search_call`（工具未执行，模型明确回答“无法实时检索网页”）；
  - Claude 系模型 → 403 `MODEL_NOT_IN_PLAN`。
- 结论：现有库内供应商无真实联网搜索能力，REAL-01 无法完成；未以受控对端或模型常识冒充真实搜索。S2-03 的搜索失败路径与受控搜索命中路径均已实测。

## 4. 证据层级与边界

- **REAL_PROVIDER**：REAL-02 判定、REAL-03 邮件投递。
- **CONTROLED_PEER**：搜索对端（normal/special/search_fail）、动作节点脚本、Embeddings、SMTP 汇聚对端（仅早期非 163 记录）。
- **配置/DB 事实**：执行/节点/触发/实例/通知记录均可在隔离库按上表 ID 回查。
- 已知边界：S3-04 失败链截图中的失败原因列在表格内截断，已用行详情 JSON 补足；业务角色为完成知识样本上传被授予 `agent:model:manage`（同时可管理模型，隔离环境授权，未做权限细分）；示例一对象回归阻塞（§2 X-02②）；REAL-01 阻塞（§3）。
- 未触碰 `f1v4b`、用户 8080/5173；UAT 未部署、未改动。

## 5. 原始输出位置（本机）

- Server 门禁：`.runtime-lc024/gates-server.log`（首轮，含 1 个 H2 夹具失败）、`gates-server-2.log`（全绿）、`gates-notify-2.log`（通知模块 133 绿）。
- 服务/对端日志：`.runtime-lc024/server-03.log`、`peers.log`、`smtp-sink.log`。
- 截图：`product/0.2.4/receipts/assets/024-03-*.png`（gitignore 忽略）。
