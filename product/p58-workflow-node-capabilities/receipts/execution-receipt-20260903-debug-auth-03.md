# P58 流程节点能力完善 · 执行回执 03

- 执行日期：2026-09-03
- 执行角色：Executor
- 执行状态：`EXECUTION_SUBMITTED`
- 功能状态：`VERIFYING`
- 上游审查：`planning-review-p58-workflow-node-capabilities-03.md`
- 执行提示：`planning-execution-prompt-p58-workflow-node-capabilities-02.md`
- 本轮范围：接手审查 03 的 R1—R8 原子缺口；不改变 Planner 未通过裁决。

## 1. 版本与环境边界

本轮没有 commit、push、reset 或将方向移动到 `passed/`。代码工作区保留既有未提交改动；行为证据绑定以下当前 checkout：

```text
root   develop-sw 5b44220cc33ea0e61ec2dab3034eece10e43f2f9
server develop    451bd9a2dd979db574fbdb2923f26881ea11af8d
web    develop    802971df711397a9d7c9bc20c6c8f5ba60ec70b0
```

开发验证使用独立 PostgreSQL 15432、后端 18084 和三个前端端口；完成证据后已停止这些专属进程。调试认证只在 dev profile、显式开关和回环来源下接受内存 `test_<userId>` access token；不读取或写入 Cookie、localStorage、sessionStorage。

## 2. 本轮修复摘要

- 调试认证补齐非回环真实 401、停用/软删除用户 401、开关关闭 401、无响应 Cookie/token，并保留结构化安全日志。
- `TaskDetail.vue` 修复 API 成功后导航异常导致的相反失败提示；补齐审批意见初始化、显隐、必填、版本/数据提交和 RETURN 操作。
- 审批后端补齐普通候选任一结算、审批意见权威校验、重复/并发动作锁；REJECT 显式终止流程并发出驳回结果事件。
- 四类参与人策略接入保存/发布校验、运行解析和失效输入拒绝；`P58_DEBUG` 参与人和通知 Adapter 均限定 `dev` profile。
- 会签补齐 ANY、RATIO 阈值、失败/驳回、RETURN 取消并行任务和进程级并发结算；条件分支补齐优先级、DEFAULT、部署后元数据与运行轨迹。
- 通知补齐收件人去重、收件人权限隔离、Adapter SUCCESS/FAILED/TIMEOUT 结果与幂等查重；保留生产不做第三方验证的边界。

## 3. R1—R8 证据包

每个原子缺口均有独立字段化附件，包含输入 ID、身份、profile/开关、DOM 或原始 HTTP、Flowable/业务 SQL、正反断言、退出码和清理结果：

- [R1 调试认证](attachments/r1-debug-auth-20260903-04.txt)
- [R2 四类参与人策略](attachments/r2-participant-20260903-04.txt)
- [R3 普通审批与低代码意见](attachments/r3-approval-opinion-20260903-04.txt)
- [R4 会签矩阵](attachments/r4-consensus-20260903-04.txt)
- [R5 条件分支矩阵](attachments/r5-condition-20260903-04.txt)
- [R6 抄送、通知与 Adapter](attachments/r6-copy-notify-20260903-04.txt)
- [R7 认证后浏览器组合负向链](attachments/r7-browser-composite-20260903-04.txt)
- [R8 PG 业务/BPM/Flowable 清理](attachments/r8-pg-cleanup-20260903-04.txt)

浏览器操作均在每次动作后复查 DOM；当前 browser-client 不提供 Network 事件读取，因此没有伪造浏览器 Network 附件，改以直接原始 HTTP、requestId、DOM 和 SQL 关联。R2 设计器的完整控件级 Network 仍由 Planner 独立复核附件覆盖度。

## 4. 质量门与清理

本轮新增/复核的定向结果：

```text
server process/controller/validator/start tests = 0
server engine/translator/consensus tests = 0
server notify integration test = 0
web TaskDetail.spec.ts = 10 passed, 0 failed
auth storage scan = 0
P58 dev adapter profile scan = 0
production dist debug scan = no hits
```

PG 清理前后已使用事务和精确 fixture 范围复核：清理前 29 个实例、36 个定义、24 个部署、47 个参与人快照、29 个审批动作、6 个分支、6 个抄送、36 个通知、29 个表单行；清理后 `sw_bpm_process_def`、`sw_bpm_form_binding`、`sw_bpm_instance`、参与人/动作/分支/抄送、通知、表单定义/快照/轨迹/数据以及检查到的 Flowable 定义/部署/运行/历史残留均为 0。四个测试用户最终均 `status=0, deleted=0`。原始计数和删除行数见 [R8 附件](attachments/r8-pg-cleanup-20260903-04.txt)。

## 5. 当前状态与移交

本轮已取得实质进展并提交 R1—R8 证据，但不代替 Planner 验收：

1. `P58` 继续保持 `VERIFYING`，不核销、不归档、不声明 `PASSED` 或 `COMPLETED`。
2. browser-client 缺少 Network 事件读取能力，故原始 HTTP 与 DOM/SQL 关联是当前可复核证据边界。
3. 第三方生产渠道未做外部账号联调；本轮只证明 dev Adapter 的隔离成功/失败/超时和统一持久化契约。
4. 下一动作是 Planner 独立复核本回执及 R1—R8 附件，并重新裁决是否通过。

```text
EXECUTION_SUBMITTED
feature_status=VERIFYING
next_action=WAIT_PLANNER
```
