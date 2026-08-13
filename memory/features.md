# 功能索引

> 最后更新：2026-08-13

| 功能 | 模块 | 状态 | 当前 Step | 备注 |
|------|------|:---:|------|------|
| data-scope-enforcement | M02-F04-01 | **IN PROGRESS** | 方向文档已下发（D77，2026-08-13） | 数据权限五档完整落地：装配去硬编码+DeptScopeProvider+sys_role_dept+最小强制集纳管+前端角色页 UI；手写 SQL 通道不纳管（记限制）；等执行层完成回执 |
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
> 本文件为压缩索引。各功能完整 Step 列表、证据链、测试统计在 `knowledge/features/<name>.md`（13 个功能追踪文件）。
> 需要时：创建 search_task，范围 `knowledge/features/<feature-name>.md`
