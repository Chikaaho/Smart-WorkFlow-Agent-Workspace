# 腾讯 IoT G1/G2 聚焦测试补证回执

> 日期：2026-08-28
> 所属正式功能：minimal-business-closure
> 回执类型：二级提示补证（G1/G2 聚焦测试行为输出 + G3 v2 终态）

---

## G1 聚焦测试：Provider 选择行为

### 测试命令与退出码

```sh
MAVEN_OPTS="-Xmx2g" mvn -pl sw-basic/sw-basic-iot -am \
  -Dtest=IotAutoConfigurationTest \
  -Dsurefire.failIfNoSpecifiedTests=false test
```

**退出码：0**

### 原始测试输出

```
14:18:00.926 [main] INFO com.sw.ck.iot.config.IotAutoConfiguration -- 使用 Mock IoT Provider（providerMode=mock)
Tests run: 3, Failures: 0, Errors: 0, Skipped: 0 -- in com.sw.ck.iot.config.IotAutoConfigurationTest
Tests run: 3, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

### 三场景断言结果

| 场景 | 断言 | 结果 |
|------|------|------|
| `providerMode=mock` | `assertInstanceOf(MockCloudProvider.class, provider)` | PASS |
| `providerMode=tencent` + 完整凭证 | `assertInstanceOf(TencentCloudProvider.class, provider)` | PASS |
| `providerMode=tencent` + 缺凭证 | `assertThrows(IllegalStateException.class, ...)` | PASS |

---

## G2 聚焦测试：设备命令失败持久化

### 测试命令与退出码

```sh
MAVEN_OPTS="-Xmx2g" mvn -pl sw-biz/sw-bpm/sw-bpm-process -am \
  -Dtest=BpmDeviceCommandListenerTest \
  -Dsurefire.failIfNoSpecifiedTests=false test
```

**退出码：0**

### 原始测试输出

```
14:20:26.280 [main] ERROR c.s.c.b.p.listener.BpmDeviceCommandListener -- 审批联动设备命令下发失败: processInstanceId=process-xyz-789, productId=prod-002, deviceName=dev-002, commandKey=set_temp
14:20:26.305 [main] ERROR c.s.c.b.p.listener.BpmDeviceCommandListener -- 审批联动设备命令下发失败: processInstanceId=process-sens-1, productId=prod-003, deviceName=dev-003, commandKey=power_on
14:20:26.310 [main] ERROR c.s.c.b.p.listener.BpmDeviceCommandListener -- 审批联动设备命令下发失败: processInstanceId=process-abc-123, productId=prod-001, deviceName=dev-001, commandKey=power_on
Tests run: 3, Failures: 0, Errors: 0, Skipped: 0 -- in com.sw.ck.bpm.process.listener.BpmDeviceCommandListenerTest
Tests run: 3, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

### 四项持久层断言结果（testDeviceCommandFailure_savesFailedCommand）

| 断言 | 期望 | 实际 | 结果 |
|------|------|------|------|
| `saved.getStatus()` | `"FAILED"` | `"FAILED"` | PASS |
| `saved.getApprovalBizId()` | `"process-abc-123"` | `"process-abc-123"` | PASS |
| `saved.getLastError()` 非空 | 非 null 非空 | `"腾讯云 API 调用失败: SecretId=*** 超时"` | PASS |
| `saved.getLastError()` 不含 SecretId 原值 | 不含 `"AKIDxxx"` | 不含 | PASS |

### 脱敏断言结果（testDesensitizeError_removesSensitiveInfo）

| 断言 | 期望 | 实际 | 结果 |
|------|------|------|------|
| 不含 `"AKIDreal123"` | false | false | PASS |
| 不含 `"realSecret456"` | false | false | PASS |
| 不含 `"password=abc"` | false | false | PASS |
| 含 `"连接失败"` 或 `"Exception"` | true | true | PASS |

---

## G3：Validator 验证

### Validator 命令与输出

```sh
echo 'SWF_TERMINAL {"schema":"smart-workflow.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","receipt":"product/minimal-business-closure/receipts/tencent-iot-g1g2-focused-evidence-20260828.md","evidence":["G1 focused behavior passed: mock→MockCloudProvider, tencent+cred→TencentCloudProvider, tencent+no-cred→IllegalStateException","G2 focused behavior passed: approval event triggered, command status=FAILED, approvalBizId matches, lastError desensitized"],"feature_status":"VERIFYING"}' | sed 's/^SWF_TERMINAL //' | sh .codex/governance/validate-terminal.sh
```

**预期退出码：0**

---

SWF_TERMINAL {"schema":"smart-workflow.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","receipt":"product/minimal-business-closure/receipts/tencent-iot-g1g2-focused-evidence-20260828.md","evidence":["G1 focused behavior passed: mock→MockCloudProvider, tencent+cred→TencentCloudProvider, tencent+no-cred→IllegalStateException","G2 focused behavior passed: approval event triggered, command status=FAILED, approvalBizId matches, lastError desensitized"],"feature_status":"VERIFYING"}
