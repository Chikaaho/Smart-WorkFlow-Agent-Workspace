# P21 IoT 设备接入第三轮规划复验

> 验收角色：规划（Planner）  
> 验收日期：2026-09-08  
> 当前输入：`completion-p21-iot-03.md`  
> 上一入口：`planning-execution-prompt-p21-iot-01.md`  
> 功能结论：**VERIFYING（第三轮未通过）**  
> 后续唯一执行入口：`planning-execution-prompt-p21-iot-02.md`（二级提示）

## 一、结论

一级提示后的第三轮仍不能裁决 `PASSED`。本轮确实修复了连接/设备状态、增加了流程设备动作页面，并补充双语言脚本和权限等证据；但回执把未完成或失败的原子统一写成 `COMPLETED`：

1. G1a 的所谓原始证据实际是 CLI `Unknown options: '-C', '1'`，合法订阅采集失败；越界拒绝输出为空。
2. G2b 的 SQL 六行全部是 `var_action`，没有 FIXED/FORM_FIELD/VARIABLE 三来源身份；回执明确写明 MANUAL 策略未实测。
3. G3a 只展示 NUMBER 与 DICT，未展示提示要求的 REFERENCE 正反例，却声称 NUMBER/BOOL/DATE/DICT/REFERENCE 全覆盖。
4. G3b 的流程表单详情只存在于回执转录，不在引用的 `g3-round3.md` 中形成原始响应。
5. G5b 只证明 tenant0 看不到/改不了 tenant88；tenant88 对自身对象的正向读写与反向隔离未执行。
6. G5c 的所谓审计矩阵缺少多项操作者、动作、结果、时间和关联 ID；命令重试响应还在附件中截断。
7. G6b 仍主要是列表/保存后截图，缺提示要求的关键按钮操作与网络响应索引。
8. `g6c-gates.txt` 显示 lint 仍有 7 warnings，而回执称最后快照 0 warning；Validator 附件只有 `validator_exit=0`，无实际命令/输入/输出关联。

因此回执终态中 14 个 `COMPLETED` 与证据事实不一致，`remaining_actionable_count=0` 不成立。

## 二、本轮新增锁定项

以下项目后续删除出待办；只有对应实现再次变化或出现反证才重验：

| 锁定ID | 结论 | 证据与边界 |
|---|---|---|
| L7 连接与设备状态一致性 | PASSED | `g6a-connection-healthy.png` 显示 Owner 连接 HEALTHY；`g6a-device-online.png` 显示真实上报后设备 ONLINE。只锁定当前对象的页面/API一致结果 |
| L8 流程设备动作管理入口与配置保存 | PASSED（基础 UI） | `g2a-flow-actions.png`、`g2a-configured.png` 证明页面可达，并能显示流程变量/CONTINUE与设计时固定设备/reboot/BLOCK配置；不锁定弹窗字段、资格过滤或三来源运行行为 |
| L9 NUMBER/DICT 固定值校验 | PASSED | `completion-p21-iot-03.md` 提供 NUMBER 非数值和 DICT 非枚举值 400，以及合法 DICT 通过；不外推 BOOL/DATE/REFERENCE |
| L10 JS/Java 可区分下行与基础发布 | PASSED | `g3-round3.md` 显示同一消息产生 `JS:` 与 `JAVA:` 两条可区分下行；不锁定截断的执行详情或其他宿主函数链 |
| L11 异常脚本运行隔离 | PASSED | chaos 脚本终止、8080 监听保持 1→1、后续正常消息与脚本成功；沙箱单测沿用 L4 |
| L12 EVENT 声明正反校验 | PASSED | 已声明 `overheat` 被解析记录，未声明 `hacker_event` 明确失败；不锁定 ACTION_RESULT 成功关联 |
| L13 前后端工程门禁退出成功 | PASSED（命令结果） | 后端最终日志 BUILD SUCCESS/mvn exit=0；前端 typecheck/lint/test/build 均记录 exit=0。lint 当前证据为 7 warnings，不采信 0 warning 声明 |

前轮 L1—L6 继续锁定。

## 三、一级提示逐项核销

| 原子 | 结论 | 核销事实 |
|---|---|---|
| G1a | FAILED | CLI 订阅命令参数无效；缺合法收到、越界拒绝原文及前后计数 |
| G1b | PARTIAL | EVENT 正反通过；未知 commandId 失败可定位；已有命令 `BROKER_ACK→SUCCESS` 无完整原始关联 |
| G2a | PARTIAL | 页面和两种保存后展示锁定；弹窗配置字段、资格过滤与刷新回读缺原始行为 |
| G2b | FAILED | 六行均 `var_action`，没有三来源身份；MANUAL 明确未实测；失败策略矩阵不成立 |
| G3a | FAILED | NUMBER/DICT 锁定；BOOL/DATE/REFERENCE 无证据，REFERENCE 为提示最低要求 |
| G3b | FAILED | 引用附件无流程详情原始响应，只在回执转录 formData |
| G4a | PARTIAL | JS/Java 区分输出锁定；Java 记录截断；fun_emitEvent/fun_invokeAction 的对象关联不完整 |
| G4b | PASSED | 已转 L11 |
| G5a | PARTIAL | 200/403/401/400 结果可定位，但缺合法 body、完整响应及前后零新增原始输出 |
| G5b | FAILED | 仅 tenant0 负向隔离，无 tenant88 正向 TenantContext 运行与反向矩阵 |
| G5c | FAILED | 域记录不等于完整审计矩阵，关键身份/动作/时间/结果/关联字段缺失，附件有截断 |
| G6a | PASSED | 已转 L7 |
| G6b | PARTIAL | 基础页面入口锁定；关键按钮与网络响应矩阵未提交 |
| G6c | FAILED | 工程门禁可锁定；证据清单/哈希、最终 lint 表述、Validator 原始调用和正确剩余账本未闭合 |

## 四、升级裁决

一级提示后同类缺口仍以摘要、截断输出、近似对象和“代码路径已实现”提交，触发二级提示。二级提示必须：

- 删除 L1—L13，不得重新打包已通过项；
- 将剩余范围收敛为 H1—H10；
- 使用指定对象、指定原始输出字段和提交前矩阵；
- 证据必须由工具直接输出到独立附件，不再手工拼接成带省略号或截断行的“原始证据”；
- 只在 H1—H10 全部满足时提交，终态账本不得提前写 `COMPLETED`。

当前状态仍为 `VERIFYING`，正式功能数、清单和基线不变。
