# 功能索引

> 最后更新：2026-08-22（agent-token-usage-observability D174最终验收COMPLETED；13/13；功能数29）

| 功能 | 模块 | 状态 | 当前 Step | 备注 |
|------|------|:---:|------|------|
| agent-token-usage-observability | P8 / M07-F04-02 Token统计子集 | **COMPLETED** | D170功能级 + D172阶段三 + D174最终验收（2026-08-22） | 13/13；基线755/Agent267、82f/815t、V35；清单25/25/40、P8核销、M07-F04-02✅、第29个已完成功能。审查`product/agent-token-usage-observability/receipts/planning-final-review-d174.md`。 |
| agent-graph-prompt-configuration | M07-F02-02 | **COMPLETED** | D154功能级PASSED + D157阶段三最终复验PASSED（2026-08-21） | 12项功能标准全部通过；后端723/agent234、前端79f/775t、V34零迁移。M07-F02-02升✅、P6核销、清单24/26/40、第28个已完成功能；四份方向归档`passed/`。最终审查`receipts/planning-stage3-review-d157.md`。 |
| agent-graph-execution-observability | P7 第一子集 / M07-F02-04 | **COMPLETED** | D148 功能级 PASSED + D149 阶段三复验 PASSED（2026-08-21） | 标准1-11全过+§3.3同步；真实router/authGuard行为测试；后端685/0/0/0、agent模块197、前端78f/760t；V34零迁移；P7运行日志子集核销，单步调试保留；M07-F02-04保持🟦；第27个已完成功能。最终审查：`product/agent-graph-execution-observability/receipts/planning-stage3-review-d149.md` |
| role-menu-permission-parity | P1 / M02-F02-01 / M02-F03-01 | **COMPLETED** | D123 规划层最终验收 PASSED + 阶段三终态同步（2026-08-20） | D122 四类偏差已闭合（生产 403 契约 / 停用角色有效撤权 / Mock 双角色身份 / I53+I54 注册）；后端 674/0/0/0、前端 73f/681t、零 Flyway；M02-F02-01/F03-01 ✅、P1 核销、第 26 个已完成功能。 |
| user-group-membership | P28 / I36 / M01-F04-01 基础子集 | **COMPLETED** | D120最终确认（2026-08-19） | 功能十一项全部通过；后端 **647/0/0/0**、前端 **71f/646t**、V34双方言34条全链确认。**I36关闭、P28核销、M01-F04-01🟦终态（✅21/🟦29/⬜40）、功能数25**；D118/D119 当前态残留已修正，三份方向归档 `passed/`，ready/ 已清空。最终验收 `product/user-group-membership/receipts/planning-stage3-review-d120.md` |
| pg-v13-migration-chain-repair | I52 / PostgreSQL Flyway | **COMPLETED** | D110功能验收 + D111阶段三复验（2026-08-19） | PG新库33条、checksum守卫、多平台17.5.0、H2 11项、项目级600/0/0/0全绿；I52 正式关闭；主方向与同步方向已归档 `product/pg-v13-migration-chain-repair/passed/` |
| agent-model-management-frontend | P5 / M07-F01-01～05 | **COMPLETED** | 补证最终复验 D107（2026-08-19） | D106 的标准5/6/7缺口已闭合：`other`、远端4xx可达、未认证401及Mock/真实连通性语义均有自动化证据；后端591/0/0、前端69f/628t四连全绿。P5核销，I45中M07-F01子集关闭，五行✅获规划确认。归档 `product/agent-model-management-frontend/passed/` |
| department-query-filtering | I31 / M01-F01-04 | **COMPLETED** | 最终复验通过（D104，2026-08-18） | 业务与测试九项全部通过；后端582/0/0/0、前端66f/602t四连、零Flyway；D103终态同步缺口已修正，I31关闭、M01-F01-04为✅。归档 `product/department-query-filtering/passed/` |
| user-org-association-query | I32 / I34 / I35 / I36（剩余子集）/ M01 + M02 | **COMPLETED** | 功能级最终验收 D101 + 阶段三同步（2026-08-18） | 后端563/0/0/0、前端66f/577t四连、H2新库/升级链10 tests；I32/I34/I35关闭，I36仅关闭普通角色绑定子集；PG运行期与进程快照为非阻塞环境待办。方向及同步回执已归档。 |
| admin-role-governance | P24 / I49 / System + Job + Storage | **COMPLETED** | 阶段三最终收尾通过（D97，2026-08-18） | D93十一项+D96功能终审+阶段三知识同步全部闭合；P24核销、I49关闭、I36仅关闭本轮子集。归档 `product/admin-role-governance/passed/` |
| bpm-h2-v8-compat | P10 / I47 / BPM | **COMPLETED** | 功能级 PASSED（D87/D88，2026-08-17） | H2 V8 生成列 `active_key` + 唯一索引等价实现 active 条件唯一；PG V8 零改动；永久 H2 全链 30/30 migrate+validate；后端 543/0/0。归档 `product/bpm-h2-v8-compat/passed/` |
| sysrole-v5-column-alignment | P13 / I26 / System | **COMPLETED** | 功能级 PASSED（2026-08-17） | 以 V5 链尾 `built_in`/`remark` 为权威契约：SysRole.java 两处 @TableField 修正（字段名/JSON 键不变）+ schema-datascope-h2.sql/AuthFlowIntegrationTest 建表索引 INSERT 注释全对齐链尾；sw-biz-system 111/0/0 + 项目级 527/0/0 全绿；Flyway 零迁移、前端零改动、P10/P12 零触碰。已归档 `product/sysrole-v5-column-alignment/passed/` |
| status-semantics-alignment | I51 / System | **COMPLETED** | 功能级 PASSED（2026-08-17） | 用户/部门前端 status 契约纠正并集中常量：用户 0/1/2=正常/停用/锁定，部门 0/1=正常/停用；角色/岗位核对正确且零改动；前端 66f/569t→66f/576t 四连全绿；后端零修改。回执 `product/status-semantics-alignment/receipts/` |
| bpm-plugin-architecture | M04-F08-01 | **COMPLETED** | 功能级 PASSED（D81/D82，2026-08-16） | BPM 可插拔机制纯重构轮：后端 B1-B3（NodeTypeRegistry 4 预留位扩充/GraphToBpmnTranslator switch→NodeTypeTranslator SPI 注册表翻译/可插拔性证明 TEST_NODE）+前端 F1-F3（DynamicField 8 控件 registry 化/GraphDesigner 属性面板/EMAIL+PROBE 测试）；后端521→527/前端63f552t→66f569t；Flyway 零迁移；I47/I48 已登记。adapter SPI 偏差经 D82 裁定；历史前端内存例外已于 2026-08-17 在正式 2G 上限下四连补验关闭。回执 `product/bpm-plugin-architecture/receipts/` |
| data-scope-enforcement | M02-F04-01 | **COMPLETED** | 功能级 PASSED（D77/D79，2026-08-15） | 数据权限五档端到端落地：装配去硬编码（多角色最宽+CUSTOM并集）+DeptScopeProviderImpl 递归（@Lazy破环）+V30 sys_role_dept+7表纳管（仅sys_user可@DataScope直标，余6表自定义Mapper等效条件+DataScopeFilter传参）+前端角色页五档+部门树；后端435→521（+86）/前端63f/552t持平；手写SQL通道不纳管已记 I46 |
| checklist-gap-hardening | M01/M10 | **COMPLETED** | 第一批 PASSED（D74-D76，2026-08-13） | I33 停用登录/refresh 双入口拦截 + I43/I44 V29 job/storage 生产菜单 seed；后端426→435（源码口径+10新测）/前端零改动；§3.3第10项知识库同步首跑；后续批次（DataScope 等）另行规划 |
| agent-model-orchestration | M07-F01/F02/F04 | **COMPLETED** | Step1-12 全部 PASSED（D53-D71） | 后端405→426（+21）/前端63f552t不变（本轮未做前端）；Step12=执行历史持久化：V27/V28双表+解释器轨迹采集(branchId/nodeSeq)+错误分类8类+查询端点；todo 池剩余：单步调试、图节点级多Key轮询、F03知识库RAG |
| process-monitoring | M04-F06-01 | **COMPLETED** | S0-3 PASSED | 流程图高亮+流转记录（首批），阶段三收尾完成 |
| bpmn-adapter | M04 | COMPLETED | S0-3 PASSED, S4 SUPERSEDED | BPMN 查看器防腐层+XML 端点+两个前端消费方 |
| vue-flow-adapter | M07 | COMPLETED | S0-1 PASSED | Flow-graph 防腐层，零消费方 |
| auth-seam-completion | Auth | COMPLETED | 7 steps PASSED | 双 token 认证（access 内存+refresh cookie） |
| job-scheduler | M10 | COMPLETED | 7 steps PASSED | Quartz BEAN+FLOW 双类型 |
| storage-multi-provider | M10 | COMPLETED | 7 steps PASSED | 4 存储提供商（Local/MinIO/COS/Qiniu） |
| bpm-task-center | M04 | COMPLETED | 6 steps PASSED | 待办分页+驳回+已办+审批历史 |
| feature-checklist-sync | Meta | COMPLETED | 5 steps PASSED（Step5=D72/D73，2026-08-12） | I1 修复：功能清单状态同步；Step5=二次同步（I1复发，89条审计修正34处，清单终态✅7/🟦40/⬜42，known-issues +I31-I45） |
| kb-verification | Meta | COMPLETED | 2 steps PASSED | 知识库运行期验证 |
| sys-mgmt-crud | M02 | COMPLETED | 6 steps PASSED | 用户/角色/部门/岗位 CRUD |
| bpm-single-node-approval | M04 | COMPLETED | 4 steps PASSED | Walking Skeleton 第三环 |
| notify-frontend | M05 | COMPLETED | 3 steps PASSED | 通知列表+标记已读 |

---
> 本文件为压缩索引。各功能完整 Step 列表、证据链、测试统计在 `knowledge/features/<name>.md`。已完成功能 **29 个**；agent-token-usage-observability为第29个（D174最终验收COMPLETED）。
> 需要时：创建 search_task，范围 `knowledge/features/<feature-name>.md`
