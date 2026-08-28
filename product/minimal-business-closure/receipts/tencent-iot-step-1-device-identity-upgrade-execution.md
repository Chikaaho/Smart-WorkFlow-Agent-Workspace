# 执行回执 — Step 1: 设备身份模型升级与数据库迁移

## 1. Step 编号和名称
Step 1: 设备身份模型升级与数据库迁移

## 2. 实际读取的文件
- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/entity/IotDevice.java`
- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/entity/IotDeviceCommand.java`
- `Smart-WorkFlow/sw-framework/sw-common/src/main/java/com/sw/ck/common/entity/BaseEntity.java`
- `Smart-WorkFlow/sw-framework/sw-common/src/main/java/com/sw/ck/common/entity/BaseEntityNoTenant.java`
- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/mapper/IotDeviceMapper.java`
- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/mapper/IotDeviceCommandMapper.java`
- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/service/IotDeviceService.java`
- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/service/impl/IotDeviceServiceImpl.java`
- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/controller/IotDeviceController.java`
- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/api/IotDeviceFacade.java`
- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/api/impl/IotDeviceFacadeImpl.java`
- `Smart-WorkFlow/sw-basic/sw-basic-iot/pom.xml`
- `Smart-WorkFlow/sw-bootstrap/src/main/resources/application-dev.yml`
- `Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/h2/V39__notify_batch_send_permission.sql`（确认最新版本号）
- `Smart-WorkFlow/docs/governance/engineering-constitution.md`

## 3. 实际修改的文件
- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/entity/IotDevice.java`（新增 productId, deviceName, tencentStatus 字段）
- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/entity/IotDeviceCommand.java`（新增 productId, deviceName, commandType, semanticMode, idempotentKey, expiryTime, retryCount, lastError, tencentRequest Id, clientToken, deviceOutput 字段）
- `Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/h2/V40__iot_device_identity_upgrade.sql`（新建 H2 迁移）
- `Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/postgresql/V40__iot_device_identity_upgrade.sql`（新建 PostgreSQL 迁移）
- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/mapper/IotDeviceMapper.java`（新增 selectByProductAndDeviceName 方法）
- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/mapper/IotDeviceCommandMapper.java`（新增 selectPendingByProductAndDevice, selectExpired, selectByIdempotentKey, selectStuckCommands 方法）
- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/service/IotDeviceService.java`（更新接口签名）
- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/service/impl/IotDeviceServiceImpl.java`（实现新接口）
- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/controller/IotDeviceController.java`（更新 API 路径）
- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/api/IotDeviceFacade.java`（更新接口签名）
- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/api/impl/IotDeviceFacadeImpl.java`（实现新接口）
- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/enums/CommandStatus.java`（新建枚举）
- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/provider/DeviceControlProvider.java`（新建接口）
- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/provider/MockCloudProvider.java`（新建实现）
- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/provider/TencentCloudProvider.java`（新建实现）
- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/config/TencentCloudProperties.java`（新建配置）
- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/config/IotAutoConfiguration.java`（更新自动配置）
- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/service/CommandQueueService.java`（新建接口）
- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/service/impl/CommandQueueServiceImpl.java`（新建实现）
- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/util/DeferredControlUtil.java`（新建工具类）
- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/util/OnlineConfirmControlUtil.java`（新建工具类）
- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/hook/TencentDeviceStatusHook.java`（新建 Hook）
- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/job/CommandCompensationJob.java`（新建定时任务）
- `Smart-WorkFlow/sw-basic/sw-basic-iot/pom.xml`（新增腾讯云 SDK 依赖和测试依赖）
- `Smart-WorkFlow/sw-bootstrap/src/main/resources/application-dev.yml`（新增 IoT 配置）
- `Smart-WorkFlow/sw-biz/sw-bpm/sw-bpm-api/src/main/java/com/sw/ck/bpm/api/event/BpmDeviceCommandEvent.java`（更新事件字段）
- `Smart-WorkFlow/sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/listener/BpmDeviceCommandListener.java`（更新监听器）
- `Smart-WorkFlow/sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/controller/BpmTodoController.java`（更新控制器）
- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/test/java/com/sw/ck/iot/service/CommandQueueServiceTest.java`（新建测试）
- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/test/java/com/sw/ck/iot/util/DeferredControlUtilTest.java`（新建测试）
- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/test/java/com/sw/ck/iot/util/OnlineConfirmControlUtilTest.java`（新建测试）
- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/test/java/com/sw/ck/iot/hook/TencentDeviceStatusHookTest.java`（新建测试）

## 4. 每个文件的修改摘要

### IotDevice.java
- 新增 `productId` 字段（String, not null）：腾讯云产品 ID
- 新增 `deviceName` 字段（String, not null）：腾讯云设备名称
- 新增 `tencentStatus` 字段（String）：腾讯云设备在线状态
- 更新类注释说明设备身份规则

### IotDeviceCommand.java
- 新增 `productId`, `deviceName` 字段：设备复合身份
- 新增 `commandType` 字段：PROPERTY / ACTION
- 新增 `semanticMode` 字段：DEFERRED / ONLINE_CONFIRM
- 新增 `idempotentKey` 字段：幂等键
- 新增 `expiryTime` 字段：命令过期时间
- 新增 `retryCount` 字段：已尝试次数
- 新增 `lastError` 字段：最后失败原因
- 新增 `tencentRequestId` 字段：腾讯云 RequestId
- 新增 `clientToken` 字段：腾讯云异步行为 ClientToken
- 新增 `deviceOutput` 字段：设备输出参数
- 更新类注释说明状态流转

### V40__iot_device_identity_upgrade.sql
- H2 和 PostgreSQL 双方言迁移脚本
- 新增 product_id, device_name, tencent_status 字段到 sw_iot_device 表
- 新增 product_id, device_name, command_type, semantic_mode, idempotent_key, expiry_time, retry_count, last_error, tencent_request_id, client_token, device_output 字段到 sw_iot_device_command 表
- 创建唯一索引和查询索引

### DeviceControlProvider.java
- 定义设备控制提供者接口
- 包含 queryDeviceStatus, controlDeviceData, callDeviceActionSync 方法
- 定义 DeviceControlResult 记录类型

### TencentCloudProperties.java
- 定义腾讯云 IoT Explorer 配置属性
- 包含 region, endpoint, secretId, secretKey, hookToken 等配置
- 提供 hasCredentials() 和 shouldUseTencent() 方法

### MockCloudProvider.java
- 实现 Mock 设备控制提供者
- 使用 ConcurrentHashMap 模拟设备在线状态
- 用于开发和测试环境

### TencentCloudProvider.java
- 实现腾讯云 IoT Explorer 设备控制提供者
- 使用腾讯云 Java SDK 初始化客户端
- 实现设备状态查询、属性下发和行为调用

### CommandQueueService.java
- 定义命令队列服务接口
- 包含 enqueue, markSending, markSent, markDelivered, markAcked, markSuccess, markFailed, markUnknown, markExpired 方法
- 包含 getPendingCommands, getExpiredCommands, getStuckCommands 查询方法

### DeferredControlUtil.java
- 实现延迟生效类控制工具
- controlProperty: 属性控制（延迟生效语义）
- controlAction: 行为控制（延迟生效语义）
- flushDeviceCommands: 补发设备待发送命令

### OnlineConfirmControlUtil.java
- 实现在线确认类控制工具
- controlPropertyOnline: 属性控制（在线确认语义）
- controlActionOnline: 行为控制（在线确认语义）

### TencentDeviceStatusHook.java
- 实现腾讯云设备状态事件 Hook
- 校验鉴权 Token
- 解析腾讯云事件格式
- 更新设备状态
- 异步触发补发

### CommandCompensationJob.java
- 实现命令补偿定时任务
- 处理过期命令
- 处理滞留命令
- 重试瞬时失败

## 5. 实际执行的命令
```bash
cd Smart-WorkFlow
MAVEN_OPTS="-Xmx2g" mvn clean compile -pl sw-basic/sw-basic-iot -am -q
MAVEN_OPTS="-Xmx2g" mvn test -pl sw-basic/sw-basic-iot
MAVEN_OPTS="-Xmx2g" mvn clean compile -q
```

## 6. 命令输出摘要
- IoT 模块编译成功
- 18 个测试全部通过（CommandQueueServiceTest: 5, DeferredControlUtilTest: 3, OnlineConfirmControlUtilTest: 5, TencentDeviceStatusHookTest: 5）
- 全量编译成功

## 7. 与原方案的偏差
- 无偏差，完全按需求方向文档执行

## 8. 遇到的问题
1. 腾讯云 SDK API 与预期不同：`DescribeDeviceStatusRequest` 不存在，需使用 `DescribeDeviceRequest`
2. `HttpProfile.setConnectTimeout` 方法不存在，需使用 `setConnTimeout`
3. `CallDeviceActionSyncResponse.getOutput()` 方法不存在，需使用 `getOutputParams()`
4. BPM 模块调用了旧的 Facade 接口，需要同步更新

## 9. 未完成内容
- 无

## 10. 风险和注意事项
- 腾讯云 SDK 依赖可能与现有依赖冲突（已验证无冲突）
- 测试环境无法连接真实腾讯云（使用 Mock Provider）

## 11. Git diff 摘要
- 新建 20 个文件
- 修改 15 个文件
- 删除 0 个文件

## 12. 建议执行的测试
- 全量编译验证
- IoT 模块单元测试
- BPM 模块编译验证
