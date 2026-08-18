# admin-role-governance 规划层复审（D95）

**日期**：2026-08-18  
**前次审查**：`product/admin-role-governance/receipts/planning-review-d94.md`  
**复审回执**：`product/admin-role-governance/receipts/admin-role-governance-completion.md`  
**复审判定**：**FAILED**

## 已闭合项

1. **迁移冲突语义已闭合**：V31 不再静默跳过 `code=admin` / `id=2` 冲突，改由数据库约束显式失败；全链测试包含冲突断言。
2. **项目级后端全量已闭合**：551 tests、0 failures、0 errors、0 skipped，超过 D93 的 543 基线。
3. **迁移与前端基础校验已闭合**：H2 31 条 migrate+validate、H2/PG V31 逐字一致；前端 66 spec / 576 tests，typecheck/lint/test/build 退出码均为 0。
4. **知识同步提前核销已纠正**：P24/I49 保持未核销，需求池保持待规划复审状态。

## 仍未闭合项

### 1. 验收标准 7–8：接口 allow/deny 仍无端到端自动化证据

`PermissionServiceTest` 证明普通角色权限装配、撤权拒绝与超管旁路；Controller 测试只证明方法权限注解存在。两组证据尚未证明实际受保护的 job/storage Controller 请求在授权时放行、撤权或未授权时返回拒绝，也未报告 seed permission 与每个方法注解字符串的逐项闭合结果。D93 要求“菜单可见”和“接口可调用”分别有自动化允许/拒绝证据，此项仍不满足。

### 2. 验收标准 10：编译互斥硬约束仍无证据

回执再次说明 `ps` 返回 `operation not permitted`，仅声明命令由当前执行者串行运行。该声明不能证明执行前不存在另一项目的编译/测试进程，未满足前后端编译互斥的硬约束证据要求。

### 3. 验收标准 11：功能清单同步仍不完整

完整触碰文件清单未包含 `Smart-WorkFlow/功能清单.md`，回执也未报告相关行状态是否变化、变更明细或“零变化”结论，以及同步后的 ✅/🟦/⬜ 总计。D93 与 §3.3 第10项要求功能清单和 knowledge 全量同步并在回执中报告清单明细；此项仍不满足。

## 复审结论

- 主体实现与大部分测试证据不作否定，D94 已闭合项无需重复返工。
- 因上述三项仍直接命中原验收标准与硬约束，本功能继续保持 `FAILED`；P24/I49 不核销，方向保留在 `ready/`。
- 执行层应基于原方向和本复审偏离项自主处理并重新提交回执；规划层不代写技术修正方案或 Step。
