# 交付回执：原生 MQTT 设备控制通道 + 提交后探测与提示收敛（执行自验）

> 回执类型：Executor completion receipt（L 级批次；对应 Owner 2026-10-19 直接指令：①原生 MQTT 本应支持，只支持腾讯 IoT 是缺陷；②提交成功文案瘦身；③加单独接口）
> 分支：Server `fix/iot-native-mqtt-submit-detect`、Web `fix/submit-detect-copy`（均自 develop，尚未合并）
> 状态：实现完成并自验通过，待 Owner/Planner 验收；发布版本待 Owner 确认（本回执不含发布动作）

## 1. 范围与目标

| 项 | 目标 | 交付 |
|---|---|---|
| A | 原生 MQTT 连接上的设备可被流程驱动控制（预约/延迟语义），不再因「只装配腾讯云 provider」而 fail closed | Server 代码 + 测试 |
| B | 表单提交成功提示收敛为单一「提交成功」（去掉两态长文案） | Web 文案 + 弹层 + 测试 |
| C | 提交后实例探测改走用户态端点（普通发起人不再 403 导致提示错判） | Server 端点 + Web adapter + 测试 |

## 2. 实际改动文件

### Server（`Smart-WorkFlow-aPaaS-server/`，分支 fix/iot-native-mqtt-submit-detect）

| 文件 | 改动摘要 |
|---|---|
| `sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/mqtt/MqttDownlinkPublisher.java` | **新增**：自建 MQTT 下行通道组件——按设备连接解析（启用且 `conn_type=MQTT`）、下行主题（`DOWN`/`BOTH` 首条启用行，`{deviceKey}` 替换）、按需拉起常驻连接（复用连接服务的凭据解密与订阅恢复）、真实发布并回传 Broker 确认/QoS/消息号；通道缺失显式失败 |
| `sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/util/DeferredControlUtil.java` | 通道选择按设备承载连接路由：MQTT 设备 → `sendViaMqtt`（markSending→发布→Broker 确认才 markSent，未确认/异常记可重试失败）；非 MQTT 设备保持 provider 路径；入队前守卫由 `requireProvider` 改为 `requireChannel(device)`；新建命令补 `tenant_id`（调度线程可解析设备）；新增 `MQTT_NO_BROKER_ACK_REASON` |
| `sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/service/IotDeviceService.java` / `impl/IotDeviceServiceImpl.java` | 新增 `getByDeviceKeyForTenant(tenantId, deviceKey)`（显式租户 + 挂起租户拦截器，供无登录态的调度线程解析设备行） |
| `sw-biz/sw-bpm/sw-bpm-process/.../controller/BpmMyInstanceController.java` | 新增 `GET /workflow/my/instances/count?formKey=&businessKey=`（用户态；发起人强制=当前用户；无 @PreAuthorize，普通用户可用） |
| `sw-biz/sw-bpm/sw-bpm-process/.../service/BpmInstanceService.java` / `impl/BpmInstanceServiceImpl.java` | 新增 `countByFormKeyAndBusinessKeyAndInitiator(...)`（缺参/缺发起人恒 0，不落入全量统计） |
| 测试 | `DeferredControlUtilTest`（5→8 例，新增 MQTT 正向/未确认/异常三例）、**新增** `MqttDownlinkPublisherTest`（5 例：承载判定/主题占位+配置 QoS/惰性建连/无下行主题显式失败/非 MQTT 设备返回空）、`BpmMyInstanceControllerTest`（+2 例）、`BpmInstanceServiceImplTest`（+2 例）、`IotFeatureToggleContextTest`（最小上下文补 MqttDownlinkPublisher mock 装配；开关语义断言不变）、**新增** `sw-bootstrap/src/test/java/com/sw/ck/bootstrap/iot/IotNativeMqttDeferredDispatchPgTest.java`（受控真实 Broker + EmbeddedPostgres，2 例）、`P63ControlledMqttBroker` 提升为 public 以复用（同包测试资产，无行为改动） |

### Web（`Smart-WorkFlow-aPaaS-Web/`，分支 fix/submit-detect-copy）

| 文件 | 改动摘要 |
|---|---|
| `src/modules/workflow/api/index.ts` | 新增 `countMyInstancesByBusinessKey(formKey, businessKey)`（GET `/workflow/my/instances/count`，缺字段按 0） |
| `src/adapters/process-runtime.ts` | `countProcessInstancesByBusinessKey(businessKey)` → `(formKey, businessKey)`，改走用户态端点（注释写明 403 误判根因） |
| `src/modules/form/views/FormRender.vue` | 提交成功弹层去掉 `:sub-title`（只留「提交成功」）；删除 `submitDialogText`；探测传 `formKey` |
| `src/locales/zh-CN.ts` / `en-US.ts` | 删除 `submittedProcessStarted` / `submittedDataOnly`（`grep` 零命中） |
| `src/foundation/mock/handlers.ts` | 新增 `/api/workflow/my/instances/count` mock（先于 `:id` 注册，避免 "count" 被当路径参数） |
| 测试 | `FormRender.spec.ts`（新增提交确认用例：文案只「提交成功」+ adapter 入参断言；并补齐 draft 套件的 `submitForm` 历史清理以隔离用例）、`workflow/api/index.spec.ts`（+2 例） |

## 3. 机器门禁结果（L 级）

| 门 | 命令 | 结果 |
|---|---|---|
| 前端 typecheck | `NODE_OPTIONS="--max-old-space-size=2048" pnpm typecheck` | exit 0 |
| 前端 lint | 同上 `pnpm lint` | exit 0（0 error，4 warning 为既有） |
| 前端 test | 同上 `pnpm test` | **174 文件通过 / 1 skipped；1610 passed / 3 skipped / 0 failed** |
| 前端 build | 同上 `pnpm build` | exit 0（built in 2.76s） |
| 后端 compile | `MAVEN_OPTS="-Xmx2g" mvn -o clean test` | 见 §4（全量含编译） |
| 后端 test | 同上（全量） | 见 §4 |

## 4. 后端全量结果

`MAVEN_OPTS="-Xmx2g" mvn -o clean test`（全 14 模块）：

- **实测合计：Tests 2130 / Failures 1 / Errors 0 / Skipped 27**
- 唯一失败：`Phase4PgStartWindowCrashTest.scheduledFlowWindowCrashRecoversToExactlyOnce`（expected 1 got 0，121.5s 超时窗）。**已证明与本批改动无关**：在 `git worktree` 的干净 `develop`（823190e）上单独复跑该测试类，同样 3 run / 1 failure（121.8s），失败点与断言完全一致；该测试走远端 PG（`8.166.112.85:3897/sw_p4_evidence`，Phase4 定时发起崩溃窗口恢复），本批改动未触及该路径（仅新增 IoT 通道路由、实例计数方法与端点，未改既有方法行为）。
- 聚焦验证：`DeferredControlUtilTest` 8/0/0；`MqttDownlinkPublisherTest` 5/0/0；`IotFeatureToggleContextTest` 3/0/0；`BpmMyInstanceControllerTest` / `BpmInstanceServiceImplTest` 本批新增用例全绿；`P63ImmediateMqttBrokerPgTest` 2/0/0（既有立即通道回归）；`IotNativeMqttDeferredDispatchPgTest` 2/0/0（新增，受控真实 Broker）。
- 环境说明：本机 `target/classes` 曾残留 0.1.7 种子收敛前的 `V0.1.6__baseline_seed.sql`，会使 EmbeddedPostgres 全新建库重复建表；已通过 `clean` 消除（非仓库缺陷，clean 构建下不复现）。

## 5. 真实行为证据（原生 MQTT 通道）

受控真实 Broker（本机 127.0.0.1:18831，任务自启动自清理，接收记录 jsonl 为原件）：

- 正向：插入到期预约（`sw_iot_command_reservation` PENDING，dueUtc=now-5s，window=600s，commandType=PROPERTY，commandKey=drill_execute）→ 调真实入口 `IotReservationDispatchJob.dispatchDueReservations()`（该入口即 UAT 失败路径）→ 预约 `DISPATCHED`、命令 `sw_iot_device_command.status=SENT`、`tencent_request_id=MQTT:nat/<deviceKey>/cmd:<msgId>`、`last_error=null`；Broker 实收：
  `{"ts":"2026-10-19T02:54:44.299003Z","topic":"nat/nat-mqtt-drill-device/cmd","qos":1,"retain":false,"payload":"[\\\"机房断电\\\",\\\"火警告警\\\"]"}`
- 反向：连接停用 → 预约到点**不外发**：命令 `status=FAILED`、`last_error` 含「发送通道未装配」、`tencent_request_id=null`、Broker 接收行数增量为 0。

## 6. 与方向的偏差 / 未覆盖项

1. `OnlineConfirmControlUtil`（在线确认语义，要求腾讯在线态查询）未改：其生产调用点为 0（仅测试装配），不在本次缺陷路径；如需 MQTT 在线确认语义可后续单独立项。
2. UAT 实机验证未做：UAT 现运行 0.1.7 制品，本批次需发布后才能在 UAT 复验（包含 2026-10-20 20:00 那条待发预约——按现制品预期仍失败）。
3. `sw_iot_command`（A6 立即通道）与 `sw_iot_device_command`（延迟/预约通道）双命令表格局未动（超出本次缺陷范围）。
4. 前端 `submitForm` 后仍保留 5s×10 轮询上限（未改语义，仅换端点）。

## 7. Git 提交与推送回读

| 仓库 | 分支（自 develop `823190e` / `264cca3`） | 提交 | 远端回读 |
|---|---|---|---|
| Server | `fix/iot-native-mqtt-submit-detect` | `fe60132` fix(iot): 自建 MQTT 连接设备控制通道…；`e6f78bc` feat(bpm): 提交后实例探测用户态端点… | `refs/heads/fix/iot-native-mqtt-submit-detect = e6f78bc45e99…` |
| Web | `fix/submit-detect-copy` | `efdeb79` fix(form): 提交成功提示收敛为单文案，实例探测改走用户态端点 | `refs/heads/fix/submit-detect-copy = efdeb79c5226…` |

> Web 提交经仓库 pre-commit（lint-staged：eslint --fix + prettier）自动格式化后落盘；提交后已重跑 typecheck 与全量单测复核（1610 passed / 3 skipped，0 failed）。

## 8. 验收对照（待 Planner/Owner）

| 验收点 | 证据 |
|---|---|
| A：MQTT 设备经流程预约可真实外发 | §5 正向；`IotNativeMqttDeferredDispatchPgTest` 2/0/0 |
| A 反向：通道不可用不外发、不落已发送 | §5 反向；同测试第 2 例 |
| A 回归：A6 立即通道与腾讯 provider 路径不变 | `P63ImmediateMqttBrokerPgTest` 2/0/0；`DeferredControlUtilTest` provider 用例保持 |
| B：提交成功只显示「提交成功」 | `FormRender.spec.ts` 新用例（`data-sub-title` 未渲染 + 旧文案零命中） |
| C：普通用户提交后判定正确 | 后端边界（无监控权限注解）+ 用户态口径（发起人强制）；前端 adapter 单测断言 URL/参数 |
