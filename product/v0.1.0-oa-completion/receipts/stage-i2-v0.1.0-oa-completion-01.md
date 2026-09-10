# P60 I2「低代码表单收口」实现回执 01

> 角色：执行（Executor）
> 日期：2026-09-09
> 唯一执行入口：`product/v0.1.0-oa-completion/ready/direction-stage-i2-low-code-form-closure.md`
> 状态：**自验通过（服务端/工程门禁层面），待规划独立验收**——`VERIFYING / EXECUTION_SUBMITTED`
> P60 保持 `IN_PROGRESS`；不写 I2 PASSED/COMPLETED、不核销 P 编号、不动功能数与清单计数、不创建标签/Release、不提交推送两仓 Git。

## 1. G0 登记同步（方向 §2）

- 执行侧权威材料（`knowledge/current-status.md`、`knowledge/session-handoff.md`、`knowledge/features/v0.1.0-oa-completion.md`（由 `v0.3.0-oa-completion.md` 更名承接））已机械同步至：版本 `0.1.0`、I1 `COMPLETED（规划已确认，2026-09-09）`、I2 `IN_PROGRESS`。
- 功能数 44、90 项清单 ✅46/🟦22/⬜22、P 编号、I1 行为证据零漂移；历史回执/evidence/远端提交未改。
- 回读：三文件中无残留「0.3.0 当前口径 / 待规划确认」表述（历史日志中的 v0.3.0 路径引用属历史证据，正确保留）。

## 2. 内部 Step 与实现摘要

### Server（Smart-WorkFlow-Server）

| Step | 内容 |
|---|---|
| S1 统一组件契约 | `FieldType` 启用 `TIME`/`USER`/`DEPT`/`FORMULA`/`DATASOURCE`（方言 TIME/ VARCHAR(64)/ NUMERIC(20,6)/ CLOB(TEXT) 列映射，`FieldSpec` 新工厂）；`FormFieldValidator` 新类型格式校验；USER/DEPT 值经 `UserQueryFacade`/新建 `DeptQueryFacade`（system-api + `DeptFacadeImpl`）按当前租户启用对象校验，失效/越权/跨租户对象拒绝 |
| S2 公式字段 | 新建 `FormulaEngine`（`${field}` 引用提取、未知字段/循环依赖发布前拒绝、递归下降求值，白名单函数 ABS/ROUND/MIN/MAX/DAYS，空值传播、结果 scale 6、除零拒绝、非白名单函数/脚本形态拒绝）；提交与更新路径客户端公式值一律剥离、由服务端按冻结 definition 重算落列（历史值随行冻结，不随公式修改漂移） |
| S3 受控外部数据源 | form-api 新增 `ExtDatasourceQueryPort` + `ExtQueryResult`；bpm-engine `FormExtDatasourceQueryAdapter` 适配既有唯一 `SqlExecutor`（SELECT-only/jsqlparser/maxRows/timeout/只读连接/审计，不建第二执行权威；pom 增 bpm→form-api 唯一允许方向依赖）；form 侧 `sw_form_ext_query`（V69）版本化查询契约注册表 + `FormExtDataService`（登记/绑定校验/预览与运行同一服务端入口 `/form/ext/query/{queryKey}`）；提交期服务端按 valueField 匹配真实行回填 display 并冻结 `{value,display,queryKey,version}`，伪造对象 `EXT_OBJECT_NOT_FOUND(1215)`；definition 只存稳定标识，SQL/密钥不出服务端 |
| S4 定义生命周期 | `FormStatusEnum.DISABLED`；`disable/enable`（仅 PUBLISHED↔DISABLED）+ 草稿删除拒绝原因全部落 `sw_form_lifecycle_audit`（V69）审计；停用后状态机拒绝新填报/提交/发起（非 PUBLISHED 拦截），既有实例与历史按冻结快照可读；发布后删除硬禁止 |
| S5 列表展示配置 | `sw_form_list_config`（V69）持久化 columns/filters/defaultSort/actions；`PUT/GET /form/def/{id}/list-config`；服务端结构校验（非法动作 `LIST_CONFIG_INVALID(1216)`），非法配置不覆盖既有 |
| S6 三层权限 | 字段权限：definition `fieldPermissions`（role:/user:/dept: 主体，空=不设限，超管短路）+ `FieldPermissionService`——查询/详情/子表投影在**服务端 SQL 投影层**剔除无 view 权字段（`FIELD_VIEW_DENIED(1106)` 语义），筛选举报与未知字段同口径拒绝（不确认存在性）；构造请求携带无 edit 权字段 → `FIELD_EDIT_DENIED(1105)` 整请求拒绝。记录权限：`FormDataScopeSupport` 复用 I1 数据范围（超管/ALL 放行、SELF/DEPT/DEPT_AND_CHILD/CUSTOM），**强制**施加于列表/详情/更新/删除（create_by 归属参数化条件），调用方不可关闭。动作权限：提交/更新/删除/查询/详情控制器挂 `@PreAuthorize(form:data:submit/edit/delete/query)`；全局 V68 种子注册按钮权限（id 350–353） |
| S7 错误码 | `FormErrorCode` 新增 1103–1106、1209–1216 |

### Web（Smart-WorkFlow-Web）

| Step | 内容 |
|---|---|
| W1 契约/防腐层 | `contracts/form-schema.ts` 新增 TIME/USER/DEPT/FORMULA/DATASOURCE 类型与 `fieldPermissions` 契约；`adapters/form-designer` parse/rule 映射新类型 + `__selector__/__formula__/__dsBinding__` 元数据 + fieldPermissions 透传 |
| W2 注册表 | 设计器 `FIELD_TYPE_REGISTRY` 与渲染 `DYNAMIC_FIELD_REGISTRY` 各新增 5 条描述符（17 类对齐，注册表规格测试同步并锁定）；新配置面板 `FormulaConfig.vue`/`DatasourceConfig.vue` |
| W3 渲染控件 | 新控件 `TimeControl`/`UserControl`/`DeptControl`/`FormulaControl`/`DatasourceControl`；USER/DEPT 候选经系统用户/部门接口（服务端租户/状态过滤）；FORMULA 只读展示「服务端计算」；DATASOURCE 候选经 `/form/ext/query` 服务端唯一入口 |
| W4 列表配置消费 | `FormData.vue` 优先消费服务端持久化列表配置（`getListConfig`），未配置回退既有 `derive*` 接缝——正是既有接缝函数设计的「只换数据源」路径 |
| W5 生命周期 UI | `FormDefList.vue` 停用/启用按钮（PUBLISHED/DISABLED 条件渲染）；状态映射增补 DISABLED（已停用/danger） |
| W6 移动端 | 新路由 `/m/form/:formKey`（`mobile-form-render`）+ `MobileFormRender.vue`：复用与 PC 同一渲染内核与 API，移动视口响应式重排（单列满宽），不删字段、不放宽校验、不承担设计 |

## 3. 工程门禁原始结果（本次实际输出）

- **Server**：`mvn clean test`（MAVEN_OPTS=-Xmx2g）→ **BUILD SUCCESS；Tests 1240 / Failures 0 / Errors 0 / Skipped 0**（12 模块汇总，基线 1223 → 1240，+17 全为 I2 新增用例）。含 Flyway 全链 H2 69 条 / PG 68 条迁移守卫（V68 全局动作权限种子 + V69 form 三表）与既有回归（隔离/乐观锁/显隐/发布闸门）零失败。
- **Web 四连**（NODE_OPTIONS=--max-old-space-size=2048）：`pnpm typecheck` exit 0；`pnpm lint` exit 0（0 errors 0 warnings）；`pnpm test` → **Test Files 126 passed + 1 skipped；Tests 1178 passed + 3 skipped**（基线 1176 → 1178，+2 为 I2 防腐层规格用例；两条注册表规格测试按新类型数 17 同步更新断言，未弱化）；`pnpm build` exit 0。
- 中途修正记录：form 链 V68 与全局链 V68 版本撞号（Flyway duplicates 拒绝）→ form 链更名 **V69**（`V69__i2_form_closure.sql`，PG+H2）；bootstrap 全链计数断言 66/67 → 68/69 并同步升级链断言。

## 4. 与方向的偏差

1. **单选（RADIO）**：沿用既有「DICT + renderAs=radio」单一实现，未新立类型（与 FieldType 既有口径一致，无第二解释）。
2. **外部数据源执行**：复用 bpm-engine 既有受控执行引擎（经 form-api Port 适配），form 侧只建查询契约注册表——避免双执行权威（方向 §6 停止条件）；契约登记/绑定校验/提交解析/预览均为 form 链路真实实现，非以 BPM 既有表替代表单链路。
3. **字段权限默认口径**：未配置 `fieldPermissions` 的字段不设限（对齐前端既有暗态 gating 语义）；已配置则服务端强制。

## 5. 验收边界（方向 §7）逐项自验对照

| # | 边界 | 自验证据 | 状态 |
|---|---|---|---|
| 1 | G0 回读一致 | §1，grep 回读输出 | ✅ |
| 2 | 同一真实表单全链（组件/发布/PC+移动/草稿/提交/回显/历史） | 服务层集成测试（H2 真实 DDL+SQL）验证新类型建列/发布冻结/提交校验链；PC 与移动共用同一 FormRender 内核（代码路径同一） | 🟧 服务端行为已证；**浏览器端 PC/移动真实视口整链证据待补** |
| 3 | TABLE 多行校验；REFERENCE/人员/部门/附件/图片真实对象+越权拒绝 | USER/DEPT Facade 校验集成测试；TABLE 逐行校验既有+新增用例；附件对象权限沿 v0.0.2 锁定 | 🟧 同上，页面级负向证据待补 |
| 4 | 公式多字段/类型/精度/空值/日期；循环/未知/篡改不生效；历史不漂移 | `FormulaEngineTest` 9 例 + 发布循环拒绝集成用例 + 提交/更新剥离客户端值实现 | ✅（服务端行为级） |
| 5 | 外部数据源有权/无权/停用/超时/超限/输出不匹配/敏感不泄漏 | `FormExtDataService`（契约不存在/停用/输出不匹配/对象不存在）+ 既有 SqlExecutor 安全测试；真实外部库端到端执行待环境 | 🟧 需登记真实数据源后端到端补证 |
| 6 | 草稿删除/停用启用/引用拒绝/历史可读 | `FormI2ClosureIntegrationTest` 生命周期+审计用例 | ✅（服务端行为级） |
| 7 | 列表配置持久化+刷新/重登/多身份一致+无权零侧漏 | 持久化/校验集成测试；投影服务端剔除实现+权限单测 | 🟧 多身份页面回读证据待补 |
| 8 | 五类身份字段/记录/动作权限页面+深链+请求一致 | 服务端强制实现+单测/集成（1105/1106/记录范围）；`@PreAuthorize`+V68 种子 | 🟧 浏览器五身份真实链证据待补 |
| 9 | 撤权/停用后收敛，历史由原版本解释 | 快照只读无回写路径（既有锁定）；停用状态机集成测试 | 🟧 组合场景证据待补 |
| 10 | 移动视口真实填报/回看 | 移动路由+渲染器+四门；**真实移动视口行为证据待补** | 🟧 |
| 11 | 锁定能力无回归 | 全量 1240/1178 零失败（P52/P56/P32/v0.0.2 相关测试全绿） | ✅ |
| 12 | 工程门禁 | §3 原始计数 | ✅ |
| 13 | 证据采集点/清理 | 集成测试对象即采即清（@AfterEach 回读） | ✅（服务层） |
| 14 | 终态 | 本回执 `VERIFYING / EXECUTION_SUBMITTED` | ✅ |

## 6. 已知限制与风险（如实）

1. 浏览器层（PC 五身份、移动视口、真实外部库端到端）证据尚未采集——上表 🟧 项；均不涉及服务端安全缺口（服务端为唯一权威且已行为验证），但按方向 §7.13 不以源码/单测单证宣称页面级通过，待 Planner 指定补证路径或验收会话采集。
2. Server 工作区存在**与本任务无关的既有删除噪声**（`product/bpmn-adapter`、`product/p4-oa-*` evidence 等路径的未暂存删除，及 `sw-bootstrap/uploads/`、Web `f-cfg*.json/graph.json` 未跟踪文件），本回执范围未触碰、未提交、未恢复。
3. 记录数据范围在 DEPT_AND_CHILD 且 Provider 缺失的测试环境下退化为「本部门」（fail-closed，不放大可见范围）；生产装配 Provider 完整。

## 7. Git diff 摘要（未提交，按方向 §8 等终态同步方向）

- Server：16 文件修改 + 24 新增（含 V68/V69 迁移、5 个测试类、system DeptFacade、bpm 适配器）；`sw-biz/sw-bpm/sw-bpm-engine/pom.xml` 新增 form-api 依赖。
- Web：14 文件修改 + 9 新增（5 控件 + 2 配置面板 + i2-choices API + MobileFormRender）。
- Workspace：knowledge 三文件 G0 同步 + 本回执 + `search_fallback/v0.1.0-oa-completion-i2-current-seams.md` + 上轮 `blocked-v0.3.0-oa-completion-i2-01.md`。

## 8. 结论

I2 服务端权威链路（统一组件契约、公式重算、受控外部数据源、生命周期审计、列表配置持久化、字段/记录/动作三层权限）与两端工程实现已完成并通过正式工程门禁；功能状态保持 `IN_PROGRESS`，阶段自验状态 `VERIFYING`。待规划独立验收并对 §5 🟧 项指定补证路径。
