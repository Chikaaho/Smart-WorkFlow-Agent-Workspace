# U020 流程节点库语义配色

2026-10-24｜Executor｜XL｜聚焦差异已修正，A03 整体未通过

总 7 阶段：已完成 1「需求评估」；进行中 1「分支实施」；未开始 5「验收同步、合并、发布、发布后同步、结束」。

设计节点 `42:4` 的节点库按语义区分图标颜色：开始为绿色、结束为红色、条件/并行为琥珀色、动态并行与通知为棕色，审批/会签等保持品牌紫。原页面全部使用紫色，已完成对应语义色，并保持节点来源仍为服务端能力。

可见管理员/租户 0 在 1920×1080/DPR1 复核：节点库 220×928、节点项 188×34，开始/结束/条件分支/并行网关、审批/会签/动态并行、抄送/通知/事务动作的语义色均实际渲染；文档滚动面 1920×1080。最终图为 `screens/u020-process-designer-1920-26-final-cdp.png`，原图与 diff/overlay 见 `process-designer-23.json`、`process-designer-pixel-23.json`。

节点库诊断从 87.6386% 提升到 87.7567%，仍有图标形状、字体抗锯齿和三行真实节点缺失等差异，不能作为 A03 通过。全局顶栏、设计器工具栏、属性栏及现有业务图亦不同态，整体 A03 保持未通过。

最终门禁：8 项 `AppMainNav.spec.ts` 通过；typecheck、lint（0 error/0 warning）、完整 1797 项通过/3 跳过、构建均 exit 0。原始日志 `web-focused-26.log`、`web-typecheck-26.log`、`web-lint-26.log`、`web-test-26.log`、`web-build-26.log`。

Web 提交 `2b93e53ab9d67febb940b70bb2196384c02e280b` 已普通推送至 `origin/codex/0.2.0-ui-tenant-form-flow`，远端同 SHA、0/0；仅保留无关 `vite.config.ts` 在途修改。
