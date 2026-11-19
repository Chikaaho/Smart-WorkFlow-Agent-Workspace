# 执行提示 113-03：1.1.3 阶段 4—6（合并、发版、部署与同步）

2026-11-19｜规划 → 执行｜依据 `planning-review-113-03.md`（阶段 3 PASSED）｜本提示替代 `planning-execution-prompt-113-02.md`，是当前唯一的执行入口。方向 `direction-v1.1.3.md` §4—§6 仍然有效，本提示只补上前三轮审查里定下的事项。

## 1. 阶段 4：合并

- 两仓 `feature/1.1.3` → `develop` → `main`，都用普通合并。合并前确认 feature 分支包含全部已验收提交：Server `5f19d2d4`、`6770ff7b`、`583f1a38`；Web `169df9d`、`97a33b6`、`bb32650`。
- **CI 口径（Owner 裁定）**：工作流只在推送 main 时触发。两仓 main 的 CI 都必须是 success，回执写 run 号。CI 失败时，先在 develop 修好，再走一遍合并，修复要单独写进回执；**CI 不是 success 就不打 tag**。
- 合并完成后删除两仓的 `feature/1.1.3`（远程和本地），删除前用 `merge-base --is-ancestor` 确认已经合入。
- pom、脚本、工作流里的版本号同一批更新到 `1.1.3`，develop 上的版本断言也要一起改（0.4.1 时出过这个问题）。

## 2. 阶段 5：发版

- 两仓打 tag `1.1.3`，Release 设为 Latest。其他 tag 和 Release 不动。
- 发布说明列出：B1 超时恢复后旧执行行停在「等待人工」，详情返回 404（P72）；B2 取消后节点轨迹仍显示「等待人工」（P73）；B3 执行列表「发生时间」格式；B4 执行历史入口 ID 精度丢失；E2 从父执行点「查看子执行」不刷新。另外注明 Server `583f1a38` 修复了没有流程引擎 Bean 时整个应用无法启动的问题（11-19 治理批次引入，未发布到线上）。
- 回执写明：commit、tag、Release ID、制品名、字节数、sha256。

## 3. 阶段 6：部署与同步

- 按运维手册 `docs/ops/production-ops.md` 部署，连接用 §2 的 `ssh_personal.sh`/`scp_personal.sh`。先 Server 后 Web，部署前备份（命名 `*_pre113`），确认剩余空间 ≥3G。
- 部署后核对：版本、health（`/api/actuator/health`）、Flyway 仍为 35 行、Web 入口文件名。
- **演示环境复测**（浏览器视口截图，头部和要证明的区域放在同一张图里，画面描述对着图写）：
  - B1：造一次「人工任务超时 → 自动恢复」，恢复后列表里没有「等待人工」行；子执行详情能打开。
  - B2：受理号、执行编号各取消一次，详情节点轨迹显示「已取消」。
  - B3：列表「发生时间」格式正确（加宽视口，或者滚动表体）。
  - B4 + E2：从「执行历史」入口进去，列表有这张图的执行；在父执行详情点「查看子执行」，画面切换成子执行。
- **旧数据行（规划已预先授权，`planning-review-113-01.md`）**：查询 `parent_execution_id` 非空、状态为 WAITING_HUMAN、所属受理行已经终态的行，先在回执列出：行号 → 所属受理行状态 → 创建时间；然后改为 INTERRUPTED 并回读，再截一张列表图，证明这些行不再显示「等待人工」。只要有一行不符合这个口径，就停下来报告，不要改。不删数据，不动演示环境的其他内容。
- 同步：`version.json`、`CHANGELOG.md`、knowledge（current-status、features、known-issues 里的 P74 条目）、需求池（P72、P73 标为随 1.1.3 核销；B4 记为随 1.1.3 修复）、两仓 README 版本。功能数保持 58。

## 4. 约束

方向 §6 全部有效。另外：不改写历史，不强推；不碰 Web `vite.config.ts` 的未提交改动；隔离环境 iso113 先保留，等阶段 7 规划复核后再清理。

## 5. 回执与进度

回执 `execution-113-04.md`，一份写完阶段 4—6。如果阶段 4 的 CI 失败需要修复，可以先交一份阶段 4 的中间回执。

共 7 个阶段：已完成 3 个（评估、实施、验收），进行中 1 个（合并），未开始 3 个（发版、部署与同步、结束）。

```planner-convergence
{
  "schema": "agent-coding-engine.planner-handoff.v1",
  "feature": "v1.1.3-patch",
  "revision": 3,
  "previous_revision": 2,
  "decision": "CONTINUE",
  "source_receipt": "product/v1.1.3-patch/receipts/execution-113-03.md",
  "items": [
    {
      "origin_id": "S4-merge",
      "subject": "两仓 feature/1.1.3 → develop → main",
      "criterion": "方向 §4 阶段 4；main CI success",
      "status": "OPEN",
      "failed_rounds": 0,
      "evidence": [],
      "scope": {"targets": ["Server、Web 的 develop/main"], "allowed_actions": ["普通合并", "版本号同批更新", "删除已合入的 feature 分支"], "forbidden_actions": ["强推", "改写历史"], "constraints": {"CI": "main 的 run 号必须是 success，否则不打 tag"}},
      "acceptance": ["两仓 main 包含全部已验收提交", "main CI run 号 success", "feature 分支已删"]
    },
    {
      "origin_id": "S5-release",
      "subject": "两仓 tag 1.1.3 与 Release",
      "criterion": "方向 §4 阶段 5",
      "status": "OPEN",
      "failed_rounds": 0,
      "evidence": [],
      "scope": {"targets": ["tag 1.1.3", "Release Latest"], "allowed_actions": ["打 tag", "发 Release"], "forbidden_actions": ["动其他 tag 和 Release"], "constraints": {"发布说明": "B1—B4、E2，并注明 583f1a38"}},
      "acceptance": ["commit/tag/Release ID/制品/字节数/sha256"]
    },
    {
      "origin_id": "S6-deploy-sync",
      "subject": "演示环境部署、复测、旧数据行、文档同步",
      "criterion": "方向 §4 阶段 6；planning-review-113-01 旧数据口径",
      "status": "OPEN",
      "failed_rounds": 0,
      "evidence": [],
      "scope": {"targets": ["演示环境 Server/Web", "符合口径的旧子执行行", "version.json/CHANGELOG/knowledge/需求池/README"], "allowed_actions": ["按运维手册部署", "备份", "旧行改 INTERRUPTED 并回读"], "forbidden_actions": ["删数据", "改不符合口径的行", "动演示环境其他内容"], "constraints": {"截图": "视口截图，头部与证明区同框，描述对着图写"}},
      "acceptance": ["版本/health/Flyway 35/入口文件名", "B1—B4、E2 演示环境截图", "旧行清单与回读", "同步完成，功能数 58"]
    }
  ]
}
```
