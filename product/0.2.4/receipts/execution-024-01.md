# execution-024-01 — 实施方案与搭建对照表

2026-11-06｜Executor｜0.2.4 README 示例二、三（XL）｜方向：`product/0.2.4/ready/direction-024-readme-examples-2-3.md`

## 1. 总阶段

总 7 阶段：①评估已完成；②实施进行中；③验收同步、④feature→develop→main、⑤发布 0.2.4、⑥发布后同步、⑦结束均未开始。计数 1/1/5。

## 2. 前置动作完成情况

- 分支：Server `feature/024-readme-examples-2-3` @ `92bbe021`（develop）、Web 同名分支 @ `949fdb5`（develop）。Web `vite.config.ts` 在途改动随工作树保留，`smart_workflow_f1v4b`、用户 8080/5173 服务未触碰。
- **log 误提交处理**（Server commit `090d780f`，已推送、远端回读一致）：
  - `git rm --cached logs/` 取消跟踪 2,116 个文件（P64 时期 `e2fe50f7` 引入的 Chrome profile 缓存与验证产物）；本机 2,208 个文件全部保留。
  - `.gitignore` 追加 `logs/` 与 `*.crdownload`；`git check-ignore -v` 对 token 文本、Chrome Cookies、MANIFEST、png 四类样本均命中（`.gitignore:30:logs/`）。
  - `git ls-files logs/` = 0。
  - logs/ 之外核查：无其他运行期产物、浏览器 profile 被跟踪。
  - **凭据类文件清点（只数类型与数量，未读取、未外传内容）**：共 **48 个**——15 个 token 文本（`p64p2-api-token.txt`、`p64p2*-token-{admin,bing,ding,jia,lisi,yi,zhangsan}.txt`）+ 33 个 Chrome profile 凭据库（`Login Data` 6、`Login Data For Account` 2 及 journal 4、`Network/Cookies` 2 及 journal 2、`Trust Tokens` 4 及 journal 4、`Safe Browsing Cookies` 1 及 journal 1、`Login Data`-journal 2、Cookies-journal 2 等，按 r04/r05 两个 profile 目录分布）。**是否改写历史由 Owner 裁决；未经授权不改写历史、不强推**。这些文件已随本次取消跟踪，不再进入新提交。

## 3. 平台能力勘察结论（对照表事实基础）

| 能力 | 现状 | 证据位置 |
|---|---|---|
| 遥测接入 | 内嵌 MQTT broker（`MqttBrokerManager`）→ `MessageIngestService.ingest` → 属性/事件消息；`IotPropertyRecord` 按设备+属性+时间持久化 | `sw-basic-iot/service/MessageIngestService.java`、`mqtt/MqttBrokerManager.java` |
| IoT 事件规则 | `IotEventRule`（THRESHOLD/PROPERTY_CHANGED，conditionJson、防抖/冷却/连续次数）→ 生成 `IotProcessTrigger` → 领域事件 → BPM 自动发起流程（`formMappingJson` 映射表单数据） | `iot/service/RuleEngineService.java`、`IotProcessTriggerListener.java` |
| Agent 图执行 | 已发布图 `POST /agent/graph-defs/{id}/execute` 启动；执行与节点轨迹持久化（input、resultText、节点输出）；CONDITION/KNOWLEDGE/TOOL/LLM/LOOP/FORK/JOIN 节点 | `AgentGraphDefController`、`AgentGraphInterpreter`、`AgentGraphExecutionServiceImpl` |
| Agent 工具 | 内部工具（DB 白名单 `agent_tool_internal_config`，签名 `String execute(String)`）+ 外部工具（通用 HTTP，GET/POST/PUT，超时可配）；当前 DB 无种子工具、无既有 `execute(String)` bean | `AgentToolCallbackFactory.java` |
| 工单载体 | 平台无独立工单子系统；BPM 流程实例＋表单承载（示例一同款做法） | BPM 模块；示例一验收记录 |
| 通知渠道 | `NotifyChannel`：IN_APP/SMS/EMAIL/FEISHU/DINGTALK；IN_APP 站内信已有；EMAIL 渠道适配器已有（`sw.notify.channels.EMAIL.enabled=true` 门控，SMTP 经 `JavaMailSender`，收件人由服务端按同租户有效用户解析）；发送记录分渠道落库 | `notify/api/NotifyChannel.java`、`adapters/EmailNotifyChannelAdapter.java` |
| 业务配置 | 表单数据（动态宽表）＋表单数据权限页面可维护；知识库文档页面可维护（向量检索） | form/notify/knowledge 模块 |
| 前端页面 | agent（图编排/执行列表/执行详情）、iot（设备/规则/运行日志）、notify（渠道/发送）、workflow、form 模块页面齐备 | `src/modules/{agent,iot,notify}/views/` |

## 4. 搭建对照表（两个示例逐环节）

结论分类：**[配置]** 可直接配置；**[补能力]** 现有配置表达不了、需补通用能力（逐项写明原因）；**[修复]** 缺陷。

### 示例二（校园大门流量异常）

| 环节 | 对应能力 | 结论 |
|---|---|---|
| 事件进入：大门流量遥测（大门标识、时间窗口、实际流量） | IoT 产品/设备/属性＋内嵌 MQTT 上行→`IotPropertyRecord`；常态基线以 IoT 规则阈值表达 | **[配置]** |
| 手工发起研判 | Agent 图 `execute` API/页面手动执行已开放 | **[配置]** |
| 自动启动研判 | IoT 规则现有出站动作只有「发起流程」；无「启动 Agent 图执行」动作。研判主体是 Agent（方向指定 Agent graph 承载），经 BPM 绕行还需 BPM→Agent 桥，更大且不通用 | **[补能力①]** IoT 事件规则新增动作类型「启动已发布 Agent 图」：配置 agentGraphKey＋输入映射（遥测上下文→agent input）＋失败升级动作。落在 IoT 模块内，任何规则可配置，不写示例专用分支 |
| 内部检索：近期流程记录 | Agent 内部工具查近期流程实例/表单记录；当前无任何 `execute(String)` bean 与工具种子 | **[补能力②]** 新增通用内部工具 bean（查询近期流程/表单记录），经 DB 白名单注册 |
| 内部检索：知识库校园活动 | Agent KNOWLEDGE 节点（knowledgeBaseId） | **[配置]** |
| 联网搜索 | Agent 外部 HTTP 工具（白名单配置 URL/方法/超时）；真实供应商需 Owner 录入凭据，未提供时用可控对端验证 | **[配置]**（凭据属外部依赖） |
| 判定分支（特殊情况→P1；无正常解释→P0；失败即升级） | Agent LLM 节点＋CONDITION 节点；判定理由随节点输出持久化 | **[配置]**（「执行级失败→P0 升级」由补能力①的失败升级动作承接） |
| 发起 P0/P1 工单 | 工单=BPM 工单流程模板＋表单（级别/负责人/来源事件/处理状态）；Agent 内需有发起流程的工具，当前无 | **[补能力③]** 新增通用内部工具 bean（启动指定流程模板并写表单数据），经 DB 白名单注册 |
| P0 告警（站内信+邮件，分渠道记录） | NotifyFacade（IN_APP＋EMAIL）；Agent 内需有发送通知的工具，当前无 | **[补能力④]** 新增通用内部工具 bean（发送通知，渠道参数化），经 DB 白名单注册 |
| 事件↔研判实例互查 | Agent 执行 input 持久化遥测上下文；工单表单记录来源事件与 executionId | **[配置]**（依托补能力①③的映射） |
| 研判失败显式记录 | 执行记录 errorCategory/errorMessage 已有；失败升级动作同持久化 | **[配置]** |

### 示例三（MES 温度研判）

| 环节 | 对应能力 | 结论 |
|---|---|---|
| 业务用户页面维护阈值 75/80/85、窗口/斜率参数 | 业务配置表单（动态宽表）＋表单数据页＋数据权限 | **[配置]** |
| Agent 知识、输入样本页面维护 | 知识库文档页面；样本入知识库/配置表单 | **[配置]** |
| 温度遥测按设备+时间持久化、窗口回查 | `IotPropertyRecord`＋内嵌 MQTT 上行 | **[配置]** |
| >85℃ 确定性紧急告警（不依赖 LLM） | IoT THRESHOLD 规则→自动发起「紧急告警流程」BPM（既有链路） | **[配置]** |
| 80–85℃ 区间研判（短时→异常工单告警；缓升→仅记录） | IoT THRESHOLD 规则（80℃）→补能力①桥接启动研判 Agent；近期温度序列经输入映射注入；LLM＋样本判定；发工单/告警用补能力③④ | **[配置]**（依托补能力①③④） |
| LLM 不可用时 80–85 按异常 | 补能力①失败升级动作承接 | **[配置]** |
| 判定可追溯（输入序列、规则/样本、理由、动作、页面回查） | Agent 执行详情页（执行+节点轨迹）＋IoT 触发记录＋工单实例 | **[配置]** |
| 阈值配置驱动 IoT 规则/Agent | IoT 规则阈值在规则页配置、agent 输入映射取业务配置表单数据——两者均为页面配置；实现时如映射取数需要，通用查询工具（补能力②）可查配置表单 | **[配置]**（必要时依托补能力②） |

### 共同项

| 环节 | 对应能力 | 结论 |
|---|---|---|
| X-01 headed 浏览器业务角色配置并跑通 | 平台既有页面＋本次补能力的页面配置入口 | 实施后验证 |
| X-02 缺陷修复＋聚焦测试＋示例一受影响回归 | 共用能力（IoT 规则、通知、agent 工具）改动时做受影响验证 | 实施中执行 |
| X-03 权限与隔离负向验证 | 列级租户隔离＋表单/数据权限＋工具白名单租户过滤 | 实施后验证 |

## 5. 补能力清单（通用、可配置、非示例专用；均落现有模块内）

1. **IoT 事件规则「启动 Agent 图执行」动作**（Server sw-basic-iot）：规则增加 agent 图键＋输入映射＋失败升级动作（升级动作=发起指定流程模板并预置级别）。原因：IoT 规则现有唯一出站动作是发起流程，无法把遥测上下文交给 Agent 研判；研判主体按方向由 Agent graph 承载。任何规则的通用能力。
2. **Agent 内部工具：流程/表单记录查询**（Server）：按时间窗口/关键字查近期流程实例与表单记录，供研判内部检索。原因：`execute(String)` 白名单 bean 为空，内部检索无工具可用。
3. **Agent 内部工具：流程发起**（Server）：启动指定已发布流程模板并写入表单数据（级别、负责人、来源事件、executionId），返回实例标识。原因：P0/P1 工单是判定后的动作，Agent 内无发起流程工具。跨层经 SPI（接口定义 sw-basic-agent-api，实现由 sw-biz 提供，Spring 注入，遵守依赖铁律）。
4. **Agent 内部工具：通知发送**（Server）：按渠道（IN_APP/EMAIL）发送通知并返回分渠道发送结果。原因：P0 告警要求站内信+邮件两渠道分开记录，Agent 内无通知工具。
5. **Agent 内部工具：设备遥测序列查询**（Server，如示例三需要）：按设备/属性/时间窗查近期记录序列。原因：「短时/缓升」判定需要近期温度序列。
6. **Web：IoT 规则页动作配置扩展**：规则表单支持动作类型选择（发起流程/启动 Agent 图）、图选择器与输入映射、失败升级配置。

以上不新建独立业务子系统、不引入采购/签约供应商、不改变示例原意，未命中「需要 Owner 裁决」情形，按方向预授权推进。

## 6. 内部 Step

- Step 1（前置）：logs 误提交处理 —— **已完成**（§2）。
- Step 2（Server）：补能力①③④⑤（②并入③的实现批次）＋DB 迁移＋聚焦测试。
- Step 3（Web）：补能力⑥页面配置入口＋聚焦测试。
- Step 4：搭建示例二全部配置（IoT 产品/设备/连接/规则、知识库、工具白名单、研判 Agent 图、工单表单+流程）并跑通 S2-01～05。
- Step 5：搭建示例三全部配置（业务配置表单、温度遥测、85 紧急规则、80 研判规则+Agent 图）并跑通 S3-01～04。
- Step 6：X-01 headed 验收（S2 两支、S3 三支各实触一次）、X-02 修复+回归、X-03 负向验证。
- Step 7：回执汇总提交 Planner 验收。

## 7. 外部依赖与证据层级预案

- 联网搜索：真实供应商凭据由 Owner 页面录入（不读取不外传）；未提供前用可控对端验证并如实标注 `CONTROLED_PEER`；凭据到位后补跑真实链路。
- 邮件 SMTP：`sw.notify.channels.EMAIL.enabled` 未配置时以本地可控 SMTP 对端验证（`CONTROLED_PEER` 层级）；Owner 配置后补真实发送（`REAL_PROVIDER`）。
- headed 验收：正式流程浏览器证据 `headless=false`，截图入 `product/0.2.4/receipts/assets/`，记录 URL/身份/视口。
