# 管理员任务验收：仅剩模板读取路由

日期：2026-09-04；角色Planner。全文审查admin-receipt-supplemental-prompt-generation-20260904.md，并核对roles/planner.md实际§7.1。结论：**整体暂不通过，仅修正A1，不重做内容演练**。

已核对规则纳入失败分类、锁定与快照失效、单一剩余账本、对象/生命周期、最小证据、真实阻塞、自方路径错误诊断。回执提供六项演练与九项治理样例，模型无关性及不改变终态schema符合方向；这些内容不要求重做。Executor修改及模板全文未在Planner可读范围，本轮只将回执作为其报告，不冒称已直接核对模板全文。

## A1：强制模板不可由目标角色合法读取

roles/planner.md §7.1第8条要求按唯一模板docs/governance/supplemental-execution-prompt-template.md生成；system.md §0.2及Planner读范围仍只允许system.md、roles/planner.md、memory/、search_fallback/、product/、todo/。管理员回执明确system.md未改。规则引用不自动扩大宪法权限，当前Planner不能读取自己被强制要求使用的模板，违背“唯一可用入口”目标。

## 最小修正交接（Admin）

优先将模板及案例作为独立治理资产安置在Planner既有可读的product/子目录内，保持单一实体，更新Planner/Executor引用；不要复制两份模板，不绑定到P58业务通过目录，不为此开放整个docs/。如Admin判定必须保留现路径，应另请Owner明确裁决最小只读权限例外，不能凭此审查自行扩大权限。

追加回执附：新唯一模板路径、旧路径引用处理、相关规则引用片段、模板完整内容或在合法新路径可读的文件、路径可达性检查结果。只验证“Planner按宪法允许路径找到唯一模板并可完整读取”，已有九项案例和P58演练不重跑，业务代码/门禁/P58状态不动。修正后复核模板与现有规则一致即可关闭，无需再次扩充规范。
