# P63 完成回执05：审查04 十三项——原件移交、合同修正与真实差异补验（自验通过，待规划复核）

2026-10-07；Executor。唯一执行入口=planning-execution-prompt-p63-04.md；裁决依据=planning-review-completion-04.md。P63 保持 **VERIFYING**（7/20 核销、13 项本轮逐项处置）；功能46、清单46/22/22、ADV64 不变。证据根=`receipts/evidence/acceptance-05/`（每 ID 一包 + `raw/` 原始流 + `browser/` 视觉制品），原始文件均随包在 product 内可读，不再依赖 /tmp 指针。

## §1 13 项逐项处置（包=evidence/acceptance-05/<ID>.md）

| 原子 | 处置类型 | 核心原件与结果 |
|---|---|---|
| G01a | 层级错配补证 | 设计器 UI 实配三类节点（审批=指定人员入口/会签=表单字段 field_approvers/动态并行=表单字段 field_dept_list）+草稿保存+GET 回读一致；不重跑 24 格 |
| G03a | 对象错配修正+机制现状 | **代码修正**：设备解析两口径增发布态+流程接入执行授权重核。新负向 PG 原件 15/0：N3 软删**实际被预约目标** 91513→FAILED 可查零外发；N4 同租户 access=0→批准 failClosed 零意图；N5 到点前撤销授权→FAILED 零外发。初跑泄漏原件缺失如实登记（不据缺日志撤销风险）。commandKey 功能白名单：权威来源 sw_iot_thing_model 存在但下发链未接入——**报告影响待裁决**（不自行扩大） |
| G04a | 原件移交+勘误 | raw/surefire-engine-P63DynamicRoundBindingTest.txt（2/0，两例断言实际输出）；勘误：动作A round 原文=-1（NULL）非 1；普通退回链仅证旧 task 不作用新 task，动态轮次由引擎两例承担 |
| G04b | 原件移交 | raw/surefire 5 件（4+3+6+1+1=15/0），含 emptySetStrategies/阈值时机断言/真实并发双返回（一胜一唯一键拒绝） |
| G05b | 原件移交+UI 错配修复+接缝修复 | **代码修正**：后端 `GET /workflow/commands/tasks/{taskId}/latest`（本人最新命令）+前端任务加载回查→**持久化内联 EXPIRED 警示**（原因+重试提示）。活体链F（无 fixture）：UI 真实受理 2107820621296390145→停机窗口→真实对账 EXPIRED→重载可见警示（browser/g05b-expired-persistent-alert.png）→UI 重试→:R1=2107821401084641281 COMPLETED→实例 APPROVED（browser/g05b-recovered-final.png）。原行终态/原因/finished_at 永久保留。PG 契约 2/0 原件+链映射（f0168904 旧库销毁；cd007d86=链F 旧库；本轮 28293fbb） |
| G06a | **合同偏差修正** | createIntent 批准时 now>=due 一律 EXPIRED（主方向§4.2 原义）；测试期待同步修正。原件：approve-already-due(window=3600s)→EXPIRED 零外发；frozen-future→到点窗内合法 catch-up 恰一次+重放不增；认领先/对账先两顺序经真实入口；歧义/不存在本地时刻拒绝零意图。Boundary 8/0+11/0 |
| G06b | 原件移交 | raw/g06a-g06b-g07b-contract-fix-rerun.log（8/0）+g03a-negatives（11/0）：两顺序+3 轮并发原行（本轮 round=1 认领胜 DISPATCHED+commands=1、round2/3 取消胜），恰一方获胜 |
| G07b | 原件移交 | raw/g07b-unknown-rerun.log（1/0）+raw/peer-noreceipt-received.jsonl（对端原文）：冻结未来→到点真实下发→对端 200 受理无回执→SENT→装置置 expiry→真实补偿入口 UNKNOWN→不重发→人工核实四拒一收（审计含依据）；expiry_time=装置已声明 |
| G08a | 原件移交+导航补证 | raw/g08-access-and-peer-originals.md（22 行真实 ACCESS eventRef/clientRequestId/web-*+对端原文）+browser 4 图：桌面链 配置→发起→审批→预约卡→设备命令对话框（**成功**+结果 JSON+关联实例列）；两链明确分开（61b0595a/61b0595b/28293fbb）；登记 IoT 运行记录页命令 tab 查 MQTT 表的归属现状 |
| G08b | 同对象补证 | 全部截图同任务 61b0f5b5（06:09/06:22 混链正面回答：本轮逐图同对象）；多值触达/办理→已通过/历史意见/预约→设备命令结果点击路径（375×812 设备命令对话框，横向滚动可达结果列）；本链预约 EXPIRED=迟到批准合同正确行为，登记非缺失 |
| G09a | 对象勘误+采集更正+条件路径登记 | 勘误本链任务=3884da74/3939ab8b（非 459bf936）；v1_len=0/v=0 系列名错误更正（graph_version 口径），v1 逐字节等值（直接等值，**停止使用 hash**）；旧条件路径有限补验未收敛（触及 P58 bpmBranchConditionEvaluator 语义）——尝试日志 raw/g09a-legacy-condition-test-attempt.java.txt+run.log 如实登记，测试已删除不提交可疑断言，留裁决 |
| G10a | 原件移交+I1 如实 | 迁移行 0.1.0—0.1.6 全 success（raw/g10a-migration-rows.txt）+P63 基点差异（P63 引入=V0.1.5/V0.1.6/R__p63，git log 原文）；立即动作入口 1/0 原件（XML+txt）；**I1 零命令不填正向**：入口命令+MQTT 发布尝试失败可查（本地无 broker，环境限制如实），真实立即外发待裁决（需 broker 或通道合同变更）；J4/24 字段详情已证引用 |
| G10b | 门禁原件+收尾+纠偏 | 最终候选 Server `92238ad`/Web `a09d4d7`（远端回读一致）；Server process 266/0、engine 76/0、iot 63/0、bootstrap **91/0/27**（gate-*.log 全文在 raw/）；Web 四门 exit 0（1364/3）且 **a09d4d7 提交后复验绑定**（web-*-postcommit.log）；G05a 本轮 4 例原输出（IntentTx XML/txt）；首轮 91 例 1 失败（并发读时序）原件保留于前轮日志+修正说明；knowledge 已按授权更新；无 sleep 采集（本轮等待=有界场景等待（测试内声明）+不可达端点 curl 重试延时），未计算产物 hash |

## §2 代码改动清单
- Server `92238ad`（5 文件 +196/−19）：IotCommandReservationFacadeImpl（G06a 合同）、IotDeviceServiceImpl（G03a 授权重核）、BpmCommandController（latest 端点）、Boundary/Unknown 测试修正。
- Web `a09d4d7`（2 文件 +37）：latestTaskCommand API + TaskDetail 持久化过期警示。

## §3 边界与登记（如实）
1. G09a 旧条件路径：有限补验未收敛（P58 评估器语义），测试已删除，登记留裁决。
2. G03a 功能白名单：机制缺失报告待裁决（sw_iot_thing_model 未接入下发链）。
3. G10a 立即外发成功：本地无 MQTT broker 未证得，入口命令+审计为既有原件，待裁决。
4. acceptance-04 初跑泄漏原件不可恢复：已登记，不据缺日志撤销风险（修复+新负向复核）。
5. 本轮等待原语：测试内声明式有界等待 + curl 不可达端点重试延时；无 sleep/延迟轮询脚本、无产物 hash。

## §4 提交前自检（提示04§5 对照）
原件：13 包均指向 raw/ 内可读全文（非摘要/非 /tmp 指针）；合同：批准已到点零外发（新契约+测试）、未来预约窗内合法原义、原 EXPIRED 永久保留、真实授权失效拒绝；对象：N3 删实际目标、round/版本勘误、UI 链逐图同对象；覆盖：13 项各有正反断言，已证部分只引用；候选：门禁绑定 92238ad/a09d4d7、首败保留与复跑范围已解释；收尾：见 §6；状态：P63 VERIFYING、7/20+13 为 Planner 口径。**自验通过，待规划复核。**

## §5 提交与推送回填
- Server `92238ad` → origin/develop（88f82a8..92238ad，回读 92238ad714c…一致）。
- Web `a09d4d7` → origin/develop（b73ebc4..a09d4d7，回读 a09d4d7cba…一致；提交后四门复验绑定）。
- workspace：回执05+acceptance-05+knowledge → 提交后回读（§6）。

## §6 knowledge 同步
`knowledge/current-status.md` 已更新：P63=VERIFYING；复核04/提示04；7/20 核销+13 项本轮处置；唯一下一动作=「Planner 复核 receipts/completion-p63-mes-workflow-foundations-05.md 与 evidence/acceptance-05/」。
