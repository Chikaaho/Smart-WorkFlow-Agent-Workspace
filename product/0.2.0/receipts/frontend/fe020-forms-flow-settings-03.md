# fe020-03 表单配置、流程入口与审批交互补齐

2026-10-25｜Executor（前端）｜XL｜IN_PROGRESS｜自验通过，待 Planner 验收

总 7 阶段：已完成 1「需求评估」；进行中 1「分支实施」；未开始 5「验收同步、合并、发布、发布后同步、结束」。本批承接 F020、J020、W020 的前端缺口，并在主题初稿之后继续 258 画框/25 组件族的实际覆盖；不改变功能数、P 编号或正式基线。

## 本轮结果

### F020 表单配置

- 受控数据源弹窗新增“受控数据源 / 查询契约”页签。数据源列表可查看名称、类型、JDBC 地址、用户、启停状态，新增/编辑保持密码不回显，留空不提交密码。
- 每个数据源可打开授权主体清单，按 `ROLE` 角色编码或 `USER` 用户 ID 添加、移除，整组保存后从服务端回读；单数据源最多 200 项，非法主体在前端拒绝。
- 查询契约页展示 queryKey、版本、数据源名称、输出字段和启停开关；停用契约仍可见但不可选。
- 数据源字段的查询标识改为已授权契约选择器；选择后自动带出当前契约版本和输出字段，历史绑定不套用最新版本字段。后端 `/api` 前缀已剔除，避免 `request` 的 baseURL 形成 `/api/api`。
- 子表字段编辑从盖层子画布改为 1120px 居中弹窗：字段名称/编码、组件、必填、操作；提供“添加字段”，独立配置弹窗支持字段名、类型、必填等全部字段配置，支持上下排序、删除和确认回写。
- 字段权限与默认列表在同一“权限”工作区可见；主表字段、子表字段分别进入权限行，默认列表的真实列、筛选、排序和开放操作可回读。补齐 mock 的 `GET/PUT /form/def/:id/list-config`，消除错误提示。

### J020 表单事件

- 草稿转正式提交复用正式提交事件链：先完成已有字段联动，再按顺序运行 `beforeSubmitHandler`，重新结清事件产生的联动后做最终校验，写入草稿并受理提交。
- `beforeSubmitHandler` 返回 false、用户取消或异常时不写草稿、不提交并保留输入；仅命令 `COMPLETED` 后执行一次 `afterSubmitHandler`。
- 提交后动作使用命令结果或草稿回读得到的稳定 `resultRecordId`；失败显示“已提交，后续处理失败”，重试只处理后续动作，不重发业务提交。
- “保存草稿”不经过提交事件链，原有草稿保存与草稿恢复语义保持。

### W020 流程入口与审批

- 新增 `/workflow/authorize-rules` 授权代理页面，流程定义页在拥有 `workflow:task:authorize` 或 `workflow:def:design` 时提供入口。支持受托人搜索选择、全局/流程/节点/业务范围、起止时间、创建、列表回读和撤销。
- 授权规则与待确认加签 ID 全程保持字符串；版本挂起/激活不再 `Number(defId)`，避免 19 位 Long 主键精度变化。
- 待确认加签表新增取消入口和二次确认，取消后重新读取队列。
- 发起人催办增加 `workflow:urge` 权限交集；点击时先按 Flowable 实例号回查本人的 BPM 实例稳定主键，再调用催办接口，避免字符串实例号转 `NaN`。
- 审批意见“保存暂存”和“恢复暂存”分开状态；保存成功不再误显示“已恢复本人暂存草稿”。

## 实际验证

完整四连在 `C:/Users/hjxch/.codex/evidence-020/f020-j020-w020/`：

| 检查 | 结果 | 原文 |
| --- | --- | --- |
| `pnpm typecheck` | exit 0 | `web-typecheck-final.log` |
| `pnpm lint` | exit 0，0 warning | `web-lint-final.log` |
| `pnpm test` | 210 文件通过、1 跳过；1839 通过、3 跳过 | `web-test-final.log` |
| `pnpm build` | exit 0；仅依赖 `#__PURE__` 与插件耗时提示 | `web-build-final.log` |
| 主题/流程/业务 E2E（chrome-1920，`headless=false`） | 7/7 通过 | `web-e2e-final.log` |

新增 E2E `e2e/visual/f020-w020-workflows.spec.ts` 包含 3 项：数据源授权与契约启停、授权代理创建撤销、子表字段新增/排序/回写；全部通过。主题与多分支会签用例继续通过，共 7 项。

可见 IAB 证据位于 `C:/Users/hjxch/.codex/evidence-020/theme-blue/screens/`：

- `f020-datasource-list-blue-1920.png`、`f020-query-contracts-blue-1920.png`：两个数据源与三条契约，包含 Asset List v2、停用状态、输出字段。
- `f020-datasource-field-binding-blue-1920.png`：查询标识选择器仅显示 `asset_list · v2`、`asset_owner_list · v1` 和禁用的停用契约；选中后版本为 2，值/显示字段为 `asset_id`/`asset_name`。
- `f020-subfield-designer-blue-1920.png`、`f020-subfield-field-list-blue-1920.png`：1120px 居中字段弹窗 4 行；字段清单子表页签显示 3 个字段，表名 `asset-purchase.drill_resources`。
- `f020-permissions-default-list-final-1920.png`：12 个字段/子字段权限行、7 个动作权限和 3 个默认列，无列表加载错误。
- `w020-authorize-rules-created-blue-1920.png`：授权代理创建后列表由 1 条变为 2 条；`w020-authorize-rules-blue-1366.png`：1366 下文档宽 1366、表单 1040px 无横向溢出。
- `w020-pending-sign-cancelled-final-1920.png`：待确认加签从 1 条变为 0 条并出现“加签事项已取消”。

对应 JSON 原文：`f020-datasource-list.json`、`f020-query-contracts.json`、`f020-datasource-field-binding.json`、`f020-subfield-designer.json`、`f020-subfield-field-list.json`、`f020-permissions-default-list-final.json`、`w020-authorize-rules.json`、`w020-authorize-rules-created.json`、`w020-authorize-rules-1366.json`、`w020-pending-sign-cancelled.json`。

## 代码与结构文件

- F020：`src/modules/form/api/datasource.ts` 及 spec，`DatasourceManagerDialog.vue` 及 spec，`config/DatasourceConfig.vue` 及 spec，`SubFieldDesigner.vue` 及 spec，`FormDesigner.vue`。
- F020 dev:mock：`src/foundation/mock/f020-datasource-mocks.ts` 及 spec，`handlers.ts`；`design-fixtures.ts` 补含子表的 node07 数据和 13 节点会签夹具。
- J020：`src/modules/form/views/FormRender.vue` 及 spec。
- W020：`src/modules/workflow/views/AuthorizeRules.vue` 及 spec、`ProcessDefList.vue`、`ProcessDesigner.vue`、`TaskDetail.vue` 及 spec、`TodoList.vue` 及 spec、`MyInstances.vue`，`src/modules/workflow/api/index.ts` 及 spec，`api/oa.ts`，`src/router/index.ts`。
- 共享验证与文案：`e2e/visual/f020-w020-workflows.spec.ts`、`e2e/visual/process-designer-consensus.spec.ts`、`src/locales/zh-CN.ts`、`src/locales/en-US.ts`。

`vite.config.ts` 的原在途修改仍未暂存、未修改。

## 验收对照

| 条目 | 本批结果 |
| --- | --- |
| A09 表单配置 | 数据源授权/契约清单/启停/绑定、字段权限、默认列表均有可操作界面并通过隔离 mock 回读；真实服务端持久化与越权请求待联调。 |
| A10 子表 | 新稿弹窗、字段清单、增删改排序、必填元数据及父画布回写通过；服务端发布/回读和跨端显示待联调。 |
| A11 表单事件 | 草稿转正式提交的事件时序、取消/异常保留、提交后稳定 ID 和失败重试通过组件测试；真实浏览器事件链待后端可用。 |
| A14 流程入口 | 授权代理新增/撤销、废弃已有入口、暂存和版本操作入口可达；真实权限/租户和状态回读未完成。 |
| A15 节点操作与加签 | 多分支会签选中属性、取消加签入口和长 ID 保持已通过；前后加签串并行、补签和退回目标仍缺真实完整浏览器链。 |
| A03/A04/A05 | 本批提供设计与交互证据，但不把隔离 mock 当作整页像素、真实权限或全量文案验收；整体仍未通过。 |

## 剩余边界与依赖

- 当前本机后端仍不可达，所有新增业务证据为 `ISOLATED_REGRESSION`；正式 A09—A16 需后端服务可用后使用相同对象重走。
- 授权代理请求字段采用现有 `ApprovalActionRequest` 语境的 `targetUserId + scopeType + processDefKey/nodeKey/businessKey + startAt/endAt`；后端尚未提供独立 DTO 样例。若真实 DTO 字段不同，只改 API 适配，不改变页面语义。
- 退回目标仍需后端下发当前任务可退回节点、轮次和展示名；补签候选仍需权威候选端点；`DISAPPROVE` 单任务命令仍待后端统一动作契约。以上不由前端猜测实现。
- 富文本仍为文本降级形态，值格式和安全显示需与后端确认；起草/IoT/Agent 三项节点注册仍待 Planner 裁定。
- 全量 258 画框/25 组件族、A05 文案手册、真实跨租户及 A16 完整链继续未完成。本批不核销 P、不修改功能数或验证基线。

## Git

- Web 提交 `8b564c5bdffff2e0ffbff720ebc20effede4c288`，信息 `feat(ui): 补齐表单配置事件与流程入口`；它在会签夹具提交 `8c51283` 之后继续。推送后 `HEAD` 与 `origin/codex/0.2.0-ui-tenant-form-flow` 同 SHA，0/0；`vite.config.ts` 保持在途状态。
- 本回执是前端第三批自验记录；新增证据路径和结论可直接由 Planner 读取，原始日志不进入 Git。

自验结论：本批适用实现与工程检查完成，待 Planner 验收；整版仍为 `IN_PROGRESS`。
