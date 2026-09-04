# P36 / M05-F02-01 消息模板管理

> 工作区统一知识库 — 功能追踪文件。
> 本文件记录 `notify-template-management` 的完整规划、执行迭代、测试结果与终态。

---

## 功能摘要

| 项目 | 内容 |
|------|------|
| **功能编号** | P36 / M05-F02-01 |
| **功能名称** | 消息模板管理（notify-template-management） |
| **功能目标** | 站内信模板维护：CRUD/启停/删除/预览/发送，`${变量名}` 占位符替换，缺失变量或模板不可用落库前拒绝，历史通知保存渲染结果，租户隔离 + 管理权限 + 前端页面 + Mock + 双方言迁移 V38 |
| **Walking Skeleton 位置** | 第五环增强：通知链路模板化（收件箱 + 删除/过滤之后的模板能力） |
| **总范围** | 后端模板域 + V38 双方言迁移 + 发送集成 + 前端管理页/路由守卫 + Mock 一致性 |
| **最终状态** | **COMPLETED（已确认，2026-08-26）✅**（第 33 个正式功能；规划终态复核 `planning-terminal-final-review-20260826.md` PASSED） |
| **完成日期** | 2026-08-26（功能级 PASSED + 阶段三终态同步落盘 + 规划终态复核确认） |
| **规划验收** | 功能级 PASSED（11/11）；阶段三终态同步已按唯一值清单落盘并经规划终态复核确认 |

---

## 影响范围

### 后端（sw-basic-notify）

| 文件 | 改动 |
|------|------|
| `NotifyTemplate.java` / `NotifyTemplateMapper.java` | 新建实体与 Mapper；租户由 TenantLineHandler 注入 |
| `render/TemplateRenderService.java` + `TemplateRenderException.java` | 唯一渲染实现：仅 `${var}`（`[A-Za-z_][A-Za-z0-9_]*`），按字面文本替换（quoteReplacement 防 `$`/`\` 二次解释）；缺变量抛异常并列出全部缺失项；非法占位符在提取阶段拒绝 |
| `NotifyTemplateService` + `NotifyTemplateServiceImpl` | CRUD/启停/预览/变量提取；同租户代码唯一=应用层查重+V38 唯一索引双保险；`requireEnabledByCode` 供发送链与按代码预览复用；G1 补证新增 `previewByCode`（先校验可用性再渲染） |
| `NotifyTemplateController.java` | `/notify/templates` CRUD/toggle/preview/variables/send + `{code}/preview`；读 `notify:template:view`、写 `notify:template:manage`（@PreAuthorize @ss.hasPermi） |
| `dto/`（5 个 DTO） | NotifyTemplateDTO/Query/PreviewRequest/PreviewResult/SendRequest |
| `NotifyBizType.java` | 追加 `SYSTEM` 枚举值（既有 WF_TODO/WF_APPROVED 不动） |

### 迁移与配置

| 文件 | 内容 |
|------|------|
| `db/migration/postgresql/V38__notify_template_and_menu.sql` | 新建 `sw_notify_template` 表（复合唯一索引 `(tenant_id, template_code, deleted)`）；「通知」id=6 叶子矫正为目录 + 收件箱 id=215 / 消息模板 id=216 / 按钮 id=217；不 seed sys_role_menu（超管旁路决策沿用） |
| `db/migration/h2/V38__notify_template_and_menu.sql` | PG 镜像（H2 无 COMMENT ON） |
| `application.yml` | 追加 `sw.notify.enabled: true`（此前无任何 profile 设置该值，通知模块运行时未激活） |

### 前端（Smart-WorkFlow-Web）

| 文件 | 内容 |
|------|------|
| `src/contracts/notify.ts` | NotifyTemplate/SaveReq/PreviewReq/PreviewResult 契约；bizType 扩展 `'SYSTEM'` |
| `src/modules/notify/api/index.ts` | page/get/create/update/delete/toggle/preview/sendByTemplate 等 API |
| `views/NotifyTemplateList.vue` + `NotifyTemplateFormDialog.vue` | 列表页（分页/过滤/启停/删除确认/预览弹窗）+ 新增编辑弹窗（编辑态 templateCode 禁用） |
| `src/router/index.ts` | 静态路由 `/notify/template`（authority: notify:template:view） |
| `src/router/guard.ts` | R1 修正：authGuard 新增 `hasRouteAccess` 路由权限校验——superAdmin 短路放行；`meta.authority` 非超管须持有任一权限串；**菜单可达性回退**（会话权限无命中时，目标 path 在服务端过滤后的授权菜单树中可达 → 放行）；拒绝 → `/403`；未登录语义不变 |
| `src/foundation/mock/seeds.ts` / `handlers.ts` | 「通知」目录化对齐 V38；superadmin permissions 追加 view/manage；3 条模板种子；7+ 模板 handler 与后端错误语义逐字一致 |

---

## 关键设计决策

| 决策 | 选择 | 原因 |
|------|------|------|
| 渲染语法 | 仅 `${var}` 字面文本替换（quoteReplacement） | 防注入：变量值不作表达式执行；非法占位符提取阶段即拒 |
| 失败原子性 | 取启用模板 → 渲染成功后才落库 | 三步顺序保证失败发生在通知落库之前，无半成品通知 |
| 同租户代码唯一 | 应用层查重 + V38 `(tenant_id, template_code, deleted)` 唯一索引双保险 | V13 先例：支持软删重建 |
| **R1 路由权限判据（hasRouteAccess）** | superAdmin 短路 → meta.authority 会话权限命中 → **菜单可达性回退**（path 在服务端过滤后的授权菜单树中可达即放行） | 后端 `UserDetailsProviderImpl.loadPermissions` 对非超管只装配 menu_type=2 按钮行 permission 串，页面行权限串不进会话 permissions——「会话权限命中」单独作判据会把真实获权的非超管误拒；「path 在服务端过滤后的菜单树中」才是与服务端授权一致的判据。经真实后端 tooluser live 链交叉验证。path 匹配同时兼容 mock 全路径形态与真实后端分段形态（原始路径 + 祖先组合路径） |
| V38 菜单矫正 | 「通知」叶子改目录 + 收件箱/消息模板二级菜单 | V11/V26 先例；原 path/component 不变挂 inbox 下，直达 URL 兼容 |
| sw.notify.enabled | 补齐 `sw.notify.enabled: true` | NotifyAutoConfiguration 为 @ConditionalOnProperty 且此前无 profile 设置——通知模块运行时未激活，模板链路以通知链路激活为前提 |

---

## 执行迭代与审查轨迹

> 下表为**历史审查过程存档**（各时点的当时结论，非当前值）；功能当前值见「功能摘要」。

| 轮次 | 回执/记录 | 当时结论（历史语境） |
|---|---|---|
| 完成回执 | `receipts/completion-receipt.md` | 自验通过·待规划验收（后端全量 855/0/0/0 agent346；前端 101f/997t；H2 14/14、PG 10/10 = 38 migrations） |
| 规划验收 | `receipts/planning-review-20260826.md` | VERIFYING — G1—G4 缺口待补 |
| 补证回执 G1—G4 | `receipts/post-planning-review-evidence-supplement.md` | G1—G4 核销；更正「9/9」口径为方向实际 11 项（A1—A11） |
| 规划复验 | `receipts/planning-rereview-20260826.md` | VERIFYING — G2 同类缺口第二次不通过（guard 只判断登录态），启动一级补充提示 |
| 一级提示 R1/R2 | `receipts/planning-execution-prompt-notify-template-management-01.md` | 仅允许处理 R1 前端路由授权一致性 + R2 最终树质量门 |
| 最终补证回执 | `receipts/post-prompt-01-route-permission-evidence.md` | EXECUTION_SUBMITTED — R1 三身份真实导航证据 3/3 + 真实后端 tooluser live 链 2/2 交叉验证；R2 四连门禁 typecheck/lint/test/build exit 0，104f/1025t（+28 增量来源可复算） |
| **最终验收** | `receipts/planning-final-review-20260826.md` | **PASSED（功能级 11/11）**；锁定基线登记值 870（agent 346）/104f-1025t/V38 |
| 阶段三终态同步 | `ready/direction-notify-template-management-stage3.md` + 终态同步回执 | 机械落盘 33 / ✅30🟦21⬜39 / 870·agent346 / 104f·1025t / V38·38 migrations |

---

## 测试结果

**正式基线（阶段三终态同步登记值）：**

| 门禁 | 结果 |
|---|---|
| 后端全量 | **870 / Failures 0 / Errors 0 / Skipped 0；sw-basic-agent 346**（855 实测 + 已报告新增 15 勾稽：G1 +3、权限链 +12） |
| 前端四连门禁 | **104 files / 1025 tests**；typecheck、lint、test、build 全绿（严格顺序串行，NODE_OPTIONS=2048） |
| Flyway | **V38**；H2/PostgreSQL 均 **38 migrations** 全链 migrate+validate 通过（H2 14 用例、PG 10 用例） |

**关键专项测试：**

- `NotifyTemplateIntegrationTest` 16 用例（13 原始 + G1 新增 3）：同租户代码唯一/软删重建、跨租户隔离、CRUD 闭环、预览=落库逐字相等、缺变量落库前拒绝零残留、非法占位符拒绝、停用/删除不可预览发送、额外变量无效+防注入、历史稳定、直发兼容
- `NotifyTemplateSecurityIntegrationTest` 12 用例：未认证 401、仅 notify:view 403 且数据零变化、manage 非超管 200 落库 tenant_id/create_by 正确、列表 view 权限映射
- R1 三身份真实导航证据 spec 3/3：普通用户直达 `/notify/template` → `/403`（组件实例不存在）、获授非超管经菜单及直达均进入且组件挂载、未登录 refresh 失败 → `/login?redirect=/notify/template`；真实后端 tooluser live 链 2/2 交叉验证菜单可达性回退判据
- Mock evidence spec 16 用例：dispatchMock 真实 handler 输出与后端契约逐项对照（错误码/消息逐字一致、失败原子性零残留）
- 编译互斥：每次 mvn/pnpm 前双向进程快照（带时点原文），全程无并发编译

---

## 已知限制与风险

1. 纯内容预览（`POST /preview`）仍可渲染任意提交文本，属编辑场景设计边界（按代码预览 `{code}/preview` 与发送两条路径均校验模板可用性）；已在代码注释与补证回执双处声明。
2. `sw.notify.enabled: true` 使通知模块（含 BpmNotifyListener 消费路径）自此在 dev/local 生效，BPM 流程事件将真实产生站内信——属方向内预期行为。
3. V38 将「通知」菜单矫正为目录并新增收件箱二级菜单：直达 URL `/notify` 由目录 redirect 到首叶，行为兼容；外部旧深链变体需现场核验（当前 grep 无硬编码 /notify 深链）。
4. P3 其余缺口（发送记录查询/失败重发/全局日志，M06-F04-01 🟦 等）不在本功能范围，继续待排期；「批量发送 M05-F01-01」已于 **2026-08-27 完成**（notify-batch-send 第 34 个正式功能，清单 ✅），不再列入待排期（2026-09-04 知识库全量整理对账更正）。

---

## 相关入口

- 主方向（归档）：`product/notify-template-management/passed/direction-notify-template-management.md`
- 阶段三方向：`product/notify-template-management/ready/direction-notify-template-management-stage3.md`
- 全部回执：`product/notify-template-management/receipts/`
- 需求池边界：`todo/requirement-pool.md` P36（已核销）/ P3（部分关闭，未核销）
