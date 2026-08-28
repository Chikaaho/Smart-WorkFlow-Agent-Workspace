# 腾讯 IoT R1/R2/R3 三级提示补证回执

> 日期：2026-08-28
> 所属正式功能：minimal-business-closure
> 权威输入：`planning-execution-prompt-minimal-business-closure-tencent-iot-3.md` + `planning-review-tencent-iot-focused-evidence-20260828.md`
> 本轮范围：仅补 R1、R2、R3；G1/G2 已锁定项未重跑，未运行任何测试类全体或全量测试。

---

## R1：腾讯缺凭证时 Mock 零创建

### 测试方法

`IotAutoConfigurationTest#testTencentMode_withoutCredentials_neverConstructsMockProvider`
输入固定：`providerMode=tencent` 且 SecretId/SecretKey 缺失。通过 Mockito `mockConstruction(MockCloudProvider.class)` 拦截全部构造。

### 测试命令与实际退出码

```sh
MAVEN_OPTS="-Xmx2g" mvn -pl sw-basic/sw-basic-iot -am \
  -Dtest='IotAutoConfigurationTest#testTencentMode_withoutCredentials_neverConstructsMockProvider' \
  -Dsurefire.failIfNoSpecifiedTests=false test
```

实际退出码：`R1_MVN_EXIT=0`

运行前编译互斥 `ps` 快照：`NO_BUILD_PROCESS`

### 原始输出

```
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.679 s -- in com.sw.ck.iot.config.IotAutoConfigurationTest
[INFO] 
[INFO] Results:
[INFO] 
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] BUILD SUCCESS
```

### 断言结果

| 断言类型 | 断言 | 结果 |
|---|---|---|
| 正向 | 创建 Provider 抛 `IllegalStateException`，异常信息含 `SecretId` | PASS |
| 反向零残留 | `mocked.constructed().size() == 0`：`MockCloudProvider` 构造/工厂调用次数严格为 0 | PASS |
| 反向零残留 | `mocked.constructed().isEmpty()`：没有返回任何 Mock 实例 | PASS |

---

## R2：设备失败后审批状态不倒退

### 测试方法

`BpmDeviceCommandListenerTest#testDeviceCommandFailure_approvalInstanceRemainsApproved`
前置：流程实例 `BpmInstance(id=1, processInstanceId=process-appr-r2, status=APPROVED)` 固化在持久层存储（stub `selectById` 回查）；随后触发 `dispatchCommand` 设备异常。命令 `FAILED` 结果复用已锁定 G2 行为，未重复汇报其他 G2 断言。

### 测试命令与实际退出码

```sh
MAVEN_OPTS="-Xmx2g" mvn -pl sw-biz/sw-bpm/sw-bpm-process -am \
  -Dtest='BpmDeviceCommandListenerTest#testDeviceCommandFailure_approvalInstanceRemainsApproved' \
  -Dsurefire.failIfNoSpecifiedTests=false test
```

实际退出码：`R2_MVN_EXIT=0`

运行前编译互斥 `ps` 快照：`NO_BUILD_PROCESS`

### 原始输出

```
14:39:50.744 [main] INFO com.sw.ck.bpm.process.listener.BpmDeviceCommandListener -- 设备命令失败状态已保存: productId=prod-r2, deviceName=dev-r2, approvalBizId=process-appr-r2
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.739 s -- in com.sw.ck.bpm.process.listener.BpmDeviceCommandListenerTest
[INFO] 
[INFO] Results:
[INFO] 
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] BUILD SUCCESS
```

### 断言结果

| 断言类型 | 断言 | 结果 |
|---|---|---|
| 正向 | 持久层回查 `instanceMapper.selectById(1L).getStatus()` 仍为 `APPROVED` | PASS |
| 反向零残留 | `verify(instanceMapper, never()).updateById(any)`：未写回任何状态 | PASS |
| 反向零残留 | `verify(instanceMapper, never()).update(any, any)`：未批量更新为处理中/失败/拒绝 | PASS |
| 反向零残留 | `verify(instanceMapper, never()).deleteById(...)`：未删除实例 | PASS |

---

## R3：Validator 实际通过

### Validator 实际命令

```sh
tail -n 1 product/minimal-business-closure/receipts/tencent-iot-r1r2r3-focused-evidence-20260828.md | sed 's/^SWF_TERMINAL //' | sh .codex/governance/validate-terminal.sh
```

实际结果：`VALIDATOR_EXIT=0`

原始输出为空（Validator 成功时无文本输出）。

执行说明：首次尝试因 shell 工作目录停留在后端子仓库导致 `tail`/脚本路径不存在（exit=127，未触及 Validator）；从工作区根目录按上述命令实际执行后得到 `VALIDATOR_EXIT=0`。

### 反向零残留断言

- 本回执不存在"预期退出码"字样代替实际结果（R3 节为实际执行结果；历史 G3 差异所在回执未被覆盖）。
- 末行 state 为 `EXECUTION_SUBMITTED`，不存在 `DONE` 或其他非法 state。

---

## 本轮实际修改文件

- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/test/java/com/sw/ck/iot/config/IotAutoConfigurationTest.java`（新增 R1 测试方法）
- `Smart-WorkFlow/sw-biz/sw-bpm/sw-bpm-process/src/test/java/com/sw/ck/bpm/process/listener/BpmDeviceCommandListenerTest.java`（新增 R2 测试方法）
- 本回执

未修改任何生产代码、Demo 回调、腾讯 SDK 映射、流程主链或正式状态文件。

## 提交前门禁自检矩阵

| 门禁项 | 是/否 |
|---|---|
| R1 正向断言（抛 IllegalStateException） | 是 |
| R1 反向零创建断言（Mock 构造严格为 0） | 是 |
| R2 正向断言（回查仍 APPROVED） | 是 |
| R2 反向零倒退断言（零写操作） | 是 |
| R3 实际 Validator exit=0 | 是 |
SWF_TERMINAL {"schema":"smart-workflow.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","receipt":"product/minimal-business-closure/receipts/tencent-iot-r1r2r3-focused-evidence-20260828.md","evidence":["R1 mock construction zero","R2 approval remains APPROVED"],"feature_status":"VERIFYING"}
