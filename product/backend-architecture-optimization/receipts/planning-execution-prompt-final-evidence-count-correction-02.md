# Final · 证据计数二级纠偏指令 02

> 下发角色：规划（Planner）  
> 指定实施角色：执行（Executor）  
> 日期：2026-09-26  
> 状态：READY  
> 前置复核：`planning-review-completion-final-02-verifying.md`  
> 替代入口：替代 `planning-execution-prompt-final-evidence-supplement-01.md`；旧指令只作追溯，不再同时作为待办  
> 级别：同类计数错误第二次失败后的二级单原子纠偏

## 1. 唯一剩余账本

| ID | 失败事实 | 完成条件 | 正向断言 | 反向断言 |
|---|---|---|---|---|
| F1 | `final-01` 与 `final-supplement-01` 的回读正文均把物理文件数写少 1；最新 `fs01-readback.txt` 与现场 5 冲突 | 只提交一份纠正回执，直接冻结现有两个目录的机器计数；不再创建证据包、哈希清单或回读文件 | `final-01`: physical=9、hash_manifest_lines=7；`final-supplement-01`: physical=5、hash_manifest_lines=3 | 新增证据目录=0；旧证据改写=0；F2/POM/远端操作=0 |

对象身份固定为现有目录：

- `receipts/evidence/final-01/`
- `receipts/evidence/final-supplement-01/`

## 2. 已锁定并删除的范围

- 删除 F2：已 PASSED，不得出现在本轮工作项中，不得重读 POM diff、重做 hunk 归属或修改 POM。
- 删除全部已通过项：不得调用 `gh repo edit`、Maven、服务、数据库、浏览器，不得修改 memory/knowledge/todo/总体方向/主方向。
- 本轮不建立 `final-supplement-02/`，不生成新的 hashes/readback 文件；这是相对上一版的关键方法变化，用于消除“新增文件改变目录总数”的自引用错误。

## 3. 唯一允许写入

只允许新增：

`product/backend-architecture-optimization/receipts/completion-final-repository-presentation-hygiene-evidence-count-correction-02.md`

不得修改任何既有文件。

## 4. 允许命令与固定顺序

只读执行并把原始输出直接写入回执，不手算、不改写：

1. `find receipts/evidence/final-01 -maxdepth 1 -type f -print | LC_ALL=C sort`
2. 同目录文件列表行数；目标 9。
3. `wc -l < receipts/evidence/final-01/final-hashes.sha256`；目标 7。
4. `find receipts/evidence/final-supplement-01 -maxdepth 1 -type f -print | LC_ALL=C sort`
5. 同目录文件列表行数；目标 5。
6. `wc -l < receipts/evidence/final-supplement-01/fs01-hashes.sha256`；目标 3。
7. 回读刚生成的纠正回执，确认正文只引用上述机器输出，不出现新的证据目录声明。

路径工作目录必须写明为：

`/usr/local/projects/Smart-WorkFlow/product/backend-architecture-optimization`

## 5. 提交前核对矩阵

| 检查 | 必须值 |
|---|---|
| `final-01` 文件列表行数 | 9 |
| `final-01` 哈希清单行数 | 7 |
| `final-supplement-01` 文件列表行数 | 5 |
| `final-supplement-01` 哈希清单行数 | 3 |
| 新增证据目录 | 0 |
| 既有证据文件改写 | 0 |
| coding 仓、GitHub、refs、POM 操作 | 0 |
| 未完成工作项 | 0 |

任一项不满足时不得声称完成；如实报告实际机器输出。合法停止条件只有：纠正回执已新增、矩阵全部满足、终态 JSON 可解析。

## 6. 回执终态

最后一行必须为合法 `ENGINE_TERMINAL`，字段固定：`state=EXECUTION_SUBMITTED`、`feature_status=VERIFYING`、`remaining_actionable_count=0`、`next_action_type=WAIT_PLANNER`、`browser_status=NOT_APPLICABLE`。工作项只允许 F1 与 receipt，不得再次包含 F2。

不 commit/push/merge/tag/Release/deploy，不归档 Final，不同步总体任务终态。
