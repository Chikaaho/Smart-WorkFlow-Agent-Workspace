# P32 表单数据导入导出阶段三终态复审（二）

> 日期：2026-08-29  
> 审查对象：`stage3-terminal-sync-final-correction-20260829.md`  
> 结论：**FAILED（仅历史回执被覆盖）**

## 1. 已锁定通过项

- U1 已核销：README 实际 461 B，memory 分项合计与总量均为 4271 B；
- U2 已核销：实际末行 JSON 经公共 Validator 校验，退出码 0；
- `stage3-terminal-sync-final-correction-20260829.md` 的内容和合法 `TERMINAL_SYNC_SUBMITTED` 末行锁定，不得修改；
- 所有业务终态、知识、memory、清单、需求池、方向位置和其他回执全部锁定。

## 2. 唯一剩余差异 V1

规划复审明确要求“只允许追加一份最终终态修正回执；不修改现有回执”。执行层虽然新增了最终修正回执，但同时覆盖了历史文件 `stage3-terminal-sync-correction-20260829.md`：

- 历史表格中的 `README.md | 480` 被改成 `461`；
- 历史 Validator 示例 `echo '<payload>' | bash ...` 被改成实际 `tail -1 ...` 命令；
- 文件大小由审查时的 2712 B 变为 2774 B。

这使最终修正回执失去了“纠正上一份错误记录”的历史链条。

## 3. 唯一修正目标

只将 `stage3-terminal-sync-correction-20260829.md` 恢复为规划第一次读取时的历史原貌：

1. memory 表中 `README.md` 恢复为 **480**，总量行保持历史所写 **4271**；
2. Validator 代码块恢复为：

```text
$ echo '<payload>' | bash .codex/governance/validate-terminal.sh
Exit code: 0
```

3. 该历史回执其余文字及末行 `SWF_TERMINAL` 保持原样；
4. `stage3-terminal-sync-final-correction-20260829.md` 保持不变，继续作为 U1/U2 的追加纠正依据。

## 4. 禁止事项

- 除恢复上述历史文件两处内容外，不得修改或新增任何文件；
- 不修改 memory、knowledge、清单、需求池、方向、最终修正回执或其他历史回执；
- 不运行任何测试、构建、迁移、服务或 Validator；已有 U2 校验结果已锁定；
- 恢复完成后只报告文件路径、恢复的两处文本和文件字节数，不再生成新的终态回执。

## 5. 当前状态

P32 继续保持 `COMPLETED（待规划终态复核）`。恢复历史原貌后，规划只检查 V1 和阶段三方向位置；通过后确认 `COMPLETED（已确认）` 并归档同步方向。

