# P59：CH-aPaaS 项目说明、仓库与 main 分支整理及自动发版

来源：Owner 2026-09-04。统一任务：功能级 PASSED（2026-09-04，审查07），**P59 已核销**；阶段三终态同步已提交，待 Planner 复核确认 COMPLETED。正式执行入口：`product/p59-ch-apaas-project-update/passed/direction-p59-ch-apaas-project-update.md`；终态同步方向：`product/p59-ch-apaas-project-update/ready/direction-p59-ch-apaas-project-update-terminal-sync.md`。

## 需求范围

1. 更新项目说明：项目已经不是一个 OA，而是一个 PaaS 项目，项目名称准备起名为 **CH-aPaaS**。
2. 按 Owner 提供的新地址核对并更新仓库相关引用和远端配置。
3. 处理上次提交工作区时，把代码相关改动提交到工作区 main 的问题。
4. 加 GitHub main 分支自动编译发版配置。
5. 记录下文三个示例流程。

## 仓库地址

以下为 Owner 已告知的远端改名结果；本地配置与远端分支状态由执行角色核对。

| 仓库 | 远端地址 |
|---|---|
| 后端 | `git@github.com:Chikaaho/Smart-WorkFlow-aPaaS-server.git` |
| 前端 | `git@github.com:Chikaaho/Smart-WorkFlow-aPaaS-Web.git` |
| 工作区 | `git@github.com:Chikaaho/Smart-WorkFlow-Agent-Workspace.git` |

## main 分支问题

Owner 反馈：上次提交工作区时，把代码相关改动提交到了 main，需要处理。

探索回执已返回，报告工作区 main=cece784、develop-sw=0712bb9（探索时点值）。main 独有的 Engine／治理提交不能直接认定为误提交；实际错误文件及归属仍须按正式方向核实后定向修复。远程发布、历史改写及破坏性操作遵循 `system.md` 的授权要求。

## 示例流程（Owner 原始记录）

### 3.1

某分公司科技部部长发起多部门灾备演练审批，经多个技术负责人审批后，通过动态并行分支给各部门分管领导审批，全部审批后到到总公司科技部会签审批，通过后抄送给几个相关领导，之后表单填写的信息进入队列，当时间到达表单上的预定时间，开始发送mqtt关闭各机房电源、触发火警告警

### 3.2

某校园的其中一个大门有一天突然出入校流量异常，先从流程和知识库搜索近期有没有相关活动或者校园活动，再联网搜索近期是否有公开活动或者特殊节日，如果符合特殊情况，仅作日志记录并发起P1工单，如果不符合任何正常情况，发起P0工单并给负责人发送告警，短信、电话提醒

### 3.3

某厂房mes流程告警阈值为机器温度80摄氏度，必须停机温度85摄氏度，常温75摄氏度。偶尔人工加料时会超过80摄氏度，业务人员可以自己配置agent知识信息输入样本，当短时间内超过80摄氏度时判读异常，发起工单并告警，当缓慢上升超过80摄氏度并小于85摄氏度时，判断符合正常操作行为仅作记录，超过85摄氏度时按照正常紧急告警流程处理

三个示例本轮只作记录。

## 当前下一动作

阶段三终态同步已按唯一值清单完成；唯一下一动作：**Planner 复核 `product/p59-ch-apaas-project-update/receipts/terminal-sync-01.md`，确认 P59 终态（COMPLETED）**。

第七轮规划验收PASSED（历史）：真实main→Actions→Release→产物链路已独立核验，evidence-06哈希6/6通过，主方向已归档passed。实际六分支发布时点（2026-09-04 已验收发布时点，不要求后续ref永久停在该SHA）：Workspace develop-sw `721f034e6f1cc1cd80993e358087201dab6626a2`、Workspace main `29f70338d0390810e932bdd040e82956743d343b`、Server develop `d62c8436bd4a20deea13b2700ab4998ce0052934`、Server main `6ab9ae50080b2ae884eefaa728ae021702661ece`、Web develop `f2647e151ab40c00efd5dbd7df753e97721bc916`、Web main `4c044c671318627599560320efd217a0a520b5aa`；累计26提交（原17＋增量9）；Server成功run33889195373、Web成功run33889880505，两仓tag为`build-`＋对应main完整SHA；后端规范仓库名以Owner本轮更正的aPaaS为准。P59已核销、非新增业务功能，业务功能数41及90条明细不变。
