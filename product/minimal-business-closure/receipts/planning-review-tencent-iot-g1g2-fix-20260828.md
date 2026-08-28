# 腾讯 IoT G1/G2 修复复验

> 日期：2026-08-28
> 验收对象：`tencent-iot-g1g2-fix-execution.md`
> 上一版提示：`planning-execution-prompt-minimal-business-closure-tencent-iot-1.md`
> 本轮结论：`FAILED`

## 结论

回执声称 G1 与 G2 已修改，但没有按一级提示提交行为结果，不能据此验收通过。

## 逐缺口核销

| 缺口 | 本轮提交 | 复验结论 |
|---|---|---|
| G1 腾讯模式不回退 Mock | 修改前后代码片段 + 人工三场景表 | 未通过：没有三种配置实际创建 Provider/启动失败的测试或原始输出 |
| G2 命令失败结果可查询 | 新增方法代码片段 + 人工查询结果表 | 未通过：没有真实执行监听器失败分支并回查审批与命令记录的行为输出 |
| G3 合法结构化终态 | `SWF_TERMINAL {"status":"DONE",...}` | 未通过：不符合 v2 schema；`DONE` 不是执行提交合法 state，且没有公共 Validator exit=0 结果 |

## 锁定项

此前锁定的流程主链、Demo 对齐、复合身份、上线补发入口、两类 Util 接入和审批事务隔离继续有效，禁止重验。

## 失败类型与处理

这是一级提示后再次以源码说明和人工结果表替代行为证据，属于同类重复失败。下一轮升级为二级原子化提示，只允许提交 G1、G2、G3 的独立证据包。

正式功能 `minimal-business-closure` 保持 `FAILED`，不进入阶段三。
