# 0.2.4 执行回执 04：示例一最小链、真实联网搜索与告警正文核实

2026-11-06｜Executor｜XL｜**VERIFYING**（提交 Planner 验收；未合并、未发布）

依据：`product/0.2.4/receipts/planning-execution-prompt-024-02.md`（当前唯一执行入口）。已锁定项未重验；本轮只做 X-02②、REAL-01、N-01，并因 REAL-01 修复了受影响的外部工具 GET 入参传递。

## 1. 代码变更

| 仓库 | 提交 | 内容 |
|---|---|---|
| Server | `8b65ae53` | 外部工具 GET 把入参 URL 编码追加到查询串（JDK `SimpleClientHttpRequestFactory` 忽略 GET body，搜索工具此前收到空查询）；使用 `URI.create` 避免二次编码；补真实 HTTP 用例（Agent 模块 351 tests 全绿） |

Web 无变更。隔离后端已按 `8b65ae53` 重建重启。

## 2. X-02② 示例一受影响最小链（完成）

按 0.1.9 已通过方向在隔离库 `smart_workflow_024_01` 重建最小链，未使用/未触碰 `f1v4b`，未部署 UAT。

| 对象 | 事实 |
|---|---|
| 表单 | `drill_readme_024`「灾备演练」（id `ae74dae3-3d53-4bd5-8363-5e819acc0ed2`，PUBLISHED；字段：演练时间/参与部门/演练范围/设备命令参数） |
| 流程 | `bpm_d32d8fea83f44651`「灾备演练审批（最小链）」（defId `2118619646725734401`，PUBLISHED；START→一级审批→抄送→END） |
| 绑定 | `sw_bpm_form_binding`（formKey→processKey，active） |
| 设备 | `drill-room-1`（id `2118619645874290690`，PUBLISHED；产品 `prod-drill-room` `2118619645509386242`；下行 Topic `drill/room/{deviceKey}/down`） |
| 预约配置 | `iot_device_action_json`：`enabled=true`、`deliveryMode=RESERVATION`、`deviceId=FIXED`、`commandKey=power_off`、`dueField=field_drill_time`、`timezoneId=Asia/Shanghai`、`lateWindowSeconds=600` |

实跑（API 提交表单 → 审批 → 抄送 → 到点预约下发）：

- 表单记录 `75c92e2c-3af0-4615-800e-dc255d65eea4`；流程实例 **`4d79de03-d9bb-11f1-aaaf-00ff9e2a8dfb`** 终态 **APPROVED**；
- 抄送：`sw_notify_message` id `2118620259643572225`，收件人 `92002`，事件 `COPY_CREATED`，**SUCCESS**；
- 预约：id `2118620260075585537`，状态 **DISPATCHED**，commandId `2118620919168516097`；
- 命令：`sw_iot_device_command` id `2118620919168516097`，状态 **SENT**，`power_off`，payload `{"power_off": true}`，sent_time `2026-11-06 16:26:03`；
- Broker 侧收到（mosquitto-024，`mosquitto_sub -C 1 -v`，原文保存 `.runtime-lc024/drill-down-command.txt`）：
  `drill/room/drill-room-1/down "{\"power_off\": true}"`。
- 搭建期首个实例 `10c76245-d9bb-11f1-aaaf-00ff9e2a8dfb` 因设备当时为 DRAFT 审批回滚，已发布设备后重跑并 **DISCARDED**，不混入验收证据。

## 3. REAL-01 真实联网搜索（完成）

- 使用 Owner 提供的 OpenRouter Key（仅存 `.runtime-lc024/scripts/openrouter-key.txt`，`.runtime-lc024/` 已 ignore；未进入提交/回执/日志/截图），模型选用低价 `mistralai/mistral-small-24b-instruct-2501:online`。
- 为不改动示例二图结构，只把外部工具 `联网搜索` 的 URL 临时切到本机 OpenRouter 适配器 `http://127.0.0.1:18902/search?q=`（适配器服务端持有 Key，返回真实 `url_citation`）；运行后已恢复为受控对端 URL。
- 示例二执行 **`2118617696818970626`**（触发 `2118617695141249025`，SUCCESS）的 `node_search` 轨迹（原文 `.runtime-lc024/real-search-trace.json`）：
  - 真实查询词：`校园大门 南大门闸机 访客流量 921 异常 近期活动 公告 原因`
  - 模型：`mistralai/mistral-small-24b-instruct-2501`（OpenRouter `:online`）
  - 真实来源 5 条，例如 `https://bdt.semi.ac.cn/swgk/contents/537/53474.html`、`https://net.njau.edu.cn/info/1038/5689.htm`、`https://bwc.czu.cn/2024/0628/c6731a143077/page.htm` 等；摘要含来源链接。
- 层级：**REAL_PROVIDER**（搜索与摘要由 OpenRouter 联网插件返回；检索轨迹中可见查询词与来源 URL）。

## 4. N-01 告警正文“机台=未知，时间 undefined”（结论）

- 来源：**受控对端脚本**，不是平台模板或参数映射。`.runtime-lc024/scripts/controlled-peers.cjs` 第 167 行在 MES 工具结果分支用 `extractFirstJson(all)` 取事件；MES 事件 JSON 含嵌套 `recentSeries`，该函数的非贪婪 `{"deviceName"…}` 匹配失败返回 null，于是 `ev2={}`，正文拼出 `未知/undefined`（第 172 行）。
- 平台侧把工具入参原样落库，不做二次拼装：同一次 S3 告警记录 `sw_notify_message` 的正文与工具 args 完全一致；示例二 P0 告警（同一通知工具、事件 JSON 可被脚本正确提取）正文为 `大门=南大门闸机，时间=2026-11-06T15:38:43…，流量=881…`，无 undefined。
- 关于“REAL-02 真实模型通知正文对照”：REAL-02 只切换了**判定节点**为真实模型，工单/告警动作节点仍为受控对端（现有真实模型图未改动作节点），因此不存在真实模型生成的告警正文；此处如实说明，不以受控文案冒充。平台模板/参数链路本身无缺陷，无需改平台代码；该项按“来源为受控脚本”收口。

## 5. 已锁定项受影响回归

- REAL-01 修复触及 Agent 外部工具 GET 路径：`AgentToolCallbackFactoryTest` 新增 GET 查询串用例，Agent 模块全量 **351 tests，0 failures/errors，BUILD SUCCESS**（`.runtime-lc024/gates-agent-2.log`）。
- 受控搜索对端 URL 已恢复；S2-03 的失败场景与 REAL-02 判定路径未改动。

## 6. 原始输出与证据位置（本机）

- `.runtime-lc024/real-search-trace.json`（REAL-01 轨迹：查询词/模型/摘要/来源）
- `.runtime-lc024/real-search-state.json`、`real-search-proxy.log`（无 Key）
- `.runtime-lc024/drill-down-command.txt`（broker 收到的下行命令原文）
- `.runtime-lc024/gates-agent-2.log`（Agent 351 绿）
- 隔离库按 §2/§3 的实例、命令、预约、通知 ID 可回查。

## 7. 边界

- 未触碰 `f1v4b`、用户 8080/5173、UAT；未改写 Git 历史；未调整权限粒度。
- OpenRouter Key 仅本机运行文件持有（已 ignore），未入库、未提交；如需长期保留可由 Owner 决定是否按模型 Provider 录入页面/密文入库。
- 示例一最小链只覆盖 Planner 指定的受影响路径（表单→一级审批→抄送→预约命令），未恢复会签/动态参与人。
