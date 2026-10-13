# BF20261013-020 执行回执：表单分类型元数据与审批意见表单独立维护

2026-10-14｜执行者提交（fix-loop 持续修复批次）；Owner 原反馈 2026-10-13：“低代码表单需要分类型，从元数据区分。审批意见表单放到「流程管理」分类中单独维护，不能跟业务表单混在一起，流程节点选的是审批意见表单而不是业务表单”。

## 范围与实现

- **元数据分型（Server）**：`sw_form_def` 新增 `form_type`（V0.1.10，默认 'BUSINESS'）；实体/DTO/创建请求携带 formType；`pageFormDefs` 支持按类型过滤；新建审批意见表单落 'APPROVAL_COMMENT'。
- **独立维护面（Web）**：流程管理新增「审批意见表单」维护页（菜单 9111，parent 5=流程管理，path workflow/approval-form）；新建→设计器→发布链路复用既有表单能力。
- **节点选择器（Web）**：审批类节点的表单选择弹窗改为「选择审批意见表单」，服务端按 APPROVAL_COMMENT 过滤 + 客户端已发布过滤；业务表单不再出现在候选。
- **不混用（Web）**：表单管理列表、引用表单弹窗、事务动作目标、触发器目标表单候选均按 BUSINESS 过滤；审批意见表单不进入业务候选，业务表单不进入节点候选。

## 验证

- 服务端：form-biz 180/180；jar 重建后启动成功（Flyway V0.1.10 + R__ 菜单种子应用；菜单 9111/授权 9312 落库核对一致）。
- Web 四门：lint 0 错 3 警、typecheck exit 0、vitest 1450 通过 3 跳过、build ✓。
- 实景（应用内浏览器，可见交互）：流程管理显示「审批意见表单」→ 新建/发布成功（DB form_type=APPROVAL_COMMENT、PUBLISHED）→ 流程节点「选择表单」弹窗仅列审批意见表单（业务表单「测试1」不在列）→ 表单管理列表仅列业务表单。证据：evidence/bf020-network-index.md、bf020-node-form-selector.png、bf020-approval-form-list.png。
- 无副作用：Owner 流程定义 graph_json 前后 md5 一致；测试数据「审批意见测试-实施A」（已发布）留在环境内供 Owner 点验，可经列表「停用」处置。

## 提交

- Web：codex/bugfix-20261013（见台账执行证据列与提交回读）。
- Server：codex/bugfix-20261013（迁移/实体/服务/控制器/测试 DDL 同步）。
- 根仓：台账 BF20261013-020 行 + 本回执 + 证据目录 + 两子仓 gitlink。

## 状态

待 Owner 点验（与 BF001—019 同批）。剩余待决策项：子流程表格行级逐行条件过滤（需引擎扩展）、节点字段三态运行时渲染（均待 Owner/Planner 明示后另行登记）。
