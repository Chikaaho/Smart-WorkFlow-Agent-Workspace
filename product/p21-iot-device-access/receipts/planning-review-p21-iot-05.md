# P21 IoT 设备接入第五轮规划复验

> 验收角色：规划（Planner）  
> 验收日期：2026-09-08  
> 当前输入：`completion-p21-iot-05.md`  
> 上一入口：`planning-execution-prompt-p21-iot-03.md`  
> 功能结论：**VERIFYING（第五轮未通过）**  
> 后续唯一执行入口：`planning-execution-prompt-p21-iot-04.md`（三级后续收敛提示）

## 一、结论

第五轮不能裁决 `PASSED`。本轮确实关闭多项真实产品缺陷，并形成可独立锁定的 REFERENCE 对象校验、双语言关联、四态鉴权、审计和 API 行为；但三级提示规定的若干 final 包仍以旧附件、单元测试、API 查询或 `index.json` 自述替代指定行为证据，终态 manifest、Validator 与浏览器状态也不一致。

关键反证：

1. `final-h1/raw.topic.stdout.log` 与上轮文件哈希相同，仍包含 `...`、“前轮归档”和单份计数；不是三级提示后的新 CLI 原始流。
2. H2 从已经 SUCCESS 的命令开始，只证明终态重复 ACK 不再覆盖部分字段；没有 BROKER_ACK→SUCCESS 的首次转换、版本/副作用计数和其他命令前后快照。
3. H3a 用 `IotProcessTriggerListenerPolicyTest` 单测替代三级提示固定的真实三规则/三 trigger 运行；没有 strategy/configId/triggerId/instance/countBefore/After JSONL。
4. H3b 包只有流程定义和合格设备两个 API 输出；没有三来源浏览器 before/selected/saved/reloaded、网络请求响应和不合格设备对象。
5. H4b 只提交三种错误合并反例，没有 BOOL、DATE、REFERENCE 各自正例及每例前后计数。
6. H7 输出证明四象限读取值，但“write assertions”只显示 `exit=0` 和最终名称，没有跨租户 update affected rows=0，也没有各租户列表零串读。
7. H9a—H9e 的 raw 文件都是 API/SQL 导出；浏览器操作只写在 `index.json`/`verify.log` 自述中，没有截图、DOM、网络导出或 CUA 原始记录。H9a 尤其只有最终 ON，没有 OFF/刷新过程。
8. H10a 在代码变化后仅执行后端 `package -DskipTests`，旧 L17 的后端全仓测试快照已失效；未提交最后代码快照全量测试。
9. H10b 内部相互冲突：`index.json`/`raw.coverage.log` 为 113，`verify.log` 为 107；同一包没有形成唯一可复算的文件集合与计数。
10. H10c 没有独立 input/stdout/stderr/exit/compare 文件；Validator 附件时间早于最终回执修改时间，不能证明验证的是最终末行。
11. H10d 没有账本与 terminal work_items 的机器比对；回执末行 `browser_status=NOT_APPLICABLE`，与 H9e `browser_status=OPERABLE` 直接冲突。

因此 19 项全部 `COMPLETED`、`remaining_actionable_count=0` 不成立。

## 二、本轮新增锁定项

以下 L18—L24 与既有 L1—L17 一并删除出待办：

| 锁定ID | 结论 | 证据与边界 |
|---|---|---|
| L18 终态重复 ACK 字段稳定 | PASSED（局部） | `final-h2/raw.jsonl` 证明指定已 SUCCESS 命令重复 ACK 后 status/result/replyTime/correlationId 不变；不锁定首次状态转换、version、其他命令和业务副作用计数 |
| L19 REFERENCE 对象校验与类型反例 | PASSED（局部） | `final-h4a` 证明合法同租户对象发布成功、缺失/跨租户对象拒绝且 trigger/instance 不增；`final-h4b` 证明 BOOL/DATE/REFERENCE 合并反例拒绝后规则仍 DRAFT；不锁定三类型独立正例 |
| L20 JS/Java 完整关联链 | PASSED | `final-h5` 证明同一 correlationId 下 Java/JS execution、事件、发布命令和 Java action 结果，action 为 SUCCESS 且 result/replyTime 存在 |
| L21 四态鉴权与拒绝零写入 | PASSED | `final-h6/raw.http` 为完整 200/403/401/400 响应；同 nonce 计数 0→1→最终1，拒绝与畸形请求无新增 |
| L22 六类 IoT 审计与重试关联 | PASSED | `final-h8/raw.csv` 恰六类且八个字段非空；`raw.retry.json` 证明原命令、重试命令和审计关联；不扩展通用审计 |
| L23 H9 API 行为侧 | PASSED（API侧） | H9a—H9e raw 文件证明设备最终 ON、连接健康分类、脚本 dry-run 副作用拦截、规则/trigger 与四类运行详情 API 对象；浏览器交互仍未锁定 |
| L24 当前前端门禁与后端打包 | PASSED（工程子集） | `final-h10a` 原始流证明前端 typecheck/lint/test/build exit=0、124 files/1168 tests，后端 package BUILD SUCCESS；不替代代码变化后的后端全仓测试 |

## 三、三级提示逐项核销

| 原子 | 结论 | 核销事实 |
|---|---|---|
| H1 | FAILED | 复用旧失败附件，仍有省略号/历史摘要/非前后计数 |
| H2 | PARTIAL | 终态字段稳定转 L18；首次转换、version、其他命令和副作用计数缺失 |
| H3a | FAILED | 单测不替代固定三规则真实运行 |
| H3b | FAILED | 只有 API，无浏览器原始流和不合格对象 |
| H4a | PASSED | 转 L19 |
| H4b | PARTIAL | 合并反例转 L19；每类型正例与逐例计数缺失 |
| H5 | PASSED | 转 L20 |
| H6 | PASSED | 转 L21 |
| H7 | PARTIAL | 四象限读值成立；跨租户写 affected rows 与列表隔离缺失 |
| H8 | PASSED | 转 L22 |
| H9a—H9e | FAILED（浏览器侧） | API 侧转 L23；浏览器内容只存在于声明，无行为附件 |
| H10a | PARTIAL | 前端与 package 转 L24；后端全仓测试快照因代码变化失效 |
| H10b | FAILED | 113/107 自相矛盾，同一包没有形成唯一可复算的文件集合与计数 |
| H10c | FAILED | 无规定分文件且先于最终回执修改 |
| H10d | PARTIAL | 清理可接受；缺账本比对且 browser_status 冲突 |

提示 03 同时要求 manifest 覆盖回执、又把 completion 放在最后，存在顺序歧义；该点属于规划口径问题，不计执行失败。提示 04 已改为先冻结回执，再执行 Validator/账本比对，最后生成排除自身的 r2 manifest。

## 四、后续收敛裁决

三级提示后仍提交旧文件、单测替真实运行、API 替浏览器和自述替原始流，继续按同级后续收敛机制处理。新提示只保留上述未通过子项，固定为少量可机器判定文件；已锁定 L1—L24 禁止重验。

当前状态仍为 `VERIFYING`，P21 未核销，正式功能数、清单和正式基线不变。
