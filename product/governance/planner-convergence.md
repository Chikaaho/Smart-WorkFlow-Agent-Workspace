# 规划收口门禁

权威行为规则：`system.md` §3.6，Owner2026-10-27授权。实现为`.codex/governance/planner-convergence.py`，Codex现有Stop适配器按显式会话角色调用同一实现；Windows和POSIX共用校验，不另建Executor终态schema。本文放在Planner可读的product/governance，规划无需越权读取治理实现。此门禁校验规划委派，不裁决业务通过。

## 校验内容

- REWORK必须有原对象、原断言、原证据、具体位置、实际值、预期值、原因/有依据的假设、限定动作和完成断言；“不通过，继续优化”不能代替诊断。
- 同项再次派发，目标/允许动作只能收窄，已有禁止动作和参数约束须保留；至少有一处真正收窄或增加具体限制。仅改文字、换文件编号不能通过。工程实现方法仍由Executor选择。
- 连续失败两轮起须记录Planner自己的口径/方法自检。明显缺陷可以继续第三轮及更多修复，不因轮次自动停止。
- 原origin_id、对象/断言与失败历史持续继承，原项不得消失。已过重开必须指向具体反证、实现变化或快照失效。新缺陷另列原断言与证据，不得用新ID替代同对象同断言。
- FINISH只允许全部RESOLVED，或剩余仅MINOR且业务/使用/UI还原度三项影响明确均为false并有证据与理由。影响未知/任一为true、仍有REWORK或PLANNER_ACTION均不能提前结束。FINISH仅是规划本轮修复结论，不替代正式PASSED或七阶段交付。

机器检查字段、集合继承与参数变化，不能证明自然语言诊断、影响判断或实际证据为真；Planner仍须读原件独立判断。不能用增加无关禁止项凑收紧，也不能以该账本要求执行补业务附件。真实源稿/字体/数据冲突先由Planner明确比较对象与修复边界，明显缺陷持续处理，真正产品/授权外决定交Owner。

## 同文档账本

规划在当前执行提示中写一个以下代码块，中文正文用于说明，账本用于可机械比较；路径引用原位，不另建重复证据包。改写同一个文件同样递增revision；previous_revision引用上次接纳值。首次纳入旧任务，Planner须从已有记录继承真实原ID、已过项和失败次数，不以机器首次登记为由清零。机器不能自动还原未结构化的历史判定。

```planner-convergence
{
  "schema": "agent-coding-engine.planner-handoff.v1",
  "feature": "example-feature",
  "revision": 1,
  "previous_revision": 0,
  "decision": "CONTINUE",
  "source_receipt": "product/example-feature/receipts/execution-01.md",
  "items": [
    {
      "origin_id": "A03-sidebar",
      "subject": "/example 左侧栏",
      "criterion": "展开宽度236px，偏差不超过1px",
      "status": "REWORK",
      "failed_rounds": 1,
      "evidence": ["已有执行回执及运行图的实际位置"],
      "diagnosis": {
        "location": "/example 左侧栏外边界",
        "observed": "宽度240px，右侧边界偏4px",
        "expected": "宽度236px，允许偏差1px",
        "cause": "据已有几何结果，展开态仍使用旧宽度；执行核实该具体值",
        "next_action": "仅修展开侧栏宽度及其受影响边界，保持已证行距与菜单行为"
      },
      "scope": {
        "targets": ["展开侧栏", "侧栏底栏"],
        "allowed_actions": ["调整展开宽度", "校正底栏对齐"],
        "forbidden_actions": ["改业务数据", "改分页契约"],
        "constraints": {"展开宽度": "236px ±1px"}
      },
      "acceptance": ["真实展开宽度236px ±1px，原收起/导航行为沿有效证据保持"]
    }
  ]
}
```

第二次派发可移除不涉及的“侧栏底栏”，或在保留原限制的基础上增加有依据的具体参数。连续失败两轮起REWORK增加`planner_self_audit`，明确检查了什么及结论。不能仅递增revision/failed_rounds。

RESOLVED仍保留origin_id/subject/criterion/failed_rounds/evidence及最近scope；其他非REWORK状态也保留最近scope，防止通过中间状态重置执行范围。重开时加`invalidation`对象，kind取COUNTEREVIDENCE、IMPLEMENTATION_CHANGED或SNAPSHOT_INVALID，并给reason/evidence。MINOR增加`reason`和`impact:{"business":false,"usability":false,"ui_fidelity":false}`，三项必须有证据支持。PLANNER_ACTION增加具体`next_action`，保持CONTINUE，不用该状态提前结束。

## 状态、发现与运行

历史以feature目录为键，保存在Git公共目录的`planner-convergence/<feature>.json`；同仓关联worktree共用，提示改名和会话切换不重置。采用非等待原子目录锁和原子替换，相同已接纳事件幂等；锁遗留或状态损坏时明确拒绝，管理员核实后恢复，不自动清零。历史上限500条，归档需保留接续关系。

Stop使用共享角色观察器，只接受当前会话的显式人类角色声明，支持“切换管理员/切换为规划”。管理员/执行/未绑定不进入规划校验。规划当前回合工具参数、最终引用和Git实际变动定位执行提示；未改变的旧提示只读不会因缺新账本被打回。新改写的`planning-execution-prompt*.md`必须带账本；改名后标题含“执行任务/执行提示/补充提示/续办任务/派发”或含同一账本标记的文档也会识别。口头直接“不通过，请执行继续修复”而无具体提示会拒绝。此识别不声称能理解所有自然语言隐式派发；宿主未派发Stop时无法自动拦截。

审计位于`.codex/governance/runtime/planner/audit.jsonl`和Codex适配器原审计。新规划组件及两个必要共用依赖纳入Git，runtime保持忽略；原Executor本机治理目录不在本次整体迁移范围。此变更已接入Codex声明的现有Stop路径，未把未验证的ZCode/Claude接入声称为已启用；宿主信任/重载由实际宿主控制，管理员不代用户批准信任。

手动同强度检查：`py -3 -X utf8 .codex/governance/planner-convergence.py --workspace <根> --document product/<feature>/receipts/<提示>.md`。此命令成功会记录接纳的revision，不是只读预览。治理回归：`py -3 -X utf8 .codex/governance/test-planner-convergence.py`，只用临时治理仓，不启动业务设施。
