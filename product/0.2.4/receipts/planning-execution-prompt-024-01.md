# 0.2.4 补充执行提示 01

2026-11-06｜Planner→Executor。主方向：`product/0.2.4/ready/direction-024-readme-examples-2-3.md`，不变。依据：`planning-review-024-01.md`，原始输入为 `execution-024-02.md`。本提示是当前唯一执行入口。整版七阶段 1/1/5，②实施仍在进行；功能验收前不合并、不发布，也不写 PASSED/COMPLETED。

## 锁定项（禁止重验）

S2-01、S2-02、S2-05、S3-02、X-03 已通过；S2-04 的 P1/P0 两个正常分支、S3-03 的 SLOW/RAPID/>85 三个正常分支也已通过。证据见 execution-024-02 §3。只有本轮代码改动触及这些路径时，才对受影响断言做回归，并写明失效依据。

## 剩余动作

| ID | 允许对象与动作 | 完成条件 |
|---|---|---|
| S2-03 | 让联网搜索受控对端返回失败或不可用，在 `rule-gate-flow` 或其研判图上跑一次 | 轨迹里显式记录搜索失败；结果走 S2-04 失败升级路径，不能落到 SPECIAL_EVENT/P1 |
| S2-04 失败支 | 补齐 IoT 失败升级动作（或研判图失败分支）的通用配置能力：升级时带级别并通知负责人 | LLM 不可用时产生级别为 P0 的工单，并给负责人发站内信和邮件，两个渠道分开记录；同一次失败只升级一次 |
| S3-03 失败支 | 复用 S2-04 的同一能力，在 MES 80—85 研判规则上配置 | 81—84℃ 且 LLM 不可用时，产生“异常”级工单和双渠道告警；>85 仍由确定性规则处理，Agent 执行数为 0 |
| S3-01 | 先核实现在由什么驱动判定阈值、窗口和斜率；如果配置表单的值没有被消费，就补上通用取数，或明确把 IoT 规则页作为阈值的唯一配置面，并让窗口/斜率参数能在页面维护、实际生效 | 业务角色在页面改一个参数（例如告警阈值 80→82，或窗口/斜率）后，同一条输入序列的判定随之变化，前后两次执行 ID 对照；同租户里没有配置权限的用户修改被拒（页面或接口均可） |
| S3-04 | 只补页面回查证据，确有展示缺陷时才修 | 有 headed 截图能看到：成功研判执行详情中的样本或规则命中及工具动作结果（工单号、通知结果）；失败升级链和 >85 确定性链可以经 IoT 触发记录页查到对应执行或流程实例 |
| X-01 | 新建或使用非 admin 的业务角色账号（按 0.1.9 示例一的做法授权），在 headed 浏览器中完成：S3 参数维护、知识样本维护、IoT 规则的 Agent 联动配置并发布、工单处理；然后实际触发并跑通 | 截图标明 URL、身份（业务角色）和视口；该身份配置的对象实际触发至少一次 S2 判定和一次 S3 判定。图、流程、表单这类建模配置可以保留管理员已建的版本，只需在回执中说明归属 |
| X-02 | ① 按工程宪法跑 Server 受影响模块的门禁（iot、bpm-process、notify、agent），全量失败和偶发失败族单独列出；② 示例一在候选上用它自己的对象回归 IoT→流程→通知链，可以通过 0.2.2 导入导出把示例一应用导入隔离库；③ 核实现有部署和 UAT 配置中的 `sw.notify.channels.*` 键位在前缀修正后是否仍然生效，不生效就同步修正 | 三项都有原始输出位置；示例一链路实际跑通，并给出实例 ID |

## 真实链路补跑（Owner 2026-11-06 提供）

| ID | 对象与动作 | 完成条件 |
|---|---|---|
| REAL-01 | 联网搜索：使用库中已存的 OpenRouter 或 Command Code 配置作为真实搜索来源（二选一即可，用可用的那个），在示例二研判图上替换受控搜索对端后跑一次 | 轨迹中有真实查询词和结果摘要，层级标为 REAL_PROVIDER |
| REAL-02 | 大模型：使用库中已存的 OpenRouter 配置跑一次示例二和一次示例三的研判 | 真实模型输出判定并按分支执行动作；判定和样本不符时如实记录，不改写成通过 |
| REAL-03 | 邮件：Owner 已提供 163 邮箱的 SMTP 账号和授权码，由 Owner 直接交给执行会话。只放进本机不入库的运行配置（`.runtime-lc024/` 或环境变量），用它发一次 P0 告警 | 收件箱实际收到邮件，EMAIL 渠道记录 SUCCESS；回执只写“真实 SMTP（163）”，不写账号或授权码 |

秘密约束：OpenRouter 等大模型供应商的 Key、SMTP 授权码不得进入任何提交、回执、日志摘录或截图；提交前检查暂存区。Server 历史中 `e2fe50f7` 带入的凭据类文件均为本地产物，Owner 决定不改写历史。

本轮不做：短信电话、改写 Git 历史、新建工单子系统、触碰 f1v4b 和用户的 8080/5173。能力扩展必须做成通用配置，不写示例专用分支。

回执追加 `execution-024-03.md`，按 ID 引用原文位置；证据层级如实标注。有可执行项就继续做完；遇到真实阻塞，按终态契约提供工具结果。

```planner-convergence
{
  "schema": "agent-coding-engine.planner-handoff.v1",
  "feature": "0.2.4",
  "revision": 1,
  "previous_revision": 0,
  "decision": "CONTINUE",
  "source_receipt": "product/0.2.4/receipts/execution-024-02.md",
  "items": [
    {"origin_id":"S2-01","subject":"大门事件触发与互查","criterion":"S2-01","status":"RESOLVED","failed_rounds":0,"evidence":["execution-024-02.md §3 示例二"],"scope":{"targets":["rule-gate-flow触发"],"allowed_actions":["仅受影响回归"],"forbidden_actions":["重验已过项"],"constraints":{}},"acceptance":["已锁定"]},
    {"origin_id":"S2-02","subject":"内部检索轨迹","criterion":"S2-02","status":"RESOLVED","failed_rounds":0,"evidence":["execution-024-02.md §3 示例二"],"scope":{"targets":["流程查询与KB检索"],"allowed_actions":["仅受影响回归"],"forbidden_actions":["重验已过项"],"constraints":{}},"acceptance":["已锁定"]},
    {"origin_id":"S2-05","subject":"工单与双渠道告警","criterion":"S2-05","status":"RESOLVED","failed_rounds":0,"evidence":["execution-024-02.md §3","assets/03-05"],"scope":{"targets":["P0工单与通知"],"allowed_actions":["仅受影响回归"],"forbidden_actions":["重验已过项"],"constraints":{}},"acceptance":["已锁定"]},
    {"origin_id":"S3-02","subject":"温度遥测持久化","criterion":"S3-02","status":"RESOLVED","failed_rounds":0,"evidence":["execution-024-02.md §3 示例三"],"scope":{"targets":["mes-line1遥测"],"allowed_actions":["仅受影响回归"],"forbidden_actions":["重验已过项"],"constraints":{}},"acceptance":["已锁定"]},
    {"origin_id":"X-03","subject":"跨租户负向","criterion":"X-03","status":"RESOLVED","failed_rounds":0,"evidence":["execution-024-02.md §3 共同项"],"scope":{"targets":["租户9001对租户0"],"allowed_actions":["仅受影响回归"],"forbidden_actions":["重验已过项"],"constraints":{}},"acceptance":["已锁定"]},
    {"origin_id":"S2-03","subject":"联网搜索失败显式记录","criterion":"S2-03","status":"REWORK","failed_rounds":1,"evidence":["execution-024-02.md §3 联网搜索行"],"diagnosis":{"location":"示例二研判图联网搜索节点","observed":"仅有命中/无记录两种运行，无搜索失败运行","expected":"搜索失败显式记录且不落SPECIAL_EVENT","cause":"未覆盖该路径","next_action":"受控对端置失败跑一次并取轨迹"},"scope":{"targets":["联网搜索受控对端","示例二研判图"],"allowed_actions":["切换对端失败场景","必要时修正失败处理"],"forbidden_actions":["改已过P0/P1分支判定","读取秘密"],"constraints":{"层级":"CONTROLED_PEER"}},"acceptance":["轨迹显式失败且走失败升级"]},
    {"origin_id":"S2-04-fail","subject":"研判失败按P0升级","criterion":"S2-04 失败即升级","status":"REWORK","failed_rounds":1,"evidence":["execution-024-02.md §3 失败即升级行"],"diagnosis":{"location":"IoT失败升级动作 iot-esc-*","observed":"仅发起升级工单，无P0级别与负责人告警","expected":"P0工单+站内信+邮件分渠道记录","cause":"升级动作只发起流程，未带级别与通知","next_action":"补通用升级级别与通知配置并实测一次"},"scope":{"targets":["IoT失败升级动作","示例二规则"],"allowed_actions":["补通用配置能力","聚焦测试","实测"],"forbidden_actions":["示例专用硬编码","改正常分支"],"constraints":{"级别":"P0","渠道":"IN_APP+EMAIL"}},"acceptance":["P0工单与双渠道告警各一条记录，单次失败只升级一次"]},
    {"origin_id":"S3-03-fail","subject":"80-85且LLM不可用按异常处理","criterion":"S3-03 失败即升级","status":"REWORK","failed_rounds":1,"evidence":["execution-024-02.md §3 LLM不可用行"],"diagnosis":{"location":"rule-mes-judge 失败升级","observed":"执行2118564287306842114仅发异常升级工单，无告警","expected":"异常工单+双渠道告警","cause":"同S2-04-fail","next_action":"复用同一能力配置并实测一次"},"scope":{"targets":["rule-mes-judge"],"allowed_actions":["配置复用S2-04能力","实测"],"forbidden_actions":["改>85确定性规则","示例专用硬编码"],"constraints":{"温度":"81-84℃",">85 Agent执行数":"0"}},"acceptance":["异常工单与双渠道告警记录"]},
    {"origin_id":"S3-01","subject":"业务参数页面配置生效与权限","criterion":"S3-01","status":"REWORK","failed_rounds":1,"evidence":["execution-024-02.md §3 业务配置行"],"diagnosis":{"location":"mes_judge_config 表单与 rule-mes-judge","observed":"表单值未证明被判定消费；权限仅跨租户证据","expected":"页面改参后判定随之变化；同租户无权用户被拒","cause":"阈值落在IoT规则，表单取数链未证实","next_action":"核实驱动源，必要时补通用取数，做前后对照与同租户负向"},"scope":{"targets":["mes_judge_config","rule-mes-judge","研判图输入映射"],"allowed_actions":["核实驱动源","补通用取数","前后对照实测","同租户负向"],"forbidden_actions":["示例专用硬编码","改代码后才能调参"],"constraints":{"对照":"同一输入序列两次执行"}},"acceptance":["改参前后判定差异与执行ID对照","无权修改被拒"]},
    {"origin_id":"S3-04","subject":"每类判定页面可追溯","criterion":"S3-04","status":"REWORK","failed_rounds":1,"evidence":["assets/02-agent-execution-trace.png","execution-024-02.md §8"],"diagnosis":{"location":"执行详情页与IoT触发记录页","observed":"仅见输入与结论；样本/动作及失败与>85链无页面证据","expected":"三类链页面可查输入、规则/样本、理由、动作","cause":"截图覆盖不足","next_action":"取headed截图，确有展示缺陷再修"},"scope":{"targets":["执行详情页","IoT触发记录页"],"allowed_actions":["headed截图","修展示缺陷"],"forbidden_actions":["新增无关页面"],"constraints":{"headless":"false"}},"acceptance":["三类链页面截图各至少一张"]},
    {"origin_id":"X-01","subject":"业务角色页面搭建运行","criterion":"X-01","status":"REWORK","failed_rounds":1,"evidence":["execution-024-02.md §3 共同项","assets/01"],"diagnosis":{"location":"headed验收身份与配置来源","observed":"admin身份，页面仅建草稿规则，主体配置经API","expected":"业务角色页面完成业务可配置部分并实跑","cause":"身份与操作面不符","next_action":"业务角色headed完成参数/样本/规则联动发布/工单处理并触发S2、S3各一次"},"scope":{"targets":["业务角色账号","S3参数","知识样本","IoT规则联动","工单处理"],"allowed_actions":["授权业务角色","headed配置与触发"],"forbidden_actions":["admin冒充业务角色","触碰f1v4b"],"constraints":{"headless":"false","触发":"S2一次+S3一次"}},"acceptance":["业务角色配置对象实际触发判定并有截图"]},
    {"origin_id":"X-02","subject":"门禁、示例一回归与配置兼容","criterion":"X-02","status":"REWORK","failed_rounds":1,"evidence":["execution-024-02.md §5-6"],"diagnosis":{"location":"Server门禁与示例一链路","observed":"仅聚焦测试；示例一未用自身对象回归；notify前缀变更未核部署配置","expected":"受影响门禁通过，示例一实跑，配置键位兼容","cause":"验证未执行","next_action":"跑受影响模块门禁、导入示例一回归、核部署配置键位"},"scope":{"targets":["iot/bpm-process/notify/agent门禁","示例一应用","部署与UAT配置键位"],"allowed_actions":["运行门禁","隔离库导入示例一","修正配置键位"],"forbidden_actions":["触碰f1v4b","部署UAT","以单类复验改写全量失败"],"constraints":{"环境":"隔离库smart_workflow_024_01"}},"acceptance":["门禁原始输出","示例一实例ID","键位核实结论"]},
    {"origin_id":"REAL-01","subject":"真实联网搜索","criterion":"S2-03 真实链路（方向§2外部依赖）","status":"OPEN","failed_rounds":0,"evidence":["execution-024-02.md §7"],"scope":{"targets":["示例二联网搜索工具"],"allowed_actions":["改用库中已存OpenRouter或Command Code配置","真实调用一次"],"forbidden_actions":["提交或回执中出现Key","读取外传秘密"],"constraints":{"层级":"REAL_PROVIDER"}},"acceptance":["真实查询词与结果摘要入轨迹"]},
    {"origin_id":"REAL-02","subject":"真实大模型研判","criterion":"S2-04/S3-03 真实链路","status":"OPEN","failed_rounds":0,"evidence":["execution-024-02.md §7"],"scope":{"targets":["示例二研判图","示例三研判图"],"allowed_actions":["使用库中已存OpenRouter配置","各跑一次"],"forbidden_actions":["提交或回执中出现Key","把不符结果写成通过"],"constraints":{"层级":"REAL_PROVIDER"}},"acceptance":["真实模型判定及动作结果如实记录"]},
    {"origin_id":"REAL-03","subject":"真实SMTP邮件","criterion":"S2-05 真实链路","status":"OPEN","failed_rounds":0,"evidence":["execution-024-02.md §7"],"scope":{"targets":["EMAIL渠道"],"allowed_actions":["授权码放本机不入库运行配置","真实发送一次P0告警"],"forbidden_actions":["授权码进入提交/回执/日志/截图"],"constraints":{"供应商":"163 SMTP"}},"acceptance":["收件箱实收且EMAIL记录SUCCESS"]}
  ]
}
```
