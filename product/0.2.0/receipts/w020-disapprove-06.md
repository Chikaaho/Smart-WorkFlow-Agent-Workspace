# 0.2.0 统一执行·批次 05（单任务 DISAPPROVE 端到端对接）

2026-10-25｜Executor｜W020 分支实施（授权：direction-unified-020.md §当前剩余交付 4「核单任务 DISAPPROVE 契约」的执行侧落地）

## 背景与缺陷

盘点已核实服务端 ApprovalAction 枚举含独立 DISAPPROVE（"当前参与人不通过意见，交节点结算规则"，区别 REJECT 流程级终态；TaskActionService 注释明确"会签参与人的负向意见统一使用 DISAPPROVE"）。但：①单任务命令通道 `POST /workflow/commands/tasks/{taskId}/{action}` 的 resolveAction 不认 disapprove 段；②**移动端"不通过"按钮实际发 'reject' 段（REJECT 流程终态）**——与契约相悖的真实缺陷；③PC 端无 DISAPPROVE 入口。

## 修改

**Server `fa51395`**：BpmCommandController.resolveAction 增加 `case "DISAPPROVE" -> ApprovalAction.DISAPPROVE`；BpmCommandControllerP0Test 新增 NORMAL 通道映射断言用例。

**Web `e18b31e`**：
- TaskActionSegment 增 'disapprove'；use-task-approval 支持三动作（确认文案/受理段/成功文案分流：确认提交不通过意见？/disapprove 段/已提交不通过意见），接口与适配器类型同步。
- **MobileWorkspace 误发修复**：不通过由 'reject' 段改发 'disapprove' 段（en 文案 'Reject'→'Disapprove' 纠正语义混同）。
- TaskDetail 负向动作按节点策略路由：`negativeAction = REJECT 优先，节点策略仅允许 DISAPPROVE 时为 DISAPPROVE`；按钮标签随路由（驳回/不通过），复用驳回申请弹窗与意见链；旧定义无策略时保持 REJECT 语义不变。

## 验证

- Web 四连：typecheck 0、lint 0/0、**1848 通过/3 跳过**（TaskDetail 40/40，新增 2 例：仅允许 DISAPPROVE 时按钮为不通过且提交走 disapprove 段；无策略旧定义保持 REJECT）、build 3.51s。
- Server：BpmCommandControllerP0Test 聚焦通过（含新用例）；**bpm-process 模块全量 471/0/0 BUILD SUCCESS**（锁定基线 467 + 催办留言 3 + 本批 1）。
- 行为边界：DISAPPROVE 仍是"当前参与人意见"，节点结算与实例走向由服务端既有规则裁决；本批不改 REJECT/会签结算任何已过行为。

## Git

Server `ee1bb3b..fa51395`、Web `6167946..e18b31e` 均已推送回读一致；工作树仅受保护 vite.config.ts（Web）。

总 7 阶段：已完成 1 需求评估；进行中 1 分支实施；未开始 5 验收同步、合并、0.2.0 发布、发布后同步、结束。
