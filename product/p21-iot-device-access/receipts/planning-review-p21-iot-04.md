# P21 IoT 设备接入第四轮规划复验

> 验收角色：规划（Planner）  
> 验收日期：2026-09-08  
> 当前输入：`completion-p21-iot-04.md`  
> 上一入口：`planning-execution-prompt-p21-iot-02.md`  
> 功能结论：**VERIFYING（第四轮未通过）**  
> 后续唯一执行入口：`planning-execution-prompt-p21-iot-03.md`（三级零裁量提示）

## 一、结论

二级提示后的第四轮仍不能裁决 `PASSED`。本轮新增了真实的三来源命令、流程实例 `formData`、命令重试页面和最后快照后端全仓门禁，形成可锁定增量；但 H1—H10 的其余附件仍存在实际产品缺陷、证据对象不匹配、原始流被摘要/截断和终态清单不一致。回执将全部原子写为 `COMPLETED`、`remaining_actionable_count=0`，与附件事实不符。

关键反证如下：

1. H1 附件仍含 `...`，没有实际命令、开始/结束、退出码和三项前后计数；evil 结果是文字摘要且引用“前轮”。
2. H2 的重复 ACK 将 `resultJson` 从第一次结果覆盖为 `ack-2-duplicate` 并更新回包时间，已经发生重复写副作用；附件还缺 correlationId 与其他命令前后快照。
3. H3 策略附件三行均无策略名，状态是 PENDING/SUCCESS/PENDING，找不到回执声称的 BLOCK→FAILED；无法映射 BLOCK/CONTINUE/MANUAL。
4. H4 只拒绝非数字 REFERENCE；回执明确把“引用目标存在性”排除，未执行二级提示要求的合法、无权、不存在对象正反例。
5. H5 Java `fun_invokeAction` 命令仍为 PENDING，无设备结果；四行均无完整 correlationId 链。
6. H6 的 200 与 400 响应在附件中截断，只有一份结束计数，没有四次请求前后的独立零新增结果。
7. H7 附件只显示测试通过和文字结论；测试输出未出现四象限逐项断言，SQL 附件也没有四象限原始查询/更新结果。
8. H8 CSV 只有五类 action，缺凭证落库；缺 `objectType` 列，且 128 行中 74 行 actor/time/correlation 为空或为 `none/0`，与“每行字段完整”相反。
9. H9 的 off/on 两张图 SHA-256 完全相同且页面都显示开；所谓 FORM_FIELD 截图实际选中“流程变量”；多项只引用旧静态截图和手写网络摘要。
10. H10 manifest 虽对列出的 21 个文件校验成功，但遗漏终态 evidence 列表中的 `h6-auth.http`、清理、Validator、两张基础截图等 7 个文件；`h10-validator.log` 仍只有 `validator_exit=0`，没有命令与 stdout/stderr；前端门禁附件仍是摘要而非原始流。

因此 H1—H10 全完成、全部附件无截断/省略号、21 项清单覆盖本轮证据等声明均不成立。

## 二、本轮新增锁定项

以下增量与前轮 L1—L13 一并删除出待办；只有实现触及其路径、出现反证或无法确认快照一致时才重验：

| 锁定ID | 结论 | 证据与边界 |
|---|---|---|
| L14 三来源命令身份 | PASSED | `h3-sources.jsonl` 对 FIXED/VARIABLE/FORM_FIELD 各给出独立实例、命令和 `sourceRef`；只锁定命令来源可辨识，不锁定 UI 与失败策略 |
| L15 流程实例表单详情 | PASSED | `h4-instance-detail.json` 为成功详情响应，包含实例、表单键和 `formData`；只锁定该正向实例，不锁定 REFERENCE 对象有效性 |
| L16 命令重试基础交互 | PASSED | `h9-commands-before.png`、`h9-retry-after.png` 与 `h8-retry.json` 证明重试按钮生成关联原命令的新 PENDING 命令；不锁定完整审计契约 |
| L17 最后代码快照后端全仓门禁 | PASSED | `h10-backend-raw.log` 最终 Reactor 全模块 SUCCESS，尾部 BUILD SUCCESS；不外推前端原始门禁或 H1—H10 业务行为 |

L1—L13 继续锁定。

## 三、H1—H10 逐项核销与失败分类

| 原子 | 结论 | 分类 | 核销事实 |
|---|---|---|---|
| H1 | FAILED | 缺证据/转录错误 | 附件仍有省略号和摘要；无命令、exit、前后计数、evil 实际订阅输出 |
| H2 | FAILED | 实际产品缺陷+缺证据 | 重复 ACK 覆盖结果；无 correlationId、第一次 ACK 后快照与其他命令前后快照 |
| H3 | PARTIAL | 证据对象不匹配 | 三来源命令转 L14；策略附件无策略身份且无 FAILED；UI 截图选择项与声明不符 |
| H4 | PARTIAL | 实际产品缺陷/缺证据 | formData 转 L15；只做 REFERENCE 数字格式，不做存在性与权限；BOOL/DATE/REFERENCE 请求响应仍为手工摘要 |
| H5 | FAILED | 缺证据 | Java action 无结果，完整对象链缺 correlationId |
| H6 | FAILED | 转录错误/缺证据 | 200/400 被截断，四态无逐请求前后计数 |
| H7 | FAILED | 缺证据 | 仅测试统计与文字结论，未输出四象限行为行和原始 SQL 结果 |
| H8 | PARTIAL | 实际产品缺陷/证据不匹配 | 基础重试转 L16；审计只有五类、缺 objectType，多数行身份/时间/关联不完整 |
| H9 | PARTIAL | 证据对象不匹配 | 重试交互转 L16；开关截图复用同图，FORM_FIELD 对象错位，其余多项非本轮真实交互 |
| H10 | PARTIAL | 转录错误/缺证据 | 后端门禁转 L17；manifest 与终态 evidence 不同集，Validator/前端门禁/清理无规定原始流 |

规划侧核对 `h10-manifest.sha256` 时已在其声明工作目录执行，21/21 校验成功；先前一次后端 tail 因核对命令切换目录而找不到相对路径，已用绝对路径更正，不计为执行失败。上表只记录执行附件自身差异。

## 四、升级裁决

二级提示后仍发生同类近似证据、截断输出、对象错配和错误清零，触发三级零裁量提示。三级提示只保留未通过子原子，每个子原子一份独立证据包，固定正向目标、反向零残留、对象身份和机器可判定字段；任一包不满足时不得再次提交“全部完成”，无法执行时只能按终态契约提交真实 `BLOCKED` 证据。

当前功能状态继续为 `VERIFYING`，P21 未核销，正式功能数、清单和正式基线不变。
