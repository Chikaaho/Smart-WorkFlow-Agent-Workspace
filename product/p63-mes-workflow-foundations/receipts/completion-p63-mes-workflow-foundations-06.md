# P63 完成回执06：审查05剩余10项处置与自验

2026-10-08；执行（Executor）。输入=审查05、提示05、主方向、acceptance-05 及其已锁定事实。本轮处置审查05唯一剩余账本 10 项（G01a/G03a/G04a/G04b/G06a/G08a/G08b/G09a/G10a/G10b），证据根 `receipts/evidence/acceptance-06/`（10 包 + raw/ 原件 + browser/ 视觉制品）。**自验通过，待规划验收；P63 保持 VERIFYING，核销数 10/20 与剩余口径以 Planner 裁决为准。**

## 1. 概要与三项范围裁决执行

- **功能权威**（审查05§4-1）：既有设备产品已发布物模型权威（`sw_iot_product.published_model_id` → `sw_iot_thing_model` PUBLISHED）接入预约冻结（createIntent）与到点下发（DispatchJob）双接缝，沿真实模型结构 properties/actions 按 id 解析；缺模型/未发布/未声明/类型未知一律 fail closed。未另建功能库、未改立即通道。
- **旧条件路径**（§4-2）：完整生产注册链（processDefService 真实发布 + 真实 bpmBranchConditionEvaluator）实证命中/不命中原路由；上轮失败确证为测试装置问题。
- **立即 MQTT**（§4-3）：查用既有本地能力路径（Node aedes 受控隔离 broker，18830 隔离端口，任务自有进程+PID+健康探针+实际退出），A6 原通道真实发布/实际接收，未改 A6 合同、未部署长期服务。

## 2. 实际读取与修改

**Server（develop，候选 `520bfb9`）**
- `sw-basic-iot`：新增 `config/IotClockConfig`（Clock 装配，ConditionalOnMissingBean）；`IotDeviceService(+Impl)` 新增 `validatePublishedFunction`；`IotCommandReservationFacadeImpl`（冻结前功能校验+Clock）；`IotReservationDispatchJob`（认领先窗后守卫、到点功能重核、Clock、命令 expiryTime 系统时区口径）；`util/DeferredControlUtil`（sendCommand 过期守卫+Clock）。
- `sw-bpm-engine`：`ApprovalUserTaskTranslator`（DESIGNATED/FIXED_USER 写死 assignee 前按发布者租户权威校验——修复跨租户审批人缺口）。
- 测试：`P63FunctionAuthorityWindowPgTest`（新，8例）、`P63LegacyConditionPathPgTest`（新，2例）、`P63ImmediateMqttBrokerPgTest`（新，2例）、Boundary/Unknown/IntentTx 种子补齐（产品+已发布物模型）、`P63DynamicRoundBindingTest`/`ConsensusCompletionEvaluatorTest`/`ConsensusVoteConcurrencyTest`/`P63DynamicParallelV2Test` 实际值 EV 输出、单测构造点适配。
- 批次：`e1c1b5d`（审查05修复）→ `bd4631a`（G04 证据）→ `ab3293d`（G09a）→ `520bfb9`（G10a），全部推送远端读回一致（520bfb997883）。

**Web（develop，候选 `f6a76e5`）**
- `node-capabilities.ts`：动态并行新配置 invalidStrategy 缺省 SKIP→**BLOCK**（旧快照显式 SKIP 回显不变）；`ProcessDesigner.vue`：参与人主字段/表格列与动态并行来源改**已发布 schema 字段选择器**（api 新增 `publishedFormDefinition`）+ type-only 导入修复（`da0ed78`）。
- `ProcessInstanceList.vue`：实例详情抽屉窄屏全宽（375 不溢出）+ 历史表横向滚动容器；`IotDeviceList.vue`：设备命令抽屉窄屏全宽 + 命令表横向滚动容器。
- 批次：`3eaa25b` → `25c4da2` → `da0ed78` → `e69aaa6` → `edc73fb` → `f6a76e5`，推送读回一致（f6a76e532505；da0ed78 首推遇远端 5xx 由后续推送捎带）。

## 3. 门禁原值（最终候选树实跑）

| 门禁 | 结果 |
|---|---|
| Server engine | 76/0/0/0 exit 0 |
| Server iot | 63/0/0/0 exit 0 |
| Server process | 266/0/0/0 exit 0 |
| Server bootstrap（全量） | Tests run 284 / Failures 2 / Errors 0 / **Skipped 27**；P63 全部 8 类 31 例全绿。首败 2 例均非 P63：①`P62CompatRollbackPgTest`（全量负载“命令未被领取”）隔离复跑两次 2/0 PASS——负载型 flake；②`Phase4PgStartWindowCrashTest.scheduledFlowWindowCrashRecoversToExactlyOnce`（expected 1 was 0）隔离复跑三次均败，且**上轮候选 92238ad 工作树对照同败**——非本轮候选回归，属既有/环境问题，原样保留并上报（封装 `raw/gate-bootstrap-final.md`） |
| Web 四门 | typecheck exit 0；lint **0 errors/76 warnings**；vitest **1364 passed+3 skipped**（151 文件+1 skipped）；build exit 0（1.88s）——`raw/web-gate-*.md` |

## 4. 剩余 10 项逐项结论（详见 acceptance-06 各包）

| ID | 结论 | 关键证据 |
|---|---|---|
| G01a | 设计器三节点经已发布 schema 选择器真实绑定+连线+校验0错误+发布 | browser/ 三面板图；发布 toast 原文 |
| G03a | 功能权威双接缝 fail-closed 8/0；latest 本人正/他负/跨租负零副作用；跨租审批人发布拒绝零任务 | raw/p63-ev-lines §FunctionAuthorityWindow |
| G04a | 动态轮次/快照实际值（首次 newRounds=1 reuse=2；重入 newRounds=2 旧轮 SUPERSEDED 保留） | raw/p63-ev-lines §DynamicRoundBinding |
| G04b | 票数/分母/阈值/双方返回/汇聚数实际值+异常分支+缺省 BLOCK 修复 | raw/p63-ev-lines §Evaluator/§Concurrency/§V2；Web 3eaa25b |
| G06a | 受控时钟贯穿真实入口：对账先/认领先/窗外发送三边界零外发不复活 | raw/p63-ev-lines §FunctionAuthorityWindow |
| G08a | 新 def headed 发起+多身份（92002/92003）+原请求索引+命令 SUCCESS 链 | browser/ 2 图；raw/db-readback+access-lines+peer jsonl |
| G08b | 375 真实滚动：历史（审批节点/审批人）与命令（状态/结果/关联实例）全部入视口（2 处真实障碍 UI 修复） | browser/ 4 窄屏图；Web e69aaa6/edc73fb/f6a76e5 |
| G09a | 生产注册链命中/不命中原路由+v1 冻结逐字符等值+未知属性保留 | raw/p63-ev-lines §LegacyConditionPath |
| G10a | 受控隔离 broker 实际接收 BROKER_ACK+审计+零预约；迁移基点三文件 Git 原结果 | raw/mqtt jsonl+migration-git.txt |
| G10b | 转录更正（27 skipped/最终 lint·build/时点归属）+候选绑定+远端读回+knowledge 原值+收尾原件 | 本回执 §3/§6 + raw/ 门禁封装 |

## 5. 与方向的偏差与登记

1. **立即路径事实**：普通（非 IoT 触发）流程成功事件的“既有立即下发”在当前代码中无接缝（仅 IoT 触发链 A6 + 本轮预约链）；v1 实例（d4bb17d7）因此零设备命令——如实登记，未扩范围。IMMEDIATE 立即外发的正向由 G10a 受控 broker 测试（真实 dispatch 入口）承担。
2. **bootstrap 既有失败**：Phase4 崩溃恢复用例非本轮回归（上轮候选对照同败），移交 Planner 裁决归属；P62CompatRollback 为负载 flake（隔离 2/0）。
3. 设备动作端点需 `{"action":{…}}` 包裹（此前轮次写法未生效）——采集事实更正。
4. 表单设计器子表盖层保存曾致主列表丢失（开发过程发现，经 UI 重排+真实发布修复；本轮回显以 DB/定义端点原件为准）——提请知悉的 UI 瑕疵，未顺手扩修。

## 6. 收尾（真实结果）

- 进程：后端 PID 96875、对端 89930/89931、MQTT broker 93583、vite 421 均按精确 PID kill；端口 8080/9777/9778/18830/18831/5173 回读全 0。
- 隔离库：`sw_p63_accept3` dropdb 成功，列表回读 0 命中。
- /tmp：p63ev、p63-mqtt、cp/env/relaunch/graph/formdef 及全部历史 p63 文件删除，回读 0。
- 浏览器：本轮 IAB 标签关闭，回读 0。

## 7. 验收集合声明

本轮验证集合（不替换跨批次正式基线）：Server engine 76/iot 63/process 266/bootstrap 全量 284（含 27 skip；2 旧败处置如 §3）+ 新增 PG 测试 12 例；Web 四门 1364+3。功能 46、清单 46/22/22、ADV64 不变；P63 VERIFYING 未核销；未进入阶段三；无发布/部署。

自验结论：**自验通过，待规划验收**。
