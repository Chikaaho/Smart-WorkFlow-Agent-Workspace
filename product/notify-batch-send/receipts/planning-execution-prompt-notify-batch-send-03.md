# 通知批量发送三级零裁量执行提示 03

> 触发原因：二级提示后仍缺正确互斥证据与可复算计数
> 本轮仅允许 T1—T3 三个证据缺口
> 全部为“是”才允许 `EXECUTION_SUBMITTED`，否则必须 `BLOCKED`

## 1. 权威输入与唯一产物

只读取：

1. `product/notify-batch-send/receipts/planning-rereview-v4-20260827.md`
2. `product/notify-batch-send/receipts/planning-execution-prompt-notify-batch-send-03.md`
3. 公共终态契约与 Validator

唯一允许新增：

`product/notify-batch-send/receipts/notify-batch-send-gates-v5.md`

禁止修改任何业务、测试、迁移、Mock、方向、历史回执、memory、knowledge、清单、需求池或基线文件。

## 2. 相对上一版新增/收紧约束

相对二级提示 02，本版：

- 删除全部 S1—S5 行为任务，禁止重跑聚焦行为测试；
- 把剩余工作限制为五条全量门禁的重新执行；
- 为后端和前端分别固定不同的互斥命令，禁止再复用同一快照；
- 每条门禁必须形成独立证据包，并同时包含正向成功断言和反向无并发断言；
- 把后端总数勾稽拆为“正式旧基线 870 → 当前总数”的逐测试类算式，算式不闭合即 `BLOCKED`；
- 新回执必须再次经过 Validator，且终态行必须是物理最后一行。

## 3. 固定执行顺序

不得增删、交换或合并以下步骤。

### P1 — 后端全量门禁包

工作目录：`Smart-WorkFlow/`

先执行前端互斥快照：

```sh
ps -ef | grep -E '[p]npm|[n]pm|[v]ite|[v]itest|[v]ue-tsc|[e]slint'
```

只有输出中不存在前端编译/测试进程时，才执行：

```sh
MAVEN_OPTS="-Xmx2g" mvn test
```

P1 证据包必须原样包含：快照命令与完整输出、快照时间、Maven 命令、退出码、从最后一个 reactor 模块到 `BUILD SUCCESS`/总耗时的原始结尾、Surefire 当前总数。

正向断言：Maven exit=0 且 failures/errors=0。

反向断言：快照中 pnpm/npm/vite/vitest/vue-tsc/eslint 编译测试进程为 0。

### P2—P5 — 前端四门独立证据包

工作目录：`Smart-WorkFlow-Web/`

P2、P3、P4、P5 **每一步开始前**均重新执行后端互斥快照：

```sh
ps -ef | grep -E '[m]vn|[s]urefire|[j]ava'
```

快照可以包含已确认的开发服务器，但必须逐行标注 PID/命令及“非 Maven/Surefire/测试进程”的判定依据；存在 Maven、Surefire 或测试 Java 进程时不得执行下一门。

按顺序分别执行：

```sh
NODE_OPTIONS="--max-old-space-size=2048" pnpm typecheck
NODE_OPTIONS="--max-old-space-size=2048" pnpm lint
NODE_OPTIONS="--max-old-space-size=2048" pnpm test
NODE_OPTIONS="--max-old-space-size=2048" pnpm build
```

P2—P5 每包必须原样包含：本门开始时间、快照完整输出及逐行分类、门禁命令、退出码、runner 原始结尾。

正向断言分别为：typecheck exit=0；lint exit=0 且 error/warning=0；test exit=0 且文件数/测试数/失败数明确；build exit=0。

反向断言：每份快照中的 Maven/Surefire/测试 Java 进程均为 0。

## 4. T2 计数勾稽唯一格式

在 P1 后仅使用本轮 Surefire 报告，列出：

1. 正式旧基线：870；
2. 自正式旧基线后新增或新增计数的每个测试类：`类名 → 旧数 → 当前数 → 增量`；
3. 所有增量求和；
4. `870 + 增量合计 = 当前 Surefire 总数`；
5. 另列 v3 的 903 到当前总数之间每一条增量来源，明确解释此前缺失的 1 条。

只写“证据测试 31 条”或“总数 915”不能通过；两个算式必须精确闭合。

正向断言：两条算式均相等。

反向断言：不存在未归属测试、重复计数、失败、错误或跳过项。

## 5. T3 Validator 与物理末行

固定顺序：

1. 写完 P1—P5 和计数勾稽；
2. 写入候选 `SWF_TERMINAL`，state=`EXECUTION_SUBMITTED`，receipt 指向 v5；
3. 运行公共 Validator；
4. 将 Validator 命令、exit 和原始输出插入终态行之前；
5. 再次运行 Validator；
6. 运行 `tail -n 1 product/notify-batch-send/receipts/notify-batch-send-gates-v5.md`；
7. 保证该原始输出与文件物理最后一行均为唯一结构化终态。

正向断言：Validator 最终 exit=0，tail 输出为合法 `EXECUTION_SUBMITTED`。

反向断言：终态行之后字符数为 0，全文只有一个 `SWF_TERMINAL`。

## 6. 零裁量提交门禁

| 检查项 | 必须为“是” |
|---|---|
| P1 前端互斥快照为 0，后端全量成功 |  |
| P2 独立后端快照为 0，typecheck 成功 |  |
| P3 独立后端快照为 0，lint 成功且零告警 |  |
| P4 独立后端快照为 0，test 成功且计数明确 |  |
| P5 独立后端快照为 0，build 成功 |  |
| 870→当前总数算式闭合 |  |
| 903→当前总数算式闭合且缺失 1 条已解释 |  |
| Validator 最终 exit=0 |  |
| tail 输出等于物理最后一行唯一终态 |  |
| 工作区除 v5 回执外零修改 |  |

任一项不是“是”，不得提交 `EXECUTION_SUBMITTED`，必须如实提交 `BLOCKED`。
