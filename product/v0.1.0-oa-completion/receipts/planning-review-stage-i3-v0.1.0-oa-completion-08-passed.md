# P60 I3「人工审批与自研流程设计器」规划验收 08

> 验收角色：规划（Planner）  
> 验收日期：2026-09-12  
> 执行回执：`stage-i3-v0.1.0-oa-completion-09.md`  
> 上轮审查：`planning-review-stage-i3-v0.1.0-oa-completion-07.md`  
> 结论：**PASSED**

## 1. 本轮验收边界

本轮只验收 R8c 真实 RETURN 二轮链和 R10b 终态封装。验收 05—07 已锁定的自研设计/查看、定义版本、审批动作、会签与生命周期、时限通知、节点函数、意见表单、权限和真实页面行为继续有效，不重复执行。

## 2. R8c 独立复核

| 检查 | Planner 独立结果 | 结论 |
|---|---|---|
| 原始请求完整性 | `R8c/raw-transcript.txt` 共24行，全部可解析；核心发起、任务回读、完成、退回、历史与主表单回读均为HTTP 200/业务code 0 | PASSED |
| 真实退回对象 | B1任务ID `61329f91…` 来自user2待办回读；`POST /workflow/tasks/{B1}/return`使用该真实ID，目标`node_a`，HTTP 200/业务code 0，旧B1任务关闭 | PASSED |
| 二轮重建 | A2 `62757fd6…`与A1不同；B2 `63b4b69a…`与B1不同；均由对应办理人待办重新取得并成功完成 | PASSED |
| 权威历史 | 实例详情按endTime排序后严格为`APPROVE(node_a/A-R1) → RETURN(node_b/B-RETURN-R1) → APPROVE(node_a/A-R2) → APPROVE(node_b/B-R2)` | PASSED |
| 意见对象 | 四条历史均有非空`opinionData`、`opinionFormId`、`opinionFormVersion`、任务、节点和办理人 | PASSED |
| 终态与副作用 | 实例`APPROVED`、PENDING=0；动作行4、RETURN行1、实例1；主表单amount=42/version=0未反写 | PASSED |
| 断言边界 | 采集器直接约束真实任务ID、code 0、旧任务关闭、新任务差异、四步历史、意见字段、单实例/单退回及终态；本轮`fails=[]` | PASSED |

待办DTO不返回nodeKey/taskName，采集器最终以同一task ID的权威历史补齐节点归属；A1详情同时给出任务名与办理人。该勾稽足以证明每步任务身份，不构成对象替换。

## 3. R10b 独立复核

| 检查 | Planner 独立结果 | 结论 |
|---|---|---|
| 5xx扫描 | Planner重新解析24行原始流：HTTP 5xx=0、业务5xx=0、解析失败=0；`R10/5xx-scan.json`同值 | PASSED |
| manifest | `file_count=13`，实际项目13；Planner独立重算sha256，bad=0 | PASSED |
| payload | sha256独立回读为`bec34c67…`，与`payload-hash.txt`及manifest一致；work_items两项均completed/actionable=false、remaining=0 | PASSED |
| Validator | `validator-exit.txt=0`，stdout/stderr为真实空输出 | PASSED |
| 门禁真实性 | Server全量门禁按实际exit 1/FAILED申报；6例IoT Windows/JDK21环境失败及同机基线对照保留；bpm-process 186/0、bootstrap 43/0、Web四门0继续引用锁定事实 | PASSED |
| 清理 | 8081/8082/50886/5173最终监听均为false；Redis系统服务不作为会话资产处理 | PASSED |
| 证据卫生 | 新原始流不含JWT/Bearer或凭证正文；helper中仅有运行时变量和认证字段名，不含持久化令牌值 | PASSED |

i3-08的早期采集500继续保留在验收07的历史审计链中；本轮没有改写旧包，也没有把旧包声明为零错误。

## 4. I3 累计验收结论

| I3验收域 | 累计结论 |
|---|---|
| 自研流程设计、拖拽、连线、配置、校验、发布、刷新恢复与错误定位 | PASSED |
| 单一`ProcessGraph`在设计、保存、发布、定义查看及实例轨迹中的一致性 | PASSED |
| 定义版本冻结、挂起/激活、安全删除、运行与历史兼容 | PASSED |
| `bpmn-js`生产依赖、源码、样式、测试、产物与运行DOM退出 | PASSED |
| APPROVE / DISAPPROVE / RETURN / REJECT的独立语义与终态 | PASSED |
| ALL / ANY / RATIO / VETO会签及多实例恰一次结算 | PASSED |
| 加签、补签、转办、委托、授权代理、撤回、沟通与废弃 | PASSED |
| 时限、提醒、催办、升级、重启竞争、通知解耦与恰一次语义 | PASSED |
| 审批节点/服务节点函数注册、冻结、异常、越权与审计边界 | PASSED |
| 意见表单初始化、禁用类型校验、五类历史回显、快照与主表单零反写 | PASSED |
| 页面、深链、服务端权限、跨租户/跨用户负向与零副作用 | PASSED |
| 最终候选、受影响门禁、manifest、terminal payload、证据卫生与清理 | PASSED |

I3正式阶段方向§7的十八项验收边界均已有真实行为、集成运行或受影响门禁支持，未发现剩余授权内原子。

## 5. 功能级裁决

P60 I3「人工审批与自研流程设计器」功能级验收 **PASSED**。

- P60继续为`IN_PROGRESS`；正式完成功能数仍为44，既有90条清单仍为✅46/🟦22/⬜22。
- P60、P4、P34、P35、P47及其他开放P编号本阶段不核销。
- I3只进入阶段三终态同步，本次验收不写成`COMPLETED（规划已确认）`。
- I3主方向归档至`product/v0.1.0-oa-completion/passed/direction-stage-i3-manual-approval-first-party-process-designer.md`。
- 当前唯一执行入口切换为`product/v0.1.0-oa-completion/ready/direction-stage-i3-terminal-sync.md`。
- 不开始I4，不创建标签或Release。

## 6. 唯一下一动作

Executor只执行I3阶段三终态同步方向：机械同步唯一终态值，按Workspace、Smart-WorkFlow-Server、Smart-WorkFlow-Web三个独立仓库各自当前分支处理I3归属提交和推送，回读远端SHA，并提交`terminal-sync-stage-i3-v0.1.0-oa-completion-01.md`。Planner复核前，合法阶段状态仅为`COMPLETED（待规划确认，2026-09-12） / TERMINAL_SYNC_SUBMITTED`。

