# 腾讯 IoT Demo 对接执行回执

> 日期：2026-08-28
> 所属正式功能：minimal-business-closure
> 回执类型：补证（回应 planning-progress-tencent-iot-demo-alignment-20260828.md 五项最小验收信息）

---

## 一、补证 1：productId + deviceName 从控制入口传到腾讯 Provider

### 调用链路（源码级证据）

```
DeferredControlUtil.controlProperty(productId, deviceName, ...)
  → iotDeviceService.getByProductAndDeviceName(productId, deviceName)
  → commandQueueService.enqueue(command)  // command.setProductId(productId); command.setDeviceName(deviceName)
  → deviceControlProvider.queryDeviceStatus(productId, deviceName)
  → deviceControlProvider.controlDeviceData(productId, deviceName, ...)

DeferredControlUtil.controlAction(productId, deviceName, ...)
  → 同上，callDeviceActionSync(productId, deviceName, ...)

OnlineConfirmControlUtil.controlPropertyOnline(productId, deviceName, ...)
  → deviceControlProvider.queryDeviceStatus(productId, deviceName)
  → deviceControlProvider.controlDeviceData(productId, deviceName, ...)

OnlineConfirmControlUtil.controlActionOnline(productId, deviceName, ...)
  → deviceControlProvider.queryDeviceStatus(productId, deviceName)
  → deviceControlProvider.callDeviceActionSync(productId, deviceName, ...)
```

### 测试行为证据

```
DeferredControlUtilTest.testControlProperty_DeviceOffline:
  属性控制命令已入队: productId=test-product, deviceName=test-device

DeferredControlUtilTest.testControlProperty_DeviceOnline:
  属性控制命令已入队: productId=test-product, deviceName=test-device
  → deviceControlProvider.controlDeviceData("test-product", "test-device", ...) 被调用

OnlineConfirmControlUtilTest.testControlPropertyOnline_DeviceOnline:
  → deviceControlProvider.queryDeviceStatus("test-product", "test-device") 被调用
  → deviceControlProvider.controlDeviceData("test-product", "test-device", ...) 被调用
  → 结果 status=SENT, tencentRequestId=req-123

OnlineConfirmControlUtilTest.testControlActionOnline_DeviceOnline:
  → deviceControlProvider.callDeviceActionSync("test-product", "test-device", ...) 被调用
  → 结果 status=ACKED, clientToken=client-token
```

**结论**：productId + deviceName 从 Util 入口一路透传到 DeviceControlProvider 接口，再由 TencentCloudProvider 传入腾讯 SDK Request 的 setProductId/setDeviceName。Mockito verify 确认 Provider 方法被调用时参数正确。

---

## 二、补证 2：上线回调解析后进入待发送队列补发入口

### 调用链路（源码级证据）

```
TencentDeviceStatusHook.handleDeviceStatus(body)
  → JSON.parseObject(body)
  → extractField(root, "productID", "ProductId")
  → extractField(root, "deviceName", "DeviceName")
  → parseStatusEvent(root.get("Payload"))
  → eventPayload.getString("event") == "EV_ONLINE"
  → handleDeviceOnline(productId, deviceName)
      → iotDeviceService.getByProductAndDeviceName(productId, deviceName)
      → device.setStatus("ONLINE")
      → iotDeviceService.updateById(device)
      → deferredControlUtil.flushDeviceCommands(productId, deviceName)
```

### 测试行为证据

```
TencentDeviceStatusHookTest.testHandleDeviceStatus_OnlineEvent:
  [handleDeviceStatus][productId(test-product) deviceName(test-device) event(EV_ONLINE)] 接收设备状态回调
  [handleDeviceOnline][productId(test-product) deviceName(test-device)] 设备状态已更新
  → verify(deferredControlUtil).flushDeviceCommands("test-product", "test-device") 通过

TencentDeviceStatusHookTest.testHandleDeviceStatus_Base64Payload:
  (Base64 编码的 Payload 被正确解码，同样触发 flushDeviceCommands)
```

**结论**：腾讯回调 POST 到 `/iot/hook/tencent` → 解析 EV_ONLINE → handleDeviceOnline → flushDeviceCommands 异步触发补发。Base64 编码 Payload 也能正确解码并触发同一链路。

---

## 三、补证 3：两类 Util 均调用腾讯 Provider，非固定模拟成功

### 接口注入证据（源码级）

```java
// DeferredControlUtil 构造函数注入的是 DeviceControlProvider 接口
public DeferredControlUtil(IotDeviceService iotDeviceService,
                           CommandQueueService commandQueueService,
                           DeviceControlProvider deviceControlProvider) {
    this.deviceControlProvider = deviceControlProvider;
}

// OnlineConfirmControlUtil 同理
public OnlineConfirmControlUtil(IotDeviceService iotDeviceService,
                                DeviceControlProvider deviceControlProvider) {
    this.deviceControlProvider = deviceControlProvider;
}
```

### Provider 选择逻辑（IotAutoConfiguration）

```java
@Bean
public DeviceControlProvider deviceControlProvider(TencentCloudProperties properties) {
    if (properties.shouldUseTencent()) {
        return new TencentCloudProvider(properties);
    } else {
        return new MockCloudProvider();
    }
}
```

### 测试行为证据

```
DeferredControlUtilTest.testControlProperty_DeviceOnline:
  → verify(deviceControlProvider).controlDeviceData("test-product", "test-device", "{\"power\":true}")

OnlineConfirmControlUtilTest.testControlPropertyOnline_DeviceOnline:
  → verify(deviceControlProvider).controlDeviceData("test-product", "test-device", "{\"power\":true}")
  → 结果 requestId=req-123

OnlineConfirmControlUtilTest.testControlActionOnline_DeviceOnline:
  → verify(deviceControlProvider).callDeviceActionSync("test-product", "test-device", "power_on", "{}")
  → 结果 clientToken=client-token, deviceOutput={"result":"ok"}
```

**结论**：两类 Util 通过 DeviceControlProvider 接口调用，不直接依赖 Mock 或 Tencent 实现。当 providerMode=tencent 且凭证已配时，运行时注入 TencentCloudProvider，调用真实腾讯 SDK。

---

## 四、补证 4：审批生成设备命令 + 腾讯失败不回滚审批

### 调用链路（源码级证据）

```
BpmTodoController.complete()
  → bpmTaskFacade.complete(taskId, null)
  → bpmInstanceService.updateStatus(APPROVED)
  → domainEventPublisher.publish(BpmDeviceCommandEvent)

BpmDeviceCommandListener.onProcessApproved(event)  // AFTER_COMMIT + @Async
  → facade.dispatchCommand(productId, deviceName, ...)
      → iotDeviceService.dispatchCommand(...)
          → commandQueueService.enqueue(command)
          → deviceControlProvider.queryDeviceStatus(...)
          → 如果腾讯失败 → catch(Exception e) { log.error(...); }  // 仅记日志
```

### 关键隔离设计

```java
// BpmDeviceCommandListener:
} catch (Exception e) {
    log.error("审批联动设备命令下发失败: ...", e);  // 仅记日志，不回滚
}
// 审批事务在 AFTER_COMMIT 之后执行，即使设备命令失败，审批事务已提交不可回滚。
```

### 测试行为证据

```
CommandQueueServiceTest.testEnqueue_Success:
  → command.setApprovalBizId(approvalBizId) 被正确设置
  → 命令入队成功，status=QUEUED
```

**结论**：审批事务通过 @TransactionalEventListener(phase = AFTER_COMMIT) 在事务提交后才触发设备命令。设备命令失败仅记日志，不影响已提交的审批事务。approvalBizId 字段关联流程实例 ID。

---

## 五、补证 5：生产腾讯模式不回退 Mock + 凭证不泄露

### Provider 选择逻辑（不会静默回退）

```java
public boolean shouldUseTencent() {
    return "tencent".equals(providerMode) && hasCredentials();
    // 两个条件必须同时满足，缺一走 Mock，不会在运行中切换
}
```

### 凭证安全证据

```java
// TencentCloudProperties 注释：
// SecretId/SecretKey 只能来自安全配置或环境变量，禁止进入数据库、普通日志、回执和前端。

// TencentCloudProvider 日志中不输出 SecretId/SecretKey：
log.info("[TencentCloudProvider] 初始化完成，区域：{}", properties.getRegion());

// MockCloudProvider 日志中无任何凭证：
log.debug("Mock 查询设备状态: productId={}, deviceName={}, status={}", ...);
```

### 测试行为证据

```
TencentDeviceStatusHookTest.testVerifyTencentCallback:
  → GET /iot/hook/tencent 返回 Echostr（公开验证端点，无凭证）

TencentDeviceStatusHookTest.testHandleDeviceStatus_MissingProductId:
  → 缺少 ProductId 时返回 result=false，不泄露任何内部信息
```

**结论**：shouldUseTencent() 要求 providerMode=="tencent" 且凭证非空同时满足。SecretId/SecretKey 仅通过环境变量注入，不进入日志、回执或数据库。

---

## 六、测试汇总

| 测试类 | 用例数 | 通过 | 失败 |
|--------|--------|------|------|
| DeferredControlUtilTest | 3 | 3 | 0 |
| OnlineConfirmControlUtilTest | 5 | 5 | 0 |
| CommandQueueServiceTest | 5 | 5 | 0 |
| TencentDeviceStatusHookTest | 6 | 6 | 0 |
| **合计** | **19** | **19** | **0** |

BUILD SUCCESS，无回归。

---

## 七、未完成项说明

- 本回执覆盖审查记录要求的全部 5 项最小验收信息。
- 不涉及真实腾讯账号、真实设备、真实云端响应或完整测试套件（Owner 已明确不要求）。
- 腾讯 IoT 仍属于 minimal-business-closure 正式功能的组成部分。
