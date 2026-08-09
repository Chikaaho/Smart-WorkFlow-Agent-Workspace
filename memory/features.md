# 功能索引

> 最后更新：2026-07-30

| 功能 | 模块 | 状态 | 当前 Step | 备注 |
|------|------|:---:|------|------|
| agent-model-orchestration | M07-F01/F02/F04 | **规划中** | Step4 方案就绪 | Step1（CRUD+加密+连通性测试）PASSED；Step2（最小编排引擎+动态ChatModel+动态装载）PASSED；Step3（工具沙箱：内部白名单+外部HTTP，FunctionToolCallback+lambda，DB驱动）PASSED（307 tests）；Step4（F04 对话交互）方案已起草（passed/ 待执行）：V21/V22/V23+ThreadLocal messages 注入+消息持久化+2 查询端点，目标 ≥325 tests；方案在 ready/step-4-f04-conversation.md |
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
