# 0.2.0 统一执行·盘点缺口整改批次 01

2026-10-25｜Executor｜U020 分支实施（授权：direction-unified-020.md §当前剩余交付 1 + 盘点差距清单）

## 批次范围

承接 ui-implementation-inventory-01.md 差距清单两项：**会签列表聚合详情（60:190）**与**应用数据列表目录收起（272:1296）**。实施前实际打开两处设计原图（60-190__16 会签列表详情.png、272-1296__37 应用数据列表 · 目录收起.png、272-1144 展开态对照）确认目标形态：会签记录=780px 弹窗（说明+全部/已同意/已驳回筛选+统计行+姓名/部门/意见/时间/状态表）；目录收起=整栏隐藏+左缘 20×40 浮动展开按钮、展开态按钮在应用名行右端。设计工号为设计表列，运行数据源 ApprovalHistoryItem 无工号字段，未虚造该列。

## 实际修改（Web `codex/0.2.0-ui-tenant-form-flow`，提交 `14ef300`）

| 文件 | 修改 |
| --- | --- |
| `src/modules/form/components/AppTreeNav.vue` | 新增整栏收起：应用名行右端收起按钮（DArrowLeft）→ aside 0 宽 is-collapsed → 左缘浮动展开按钮（20×40、圆角右、白底）；用户端应用内页与管理端工作台共用组件同步获得该能力 |
| `src/modules/form/components/AppTreeNav.spec.ts` | 新增 3 项聚焦测试：默认展开/收起后树隐藏+展开按钮出现（aria-label 展开目录）/点击展开恢复 |
| `src/modules/workflow/components/InstanceFlowPanel.vue` | 会签聚合：审批详情 tab 顶部对"同 nodeKey 真实参与人≥2"的节点渲染聚合入口（会签记录·节点名 + N人已同意/N人驳回/N人待处理 + 查看全部会签记录→）；点击开 780px 会签记录弹窗（说明行 + 全部/已同意/已驳回 tab + 统计行含并行会签规则 + 五列表格：姓名/所属部门/审批意见/审批时间/状态）。接线既有零引用 locale 键 signGroupTitle/signAgreed/signRejected/signPending/parallelSignRule/viewAllSignRecords，派发通知行不进入聚合与弹窗（与 peopleRows 同口径） |
| `src/modules/workflow/components/InstanceFlowPanel.spec.ts` | 新增 2 项测试：多人节点聚合统计且单人节点不聚合；弹窗默认全部 2 行、筛选已同意剩 1 行、已驳回 0 行 |
| `src/locales/zh-CN.ts` / `en-US.ts` | 新增 collapseNav/expandNav/opinionDeptLabel/approvalTimeLabel/signGroupHint/signTabRejected 中英键 |
| `AppCenterDetail.spec.ts` / `AppWorkspace.spec.ts` | 页头子元素断言 3→4（含收起按钮），并断言收起按钮存在 |

vite.config.ts 在途改动（allowedHosts）继续保留未提交。

## 验证（四连原文可复算）

- typecheck：`vue-tsc -b --noEmit` 退出 0，无输出。
- lint：`eslint .` 退出 0，**0 errors / 0 warnings**（本次 lint --fix 后全仓格式归零；上批审查记录的 e2e/visual 1 条 prettier 警告在当前 HEAD 工作树已不存在，该文件本批未改动）。
- test：`vitest run` 全量 **1844 通过 / 3 跳过（212 文件：211 通过/1 跳过）**，较锁定基线 1839/3 净增 5 项=本批新增测试，无失败。
- build：`vite build` 成功（built in 3.44s）。

原始输出未截断保存在本机命令记录；聚焦测试先行通过（AppTreeNav 3/3、InstanceFlowPanel 6/6）后跑全量。

## 与方向对照

- 差距清单 6 项中第 2（会签聚合）、第 6（目录收起）已关闭实现，进入像素对照队列（A03 口径：reference=设计原图，runtime=运行截图，尚未采集——本批为行为/结构实现，视觉对照随所属页面批次做同态比较，不冒称像素通过）。
- 第 1（富文本）待规划语义；第 3（驳回/退回/催办弹窗）、第 4（审批校验提示样式）、第 5（通知/高级配置编辑化）为下一批。
- 会签聚合的会签组判定使用"同 nodeKey 真实参与人≥2"这一数据层信号（ApprovalHistoryItem 无显式会签标记），与 flowRail/审批详情同口径；若后端后续提供显式会签标记可替换判定源，不影响页面结构。

## Git 事实

Web 推送 `8b564c5..14ef300` → `origin/codex/0.2.0-ui-tenant-form-flow`，回读一致；工作树仅剩受保护 vite.config.ts。根仓盘点/传播批次见 ui-implementation-inventory-01.md 及 knowledge 记录（21fa164c/eac756ed/85e7b843）。

总 7 阶段：已完成 1 需求评估；进行中 1 分支实施；未开始 5 验收同步、合并、0.2.0 发布、发布后同步、结束。
