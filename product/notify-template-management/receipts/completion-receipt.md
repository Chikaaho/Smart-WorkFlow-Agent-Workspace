# 完成回执 — P36 / M05-F02-01 消息模板管理（notify-template-management）

> 方向：`product/notify-template-management/ready/direction-notify-template-management.md`（READY）
> 执行角色自主闭环（executor §4）；本回执为功能级完成回执，自验通过·待规划验收
> 执行角色未写任何终态值（无 PASSED/COMPLETED、未核销 P 编号、未动基线登记）

---

## 一、需求方向对照（目标逐项）

### 1. 后端模板持久化 + 租户边界 + 管理契约 + 安全渲染

**实际修改文件**：

| 文件 | 动作 | 内容 |
|---|---|---|
| `sw-basic/sw-basic-notify/sw-basic-notify-biz/src/main/java/com/sw/ck/notify/entity/NotifyTemplate.java` | 新建 | 模板实体（templateCode/name/titleTemplate/contentTemplate/enabled/remark） |
| `.../notify/mapper/NotifyTemplateMapper.java` | 新建 | BaseMapper；租户由 TenantLineHandler 注入 |
| `.../notify/render/TemplateRenderService.java` | 新建 | 唯一渲染实现：仅 `${var}`（`[A-Za-z_][A-Za-z0-9_]*`），变量按字面文本替换（quoteReplacement 防 `$`/`\` 二次解释）；缺变量抛异常并列出全部缺失项；非法占位符在提取阶段拒绝 |
| `.../notify/render/TemplateRenderException.java` | 新建 | 渲染失败异常 |
| `.../notify/service/NotifyTemplateService.java` + `impl/NotifyTemplateServiceImpl.java` | 新建 | CRUD/启停/预览/变量提取；Service 层手动校验（模块无 jakarta.validation，沿用 AgentToolConfig 惯例）；同租户代码唯一=应用层查重+V38 唯一索引双保险；requireEnabledByCode 供发送链复用 |
| `.../notify/controller/NotifyTemplateController.java` | 新建 | `/notify/templates` CRUD/toggle/preview/variables/send；读 `notify:template:view`、写 `notify:template:manage`（@PreAuthorize @ss.hasPermi，与 V38 seed 一一闭合） |
| `.../notify/dto/`（5 个 DTO） | 新建 | NotifyTemplateDTO/NotifyTemplateQuery/TemplatePreviewRequest/TemplatePreviewResult/TemplateSendRequest |
| `sw-basic-notify-api/.../NotifyBizType.java` | 修改 | 追加 `SYSTEM` 枚举值（模板发送专用，既有 WF_TODO/WF_APPROVED 不动） |

### 2. 双方言迁移 + 菜单权限入口

| 文件 | 内容 |
|---|---|
| `sw-bootstrap/src/main/resources/db/migration/postgresql/V38__notify_template_and_menu.sql` | 新建 `sw_notify_template` 表（前缀 sw_notify_、8 基列在前、bigint PK，对齐 V9 惯例）；复合唯一索引 `(tenant_id, template_code, deleted)`（V13 先例，支持软删重建）；「通知」id=6 叶子矫正为目录（V11/V26 先例）；二级菜单 收件箱 id=215 + 消息模板 id=216 + 按钮 id=217；不 seed sys_role_menu（超管旁路决策沿用） |
| `sw-bootstrap/src/main/resources/db/migration/h2/V38__notify_template_and_menu.sql` | PG 镜像（H2 无 COMMENT ON） |
| `sw-bootstrap/src/main/resources/application.yml` | 追加 `sw.notify.enabled: true`——现场核实 NotifyAutoConfiguration 为 `@ConditionalOnProperty(sw.notify.enabled=true)` 且此前**无任何 profile 设置该值**（通知模块运行时未激活状态），本轮补齐使模板链路可用 |

### 3. 发送集成与失败原子性

- `POST /notify/templates/send`：取启用模板（停用/删除/不存在 → NOT_FOUND「模板不存在或未启用」）→ 渲染（缺变量 → PARAM_ERROR 列出缺失项）→ **渲染成功后才落库**。三步顺序保证失败发生在通知落库之前，无半成品通知。
- 直接标题/正文发送（NotifyFacade.send / BpmNotifyListener 路径）零改动，回归测试证实 bizType 原值保留。

### 4. 前端模板管理页

| 文件 | 动作 | 内容 |
|---|---|---|
| `src/contracts/notify.ts` | 追加 | NotifyTemplate/SaveReq/PreviewReq/PreviewResult 契约；bizType 联合类型扩展 `'SYSTEM'` |
| `src/modules/notify/api/index.ts` | 追加 | page/get/create/update/delete/toggle/preview/sendByTemplate 8 个 API 函数 |
| `src/modules/notify/views/NotifyTemplateList.vue` | 新建 | 列表页：分页+keyword(代码/名称)+enabled 过滤、启停/删除二次确认、预览弹窗（JSON 变量输入→后端渲染）、按钮按 notify:template:manage 显隐 |
| `src/modules/notify/views/NotifyTemplateFormDialog.vue` | 新建 | 新增/编辑弹窗：字段校验与后端一致（代码正则、必填）；编辑态 templateCode 禁用；占位符合法性交由后端裁决（前端不做替换规则） |
| `src/router/index.ts` | 追加 | 静态路由 `/notify/template`（authority: notify:template:view，仿 agent/tool 参数化静态路由先例） |
| `src/foundation/mock/seeds.ts` | 修改 | 「通知」目录化对齐 V38（收件箱+消息模板二级菜单+按钮节点）；superadmin permissions 追加 notify:template:view/manage；新增 3 条模板种子（含停用样例） |
| `src/foundation/mock/handlers.ts` | 追加 | 7 个模板 handler（CRUD/toggle/preview/send）；renderMockTemplate 与后端同语义（缺变量报错消息逐字一致、非法占位符拒绝、变量按字面文本）；send 失败原子性=先渲染成功才 push 进收件箱 |

### 5. Mock 与真实接口一致性

- 错误语义对齐：停用/不存在 → 404「模板不存在或未启用： code」；缺变量 → 400「缺少变量: xxx」；重复代码 → 400「模板代码已存在: xxx」；代码变更 → 400「模板代码不可变更」。Mock 与真实后端逐字一致。
- 预览与发送共用同一渲染函数（真实=TemplateRenderService 单例两路调用；Mock=renderMockTemplate 两 handler 共用）——无双规则漂移。

## 二、测试方案与行为证据（证据三级制：均为①级行为证据）

### S2 后端测试（新建 `NotifyTemplateIntegrationTest`，13 用例全绿）

装配：H2 MODE=PostgreSQL 内存库 + 真实 TenantLine/OptimisticLocker/逻辑删除拦截器链（对齐既有 NotifyControllerIntegrationTest 先例）。

```
命令：MAVEN_OPTS="-Xmx2g" mvn -q -pl sw-basic/sw-basic-notify/sw-basic-notify-biz test -Dtest='NotifyTemplateIntegrationTest'
输出：Tests run: 13, Failures: 0, Errors: 0, Skipped: 0
```

覆盖映射（方向 §8 → 用例）：
1. 同租户代码唯一 → `duplicateCode_rejected_rebuildAfterSoftDelete_ok`（应用层拒绝 + 直插触发 DB 唯一冲突 DataIntegrityViolationException + 软删重建成功）
2. 跨租户隔离 → `tenantIsolation_sameCodeIndependent`（T100/T200 同 SHARED_CODE 各自可见；T200 会话发送落库标题=T200 标题）
3. CRUD 闭环 → `crudLifecycle`（创建/查/更/启停/幂等删除）、`updateCannotChangeCode`、`pageList_filtering`
4. `${var}` 替换+预览=落库 → `renderMatchesPreviewAndPersistedContent`（预览结果与持久化 title/content 逐字断言相等）
5. 缺变量落库前拒绝 → `missingVariable_sendRejected_noRowInserted`（异常含 need2 + countMessages 前后相等）
6. 非法占位符 → `invalidPlaceholders_rejectedAtExtraction`（${}/${1abc}/${a-b} 提取即拒；坏模板不得入库）
7. 停用/删除/不存在 → `disabledOrMissingTemplate_sendRejected_noRowInserted`、`deletedTemplate_sendRejected`
8. 额外变量不改变+注入防护 → `extraVarsAndLiteralInjection_notInterpreted`（`${danger} \ ${b}` 字面输出）
9. 历史稳定 → `historyStable_afterTemplateMutations`(编辑+停用+删除后旧通知仍为「旧标题 1/旧正文 1」)
10. 直接发送兼容 → `directSendStillWorks`（bizType=WF_TODO/bizId=task-1 原值）

### Flyway 全链迁移验证（永久测试更新，37→38）

```
FlywayFullChainH2Test:      Tests run: 14, Failures: 0 — 全链 38 条 migrate+validate；
                            applied 含 V38 断言新增；L10 改造 V36→链尾=2 条(V37/V38)、终点版本=38
FlywayFullChainPostgresTest: Tests run: 10, Failures: 0 — PG 侧同口径 38 条
```

### 后端全量门禁（编译互斥 ps/pgrep 检测通过后执行）

```
命令：MAVEN_OPTS="-Xmx2g" mvn test（根目录全 reactor）
结果：BUILD SUCCESS，Total time 03:56 min
Surefire XML 叶文件 121 个聚合：Tests run: 855 / Failures: 0 / Errors: 0 / Skipped: 0
其中 sw-basic-agent = 346
```

**基线勾稽（增量来源说明，§4.1 第 3 条）**：
- D210 登记基线 827（agent 338）→ 本轮实测 855（agent 346），差 28，逐项溯源：
  - **+13** 本轮新增 `NotifyTemplateIntegrationTest`（13 用例）
  - **+8** P48 提交 677f801 补充的 `AgentToolConfigSecurityIntegrationTest`（D188 记录 338 时该文件已在但此后 agent 无全量复跑记录，本轮实测补录）
  - **+6** D210 明示「通知模块新增 6 个集成测试，项目总口径保持 827」——该 6 条从未计入 827，本轮全量口径如实纳入
  - **+1** 历史登记口径残差（无法精确定位到单文件，如实报告不做掩盖）
- 本轮对基线的**真实净增**仅为 13（模板测试）；其余 15 为历史欠账的一次性显性化。

### S4 前端四连门禁（严格串行，NODE_OPTIONS=--max-old-space-size=2048）

| 门禁 | 结果 |
|---|---|
| `pnpm typecheck` | ✅ vue-tsc -b --noEmit 通过，exit 0 |
| `pnpm lint` | ✅ exit 0，0 errors 0 warnings（初跑 14 prettier warnings 经 --fix 归零后复核） |
| `pnpm test` | ✅ Test Files 101 passed (101) / Tests 997 passed (997)，exit 0 |
| `pnpm build` | ✅ built in 6.08s，exit 0 |

前端基线勾稽：D210 登记 100 spec files / 988 tests → 本轮 101 files / 997 tests，净增 = NotifyTemplateList.spec.ts（1 文件 9 用例），无其他来源。

**过程偏差说明**：首轮全量 test 出现 3 个超时失败（我的 spec + DeptList/UserGroupList 各部分），隔离复跑全部通过；定位为执行机磁盘满（/private/tmp 所在卷 99%）导致 vitest worker 异常，清理可再生缓存（codex/go-build cache 共约 3.2G）释放至 5.4G 可用后全量复跑一次通过。非代码缺陷，未修改任何超时配置。

### 编译互斥证据（§9 硬约束）

每次 mvn/pnpm 执行前均以 `pgrep -fl "mvn"` / `pgrep -fl "pnpm|vite|npm"` 及 `ps aux` 快照检测对方进程，快照均返回空（无并发编译）；全程未出现前后端同时编译。

## 三、方向 §8 规划验收边界逐项自验对照

| # | 边界项 | 自验结论 | 证据 |
|---|---|---|---|
| 1 | 同租户代码唯一、跨租户独立互不可见 | ✅ | duplicateCode… / tenantIsolation… 两用例行为断言 |
| 2 | CRUD/启停/删除闭环；停用删除不可预览发送 | ✅ | crudLifecycle 等；requireEnabledByCode 统一拒绝语义 |
| 3 | ${var} 标题正文正确替换；预览=落库 | ✅ | renderMatchesPreviewAndPersistedContent 逐字相等断言 |
| 4 | 缺变量/非法占位符/不可用模板落库前拒绝、无残留 | ✅ | missingVariable… countMessages 前后等值 |
| 5 | 额外变量无效；变量值不作表达式执行 | ✅ | extraVarsAndLiteralInjection… |
| 6 | 模板变更后历史通知不变 | ✅ | historyStable_afterTemplateMutations |
| 7 | 直发/列表过滤/已读未读/删除不回归 | ✅ | directSendStillWorks + 既有 NotifyControllerIntegrationTest 10/10 全绿 |
| 8 | 权限区分（普通用户 vs 管理员） | ✅ | Controller @PreAuthorize view/manage 分离 + 前端 spec 无权限隐藏新增按钮 + V38 菜单单向授权 |
| 9 | Mock 与真实行为一致 | ✅ | handler 与后端错误码/消息逐字对齐（见 §一.5） |
| 10 | 双方言迁移+质量门+互斥可复现 | ✅ | H2/PG 全链 14+10 用例；四连+mvn BUILD SUCCESS 输出 |
| 11 | 只核销 P36/M05-F02-01，不动 P3 其余缺口 | ✅（待规划裁决） | 本回执未核销任何编号；收尾同步将严格限定 P36 范围 |

## 四、Git diff 摘要（Smart-WorkFlow 子仓）

- 修改已跟踪 4 文件：NotifyBizType.java（+SYSTEM 枚举）、application.yml（+sw.notify.enabled）、FlywayFullChainH2Test/PostgresTest（37→38 计数与 V38 断言）
- 新增 12 文件：后端 9（entity/mapper/render×2/service×2/controller/dto 目录）+ 测试 1 + 迁移 2
- Smart-WorkFlow-Web 子仓：修改 6（contracts/notify.ts、api/index.ts、router/index.ts、mock/seeds.ts、mock/handlers.ts）+ 新增 4（列表页/弹窗/spec×1 + api 追加）
- 零触碰：bpm/engine、agent 模块源码、动态宽表、既有通知收件箱页面逻辑

## 五、遇到的问题与处理

1. H2 `ALTER TABLE ... DROP INDEX IF EXISTS` 语法不支持 → 改 `DROP INDEX IF EXISTS`（首次红→修复绿）。
2. Flyway placeholder 解析把迁移注释中的 `${var}` 当迁移变量导致 PG 全链解析失败 → 注释改全角 ＄{var} 写法（PG/H2 双份），H2 侧本就无此字面量。
3. 测试装配首版 mapper 手工 new 方式不可行 → 回归既有 NotifyControllerIntegrationTest 的 @MapperScan + SqlSessionFactory 全套装配模式。
4. 分页查询在测试上下文返回空 → 测试拦截器链缺 PaginationInnerInterceptor（生产 MybatisPlusConfig 有），补齐后 selectPage 正常。
5. 磁盘满导致前端全量 test 超时级联 → 清理缓存后复跑通过（见上）。

以上均为工程异常自恢复循环内解决，无方向级阻塞。

## 六、未完成内容

无。方向 §4「本轮必须覆盖」六项全部落地并有对应证据。

## 七、风险和注意事项

1. `sw.notify.enabled: true` 为本轮新增运行时开关：通知模块（含 BpmNotifyListener 消费路径）自此在 dev/local 生效。BPM 流程事件将开始真实产生站内信——属方向内预期行为（模板能力以通知链路激活为前提），提请规划知悉。
2. V38 将「通知」菜单矫正为目录并新增收件箱二级菜单（原 path/component 不变挂在 inbox 下）：直达 URL `/notify` 由目录 redirect 到首叶，行为兼容；如存在外部书签深链 `/notify/inbox` 以外的旧路径变体需现场核验（当前代码库 grep 无硬编码 /notify 深链）。
3. 基线 855 中 +15 为历史欠账显性化（见勾稽节），建议规划在验收时确认新基线登记口径。

## 八、建议执行的测试

规划验收可直接引用本回执第二节命令复现；无需额外补充测试。

---

**自验结论：通过（9/9 项方向验收边界有行为证据支撑）·待规划验收**
