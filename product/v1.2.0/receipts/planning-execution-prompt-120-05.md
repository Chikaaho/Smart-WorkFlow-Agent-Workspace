# 执行提示 120-05：1.2.0 阶段 3 最后两项

2026-11-24｜规划 → 执行｜依据 `planning-review-120-05.md`｜本提示替代 `planning-execution-prompt-120-04.md`，是当前唯一的执行入口。方向 `direction-v1.2.0.md` 仍然有效。已验收轮数：4。

## 1. 要做的

截图规则不变，并且**拍摄时间必须晚于对应的修复提交**。回执列出每张图的拍摄时间和对应的提交时间。

| ID | 内容 | 完成条件 | 证据 |
|---|---|---|---|
| T2 | 用 `34c43e98`（或之后的最终提交）构建的 Server 重拍 | 运行中的流程执行显示「流程」，按「直接调用」筛选时没有流程执行 | 2 张，画面里要有「共 N 条」或者能对上回执的对象 ID |
| T4② | 用真实流程产生抄送：发布一个带抄送节点（或审批时抄送）的流程，抄送给一个不是办理人的用户，走到抄送节点。用这个用户在工作台「抄送」页签点开。详情要能看到这条实例的表单数据和流转记录；如果设计上不允许抄送人看，就显示明确的无权限提示。不能显示和事实不符的「无表单数据」「暂无审批历史」。抄送行的标题要显示流程名，不能是「-」。查清楚 120-16 里显示空态的原因，是缺陷就修 | 抄送人看到的内容和实例一致，或者看到明确提示 | 抄送页签截图、详情截图；根因说明 |

SQL 写的抄送夹具（`e4cc_user`、`#2125090000000000001`）可以留着，但不能作为 T4② 的证据。抄送接收人可以继续用 `e4cc_user`。

## 2. 门禁

T4② 如果改了代码，在新的最终提交上重跑：Web typecheck、lint、test、build；Server 改动涉及的模块 `mvn test`。回执写计数和提交号。

## 3. 锁定项（不要重验）

第 1~4 轮锁定的全部项，见 `planning-review-120-02/03/04/05.md`。本轮新锁 T1、T3、T4①。

## 4. 环境

不变：只用本机 5432 上的 `sw_iso120`；不要登录本机 MySQL 和其他用户服务；临时凭据文件用完就删；不提交两个子仓的 gitlink 变更。阶段 7 清理 `sw_iso120`、`sw_iso120_x1` 和 18094 的 worktree。

## 5. 回执与进度

回执 `execution-120-17.md`。规划验收通过后进入阶段 4：按方向 §4 合并到 main，跑 main CI，run 成功后才能打 tag。阶段 4~7 在版本确认后持续授权。

共 7 个阶段：已完成 2 个，进行中 1 个（验收收尾），未开始 4 个。

```planner-convergence
{
  "schema": "agent-coding-engine.planner-handoff.v1",
  "feature": "v1.2.0",
  "revision": 6,
  "previous_revision": 5,
  "decision": "CONTINUE",
  "source_receipt": "product/v1.2.0/receipts/execution-120-16.md",
  "items": [
    {"origin_id": "T2", "status": "OPEN", "failed_rounds": 1, "evidence": ["T2-source-process-running.png", "T2-source-direct-no-process.png"], "scope": {"targets": ["执行列表来源"], "allowed_actions": ["按最终提交重拍"], "forbidden_actions": ["回填存量行"], "constraints": {"拍摄时间": "晚于 34c43e98"}}, "acceptance": ["运行中显示流程", "直接调用筛选无流程执行", "共 N 条可见"]},
    {"origin_id": "T4-cc", "status": "OPEN", "failed_rounds": 1, "evidence": ["T4-cc-tab.png", "T4-cc-detail.png"], "scope": {"targets": ["工作台抄送页签", "抄送详情"], "allowed_actions": ["真实流程取证", "修复"], "forbidden_actions": ["用 SQL 夹具作证据"], "constraints": {}}, "acceptance": ["详情与实例一致或明确提示", "行标题为流程名", "根因说明"]},
    {"origin_id": "GATE-final", "status": "OPEN", "failed_rounds": 0, "evidence": ["execution-120-16.md#6"], "scope": {"targets": ["改动后的最终提交"], "allowed_actions": ["运行测试"], "forbidden_actions": [], "constraints": {"条件": "T4-cc 改了代码才重跑"}}, "acceptance": ["计数与提交号"]}
  ]
}
```
