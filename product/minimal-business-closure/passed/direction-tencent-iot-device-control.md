# 腾讯云 IoT 设备控制 SDK 与上线补发方向

> 本会话角色：规划（Planner）
> Owner 优先级：最高
> 所属正式功能：`minimal-business-closure`（腾讯 IoT 是该正式功能的剩余组成部分，不是独立功能）
> 目标平台：腾讯云物联网开发平台 IoT Explorer
> 设备唯一定位：`productId + deviceName`
> 当前唯一执行方向：是
> 最新 Owner 口径：暂无腾讯账号，以 Owner 提供的 Demo 完成代码对接；不要求真实云端联调或完整测试
> 子方向状态：`PASSED`（2026-08-28，已归档；正式功能总体已进入功能级 `PASSED`，待阶段三）

## 零、当前执行入口

执行角色只以本文件作为当前腾讯 IoT 主方向。Owner 提供的以下 Demo 是本阶段实现对照依据：

- `/Users/chikan/Downloads/IotDeviceCallbackServiceImpl.java`
- `/Users/chikan/Downloads/IotDeviceCallbackController.java`
- `/Users/chikan/Downloads/TencentIotCloudClient.java`

此前的 Owner 范围调整记录已归档至 `../receipts/tencent-iot-owner-scope-adjustment-demo-integration-20260828.md`，仅作历史记录，不是第二个执行方向。

### 已锁定完成的 Demo 对齐

根据 `../receipts/tencent-iot-step-demo-alignment-execution.md`，以下内容不再重复执行：

- 已增加 Demo 对应的 GET `Echostr` 回调验证入口。
- 状态 Payload 已支持 JSON 对象和 Base64 字符串两种格式，并按 `EV_ONLINE` 识别上线事件。
- 产品字段兼容 Demo 的 `productID`，同时兼容腾讯格式 `ProductId`。
- 回调 JSON 解析已切换为 Fastjson2。
- 腾讯 Provider 已按 Demo 使用 SDK 默认超时，不再维护自定义连接/读取超时配置。
- 执行回执报告受影响模块测试、模块编译和全量编译通过；本方向不要求重新运行完整测试。

最终补证已证明 Mock 零创建、设备失败后审批状态仍为 `APPROVED`、公共 Validator 实际 exit=0；本方向验收通过，不得再次作为执行入口。

## 一、目标

将现有模拟设备控制替换为可配置的腾讯云 IoT 服务端接入，基于 Owner Demo 和腾讯云 Java SDK 封装两类统一设备控制工具：一类接受命令后可靠入队，设备离线时等待腾讯上线事件 Hook，设备上线后立即补发；另一类只允许在线设备调用，并明确区分发送成功与失败。

当前没有腾讯账号和真实设备。本轮完成 Demo 对齐、云端 SDK 封装、设备身份、命令队列、上线回调和两类控制语义，不要求真实腾讯请求成功，也不把无真实硬件误写为真实设备执行已验证。

## 二、设备身份规则

- 腾讯设备的规范身份固定为 `productId + deviceName`，两者都不能为空。
- `deviceName` 只在所属产品内唯一，不能继续把单独的 `deviceKey` 当作腾讯云全局身份。
- 本地设备、命令、审批关联、Hook 事件和日志必须同时保留 `productId`、`deviceName`。
- 可保留本地业务主键或别名，但不得替代腾讯设备身份参与 SDK 请求。

## 三、腾讯 SDK 边界

- 使用腾讯云服务端 Java SDK 的 IoT Explorer 产品包，不自行实现云 API 签名。
- 云 API endpoint 使用 `iotexplorer.tencentcloudapi.com`，地域和凭证使用外部配置；连接与读取超时按 Owner Demo 使用 SDK 默认值。
- SecretId、SecretKey 只能来自安全配置或环境变量，禁止进入数据库、普通日志、回执和前端。
- 属性下发映射腾讯 `ControlDeviceData`：传入 `ProductId`、`DeviceName`、物模型属性 JSON，默认使用属性下发语义。
- 行为调用映射腾讯 `CallDeviceActionAsync` / `CallDeviceActionSync`：传入 `ProductId`、`DeviceName`、`ActionId`、输入参数 JSON。
- 设备在线状态使用腾讯设备查询结果，不以本地最后在线时间替代腾讯当前状态。

## 四、两类 Util 的业务契约

### 延迟生效类

用途：业务只要求“命令已可靠接受”，允许设备当前离线，设备上线后再处理。

- 调用成功只表示命令已持久化进入本地待发送队列，不表示腾讯已发送，更不表示设备已执行。
- 返回本地命令标识和 `QUEUED` 状态。
- 如果设备当前在线，可以立即尝试发送；如果离线，保持待发送状态。
- 收到腾讯设备上线 Hook 后，以 `productId + deviceName` 查询该设备待发送命令并立即补发。
- 同一设备的队列必须保证可判定的顺序和并发互斥，重复上线通知不能导致重复发送。
- 每条命令必须有幂等键、过期时间、尝试次数和最后失败原因。
- 属性和行为都可入队；行为可能产生不可逆副作用，发生“请求结果未知”时不得盲目重复，必须依赖幂等键或进入人工/显式重试状态。

### 在线确认类

用途：业务要求设备此刻在线，并确认控制信号已送达或设备已经回复。

- 调用前必须查询腾讯设备状态；离线、未激活、设备不存在或状态查询失败时直接失败，不进入离线队列。
- 属性控制调用 `ControlDeviceData`，只有腾讯返回设备在线且已向订阅控制 Topic 发送的结果时，才能标记为 `SENT`。
- 行为控制优先使用 `CallDeviceActionSync`；只有收到设备行为回复并取得成功状态时，才能标记为 `ACKED/SUCCESS`。
- 腾讯仅接受请求、返回 RequestId 或异步 ClientToken，不等同于设备执行成功。
- 超时、不可达、未订阅、未授权、限流和物模型参数非法必须返回清晰失败，不允许降级成成功或自动转入延迟队列。

## 五、上线事件 Hook

- 提供腾讯规则引擎可配置的 HTTP Hook，用于接收设备上线、下线状态变化通知。
- 腾讯规则引擎按官方格式转发状态事件：外层包含 `ProductId`、`DeviceName`、`Payload` 等字段；`Payload` 解码后识别上线事件。
- Hook 按 Owner Demo 提供 GET `Echostr` 验证和公开状态回调，不额外要求自定义 Token；不得在回调参数、日志或响应中暴露腾讯云 SecretId/SecretKey。
- Hook 必须校验 `ProductId + DeviceName`、事件类型和时间信息，并对重复事件幂等处理。
- 收到上线事件后先可靠记录事件并快速返回 HTTP 成功，再异步触发该设备待发送队列，不能让腾讯回调等待整批命令执行完。
- 收到下线事件只更新设备连接状态，不触发补发。
- Hook 是主要触发通道；还需提供对长期滞留队列的可恢复补偿入口，避免回调丢失后命令永久滞留。

## 六、队列与状态语义

- 至少区分：已入队、发送中、腾讯已发送、设备已回复、失败、结果未知、已过期。
- 保存腾讯 RequestId；异步行为保存 ClientToken；同步行为保存设备输出参数。
- “腾讯 API 调用成功”“消息已发送”“设备已回复”“设备业务执行成功”是不同状态，不得合并。
- 上线补发按设备隔离，一个设备的失败不能阻塞其他设备。
- 自动重试只允许发生在可确认未发送的瞬时失败；对可能已经发送的 Action 不自动重复执行。
- 审批事务与腾讯调用隔离：审批结果先提交，本地命令可靠落库后再调用腾讯；腾讯失败不能回滚已完成审批，但必须在命令记录中可见并可处理。

## 七、配置要求

- 支持腾讯 IoT 开关、地域、endpoint、SecretId、SecretKey、队列过期时间和重试上限配置；连接/读取超时使用 SDK 默认值，回调不配置自定义 Hook Token。
- 开发和测试环境可显式使用 Mock Provider；生产配置为腾讯 Provider 时禁止静默回退模拟成功。
- 未配置腾讯凭证时应明确启动失败或禁用腾讯 Provider，不能伪造成功结果。
- 日志只记录 `productId`、`deviceName`、本地命令标识、RequestId、ClientToken 和脱敏错误，不记录凭证与完整敏感 Payload。

## 八、影响范围

- IoT 模块：腾讯 Provider、设备身份、命令状态、队列、上线补发和查询能力。
- 工作流模块：审批通过后按配置选择延迟生效或在线确认语义，不直接依赖腾讯 SDK 类型。
- Web/Hook：腾讯状态事件接收、鉴权、幂等和快速响应。
- 数据与迁移：设备身份从单一 key 收敛到 `productId + deviceName`，命令记录补充云端调用与队列字段。
- 配置与安全：腾讯 SDK、凭证、地域、公开回调边界和 Provider 模式。

## 九、非目标

- 本轮不接入真实硬件，不宣称物理设备执行已验证。
- 本轮不要求腾讯账号、真实 SecretId/SecretKey 或真实腾讯云 API 联调。
- 本轮不执行项目完整测试套件，不重复验证与本次改动无关的业务功能。
- 不开发设备端固件或设备端 SDK。
- 不扩展到 OTA、固件管理、视频、规则编排、多云 IoT 或完整设备数字孪生。
- 不依赖腾讯为离线设备保存普通控制命令；离线可靠性由本地队列负责。
- 不把腾讯异步调用受理成功直接写成设备执行成功。

## 十、验收边界

执行层重新提交时只需提供与当前环境匹配的最小证据：

- 逐项说明三个 Demo 中采用的客户端调用、字段、回调格式和异常语义；存在差异时明确原因。
- 受影响模块编译通过，不要求全项目完整测试。
- 本地证据能够证明 `productId + deviceName` 被传入腾讯客户端，设备上线回调能够进入补发入口，两类 Util 均接入腾讯 Provider，而不是固定返回模拟成功。
- 审批驱动命令仍已接入；腾讯调用失败不回滚审批，命令结果保持可见。
- 配置和日志检查证明没有硬编码或输出腾讯 Secret，生产腾讯模式不会静默降级成 Mock 成功。
- 回执使用合法执行终态，不以自然语言自行裁决 `PASSED` 或 `COMPLETED`。

本阶段不要求真实腾讯 RequestId、ClientToken、设备输出、真实上线事件或完整自动化测试。真实腾讯云请求与物理设备收发保留为后续现场联调项，不阻塞本阶段 Demo 对接验收。

## 十一、官方依据

- 腾讯云设备远程控制：`https://cloud.tencent.com/document/product/1081/34973`
- 腾讯云异步调用设备行为：`https://cloud.tencent.com/document/product/1081/38941`
- 腾讯云同步调用设备行为：`https://cloud.tencent.com/document/api/1081/38940`
- 腾讯云数据转发至第三方服务：`https://cloud.tencent.com/document/product/1081/103638`
- 腾讯云规则引擎数据处理：`https://cloud.tencent.com/document/product/1081/103635`
- 腾讯云 Java SDK：`https://github.com/TencentCloud/tencentcloud-sdk-java`

执行角色自行拆分实现和测试任务。本方向规定业务语义与验收边界，不预先指定 Step 数量或具体类名。
