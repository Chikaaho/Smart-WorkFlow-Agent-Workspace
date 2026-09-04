# P58 流程节点能力完善规划验收记录 03

> 审查角色：规划（Planner）  
> 审查日期：2026-09-03  
> 上轮审查：`planning-review-p58-workflow-node-capabilities-02.md`  
> 上轮提示：`planning-execution-prompt-p58-workflow-node-capabilities-01.md`  
> 本轮回执：`execution-receipt-20260903-debug-auth-02.md`  
> 功能级结论：**未通过，保持 VERIFYING**  
> 同类失败次数：3；一级提示后仍失败，升级二级提示

## 1. 本轮裁决

本轮提交了七份可读取附件，首次形成认证后真实浏览器 DOM、调试认证 HTTP、混合 profile fail-fast、意见表单填写、双人 ALL 会签、TRUE 分支、站内通知和质量门的可复核摘录。下列行为原子可以锁定，不要求原样重验。

但 P58 仍不能 `PASSED`：真实审批动作同时显示成功和失败提示，是明确的页面行为矛盾；普通多人候选、意见联动与版本矩阵、ANY/RATIO、分支其他路径与负向、抄送权限、退回/驳回通知、渠道 Adapter 负向、拒绝/退回组合链及 PG 业务表前后值仍未提交。回执自身也逐项承认这些缺口。

浏览器客户端当前没有 Network 事件读取能力属于工具能力事实。后续不再要求该工具直接导出 Network/HAR，改用“真实浏览器动作 DOM + 同时间窗口后端访问/认证日志 requestId + 同一对象 API/数据库回读”形成等强度关联证据；不得继续以缺少 Network API 为停止理由。

## 2. 已锁定行为原子

| 编号 | 锁定结论 | 边界 |
|---|---|---|
| L1 | dev + 显式开关 + 回环请求下，viewer/operator 两个真实普通用户 `/auth/me` 身份不同；viewer 能读能力清单但创建流程 403。 | 不覆盖停用/删除用户、真实非回环和浏览器存储。 |
| L2 | `dev,prod` 混合 profile 强制开关时触发 fail-fast，端口无监听。 | 不覆盖所有非 dev/test 组合，但满足生产混入负向核心。 |
| L3 | 关闭开关后同形 token 访问 `/auth/me` 和能力接口均 401；生产前端构建扫描无调试入口。 | 不覆盖浏览器本地/会话存储零值。 |
| L4 | 认证后任务页真实显示 `p58-opinion v2` 的必填 TEXTAREA/SELECT，提交 comment/riskLevel 后历史回读包含表单 ID/版本与值。 | 不覆盖默认备注、联动、显隐、篡改拒绝、版本变化；动作 UI 仍矛盾。 |
| L5 | 两个独立普通身份的 ALL 会签正向：首人完成后另一任务仍活动，两人完成后实例 APPROVED、无活动节点。 | 不覆盖每人意见、负向、RETURN、重复和并发。 |
| L6 | 同一组合实例以 `amount=250` 命中 TRUE，轨迹到 COPY/NOTIFICATION/END。 | 不覆盖第二条件、DEFAULT、非法表达式和类型错误。 |
| L7 | 同一实例产生审批通过、组合通知和抄送站内消息，状态 SUCCESS，含 instance/node/recipient 幂等键。 | 不覆盖收件人去重/权限、退回/驳回和第三方 Adapter。 |
| L8 | 同一 processKey/businessKey/instanceId/taskId 的正向后端链完成并到 End。 | 页面存在成功/失败双提示，不能锁定浏览器体验或整链标准。 |
| L9 | 当前快照质量门：Server 148 份 Surefire、1024/0/0/0；PG/H2 到 V49；Web 117 files passed + 1 skipped、1107 tests passed + 3 skipped，typecheck/lint/build 退出 0。 | 后续修正后仍需最终回归；不作为正式基线。 |

## 3. 未通过标准

主方向标准 1—16 仍未全部满足；调试认证补充标准仅部分满足。剩余原子缺口收敛为 R1—R8，并写入二级提示 `planning-execution-prompt-p58-workflow-node-capabilities-02.md`。后续不得重新展开 L1—L9，除非修正直接改变对应行为；最终全量回归属于 R8，不视为重复功能取证。

## 4. 升级处理

一级提示后仍提交相同类别的不完整矩阵，已满足二级提示触发条件。二级提示删除已锁定项，只保留：

- R1 调试认证剩余负向与浏览器存储；
- R2 设计/发布四类选人与非法配置；
- R3 普通多人审批、UI 矛盾及意见低代码剩余矩阵；
- R4 会签 ANY/RATIO/失败/RETURN/并发；
- R5 分支第二条件、默认与负向；
- R6 抄送权限、退回/驳回通知和渠道 Adapter；
- R7 真实浏览器拒绝/退回组合链；
- R8 PG 业务表勾稽、最终回归和零残留。

## 5. 状态

P58 保持 `VERIFYING`。不核销 P58、不晋级正式基线、不移动方向到 `passed/`。Executor 必须执行二级提示并提交新的追加式回执；合法提交终态仍为 `EXECUTION_SUBMITTED`。
