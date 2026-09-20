# 当前状态引用卫生整改方向

> 角色入口：执行（Executor）  
> 等级：L（跨 knowledge / todo / 双 coding 仓库的正式状态一致性修正）  
> 性质：非业务状态卫生；不新增功能、不核销 P 编号、不改变正式基线  
> 状态：PASSED（规划验收，2026-09-20）  
> 日期：2026-09-20

## 1. 权威输入

1. 探索结论：`search_fallback/post-p61-current-state-stale-reference-audit.md`；
2. P61 投影验收：`product/p61-user-facing-message-humanization/receipts/planning-review-final-state-projection-p61-01-passed.md`；
3. P61 最终裁决：`product/p61-user-facing-message-humanization/receipts/planning-final-review-terminal-sync-p61-user-facing-message-humanization-01-passed.md`；
4. P53 当前入口：`product/p53-global-ui-component-layout/receipts/planning-execution-prompt-p53-global-ui-component-layout-07.md`。

探索回传只提供定位证据；执行前须按工程治理读取相应工程宪法，并回读目标文件当前内容。若行号漂移，以表内语义锚点为准，不扩大搜索范围。

## 2. 目标与单一完成口径

只修正审计确认的 **13 项当前错误**，使当前入口一致表达：

- P60/0.1.0 已完成并已发布，终态方向位于 `passed/`；
- P61 已完成并经规划确认，无活动执行入口；
- P53 提示07是当前唯一主功能实现入口；
- 两仓当前版本与当前可体验范围为 0.1.0；
- 功能数 44、清单 ✅46/🟦22/⬜22、ADV64、Server 1362/0/0/0、Web 1185 passed + 3 skipped、迁移终点 V93 不变。

## 3. 精确整改矩阵

| ID | 当前文件/位置 | 唯一整改结果 |
|---|---|---|
| H1 | `knowledge/feature-reconciliation-index.md` 当前下一动作段 | 下一动作改为 P53 提示07；P60 终态方向指向 `passed/`；P61 探索文件名使用真实路径且只作已完成追溯，不再作为入口 |
| H2 | `knowledge/features/v0.0.2-oa.md` 当前状态头 | 阶段三方向改为 `passed/`，删除仍待移动的当前措辞 |
| H3 | 同文件当前状态行 | 改为 2026-09-07 已获规划确认，并引用对应 PASSED 复核 |
| H4 | 同文件当前发布结论 | 明确 2026-09-07 已发布及审计给出的两仓 SHA；不得改写其余历史基线 |
| H5 | `knowledge/features/v0.1.0-oa-completion.md` 当前执行入口 | 改为无活动入口（P60 已完成），终态方向指向 `passed/` |
| H6 | 同文件方向位置当前项 | `ready/` 改为 `passed/` |
| H7 | `Smart-WorkFlow-aPaaS-Web/README.md` 当前版本段 | 0.1.0 已发布 |
| H8 | 同 README 当前可体验段 | 当前口径为 0.1.0；不得将当前段降格为仍以 v0.0.2 为范围 |
| H9 | `Smart-WorkFlow-aPaaS-server/README.md` 当前版本段 | 0.1.0 已发布 |
| H10 | 同 README 当前可体验段 | 当前口径为 0.1.0 |
| H11 | `Smart-WorkFlow-aPaaS-server/功能清单.md` 当前焦点行 | P60 为 `COMPLETED（规划已确认，2026-09-15）`；Server 1362/0/0/0、Web 1185+3、V93；主任务入口为 P53 提示07 |
| H12 | `todo/v0.1.0-oa-plan.md` 顶部当前入口 | 改为 P53 提示07；P61 只保留完成追溯 |
| H13 | `knowledge/current-status.md` 当前入口叙述 | P60 终态方向由 `ready/` 改为 `passed/` |

## 4. 合法历史与禁止事项

以下内容不是整改目标：

- 历史事件列、历史回执、`knowledge/history/**`、`product/**/receipts/**`、`search_fallback/**` 中当时真实的旧状态；
- v0.0.2 的锁定基线、发布过程、版本标题和迁移历史；
- P53 业务实现、视觉证据、颜色、布局、组件、locale 内容；
- P61 八个文案值及其既有通过证据；
- 任何功能计数、P/I/ADV 状态、测试基线、数据库迁移、tag、Release、Git 历史。

禁止全局替换版本号、`ready/` 或“待规划确认”；只能按 H1—H13 的当前语义锚点修改。禁止顺手清理审计未列出的文档，禁止构建、测试、启动服务、浏览器验收、数据库动作、提交、合并、推送或发布。

## 5. 验证与证据

执行层提交前必须提供：

1. H1—H13 逐项“文件 + 当前语义锚点 + 修改后实际值”的回读表；
2. 定向扫描证明 13 个当前错误在对应当前段落为零；
3. 抽样证明审计 §3 所列合法历史仍保留，不以零命中作为通过条件；
4. `git diff --check` 及三工作树只读状态；
5. 明确声明业务代码、测试、迁移、Git 历史与远端均零动作；
6. 若目标文件已由在途任务改动，保留既有改动，仅提交本方向的最小增量并在回执披露。

无需运行任何业务测试。本任务的充分证据是目标文本逐项回读、定向反向扫描和合法历史抽样。

## 6. 独立执行与停止条件

本方向必须作为**独立执行任务**启动，不得追加到当前已运行较久的 P53 执行会话，不得进入 P53 的实施清单、回执、提交、验收或进度汇报。P53 继续只执行提示07，本任务不等待、打断或改变 P53。

本任务使用独立回执收口；也不重开 P61，不写入 P61 已完成提交。若目标文件存在 P53 在途修改，应保留并回读其改动，只形成可独立辨识的最小增量；无法无损区分时停止该单文件修改并在回执列明，不得覆盖，也不得把冲突处理转交给 P53 当前任务。

完成后提交：

`product/current-state-reference-hygiene/receipts/completion-receipt-current-state-reference-hygiene-01.md`

合法终态为 `EXECUTION_SUBMITTED`，等待规划独立复核。不得在回执中宣布 P53 通过、P61 重开或工作区其他未审计文档已全部清洁；不得把本回执合并写入 P53 或 P61 回执。
