# 功能索引

> 最后更新：2026-07-28

| 功能 | 模块 | 状态 | 当前 Step | 备注 |
|------|------|:---:|------|------|
| process-monitoring | M04-F06-01 | IN_PROGRESS | S1 PASSED, S2 READY, S3 PENDING | 流程图高亮+流转记录（首批） |
| bpmn-adapter | M04 | COMPLETED | S0-3 PASSED, S4 SUPERSEDED | BPMN 查看器防腐层+XML 端点+前端入口 |
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
> 本文件不包含：各功能的具体 Step 拆分和执行证据链、完成日期、关联的设计决策和已知问题交叉引用
> 需要时：创建 search_task，范围 `knowledge/features/<feature-name>.md`（13 个功能追踪文件）
