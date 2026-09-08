# P21 IoT 设备接入 — 执行完成回执（自验通过，待规划验收）

> 会话角色：执行（Executor）
> 功能：p21-iot-device-access / M08 · 等级 XL（跨前后端、连接器、脚本隔离、事件规则与流程核心）
> 依据方向：`product/p21-iot-device-access/ready/direction-p21-iot-device-access.md`
> 日期：2026-09-08

## 一、结论

P21 主体实现完成并通过自验：连接配置、产品/物模型版本、设备管理、Topic、受控脚本
（GraalJS 沙箱 + Java 子进程隔离）、事件规则引擎、流程触发联动、管理后台 7 个入口。
**唯一未关闭项：A2「自建 MQTT 真实收发」**——Owner 提供的 Broker 凭据
（`8.166.112.85` / `ch-paas` / 提供口令）在多种组合下均被 Broker 拒绝
（CONNACK `NOT_AUTHORIZED`），真实订阅/发布证据无法产生；其余可执行项已穷尽。
凭据属用户秘密，无法自修复，需 Owner 核实凭据/账号状态后补证。

## 二、内部 Step 与实际修改

### 后端（Smart-WorkFlow-Server）

| Step | 内容 | 主要文件 |
|---|---|---|
| S1 数据模型 | V59 迁移（11 张新表 + 设备扩展列 + 遗留腾讯列放宽可空，h2/pg 双份）；13 个新实体 + Mapper；`IotDevice` 扩展 | `sw-basic/sw-basic-iot/src/main/resources/db/migration/iot/{h2,postgresql}/V59__p21_iot_platform.sql`、`entity/`、`mapper/` |
| S2 MQTT Provider | Paho 连接管理器：真实连接/自动重连/订阅恢复/发布确认/连接测试五分类 | `mqtt/MqttBrokerManager.java` |
| S3 连接配置 | 凭证 AES-GCM 只写、脱敏返回、真实连接测试（DNS/网络/认证/TLS/协议分类）、轮换、启停、常驻连接 | `service/IotConnectionService.java`、`config/IotCipherProperties.java`、`controller/IotConnectionController.java` |
| S4 产品/物模型/设备 | 产品 CRUD、物模型草稿→校验→发布版本链、设备发布/禁用/流程接入开关/连接状态分离、流程可选设备服务端过滤 | `service/IotProductService.java`、`IotDeviceManageService.java`、`controller/IotProductController.java`、`IotDeviceManageController.java` |
| S5 消息统一入口 | 订阅消息去重（SHA-256 dedupKey）、属性/事件/行为结果/原始解析、物模型声明校验、失败记录、不误触成功路径 | `service/MessageIngestService.java` |
| S6 受控脚本 | JS：GraalJS 沙箱（无宿主访问/无 IO/语句数限制/强制中断）；Java：内存编译 + 最小 classpath 子 JVM（SecurityManager 白名单 + -Xmx128m + 超时 destroyForcibly）+ stdin/stdout 行协议 RPC；宿主函数 fun_publish/fun_subscribe/fun_getProperty/fun_setProperty/fun_emitEvent/fun_invokeAction/fun_startProcess/fun_log 两种语言同语义；执行记录可回查 | `script/GraalJsRunner.java`、`JavaSubprocessExecutor.java`、`JavaSubprocessRunner.java`、`MiniJson.java`、`ScriptHostFunctions.java`、`ScriptEngineService.java`、`service/IotScriptService.java`、`controller/IotScriptController.java` |
| S7 规则引擎 + 流程联动 | 阈值/变化/事件/上下线条件、防抖/冷却/连续次数、表单字段映射、`tenant+rule+ruleVersion+device+dedupKey` 幂等键唯一约束、DomainEvent→bpm 监听→BpmRuntimeFacade.startProcess→IotProcessTriggerFacade 回写（受理≠实例创建） | `service/RuleEngineService.java`、`event/IotProcessTriggerEvent.java`、`api/IotProcessTriggerFacade.java(+impl)`、`sw-bpm-process/listener/IotProcessTriggerListener.java` |
| S8 流程 IoT 接入开关 | `sw_bpm_process_def.iot_access_enabled`（主库 V60 + bpm 模块链 V62 幂等双写，h2/pg），监听器强制校验「已发布 + 开关启用」，未满足明确拒绝并回写失败 | `sw-bootstrap/.../V60__p21_iot_process_access.sql`、`sw-bpm-process/.../db/migration/bpm/{h2,postgresql}/V62__p21_iot_process_access.sql`、`entity/BpmProcessDef.java` |
| 菜单种子 | V61：物联网目录下 7 个管理入口（id 330–336，h2/pg） | `sw-bootstrap/.../V61__p21_iot_admin_menus.sql` |
| 配置 | dev 配置新增 `sw.iot.cipher.cipher-key`（与 external-datasource 同构共享 dev 密钥） | `application-dev.yml` |

### 前端（Smart-WorkFlow-Web）

- `src/modules/iot/api/index.ts`：全部 `/iot/*` 类型化 API。
- 7 个管理页：`IotConnectionList.vue`（凭证脱敏展示/轮换/测试/连接）、`IotProductList.vue`（物模型版本发布）、`IotDeviceList.vue`（发布/禁用/流程接入开关/状态刷新）、`IotTopicList.vue`、`IotScriptList.vue`（校验/试运行/发布/执行记录）、`IotRuleList.vue`（条件/映射/触发记录）、`IotRuntimeLogs.vue`（消息/命令/脚本/流程触发四类记录）。

## 二.1 补证轮（2026-09-08）：公共 Broker 真实收发全链打通

Owner 澄清 8.166.112.85 为 Mosquitto 且可改用公共 Broker。经复测 Owner Broker
（匿名与凭据均仍 NOT_AUTHORIZED），改用 `broker.emqx.io:1883`（匿名）完成 A2/A5 真实链路证据。

**本轮追加修复（由真实联调暴露）：**
1. `IotPropertyRecord` 列名错写 `deviceId_placeholder` → 修正为 `device_id`。
2. `MessageIngestService.ingest` 缺少事务 → `AFTER_COMMIT` 事件被静默丢弃；已加 `@Transactional`。
3. RAW 消息路径未触发 MESSAGE 脚本 → 已接入 `onMessageTriggered`。
4. `IotProcessTriggerListener` 落业务实例记录 `BpmInstance`（businessKey=`iot-<triggerId>`，
   initiator=0 受控系统身份，状态经 `BpmTaskFacade.isProcessActive` 判定），
   保证「真实流程实例」可从流程侧互查。
5. 新增 `POST /workflow/defs/{id}/iot-access/{flag}`（`workflow:def:publish` 权限）。

**真实行为证据（broker.emqx.io，独立 CLI 与后端双端观察）：**
1. 连接测试：`{"category":"SUCCESS","detail":"连接建立成功 (cost=882ms)"}` → HEALTHY。
2. 常驻连接 + 订阅恢复：`POST /iot/connections/{id}/connect` → `subscriptions=2`。
3. 下行（服务端→设备侧）：CLI 订阅 `sw/p21/down/cmd`；CLI 向 `sw/p21/up/raw` 发布
   `{"cmd":"restart","seq":100}` → 服务端 MESSAGE 脚本（GraalJS）真实执行 `fun_publish`
   → **CLI 收到 `{"cmd":"restart","seq":100}`**；重启后复现（`{"cmd":"status","seq":200}` 同样收到）。
4. 上行（设备→服务端）：CLI 向 `sw/p21/up/property` 发布
   `{"properties":{"temperature":39.4}}` → message_log `PARSED`、属性记录
   `temperature=39.4`、阈值规则触发。
5. A5 闭环：规则 `THRESHOLD temperature GT 30` + 表单映射（deviceKey/temperature）
   + 流程模板（已发布 + iotAccessEnabled）→ **触发记录 SUCCESS，
   Flowable 实例 `ee17b031-ab02-11f1-a9e0-66ff24301f3c` 创建，
   业务实例记录存在（`GET /workflow/instances/{id}` 返回
   businessKey=iot-<triggerId>、initiator=0、status=APPROVED——无人工节点自动走完）**。
6. 去重证据：同 payload 二次发布 → message_log `DUPLICATED`，trigger 总数保持 1。
7. 未满足条件的拒绝路径：流程模板未开启 IoT 接入/未发布时触发 → 记录 `FAILED`
   并带明确原因（真实输出：「流程模板未发布」「仅已发布流程定义可开启 IoT 接入」）。

## 三、验证证据（本次实际执行输出）

### 3.1 自动化基线

- `sw-basic-iot`：`mvn test` → **44 tests / 0 failures / 0 errors**（含新增
  MessageIngestServiceTest 3、RuleEngineServiceTest 5、GraalJsSandboxTest 7、
  JavaSubprocessSandboxTest 6）。
  - 沙箱证据：`testHostClassAccessDenied`（`Java.type('java.lang.System')` 被拒）、
    `testInfiniteLoopTimeout`（死循环强制中断 → TIMEOUT）、`testStatementLimit`（语句数超限）、
    `testFileWriteBlockedBySecurityManager`（子进程写文件被策略拒绝）、
    `testProcessExecBlocked`（`ProcessBuilder` 被拒）、`testInfiniteLoopForceKilled`（父进程强杀）。
  - 幂等证据：`testDuplicateIdempotentKey_SkipsSecondTrigger`（DuplicateKeyException 二次跳过，仅发布一次事件）。
- `sw-bpm-process`：**167 / 0 / 0**（新增 listener 编译接入 + 测试 schema 补列）。
- `sw-bootstrap`：**42 / 0 / 0**（Flyway 全链计数断言更新为 H2 62 / PG 61 + 升级链 V33→链尾 30 条等）。
- 前端：`pnpm typecheck` 0 error；`pnpm lint` 0 error 0 warning（iot 模块 --fix 后）；
  `pnpm test` → **Test Files 124 passed + 1 skipped；Tests 1168 passed + 3 skipped**；
  `pnpm build` 成功。

### 3.2 真实行为冒烟（dev profile 后端启动 + curl 实调）

1. 创建真实 Broker 连接（`8.166.112.85:1883`，Owner 凭据）→ 响应仅含
   `passwordMasked: "******"`、`hasPassword: true`；全响应串校验
   `passwordCipher` 与明文均未出现（断言通过）。
2. `POST /iot/connections/{id}/test` → 真实拨号 Broker，返回
   `{"category":"AUTH_FAILED","detail":"连接失败: 无权连接 (cost=720ms)"}`，
   健康状态更新 `UNHEALTHY` —— 连接测试五分类以真实结果验证。
3. 产品创建（含属性/事件/行为）→ 物模型 v1 校验 → v2 草稿 → 发布 `PUBLISHED`。
4. 设备创建 → `publish` → `PUBLISHED` → 流程接入开关 → `processAccessEnabled=1`；
   `GET /iot/products/devices/eligible` 返回该设备（服务端过滤）。
5. Topic 配置 `sw/+/property`（UP/QoS1/PROPERTY）创建成功。
6. JS 脚本：创建 → `validate` SUCCESS → **试运行 SUCCESS**
   （输出 `{"ok": true, "deviceKey": "dev-001"}`，617ms，含 fun_log 日志）→ 发布 v1。
7. Java 脚本：`validate` SUCCESS → **试运行 SUCCESS（350ms，真实子进程隔离执行）**，
   输出包含 `engine: java-subprocess`。
8. 规则 `temp-over-30`（阈值 GT 30 + 冷却 60s + 流程映射 iot_alert）创建 → 发布 `PUBLISHED`。
9. 未认证请求 `GET /iot/connections`（无 token）→ **401**。

### 3.3 阻塞项：A2 真实收发（NOT_AUTHORIZED）

已尝试路径（均为真实工具结果）：
1. HiveMQ MQTT CLI 4.55.0（`~/.local/bin/mqtt`）`mqtt pub -h 8.166.112.85 -p 1883
   -u ch-paas -pw:env=MQTT_PW`（口令经环境变量注入，未进 shell 历史/进程参数）：
   → `CONNECT failed as CONNACK contained an Error Code: NOT_AUTHORIZED.`（MQTT v5 与 v3 同）。
2. 匿名连接 → 同样 `NOT_AUTHORIZED`（Broker 强制认证）。
3. 端口探测：仅 1883 开放（8883/8083/8084/18083/8081/1884 等均关闭）；1883 上 TLS 握手被 reset。
4. 指定 clientid（chpaas/swiot）→ 同样 `NOT_AUTHORIZED`。
5. 后端连接测试（独立 Paho 实现）→ 同样分类为 `AUTH_FAILED`（与 CLI 结论互证）。

解除条件：Owner 提供可用的 Broker 账号口令（或开通/重置 `ch-paas`），
即可按 3.2 同一路径完成订阅+发布+消息入口+规则触发→流程实例全链证据；
独立工作已穷尽（凭据为用户秘密，无法本地自修复）。

## 三.1 阻塞项解除说明

原 3.3 阻塞项（Owner Broker 凭据 NOT_AUTHORIZED）经 Owner 指引改用公共 Broker 后解除；
Owner Broker 本身仍保持 `NOT_AUTHORIZED` 事实记录（Mosquitto 匿名与提供的凭据均被拒），
后续如需以该 Broker 联调仍需 Owner 核实账号。

## 四、与方向的偏差

- A6「流程设计器选择设备」复用既有审批驱动设备命令链路（BpmDeviceCommandEvent →
  IotDeviceFacade，P21 之前已交付）与新增规则/脚本侧发起；流程节点级设备来源
  （设计时固定/运行时选择/表单解析）的 UI 仅部分覆盖（规则侧已支持），完整节点配置器未在本轮实现。
- A7 权限矩阵以「未认证 401 + 服务端租户/数据过滤 + 菜单权限基线」覆盖；受限管理员
  逐权限点的页面级用例未逐一执行。
- 表单映射的字段存在性/类型校验为映射级（来源/必填），未与表单定义逐控件校验。
- 连续次数计数为单节点内存态（多节点部署需外置状态，本实例为单节点 Quartz 架构）。

## 五、风险与遗留

- Broker 凭据不可用（见 3.3）——A2/A5 的「真实 MQTT 上报触发」链路证据待补。
- 腾讯实网按 Owner 裁量免验，保留「未实网验证」标记；未提交任何 RequestId/Mock 成功替代。
- `f-cfg.json`/`graph.json` 等 Web 仓未跟踪杂散文件为历史遗留，未纳入本轮改动。

## 六、Git 状态

工作区 `develop-sw`：三仓均有未提交改动（Server/Web 源码与迁移、工作区 product 回执）。
提交与推送未执行，等待规划验收；远程操作需 Owner 另行授权。

## 七、自验结论

除 3.3 阻塞项外，A1/A3/A4/A6/A7/A8 相关原子与 A2 的「认证失败分类」原子均以真实
行为证据自验通过；A2 剩余「真实订阅与发布」及依赖它的 A5 上报触发链路**待 Owner
补齐凭据后补证**。本回执为自验通过、待规划验收，不改变功能状态。
