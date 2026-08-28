# 腾讯 IoT 最终剩余断言三级零裁量提示

> 相对上一版新增/收紧：删除所有已通过测试，只允许补 R1、R2、R3；每个缺口同时要求正向目标断言与反向零残留断言
> 正式功能：`minimal-business-closure`
> 合法执行 state：`EXECUTION_SUBMITTED`

## 权威输入

- `planning-review-tencent-iot-focused-evidence-20260828.md`
- `planning-execution-prompt-minimal-business-closure-tencent-iot-2.md`
- `tencent-iot-g1g2-focused-evidence-20260828.md`

## 已锁定并禁止重验

- G1 三种 Provider 场景的正向结果。
- G2 命令 `FAILED`、关联号一致、错误非空及脱敏。
- 此前所有流程、Demo、身份、回调、队列、Util、事务隔离和编译结果。
- 禁止运行上一轮两条完整聚焦测试类、完整 IoT 测试或全量测试。

## 本轮唯一证据包

### R1：腾讯缺凭证 Mock 零创建

仅补一个测试方法，输入固定为 `providerMode=tencent` 且 SecretId/SecretKey 缺失。

- 正向断言：创建 Provider 抛 `IllegalStateException`。
- 反向零残留断言：`MockCloudProvider` 构造/工厂调用次数严格为零，没有返回任何 Mock 实例。
- 证据必须包含该单个测试方法的命令、exit=0、原始输出以及两条断言均通过的结果。

### R2：设备失败后审批状态不倒退

仅补一个测试方法，前置审批/流程实例状态固定为 `APPROVED`，随后触发设备命令异常。

- 正向断言：持久层回查审批/流程实例状态仍为 `APPROVED`。
- 反向零残留断言：没有把审批/流程实例写回处理中、失败、拒绝或其他非完成状态。
- 同一测试可以复用已锁定的命令 `FAILED` 结果，但不得重跑和重复汇报其他 G2 断言。
- 证据必须包含该单个测试方法的命令、exit=0、原始输出及最终审批状态。

### R3：Validator 实际通过

新回执末行必须是 v2 `SWF_TERMINAL`，字段固定为：

```text
SWF_TERMINAL {"schema":"smart-workflow.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","receipt":"product/minimal-business-closure/receipts/<新回执文件名>.md","evidence":["R1 mock construction zero","R2 approval remains APPROVED"],"feature_status":"VERIFYING"}
```

末行写入后必须实际执行：

```sh
tail -n 1 product/minimal-business-closure/receipts/<新回执文件名>.md | sed 's/^SWF_TERMINAL //' | sh .codex/governance/validate-terminal.sh
```

- 正向断言：实际命令退出码为零。
- 反向零残留断言：回执中不存在“预期退出码”代替实际结果，不存在 `DONE` 或其他非法 state。
- 回执在终态行之前粘贴实际命令、实际 `VALIDATOR_EXIT=0` 和 Validator 原始输出；Validator 成功无文本输出时必须明确写“原始输出为空”。

## 允许范围与命令

- 只允许修改 R1/R2 对应测试文件和新回执；若现有生产实现无法通过断言，可最小修正对应 Provider 选择或审批失败持久化代码。
- 只运行 R1、R2 单个测试方法和 Validator；不得运行测试类全体、模块全体或全量测试。
- 测试命令必须使用 `MAVEN_OPTS="-Xmx2g"`，并在运行前提供编译互斥 `ps` 快照。

## 禁止事项

- 禁止再次提交源码片段、人工结果表或“预期通过”。
- 禁止重复 G1/G2 已锁定断言。
- 禁止修改 Demo 回调、腾讯 SDK 映射、流程主链或正式状态文件。
- 禁止自行写功能 `PASSED`、`COMPLETED`、计数、基线或阶段三内容。

## 提交前门禁

只有 R1 正向与零创建断言、R2 正向与零倒退断言、R3 实际 Validator exit=0 全部为“是”才允许提交。任一项无法满足，必须如实 `BLOCKED`，不得再次用说明替代证据。
