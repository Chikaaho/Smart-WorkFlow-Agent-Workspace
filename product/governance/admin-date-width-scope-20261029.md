# 日期控件原项宽度动作的Owner许可接续

2026-10-29｜Admin｜Owner明确授权临时管理员处理本限制，完成后恢复规划。

Owner所答问题限定：原流程填写页日期控件铺满既有半列、保持32px高，已过框架与业务不动。Owner原答复：“授权临时管理员处理此限制，完成后恢复规划”。本记录只维护这项治理许可，不裁决业务通过，不修改业务实现/数据。

## 诊断与修复

P3/101:2已有失败历史，旧allowed_actions只登记高度/工具栏/子表，因此即便Owner明确批准宽度窄修，原比较仍以扩大动作拒绝。保留正常收紧规则；新增Admin登记的单revision动作更正，仅此次0.2.0/P3/101:2、上一revision20、原subject/criterion/完整prior_scope匹配时允许这一个动作。原目标集合不能扩大，失败次数须接续+1、诊断/自检/完成条件仍校验，全部旧禁令/参数必须保留；许可不重开RESOLVED、不允许FINISH。当前仅登记一个许可。

权威登记为.codex/governance/planner-scope-amendments.json，属于Admin治理范围；提示只引用owner_scope_amendment ID，提示内自述“Owner同意”或产品文档不能产生许可。许可不能换feature/原项/revision或转用至已过项。接纳后后继修复仍正常缩小集合/增加具体限制，不能重复借同许可扩动作。

## 规划恢复后的精确接续值

- owner_scope_amendment：owner-20261029-u020-date-width
- previous_revision：20；新revision：21。
- origin_id：P3/101:2，subject/criterion/targets保持，failed_rounds从1接续至2，status=REWORK。
- allowed_actions只留：仅使原正确process填写页日期控件铺满既有半列，保持32px高。
- scope.constraints保留原全部键值，再增加：
- Owner日期宽度许可：仅使原正确process填写页日期控件铺满既有半列，保持32px高。
- Owner已过保护：日期外框与其所属半列实际宽度差≤1px，高32px；不硬编码598/692；日期类型/时区/值、冻结定义、1440容器/48页头/64底栏、设计器/只读日期均保持。
- scope.forbidden_actions保留原集合，再增加：禁止修改日期类型/时区/值、冻结定义、1440容器/48页头/64底栏或设计器/只读日期；仅填满原process日期控件所在半列。

本许可只处理动作边界；宽度业务实证仍由Executor完成，Planner据结果独立裁决。根账本状态不重写、不清零、不修改历史项。

## 验证与交付

治理回归41项全部通过（含Windows/POSIX实际Stop适配器临时夹具）；新增Owner授权接续、无登记/跨feature/换项/过期/旧scope失配/撤销旧禁令/参数放宽/失败史回退/FINISH拒绝、后继收紧和幂等历史用例。生产登记与原scope匹配预检通过，越界日期语义动作拒绝；没有修改业务历史。Codex/ZCode各5项本机实际检查全部通过，complete后READY1.3.1。运行均限治理夹具/已有宿主观察，未启动业务服务或读取业务测试；初始化只晋升已实际验证的本机结果。本管理员变更独立提交，排除规划/业务未提交成果。
