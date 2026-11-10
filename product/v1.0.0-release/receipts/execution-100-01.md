# execution-100-01：1.0.0 阶段 2 实施完成（第一批回执）

方向 `product/v1.0.0-release/ready/direction-v1.0.0.md`（XL）｜执行｜2026-11-11｜分支两仓 `feature/1.0.0`，先验收后合并，本批为阶段 2 全量 + 门禁证据；阶段 3 隔离环境浏览器/多库证据随后续批次提交。

## 1 提交与版本

- Server `feature/1.0.0`（develop `cffce87d` 起）：`3931270c` 版本+V1.0.0 迁移+断言 → `b9956cc5` F3/F1-4/F1/F4 → `cf798db7` F2 PDF → `2baf48ad` 惰性修复 → `14057da5` README → `f1bf5d8b` 功能清单。pom `<revision>1.0.0-SNAPSHOT</revision>` 与工作流断言/`check-version-identity.sh`/`build-prod.sh` 同批（0.4.1 无残留）。
- Web `feature/1.0.0`（develop `c5b1b87` 起）：`e553753` 全部前端；`package.json` 1.0.0。
- 工作区 `develop-sw`：`9a39303a` version.json（1.0.0 IN_DEVELOPMENT，featureCount 55）、根 README 图注/版本/新能力、production-ops 迁移命名修正、子仓指针。

## 2 功能落点（F1—F4）

- **F1**：`UserImportExportService`（模板签名 `sw-user-import-template-signature`、500 行/5MB、编码匹配 0/多命中行级错误、整批事务回滚 0 行落库、文件内手机号重复=错误/库内重复=警告、只新增）；`UserController` `/import-template` `/import` `/export`（`system:user:import/export`）；导入置 `must_change_password=1`（管理员新建同置，SSO 无预建号不受影响）。前端导入对话框（统一初始密码）+ 结果弹窗 + 导出（不导密码，数据范围由 `@DataScope` 链）。
- **F1-4**：`sys_user.must_change_password`（9 方言）；`LoginUser.mustChangePassword`；`MustChangePasswordFilter`（403 + `system.must_change_password`，放行 refresh/logout/password/me/menus）；登录/刷新响应透传标记；改密 ≥8 位、≠当前密码、成功复位并踢缓存；前端 `ChangePasswordView` + 守卫 `CHANGE_PASSWORD_PATH` 收敛。
- **F2**：definition `printTemplate` 根键随定义版本化（adapters 保存链 + contracts `FormPrintTemplate` + 设计器配置弹窗 + `itemsToDefinition` 第 7 参）；三处入口（表单/任务/我发起+监控详情）`PrintActions`：浏览器打印（全局 `@media print` A4、`thead` 重复、行不截断）+ 下载 PDF；服务端 `FormPrintController` `/workflow/print/pdf` → `FormPrintFacade.recordDetail`（**权限过滤链** `FormDataQueryService.getRecordDetail`，未触碰 `FormRecordReadFacade`）→ `FormPrintPdfService`（PDFBox 3.0.4 既有托管依赖直绘：A4、嵌入字体子集、明细表分页重复表头/行不截断、审批历史含意见展示文本+部门、页脚版本说明）；提交时版本按 `sw_form_snapshot.create_time ≤ instance.create_time` 命中快照（`versionPinned`），未命中回退当前版本并页脚注明。字体 `fonts/NotoSansSC-Regular.ttf`（OFL 1.1，本机 Windows 自带 Google Fonts v2.04 VF 静态实例化 wght=400，随包分发合规）+ `OFL.txt`。
- **F3**：`sys_audit_log`（9 方言，不含 update/deleted/version，tenant_id=0 预登录行仅超管可见）；`AuditLogService`（吞错、截断、挂载 suspending 显式租户）；登录全失败阶段同步落 LOGIN/FAIL（IP/UA/尝试账号）；登出/改密 LOGOUT/CHANGE_PASSWORD；`AuditOperationFilter`（`/system/**`、`/workflow/defs|categories|catalog`、`/form/def` 写操作，业务码判定结果，不含密码令牌——只记路径与结果文案）；`GlobalExceptionHandler` 未处理异常发布 `UnhandledExceptionAudit`（类型+安全结论+eventRef，无堆栈/请求体）→ 监听器落库；查询 `/system/audit-log/page`（`system:log:list`，超管经 `ManagementTenantContext` 按租户筛选）；`AuditLogCleanupJob` 每日 03:30、`sw.audit-log.retention-days:90` 分批物理删除；菜单 9115 + admin 授权。
- **F4**：`InitiatorDisplay.resolve`（initiatorId=0 → 系统（IoT））接入监控列表/详情、我发起的列表/详情、待办；前端两处数字回落改 `—`；README 三份图注「流程结构总览」+ 版本 1.0.0 + 根 README 新能力段。

## 3 门禁证据

- **迁移**：9 方言同名 `V1.0.0`；计数 30→31（`FlywayFullChain{H2,Postgres,MySql,Oracle}Test`、`I6G7UpgradeDrill`、`I6G7bOldBaseline`、`FlywayUpgradeFrom032Test` 0.3.2→1.0.0 新增 3 条、衔接 9→10/17→18、四库 Seed/Boot 冒烟、DM/Kingbase parity 31、`SqlServerScriptStaticTest` 31）；`sys_menu` 143→146；0.3.2 升级夹具剔除名单 +`V1.0.0__`。H2 全链先行绿，PG zonky 31 条 validate 通过。
- **Server 全量**：`MAVEN_OPTS=-Xmx2g mvn -q compile` 绿；第一轮全量 `mvn test`（全反应堆）= **2482 tests / 0F / 0E / 45 skipped，BUILD SUCCESS 22:50min**（批次 1 后基线）；第二轮（功能全量）除 1 例失败外全绿：`CommandQueueIntegrationTest.p0PrioritizedWhileNormalBacklogged` PENDING↔PROCESSING 时序。**双侧对照**：暂存全部改动跑基线 HEAD 三次 1 绿 2 失败、恢复改动三次 2 绿 1 失败——固有 flake（memory 已登记 CI 偶发族），与改动无关。修正提交后原失败集 6 类 21 用例 `-am` 全绿；F2 渲染冒烟 2 用例绿（真实 PDFBox+字体，`%PDF-` 头、断言无权收敛）。
- **Web 四连**（带 2G 限额）：typecheck 绿；lint 0 error 0 warning（`/* global */` 约定补齐、模块互引消除——PDF 下载内联进 `PrintActions`）；**test 2054 passed / 3 skipped / 0 failed**（含 4 个 router spec 的 token mock 增补 `getMustChangePassword: () => false`）；build 绿 4.10s。
- 过程截图与原始日志本地留存（`product/v1.0.0-release/receipts/evidence/`，gitignore），凭据/密码不入 Git。

## 4 已知限制与偏差（如实）

1. **首登版本打印**：提交时版本靠快照时间定位；实例无 create_time 或快照缺失时按当前版本打印并页脚注明（方向 F2-5 允许口径，回执备案）。
2. **审计操作域**：第一版只覆盖 F3-2 点名的管理写域与导入导出；业务流转/表单数据操作未审计（方向 F3-2 列举范围已全覆盖）。
3. **固有 flake**：`p0PrioritizedWhileNormalBacklogged` 双侧对照实证；合并前补一次含该类的定向绿跑作最终证据。
4. **阶段 3 待办**（下一批）：隔离环境起 Server/Web + 克隆库，补 F1 模板/成功导入/含错导入查库 0 行/改密拦截 403/无权限 403、F2 三处打印+PDF 分页/隐藏字段对照/历史版本、F3 三类日志+筛选+租户对照+无密码检查+保留期有界验证、F4 三处截图、`flyway_schema_history` +1 行（版本 1.0.0）；MySQL/Oracle/SQL Server/openGauss 容器冒烟按 P66 口径。

## 5 引用

- 方向 §2 版本/迁移同批（0.4.1 首轮 CI 失败教训已规避：四处断言同批收敛）。
- 回执遵守：初始密码/测试账号密码不写入；不碰用户 8080/5173、`smart_workflow_f1v4b`/`030`、`.runtime-*`、未提交 `vite.config.ts`（未触碰）；未强推、未动 tag/Release。
