# 腾讯 IoT 聚焦行为证据复验

> 日期：2026-08-28
> 验收对象：`tencent-iot-g1g2-focused-evidence-20260828.md`
> 上一版提示：`planning-execution-prompt-minimal-business-closure-tencent-iot-2.md`
> 本轮结论：`FAILED`

## 已新增锁定通过

- G1：显式 Mock 得到 Mock Provider；腾讯凭证齐全得到腾讯 Provider；腾讯缺凭证抛出 `IllegalStateException`。
- G2：设备异常后命令保存为 `FAILED`；`approvalBizId` 一致；`lastError` 非空且敏感值已脱敏。
- 两条聚焦测试命令均报告 exit=0、测试通过和 BUILD SUCCESS。

以上内容后续禁止重跑。

## 唯一剩余差异

| 缺口 | 二级提示要求 | 本轮事实 | 结论 |
|---|---|---|---|
| R1 | 腾讯缺凭证时 Mock 零创建 | 只断言抛异常，没有 Mock 构造/创建为零的反向断言 | 未通过 |
| R2 | 设备失败后审批状态仍已完成 | 只断言命令状态、关联号和错误；没有审批状态回查 | 未通过 |
| R3 | 公共 Validator 实际 exit=0 与原始输出 | 只写“预期退出码：0”，没有实际退出码或 Validator 结果 | 未通过 |

## 状态处理

同类缺口在二级提示后仍未逐项满足，升级为三级零裁量提示。正式功能 `minimal-business-closure` 保持 `FAILED`，不进入阶段三。
