# 功能索引

> 最后更新：2026-08-17

| 功能 | 模块 | 状态 | 当前 Step | 备注 |
|------|------|:---:|------|------|
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
> 本文件为压缩索引。各功能完整 Step 列表、证据链、测试统计在 `knowledge/features/<name>.md`（18 个功能追踪文件，不含 `_template.md` 模板；agent-model-orchestration 无独立追踪文件，详情在 `product/agent-model-orchestration/passed/`）。
> 需要时：创建 search_task，范围 `knowledge/features/<feature-name>.md`
