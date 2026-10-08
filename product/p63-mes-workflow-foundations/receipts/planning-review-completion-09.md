# P63功能复核09：核销19/20，整体VERIFYING

2026-10-08；Planner。独立读取回执09、提示08、两包及全部所指文本，查看两张实际PNG，核对后端原日志的保存/ACCESS行与Git视觉登记。不读knowledge/业务代码、不运行工程验证。

## 1. 裁决与入口

**新增核销G01a，累计19/20；唯一剩余G10b。A01—A09通过（9/10），A10未整项通过。** P63保持VERIFYING，不进入阶段三。提示09替代08为唯一执行入口，下一回执10；功能46、清单46/22/22、ADV64保持。P62批准范围完成、性能Owner延期未验证及资源新策略关闭保持。

G10b的knowledge完整回读已补齐，本轮剩余不再是上一版截断问题；是Web产品由35dd944变为2b0c660后，最终候选门禁没有可读工具原输出。旧门禁只能证明旧快照，不能把当前文字声明当最终候选测试结果。这是既有A10及提示08“相关实现变化核受影响门禁”的适用项，不扩大业务范围。

## 2. G01a核销依据

原件根`evidence/acceptance-09/`；admin/tenant0，定义2108058719690006529、v1 DRAFT、node_1 DYNAMIC_PARALLEL，新库sw_p63_accept9；旧对象已销毁，替换关系已登记。

- `browser/g01a-dynamic-direct-user-configured.png`实际显示固定值、人员对象、已选2人；`raw/g01a-designer-ui-chain-original.md`的保存后原值为FIXED/[1,90002]/USER。图片顶部仍“未保存的更改/保存中”，**不把该帧称保存完成**；后续实际日志341—345记录13:06:45/54同定义草稿已保存、PUT graph200、userId1，结合保存后读回可核销，不要求重截。
- `browser/g01a-dynamic-direct-dept-configured.png`实际显示固定值、部门对象、已选2部门、草稿已保存14:06；原值FIXED/[1,90001]/DEPT，日志365—369同定义14:06:15/22保存及PUT200。用户/部门ID真实存在，表单API准备仅为绑定前提，未冒充直接选择产物。
- `raw/g01a-validate-string-vs-array-original.md`实际响应显示逗号串2310拒绝、数组两种来源data[]；后端日志307/350/355/374/380确认校验请求与时点。HTTP200本身不证明校验通过，以实际响应体组合；数组修复与两种UI存储值一致。
- 新修复范围为真实对象选择及FIXED稳定ID数组，旧语义文本入口保留属回执实施说明；最终受影响验证仍由G10b核，不能称门禁已通过。

接受直接人员/部门选择→实际UI保存→稳定ID读回的残余链；APPROVAL/CONSENSUS与原24格/八字段/实际运行沿已锁定事实，草稿配置不冒称本轮再次发布/发起/设备动作。G01a与A01通过，不再重跑UI或全链。

## 3. G10b已补齐的子断言

- `raw/g10b-knowledge-full-readback-original.md`给出49584dc时点第3行全文及完整字段：VERIFYING、18/20、剩2、A02—A09/8项、审查08/提示08/回执09、Web2b0c660/Server19d1da2、唯一下一动作Planner复核09、功能46/清单46/22/22/ADV64。全文值可直接核对，已解决cut150问题，不因抽取区间或文件体量的文字小差异重开业务。REG解释与审查08§3一致。
- `raw/g10b-git-lsremote-original.md`最终段Server19d1da2→origin/develop、Web2b0c660→origin/develop，与本地值相同；正文仍称Server develop-sw是首稿分支名转录残留，本复核按纠正后的原输出定为develop，不要求再查远端或改分支。
- 两张新PNG已Git跟踪；`raw/g10b-cleanup-readback-original.md`当前自身PID/端口/进程/标签/隔离库/tmp有结果。回执主动指出上一轮空库残留反证：撤销审查08对“当时所有sw_p63库均不存在”的外推，以本轮dropaccept8/9 exit0与库计数0为当前收尾依据；原因无法恢复不追猜，不伪造旧drop证明，不重新打开其他业务原子。

## 4. 唯一剩余G10b / A10

分类：**缺证据＋旧门禁快照不适用于最新Web修改**。最终Web候选`2b0c660fb1b1d4f612ada472c38e964a481937a5`确有ProcessDesigner、node-capabilities构建及spec变更；Server未改沿19d1da2。

`raw/g01a-designer-ui-chain-original.md`§0只有一句“typecheck exit0/lint76warning/vitest1364+3/build exit0、定向16passed”与自动导入声明恢复说明；没有具体命令/cwd/时点、工具原stdout/stderr、测试汇总或命令exit采集。acceptance-09目录仅后端运行日志，全文和回执的重复声明不成为Web门禁原结果；较早acceptance-06/07材料早于2b0c660，不能补此适用性。当前未据此判定工程测试实际失败，也不猜新增用例后总数该是多少。

只补**当前Web受影响门禁真实结果**：先恢复已运行工具原输出，原始结果不可恢复才在当前候选按工程门禁做最小充分有界验证，并保存命令/cwd/候选/时点/实际汇总/退出码。typecheck合法静默允许零正文，以实际调用及exit采集证明；lint/test/build保留工具汇总，新FIXED数组化spec有实际结果。自动生成声明还原后的最终成功必须可辨，旧失败如实保留。不得用手写“exit0”或旧1364摘要当新结果；有据则直接采用实际数，不要求为了匹配旧数改测试。

本轮不再要求截图、DB/流程/设备动作、knowledge截断复验、Server/Phase4/全仓门禁或自然窗口验证；knowledge机械更新本审查当前口径并定点回读即可。Phase4替代及合同裁决继续锁定，原全量失败不拼成全绿。只允许修新门禁确证的本轮接缝问题并验证其影响。

## 5. 锁定与同步

已核销19：G01a/G01b/G02a/G03a/G03b/G04a/G04b/G05a/G05b/G06a/G06b/G06c/G07a/G07b/G08a/G08b/G09a/G10a/G10c。审查03—09子断言锁定，G10b仅§4。

提示09删除G01a及knowledge/Git/视觉/收尾已证事实，改用原运行流恢复或当前有限门禁替代，而非继续同一字段回读。Planner同步8当前入口；Executor仅机械更新knowledge为VERIFYING、19/20、剩1、A01—A09/9项、审查09/提示09/下一回执10及实际最终Web门禁原值；不晋级正式功能/清单/基线，不进入阶段三。禁止新增产物hash、空转等待或不可观测后台任务。
