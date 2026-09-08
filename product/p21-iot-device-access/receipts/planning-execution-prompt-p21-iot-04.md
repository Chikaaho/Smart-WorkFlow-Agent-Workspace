# P21 IoT 设备接入三级后续收敛提示 04

> 日期：2026-09-08  
> 当前状态：VERIFYING  
> 唯一依据：`planning-review-p21-iot-05.md`  
> 本提示替代：`planning-execution-prompt-p21-iot-03.md`  
> 当前唯一 Executor 修正入口：本文件

## 一、输入与删除范围

只读取本提示、第五轮审查和其中点名的第五轮 final 包；主方向仅在核对原语义时读取。提示 03 及更早材料只作历史，不是并行待办。

锁定 L1—L24，明确删除 H4a、H5、H6、H8，以及 H2 终态字段稳定、H4b 类型合并反例、H9 API 行为、当前前端门禁/后端 package。不得重验或复制这些内容。

第五轮后只剩：H1、H2剩余、H3a、H3b、H4b正例、H7写/列表、H9a—H9e浏览器侧、H10a全仓测试、H10b—H10d终态一致性。

## 二、方法变更

本轮不再使用第五轮 `final-*` 目录追加或覆盖，统一建立后缀 `-r2` 的新目录。每个包只收本原子新结果，禁止把 `index.json` 或 `verify.log` 中的布尔文字当作原始行为。

浏览器包必须同时具有 CUA/浏览器工具直接保存的操作记录、截图或 DOM、请求响应；API 查询只引用 L23，不再重复导出。运行行为包必须使用新 nonce/新命令/新 trigger，时间晚于本提示；旧文件哈希相同即失败。

## 三、唯一剩余矩阵

| 原子 | 新包与必须文件 | 正向断言 | 反向断言/机器门禁 |
|---|---|---|---|
| H1 | `final-h1-r2/`：`command.txt`、`before.json`、`stdout.log`、`stderr.log`、`after.json`、`verify.log` | 新 nonce 在合法 Topic 被 CLI 收到；evil 发布返回真实拒绝 | evil_received=0；message/command/trigger 三项 before=after；文件无 `...`/“前轮”，命令与 exit 可见 |
| H2 | `final-h2-r2/`：`sequence.jsonl`、`verify.log` | 新命令从 BROKER_ACK 经首次 ACK 到 SUCCESS | 第二次 ACK 后 status/result/replyTime/version/correlation 与 after1 完全相等；其他命令与业务副作用 before=after |
| H3a | `final-h3a-r2/`：`requests.jsonl`、`results.jsonl`、`verify.log` | 三个独立新规则实际产生 BLOCK=FAILED、CONTINUE=SUCCESS+instance、MANUAL=PENDING | 每行必须有 strategy/configId/triggerId/instance/error/countBefore/countAfter；单测输出不可替代 |
| H3b | `final-h3b-r2/`：`cua.jsonl`、`fixed.png`、`form-field.png`、`variable.png`、`reload.png`、`network.json`、`verify.log` | 浏览器依次选择并保存三来源，刷新回读最后配置；候选列表仅含合格设备 | CUA 记录必须含实际点击目标与保存响应；明确一个不合格设备不在候选中；截图选中项与文件名一致 |
| H4b | `final-h4b-r2/`：`positive.http`、`counts.txt`、`verify.log` | 一条新规则同时使用合法 BOOL/DATE/REFERENCE 并发布成功 | 规则 PUBLISHED；三值在规则详情与后续 formData 中保持正确；本包仅补正例，反例沿用 L19 |
| H7 | `final-h7-r2/`：`writes.jsonl`、`lists.jsonl`、`verify.log` | t0、t88 各自更新自身 affectedRows=1 | t0→t88 与 t88→t0 affectedRows=0；两个租户列表各只含自身对象；读取四象限沿用第五轮包 |
| H9a | `final-h9a-r2/`：`cua.jsonl`、`on-before.png`、`off.png`、`off-reload.png`、`on-after.png`、`network.json`、`verify.log` | 浏览器 ON→OFF→刷新仍OFF→ON→刷新仍ON | 四张图哈希及开关值符合阶段；请求响应与 L23 最终 API 一致 |
| H9b | `final-h9b-r2/`：`cua.jsonl`、`owner-before.png`、`owner-after.png`、`bad-before.png`、`bad-after.png`、`network.json`、`verify.log` | 浏览器分别点击两连接测试并显示 HEALTHY/AUTH_FAILED | 错误连接不得显示成功；全程凭证掩码；结果 ID 与 L23 一致 |
| H9c | `final-h9c-r2/`：`cua.jsonl`、`java.png`、`js.png`、`network.json`、`verify.log` | 浏览器点击 Java/JS 试运行并显示受控副作用禁止结果 | 不出现发布/下行副作用；执行 ID 与 L23 锁定 API 对象一致 |
| H9d | `final-h9d-r2/`：`cua.jsonl`、`rule.png`、`trigger-list.png`、`trigger-detail.png`、`network.json`、`verify.log` | 浏览器打开规则、触发列表及指定 trigger 详情 | UI triggerId/processInstance/formSnapshot 与 L23 同一对象；不得用 API 文本冒充截图 |
| H9e | `final-h9e-r2/`：`cua.jsonl`、四个 `*-tab.png`、四个 `*-detail.png`、`network.json`、`verify.log` | 浏览器四 tab 均点击一条并打开详情 | 四个详情 ID 与 L23 锁定 API 对象逐一相同；无空 tab/串对象 |
| H10a | `final-h10a-r2/`：`backend-full.log`、`fingerprint.txt`、`verify.log` | 最后代码快照执行后端全仓测试并 BUILD SUCCESS | 所有报告 0 failure/error；测试后源码 fingerprint 不变；L24 前端门禁不重跑 |
| H10b | `final-h10b-r2/`：`manifest.sha256`、`coverage.log`、`verify.log` | manifest 覆盖本轮所有 `*-r2` 文件，但排除本目录自身三文件 | `find` 集合与 manifest 路径集合双向差为空；三个计数必须完全相同；不要求 hash completion05/06，纠正提示03顺序歧义 |
| H10c | `final-h10c-r2/`：`input.json`、`command.txt`、`stdout.log`、`stderr.log`、`exit.txt`、`compare.log`、`verify.log` | Validator 输入与冻结后的 `completion-p21-iot-06.md` 末行去前缀后逐字一致且 exit=0 | Validator 运行时间必须晚于回执最后修改时间；运行后不得再改回执 |
| H10d | `final-h10d-r2/`：`ledger.json`、`compare.log`、`verify.log` | ledger 与回执 terminal 的剩余 work_items、状态和计数逐项一致 | 本轮使用真实浏览器，`browser_status` 必须与 H9 CUA 事实一致；任一原子失败不得 remaining=0 |

## 四、允许范围与顺序

- 允许修改：H2/H3a/H4b/H7 暴露的最小实现或验证资产；H3b/H9 UI 的必要缺陷；新 `-r2` 证据包和 `completion-p21-iot-06.md`。
- 禁止修改：方向、五轮审查、提示01—03、旧 completion/旧 evidence、正式状态、无关业务与腾讯实网边界。
- 允许命令：Owner Broker CLI、真实 API/PG、真实浏览器/CUA、受影响测试、后端全仓测试、集合/哈希/Validator 校验。

固定顺序：修复实现→H1/H2/H3a/H4b/H7→H3b与H9浏览器包→H10a→冻结 completion06 末行→H10c Validator 与 H10d 账本比对→H10b 最终 manifest→禁止再修改 completion06→提交。

## 五、提交门禁

以下全部为是才允许提交：

- [ ] 所有新包时间晚于本提示，且未复用旧 raw 文件？
- [ ] H1 新 CLI、H2 首次/重复 ACK、H3a 三策略真实运行均闭合？
- [ ] H3b/H9a—H9e 均有真实 CUA、截图/DOM和 network 文件？
- [ ] H4b 正例与 H7 四个写结果/两个列表成立？
- [ ] 后端最后快照全仓测试通过且指纹不变？
- [ ] manifest 三处计数一致且双向差为空？
- [ ] Validator 晚于冻结回执，账本与 `browser_status` 无冲突？

任一为否时继续执行或按真实工具阻塞提交契约 `BLOCKED`，不得写全部 `COMPLETED`、`remaining_actionable_count=0` 或等待 Planner。Executor 不得写 `PASSED/COMPLETED` 或进入阶段三。
