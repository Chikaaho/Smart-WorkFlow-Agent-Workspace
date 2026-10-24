# fe020-04 前端主题与表单流程批次提交

2026-10-25｜Executor（前端）｜XL｜IN_PROGRESS｜本批自验通过，待 Planner 验收

总 7 阶段：已完成 1「需求评估」；进行中 1「分支实施」；未开始 5「验收同步、合并、发布、发布后同步、结束」。本回执是 0.2.0 前端本批的正式提交入口，明细保留在 `frontend/fe020-theme-blue-01.md`、`frontend/fe020-process-designer-selected-02.md` 和 `frontend/fe020-forms-flow-settings-03.md`。

## 交付结果

Web 任务分支 `codex/0.2.0-ui-tenant-form-flow` 连续三个提交均已普通推送：

| 提交 | 内容 | 对应回执 |
| --- | --- | --- |
| `d6ee85d419da4b116f4bdf1066ed58f8b6582df7` | 默认蓝色主题、偏好持久与恢复、预览取消、非法值拒绝、Element Plus 与公共组件消费；会签固定棕、动态并行随品牌色 | `frontend/fe020-theme-blue-01.md` |
| `8c51283137ef0f312c8cbc0d0beec405d3866b04` | 13 节点多分支会签夹具、选中节点属性栏、审批人/意见表单/比例/脚本/监听器可见状态 | `frontend/fe020-process-designer-selected-02.md` |
| `8b564c5bdffff2e0ffbff720ebc20effede4c288` | F020 数据源授权与契约、权限/默认列表、1120px 子表字段弹窗；J020 草稿转正式提交事件；W020 授权代理、取消加签、Long ID 与催办修正 | `frontend/fe020-forms-flow-settings-03.md` |

主题默认色为 `#2563eb`，首次进入、恢复默认和清除偏好均回到蓝色；明确保存的紫、青和自定义值刷新后保持。会签在四档主题下保持 `rgb(148,95,0)`，动态并行分别取蓝 `rgb(37,99,235)`、紫 `rgb(111,45,255)`、青 `rgb(8,127,140)`、自定义 `#123456`。

F020 的受控数据源页签支持授权主体增删保存后回读、查询契约清单与启停、已授权契约选择；权限工作区回读主表与子表字段权限及默认列表；子表字段从盖层画布改为 1120px 居中弹窗，新增、配置、排序、删除和确认回写可见。J020 的草稿转正式提交复用提交前/后事件，保存草稿不进入提交事件链，提交后动作失败时保留稳定记录 ID 并只重试后续动作。W020 新增 `/workflow/authorize-rules` 页面及入口，待确认加签可取消，Long 主键全程使用字符串，催办按权限交集与真实 BPM 实例主键调用。

## 实际验证

工程门禁在 Web 仓执行，完整原文位于 `C:/Users/hjxch/.codex/evidence-020/f020-j020-w020/` 与 `C:/Users/hjxch/.codex/evidence-020/theme-blue/`：

| 检查 | 实际结果 | 原文 |
| --- | --- | --- |
| `pnpm typecheck` | exit 0 | `f020-j020-w020/web-typecheck-final.log` |
| `pnpm lint` | exit 0，0 warning | `f020-j020-w020/web-lint-final.log` |
| `pnpm test` | 210 文件通过、1 文件跳过；1839 测试通过、3 跳过 | `f020-j020-w020/web-test-final.log` |
| `pnpm build` | exit 0 | `f020-j020-w020/web-build-final.log` |
| Playwright `chrome-1920`，`headless=false` | 7/7 通过，覆盖主题 3 项、会签选中态 1 项、F020/W020 3 项 | `f020-j020-w020/web-e2e-final.log` |

可见浏览器证据使用 IAB 会话、1920×1080/DPR1/zoom1，截图与结构化 JSON 位于 `C:/Users/hjxch/.codex/evidence-020/theme-blue/screens/`。主要原件包括 `workspace-default-blue-final-1920.png`、`theme-dialog-preview-purple-final-1920.png`、`process-designer-consensus-selected-blue-final-1920.png`、`f020-datasource-list-blue-1920.png`、`f020-subfield-designer-blue-1920.png`、`f020-permissions-default-list-final-1920.png`、`w020-authorize-rules-created-blue-1920.png`、`w020-pending-sign-cancelled-final-1920.png`。1366×768 另有 `w020-authorize-rules-blue-1366.png`、`process-designer-blue-1366.png`；375×812 沿用 `workspace-blue-375.png` 的既有门户结果。

本轮浏览器业务数据来自 `dev:mock`，层级为 `ISOLATED_REGRESSION`，不作为真实权限、持久化或整版视觉的正式通过证据。`localhost:8080` 当前不可达，A09—A16 的同对象联合链尚未执行。

## 验收对照

| 条目 | 本批结果 |
| --- | --- |
| A01 基线与保护 | Web 从 `2b93e53` 续做，三个提交已推送；`vite.config.ts` 的在途修改保持未暂存、未修改 |
| A02 设计覆盖 | 主题、流程设计器选中态、F020/W020 新增入口及 62/63 子表画框已登记；完整 258 画框与 25 组件族仍未覆盖 |
| A03 像素还原 | 节点库语义色与设计原图一致；整页/内容同态像素未完成，A03 整体未通过 |
| A04 UI 交互 | 主题、会签选中态、F020、J020、W020 的适用交互取得可见结果；真实后端与跨租户状态未验证 |
| A05 文案与手册 | 本批只修正涉及主题与表单流程的文案；全量文案、帮助与手册未完成 |
| U020-26 配色 | 会签固定棕、动态并行跟随品牌色，蓝/紫/青/自定义取色符合补充要求；等待第二次正式验收 |
| F020 / J020 / W020 | 本批实现与隔离自验完成，真实持久化、权限与完整办理链待联调 |

## 剩余与依赖

- 后端服务可用后，以同一稳定对象重走 A09—A16 联合链；退回节点/轮次、补签候选、单任务 `DISAPPROVE` 命令和富文本值格式仍需后端权威契约。
- 258 画框、25 组件族、A05 文案手册及 1366/375 剩余状态仍需后续批次；本回执保留 `u020-design-coverage.md` 中未覆盖项及原因。
- Planner 验收本批后，继续整版功能裁决、合并、0.2.0 发布、发布后同步和结束五阶段。

本批不核销 P 编号、不改变功能数或正式验证基线，也不把前端单侧自验写成整版 PASSED/COMPLETED。

## Git、服务与回读

- Web `8b564c5bdffff2e0ffbff720ebc20effede4c288` 与 `origin/codex/0.2.0-ui-tenant-form-flow` 同 SHA，领先/落后 0/0；工作树仅保留用户原有 `M vite.config.ts`。
- Server 消费快照 `6995f88351c8adad19906433d820ecd2451fc4a8`，分支 `codex/0.2.0-tenant-form-flow`，工作树干净；Planner 已裁决本批后端 PASSED，整体仍为 IN_PROGRESS。
- 根仓在 `codex/0.2.0-delivery` 汇入 `knowledge/`、`memory/`、本批回执及双方已推送的 gitlink；提交后单独回读远端 SHA。
- 本轮启动的 `pnpm dev:mock` 已停止，5173 端口已释放；未停止用户既有服务。

本批适用实现、测试与可见证据已完成，结论为“自验通过，待 Planner 验收”；整版 0.2.0 保持 `IN_PROGRESS`。
