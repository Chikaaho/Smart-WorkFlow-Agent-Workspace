# 功能索引

> 最后更新：2026-08-11

| 功能 | 模块 | 状态 | 当前 Step | 备注 |
|------|------|:---:|------|------|
| agent-model-orchestration | M07-F01/F02/F04 | **COMPLETED** | Step1-9 全部 PASSED | F01（模型管理/编排/工具沙箱/会话/多Key轮询）+ F02（图设计器：定义CRUD/发布/解释执行/前端对接）全部完结，后端385/前端63f539t；todo 池：并行/循环节点、单步调试、执行历史持久化、F03知识库RAG |
| process-monitoring | M04-F06-01 | **COMPLETED** | S0-3 PASSED | 流程图高亮+流转记录（首批），阶段三收尾完成 |
| bpmn-adapter | M04 | COMPLETED | S0-3 PASSED, S4 SUPERSEDED | BPMN 查看器防腐层+XML 端点+两个前端消费方 |
| vue-flow-adapter | M07 | COMPLETED | S0-1 PASSED | Flow-graph 防腐层，零消费方 |
| auth-seam-completion | Auth | COMPLETED | 7 steps PASSED | 双 token 认证（access 内存+refresh cookie） |
| job-scheduler | M10 | COMPLETED | 7 steps PASSED | Quartz BEAN+FLOW 双类型 |
| storage-multi-provider | M10 | COMPLETED | 7 steps PASSED | 4 存储提供商（Local/MinIO/COS/Qiniu） |
| bpm-task-center | M04 | COMPLETED | 6 steps PASSED | 待办分页+驳回+已办+审批历史 |
| feature-checklist-sync | Meta | COMPLETED | 4 steps PASSED | I1 修复：功能清单状态同步 |
| kb-verification | Meta | COMPLETED | 2 steps PASSED | 知识库运行期验证 |
| sys-mgmt-crud | M02 | COMPLETED | 6 steps PASSED | 用户/角色/部门/岗位 CRUD |
| bpm-single-node-approval | M04 | COMPLETED | 4 steps PASSED | Walking Skeleton 第三环 |
| notify-frontend | M05 | COMPLETED | 3 steps PASSED | 通知列表+标记已读 |

---
> 本文件为压缩索引。各功能完整 Step 列表、证据链、测试统计在 `knowledge/features/<name>.md`（13 个功能追踪文件）。
> 需要时：创建 search_task，范围 `knowledge/features/<feature-name>.md`
