# 0.2.4 补充执行提示 02

2026-11-06｜Planner→Executor。主方向不变。依据：`planning-review-024-02.md`，原始输入为 `execution-024-03.md`。本提示替代提示 01，成为当前唯一执行入口；提示 01 只作追溯。整版七阶段 1/1/5，功能验收前不合并、不发布。

## 锁定项（禁止重验）

S2-01—05、S3-01—04、X-01、X-03、X-02 的①③、REAL-02、REAL-03 均已通过，证据见 execution-024-02/03。只有本轮改动触及这些路径时，才做受影响回归，并写明失效依据。

## 剩余动作

| ID | 允许对象与动作 | 完成条件 |
|---|---|---|
| X-02② | 只在隔离库 `smart_workflow_024_01` 中，参照 `product/readme-first-example-acceptance/passed/direction-readme-first-example-acceptance.md` 重建示例一受影响的最小链路：灾备演练表单 → 一级审批 → 抄送 → 预约设备命令下发（MQTT，发到 mosquitto-024）。不要求复原会签、动态参与人等未受影响的环节，也不再找原对象 | 在候选上跑一个实例：表单提交并审批通过，抄送通知记录 SUCCESS，预约命令状态为 SENT，并取到 broker 侧收到该命令主题的记录；给出实例 ID 和命令 ID |
| REAL-01 | 只用 OpenRouter 的联网搜索能力（`:online` 模型后缀或 web 插件，按其接口选）。隔离库没有 OpenRouter 配置时，可以从 `smart_workflow_f1v4b` 对该供应商的配置行做**一次只读 SELECT**，取出密文后写入隔离库；不解密输出，不写入 f1v4b，不断开它的连接。如果密钥不兼容、无法解密，就停下并请 Owner 在隔离环境页面录入，其他项继续 | 示例二执行轨迹中有真实查询词和带来源的结果摘要，层级为 REAL_PROVIDER；Key 不进入任何提交、回执、日志摘录或截图 |
| N-01 | 核实 `024-03-s3-04-success-tool-calls.png` 中通知正文“机台=未知，时间 undefined”的来源 | 如果来自受控对端脚本：说明来源，并贴出 REAL-02 那次真实模型的通知正文作对照。如果来自平台模板或参数映射：修复，加聚焦测试，重跑一次告警，正文不出现 undefined |

本轮不做：短信电话、改写 Git 历史、部署 UAT、权限粒度调整（已登记待办）、触碰 f1v4b（REAL-01 的单行只读 SELECT 除外）和用户的 8080/5173。

回执追加 `execution-024-04.md`。有可执行项就继续做完；遇到真实阻塞，按终态契约提供工具结果。

```planner-convergence
{
  "schema": "agent-coding-engine.planner-handoff.v1",
  "feature": "0.2.4",
  "revision": 2,
  "previous_revision": 1,
  "decision": "CONTINUE",
  "source_receipt": "product/0.2.4/receipts/execution-024-03.md",
  "items": [
    {"origin_id":"S2-01","subject":"大门事件触发与互查","criterion":"S2-01","status":"RESOLVED","failed_rounds":0,"evidence":["execution-024-02.md §3 示例二"],"scope":{"targets":["rule-gate-flow触发"],"allowed_actions":["仅受影响回归"],"forbidden_actions":["重验已过项"],"constraints":{}},"acceptance":["已锁定"]},
    {"origin_id":"S2-02","subject":"内部检索轨迹","criterion":"S2-02","status":"RESOLVED","failed_rounds":0,"evidence":["execution-024-02.md §3 示例二"],"scope":{"targets":["流程查询与KB检索"],"allowed_actions":["仅受影响回归"],"forbidden_actions":["重验已过项"],"constraints":{}},"acceptance":["已锁定"]},
    {"origin_id":"S2-05","subject":"工单与双渠道告警","criterion":"S2-05","status":"RESOLVED","failed_rounds":0,"evidence":["execution-024-02.md §3","assets/03-05"],"scope":{"targets":["P0工单与通知"],"allowed_actions":["仅受影响回归"],"forbidden_actions":["重验已过项"],"constraints":{}},"acceptance":["已锁定"]},
    {"origin_id":"S3-02","subject":"温度遥测持久化","criterion":"S3-02","status":"RESOLVED","failed_rounds":0,"evidence":["execution-024-02.md §3 示例三"],"scope":{"targets":["mes-line1遥测"],"allowed_actions":["仅受影响回归"],"forbidden_actions":["重验已过项"],"constraints":{}},"acceptance":["已锁定"]},
    {"origin_id":"X-03","subject":"跨租户负向","criterion":"X-03","status":"RESOLVED","failed_rounds":0,"evidence":["execution-024-02.md §3 共同项"],"scope":{"targets":["租户9001对租户0"],"allowed_actions":["仅受影响回归"],"forbidden_actions":["重验已过项"],"constraints":{}},"acceptance":["已锁定"]},
    {"origin_id":"S2-03","subject":"联网搜索失败显式记录","criterion":"S2-03","status":"RESOLVED","failed_rounds":1,"evidence":["execution-024-03.md §2 S2-03"],"scope":{"targets":["联网搜索受控对端","示例二研判图"],"allowed_actions":["切换对端失败场景","必要时修正失败处理"],"forbidden_actions":["改已过P0/P1分支判定","读取秘密"],"constraints":{"层级":"CONTROLED_PEER"}},"acceptance":["已锁定"]},
    {"origin_id":"S2-04-fail","subject":"研判失败按P0升级","criterion":"S2-04 失败即升级","status":"RESOLVED","failed_rounds":1,"evidence":["execution-024-03.md §2 S2-04"],"scope":{"targets":["IoT失败升级动作","示例二规则"],"allowed_actions":["补通用配置能力","聚焦测试","实测"],"forbidden_actions":["示例专用硬编码","改正常分支"],"constraints":{"级别":"P0","渠道":"IN_APP+EMAIL"}},"acceptance":["已锁定"]},
    {"origin_id":"S3-03-fail","subject":"80-85且LLM不可用按异常处理","criterion":"S3-03 失败即升级","status":"RESOLVED","failed_rounds":1,"evidence":["execution-024-03.md §2 S3-03"],"scope":{"targets":["rule-mes-judge"],"allowed_actions":["配置复用S2-04能力","实测"],"forbidden_actions":["改>85确定性规则","示例专用硬编码"],"constraints":{"温度":"81-84℃",">85 Agent执行数":"0"}},"acceptance":["已锁定"]},
    {"origin_id":"S3-01","subject":"业务参数页面配置生效与权限","criterion":"S3-01","status":"RESOLVED","failed_rounds":1,"evidence":["execution-024-03.md §2 S3-01","assets/024-03-s3-param-edit-biz.png"],"scope":{"targets":["mes_judge_config","rule-mes-judge","研判图输入映射"],"allowed_actions":["核实驱动源","补通用取数","前后对照实测","同租户负向"],"forbidden_actions":["示例专用硬编码","改代码后才能调参"],"constraints":{"对照":"同一输入序列两次执行"}},"acceptance":["已锁定"]},
    {"origin_id":"S3-04","subject":"每类判定页面可追溯","criterion":"S3-04","status":"RESOLVED","failed_rounds":1,"evidence":["execution-024-03.md §2 S3-04","assets/024-03-s3-04-*.png"],"scope":{"targets":["执行详情页","IoT触发记录页"],"allowed_actions":["headed截图","修展示缺陷"],"forbidden_actions":["新增无关页面"],"constraints":{"headless":"false"}},"acceptance":["已锁定"]},
    {"origin_id":"X-01","subject":"业务角色页面搭建运行","criterion":"X-01","status":"RESOLVED","failed_rounds":1,"evidence":["execution-024-03.md §2 X-01","assets/024-03-x01-*.png"],"scope":{"targets":["业务角色账号","S3参数","知识样本","IoT规则联动","工单处理"],"allowed_actions":["授权业务角色","headed配置与触发"],"forbidden_actions":["admin冒充业务角色","触碰f1v4b"],"constraints":{"headless":"false","触发":"S2一次+S3一次"}},"acceptance":["已锁定"]},
    {"origin_id":"X-02","subject":"门禁、示例一回归与配置兼容","criterion":"X-02","status":"REWORK","failed_rounds":2,"evidence":["execution-024-03.md §2 X-02"],"diagnosis":{"location":"示例一受影响链路","observed":"门禁与键位已过；示例一无导入包，sw_0110_run无IoT对象且迁移不兼容","expected":"示例一受影响路径在候选上实跑","cause":"上轮规划路线前提不存在","next_action":"隔离库按0.1.9方向重建最小受影响链并实跑一次"},"planner_self_audit":"上轮建议的导入包路线前提不存在，属规划口径问题；按0.1.9方向核定受影响路径仅为流程发起、抄送通知、预约MQTT命令下发，改为重建最小链，不要求原对象","scope":{"targets":["示例一应用"],"allowed_actions":["隔离库导入示例一"],"forbidden_actions":["触碰f1v4b","部署UAT","以单类复验改写全量失败"],"constraints":{"环境":"隔离库smart_workflow_024_01","来源":"按0.1.9已通过方向重建","范围":"流程发起+抄送通知+预约MQTT命令下发"}},"acceptance":["一个实例：审批通过、抄送SUCCESS、命令SENT且broker侧收到，给出实例与命令ID"]},
    {"origin_id":"REAL-01","subject":"真实联网搜索","criterion":"S2-03 真实链路（方向§2外部依赖）","status":"REWORK","failed_rounds":1,"evidence":["execution-024-03.md §3 REAL-01"],"diagnosis":{"location":"示例二联网搜索工具","observed":"隔离库仅Command Code，探测均无搜索能力","expected":"真实查询词与带来源结果入轨迹","cause":"隔离库克隆自lc023_01，不含Owner主库中的OpenRouter配置","next_action":"单行只读取f1v4b的OpenRouter密文配置入隔离库，用其联网搜索跑一次"},"scope":{"targets":["示例二联网搜索工具"],"allowed_actions":["改用库中已存OpenRouter配置","真实调用一次"],"forbidden_actions":["提交或回执中出现Key","读取外传秘密"],"constraints":{"层级":"REAL_PROVIDER","来源":"f1v4b单行只读SELECT密文，不解密输出、不写f1v4b、不断连","失败":"密钥不兼容时请Owner页面录入"}},"acceptance":["真实查询词与带来源结果摘要入轨迹"]},
    {"origin_id":"REAL-02","subject":"真实大模型研判","criterion":"S2-04/S3-03 真实链路","status":"RESOLVED","failed_rounds":0,"evidence":["execution-024-03.md §3 REAL-02"],"scope":{"targets":["示例二研判图","示例三研判图"],"allowed_actions":["使用库中已存OpenRouter配置","各跑一次"],"forbidden_actions":["提交或回执中出现Key","把不符结果写成通过"],"constraints":{"层级":"REAL_PROVIDER"}},"acceptance":["已锁定"]},
    {"origin_id":"REAL-03","subject":"真实SMTP邮件","criterion":"S2-05 真实链路","status":"RESOLVED","failed_rounds":0,"evidence":["execution-024-03.md §3 REAL-03"],"scope":{"targets":["EMAIL渠道"],"allowed_actions":["授权码放本机不入库运行配置","真实发送一次P0告警"],"forbidden_actions":["授权码进入提交/回执/日志/截图"],"constraints":{"供应商":"163 SMTP"}},"acceptance":["已锁定"]},
    {"origin_id":"N-01","subject":"告警正文占位未解析","criterion":"S2-05/S3-03 告警内容可读","status":"OPEN","failed_rounds":0,"evidence":["assets/024-03-s3-04-success-tool-calls.png"],"scope":{"targets":["通知工具正文生成"],"allowed_actions":["核实来源","平台来源时修复并聚焦测试"],"forbidden_actions":["改已锁定判定分支","示例专用硬编码"],"constraints":{"对照":"REAL-02真实模型正文"}},"acceptance":["来源结论；平台来源时重跑告警正文无undefined"]}
  ]
}
```
