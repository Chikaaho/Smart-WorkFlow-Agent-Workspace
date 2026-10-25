# 0.2.0 统一执行·盘点缺口整改批次 03（审批校验提示弹窗）

2026-10-25｜Executor｜U020 分支实施（授权：direction-unified-020.md + 盘点差距清单第 4 项）

## 批次内容（Web `aaf2937`）

按设计原图（300-1808__100 审批 · 校验提示）把提交前必填校验的反馈从分散 toast/内联错误改为 **480px「校验提示」弹窗**：说明行「请完善以下必填项后再提交」+ 浅红底圆角条目（红色圆圈 ! 图标 + 「请填写X」字段名清单）+ 底部确定。

- `TaskDetail.vue`：新增 `validationDialogVisible/validationItems` 与 `openValidationDialog`；意见必填缺失由 `opinionMissingItems()`（逐字段 label，替代原单条 toast）与节点表单缺失由 `nodeFormMissingItems()` 聚合进弹窗；`validateNodeFormRequired` 重构为单一判定源 `collectNodeFormMissingLabels()`（内联错误块与弹窗清单共用，不弱化断言强度）；两处 preCheck（taskApproval 注入与 handleApprove）的 ElMessage.error 改开弹窗。内联错误块与星标保留，服务端 1401/2433 权威口径不变。
- locale 新增中英 3 键（校验提示标题/说明行/请填写前缀）。
- `TaskDetail.spec.ts` 新增 2 例：意见必填缺失打开弹窗列出「请填写审批意见」且不进入提交链；补齐后弹窗不出现、提交链正常。

## 验证

四连全绿：typecheck 0；lint 0 错误 0 警告；**1846 通过/3 跳过**（TaskDetail 38/38，净增 2=本批测试）；build 4.23s。原始输出留存本机命令记录。

## Git 事实

Web `c15a6bc..aaf2937` 已推送回读一致；工作树仅受保护 vite.config.ts。弹窗进入像素对照队列（A03 口径）。

## 与方向对照

差距清单 6 项中第 4 项（审批校验提示样式）关闭实现。剩余：通知/高级配置编辑化（下一批，先核实既有服务端配置端点）、富文本（待规划语义，需 Planner 语义裁决）。

总 7 阶段：已完成 1 需求评估；进行中 1 分支实施；未开始 5 验收同步、合并、0.2.0 发布、发布后同步、结束。
