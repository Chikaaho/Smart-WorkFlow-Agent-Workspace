# 功能索引

> 最后更新：2026-07-30

| 功能 | 模块 | 状态 | 当前 Step | 备注 |
|------|------|:---:|------|------|
| agent-model-orchestration | M07-F01/F02/F04 | **规划中** | Step9 PASSED | Step1-5（F01 模型管理/编排/工具沙箱/会话/多Key轮询）全部 PASSED（341 tests）；Step6 设计澄清完成（passed/step-6-f02-design-clarification.md）；Step7（F02 图定义 CRUD+版本+发布骨架）PASSED（362 tests，passed/step-7-graph-def-crud-publish.md）；Step8（F02 图解释执行引擎：AgentGraphInterpreter 纯 Java 解释器 + 执行 Service/端点 + §2-D 五项执行前校验 + 步数上限）PASSED（385 tests，passed/step-8-graph-interpreter-engine.md）；**Step9（F02 前端图设计器对接：V26 菜单迁移 + graphAdapter 转换层 + 图定义列表 + 图设计器画布 + 参数化静态路由）PASSED（前端 63f/539t，后端 385 持平，passed/step-9-graph-designer-frontend.md）——F02 全部完结（Step6-9）**；下一步（todo 池）：并行/循环节点、多变量执行上下文、单步调试、执行历史持久化、图节点级多Key轮询 |
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
