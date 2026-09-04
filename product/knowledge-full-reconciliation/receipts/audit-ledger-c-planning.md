# 审计账本 C：memory / todo / search_task / search_fallback 规划与事实入口

> 隶属：knowledge-full-reconciliation A阶段全量审计（方向 `product/knowledge-full-reconciliation/ready/direction-knowledge-full-reconciliation.md` §2「规划与事实入口」）
> 角色：Executor（只读审计）；日期：2026-09-04（Planner 已更新 memory/handoff.md、memory/state.md、todo/requirement-pool.md 之后窗口）
> 基线：分支 `develop-sw`；HEAD `73f9315`（docs(p58)…第41个正式功能）；未提交变更：`memory/handoff.md`、`memory/state.md`、`todo/requirement-pool.md`（Modified）；未跟踪：`product/knowledge-full-reconciliation/`、`search_task/notification-personal-workflow-reconciliation-20260904.md`
> 原则：只记录差异与建议值，不裁决业务完成态；所有「建议」均待 Planner 裁决（方向 §5.A）

---

## 一、memory/ 文件与大小表（验收标准 §6.8）

| 文件 | 字节数 | <5KB | 当前性 |
|---|---|---|---|
| README.md | 538 | ✅ | 摘要指针（截至2026-09-04/P58 COMPLETED 第41个），无功能计数正文 |
| architecture.md | 466 | ✅ | 同步点2026-08-30，稳定架构事实，无过时计数 |
| constraints.md | 503 | ✅ | 同步点2026-08-25，治理硬约束，无过时计数 |
| decisions.md | 800 | ✅ | 同步点2026-08-25；第8行 v0.0.1-beta 发布候选表述见 §六.7 |
| features.md | 3612 | ✅ | 同步点2026-09-04；P58/P57/P56/P52/P45/P51/closure/form-data 条目与 knowledge 阶段终态一致（41/40/39/38/37；✅34/🟦23/⬜33） |
| handoff.md | 2921 | ✅ | Planner 已更新（16:15），下一动作=知识库全量审计，与方向 §8 一致 |
| issues.md | 1743 | ✅ | I14/P21 部分关闭、P2 开放、GOV-AUDIT-13 说明，与池/known-issues 语义一致 |
| state.md | 2627 | ✅ | Planner 已更新（16:15），下一动作=知识库全量审计，与方向 §8 一致 |
| **总量** | **13210** | **<20KB ✅** | 单项最大 3612 < 5120 |

达成 §6.8：每文件<5KB、总量<20KB。摘要均为指针式（引用 knowledge/current-status.md、功能清单.md、product receipts），未复制完整账本。

## 二、memory 过时项与 memory↔knowledge 冲突点

1. **knowledge/current-status.md 滞后（与 memory 冲突，B阶段同步对象）**
   - 原文（L42）：「当前唯一下一动作：**等待 Owner 选择下一需求。**」；L58 新会话提示词同句。
   - memory/state.md L9：「Owner 2026-09-04选择知识库全量整理与同步：规划方向READY，入口…」；memory/handoff.md L17：「下一动作（Owner 2026-09-04调整）：执行角色按…完成知识库全量审计…」。
   - 判定：memory 已对齐新方向，knowledge 唯一权威仍写旧下一动作（含"不自动启动下一编号"）。knowledge 是唯一持久当前状态，此差异须在 B 阶段同步。
2. **memory 内部无计数冲突**：features.md/state.md/handoff.md 的功能数 41、清单 ✅34/🟦23/⬜33（90）、基线 1035/117f/1110t/V49 与 knowledge 一致；P21/P2 状态与 requirement-pool 一致。
3. **GOV-AUDIT-13**：knowledge L38 记方向仍留 ready/（待规划归档）；memory/issues.md「已机械同步完成并确认」——语义一致非冲突；ready/passed 生命周期未闭合属 §六.6。

## 三、todo/ 审计

### 3.1 todo/README.md（暂不修复清单）
- 条目 T2—T9（I8/I12、I17、I19、I20、I21、I22、I23、I6 索引），附注 D83 清理 T1（I2 已修复）、T10（I30 已满足）删行——文件内部一致。
- **悬空引用**：requirement-pool §四 写「I17 RICH_TEXT 降级 textarea 等 **T1-T10 条目**」，而 T1/T10 已删除，当前集合为 T2—T9（见 §六.4）。

### 3.2 todo/requirement-pool.md（57,269B）
- **Owner 优先级覆盖段已写入 2026-09-04 本轮目标**（L10）：「知识库全量整理与同步。当前唯一入口为 direction-knowledge-full-reconciliation.md…不新增业务功能、不自动核销P编号」✅ 与方向一致。
- **P1—P58 全状态表**（池内 56 行；P13、P23 无行，见备注）：

| # | 名称/来源 | 状态 |
|---|---|---|
| P1 | M01/M02 关联·筛选剩余项（I31/I36/F02/F03） | ✅已核销 |
| P2 | M03 表单模块缺口（I38-I40） | 待排期 |
| P3 | M05 通知剩余：发送记录状态/失败重发/全局日志（I45） | ◐部分关闭、未核销 |
| P4 | M04 剩余能力：三类个人查询（Owner 2026-09-04确认未完成）+版本/挂起/转办/催办；P58映射待对账 | 开放；先核实查询入口、身份隔离与剩余范围再下发主功能（未核销） |
| P5 | M07-F01 前端管理页（5条） | ✅已核销 |
| P6 | M07-F02-02 Prompt 配置字段 | ✅已核销 |
| P7 | M07-F02-04 运行日志页+单步调试 | ✅已核销 |
| P8 | M07-F04-02 Token统计+会话页 | ✅已核销 |
| P9 | M07 图节点级多Key轮询 | 待排期 |
| P10 | bpm/h2 V8 partial index（I47） | ✅已核销 |
| P11 | 停用账号签发token 900s窗口（D76遗留） | 待决策 |
| P12 | sw-bootstrap 测试基建（D76遗留） | ✅已核销 |
| P14 | 数据权限遗留：deleted过滤/job非分页/等效SQL（D79遗留§8） | 待排期 |
| P15 | 跨环境导入导出（I16） | 待设计 |
| P16 | 发布冻结不可逆强校验（I11） | 待设计 |
| P17 | 前端多页签（I4） | 待开发 |
| P18 | M07-F03-01 助手配置（handoff候选3） | 未开发候选（选型未定） |
| P19 | M07-F03-03 知识库RAG（I13） | 未开发候选（选型未定） |
| P20 | M07-F04-01 对话窗口SSE（handoff候选3） | 未开发候选（零代码） |
| P21 | M08 IoT 设备管理与流程联动（I14+Owner 2026-08-29） | ◐部分关闭、未核销（真实腾讯账号/物理设备/原生MQTT/完整设备管理开放） |
| P22 | M09 OpenAPI 模块（I15） | 仅骨架，最后优先级 |
| P24 | V29 菜单 seed sys_role_menu（I49） | ✅已核销 |
| P25 | 登录状态校验时序（I50） | 待排期 |
| P26 | M01-F01-05 负责人设置 | 未排期 |
| P27 | M01-F02-05 人员批量导入导出 | 未排期 |
| P28 | M01-F04-01 用户组管理 | ✅已核销 |
| P29 | M01-F05-01 租户/公司管理 | 未排期 |
| P30 | M02-F05-01 资源管理 | 未排期 |
| P31 | M02-F06-02 单点登录 | 未排期 |
| P32 | M03-F04-02 表单数据导入导出 | ✅已核销 |
| P33 | M03-F06-01 打印模板 | 未排期 |
| P34 | M04-F01-03 会签规则（P58已验收ALL/ANY/RATIO、独立意见与取消语义；待核原明细） | **待对账，未核销** |
| P35 | M04-F07-01 流程规则（P58已验收受控表达式和条件分支；超时/自动审批待核） | **待对账，未核销** |
| P36 | M05-F02-01 消息模板 | ✅已核销 |
| P37 | M06-F01-01 通知渠道（P58已验收站内信、退回/驳回通知及统一渠道SPI，隔离Adapter成功/失败/超时/幂等；厂商账号联调未纳入） | **待对账，未核销**；具体厂商渠道待排期 |
| P38 | M06-F02-01 通知模板（M05模板已完；M06是否另有渠道专属要求需核） | **待对账，未核销** |
| P39 | M06-F03-01 通知规则（P58已覆盖审批事件通知和通知节点配置；用户可配置规则范围待核） | **待对账，未核销** |
| P40 | M10-F02-01 日志查询 | 未排期 |
| P41 | M10-F02-02 动态日志级别 | 未排期 |
| P42 | M10-F05-01 系统参数 | 未排期 |
| P43 | M10-F07-01 备份恢复 | 未排期 |
| P44 | M01-F01-02 部门修改（拖拽层级排序） | 未排期 |
| P45 | M02-F06-01 登录安全（RSA/验证码/时间校验/登录态） | ✅已核销/完成 |
| P46 | M03-F01-01 表单设计器拖拽（栅格） | ✅已核销（P56覆盖，不新增计数） |
| P47 | M04-F01-01 流程设计器拖拽（前端无设计器路由，I3按设计排除） | 未排期 |
| P48 | M07-F03-02 工具/函数调用前端配置 | ✅已核销 |
| P49 | M10-F01-01 运行监控 | 未排期 |
| P50 | M10-F08-01 API管理 | 未排期 |
| P51 | Agent Coding Engine 抽取 | ✅已完成（不新增OA计数） |
| P52 | 表单设计器顶部工作台与关联流程管理 | ✅已核销/完成 |
| P53 | 全局UI与组件布局优化 | 待Owner确认视觉方向 |
| P54 | 千人千面工作台（优先级P2） | 待规划 |
| P55 | 前后台分层与管理入口权限（优先级P2） | 待规划 |
| P56 | 表单设计器24列网格布局（优先级P1） | ✅已核销/完成 |
| P57 | BPM Engine统一流程节点扩展（P1/XL） | ✅已核销/完成 |
| P58 | 流程节点界面与具体能力优化（P1/XL） | ✅已核销/完成 |

- 状态统计：✅已核销/完成 19（P1,5,6,7,8,10,12,24,28,32,36,45,46,48,51,52,56,57,58）；◐部分关闭未核销 2（P3,P21）；**待对账未核销 5（P34,P35,P37,P38,P39）**；开放待核实 1（P4）；待排期 4（P2,9,14,25）；未排期 14（P26,27,29,30,31,33,40,41,42,43,44,47,49,50）；待决策 1（P11）；待设计 2（P15,16）；待开发 1（P17）；未开发候选/待规划/待Owner 7（P18,19,20,22,53,54,55）。
- P13：池内无行，但 knowledge/features/sysrole-v5-column-alignment.md 与 session-handoff 记录 P13/I26 已于 2026-08-17 核销并归档 `product/sysrole-v5-column-alignment/passed/`——符合池维护规则 2（完成移除），非悬空。
- **P23：全工作区（todo/knowledge/memory）零引用**——从未登记或已彻底清除；无需新建，仅在账本备案。
- I 编号引用集合（池内，25个）：I3, I4, I10, I11, I13, I14, I15, I16, I17, I31, I32, I34, I35, I36, I38, I39, I40, I45, I46, I47, I48, I49, I50, I53, I54；todo/README 另含 I6, I8, I12, I17, I19, I20, I21, I22, I23。I31—I56 范围内未被两文件引用：I33, I37, I41—I44, I51, I52, I55, I56（不存在悬空，仅为未关联；I 编号权威在 knowledge/known-issues.md，本账本不越权展开）。
- 过时表述（池内自相矛盾）：L14（P58 段尾）与 L317（P58 §4）均残留「唯一下一动作：等待Owner选择下一业务需求。」——与本文件 L10 Owner 优先级覆盖段（2026-09-04 目标）及 memory 下一动作冲突，见 §六.2。
- 悬空引用（池依赖已失效）：L5 与 L497 称「当前缺口明细以 D83 三份探索回执 + knowledge-sync-apply 回执为准（search_fallback/）」——这些文件现均为 486B 历史压缩指针 stub，无正文，见 §四与 §六.3。

## 四、search_task / search_fallback 配对表

### 4.1 活动任务（search_task/，8份）与回传配对

| 任务文件 | 目标 | 状态 |
|---|---|---|
| notification-personal-workflow-reconciliation-20260904.md | 通知拆分核对+三类个人查询逐项+与P4/P34/P35/P37-P39映射+计数建议 | **有任务无回传**（回执位置声明为 search_fallback/notification-personal-workflow-reconciliation-20260904.md，文件不存在；任务未结项、未归档） |
| p45-login-security-current-seams.md | P45 登录现状与接缝 | 已回传 `search_fallback/p45-login-security-current-seams.md`（13,956B）✅ |
| p45-login-state-direct-cause-supplement.md | F5 登录态断点补充（G1-G4） | 已回传 `p45-login-state-direct-cause-supplement.md`（9,773B）✅ |
| p51-branch-decoupling-exploration.md | main/develop-sw 分支解耦 | 已回传 `p51-branch-decoupling-exploration.md`（8,368B）✅ |
| p51-main-current-state-revalidation.md | main 当前状态重校验 | 已回传 `p51-main-current-state-revalidation.md`（5,550B）+ evidence 目录 ✅ |
| p51-main-terminal-history-reconciliation.md | main 终态历史对账 | 已回传 `p51-main-terminal-history-reconciliation.md`（10,797B）+ evidence 目录 ✅ |
| p57-bpm-node-extension-current-seams.md | P57 节点扩展接缝 | 已回传 `p57-bpm-node-extension-current-seams.md`（4,999B）✅ |
| p58-workflow-node-capabilities-current-seams.md | P58 节点能力接缝（选人/审批/会签/分支/抄送/通知） | 已回传 `p58-workflow-node-capabilities-current-seams.md`（11,396B）✅ |

### 4.2 归档任务（.archive/，4份）均已有回传 ✅
v0.0.1-beta-backend-exit134-diagnosis、v0.0.1-beta-final-candidate-audit、v0.0.1-beta-release-readiness、verify-three-repository-readme-refresh（各自对应 search_fallback 同名真实内容回传，全部配对闭合）。

### 4.3 孤立/悬空项
- **有任务无回传（唯一）**：notification-personal-workflow-reconciliation-20260904.md——方向已声明「保留为局部问题参考，不再单独推进或提交局部结项」，但任务文件本身未做任何"被取代/停用"标注，未移 .archive。新会话仍会把它当活动任务。建议 B 阶段标注并归档（见 §六.5）。
- **有回传无任务（真实内容，11份，任务文件已移除且未入 .archive）**：decisions-registry-note、i18-close-sync、minimal-business-closure-terminal-values-20260828、next-feature-candidate-refresh-20260821、next-feature-candidate-refresh-20260824、next-feature-candidate-comparison-20260825、p24-admin-role-seed-semantics、p24-dual-admin-role-backend、p24-dual-admin-role-frontend、p24-job-storage-role-menu-access、rule-sync-d85。均为历史探索回传，方向 §2「历史探索不作为最新实现事实」；无当前指令价值，但任务侧无归档链。
- **压缩指针 stub（29份，486B，正文已移除）**：agent-token-frontend-exploration、agent-token-usage-exploration、baseline-static-recount、checklist-pool-sync、checklist-status-full-verification、d162-gap-analysis、datascope-implementation-survey、f02-token-test-structure、feature-checklist-full-audit、i36-user-group-model-boundary、knowledge-sync-apply、known-issues-verification、m02-role-menu-button-permission-config、m07-agent-kickoff、m07-baseline-recount、m07-f02-graph-designer-precedent、m07-f04-conversation-precedent、m07-multivar-context-precedent、m07-step1-model-management-precedent、m07-step11-parallel-loop-precedent、m07-step12-execution-history-precedent、m07-step2-orchestration-engine-precedent、m07-step2-verification、m07-step3-toolsandbox-precedent、m07-step5-multikey-quota-precedent、p10-post-sync-consistency-audit、p13-sysrole-v5-column-alignment、session-retry-token-test-structure、token-test-structure。内容统一为「历史探索压缩指针」模板（指向 knowledge/current-status.md 与 product receipts）——**其中 checklist-pool-sync、datascope-implementation-survey、feature-checklist-full-audit（D83 三份探索回执）与 knowledge-sync-apply 被 requirement-pool 头部/维护规则仍当作"缺口明细权威"引用，属悬空引用**（见 §六.3）。
- **过期回传（历史快照被后续验收取代，均有明确日期标注，非当前入口）**：minimal-business-closure-terminal-values-20260828（2026-08-28 终态值已被 08-29 验收审计及 P52-P58 系列基线取代）；next-feature-candidate-*（2026-08-21/24/25 候选刷新，候选语义已被 2026-09-04 Owner 目标取代）；p45-login-*（P45 实施前现状快照，P45 已 COMPLETED）。p51-main-* 回传含"当前"字样但范围锁定 P51 终态时点，属合法历史闭环证据。

## 五、notification-personal-workflow-reconciliation 回传结论

**判定：`search_fallback/notification-personal-workflow-reconciliation-20260904.md` 不存在，任务无任何回传**（全工作区检索仅命中任务文件本身、主方向、requirement-pool 三处）。三类查询逐项结论、P4/P34/P35/P37—P39 映射建议、计数影响建议均未生成；任务书里待回答的 Q5「M06 模板与 M05 模板是否不同需求/是否收敛为 P4 子范围」同样未答，留待 B 阶段裁决。

**邻近事实源（审计可用，已完整读取）——`search_fallback/p58-workflow-node-capabilities-current-seams.md`（P58 实施前现状快照）要点提炼**：

1. **通知拆分核对（P58 实施前）**
   - 站内信：全链已实现——NotifyTemplate + TemplateRenderService（${var} 纯文本防注入）+ sw_notify_message 表 + NotifyController（列表/已读/删除，越权校验）→ 对应 M05 与 P36 已闭环部分。
   - 触发事件仅 TODO_CREATED 与 PROCESS_APPROVED；**reject 路径无事件、枚举无 REJECTED**——"审批不通过无通知"直接根因；注释 NotifyBizType.WF_APPROVED 声称"通过/驳回后通知发起人"超前于实现（回传冲突项）。→ P58 实施后补齐退回/驳回通知（pool P37 行已确认验收）。
   - 第三方渠道：**无 channel 概念**（SendNotifyCommand/NotifyMessage/NotifyTemplate/批量请求均无渠道字段，无短信/飞书/钉钉/企微/公众号/小程序任何代码）→ P58 实施后建立统一渠道 SPI 并隔离 Adapter 验证成功/失败/超时/幂等；**真实厂商账号联调仍未纳入任何已完成范围**（P37 行）——与方向 §4.1 三层区分一致。
2. **能力矩阵（P58 实施前）**：通用选人仅固定用户（角色/表达式/适配器未发现；NotifyBatchSend.vue 三选一 UI 是最完整选人雏形未复用）；审批仅单 assignee（DESIGNATED v1 取首人，候选多人任一完成不存在）；会签多实例/三结算、抄送、分支（CONDITION/EXCLUSIVE_GATEWAY 生产实现）、第三方渠道——全部未发现。→ 佐证 P34/P35/P37/P38/P39 在 P58 前的"未实现"事实与 P58 后的"逐项映射待对账"表述。
3. **三类查询雏形（P58 实施前）**：我的待办=后端仅 taskAssignee 过滤（BpmTaskFacadeImpl）+ BpmTodoController complete/reject（越权 task.assignee==当前用户）；我发起的=可经 sw_bpm_instance.initiator 派生；我的已办=无专门接口证据（Flowable 历史表仅 taskId/name/assignee/时间，无意见/结果字段）。**前端个人查询页面/路由/菜单/权限存在性未验证（回传范围外）**。→ 与 Owner 2026-09-04「三类查询尚未完成」反馈（pool P4 行）方向一致；该回传为 P58 实施前快照，个人查询无相关 P 交付覆盖，判断成立。
4. **要求底层事实（方向 §4.3 引用）**：候选被取消≠实际已办；审批动作/引擎轨迹完成≠个人查询完成。P4 行维持"开放、先核实查询入口、身份隔离与剩余范围"。

## 六、与新方向冲突点清单（路径 + 原文 + 建议）

| # | 路径 | 原文（摘） | 判定/建议 |
|---|---|---|---|
| 1 | knowledge/current-status.md L42/L58 | 「当前唯一下一动作：**等待 Owner 选择下一需求**…不自动启动下一编号」 | 知识权威与新方向冲突（memory 已更新、knowledge 未同步）；B 阶段唯一目标值=方向 §8 语句 |
| 2 | todo/requirement-pool.md L14、L317 | 「**唯一下一动作：等待Owner选择下一业务需求。**」（P58 段尾×2） | 池内自相矛盾（同文件 L10 已写 2026-09-04 目标）；建议删除/替换为方向下一动作 |
| 3 | todo/requirement-pool.md L5、L497 | 「当前缺口明细以 D83 三份探索回执 + knowledge-sync-apply 回执为准（search_fallback/）」 | 四个目标文件均已退化为 486B 历史指针 stub，正文不存在→悬空引用；建议改写为"以池内行级证据为主、历史见 product/*/receipts 与 Git 历史" |
| 4 | todo/requirement-pool.md L486 | 「I17 RICH_TEXT 降级 textarea 等 **T1-T10 条目**」 | T1/T10 已删（todo/README D83 清理注）；应写 T2—T9 |
| 5 | search_task/notification-personal-workflow-reconciliation-20260904.md | 任务书「回执后由Planner决定清单同步范围与唯一后续主功能」 | 无回传、无停用标注；方向已宣布不再单独推进/结项；建议 B 阶段标注"被 knowledge-full-reconciliation 取代"并入 .archive |
| 6 | knowledge/current-status.md L38 | 「GOV-AUDIT-13…方向仍留 `ready/`，规划终态复核通过后由规划角色归档」 | 生命周期未闭合（ready/passed）；与 issues.md 语义一致非冲突；建议 B 阶段由 Planner 完成归档判定 |
| 7 | memory/decisions.md L8 | 「v0.0.1-beta 发布候选的必须业务链…发布前须以当前 checkout 重新核验…」 | v0.0.1 已于 2026-08-31 发布（handoff 确认）；现在时表述易读成待办指令；建议 B 阶段加"历史决策（v0.0.1 已发布）"指针 |
| 8 | memory/handoff.md L15 | 「当前远端 `main=e0711fb`、`develop-sw=a2b8342`」 | 含"当前"字样但实为 P51 终态时点值（本地 develop-sw 已推进至 73f9315）；低风险误读；建议加"（P51 终态时点）"限定 |
| 9 | search_task/ 7份已回执任务 | 各任务书声明回执位置与"已完成规划复核" | 任务文件未归档（仅 .archive 4 份入档）；方向 §6.7「当前入口无过期任务指令」；建议 B 阶段统一归档/停用标注 |
| 10 | todo/requirement-pool.md P34/P35/P37/P38/P39、P4 行 | 「待对账，未核销」「开放；先核实…再下发主功能」 | 已与方向 §4 一致✅；无冲突，仅确认规划侧已预置对账占位 |

## 七、计数影响建议（仅建议值，供 Planner 裁决，本账本不落盘）

1. 三类个人查询（我发起的/我的待办/我的已办）：维持 P4 开放未核销；若功能清单存在对应 M04 明细行，不得因 P58 验收自动核销/升✅；当前 41/✅34/🟦23/⬜33 建议零变化。
2. P34/P35/P37/P38/P39：保持待对账未核销，计数建议零变化；对账后若裁决 P58 完整覆盖某行，由 Planner 单独授权核销与计数调整。
3. P57/P58/P52"不对应既有明细、90项零变化"：当前仅有声明、无逐项映射；建议 B 阶段要求给出三交付与 90 明细的明确无映射/覆盖说明（方向 §4.4），此前计数建议零变化。
4. P3、P21：保持部分关闭未核销（发送记录/重发/日志、真实腾讯设备/原生MQTT 继续开放）。
5. 通知三层（站内信/通知SPI/厂商渠道）：SPI 与隔离 Adapter 验证属 P58 已完成范围；真实厂商账号联调维持"未纳入已完成范围、待排期"（P37 行已表述一致）。
6. 本审计不新增功能数、不创建新 P 编号、不核销任何行（方向 §1/§5.A/§7）；所有"建议"待 Planner 差异裁决后进入 B 阶段同步清单。

## 八、历史证据指针（本账本覆盖入口的复算可查位置）

- memory 字节数：`ls -la memory/`（538/466/503/800/3612/2921/1743/2627；合计 13210）
- P 状态表：todo/requirement-pool.md（56 行，2026-09-04 16:15 更新）
- 配对表：search_task/（8 活动 + 4 归档）与 search_fallback/（51 份 md：22 真实内容 + 29 stub）
- P13/P23 备案：knowledge/features/sysrole-v5-column-alignment.md（P13 已核销闭环）；P23 零引用
- 通知/查询邻近事实源：search_fallback/p58-workflow-node-capabilities-current-seams.md（P58 实施前快照，含能力矩阵与 11 问答案）