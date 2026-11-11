# execution-100-02：阶段 3 返修与补证

接 `planning-review-100-01.md`（§3 返修 R1—R6、§4 补证 B1—B9）。本批在隔离环境（本机分支 + 克隆库 `smart_workflow_100`，Server 18093 / Web 5275）完成全部返修项与补证项，并修复测试中暴露的产品缺陷。测试数据与账号只存在于克隆库；口令不入 Git 与回执。

## A 返修（R1—R6）

### R1 F2-6 明细表导出 Excel

- 服务端：新增 `FormDetailTableExportService` + `GET /form/data/{formKey}/{recordId}/tables/{fieldName}/export`。
  - 读记录沿用 `FormDataQueryService.getRecordDetail`（登录态 + 记录可见性 + 字段级 VIEW 隐藏 + 数据范围），与页面同源。
  - 列头用子字段显示名；值解析为显示值：人员→姓名、部门→部门名、字典/选项→标签、多选顿号分隔、日期 `yyyy-MM-dd HH:mm`、布尔是/否、附件文件名；不输出内部 id（解析不到时留空，不回落 id）。
  - 导出全部子表行（不受列表分页影响）；公式注入防护：`= + - @` 开头文本显式 `@` 文本格式写入。
  - 文件名 = 表单名_明细表名_记录编号.xlsx；UTF-8 `Content-Disposition`。
- 前端：`TableControl` 只读模式且具备记录上下文时，每张明细表顶部显示「导出 Excel」；三处只读视图（表单详情/任务详情/我发起的）共用，一处实现三处生效；`PrintActions/打印版面`中该按钮不进纸。
- 测试：`FormDetailTableExportServiceTest`（2/2：显示值/隐藏列/全部行/公式注入）、`TableControl.spec.ts`（2/2：按钮与调用参数）。
- 证据：`b7_*` 六个 xlsx（三入口 × 两张表，内容逐单元格一致）、`b7_*_content.png`、`b5_yangfan_itemsA*`。

### R2 日志时间列

- 日志查询三页签时间列统一 `yyyy-MM-dd HH:mm:ss`（去 T、去微秒），显示层格式化，不改服务端存储。证据：`b8_log_login.png` / `b8_log_operation.png` / `b8_log_exception_field.png`。

### R3 操作日志内容

- 只记改动类：查询/分页/详情（末段 page/list/query/search/tree/detail/options/check/validate/preview/stats/current/audit/bindings/administrators 等）不记；GET 不记。
- 动作中文化：新增/修改/删除/导入/导出/发布/启用/停用/授权/重置密码/启停（按路径末段 + HTTP 方法 + 请求体 status 判定）。
- 模块中文化：用户管理、角色管理、部门管理、岗位管理、菜单管理、字典管理、租户管理、用户组、单点登录、流程定义、流程分类、流程目录、表单定义等。
- 对象可读：优先请求体业务名称（username/roleName/deptName/name/title…）组成「用户 zhangsan」；拿不到名称用「用户 {id}」；导入/导出写「用户批量导入/用户导出」；不再写接口路径。
- 失败原因可读：优先服务端 `msg`，HTTP 状态映射为中文；二进制下载响应（xlsx）按成功处理，不再出现「业务码 非0」。
- 测试：`AuditOperationFilterTest`（6/6）。
- 证据：`b8_log_operation.png`（导入失败/修改/导出/发布等中文行；查询接口零审计行）。

### R4 登录日志

- 动作写中文：登录/登出/修改密码；模块固定「认证」；对象列留空（账号列已承载身份，不再写接口路径）。前端对历史行保留英文码映射兜底。
- 证据：`b8_log_login.png`（时间/认证/登录/—）。

### R5 两条失败记录的原因与处置

1. `/system/user/page` HTTP 500：真实缺陷。PostgreSQL 无法推断 `CONCAT(CONCAT('%', ?), '%')` 中参数类型（`could not determine data type of parameter`），带关键字的用户分页必 500（克隆库复现，PostgreSQL 日志与 Server 日志均有 `BadSqlGrammarException`）。修复：关键字 LIKE 模式在应用侧生成（`UserPageQuery.getKeywordLike()` → `%keyword%`），SQL 改为 `LIKE #{q.keywordLike}`；修复后关键字/部门/租户组合查询均 200（`sw100-r5-diag4` 输出）。
2. `/system/user/export`「业务码 非0」：误判，不是业务失败。导出返回 xlsx 二进制（HTTP 200），审计过滤器只解析 JSON `code`，读不到即记失败。修复：非 JSON 下载类响应按 HTTP 状态判成功；新导出记录为「成功 / 导出 / 用户导出」（`b8_log_operation.png` 第 3 行）。
- 旧失败行保留为历史记录，不删除；失败原因新口径为服务端可读文案。

### R6 超管导入未选租户

- 前端在打开导入弹窗与提交两处前置拦截：超管未选目标租户 → toast「请先选择目标租户」，不打开弹窗、不发请求。证据：`r6_import_guard.png`。

## B 补证（B1—B9）

### B1 多数据库 V1.0.0 迁移与冒烟

| 库 | 迁移 | 冒烟 | V1.0.0 对象核对 | 结果 |
|---|---|---|---|---|
| MySQL 5.7.44 | 31 条 → 1.0.0（重复 migrate 0 条） | `MySqlBootSmokeTest` 1/1 | 列 1 / 表 1 / 菜单 9115+430+431 / 授权 9 | 通过 |
| MySQL 8.0 | 31 条（种子库） | `MySqlBootSmokeTest` 1/1 | 同上 | 通过 |
| MariaDB 10.6.28 | 31 条（种子库） | `MySqlBootSmokeTest` 1/1（jdbc:mariadb） | 同上 | 通过 |
| Oracle 21c XE | 31 条 → 1.0.0 | `OracleBootSmokeTest` 1/1 | 列 1 / 表 1 / 菜单 3 / 授权 9 | 通过 |
| SQL Server 2022 | 32 条（V1.0.0 + 新增 R__1.0.0） | `SqlServerBootSmokeTest` 1/1 | 列 1 / 表 1 / 菜单 3 / 授权 3 | 通过（修复后） |
| openGauss 5.0 | 31 条（Vendor Runner） | `OpenGaussBootSmokeTest` 1/1 | 启动冒烟内建；测试库用后即删 | 通过 |
| DM8 / KingbaseES | 无本机镜像/授权 | — | 静态核对：`V100MigrationStaticParityTest`（九方言列/表/菜单/按钮/授权齐全）+ `DmOracleScriptParityTest`、`KingbasePostgresParityTest` | 静态通过，实库待 Owner |

- **B1 发现并修复的缺陷（SQL Server 首装）**：SQL Server 的用户/菜单基线在可重复脚本 `R__0.2.0_sqlserver_seed.sql` 中，Flyway 先执行版本化脚本再执行可重复脚本。V1.0.0 原先在同一版本化脚本内按父菜单权限插入导入/导出按钮并授权，全新库首次迁移时父菜单尚不存在，按钮与授权被静默跳过（实测菜单 9115 有、430/431 无、授权 0）。修复：SQL Server 的 9115/430/431 与 admin 授权移到新增 `R__1.0.0_audit_log_menu.sql`（可重复脚本），V1.0.0 只保留列与审计表；`SqlServerSeedMigrationTest` 增加终态断言（列/表/3 菜单/3 授权），`V100MigrationStaticParityTest` 防止回退。
- MySQL 5.7 需 `sessionVariables=explicit_defaults_for_timestamp=ON`（`timestamp` 首列隐式默认值），P66 同口径；MySQL 8.0 该参数无效但兼容。

### B2 F2-1 打印模板配置

- 设计器截图：`b2_designer_canvas.png`、`b2_print_template_dialog.png`（打印字段：申请标题/负责人/所属部门/研判结论；明细表：采购明细/验收明细；包含审批历史开；抬头「华云科技 · 1.0.0 打印验收」；页脚「内部资料 · 请勿外传」）。
- 保存后通过设计器「发布」走确认弹窗发布新版本：`b2_publish_confirm.png`、`b2_after_publish.png`；克隆库版本 2→3→4→5（打印模板 v3、字段隐藏 v4、UI 复验 v5）。
- 生效：`b3_form_detail_print.png` 只出现所选 4 个字段与两张明细表，抬头/页脚/标题按配置；未选字段（标签/内部备注）不出现；审批历史按开关打印。

### B3 F2-2 三处浏览器打印预览

- 表单详情：`b3_form_detail_print.png`（A4、无菜单/按钮、明细表跨页表头重复、抬头页脚）。
- 任务详情：`b3_task_detail_print.png`（模板同口径）；任务已办结后仍可打开：`b3_r1_task_detail.png`。
- 我发起的：`b3_my_instance_print.png`。
- 审批历史带意见与部门：`b3_r1_task_detail_print.png` / `b3_r1_my_instance_print.png`（办理人「系统管理员」、部门「根部门」、意见「同意，按 v2 版本留档」）；PDF 侧同见 `b6_r1_old_v2_page_3.png`。

### B4 F2-3 服务端 PDF 每页截图与对照

- R3（模板 v3）PDF 2 页：`b4_task_detail_page_1.png`、`b4_task_detail_page_2.png`；第 2 页表头重复、30 行明细跨页、页脚「内部资料 · 请勿外传 / 表单版本 v3（提交时版本）/ 第 2/2 页」。
- 显示值：采购负责人=系统管理员、标签=蓝色、绿色、到货时间=`2026-11-12 09:30`，与浏览器打印一致（PDF 值渲染器本轮补齐人员/部门/字典/多选/日期/布尔/附件）。
- 表单详情（无实例上下文）PDF：`b4_form_detail.pdf`，页脚「未定位到提交时版本，按当前版本 v5 打印」。
- 三处入口 PDF：`b4_form_detail.pdf`、`b4_task_detail.pdf`、`b4_my_instance.pdf`（均 2 页）。

### B5 F2-4 字段隐藏账号对照

- v4 定义：`internalNote` 与 `itemsA.secretNote` 仅 `user:1` 可见；测试账号 yangfan（staff，租户 0）登录。
- 页面：`b5_yangfan_page.png` 无「内部备注」、明细表密级备注列空白。
- 打印预览：`b5_yangfan_print.png` 无隐藏值。
- PDF：`b5_yangfan.pdf`（2 页），文本不含「机密」「内部备注」。
- 导出：`b5_yangfan_itemsA.xlsx` 30 行，密级备注列 30 格全空；对照管理员导出 `b7_form_detail_itemsA.xlsx` 同列 30 格全有值。内容截图：`b5_yangfan_itemsA_content.png`。

### B6 F2-5 历史版本与未定位版本

- 旧实例 R1（提交于 v2 快照之后、v3 之前）PDF：`b6_r1_old_v2.pdf`（3 页）——无 v3 抬头、按 v2 字段全集打印，页脚「表单版本 v2（提交时版本）」；审批历史页 `b6_r1_old_v2_page_3.png`。
- 定位不到版本：R2 实例创建时间回拨到全部快照之前（克隆库测试数据），PDF `b6_r2_unpinned.pdf`——页脚「未定位到提交时版本，按当前版本 v5 打印」（`b6_r2_unpinned_page_1.png`）。
- 修复：`publishNewVersion` 原先对含 TABLE 字段的定义一律拒绝（「新版本暂不支持新增或变更 TABLE 字段」），导致**带明细表的表单无法发布打印模板版本**（B2/B6 直接受阻）。改为：明细表结构未变化时允许随新版本保留（不产生 DDL），新增/变更明细表仍拒绝；新增回归测试（`FormI2ClosureIntegrationTest#publishNewVersion_shouldKeepUnchangedTableAndRejectChangedTable`）。

### B7 F2-6 三处导出对照

- 同一记录 R3（2 张明细表，采购明细 30 行 > 一页，验收明细 5 行），三处入口各导出两张表：`b7_{form_detail,task_detail,my_instance}_{itemsA,itemsB}.xlsx`。
- 内容逐单元格一致（itemsA 30 行、itemsB 5 行，三入口相同）；列头为显示名、值为显示值、无内部 id；内容截图 `b7_{entry}_content.png`（含全部 30+5 行），与页面 `b3_form_detail.png` 逐行对照一致。
- 导出文件名实测：`1.0.0 打印验收表单_采购明细_044c25b1-….xlsx`（表单名_明细表名_记录编号）。

### B8 F3 日志查询复核

- 三页签重拍：`b8_log_login.png`（时间格式、认证/登录）、`b8_log_operation.png`（中文模块/动作/对象、导入失败可读原因、导出成功）、`b8_log_exception_field.png`（异常类型/请求/事件引用/摘要展开字段）。
- 查询不记：批量操作后 `sys_audit_log` 无 `/system/user/page` 新行；`/system/audit-log/page` 自身也无记录。
- 租户隔离：租户 9001 管理员（`sw100_imp_a1` + demo_admin）登录日志页 `b8_log_tenant_admin.png`；接口返回行 tenantId 仅 `9001`，显式查 tenant 0 被拒（400）。
- 清理有界验证：`AuditLogPurgeIntegrationTest`（真实 H2 表）——120/100 天前 2 行被分批删除，10 天/1 天前 2 行保留，batch=1 多轮删除后停止；`purgeBefore` 增加「删除 0 行即结束本轮」防死循环保护。
- 保留配置：`sw.audit-log.retention-days:90` + 每日 03:30 清理任务。

### B9 F4 IoT 发起人

- 流程监控列表（`/workflow/instances`，每页 100 条）：`b9_iot_list.png` 含两行 `iot-2118777882178838530` / `iot-2118780073471991810`，发起人列「系统（IoT）」。
- 详情抽屉：`b9_iot_detail.png` 发起人「系统（IoT）」。
- 「实例监控干预」页（`/workflow/monitor`）：表头为 实例 ID/流程定义/状态/当前节点/发起时间/干预，**无发起人列**，不存在口径不一致（`b9_instance_monitor.png`）。
- 待办列表：克隆库无 IoT 待办行，如实说明。

## C 本批发现并修复的实现缺陷

1. SQL Server V1.0.0 菜单/授权种子在首装时被静默跳过（见 B1）。
2. `publishNewVersion` 拒绝未变化的 TABLE 字段，阻断带明细表表单的打印模板版本化（见 B6）。
3. 浏览器打印未消费 `printTemplate`：新增 Teleport 打印专用版面 `PrintSheet`，按字段/明细表/审批历史/抬头页脚打印；打印时 `#app` 整体不进纸。
4. 服务端 PDF 仅输出原始值（人员 id、JSON 多选、ISO 时间）：补齐显示值解析（人员/部门/字典/多选/日期/布尔/附件），与页面一致。
5. PDF 审批历史意见只读 `opinionFields`，普通意见（`opinionData.comment`）丢失：增加回退。
6. 导出二进制响应被审计误判为失败（见 R5-2）。
7. 用户分页关键字在 PostgreSQL 500（见 R5-1）。
8. 审计清理删除 0 行时可能同批反复查询：增加提前返回。
9. 首登改密过滤器白名单缺 `/system/auth/*` 双映射（第一批已修，本批复测仍生效）。

## D 门禁

- Server：`mvn -fae test` 全模块 + Bootstrap 单独复跑，合计 **2497 run / 1 failure / 0 error / 45 skipped**。唯一失败为既有偶发 `CommandQueueIntegrationTest.p0PrioritizedWhileNormalBacklogged`（P0 与 NORMAL 车道时序断言；前批次已做 stash 双侧对照确认原有偶发，本批复跑仍偶发，非 1.0.0 改动引入）。Bootstrap 单模块 **343 run / 0 fail / 0 error / 45 skipped，BUILD SUCCESS**。其余模块 0 失败 0 错误。
- 测试稳定性处置：I5 会话过期断言改为「不得新增会话键」（原集合相等断言会把窗口内 TTL 过期误判为新会话，本轮全量偶发实证）；notify I6 文件库测试前清理 `target/i6-restart-db` 残留（跨轮复用导致 attempt 计数偏移）。
- Server 新增测试：明细表导出 2、审计过滤器 6、审计清理 1、用户关键字 1、V1.0.0 九方言静态 2、publishNewVersion 表格 1。
- Web：`pnpm typecheck` 0 错；`pnpm lint` 0 错；`pnpm test` 2056 passed / 3 skipped；`pnpm build` 通过。
- 多库门禁：MySQL 5.7/8.0、MariaDB、Oracle、SQL Server、openGauss 冒烟 1/1；静态核对九方言。

## E 环境与数据

- 克隆库 `smart_workflow_100`（UAT dump 恢复，34 行 Flyway / 1.0.0），新增测试数据：表单 `v100_print_demo`（2 明细表）、流程定义 `bpm_8bcd763707974aac`（1.0.0 打印验收流程）、记录 R1/R2/R3、任务与审批意见、租户 9001 日志菜单授权、yangfan 为 R3 任务办理人。
- 测试账号：`sw100_imp_a1`（租户 9001 管理员）、`yangfan`（租户 0 staff）；口令不入 Git/回执。
- 隔离端口：Server 18093、Web 5275；未触碰用户 8080/5173、`smart_workflow_f1v4b`、`smart_workflow_030`。
- 多库容器：`swmdb-mysql57`(13307)、`swmdb-mysql80`(13308)、`swmdb-mariadb`(13309)、`swmdb-oracle21`(11521)、`swmdb-sqlserver`(14333)、`swmdb-opengauss`(15432)；仅本机验收用。

## F 提交

- Server `feature/1.0.0`：`7bde20b2`（返修 + PDF/审计/多库修复）。
- Web `feature/1.0.0`：`4e93037`（打印版面/导出按钮/日志显示/R6 拦截）。
- 工作区：本回执 + memory 同步。

## G 限制与未覆盖（如实）

1. DM8 / KingbaseES 无本机镜像或需 Owner 授权，未跑实库；已用九方言静态核对 + 既有 Dm/Oracle、Kingbase/PG 对等测试覆盖。
2. MySQL 5.7 需 `explicit_defaults_for_timestamp=ON` 会话参数（P66 同口径）；未加 8.0 专用分支。
3. 浏览器打印 PDF 的对照以 `@media print` 渲染截图 + 服务端 PDF 为准；原生打印对话框无法截图。
4. 旧实例的**浏览器**打印按当前打印模板渲染（服务端 PDF 按提交时快照版本，B6 证据为 PDF）；快照版本化在浏览器侧无独立接口，未在本批扩展。
5. 「我发起的」列表按流程名展示，不以表单标题检索；B7 用流程编号定位最新记录。
6. 克隆库中 R2 实例时间回拨为测试构造，用于「定位不到版本」分支。

## H 证据清单

`product/v1.0.0-release/receipts/evidence/`（gitignore）：
- B2：`b2_designer_canvas.png`、`b2_print_template_dialog.png`、`b2_publish_confirm.png`、`b2_after_publish.png`
- B3：`b3_form_detail*.png`、`b3_task_detail*.png`、`b3_my_instance*.png`、`b3_r1_*.png`
- B4：`b4_*.pdf` + `b4_*_page_*.png`
- B5：`b5_yangfan_page.png`、`b5_yangfan_print.png`、`b5_yangfan.pdf`、`b5_yangfan_itemsA.xlsx`、`b5_yangfan_itemsA_content.png`
- B6：`b6_r1_old_v2.pdf` + pages、`b6_r2_unpinned.pdf` + page
- B7：`b7_*_{itemsA,itemsB}.xlsx`、`b7_*_content.png`
- B8：`b8_log_login.png`、`b8_log_operation.png`、`b8_log_exception_field.png`、`b8_log_tenant_admin.png`
- B9：`b9_iot_list.png`、`b9_iot_list_row.png`、`b9_iot_detail.png`、`b9_instance_monitor.png`
- 其他：`r6_import_guard.png`、`setup.json`、`current_definition.json`
