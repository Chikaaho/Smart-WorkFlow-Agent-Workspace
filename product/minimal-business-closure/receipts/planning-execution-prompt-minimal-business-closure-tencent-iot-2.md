# 腾讯 IoT 剩余缺口二级执行补充提示

> 相对上一版：删除源码说明型证据，G1/G2 必须使用聚焦测试的原始行为输出，G3 固定为 v2 执行提交终态并通过公共 Validator
> 正式功能：`minimal-business-closure`
> 合法执行 state：`EXECUTION_SUBMITTED`

## 权威输入

- `planning-review-tencent-iot-g1g2-fix-20260828.md`
- `planning-execution-prompt-minimal-business-closure-tencent-iot-1.md`
- `tencent-iot-g1g2-fix-execution.md`

## 本轮唯一剩余缺口矩阵

| 缺口 | 失败事实 | 本轮唯一可接受证据 |
|---|---|---|
| G1 | 仅提交代码片段和人工场景表 | 聚焦测试真实创建 Provider：显式 Mock 得到 Mock；腾讯凭证齐全得到腾讯 Provider；腾讯缺凭证抛异常且 Mock 零调用 |
| G2 | 仅提交保存方法和人工查询表 | 聚焦测试真实触发设备异常，并从持久层回查：审批已完成、关联命令为 FAILED/UNKNOWN、approvalBizId 一致、脱敏错误非空且无 Secret |
| G3 | 使用自造 `DONE` schema | v2 `SWF_TERMINAL` 末行 + 公共 Validator 原始输出 exit=0 |

## 已锁定通过并禁止读取扩散/重验

- 流程主链、模拟设备链、Demo 回调对齐。
- 复合设备身份、上线回调进入补发、两类 Util 调用 Provider。
- 审批事务提交后再处理设备命令。
- 真实腾讯账号、真实设备、真实云端响应、完整测试套件。

## 精确允许输入与修改文件

允许读取/修改：

- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/config/IotAutoConfiguration.java`
- `Smart-WorkFlow/sw-basic/sw-basic-iot/src/test/java/com/sw/ck/iot/config/IotAutoConfigurationTest.java`（可新建）
- `Smart-WorkFlow/sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/listener/BpmDeviceCommandListener.java`
- `Smart-WorkFlow/sw-biz/sw-bpm/sw-bpm-process/src/test/java/com/sw/ck/bpm/process/listener/BpmDeviceCommandListenerTest.java`（可新建）
- 为上述测试编译所必需的直接接口/实体；不得修改其他业务功能。
- 新的 G1/G2 补证回执；不得覆盖历史回执。

## 允许命令与执行顺序

先提交前后端编译互斥 `ps` 快照，然后只运行：

```sh
MAVEN_OPTS="-Xmx2g" mvn -pl sw-basic/sw-basic-iot -am -Dtest=IotAutoConfigurationTest -Dsurefire.failIfNoSpecifiedTests=false test
MAVEN_OPTS="-Xmx2g" mvn -pl sw-biz/sw-bpm/sw-bpm-process -am -Dtest=BpmDeviceCommandListenerTest -Dsurefire.failIfNoSpecifiedTests=false test
tail -n 1 product/minimal-business-closure/receipts/<新回执文件名>.md | sed 's/^SWF_TERMINAL //' | sh .codex/governance/validate-terminal.sh
```

不允许运行全量测试，不允许重新运行已锁定 IoT 测试集合。

## 独立证据包

### G1 证据包

必须粘贴聚焦测试命令、退出码和原始结果，并明确包含以下断言结果：

- `providerMode=mock` → `MockCloudProvider`。
- `providerMode=tencent` + 完整凭证 → `TencentCloudProvider`。
- `providerMode=tencent` + 缺凭证 → `IllegalStateException`，且未创建 `MockCloudProvider`。

### G2 证据包

必须粘贴聚焦测试命令、退出码和原始结果，并在测试行为中同时断言：

- 审批状态保持已完成。
- 关联命令状态为 `FAILED` 或 `UNKNOWN`。
- `approvalBizId` 与流程实例一致。
- `lastError` 非空，不含 SecretId、SecretKey、password、token 原值。

### G3 证据包

回执末行固定使用以下字段结构，`receipt` 替换为实际新回执路径，`evidence` 写 G1/G2 行为结果：

```text
SWF_TERMINAL {"schema":"smart-workflow.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","receipt":"product/minimal-business-closure/receipts/<新回执文件名>.md","evidence":["G1 focused behavior passed","G2 focused behavior passed"],"feature_status":"VERIFYING"}
```

并在终态行之前粘贴 Validator 命令、exit=0 和原始输出。

## 禁止事项

- 禁止再次以源码片段、调用链、类名、人工场景表替代测试行为。
- 禁止使用 `DONE`、`PASSED`、`COMPLETED` 或其他自造执行 state。
- 禁止重验已锁定项、运行全量测试或扩大到真实腾讯联调。
- 禁止修改正式功能状态、计数、基线、方向归档或阶段三内容。

## 提交前自检矩阵

只有以下全部为“是”才允许提交：G1 三场景均有测试断言；腾讯缺凭证 Mock 零创建；G2 四项持久层结果同时成立；两条聚焦命令 exit=0；Validator exit=0；末行是唯一 v2 `SWF_TERMINAL`。否则如实报告未完成。
