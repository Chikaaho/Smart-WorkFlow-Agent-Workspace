# 审批人表单字段策略、退回说明、会签行查看与行内校验

2026-10-26｜Executor｜批次38，对应 42:4/49:240、60:190、273:2001、300:1808；补齐设计稿已有、运行时缺失的前端控制。

## 变更

- Web `0b46115..82d036a`（`codex/0.2.0-ui-tenant-form-flow`，已推送）：
  - 审批人策略白名单恢复 `FORM_FIELD`（表单字段）：设计 42:4 的“指定人员/表单组件/JS 脚本”来源可选；对象类型（人员/部门）、取值范围（主表/表格字段）与字段选择沿用既有 P63 面板。
  - 会签记录弹窗统计补“参与人数 / 已同意 / 驳回 / 待处理”，记录表新增逐行“查看”，复用既有 `openOpinionDetail` 打开原始意见表单。
  - 退回申请弹窗新增“退回说明（可选）”文本域；`confirmReturn` 将说明写入 `comment` 与 `opinionData.comment`，随 RETURN 命令提交。
  - 审批意见必填缺失时，除既有校验清单弹窗外，在对应字段下显示行内红字并加红框；用户补齐后行内提示即时消失。
- 新增中英文 `returnCommentLabel`、`validationRequiredInline` 文案。
- `TaskDetail.spec.ts` 增加退回说明命令载荷断言、行内校验出现/补齐消失断言；`InstanceFlowPanel` 沿用既有 6 项测试。

## 真实链/测试

1. 设计器选中 A16 `node_1` → 基础属性 → 审批人策略下拉，实际选项出现“表单字段”；选择后显示对象类型/取值范围/主字段控件。该次选择未保存，刷新后草稿仍为 `FIXED_USER`（PG 直读确认）。
2. 退回说明：单测构造 `allowedActions=['RETURN']`、历史节点 `node_prev`，调用 `confirmReturn`，断言 `acceptTaskAction('task-001','return',{action:'RETURN',returnTargetNodeId:'node_prev',comment:'请补充材料',opinionData:{comment:'请补充材料'}})`。
3. 行内校验：必填审批意见缺失时 `opinionFieldInvalid('comment')=true`；补齐 `opinionData.comment` 后变为 false，不进入提交链。
4. 会签记录：弹窗统计与逐行“查看”按钮由真实 `approvalHistory` 行渲染；点击复用意见详情弹窗（浏览器入口此前已可用）。

## 覆盖矩阵回填

- 42:4 流程设计器：审批人策略含表单字段（补证）
- 60:190 会签列表详情 → 已实施（统计 + 逐行查看）
- 273:2001 退回申请 → 已实施（目标 + 退回说明）
- 300:1808 审批·校验提示 → 已实施（清单 + 行内红字/红框）

## 门禁

- Web 四连 exit=0：typecheck 0、eslint 0/0、vitest **215 文件通过/1 跳过，1872 通过/3 跳过**、build 4.04s（`/tmp/web-fourgate-38.log`）；`TaskDetail.spec.ts` 41/0、`InstanceFlowPanel.spec.ts` 6/0。
- 服务端零改动。

## 未验证/边界

- 补签仍未加入活动任务“更多”菜单：现有产品测试明确“补签不是活动任务动作”，设计 273:1977 与该口径冲突，保留产品待决，不擅自扩大。
- 催办仍未提供接收人选择、且只对发起人展示；设计 273:2025 的审批菜单催办受后端能力限制，未改。
- 意见详情附件仍为只读展示，未接文件下载/查看。
- 表单字段策略只验证入口与子面板，未保存/发布该策略；真实运行期解析沿用既有 P63 链。
- 无修复后截图（宿主 surface/rAF/OS 捕获限制），同态像素未通过。
- 0.2.0 IN_PROGRESS，未核销 P、未晋级基线；等待 Planner 独立复核。
