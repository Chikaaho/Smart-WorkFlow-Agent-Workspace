# 腾讯云 IoT 设备控制 SDK — Step 拆分与执行计划

> 执行角色：Executor
> 需求方向：`product/tencent-iot-device-control/ready/direction-tencent-iot-device-control.md`
> 目标：将模拟设备控制替换为腾讯云 IoT Explorer SDK 接入，实现延迟生效/在线确认两类控制语义

---

## Step 拆分总览

| Step | 名称 | 职责域 | 依赖 |
|------|------|--------|------|
| 1 | 设备身份模型升级与数据库迁移 | 后端 | 无 |
| 2 | 腾讯云 SDK 接入与 Provider 抽象 | 后端 | Step 1 |
| 3 | 命令队列实体与状态机 | 后端 | Step 1, 2 |
| 4 | 延迟生效类控制工具 | 后端 | Step 2, 3 |
| 5 | 在线确认类控制工具 | 后端 | Step 2, 3 |
| 6 | 设备上线事件 Hook | 后端 | Step 3, 4 |
| 7 | 命令补偿与过期处理 | 后端 | Step 3 |
| 8 | 工作流审批集成 | 后端 | Step 4, 5 |
| 9 | 单元测试与集成测试 | 后端 | Step 1-8 |
| 10 | 全量编译验证与回归 | 后端 | Step 9 |

---

## Step 1：设备身份模型升级与数据库迁移

### 1. 当前状态
IoT 模块已有 IotDevice（deviceKey 单键）和 IotDeviceCommand 实体，但无数据库迁移脚本，deviceKey 为单一业务键，不支持 productId + deviceName 复合身份。

### 2. Step 目标
将设备身份从单一 deviceKey 收敛到 productId + deviceName 复合键，创建完整的数据库迁移脚本。

### 3. 已知上下文
- 实体位置：`Smart-WorkFlow/sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/entity/`
- 迁移目录：`Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/`
- 最新迁移版本需确认（查 V 编号）
- 表前缀：`sw_iot_`
- 共享约束：Flyway 双方言（PostgreSQL + H2）

### 4. 执行前必须读取的文件
- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/entity/IotDevice.java`
- `Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/` 下所有 V*.sql（确认最新版本号）
- `Smart-WorkFlow/sw-basic/sw-common/src/main/java/com/sw/ck/common/core/domain/BaseEntity.java`（确认基类字段）
- `Smart-WorkFlow/docs/governance/engineering-constitution.md`（后端工程宪法）

### 5. 允许修改的文件范围
- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/entity/IotDevice.java`（新增 productId 字段）
- `Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/V{N}__iot_device_identity_upgrade.sql`（新建迁移）
- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/entity/IotDeviceCommand.java`（新增 productId 等字段）
- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/mapper/IotDeviceMapper.java`（新增按 productId+deviceName 查询方法）

### 6. 禁止修改的范围
- 前端代码 `Smart-WorkFlow-Web/`
- 非 IoT 模块的实体或服务
- 现有 migration 文件（只新建）

### 7. 详细执行方案
1. 读取现有 IotDevice.java 和 IotDeviceCommand.java，确认当前字段
2. 读取最新 migration 文件，确认 V 版本号
3. 修改 IotDevice.java：新增 productId 字段（String, not null）
4. 修改 IotDeviceCommand.java：新增 productId、commandType、idempotentKey、expiryTime、retryCount、lastError、tencentRequestId、clientToken、deviceOutput 字段
5. 创建 V{N}__iot_device_identity_upgrade.sql：ALTER TABLE sw_iot_device ADD COLUMN product_id；ALTER TABLE sw_iot_device_command ADD 新字段；创建索引
6. 更新 IotDeviceMapper：新增 selectByProductAndDeviceName 方法

### 8. 关键实现约束
- Flyway 双方言：SQL 需同时兼容 PostgreSQL 和 H2
- 表前缀 sw_iot_
- BaseEntity 已包含 tenantId, createTime, updateTime, deleted
- 新字段 nullable 需谨慎：productId 为必填，其他字段可 nullable

### 9. 边界情况
- 现有数据中 deviceKey 需要兼容处理
- migration 必须是幂等的（使用 IF NOT EXISTS）

### 10. 风险和回滚方案
- 风险：迁移脚本语法不兼容 H2
- 回滚：DROP 新增列

### 11. 测试方案
- 11.1 静态检查：mvn compile 通过
- 11.2 单元测试：IotDeviceMapper 查询测试
- 11.3 集成测试：Flyway migration 在 H2 上成功执行
- 11.4 手工验证：启动 dev profile，检查表结构
- 11.5 回归检查：现有 IoT CRUD 不受影响

### 12. 验收标准
- IotDevice 包含 productId 字段
- IotDeviceCommand 包含全部新增字段
- migration 脚本在 H2 上成功执行
- IotDeviceMapper 支持 productId + deviceName 查询
- 现有编译通过

### 13. 执行回执格式
按 §8.1 格式提交

### 14. 测试回执格式
按 §8.2 格式提交

### 15. 明确禁止事项
- 不修改前端
- 不修改非 IoT 模块
- 不删除现有字段

---

## Step 2：腾讯云 SDK 接入与 Provider 抽象

### 1. 当前状态
无腾讯云 SDK 依赖，无 Provider 抽象，无 Mock/Tencent 分离。

### 2. Step 目标
引入腾讯云 IoT Explorer Java SDK，创建 DeviceControlProvider 接口及 TencentCloudProvider/MockCloudProvider 实现，支持通过配置切换。

### 3. 已知上下文
- Maven 坐标：`com.tencentcloudapi:tencentcloud-sdk-java-iotexplorer:3.1.1235`
- 关键 API：ControlDeviceData, CallDeviceActionAsync, CallDeviceActionSync, DescribeDeviceStatus
- 认证：BasicCredential + ClientProfile + HttpProfile
- 模块 pom：`Smart-WorkFlow/sw-basic/sw-basic-iot/pom.xml`

### 4. 执行前必须读取的文件
- `Smart-WorkFlow/sw-basic/sw-basic-iot/pom.xml`
- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/config/IotAutoConfiguration.java`
- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/config/MqttProperties.java`
- `Smart-WorkFlow/sw-dependencies/pom.xml`（BOM 管理）
- `Smart-WorkFlow/application-dev.yml`

### 5. 允许修改的文件范围
- `Smart-WorkFlow/sw-basic/sw-basic-iot/pom.xml`（新增 SDK 依赖）
- `Smart-WorkFlow/sw-dependencies/pom.xml`（新增 SDK 版本管理）
- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/config/TencentCloudProperties.java`（新建）
- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/provider/DeviceControlProvider.java`（新建接口）
- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/provider/TencentCloudProvider.java`（新建实现）
- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/provider/MockCloudProvider.java`（新建实现）
- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/config/IotAutoConfiguration.java`（更新）
- `Smart-WorkFlow/sw-bootstrap/src/main/resources/application-dev.yml`（新增配置）

### 6. 禁止修改的范围
- 前端代码
- 非 IoT 模块
- 现有 Entity/Service（Step 3 处理）

### 7. 详细执行方案
1. 在 sw-dependencies/pom.xml 中声明 SDK 版本
2. 在 sw-basic-iot/pom.xml 中引入依赖
3. 创建 TencentCloudProperties：region, endpoint, secretId, secretKey, connectTimeout, readTimeout, hookToken, queueExpiryMinutes, maxRetryCount, providerMode(mock/tencent)
4. 创建 DeviceControlProvider 接口：queryDeviceStatus, controlDeviceData, callDeviceActionSync
5. 实现 TencentCloudProvider：初始化 TencentCloud SDK client，实现接口方法
6. 实现 MockCloudProvider：模拟设备在线/离线，模拟控制结果
7. 更新 IotAutoConfiguration：根据 providerMode 注册对应 Bean
8. 更新 application-dev.yml：添加 sw.iot.tencent 配置

### 8. 关键实现约束
- SecretId/SecretKey 只来自配置或环境变量，禁止硬编码
- 生产模式禁止静默回退模拟成功
- 未配置凭证时应明确启动失败或禁用 Provider
- 日志脱敏：不记录凭证与完整 Payload

### 9. 边界情况
- SDK 依赖可能与现有依赖冲突
- H2 测试环境无法连接真实腾讯云

### 10. 风险和回滚方案
- 风险：SDK 版本与 Spring Boot 3.4 不兼容
- 回滚：移除 SDK 依赖，恢复 Mock 模式

### 11. 测试方案
- 11.1 静态检查：mvn compile 通过
- 11.2 单元测试：MockCloudProvider 功能测试
- 11.3 集成测试：Provider 切换测试
- 11.4 手工验证：dev profile 启动，检查 Provider 注册
- 11.5 回归检查：现有 IoT 功能不受影响

### 12. 验收标准
- SDK 依赖成功引入
- DeviceControlProvider 接口定义清晰
- TencentCloudProvider 正确初始化 SDK client
- MockCloudProvider 模拟设备状态和控制
- Provider 可通过配置切换
- 未配置凭证时启动失败或禁用

### 13-15 同 Step 1

---

## Step 3：命令队列实体与状态机

### 1. 当前状态
IotDeviceCommand 已有基础字段（deviceKey, commandKey, payload, status, result），但无 productId、命令类型、幂等键、过期时间、重试次数、腾讯 RequestId 等字段，status 使用原始 String。

### 2. Step 目标
完善命令实体字段，创建 CommandStatus 枚举，实现命令队列管理服务（并发控制、幂等、过期）。

### 3. 已知上下文
- 状态语义：已入队、发送中、腾讯已发送、设备已回复、失败、结果未知、已过期
- 幂等键、过期时间、尝试次数、最后失败原因
- 一个设备的失败不能阻塞其他设备

### 4. 执行前必须读取的文件
- Step 1 产出的 IotDeviceCommand.java（已更新字段）
- IotDeviceCommandMapper.java
- IotDeviceServiceImpl.java（现有命令逻辑）

### 5. 允许修改的文件范围
- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/entity/IotDeviceCommand.java`（Step 1 已改）
- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/enums/CommandStatus.java`（新建）
- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/service/CommandQueueService.java`（新建接口）
- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/service/CommandQueueServiceImpl.java`（新建实现）
- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/mapper/IotDeviceCommandMapper.java`（新增查询方法）

### 6. 禁止修改的范围
- 前端代码
- 非 IoT 模块

### 7. 详细执行方案
1. 创建 CommandStatus 枚举：QUEUED, SENDING, SENT, DELIVERED, ACKED, SUCCESS, FAILED, UNKNOWN, EXPIRED
2. 创建 CommandQueueService 接口：enqueue, dequeue, markSending, markSent, markDelivered, markAcked, markSuccess, markFailed, markExpired, getPendingCommands, getStuckCommands
3. 实现 CommandQueueServiceImpl：使用数据库乐观锁或 SELECT FOR UPDATE 实现并发控制
4. 更新 IotDeviceCommandMapper：新增按 productId+deviceName 查询待发送命令、查询过期命令等方法

### 8. 关键实现约束
- 并发互斥：同一设备的命令必须串行发送
- 幂等键唯一性约束
- 过期时间自动检查
- 状态转换必须合法（不允许跳跃）

### 9. 边界情况
- 并发入队同一设备
- 重复上线通知
- 命令过期但正在发送中

### 10. 风险和回滚方案
- 风险：数据库锁导致性能问题
- 回滚：降级为应用层锁

### 11. 测试方案
- 11.1 静态检查：mvn compile
- 11.2 单元测试：状态转换合法性、并发入队、幂等键唯一性
- 11.3 集成测试：数据库操作正确性
- 11.4 手工验证：无
- 11.5 回归检查：现有命令功能不受影响

### 12. 验收标准
- CommandStatus 枚举覆盖全部状态
- 命令入队、状态转换、过期处理正确
- 并发控制有效
- 幂等键唯一性保证

### 13-15 同 Step 1

---

## Step 4：延迟生效类控制工具

### 1. 当前状态
无延迟生效控制逻辑，设备控制为模拟执行。

### 2. Step 目标
实现 DeferredControlUtil：接受命令后可靠入队，设备离线时等待上线补发，设备上线后立即补发。

### 3. 已知上下文
- 调用成功只表示命令已持久化进入本地待发送队列
- 返回本地命令标识和 QUEUED 状态
- 设备在线可立即尝试发送
- 收到上线 Hook 后补发
- 属性和行为都可入队

### 4. 执行前必须读取的文件
- Step 2 产出的 DeviceControlProvider 接口
- Step 3 产出的 CommandQueueService
- IotDeviceService.java

### 5. 允许修改的文件范围
- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/util/DeferredControlUtil.java`（新建）
- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/service/IotDeviceService.java`（新增方法）
- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/service/IotDeviceServiceImpl.java`（实现）

### 6. 禁止修改的范围
- 前端代码
- 非 IoT 模块
- DeviceControlProvider 接口

### 7. 详细执行方案
1. 创建 DeferredControlUtil：
   - controlProperty(productId, deviceName, propertyJson): 入队属性控制命令
   - controlAction(productId, deviceName, actionId, inputJson): 入队行为控制命令
   - flushDeviceCommands(productId, deviceName): 补发设备待发送命令
2. 入队逻辑：生成幂等键 → 检查设备在线 → 在线则直接发送，离线则 QUEUED
3. 补发逻辑：查询待发送命令 → 逐条发送 → 更新状态

### 8. 关键实现约束
- 调用成功只表示已入队，不表示腾讯已发送
- 补发按设备隔离
- 重复上线通知不能导致重复发送

### 9. 边界情况
- 补发过程中设备再次离线
- 补发过程中命令过期

### 10. 风险和回滚方案
- 风险：补发批量命令导致腾讯限流
- 回滚：增加发送间隔

### 11. 测试方案
- 11.1 静态检查：mvn compile
- 11.2 单元测试：入队逻辑、补发逻辑、幂等性
- 11.3 集成测试：与 CommandQueueService 联动
- 11.4 手工验证：无
- 11.5 回归检查：无

### 12. 验收标准
- 离线设备命令正确入队
- 在线设备命令立即发送
- 补发逻辑正确触发
- 重复补发不重复发送

### 13-15 同 Step 1

---

## Step 5：在线确认类控制工具

### 1. 当前状态
无在线确认控制逻辑。

### 2. Step 目标
实现 OnlineConfirmControlUtil：调用前查询设备在线状态，确认控制信号已送达或设备已回复。

### 3. 已知上下文
- 调用前必须查询腾讯设备状态
- 离线/未激活/不存在/查询失败时直接失败
- 属性控制：确认腾讯已发送时标记 SENT
- 行为控制：设备回复成功时标记 ACKED/SUCCESS
- 超时/不可达/未订阅/未授权/限流/物模型参数非法必须返回清晰失败

### 4. 执行前必须读取的文件
- Step 2 产出的 DeviceControlProvider 接口
- Step 3 产出的 CommandStatus 枚举

### 5. 允许修改的文件范围
- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/util/OnlineConfirmControlUtil.java`（新建）

### 6. 禁止修改的范围
- 前端代码
- 非 IoT 模块
- DeviceControlProvider 接口

### 7. 详细执行方案
1. 创建 OnlineConfirmControlUtil：
   - controlPropertyOnline(productId, deviceName, propertyJson): 在线属性控制
   - controlActionOnline(productId, deviceName, actionId, inputJson): 在线行为控制
2. 调用前查询设备状态 → 离线则失败
3. 属性控制：调用 ControlDeviceData → 确认腾讯已发送
4. 行为控制：调用 CallDeviceActionSync → 确认设备回复成功
5. 保存 RequestId/ClientToken/设备输出

### 8. 关键实现约束
- 不允许降级成成功或自动转入延迟队列
- 失败原因必须清晰

### 9. 边界情况
- 调用过程中设备离线
- 腾讯 API 超时但设备可能已收到

### 10. 风险和回滚方案
- 风险：腾讯 API 延迟导致误判
- 回滚：增加超时重试

### 11. 测试方案
- 11.1 静态检查：mvn compile
- 11.2 单元测试：离线拒绝、超时处理、成功确认
- 11.3 集成测试：与 DeviceControlProvider 联动
- 11.4 手工验证：无
- 11.5 回归检查：无

### 12. 验收标准
- 离线设备调用正确拒绝
- 在线设备调用正确确认
- 失败原因清晰
- 不自动转入延迟队列

### 13-15 同 Step 1

---

## Step 6：设备上线事件 Hook

### 1. 当前状态
无 HTTP Hook 端点。

### 2. Step 目标
实现腾讯规则引擎可配置的 HTTP Hook，接收设备上线/下线状态变化通知，触发待发送队列补发。

### 3. 已知上下文
- 腾讯规则引擎按官方格式转发状态事件
- 外层包含 ProductId、DeviceName、Payload 等字段
- Payload 解码后识别上线事件
- 必须校验鉴权 Token
- 收到上线事件后快速返回 HTTP 成功，再异步触发补发
- 下线事件只更新状态，不触发补发

### 4. 执行前必须读取的文件
- Step 3 产出的 CommandQueueService
- Step 4 产出的 DeferredControlUtil
- TencentCloudProperties

### 5. 允许修改的文件范围
- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/hook/TencentDeviceStatusHook.java`（新建）
- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/hook/HookAuthFilter.java`（新建）

### 6. 禁止修改的范围
- 前端代码
- 非 IoT 模块

### 7. 详细执行方案
1. 创建 TencentDeviceStatusHook：@PostMapping("/iot/hook/tencent/device-status")
2. 创建 HookAuthFilter：校验请求头中的 Token
3. 解析腾讯事件格式：ProductId、DeviceName、Payload
4. 幂等处理：检查事件 ID 是否已处理
5. 上线事件：更新设备状态 → 快速返回 200 → 异步触发 DeferredControlUtil.flushDeviceCommands
6. 下线事件：更新设备状态 → 返回 200

### 8. 关键实现约束
- 必须快速返回（<1秒），不能等待补发完成
- 不能把腾讯 SecretId/SecretKey 作为 Hook 凭证
- 幂等处理重复事件

### 9. 边界情况
- 腾讯重复回调
- Payload 格式异常
- 鉴权失败

### 10. 风险和回滚方案
- 风险：异步补发失败
- 回滚：记录失败命令，人工处理

### 11. 测试方案
- 11.1 静态检查：mvn compile
- 11.2 单元测试：事件解析、鉴权、幂等
- 11.3 集成测试：HTTP 请求测试
- 11.4 手工验证：无
- 11.5 回归检查：无

### 12. 验收标准
- Hook 端点正确响应
- 鉴权失败拒绝请求
- 上线事件触发补发
- 下线事件不触发补发
- 重复事件幂等处理

### 13-15 同 Step 1

---

## Step 7：命令补偿与过期处理

### 1. 当前状态
无补偿机制，过期命令无处理。

### 2. Step 目标
实现定时任务：检测长期滞留队列的命令，处理过期命令，重试瞬时失败。

### 3. 已知上下文
- 需要可恢复补偿入口，避免回调丢失后命令永久滞留
- 自动重试只允许发生在可确认未发送的瞬时失败
- 对可能已经发送的 Action 不自动重复执行

### 4. 执行前必须读取的文件
- Step 3 产出的 CommandQueueService
- TencentCloudProperties（queueExpiryMinutes, maxRetryCount）

### 5. 允许修改的文件范围
- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/job/CommandCompensationJob.java`（新建）

### 6. 禁止修改的范围
- 前端代码
- 非 IoT 模块

### 7. 详细执行方案
1. 创建 CommandCompensationJob：@Scheduled 定时任务
2. 检查过期命令：expiryTime < now 且 status == QUEUED → 标记 EXPIRED
3. 检查滞留命令：QUEUED 时间 > 阈值 → 触发补发或标记失败
4. 瞬时失败重试：status == FAILED 且 retryCount < maxRetryCount → 重试

### 8. 关键实现约束
- 重试只针对可确认未发送的失败
- 不自动重复执行可能已发送的 Action

### 9. 边界情况
- 补偿任务与 Hook 补发并发
- 重试过程中命令过期

### 10. 风险和回滚方案
- 风险：补偿任务重复执行
- 回滚：使用分布式锁

### 11. 测试方案
- 11.1 静态检查：mvn compile
- 11.2 单元测试：过期检测、重试逻辑
- 11.3 集成测试：与 CommandQueueService 联动
- 11.4 手工验证：无
- 11.5 回归检查：无

### 12. 验收标准
- 过期命令正确标记
- 滞留命令正确处理
- 瞬时失败正确重试
- 不重复执行可能已发送的 Action

### 13-15 同 Step 1

---

## Step 8：工作流审批集成

### 1. 当前状态
IotDeviceFacade 已有基础接口，但无语义选择（延迟/在线确认）。

### 2. Step 目标
更新 Facade 接口，支持审批通过后按配置选择延迟生效或在线确认语义，审批状态与腾讯调用隔离。

### 3. 已知上下文
- 审批事务与腾讯调用隔离：审批结果先提交，本地命令可靠落库后再调用腾讯
- 腾讯失败不能回滚已完成审批
- 命令失败必须在命令记录中可见并可处理

### 4. 执行前必须读取的文件
- IotDeviceFacade.java
- IotDeviceFacadeImpl.java
- Step 4 产出的 DeferredControlUtil
- Step 5 产出的 OnlineConfirmControlUtil

### 5. 允许修改的文件范围
- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/facade/IotDeviceFacade.java`（更新接口）
- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/facade/IotDeviceFacadeImpl.java`（更新实现）

### 6. 禁止修改的范围
- 前端代码
- 非 IoT 模块
- DeferredControlUtil / OnlineConfirmControlUtil

### 7. 详细执行方案
1. 更新 IotDeviceFacade 接口：新增 controlDevice 方法，参数包含 semanticMode（DEFERRED/ONLINE_CONFIRM）
2. 更新 IotDeviceFacadeImpl：根据 semanticMode 调用对应 Util
3. 确保审批状态先提交，再调用腾讯

### 8. 关键实现约束
- 审批与腾讯调用隔离
- 腾讯失败不回滚审批

### 9. 边界情况
- 审批提交成功但腾讯调用失败
- 审批与命令状态不一致

### 10. 风险和回滚方案
- 风险：事务隔离不当
- 回滚：确保本地落库先于腾讯调用

### 11. 测试方案
- 11.1 静态检查：mvn compile
- 11.2 单元测试：语义选择、隔离性
- 11.3 集成测试：与 DeferredControlUtil/OnlineConfirmControlUtil 联动
- 11.4 手工验证：无
- 11.5 回归检查：无

### 12. 验收标准
- Facade 支持语义选择
- 审批与腾讯调用隔离
- 失败时审批不回滚

### 13-15 同 Step 1

---

## Step 9：单元测试与集成测试

### 1. 当前状态
无任何测试文件。

### 2. Step 目标
补充全面的单元测试和集成测试，覆盖队列并发、重复 Hook、过期命令、瞬时失败重试、Action 结果未知不重试、凭证脱敏。

### 3. 已知上下文
- 测试目录：`Smart-WorkFlow/sw-basic/sw-basic-iot/src/test/`
- 框架：JUnit 5 + Mockito + Spring Boot Test

### 4. 执行前必须读取的文件
- Step 1-8 全部产出

### 5. 允许修改的文件范围
- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/test/` 下所有新建测试文件

### 6. 禁止修改的范围
- 生产代码（仅测试）
- 前端代码

### 7. 详细执行方案
1. CommandQueueServiceTest：并发入队、幂等键、过期处理
2. DeferredControlUtilTest：离线入队、在线发送、补发幂等
3. OnlineConfirmControlUtilTest：离线拒绝、超时处理、成功确认
4. TencentDeviceStatusHookTest：鉴权、事件解析、幂等
5. CommandCompensationJobTest：过期检测、重试逻辑
6. ProviderIsolationTest：Mock/Tencent Provider 隔离
7. CredentialMaskingTest：凭证脱敏验证

### 8. 关键实现约束
- 测试必须使用真实行为证据
- 并发测试需要多线程或并发框架

### 9. 边界情况
- 测试环境无法连接真实腾讯云（使用 Mock）

### 10. 风险和回滚方案
- 风险：测试不稳定
- 回滚：增加重试机制

### 11. 测试方案
- 11.1 静态检查：mvn compile
- 11.2 单元测试：全部测试通过
- 11.3 集成测试：Spring Boot Test 启动成功
- 11.4 手工验证：无
- 11.5 回归检查：现有测试不受影响

### 12. 验收标准
- 全部测试通过
- 覆盖需求方向中的验收边界
- 并发测试有效
- 凭证脱敏验证通过

### 13-15 同 Step 1

---

## Step 10：全量编译验证与回归

### 1. 当前状态
全部 Step 完成，需要全量验证。

### 2. Step 目标
全量编译、全量测试、回归检查，确保无破坏性变更。

### 3. 执行前必须读取的文件
- 全部 Step 产出

### 4. 执行方案
1. `cd Smart-WorkFlow && MAVEN_OPTS="-Xmx2g" mvn clean compile`（全量编译）
2. `cd Smart-WorkFlow && MAVEN_OPTS="-Xmx2g" mvn test`（全量测试）
3. 检查测试报告
4. 确认无编译错误、无测试失败

### 5. 验收标准
- 全量编译通过
- 全量测试通过
- 无回归问题
