# 执行提示 120-06：1.2.0 阶段 4~7

2026-11-25｜规划 → 执行｜依据 `planning-review-120-06.md`（阶段 3 已通过）｜本提示替代 `planning-execution-prompt-120-05.md`，是当前唯一的执行入口。阶段 4~7 按方向 `direction-v1.2.0.md` §4 做，约束见方向 §6，这里只写补充和顺序。阶段 4~7 在版本确认后持续授权，中间不用等规划，遇到下面写的停止条件再停。

## 1. 阶段 4 合并

- 两仓 `feature/1.2.0` → `develop` → `main`，普通合并，不压缩、不强推。合并前确认 feature 分支头是 Web `3f7f43a`、Server `34c43e98`（如果之后还有提交，回执写明）。
- 推送 main 后看 CI，回执写 run 号和结论。Server 的 run 里要能看到 `I5SsoCipherRuntimeDiagTest` 实际运行并通过（E3-2），写出用例名和计数。
- CI 失败：先在 `develop` 修好，修复单独一节写进回执，再合并到 main 重跑。CI 没有 success 不能进阶段 5。
- 工作区仓库只提交回执和 `version.json` 这类同步文件，不提交两个子仓的 gitlink 变更。

## 2. 阶段 5 发版

两仓打 tag `1.2.0`，Release 设为 Latest，不动其他 tag 和 Release。回执写 commit、tag、Release ID、制品名、字节数、sha256。

## 3. 阶段 6 部署与同步

- 按运维手册 `docs/ops/production-ops.md` 部署，连接用手册 §2 的 `ssh_personal.sh`、`scp_personal.sh`。先 Server 后 Web；部署前剩余空间 ≥3G；备份命名 `*_pre120`。
- 部署后核对：版本、health（`/api/actuator/health`）、Flyway 36 行（新增 1.2.0）、Web 入口文件名。
- 复测按方向 §4 阶段 6，另外加两项：
  - **X1 回归**：在演示环境发布一个普通流程和一个带 Graph 执行器节点的流程，都要成功。出现 schema null 就停下，贴出异常栈报告规划。
  - **E4-2 抄送**：打开工作台抄送页签的一条。
- 复测数据用专门建的，回执写明是哪些，复测完保留。演示环境除 E3-3 那一行外不改数据。E3-3 改之前先确认人工任务和受理行仍是 CANCELLED，有一项不是就停下来报告。
- 同步：`version.json`、`CHANGELOG.md`、knowledge、需求池核销 P67、P74、P41、P76、P77，两仓 README。需求池由规划维护，执行方在回执里列出要核销的行和依据，规划来改。
- 截图规则不变：在本机可见浏览器里拍，sha1 互不相同，头部和证明区在同一张图里，回执写 URL、视口、登录身份（不写口令）、对象 ID。

## 4. 阶段 7 结束

规划复核演示环境证据和同步之后结束。执行方清理：删除 `sw_iso120`、`sw_iso120_x1` 两个库，停掉 18094 上的 1.1.3 worktree 进程并删除这个 worktree，停掉 iso120 的 18093/5275/56379，回读库列表和端口，回执写一行确认。`.iso120/evidence/` 下的截图留到规划终审之后再删。

## 5. 停止条件（遇到就停下来报告规划）

- main CI 修了两轮还是失败；
- 演示服务器剩余空间不足 3G，或者部署要装非运行时依赖；
- Flyway 不是 36 行，或者迁移报错；
- X1 回归出现 schema null；
- E3-3 的前置确认不满足。

## 6. 回执与进度

回执 `execution-120-18.md` 起，按阶段分批：阶段 4+5 一批，阶段 6 一批，阶段 7 清理一行可以并入最后一批。

共 7 个阶段：已完成 3 个，进行中 0 个，未开始 4 个。

```planner-convergence
{
  "schema": "agent-coding-engine.planner-handoff.v1",
  "feature": "v1.2.0",
  "revision": 7,
  "previous_revision": 6,
  "decision": "CONTINUE",
  "source_receipt": "product/v1.2.0/receipts/execution-120-17.md",
  "items": [
    {"origin_id": "S4-merge", "status": "OPEN", "failed_rounds": 0, "evidence": [], "scope": {"targets": ["两仓 feature→develop→main", "main CI"], "allowed_actions": ["普通合并", "develop 上修 CI"], "forbidden_actions": ["强推", "改写历史", "提交子仓 gitlink"], "constraints": {"门槛": "CI success"}}, "acceptance": ["run 号 success", "I5 用例在 CI 运行通过"]},
    {"origin_id": "S5-release", "status": "OPEN", "failed_rounds": 0, "evidence": [], "scope": {"targets": ["tag 1.2.0", "Release Latest"], "allowed_actions": ["打 tag", "建 Release"], "forbidden_actions": ["动其他 tag 和 Release"], "constraints": {}}, "acceptance": ["commit、tag、Release ID、制品、字节数、sha256"]},
    {"origin_id": "S6-deploy", "status": "OPEN", "failed_rounds": 0, "evidence": [], "scope": {"targets": ["演示环境部署", "复测", "同步"], "allowed_actions": ["按运维手册部署", "建复测数据", "改 E3-3 一行"], "forbidden_actions": ["删库清数据", "装非运行时依赖", "apt fix-broken/autoremove"], "constraints": {"备份": "*_pre120", "Flyway": "36 行"}}, "acceptance": ["版本与 health", "Flyway 36", "E1~E4 与 X1 复测", "E3-3 改后回读", "同步清单"]},
    {"origin_id": "S7-close", "status": "OPEN", "failed_rounds": 0, "evidence": [], "scope": {"targets": ["iso120 清理"], "allowed_actions": ["删 sw_iso120、sw_iso120_x1", "停 18093/5275/56379/18094", "删 18094 worktree"], "forbidden_actions": ["碰其他本机库和服务"], "constraints": {}}, "acceptance": ["库列表与端口回读"]}
  ]
}
```
