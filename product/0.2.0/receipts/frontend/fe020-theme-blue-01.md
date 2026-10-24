# fe020-01 默认蓝色主题与流程节点语义色

2026-10-24｜Executor（前端）｜XL｜IN_PROGRESS｜自验通过，待 Planner 验收

总 7 阶段：已完成 1「需求评估」；进行中 1「分支实施」；未开始 5「验收同步、合并、发布、发布后同步、结束」。本回执是 0.2.0 并行前端首批交付，覆盖全局主题、默认蓝色、主题交互和 U020-26 的两项节点库配色；不表示 A03/A04/A05 或整版功能通过。

## 目标、范围与结果

1. 首次进入、清除偏好和“恢复默认”使用蓝色；用户明确保存的紫、青或自定义偏好刷新后保持。
2. 主题选择先本地预览，取消不落盘；“完成”后写入唯一主题偏好键，不接触身份、租户或权限。
3. 非法格式和低对比自定义色拒绝，当前主题继续可用；存储写入失败时当前会话仍切换。
4. 顶栏、侧栏、按钮、链接、标签、焦点、禁用、选中、流程节点和脚本面板使用同一组语义变量，Element Plus 消费同步更新。
5. 会签节点固定棕色；动态并行节点跟随当前品牌色，蓝、紫、青、自定义主题均实际取色。

实际行为已通过可见 IAB（`headless=false`）在 1920×1080/DPR1 和 1366×768/DPR1 验证，375×812 检查既有门户入口。当前后端 `localhost:8080` 不可达，因此浏览器交互使用 `dev:mock`，证据层级为 `ISOLATED_REGRESSION`，不替代后续真实后端 A16/A17 联调结论。

## 修改文件

Web 分支 `codex/0.2.0-ui-tenant-form-flow`，从审查快照 `2b93e53` 继续，提交 `d6ee85d419da4b116f4bdf1066ed58f8b6582df7`。共 28 个主题批次文件：

- 主题核心：`src/foundation/theme.ts`、`src/foundation/theme.spec.ts`、`src/styles/tokens.css`、`src/styles/tokens.spec.ts`、`src/layouts/components/ThemeDialog.vue`、`src/layouts/components/ThemeDialog.spec.ts`、`src/locales/zh-CN.ts`、`src/locales/en-US.ts`。
- 公共消费面：`src/views/LoginPage.vue`、`src/layouts/components/AppTopbar.vue`、`src/layouts/components/AppSidebar.vue`、`src/components/ProcessGraphView.vue`、`src/modules/workflow/components/InstanceFlowPanel.vue`、`src/modules/workflow/components/WorkspaceBoard.vue`、`src/modules/agent/components/execution/NodeTrajectory.vue`、`src/modules/notify/views/NotifyInboxMobile.vue`。
- 业务页面与设计器：`src/modules/workflow/views/ProcessDesigner.vue`、`ProcessInstanceList.vue`、`TaskGraphView.vue`、`ThemeRuleDialog.vue`、`TxnBatchConsole.vue`、`ApproverCandidatesDialog.vue`、`src/modules/form/views/FormDesigner.vue`、`src/modules/form/designer/FieldListPanel.vue`、`src/modules/form/designer/HistoryVersionsDialog.vue`。
- 验证资产：`e2e/visual/theme-blue.spec.ts` 新增；`e2e/visual/auth.ts`、`e2e/visual/baselines.spec.ts` 固定历史 P53 紫色基线所代表的主题。

`vite.config.ts` 的 `allowedHosts` 在途修改保持原归属，未暂存、未提交。

## 实现摘要

- `DEFAULT_THEME` 改为蓝色 `#2563eb`，缺失、损坏、未知名称或低对比自定义值回落蓝色；明确保存的旧紫色值仍读作紫色。
- `themeCssVariables()` 统一输出品牌阶、导航、Element Plus 主色阶和语义变量；全局应用与弹窗预览复用同一数据源。
- 自定义色使用 WCAG 相对亮度检查，白底文字/白字主按钮对比度低于 4.5:1 时拒绝。
- “恢复默认”清除 `sw.appearance.theme` 并立即应用蓝色；选择预设或合法自定义色后恢复为显式偏好。
- P53 紫色设计使用其原令牌；登录页紫色渐变保留原图观感，其他主题按品牌色派生。
- 页面内主色 fallback 与浅紫常量收敛到 `--sw-color-primary*` 或语义色；应用图标的独立业务颜色不并入全局主题。
- U020-26：`CONSENSUS → --sw-process-consensus (#945f00)`，`DYNAMIC_PARALLEL → --sw-process-dynamic-parallel (var(--sw-color-primary))`；通知和 IoT 的棕色语义保持不变。

## 实际验证

工程门禁均以 `NODE_OPTIONS=--max-old-space-size=2048` 执行，完整原文保存在 `C:/Users/hjxch/.codex/evidence-020/theme-blue/`：

| 检查 | 结果 | 完整原文 |
| --- | --- | --- |
| `pnpm typecheck` | exit 0 | `web-typecheck-final.log` |
| `pnpm lint` | exit 0，0 warning | `web-lint-final.log` |
| `pnpm test` | 204 文件通过、1 文件跳过；1802 测试通过、3 跳过 | `web-test-final.log` |
| `pnpm build` | exit 0；仅依赖 `#__PURE__` 注释及插件耗时提示 | `web-build-final.log` |
| 主题 E2E（chrome-1920） | 3/3 通过 | `web-e2e-theme-final.log` |

可见浏览器证据：

- 默认蓝：`screens/workspace-default-blue-final-1920.png`；计算主色 `#2563eb`，`data-theme=blue`，视口 1920×1080/DPR1。
- 主题预览取消：`screens/theme-dialog-preview-purple-final-1920.png`；根页面保持蓝色，预览按钮为紫色 `rgb(111,45,255)`，取消后根主题仍为 `#2563eb`。
- 蓝/紫/青/自定义：`screens/process-designer-blue-1920.png`、`process-designer-purple-1920.png`、`process-designer-teal-1920.png`、`process-designer-custom-1920.png`。
- 非法对比度：`screens/theme-dialog-invalid-contrast-1920.png`；错误可见，弹窗保持打开，当前主题不回退或损坏。
- 恢复默认并刷新：`screens/process-designer-default-blue-after-reload-1920.png`；刷新后主色仍为 `#2563eb`。
- 21 设置入口：`screens/form-designer-settings-blue-1920.png`；三页签 x=780/900/1020、各 120×48，组合中心 960，设置菜单含“权限/事件”，文档宽 1920。
- 23/24：`screens/process-designer-blue-1366.png`、`tenant-admin-blue-1920.png`、`tenant-admin-blue-1366.png`；1920 管理端品牌区 236px、主导航首项 x268/112×40、折叠按钮不显示；1366 折叠入口可见、文档宽 1366；流程设计器 1920 画布 `[236,168,1332,896]`、属性栏 336px，1366 画布宽 778、属性栏 336、无横向溢出。
- 375：`screens/workspace-blue-375.png`；视口 375×812/DPR1，侧栏隐藏、顶部主入口可见、文档宽 375。

Figma 原始读取（会话 `28e9d8bd-18a8-472e-9087-26b60eee028d`，均为 1920×1080）：

- `42:4` 紫色流程设计：`screens/design-process-designer-42-4-purple.png`。
- `366:6765` 蓝色流程设计：`screens/design-process-designer-blue-366-6765.png`。
- `355:6574` 主题画框：`screens/design-theme-355-6574.png`。

节点库计算后实际色值：

| 节点 | 蓝色主题 | 紫色主题 | 青色主题 | 自定义 `#123456` |
| --- | --- | --- | --- | --- |
| 会签 | `rgb(148,95,0)` | `rgb(148,95,0)` | 未单独取色，静态 token 不变 | 未单独取色，静态 token 不变 |
| 动态并行 | `rgb(37,99,235)` | `rgb(111,45,255)` | `rgb(8,127,140)` | `rgb(18,52,86)` |

原始 JSON：`theme-default-blue-final.json`、`theme-preview-final.json`、`theme-purple.json`、`theme-teal-custom.json`、`theme-invalid.json`、`theme-recovery-reload.json`、`process-designer-purple.json`、`process-designer-blue.json`、`process-designer-geometry-1920.json`、`process-designer-1366.json`、`portal-shell-1920.json`、`tenant-admin-1920.json`、`tenant-admin-1366.json`、`workspace-375.json`、`form-designer-settings-1920.json`。

## 验收对照

| 条目 | 本次结果 |
| --- | --- |
| A01 基线与保护 | 分支和 HEAD 已核实；Web 从 `2b93e53` 续做，提交推送 `d6ee85d`；`vite.config.ts` 在途修改保留。 |
| A02 设计覆盖 | 本轮只承接主题交互与 `42:4` 节点库语义色；完整 258 画框/25 组件族仍未覆盖，不能据此判 A02 通过。 |
| A03 像素还原 | 未取得完整画框同态 reference/runtime/diff；节点库关键语义色已与原图对应，A03 整体仍未通过。 |
| A04 UI 交互 | 本轮范围内主题首次/持久/预览/取消/恢复/非法值、蓝紫青自定义和 1366/375 可达性均取得可见结果；其他页面交互未包含。 |
| A05 文案与手册 | 本轮仅修正主题色名称及对比度错误提示；全量审阅与手册不在本批结论内。 |
| U020-26-palette-color | 自验通过：会签固定棕、动态并行跟随品牌色，蓝/紫实际取色与要求一致；待第二次正式验收。 |

## 已知边界与后续

- 当前后端不可达，本轮主题浏览器证据为 `dev:mock` 隔离验证；真实后端登录、权限、持久化与 A16 联合链仍待后端可用后执行。
- 本批收件已包含后端 `be020-capability-contract-01.md` 与 `be020-ext-datasource-grant-02.md`；后者已推送 Server `5e70b47444424f27557c67c212c39ea58bb6b1db`，前端 F020 数据源界面按其中的授权、契约清单和启停契约继续接入。
- 流程设计器当前页面仍是三节点且未选中，未证明多分支、会签选中属性、审批人来源、会签条件、脚本与高级配置同态；这是下一批流程设计器工作的明确缺口。
- 仓库既有 Playwright P53 基线仍对应旧界面：本轮同批运行结果为 1 通过/5 未通过，原因分别包括旧登录与壳快照、旧主导航 x=240 断言及一次 mock 会话跳转竞态；这些结果未用于本轮验收。主题专用的新增 E2E 独立为 3/3 通过。
- 完整 258 画框覆盖、其余 22 个组件族、F020 子表/数据源、J020 草稿转正式提交、W020 可见办理与 A05 文案手册继续在 `IN_PROGRESS`，不核销 P、不修改正式功能数或基线。

## Git 与回读

- Web 提交：`d6ee85d419da4b116f4bdf1066ed58f8b6582df7`，信息 `feat(ui): 完成默认蓝色主题与节点语义色`。
- 推送后 `HEAD` 与 `origin/codex/0.2.0-ui-tenant-form-flow` 同 SHA，领先/落后 0/0。
- 工作树保留 `M vite.config.ts`；其它主题批次文件已提交。
- 本回执和根状态、后端首批交接的提交推送在根仓单独回读。

## 自验结论

主题、默认蓝色、持久偏好、预览确认/取消、非法值恢复、全组件语义变量和 U020-26 节点配色已完成本轮适用自验。结论为“自验通过，待规划验收”；A03/A04/A05 整体及整版 0.2.0 仍为 `IN_PROGRESS`。
