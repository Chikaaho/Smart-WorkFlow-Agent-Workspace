# planning-review-113-05：1.1.3 阶段 7 终审

2026-11-20｜规划｜依据 `terminal-sync-113-01.md`，以及提交 `9752dbfa`（knowledge 4 个文件和回执更正）、`eb8083bc`（回执）的变更范围｜**1.1.3 COMPLETED**，七阶段 7/0/0。账本 rev 5，FINISH。

## 结论

T1—T8 全部完成，覆盖矩阵的每一行都有回读结果。1.1.3 补丁结束：正式功能数仍是 58，P72、P73 已核销，P74 未排期。

## 逐项核对

| # | 结果 | 依据 |
|---|---|---|
| T1 | 通过 | 新建 `knowledge/features/v1.1.3-patch.md`，tag、Release、CI、入口、Flyway 都和提示 113-04 §1 一致 |
| T2 | 通过 | `known-issues.md` 新增 3 条：P74 的根因、`I5SsoCipherRuntimeDiagTest` 待恢复、apt 事故和防护约束 |
| T3 | 通过 | `current-status.md` 终态：无活动功能，下一动作等 Owner 选题 |
| T4 | 通过 | 两仓 README 在阶段 6 批次里已经是 1.1.3，本轮没有改。回读：Server main `6a6a853a`，Web main `1ef35ca` |
| T5 | 通过 | PG 两个包本来就是手动安装，标记后再回读仍是 manual；postgresql 服务开机自启，`Restart=on-failure` 有效；磁盘余 4.7G；Chromium 没卸 |
| T6 | 通过（只读） | 见下一节 |
| T7 | 通过 | `execution-113-04.md` §5 第三条已划掉，标为作废，指向 §4.1 |
| T8 | 通过 | 18093、5275、5433、56379 四个端口都没有在监听；`.iso113/` 只剩 `evidence/`、工具脚本和 initdb.log，登录密钥已删。没有碰用户的端口、容器和 `.runtime-*`。`.iso113/` 在 `.git/info/exclude` 里，不会进 Git |

需求池保持 CRLF（`git ls-files --eol` 为 `i/crlf w/crlf`）。

## 历史行 `#2121178715751251970` 的处理

执行方查到：这条执行对应的人工任务 `2121178716673998849` 和受理行 `2121178715000471554` 在 2026-11-13 20:37 都已经是 CANCELLED，只有顶层执行行还停在 WAITING_HUMAN。这是 P71 修复（1.1.2）之前「按受理号取消时没有同步执行行」留下的残留。1.1.2 修复了取消逻辑，但没有回补旧数据。

规划的决定：**不改**，作为演示环境的已知残留登记在 memory 里。原因：
- 只有这一行，取消之后新产生的数据不会再有这个问题；
- 改它需要新的数据修正授权，本补丁预授权的口径只覆盖子执行行。

Owner 如果希望清理，可以以后单独授权：只改这一行，改为 CANCELLED，然后回读。

## 归档

- 方向文件 `ready/direction-v1.1.3.md` 移到 `passed/`，由规划在本提交里完成。
- 需求池 1.1.3 段改为「已结束」。
- memory 记一行：iso113 已由执行方清理（回执 T8）。

## 遗留和下一步候选

- P74：列表总数被字符串拼接放大，预估 S。
- P67（L）、P68（XL）。
- 治理收尾：恢复 `I5SsoCipherRuntimeDiagTest`；i18n views 覆盖；NodeFunctionService 线程池有界化。
- 观察项：演示服务器上的 Chromium 等维护窗口时卸载；历史行 `#2121178715751251970`。

## 进度

共 7 个阶段（评估、实施、验收、合并、发版、部署与同步、结束），已完成 7 个，进行中 0 个，未开始 0 个。

```planner-convergence
{
  "schema": "agent-coding-engine.planner-handoff.v1",
  "feature": "v1.1.3-patch",
  "revision": 5,
  "previous_revision": 4,
  "decision": "FINISH",
  "source_receipt": "product/v1.1.3-patch/receipts/terminal-sync-113-01.md",
  "items": [
    {"origin_id": "T1-T3-knowledge", "status": "PASSED", "failed_rounds": 0, "evidence": ["9752dbfa"]},
    {"origin_id": "T4-readme", "status": "PASSED", "failed_rounds": 0, "evidence": ["Server main 6a6a853a", "Web main 1ef35ca"]},
    {"origin_id": "T5-server-guard", "status": "PASSED", "failed_rounds": 0, "evidence": ["terminal-sync-113-01.md#T5"]},
    {"origin_id": "T6-T7-T8-closeout", "status": "PASSED", "failed_rounds": 0, "evidence": ["terminal-sync-113-01.md#T6-T8"]}
  ]
}
```
