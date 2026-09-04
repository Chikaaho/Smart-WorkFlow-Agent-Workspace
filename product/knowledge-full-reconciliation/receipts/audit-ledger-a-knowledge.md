# A 阶段审计账本 · knowledge/ 权威与知识索引层

> 任务：知识库全量整理与同步（L）· 阶段 A 全量审计 · 职责范围：`knowledge/` 权威与知识索引层
> 执行角色：Executor（只读审计，未修改任何被审计文件，未运行编译/测试/迁移，未提交/推送 Git）
> 审计时间：2026-09-04
> 主方向：`product/knowledge-full-reconciliation/ready/direction-knowledge-full-reconciliation.md`

## 1. 审计锚定（方向 §3.1）

| 仓 | 分支 | HEAD | 时间（本地） |
|---|---|---|---|
| 根仓（工作区） | `develop-sw` | `73f93159c5558d7653223b6857d987420b610f29` docs(p58): 流程节点界面与具体能力优化执行回执、阶段三终态同步与规划最终复核（COMPLETED 已确认，第41个正式功能） | 2026-09-04 15:49:19 |
| Smart-WorkFlow-Server | `develop` | `22497aaaeb429c0553287829584dc633d592be9f` feat(p58): 流程节点通用选人、审批意见与会签结算、分支抄送、通知SPI、开发调试认证及验证资产测试化 | 2026-09-04 15:49:27 |
| Smart-WorkFlow-Web | `develop` | `4b62076e55af29dd639f3ec2280de38446474ab3` feat(p58): 流程节点配置、审批意见与任务处理前端及开发调试认证 | 2026-09-04 15:50:20 |
| 根仓未提交变更 | — | 已修改：`memory/handoff.md`、`memory/state.md`、`todo/requirement-pool.md`；未跟踪：`product/knowledge-full-reconciliation/`、`search_task/notification-personal-workflow-reconciliation-20260904.md` | — |

## 2. 文件清单与规模（knowledge/ 全部）

| 文件 | 行数 | 大小 | 最后修改 | 角色 |
|---|---|---|---|---|
| `current-status.md` | 61 | 9.7KB | 2026-09-04 15:44 | 唯一权威当前状态 |
| `known-issues.md` | 654 | 92KB | 2026-09-03 11:38 | 未关闭业务问题权威注册 |
| `session-handoff.md` | 439 | 74KB | 2026-09-03 11:53 | 会话交接（P57 时点，未含 P58） |
| `decisions.md` | 533 | 67KB | 2026-08-31 | D1—D48 决策档案 |
| `architecture.md` | 316 | 18KB | 2026-08-31 | 架构分册（多处过期描述，见 §6） |
| `development-workflow.md` | 68 | 2.9KB | 2026-08-31 | 工程流程参考 |
| `shared-constraints.md` | 80 | 3.8KB | 2026-08-31 | 跨端工程约束 |
| `model-registry.md` | 23 | 1.2KB | 2026-08-31 | 治理入口导航 |
| `governance-authority-matrix.md` | 24 | 2.4KB | 2026-08-31 | 权威归属矩阵 |
| `history/README.md` + 11 个快照 | — | 合计约 115KB | 最新 2026-09-04 14:57 | 历史快照索引 |
| `evidence/` | — | 1 子目录 `v0.0.1-beta-release-readiness`（21 条目） | 2026-08-31 | 原始证据 |
| `features/`（41 个文件 = 40 功能追踪 + `_template.md`） | — | 合计约 330KB | 大部分 2026-08-31 23:42 批量重写；p45 09-01、p52/p56 09-02、p57 09-03、p58 09-04 | 功能追踪 |

history/ 快照清单（README 已列 11 份）：`...-2026-08-25`、`...-2026-08-26`、`...-2026-08-27`、`...-2026-08-28`、`...-2026-08-29-form-data`、`...-2026-08-29-gov-audit-13`、`...-2026-09-01-p45-stage3-before`、`...-2026-09-02-p52-stage3-before`、`...-2026-09-02-p56-stage3-before`、`...-2026-09-03-p57-stage3-before`、`...-2026-09-04-p58-stage3-before`。最近快照 = `current-status-through-2026-09-04-p58-stage3-before.md`。

## 3. current-status.md（唯一权威）提取

- 当前功能数：**41**（40＋P58）；P58=p58-workflow-node-capabilities，功能级 PASSED（2026-09-04，规划验收 08）+ 阶段三终态最终复核 COMPLETED（已确认，2026-09-04）（`planning-final-review-p58-terminal-sync-01-passed.md` PASSED）；前一正式功能 P57=p57-bpm-node-extension，第 40 个（COMPLETED（已确认，2026-09-03））。
- 清单三类计数：10 模块、55 功能、90 明细；**✅34 / 🟦23 / ⬜33**（34+23+33=90；P58 不对应既有 Mxx-Fxx 明细，明细状态零变化）。
- 基线：后端 1035/0/0/0（152 份 Surefire，BUILD SUCCESS）；前端 117 files passed + 1 skipped / 1110 tests + 3 skipped；Flyway H2 V49（49）/PG V49（48）。
- 当前活动功能：无；当前活动治理/管理员任务：无（补充提示生成规范已验收闭环）。
- 唯一下一动作：**等待 Owner 选择下一需求**（P58 COMPLETED 已确认；不自动启动下一编号）。
- P 核销声明：P58/P57/P56/P45/P52 已核销/完成；P46 由 P56 一并核销；P21 部分关闭未核销；P2 其余缺口开放；P54/P55 延续需求待规划。
- 正式基线/最近审查/方向归档事实：见文件 §终态与方向归档事实（P58 三份方向已归档 passed/；边界：第三方渠道为 SPI/隔离 Adapter 证明、意见 JS 为受控表达式、FAILED 任务明确失败边界、非零租户登录为认证产品边界）。

## 4. features/ 功能追踪表（41 文件）

列：文件名 → 功能 → P/清单映射 → 状态声明（终态）→ 完成日期 → 备注

| 文件 | 功能 | P/清单映射 | 状态（终态） | 日期 | 备注 |
|---|---|---|---|---|---|
| p58-workflow-node-capabilities | 流程节点界面与具体能力优化 | P58（不对应既有明细） | COMPLETED（已确认），第41个 | 2026-09-04 | 与 current-status 一致；边界表述正确区分站内信/通知SPI/厂商渠道 |
| p57-bpm-node-extension | BPM 统一流程节点扩展 | P57（不对应既有明细） | COMPLETED（已确认），第40个 | 2026-09-03 | ⚠ 边界段含「P58（会签、通知、条件分支及具体节点界面）未启动」已过期（见 §6-7） |
| p56-form-grid-layout | 表单设计器 24 列网格 | P56/P46 = M03-F01-01 | COMPLETED（已确认），第39个 | 2026-09-02 | M03-F01-01 🟦→✅；P46 一并核销，仅 +1 计数 |
| p52-form-workbench | 表单设计器工作台 | P52（不对应明细） | COMPLETED（已确认），第38个 | 2026-09-02 | 后续明细状态零变化 |
| p45-login-security | 登录安全与登录态恢复 | P45 / M02-F06-01 | COMPLETED（已确认），第37个 | 2026-09-01 | M02-F06-01 🟦→✅ |
| notify-batch-send | 通知批量发送 | M05-F01-01（第34个已完成功能） | COMPLETED | 2026-08-27 | L1 发送记录状态管理「已决策暂不修复（P3 部分关闭边界）」；L2 失败重发、L3 全局日志待排期 |
| notify-management-closure | 通知管理缺口闭环 | P3 子集 / I41 / I42 | COMPLETED（D210 功能级 PASSED） | 2026-08-25 | M05-F01-02/F01-03 ✅；P3 部分关闭未核销 |
| notify-template-management | 消息模板管理 | P36 / M05-F02-01 | COMPLETED | 2026-08-26 | ⚠ 头部「待规划终态复核」过期；已知限制#4 仍列「批量发送 M05-F01-01 🟦」过期（见 §6-4/6-5） |
| notify-frontend | 通知模块前端落地 | 声称「M02-F01-01」⚠ | COMPLETED | 2026-07-15 | ⚠ 与清单 M02-F01-01＝角色管理重复占用同一 ID（见 §6-1） |
| bpm-task-center | 待办中心增强（分页/详情/驳回/已办） | 无清单 ID 声明（实为 M04-F05-01 待办中心子集） | COMPLETED | 2026-07-19 | 范围外含「催办提醒、会签/或签、我发起的页面」 |
| bpm-single-node-approval | 单节点审批前后端联通 | 声称「M04-F01-01」⚠ | COMPLETED | 2026-07-15 | 清单 M04-F01-01＝流程设计器拖拽设计（🟦，P47 缺口）——ID 映射错位（见 §6-2） |
| bpmn-adapter | BPMN 查看器防腐层 | I3（BPMN 部分），服务 M04-F06-01 | COMPLETED（Step4 SUPERSEDED） | 2026-07-26 | I3 详细条目已同步 |
| process-monitoring | 流程监控首批 2/4 | M04-F06-01 | COMPLETED | 2026-07-30 | 耗时分析/流程干预延后；清单 M04-F06-01 保持 🟦 |
| bpm-plugin-architecture | BPM 节点/组件/adapter 可插拔 | M04-F08-01 | COMPLETED（D82） | 2026-08-16 | 遗留表仍列「I47 未修复」（交付时点记录，已过期事实） |
| vue-flow-adapter | Vue Flow adapter | I3（Vue Flow 部分），归属 M07 | COMPLETED | 2026-07-25 | |
| role-menu-permission-parity | 角色菜单/按钮权限契约收口 | P1 / M02-F02-01 / M02-F03-01 | COMPLETED（D123 终态同步）第26个 | 2026-08-20 | D122 四类偏差修正（I53/I54 注册）；P1 正式核销 |
| admin-role-governance | 不可变超管与可配置管理员 | P24 / I49 | 验收 PASSED（D96） | 2026-08-18 | I49 关闭 |
| user-group-membership | 用户组维护与成员绑定 | P28 / I36 / M01-F04-01 | COMPLETED（D117） | 2026-08-19 | M01-F04-01 ⬜→🟦（终态确认）；I36 关闭；P28 核销 |
| user-org-association-query | 人员组织与授权关联查询 | I32 / I34 / I35 | COMPLETED（D101） | 2026-08-18 | I32/I34/I35 关闭 |
| department-query-filtering | 部门条件查询 | M01-F01-04 / I31 | COMPLETED（D103/D104） | 2026-08-18 | I31 关闭，M01-F01-04 🟦→✅ |
| data-scope-enforcement | 数据权限五档 | M02-F04-01 | COMPLETED（D79） | 2026-08-15 | I37 关闭；I46 登记（手写 SQL 不纳管） |
| checklist-gap-hardening | 清单缺口加固第一批 | I33 / I43 / I44 | COMPLETED（D76） | 2026-08-13 | |
| status-semantics-alignment | 前端状态语义对齐 | I51 | PASSED 并归档 | 2026-08-17 | |
| sysrole-v5-column-alignment | SysRole 列契约对齐 | P13 / I26 | PASSED 并归档（D86） | 2026-08-17 | |
| bpm-h2-v8-compat | BPM H2 V8 迁移链兼容 | P10 / I47 | PASSED 并归档（D87/D88） | 2026-08-17 | |
| pg-v13-migration-chain-repair | PG V13 迁移链修复 | I52 | COMPLETED（D110+阶段三） | 2026-08-19 | I52 关闭 |
| agent-graph-execution-observability | 运行日志前端闭环 | P7 子集 / M07-F02-04 | COMPLETED（D148 功能级） | 2026-08-20 | I55 关闭；P7 整体不核销；M07-F02-04 保持 🟦 |
| agent-graph-step-debugging | 图单步调试 | P7 / M07-F02-04 | COMPLETED（D180 15/15+终态同步）第30个 | 2026-08-23 | P7 核销、M07-F02-04 升 ✅ |
| agent-graph-prompt-configuration | 图节点 Prompt 配置 | M07-F02-02 | COMPLETED（D154 功能级 + D157 阶段三复验）第28个 | 2026-08-21 | ⚠ 头部状态段仍写「阶段三 FAILED（D155/D156；待 D157 复验）」（见 §6-6） |
| agent-model-management-frontend | 大模型管理前端闭环 | P5 / M07-F01-01～05 | COMPLETED（D107 复验） | 2026-08-19 | D106 FAILED 为合法历史；五行 🟦→✅；P5 核销 |
| agent-token-usage-observability | Token 统计与会话查看 | P8 / M07-F04-02 | COMPLETED（D170/D172/D174，13/13）第29个 | 2026-08-22 | P8 核销、M07-F04-02 升 ✅ |
| agent-tool-configuration-frontend | 工具与函数调用前端配置 | P48 / M07-F03-02 | COMPLETED（D203+D207）第31个 | 2026-08-25 | |
| auth-seam-completion | 认证接缝收尾 | I2（无独立 M 明细） | COMPLETED | 2026-07-22 | |
| form-data-import-export | 表单数据导入导出 | P32 / M03-F04-02 | COMPLETED（第36个） | 2026-08-29 | ⚠ 头部仍写「COMPLETED（待规划终态复核）」（见 §6-3） |
| minimal-business-closure | Owner 最小业务闭环 | P21（部分关闭）/ I14 | COMPLETED（第35个） | 2026-08-28 | ⚠ 头部仍写「待规划终态复核」；后续已由验收审计确认（见 §6-3） |
| feature-checklist-sync | 清单状态同步 | I1 | COMPLETED（4 Steps + Step5 二次） | 2026-07-24 / 08-12 | |
| kb-verification | 知识库运行期验证 | I24 / I25 | COMPLETED | 2026-07-22 | |
| job-scheduler | 定时任务调度 | M10-F03-01 相关工作 | COMPLETED | 2026-07-21 | |
| storage-multi-provider | 多存储提供商 | M10-F06-01 相关工作 | COMPLETED | 2026-07-20 | |
| system-mgmt-crud | 系统管理核心 CRUD | M01/M02 核心 CRUD | COMPLETED | 2026-07-14 | |
| _template | 模板 | — | PLANNING（模板） | — | |

映射汇总：40 个功能追踪文件全部有 P 编号/清单 ID/I 编号或明确独立范围（storage/job/bpm-task-center/system-mgmt-crud 等未逐一对应 M 明细行，属早期 Walking Skeleton 功能，无悬挂引用）；2 处 ID 声明与清单冲突（notify-frontend→M02-F01-01、bpm-single-node-approval→M04-F01-01，见 §6）。

## 5. known-issues.md 全表（55 条：I1–I21、I22–I23、I24–I30、I31–I55）

| 编号 | 问题摘要 | 严重度 | 状态 | 关联清单/P |
|---|---|---|---|---|
| I1 | 功能清单状态与代码进度脱节 | 中 | ✅ 已修复（两轮 2026-07-24/08-12） | 清单全表 |
| I2 | refresh token seam 未实现 | 低 | ✅ 已修复（2026-07-22） | auth-seam |
| I3 | BPMN/Vue Flow adapter 未实现 | 中 | 部分修复（BPMN+VF 部分完成，D83 复核） | M04-F01-01/M04-F06-01 状态列 |
| I4 | 前端多页签未实现 | 低 | 待开发 | — |
| I5 | 测试基线未独立验证 | 中 | ✅ 已修复（2026-07-14） | — |
| I6 | 间接依赖已知漏洞 | 低 | 已评估 | — |
| I7 | 通知模块前端占位 | 中 | ✅ 已修复（2026-07-15） | M05 系列 |
| I8 | 定时任务集群升级预留 | 低 | 设计预留 | — |
| I9 | EP API 组件 CSS 导入不完整 | 低 | ✅ 已绕过（全量 CSS） | — |
| I10 | 动态宽表裸 SQL 隔离易漏 | 高 | 红线固化 | M03 宽表 |
| I11 | 发布冻结不可逆 | 中 | 需设计器强校验 | M03-F02 |
| I12 | 定时任务单节点 | 中 | 已预留接缝 | M10-F03 |
| I13 | M07 引擎/沙箱/RAG 选型 | 中 | ◐ 部分收敛 | M07 |
| I14 | M08 腾讯接入路径 | 中 | ◐ 部分关闭（真实账号/设备联调开放） | M08 |
| I15 | M09 授权粒度/配额 | 低 | ⚠ 排在最后 | M09 |
| I16 | 跨环境迁移未设计 | 中 | ⚠ 后续设计 | — |
| I17 | RICH_TEXT 未集成 | 低 | 降级 textarea | M03-F01-02 |
| I18 | 子项目 system.md 与 zip 不同步 | 中 | ✅ 已关闭（D84） | — |
| I19 | storage mock 下载不可用 | 低 | 已知限制 | M10-F06 |
| I20 | storage 筛选 UI 占位 | 低 | 已知限制 | M10-F06 |
| I21 | B4 测试覆盖不足 | 低 | 已知偏差 | — |
| I22 | @vueuse/core 警告 | 极低 | 第三方依赖 | — |
| I23 | EP 显式 import 与宪法不一致 | 低 | 文档与代码不一致 | — |
| I24 | 后端测试计数 406 不一致 | 中 | ✅ 已修复（真值 203） | — |
| I25 | 前端测试计数 471 不一致 | 低 | ✅ 已修复（+8 循环展开） | — |
| I26 | SysRole 列名与 V5 不一致 | 高 | ✅ 已修复（P13） | — |
| I27 | refresh 家族撤销事务回滚 | 高 | ✅ 已修复（B4） | — |
| I28 | 后端宪法缺仓库范围章节 | 高 | ✅ 已修复（D34） | — |
| I29 | bpmn-adapter Step2 回执计数矛盾 | 中 | ✅ 已修复 | — |
| I30 | mock BPMN XML 最简模板 | 低 | ✅ 已满足（D83） | — |
| I31 | M01-F01-04 部门查询虚高 | 低 | ✅ 已修复（2026-08-18） | M01-F01-04 |
| I32 | M01-F02-01 人员新增虚高 | 低 | ✅ 已修复（2026-08-18） | M01-F02-01 |
| I33 | M01-F02-02 人员修改虚高 | 高 | ✅ 已修复（2026-08-13） | M01-F02-02 |
| I34 | M01-F02-04 人员查询虚高 | 低 | ✅ 已修复（2026-08-18） | M01-F02-04 |
| I35 | M01-F03-01 岗位管理虚高 | 低 | ✅ 已修复（2026-08-18） | M01-F03-01 |
| I36 | M02-F01-01 角色管理虚高 | 低 | ✅ 已修复（2026-08-19 用户组绑定子集关闭） | M01-F04-01 ⬜→🟦 |
| I37 | M02-F04-01 数据权限虚高 | 中 | ✅ 已修复（2026-08-15） | M02-F04-01 |
| I38 | M03-F01-02 控件库虚高（8/17） | 中 | 待修复 | M03-F01-02（🟦） |
| I39 | M03-F02-01 表单管理虚高（删除/版本） | 中 | 待修复 | M03-F02-01（🟦） |
| I40 | M03-F04-01 数据管理虚高 | 低 | 待修复 | M03-F04-01（🟦） |
| I41 | M05-F01-02 消息接收缺删除 | 中 | ✅ 已关闭（2026-08-25） | M05-F01-02 ✅ |
| I42 | M05-F01-03 消息查询无过滤 | 中 | ✅ 已关闭（2026-08-25） | M05-F01-03 ✅ |
| I43 | M10-F03-01 定时任务菜单不可达 | 中 | ✅ 已修复（V29） | M10-F03-01 ✅ |
| I44 | M10-F06-01 文件存储菜单不可达 | 中 | ✅ 已修复（V29） | M10-F06-01 ✅ |
| I45 | M07/M04/M05/M06/M09/M10 虚低 15 条汇总 | 低 | ◐ 部分关闭 | 见详细条目；⚠ 详细条目仍列 M05-F01-01 待排期（已过期，见 §6-5） |
| I46 | 手写 SQL 通道无数据权限 | 高 | 已知限制（不纳管） | — |
| I47 | bpm/h2 V8 partial index | 中 | ✅ 已修复（2026-08-17） | —
| I48 | flow-graph adapter 契约限制 | 低 | 绕行生效 | — |
| I49 | V29 未 seed sys_role_menu | 中 | ✅ 已关闭（2026-08-18） | — |
| I50 | 登录状态校验时序 | 低 | 待修复 | — |
| I51 | 前端 status 语义反转 | 高 | ✅ 已修复（2026-08-17） | — |
| I52 | PG V13:58 DROP INDEX 2BP01 | 中 | ✅ 已关闭（2026-08-19） | — |
| I53 | 方法级鉴权 403 契约失真为 500 | 中 | ✅ 已修复（2026-08-20） | — |
| I54 | 角色停用不撤权 | 高 | ✅ 已修复（2026-08-20） | — |
| I55 | M07-F02-04 运行日志前端缺口 | 中 | ✅ 已关闭（2026-08-20） | M07-F02-04（运行日志子集 ✅，单步调试另由 D180 关闭） |

开放/待修复/待决项集合（当前值）：I4、I6（已评估）、I8、I11、I12（预留）、I15、I16、I17、I19、I20、I21、I38、I39、I40、I46（不纳管）、I48、I50；I13/I14/I45 部分关闭；其余已修复/关闭/满足。注：known-issues 头部「阶段三同步轮」注记到 P57（2026-09-03）为止，无 P58 同步轮注记（P58 未增减问题，属缺失的记录约定，见 §6-9）。

## 6. knowledge 内部不一致/过期描述清单（位置 + 摘录 + 建议）

| # | 位置 | 原文摘录（概要） | 类型 | 建议（待 Planner 裁决，执行层不自行改） |
|---|---|---|---|---|
| 1 | `knowledge/features/notify-frontend.md` 功能编号栏 | 「功能编号 \| M02-F01-01」（通知模块前端落地） | 映射/重复 ID | 清单 M02-F01-01＝角色管理（🟦）。同一 ID 两义；notify-frontend 实际对应 M05 站内信（Walking Skeleton 第四环）。建议将该文件 ID 更正为 M05 系列（如 M05-F01-01 前身）或标注「无独立清单 ID，服务 M05」 |
| 2 | `knowledge/features/bpm-single-node-approval.md` 功能编号栏 | 「功能编号 \| M04-F01-01」（BPM 单节点审批前后端联通） | 映射/重复 ID | 清单 M04-F01-01＝流程设计器拖拽设计（🟦，P47 缺口）。单节点审批/待办应映射 M04-F05-01 待办中心（🟦，行描述含待办/已办/我发起的/抄送/催办）。建议更改为 M04-F05-01 子集说明，并登记「我发起的」缺口 |
| 3 | `features/form-data-import-export.md`、`features/minimal-business-closure.md` 头部 | 「阶段三终态落值 COMPLETED（待规划终态复核）」 | 过期描述 | 两功能已于 2026-08-29 由规划终态复核确认（current-status/session-handoff 均记 COMPLETED（已确认））。建议头部改为「COMPLETED（已确认，2026-08-29）」 |
| 4 | `features/notify-template-management.md` 头部 | 「最终状态 COMPLETED（待规划终态复核）」「阶段三终态同步…待规划终态复核」 | 过期描述 | 第 33 个已完成功能已确认；建议与 3 同样修正 |
| 5 | `features/notify-template-management.md` §已知限制 #4 | 「P3 其余缺口（批量发送 M05-F01-01 🟦、发送记录 M06-F04-01 🟦 等）不在本功能范围，继续待排期」；同源：`known-issues.md` I45 详细条目（2026-08-19/21/22/23 四段）尾部均列「M05-F01-01…仍待排期」 | 过期描述 | M05-F01-01 已于 2026-08-27 完成（notify-batch-send 第 34 个、清单 ✅）；I45 最新详细条目（08-23）早于该完成。建议 I45 追加 2026-08-27 之后的关闭记录（保留历史段），并修正 template 文件限制#4 的 M05-F01-01 表述（M06-F04-01 发送记录仍 🟦 不变） |
| 6 | `features/agent-graph-prompt-configuration.md` 头部状态段 | 「阶段三 FAILED（D155/D156；当前态同步回执已提交，待 D157 复验）…P6 核销…**待 D157 复验确认**」 | 过期描述 | D157 阶段三最终复验 2026-08-21 PASSED、第 28 个 COMPLETED（现行 current-status/session-handoff/known-issues I45 均为已确认）。文件头部/正文状态段仍停留在「待复验」时点。建议按 D157 结果收敛为 COMPLETED（已确认） |
| 7 | `features/p57-bpm-node-extension.md` 边界段 | 「边界（后续各轮不得改写）：…**P58（会签、通知、条件分支及具体节点界面）未启动**」 | 过期描述 | P58 已于 2026-09-04 COMPLETED；该句不再成立。建议删除或改为历史注记（P57 完成时点事实） |
| 8 | `knowledge/session-handoff.md` 全文 | 头部/§0/§1/§9/§12/§15 均以 P57 为最新（「已完成功能 40」「下一动作：规划进入 P58 范围澄清」「第 40 个」） | 过期描述（重大） | 未随 2026-09-04 P58 阶段三同步更新：功能数应为 41、下一动作应为「等待 Owner 选择下一需求」、基线应更新为 P58 正式基线（1035/117f/1110t/V49）。建议 B 阶段按 current-status 权威值全文同步 |
| 9 | `knowledge/known-issues.md` 头部注记区 | 有 P45/P52/P56/P57 四个阶段三同步轮注记，无 2026-09-04 P58 轮 | 记录缺失 | 按既有约定补一段「2026-09-04 P58 同步轮：无必须新增或关闭的问题（无变化）」 |
| 10 | `knowledge/current-status.md` GOV-AUDIT-13 行 | 「方向 `product/workspace-governance-consistency-audit/ready/direction-executor-current-status-reconciliation-gov-audit-13.md` 仍留 `ready/`」 | 过期描述（事实核对） | 实测该目录无 `ready/`，方向文件已在 `passed/`（`direction-executor-current-status-reconciliation-gov-audit-13.md` 现位于 `product/workspace-governance-consistency-audit/passed/`）。建议移除「仍留 ready/」表述或改为已归档事实 |
| 11 | `knowledge/architecture.md` §5/§6/§7.3/§9 | §6 合计「54 功能、89 明细」（M04 记 7/9）；§5「BPM 🟦 开发中、AI Agent ⬜ 骨架、IoT ⬜ 骨架、知识库 ⬜ 骨架、OpenAPI ⬜ 骨架」；§7.3「已完成 7 个功能（…见 current-status §5）」；§9「bpmn-js 18（待集成）」「@vue-flow/core 1.48（待集成）」 | 过期描述（重大） | 现行清单为 10 模块/55 功能/90 明细（M04=8/10）；BPM（P57/P58）、Agent（M07 多轮交付）、IoT（minimal closure）已有实质交付；bpmn-js/Vue Flow 已集成。建议 B 阶段统一刷新到「指向 current-status/功能清单.md 的粗粒度总览」或删除落伍数字 |
| 12 | `knowledge/decisions.md` 头部注记 | 「D47+ 决策见 memory/decisions.md…本文件为 D1-D46 历史详情档案」但文件尾部已含 D47/D48（2026-08-29） | 轻微自相矛盾 | 建议将档案说明改为「D1—D48」（或注明 D47/D48 为例外补录） |
| 13 | `knowledge/session-handoff.md` §10/§2 候选池 | 「P3 剩余缺口 — 批量发送（M05-F01-01 🟦）、发送记录缺口（M06-F04-01 🟦）」 | 过期描述 | 该候选池文本为 2026-08-26 P36 时点；M05-F01-01 已于 08-27 完成。建议候选池改为「P3 剩余缺口 — 发送记录（M06-F04-01 🟦）、失败重发、全局日志」 |
| 14 | `knowledge/session-handoff.md` §14 必读清单 | 「knowledge/features/agent-model-orchestration.md ← M07 全链」 | 悬空引用 | `features/` 下无该文件（M07 全链内容实际分布于 agent-* 各文件）。建议改为实际存在的文件或删除 |
| 15 | `features/bpm-plugin-architecture.md` §8 遗留 | 「I47（bpm/h2 V8 partial index）未修复——本轮为纯重构轮，仅正式登记」 | 交付时点记录 | I47 已于 2026-08-17 修复；该段为 08-16 交付时点遗留表。建议标注「已由 bpm-h2-v8-compat 修复」或归入历史段落（同样适用于该类交付时点遗留表） |

## 7. 必查冲突对照（方向 §4）

1. **P58 通知/选人/审批/会签/分支/抄送 ↔ 旧清单/P4/P34/P35/P37–P39 映射**：knowledge 层无任何 P4/P34/P35/P37/P38/P39 映射表述（全文检索零命中）；映射相关权威表述集中在 `todo/requirement-pool.md`（P4 记「个人流程查询…Owner 2026-09-04 确认尚未完成；P58 已验收通用选人…既有清单映射待对账」；P34/P35/P37/P38/P39 均「待对账，未核销」）。knowledge 内 P58 feature/current-status 边界与 P37「第三方厂商账号联调未纳入已完成范围」口径兼容，无直接冲突；但 knowledge 缺少与这些 P 编号的显式对账入口，建议 B 阶段在 P58 feature 或 current-status 增补「P34/P35/P37–P39 待对账」指针。
2. **站内信 / 通知 SPI / 厂商渠道区分**：一致。`features/p58-workflow-node-capabilities.md`（「站内信为内置通知能力；预设统一第三方通知 SPI 与可验证扩展接缝…具体渠道实现与外部账号联调不属本功能交付」）与 `current-status.md` P58 边界（「第三方渠道为 SPI/隔离 Adapter 证明，非厂商账号联调」）表述一致；清单 M06-F01-01 通知渠道 ⬜（P37 待对账）未被 P58 声称覆盖——无冲突。
3. **我发起的 / 我的待办 / 我的已办登记**：knowledge 内仅 `bpm-single-node-approval.md`（我的待办页 Step2）与 `bpm-task-center.md`（待办列表增强 + ProcessedList 已办）记录交付；「我发起的」仅在 `bpm-task-center.md` §范围外出现（「催办提醒、会签/或签、'我发起的'页面」）。**knowledge 无三类个人查询的独立逐项登记条目**；与 requirement-pool P4（Owner 2026-09-04 确认尚未完成）构成跨层待裁决冲突（知识层记录为「已交付页面」vs 需求池 P4 记「尚未完成」）。二者不矛盾于「待办/已办页面局部能力已交付、完整个人查询能力未验收」的中间态，但需 Planner 明确口径并登记。
4. **P52/P57/P58 不对应原 90 项明细的表述一致性**：三份 feature + current-status + history 快照表述一致（均「不对应既有 Mxx-Fxx 明细，60 项/90 项明细状态零变化」）；P56/P46→M03-F01-01 的「一个交付两个索引、只加一个正式功能」表述在 current-status/p56 feature/history README 三处一致。无内部冲突。
5. **M05/M06/P3 边界**：M05 四行全部 ✅（F01-01/02/03、F02-01）；M06-F04-01 发送记录 🟦（行描述「发送日志、状态查询、失败重发」）；notify-batch-send L1「发送记录状态管理（查看/筛选/导出）不在本轮范围·P3 部分关闭边界」、L2 失败重发、L3 全局日志待排期——与 requirement-pool P3「部分关闭未核销；唯一剩余为发送记录状态、失败重发和全局日志」完全一致。无冲突。

## 8. 与 Server 功能清单声明状态的一致性核对

- 90 行复算：`Smart-WorkFlow-Server/功能清单.md` 明细表行（`^| M[0-9][0-9]-F…`）= **90 行**；状态列（行末 emoji）分布 = **✅34 / 🟦23 / ⬜33**，与 current-status/features 声明完全一致。注：行内「描述」列偶含 emoji（如 M01-F04-01、M07-F02-04），计数须取状态列（末 emoji）而非行首 emoji。
- 模块总览：10 模块 / 55 功能 / 90 明细，与 current-status「10 模块、55 功能、90 明细」一致（architecture.md 的 54/89 已过期，见 §6-11）。
- 功能数 41：current-status（41）、features/p58（第 41 个）、history 最近快照（40→41）一致；session-handoff 仍为 40（§6-8）。
- P 核销声明：P58/P57/P56/P52/P45/P36/P32/P28/P24/P13/P10/P8/P7/P6/P5/P1 已核销、P46 由 P56 一并核销，knowledge 各 feature 与 current-status 一致；P3 部分关闭未核销、P21 部分关闭未核销、P2 开放——与 requirement-pool 一致。
- ⚠ Server 清单文件本身未同步 P58：头部 changelog 止于 P57 条目（`-->` 注释于 P57 后闭合），「当前焦点」段仍写「上一完成功能 p57…唯一下一动作：规划进入 P58 范围澄清，P58 未进入 READY/IN_PROGRESS」；M05 模块说明「⚠ 当前无代码落地」与 4 行全 ✅ 矛盾。属清单侧过期项，计入 B 阶段同步清单（不属 knowledge 层修改，但为本次核对发现）。

## 9. 集合数量可复算检查（方向 §5A）

| 集合 | 数量 | 说明 |
|---|---|---|
| features 文件 | 41（40 功能 + `_template.md`） | 无悬空文件名引用（session-handoff §14 的 agent-model-orchestration.md 除外，见 §6-14） |
| known-issues 条目 | 55（I1–I21、I22–I23、I24–I30、I31–I55） | 与索引表行数一致；无重复编号 |
| decisions | D1–D48（档案注记为 D1–D46，尾部实带 D47/D48） | 无重复 |
| history 快照 | 11 份 + README | 最近：current-status-through-2026-09-04-p58-stage3-before.md |
| current-status 计数 | 功能 41；清单 ✅34/🟦23/⬜33=90 | 三项内部自洽（34+23+33=90） |

## 10. 需 Planner 裁决的差异列表（摘要）

1. notify-frontend 功能编号 M02-F01-01 与清单角色管理行 ID 冲突（改 ID 或标注无 ID）。
2. bpm-single-node-approval 功能编号 M04-F01-01 与清单流程设计器行 ID 冲突（改映射至 M04-F05-01 子集）。
3. session-handoff.md 全量过期（P57 时点 → P58 时点：功能数 41、新基线、新下一动作）——B 阶段同步。
4. current-status.md GOV-AUDIT-13「仍留 ready/」过期（实测已归档 passed/）。
5. architecture.md §5/§6/§7.3/§9 系列过期描述（54/89、模块成熟度、已集成库待集成）。
6. 三个 feature 头部「COMPLETED（待规划终态复核）」过期（form-data-import-export、minimal-business-closure、notify-template-management）+ agent-graph-prompt-configuration「待 D157 复验」过期。
7. I45 详细条目与 notify-template-management 已知限制中「M05-F01-01 待排期/🟦」过期（2026-08-27 已完成）；候选池同步修正。
8. p57 feature 边界「P58 未启动」过期。
9. known-issues 补 P58 阶段三同步轮注记（约定性缺失）。
10. knowledge 增补 P4/P34/P35/P37–P39 待对账指针与个人查询三类登记（方向 §4 要求逐项登记「我发起的/我的待办/我的已办」；知识层目前无独立条目，pending 裁决）。
11. decisions.md 头部档案范围注记 D1–D46 vs 实际 D1–D48。
12. features/bpm-plugin-architecture.md 遗留表 I47「未修复」标注（交付时点历史）。

> 本账本为只读审计产物；除本文件外未修改任何文件。所有修正均待方向 §5B 精确同步授权。