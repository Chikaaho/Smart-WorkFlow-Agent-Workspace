# execution-024-02 — 示例二、三搭建验证与缺陷修复（自验提交，待规划验收）

2026-11-06｜Executor｜0.2.4（XL）｜方向 `product/0.2.4/ready/direction-024-readme-examples-2-3.md`｜证据层级：隔离实例 + 受控对端（CONTROLED_PEER），真实搜索/邮件供应商待 Owner 凭据后补跑。

## 0. 总阶段

总 7 阶段：①评估完成；②实施完成（本回执）；③验收同步、④feature→develop→main、⑤发布 0.2.4、⑥发布后同步、⑦结束 未开始。计数 **2/0/5**（阶段②以 Planner 验收结论为准；本回执为执行侧自验提交）。

## 1. 提交与分支

| 仓 | 分支 | 提交 | 内容 |
|---|---|---|---|
| Server | feature/024-readme-examples-2-3 | `090d780f` | logs/ 2116 文件取消跟踪 + 忽略规则 |
| Server | 同上 | `aae00a41` | IoT→Agent 桥（V0.2.8 迁移、AGENT 触发/失败升级监听、终态事件、内部工具 bean×3）＋聚焦测试 |
| Server | 同上 | `f0906a21` | 六处缺陷修复（见 §4）＋回归测试 |
| Web | feature/024-readme-examples-2-3 | `924ae7c` | 规则页 Agent 研判联动配置（开关/图选择/输入映射/失败升级，adapters 薄接缝）＋四连绿（231 文件 2020 通过+3 跳过、build 4.16s） |
| 本仓 | develop-sw | `00577c9a` | execution-024-01（方案+对照表） |
| 本仓 | develop-sw | 本回执 | execution-024-02 |

以上均推送并 `git ls-remote` 回读一致（Server `f0906a21`、Web `924ae7c6`）。Web `vite.config.ts` 在途改动未入库、未触碰。

## 2. 隔离环境（0.2.4，保留供复核/补跑，期间未触碰用户 8080/5173/f1v4b）

| 对象 | 值 |
|---|---|
| 数据库 | `smart_workflow_024_01`（从 0.2.3 隔离库 `smart_workflow_lc023_01` 模板克隆，Flyway 至 **V0.2.8**） |
| 后端 | `bootstrap-dev.jar`（feature 分支构建，dev profile），`http://127.0.0.1:18090`，context-path `/api`，health UP |
| 前端 | Vite dev `http://127.0.0.1:5176`（VITE_PROXY_TARGET=18090） |
| MQTT | Docker `mosquitto-024`（本机 1883，仅本机端口；设备遥测上行真实链路） |
| 受控对端 | LLM/Embeddings `:18900`（OpenAI 兼容，确定性脚本 + 256 维 hashing 向量）、联网搜索 `:18901`、SMTP 汇聚 `:1025`（aiosmtpd，落盘 `smtp-state.json`） |
| 配置 | `.runtime-lc024/`（local 配置、脚本、日志；不入 Git）；`SW_CIPHER_KEY` 取仓库 local 默认值（非业务秘密） |

## 3. 搭建对照表（最终版）与实例 ID

### 示例二（校园大门流量异常）

| 环节 | 实现（结论） | 实例 |
|---|---|---|
| 事件进入 | IoT 产品 `prod-campus-gate`/设备 `gate-main`（PUBLISHED），Topic `campus/gate/{deviceKey}/up` + 内嵌 MQTT 客户端订阅（修复后 `+` 通配），遥测 `{"properties":{"visitor_flow":N}}` 经 mosquitto 真实上行 **[配置]** | 连接 `2118458146383986690`、设备 `2118458149223530498` |
| 自动启动研判 | IoT 规则 `rule-gate-flow`（THRESHOLD GT 500，agentEnabled，映射 device/value/reportTime/ownerId/ticketTemplateKey）→ AGENT 触发→生命周期受理 **[补能力①]** | 触发如 `2118465253078577153`、`2118470122082410497` 族 |
| 手工发起 | `POST /agent/graph-defs/{id}/execute` + 执行历史页 **[配置]** | 图 `agent_3d199ad419804706`（v3） |
| 内部检索 | TOOL `查询近期流程记录` → 轨迹记录 `count/records`；KNOWLEDGE `校园活动知识库`（3 篇文档，pgvector 真实检索；未命中记录 `未检索到相关内容。`） **[配置+补能力②]** | KB `2118459248722575362` |
| 联网搜索 | 外部工具 `联网搜索`（GET 18901）真实调用；轨迹记录 summary（命中/无记录均显式） **[配置]**；真实供应商待 Owner 凭据 | 工具 `2118457594581352449` |
| 判定分支 | LLM → CONDITION（`SPECIAL_EVENT`→P1；默认→P0；`UNDECIDED` 落默认=P0） **[配置]**；执行失败→升级动作（见 §4-5） | — |
| P1 支 | **实测**：verdict `SPECIAL_EVENT: 检索与联网搜索命中近期公开活动记录` → 仅发起 P1 工单，未发告警（notify 计数 10→10） | 执行 `2118562002858196993`（SUCCESS）、工单实例 `agent-tool-p1-1793939517285` |
| P0 支 | **实测**：verdict `NO_EXPLANATION: 内部检索与联网搜索均未发现任何正常解释` → 发起 P0 工单 + 站内信+邮件分渠道记录 | 执行 `2118469137284997122`/`2118561574653313026`（SUCCESS）、工单 `agent-tool-p0-...`、通知 IN_APP SUCCESS / EMAIL SUCCESS（SMTP 对端收到真实邮件） |
| 工单 | BPM 表单 `ticket_gate_anomaly`（级别/负责人/来源事件/处理状态/研判执行ID）+ 流程 `bpm_67ecfca91b734804`（负责人处置节点，iotAccess） **[配置]** | 页面待办/已处理可回查（截图 03/04） |
| 失败即升级 | **实测**：LLM 不可用（对端停止）→ 执行 FAILED → 自动发起升级流程工单（`iot-esc-*` 实例 RUNNING） | 执行 `2118466473734221826`、`2118564287306842114` → 实例 `iot-esc-...` |

### 示例三（MES 温度研判）

| 环节 | 实现（结论） | 实例 |
|---|---|---|
| 业务配置 | 表单 `mes_judge_config`（常温/告警/停机阈值、窗口、斜率、样本说明，页面数据维护+表单权限） **[配置]**；Agent 知识/样本 = 知识库文档（页面维护、检索真实消费） | 表单 `16b17089-...`、KB `2118563020132106241` |
| 数据接入 | 设备 `mes-line1`（PUBLISHED）、Topic `factory/line1/{deviceKey}/temp/up`，属性 `temperature` 按设备+时间持久化（`sw_iot_property_record` 可按窗口回查） **[配置]** | 产品 `2118563019616206850`、设备 `2118563019872059394` |
| 缓慢上升（80–85） | **实测**：序列 79.0→80.5 → 判定 `SLOW_RISE: 窗口内温升 1.1℃` → 仅记录（0 工单、0 通知） | 执行 `2118563131180498946`（SUCCESS） |
| 快速上升（80–85） | **实测**：序列 78.0→84.5 → 判定 `RAPID_RISE: 窗口内温升 3.0/5.0℃` → 异常工单 + 站内信+邮件（两渠道 SUCCESS） | 执行 `2118563585960493058`/`2118563894199894017`、工单 `agent-tool-mes-1793939968174` |
| >85 停机 | **实测（确定性，不依赖 LLM）**：86.2℃ → IoT THRESHOLD 规则直接发起「停机紧急」流程；同窗口 **agent 执行数 0** | 触发 `2118564081198743554`（SUCCESS）、实例 `iot-2118564081198743554`（停机紧急） |
| LLM 不可用 | **实测**：对端停止时 81.5℃ → 执行 FAILED → 按异常升级发起工单（formData 级别=异常升级） | 执行 `2118564287306842114`、实例 `iot-2118564287306842114` |
| 可追溯 | 执行详情页（截图 02）展示输入序列、样本检索、判定理由、节点轨迹；无节点记录的边界见 §8 | 执行 `2118563894485106690` |

### 共同项

- **X-01（headed，`headless=false`，1440×900，身份 admin@tenant0，URL 见截图）**：登录成功；**规则页新建规则并启用 Agent 研判联动（图下拉已发布图、设备下拉、失败升级模板）→ 保存成功**（rule-mes-drill-ui，截图 01）；执行历史→详情轨迹（截图 02）；待办详情页填写意见→**同意办理**（截图 03/04，待办 15→14）；**站内信面板实际显示** `[P0] 校园大门流量异常告警`、`[异常] MES 温度快速上升告警`（截图 05）。截图存于 `product/0.2.4/receipts/assets/`（gitignore 忽略，本机留存）：`01-iot-rule-page-agent-linkage.png`（/iot/rules）、`02-agent-execution-trace.png`（/agent/executions/detail/2118563894485106690）、`03-ticket-detail-before-approve.png`、`04-ticket-approved.png`（/workspace/todo）、`05-inapp-alert-bell.png`。
- **X-02**：缺陷清单与修复见 §4（每个均有聚焦测试或真实行为链）。
- **X-03（跨租户负向，租户 9001 用户 demo_a_hq_1 vs 租户 0 数据）**：图列表 total=0、图详情/知识库/执行详情 **404**、IoT 规则 **403**、跨租户表单查询 **1500 表单不存在或未发布**；管理员对照可见。租户隔离由拦截器+显式条件共同保持。

## 4. 缺陷与补能力清单（X-02）

**补能力（通用，均落现有模块，提交 `aae00a41`）**
1. IoT 事件规则「启动已发布 Agent 图」动作：`agent_enabled/agent_graph_key/agent_input_mapping_json/agent_failure_template_key`（V0.2.8 双方言）+ 触发记录 `action_type/agent_graph_key/agent_execution_id`。
2. Agent 终态事件 + IoT 侧承接：执行 FAILED 且规则配置升级模板时，同事务生成 FLOW 触发（幂等键 `iot-esc-{executionId}`）并复用既有 IoT→流程链路；CANCELLED/INTERRUPTED 不自动升级（沿 0.2.3「停止自动重放、人工核实」语义）。
3. Agent 内部工具 bean：`AgentProcessStartTool`（发起流程，镜像 IoT 发起链）、`AgentProcessQueryTool`（近期流程记录）、`AgentNotifySendTool`（分渠道通知，Jackson），经 `/agent/tool` 白名单注册。

**缺陷修复（提交 `f0906a21`，均先红后绿或真实链路复验）**
1. **MQTT 订阅丢失**：订阅 `{deviceKey}` 时为字面量，设备向具体主题的发布永不命中 → 订阅过滤器展开为 `+`（`MqttBrokerManager.mqttFilterOf`，测试 `MqttTopicFilterTest`）。
2. **遥测租户上下文缺失**：MQTT 回调线程无登录态，I5 fail-closed 拒绝全部 ingest → 按连接归属租户还原系统身份（真实链路复验：message_log PARSED）。
3. **模板主题无法匹配**：`resolveTopicConfig` 不识别 `{deviceKey}` 段，PROPERTY 退化为 RAW → 同口径展开（真实链路复验）。
4. **IoT→流程/工具发起缺 tenantId 变量**：审批节点监听器 fail-closed「TenantId missing」→ IoT 监听器与流程发起工具补 `variables.tenantId`（真实链路：升级实例与工具工单实例均 RUNNING）。
5. **Agent 受理事务可见性竞态**：受理用 REQUIRED 时跨模块触发的 QUEUED 行在 dispatch 后仍不可见 → 工作线程 transition 恒失配（实测 Updates: 0 复现）→ 受理改 REQUIRES_NEW 独立提交后派发；桥接提交幂等键改紧凑派生键 `iotag-{triggerId}`（生命周期 100 字符上限）。
6. **通知渠道配置键位不可达**：`@ConfigurationProperties(prefix="sw.notify.channels")` 与字段 `channels` 同名使真实键位变为 `sw.notify.channels.channels.*`，按文档键位启用 EMAIL 后 `from=null`、每封邮件必败 → 前缀纠正为 `sw.notify`（测试 `NotifyChannelPropertiesBindingTest`）；适配器失败日志补异常消息。

## 5. 门禁与测试（原文位置）

- Server 修复批次聚焦测试：`mvn -q test -pl sw-basic/sw-basic-iot -am -Dtest='RuleEngineServiceTest,IotAgentBridgeTest,MqttTopicFilterTest'`、`-pl sw-biz/sw-bpm/sw-bpm-process -Dtest='AgentProcessStartToolTest,AgentProcessQueryToolTest,IotProcessTriggerListenerActionTypeTest'`、`-pl sw-basic/sw-basic-notify/sw-basic-notify-biz -Dtest='AgentNotifySendToolTest,NotifyChannelPropertiesBindingTest'`、`-pl sw-basic/sw-basic-agent -Dtest='AgentGraphExecutionLifecycleControlledTaskTest'` —— 全部 exit 0（各轮结果见执行日志）。**未运行 Server 全量 `mvn test`**：本批共享改动覆盖 iot/bpm/agent/notify 的聚焦类；全量门禁留给阶段③前按需补跑（如实记录）。
- Web 四连：`NODE_OPTIONS=2048 pnpm typecheck && lint && test && build` —— typecheck 0、lint 0 error、**231 文件 2020 通过+3 跳过**、build 4.16s exit 0。
- 迁移：`flyway_schema_history` 含 `0.2.8 iot agent bridge | t`（隔离库 18090 启动时应用）。
- 原始日志：`.runtime-lc024/server.log`、`peers.log`、`smtp-sink.log` 本机留存。

## 6. 示例一受影响回归（共用能力）

共用路径：IoT 遥测上行→规则→流程发起；通知站内信/邮件。本轮对上述路径的**真实链路回归**即示例一使用的同一机制：IoT 触发流程实例（iot-esc-*、停机紧急）均 RUNNING 且带 formData；IN_APP 站内信在页面可见；EMAIL 经 SMTP 对端收到。示例一的业务表单/流程本体位于用户库 f1v4b（未触碰），其专属重放不在本轮范围；如共享路径在阶段③复验中发现差异，按 X-02 处理。

## 7. 外部依赖与证据层级（如实）

- **受控对端（CONTROLED_PEER）**：LLM 判定（确定性脚本：检索/搜索结果驱动 SPECIAL/NO_EXPLANATION，序列斜率驱动 RAPID/SLOW）、Embeddings（hashing）、联网搜索（场景开关）、SMTP 汇聚（aiosmtpd 落盘）。判定分支的**接线、条件路由、工具调用、工单与双渠道告警均真实执行**；判定文本质量不代表真实模型能力。
- **待 Owner 凭据后补真实链路**：真实 LLM 供应商（页面录入）、真实联网搜索服务、真实 SMTP。SMS/电话未采购，按方向由站内信+邮件承接并登记待办（见 §9）。
- 未使用真实供应商，无任何秘密进入文件/回执/日志。

## 8. 已知边界与未纳入

- 执行详情页：0.2.2 执行实体的节点轨迹写入集中在执行成功后落库，失败执行仅记录请求级错误（真实行为，未改）；S3-04 的页面回查以成功执行为证。
- `rule-mes-drill-ui`（页面演示规则）保留为草稿状态，不影响已发布规则。
- 执行列表页无独立菜单项（代码路由 `/agent/executions/list` 由图列表/智能体首页入口进入；克隆库菜单集未含该行）——按现状使用，未改菜单数据。
- 冷却（60s）用于每场景单次触发取证；S3 首轮快速序列曾在冷却窗内被抑制（55s<60s），冷却后复触发成功（如实记录）。

## 9. 后续动作（供规划登记/裁决）

1. Planner 独立验收本回执与行为证据（如要求 Server 全量门禁，阶段③前补跑）。
2. Owner 提供真实搜索/邮件/LLM 凭据后，按同一规则与图补跑真实链路（无需改码）。
3. 短信、电话渠道登记为待办（未采购）。
4. 阶段③—⑦按方向与 §3.0 继续（feature→develop→main→0.2.4 发布→发布后同步→结束）。
