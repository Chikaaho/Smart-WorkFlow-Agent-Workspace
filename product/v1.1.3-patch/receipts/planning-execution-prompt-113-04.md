# 执行提示 113-04：1.1.3 终态同步与收尾

2026-11-20｜规划 → 执行｜依据 `planning-review-113-04.md`（功能级 PASSED）｜本提示替代 `planning-execution-prompt-113-03.md`，是当前唯一的执行入口。业务验收、发布事实、部署结果已经锁定，**不要重跑任何业务验证，不要重新部署**。

## 1. 唯一终态值清单

下面的值都已由规划定好，执行方照抄，不要自己计算或解释。

| 字段 | 值 |
|---|---|
| 功能状态 | 1.1.3 补丁 `COMPLETED`（不计功能数） |
| 正式功能数 | 58（不变） |
| P 编号 | P72、P73 → 已核销（1.1.3）；P74 → 未排期；B4（执行历史入口 ID 精度）随 1.1.3 修复，没有 P 编号 |
| 线上版本 | Server `1.1.3`（tag→`54b2657b`，Release `451609872`，Latest）；Web `1.1.3`（tag→`05b9739`，Release `451512760`，Latest） |
| 演示环境 | Server 1.1.3 + Web 1.1.3（入口 `index-ANXgpRi9.js`），Flyway 35 行，备份 `*_pre113` |
| 验证基线集合 | Server main CI `44562168036`；Web main CI `44549244089` |
| 活动功能 | 无 |
| 当前唯一下一动作 | 等 Owner 选题（候选：P74、P67、P68） |
| 主方向目录 | `product/v1.1.3-patch/passed/direction-v1.1.3.md`（由规划在阶段 7 移动） |

## 2. 要做的事

| # | 内容 | 完成条件 |
|---|---|---|
| T1 | knowledge `features` 写入 1.1.3 条目 | B1—B4、E2，tag、Release、部署事实，值和 §1 一致 |
| T2 | knowledge `known-issues` | 新增 P74（含字符串拼接的根因）；`I5SsoCipherRuntimeDiagTest` 仍是注释状态（待恢复）；2026-11-20 apt 连带卸载 PG 的事故，以及「不在演示服务器装非运行时依赖」这条约束 |
| T3 | knowledge `current-status` | 和 §1 一致：无活动功能，下一动作等 Owner 选题 |
| T4 | 两仓 README 版本 | 改为 1.1.3（已经是的话就不用改），回执写明两仓 main 上的提交和推送后回读的 SHA |
| T5 | 演示服务器防护（只核实和标记，不改业务） | `apt-mark manual postgresql-14 postgresql-14-pgvector`，并回读 `apt-mark showmanual` 的结果；`systemctl is-enabled postgresql` 和 `Restart=on-failure` 仍然生效；`df -h /` 余量。不卸载 Chromium |
| T6 | 口径外的历史行 | 用一句话说明 `#2121178715751251970` 的人工任务当前状态。不要改 |
| T7 | 回执更正 | 删掉或改正 `execution-113-04.md` §5 第三条（和 §4.1 矛盾的 `server.env` 描述） |
| T8 | 清理隔离环境 iso113 | 停掉 18093、5275，停掉并删除 iso113 的 PG（5433，`.iso113/pgdata`）和 Redis（56379）。保留 `.iso113/evidence/`。**不要碰**用户的 8080/5173、`postgres`/`redis`/`mosquitto-024` 容器和 `.runtime-*`。清理后回读端口没有在监听 |

覆盖矩阵（`roles/executor.md` §4.5）：每个入口写「位置 → 写入的值 → 回读结果」。memory 由规划维护，执行方不用改。

## 3. 约束

- 只改 knowledge、两仓 README，以及演示服务器上 T5 列出的标记；不改业务代码，不动 tag 和 Release。
- 需求池保持 CRLF；提交前用 `git ls-files --eol` 检查。
- 私钥、凭据不写进回执。

## 4. 回执与进度

回执 `terminal-sync-113-01.md`。规划复核通过后，把方向文件移到 `passed/`，阶段 7 结束。

共 7 个阶段：已完成 5 个（评估、实施、验收、合并、发版），进行中 1 个（部署与同步：同步收口），未开始 1 个（结束）。

```planner-convergence
{
  "schema": "agent-coding-engine.planner-handoff.v1",
  "feature": "v1.1.3-patch",
  "revision": 4,
  "previous_revision": 3,
  "decision": "CONTINUE",
  "source_receipt": "product/v1.1.3-patch/receipts/execution-113-04.md",
  "items": [
    {"origin_id": "T1-T3-knowledge", "subject": "knowledge features/known-issues/current-status", "criterion": "§1 终态值", "status": "OPEN", "failed_rounds": 0, "evidence": [],
     "scope": {"targets": ["knowledge/features", "knowledge/known-issues.md", "knowledge/current-status.md"], "allowed_actions": ["写入 §1 的值"], "forbidden_actions": ["自行计算或解释值"], "constraints": {}},
     "acceptance": ["覆盖矩阵回读一致"]},
    {"origin_id": "T4-readme", "subject": "两仓 README 版本", "criterion": "1.1.3", "status": "OPEN", "failed_rounds": 0, "evidence": [],
     "scope": {"targets": ["Server README", "Web README"], "allowed_actions": ["普通提交推送 main/develop"], "forbidden_actions": ["动 tag/Release"], "constraints": {}},
     "acceptance": ["回读 SHA"]},
    {"origin_id": "T5-server-guard", "subject": "演示服务器 PG 包标记与服务状态", "criterion": "防止 apt 再次连带卸载 PG", "status": "OPEN", "failed_rounds": 0, "evidence": ["product/v1.1.3-patch/receipts/execution-113-04.md#4.4"],
     "scope": {"targets": ["postgresql-14", "postgresql-14-pgvector", "postgresql 服务"], "allowed_actions": ["apt-mark manual", "查询服务状态", "df"], "forbidden_actions": ["卸载 Chromium", "apt install/remove/autoremove", "改业务"], "constraints": {}},
     "acceptance": ["showmanual 含两包", "is-enabled 与 Restart 回读", "磁盘余量"]},
    {"origin_id": "T6-T7-T8-closeout", "subject": "历史行说明、回执更正、iso113 清理", "criterion": "收尾", "status": "OPEN", "failed_rounds": 0, "evidence": [],
     "scope": {"targets": ["#2121178715751251970", "execution-113-04.md §5", "iso113 进程与数据"], "allowed_actions": ["只读查询", "更正回执文字", "停进程、删 iso113 数据"], "forbidden_actions": ["改历史行", "碰用户端口和容器", "删 evidence"], "constraints": {}},
     "acceptance": ["一句话状态", "§5 已更正", "端口不再监听"]}
  ]
}
```
