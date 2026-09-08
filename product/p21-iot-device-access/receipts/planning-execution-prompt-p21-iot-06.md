# P21 IoT 设备接入三级后续收敛提示 06（仅终态冻结）

> 日期：2026-09-08  
> 当前状态：VERIFYING  
> 唯一依据：`planning-review-p21-iot-07.md`  
> 本提示替代：`planning-execution-prompt-p21-iot-05.md`；提示 05 及更早仅作追溯  
> 当前唯一 Executor 修正入口：本文件

## 一、唯一剩余原子

L1—L39 全部锁定。不得操作浏览器、Broker、数据库或 API，不得修改业务/测试实现，不得重跑前后端测试，不得重新采集 H3b/H9 行为。

| 原子ID | 失败事实 | 完成条件 | 最小充分证据 | 合法停止条件 |
|---|---|---|---|---|
| H10d-R4 | `final-h9e-r3/states.jsonl` 晚于 completion07 冻结与 Validator，终态未覆盖最终行为附件 | 先冻结并哈希现有 r3 行为附件，再写一次 completion08；completion08 冻结后生成 ledger、逐项 compare 与 Validator，之后行为附件和回执均不得变化 | `final-h10d-r4/behavior.sha256`、`ledger.json`、`compare.log`、`validator.exit`、`stat.log`、`verify.log`、`completion-p21-iot-08.md` | 仅当现有文件缺失/哈希读取失败且只读排查穷尽时按契约 BLOCKED；不得以重新执行业务替代终态封装 |

## 二、固定输入集合

`behavior.sha256` 只覆盖以下已锁定最终附件，由工具生成并在 completion08 后再次 `shasum -c`：

- `final-h3b-r3/candidate.snapshot.json`、`network.json`
- `final-h9b-r3/owner.snapshot.json`、`bad.snapshot.json`、`network.json`
- `final-h9c-r3/java.snapshot.json`、`js.snapshot.json`、`network.json`
- `final-h9d-r3/rule.snapshot.json`、`trigger-list.snapshot.json`、`trigger-detail.snapshot.json`、`network.json`
- `final-h9e-r3/states.jsonl`、`network.json`
- `final-h10a-report-r3/summary-lines.txt`、`aggregate.txt`

旧 r2 行为与 L1—L33 已有校验继续锁定，不重新收入本轮哈希集合。

## 三、不可变顺序

1. 对上述固定输入生成 `behavior.sha256`，立即执行一次 `shasum -c`。
2. 写完 `completion-p21-iot-08.md` 正文和唯一 `ENGINE_TERMINAL` 末行；terminal 只使用既有 19 个 work item，全部行为已锁定时可为 `remaining_actionable_count=0`。
3. 自此不得再修改 completion08、`behavior.sha256` 或其覆盖的任何行为附件。
4. 从冻结后的 completion08 末行生成 `ledger.json`，对 `feature_status`、`browser_status`、`remaining_actionable_count`、`work_items` 逐项机器比对，保存 `compare.log`。
5. 对冻结后的 completion08 末行运行一次终态 Validator，保存 `validator.exit`。
6. 生成 `stat.log`：列出 completion08、全部固定输入和 `behavior.sha256` 的 mtime；所有固定输入必须早于 completion08，H10d-R4 文件允许晚于 completion08。
7. 再执行 `shasum -c behavior.sha256`，将结果与退出码写入 `verify.log`；完成后禁止再修改回执或固定输入。

## 四、相对提示 05 的变化

- 删除：H3b2、H9b—H9e、H10a-R，均已转 L34—L39。
- 原子化：只剩 H10d-R4，不再创建浏览器证据包。
- 替代路径：不重新运行任何业务；用固定输入哈希、mtime、terminal/ledger 比对和 Validator 关闭生命周期问题。
- 可判定条件：固定输入全部早于 completion08、前后两次哈希均通过、completion08 早于 H10d-R4 后置校验、terminal/ledger 与 Validator 均为 0 差异/exit=0。

## 五、提交门禁

- [ ] 固定输入中没有晚于 completion08 的文件？
- [ ] `behavior.sha256` 前后两次校验均 exit=0？
- [ ] completion08 冻结后没有再修改？
- [ ] ledger 与 terminal 四类字段逐项一致？
- [ ] Validator exit=0，`browser_status=OPERABLE` 与 L34—L38 一致？
- [ ] 没有新增 Owner 凭证、正式 Token 或其他秘密？
- [ ] 未重跑或修改任何 L1—L39 锁定行为？

全部为是才提交 `completion-p21-iot-08.md`。Executor 仍不得写功能级 `PASSED/COMPLETED` 或进入阶段三。
