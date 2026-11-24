# 执行提示 120-04：1.2.0 阶段 3 收尾

2026-11-24｜规划 → 执行｜依据 `planning-review-120-04.md`｜本提示替代 `planning-execution-prompt-120-03.md`，是当前唯一的执行入口。方向 `direction-v1.2.0.md` 仍然有效。已验收轮数：3。

## 1. 小尾巴

截图规则不变：在本机可见浏览器里拍，sha1 互不相同，头部和要证明的区域在同一张图里，截图在修复提交之后拍。回执写 URL、视口、登录身份（不写口令）、对象 ID。

| ID | 内容 | 完成条件 | 证据 |
|---|---|---|---|
| T1 | 修 CONTINUE 分流说明：status 只有 SUCCESS/FAILED，失败原因看 errorCategory（TIMEOUT / EXECUTION_ERROR / OUTPUT_MISSING 等，按实际取值列）。条件节点变量说明的文字要折行，不能超出面板被截断 | 说明和实际取值一致，文字完整可读 | 2 张截图（Graph 执行器面板、条件节点面板） |
| T2 | 执行列表的「来源」在执行一创建就正确：运行中的流程执行显示「流程」，按「流程」筛选能筛出来，按「直接调用」筛选筛不出来 | 运行中和完成后，来源都和 `business_source` 一致 | 慢图运行中时，按「流程」筛选的截图（能看到运行中的行），再加一张按「直接调用」筛选的截图 |
| T3 | ① 「审批意见详情」弹窗头部的时间改成 `yyyy-MM-dd HH:mm:ss`；② 下载 E4-1 实例的服务端 PDF，抽出文本检查 | 弹窗里没有 ISO 时间；PDF 文本里没有 `DynamicData@` 和 `com.sw.`，有「90」「分钟」这类可读值 | 弹窗截图；PDF 抽文本的命令和结果摘录 |
| T4 | ① 列出会产生 `ACTION#` 行的动作类型和来源代码位置，逐个判断应不应该出现在已办里；应该出现的，保留显示，点「查看」打开实例详情。② 造一个只被抄送、不是办理人的用户，在工作台「抄送」页签点一条，出问题就修 | 已办里不丢该显示的记录；抄送能打开，或者给出明确的无权限提示，不出现「流程不存在」或空白页 | 动作类型清单和结论；抄送页签截图，点进去后的截图 |

## 2. 阶段 3 出口门禁

T1~T4 全部提交后，在最终提交上跑：Web typecheck、lint、test、build；Server agent、bpm、form、workflow 相关模块的 `mvn test`。回执写计数，写明这是哪个提交的结果。全量里环境类失败照旧记为限制，以 main CI 为准。

## 3. 补充说明

回执写明本轮和上一轮哪些夹具是用 SQL 直接写的（例如 `E1-3常量分流图`、`E4-1审批意见展示`），各自用来证明什么。

## 4. 锁定项（不要重验）

第 1~3 轮锁定的全部项，见 `planning-review-120-02/03/04.md`。只有修复改到相关代码时才重测，回执要写明理由。

## 5. 环境

不变：只用本机 5432 上的 `sw_iso120`；不要登录本机 MySQL 和其他用户服务；临时凭据文件用完就删；不提交两个子仓的 gitlink 变更。阶段 7 清理 `sw_iso120`、`sw_iso120_x1` 和 18094 的 worktree。

## 6. 回执与进度

回执 `execution-120-16.md`。规划验收通过后，进入阶段 4 合并：按方向 §4 合并到 main，跑 main CI，run 成功后才能打 tag。阶段 4~7 在版本确认后持续授权。

共 7 个阶段：已完成 2 个，进行中 1 个（验收收尾），未开始 4 个。

```planner-convergence
{
  "schema": "agent-coding-engine.planner-handoff.v1",
  "feature": "v1.2.0",
  "revision": 5,
  "previous_revision": 4,
  "decision": "CONTINUE",
  "source_receipt": "product/v1.2.0/receipts/execution-120-15.md",
  "items": [
    {"origin_id": "T1", "status": "OPEN", "failed_rounds": 0, "evidence": ["E1-1-panel-continue-top.png", "E1-1-condition-status-vars.png"], "scope": {"targets": ["CONTINUE 分流说明", "条件节点变量说明折行"], "allowed_actions": ["改文案与样式"], "forbidden_actions": [], "constraints": {}}, "acceptance": ["取值一致", "文字完整"]},
    {"origin_id": "T2", "status": "OPEN", "failed_rounds": 0, "evidence": ["E1-3T-three-running-slow.png"], "scope": {"targets": ["执行列表来源"], "allowed_actions": ["修复"], "forbidden_actions": ["回填存量行"], "constraints": {}}, "acceptance": ["运行中来源正确", "筛选无他源"]},
    {"origin_id": "T3", "status": "OPEN", "failed_rounds": 0, "evidence": ["E4-1-opinion-detail-after.png"], "scope": {"targets": ["意见详情弹窗时间", "服务端 PDF"], "allowed_actions": ["修复", "抽文本核对"], "forbidden_actions": [], "constraints": {}}, "acceptance": ["无 ISO 时间", "PDF 无对象串"]},
    {"origin_id": "T4", "status": "OPEN", "failed_rounds": 0, "evidence": ["execution-120-15.md#11"], "scope": {"targets": ["ACTION# 行类型", "工作台抄送"], "allowed_actions": ["核对", "修复"], "forbidden_actions": [], "constraints": {}}, "acceptance": ["类型清单与结论", "抄送可打开或明确提示"]},
    {"origin_id": "GATE-final", "status": "OPEN", "failed_rounds": 0, "evidence": [], "scope": {"targets": ["Web 四项", "Server 受影响模块"], "allowed_actions": ["运行测试"], "forbidden_actions": [], "constraints": {}}, "acceptance": ["计数与提交号"]}
  ]
}
```
