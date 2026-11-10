# 1.0.0 评估附录（file:line 证据）

说明：路径相对 `E:\code\Smart-WorkFlow-Agent-Workspace`。Server=`Smart-WorkFlow-aPaaS-server`，Web=`Smart-WorkFlow-aPaaS-Web`。

## Q1 P27 人员批量导入导出（M01-F02-05）

### P32 实现与可复用性

- POI 5.4.0 只在 form-biz：`Server/sw-biz/sw-biz-form/sw-biz-form-biz/pom.xml:64-68`；版本管理 `Server/sw-dependencies/pom.xml:98-99`。
- 模板：双行表头（显示名 + 映射键），TABLE 子表独立 sheet，首列「数据行号」：`FormImportExportService.java:280-322`；模板签名 `:241-259`、`:324-327`；签名不匹配整体拒绝 `:490-524`。
- 导入：`TransactionTemplate` 内逐行调用 `formSubmitService.submitForm`，任一行失败 `setRollbackOnly`，整批零落库：`:354-416`；行级错误 `RowError(rowNum,message)` `:1091-1107`；行号为 Excel 实际行号 `:528-544`。
- 导出：单行表头、空结果也回表头、REFERENCE 显示值、TABLE 子表展开：`:626-705`、`:717-761`。
- 上限：导入 500 行/5MB、导出 1000 行：`:62-68`、`:372-375`、`:639-648`；容器 6MB：`Server/sw-bootstrap/src/main/resources/application.yml:16-17`。
- 公式注入防护：`:942-964`。
- 入口：`FormImportExportController.java:49-65`（模板）、`:83-105`（导入）、`:122-140`（导出），上下文 `/api`。
- 前端：`Web/src/modules/form/components/FormDataList.vue:74-76`、`:581-602`、`:604-660`、`:665-701`、`:769-800`、`:944-972`；API `Web/src/modules/form/api/form.ts:324-381`；Blob 错误解析 `Web/src/foundation/request/index.ts:256-279`。

### 用户模型与匹配

- 创建接口 `POST /system/user`：`Server/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/controller/UserController.java:118-128`；DTO `:56-74`（只有 username `@NotBlank`，plainPassword 无注解）。
- 服务层真正必填：`SysUserServiceImpl.java:82-83`。
- 部门 `deptId` Long：`SysUser.java:47-49`；角色 `List<Long>`：`UserController.java:68-69`、`SysUserServiceImpl.java:207-229`；岗位 `{postId,deptId}`：`UserController.java:70-83`、`SysUserServiceImpl.java:265-299`。
- 用户无直属负责人字段：`sys_user` DDL `Server/sw-bootstrap/src/main/resources/db/migration/h2/V0.2.0__baseline_seed.sql:102-125`；部门负责人 `sys_dept.leader_id` `:81`，`SysDept.java:36-39`。
- 唯一性：角色编码租户内唯一 `V0.2.0__baseline_seed.sql:864-865`；岗位编码由服务层保证 `SysPostServiceImpl.java:104-112`（DDL 无唯一索引 `:85-98`）；部门名称/编码都无唯一约束 `:65-82`，名称查询是 LIKE `SysDeptServiceImpl.java:126-133`。
- 按编码匹配先例：`FormAppBundleDocument.java:63`、`FormAppBundleService.java:576-598`。
- 租户：`ManagementTenantContext.java:33-44`、`:123-128`；超管跨租户旁路 `CommonTenantLineHandler.java:50-58`；P32 不支持超管跨租户（`FormImportExportService.java:447`、`:765`），不能照搬。

### 密码与导出

- 无密码强度规则；`PasswordPolicyValidator` 是空 SPI：`Server/sw-framework/sw-security/src/main/java/com/sw/ck/security/spi/PasswordPolicyValidator.java:1-9`。
- 无强制首次改密字段：`sys_user` DDL `V0.2.0__baseline_seed.sql:102-125`；登录不检查 `AuthController.java:169-183`。
- 管理端无重置密码接口；编辑页剔除密码：`Web/src/modules/system/views/UserList.vue:363-373`、`:704-713`。
- BCrypt(10)：`SystemAutoConfiguration.java:66-70`；创建即 BCrypt `SysUserServiceImpl.java:93`。
- `SysUser.password` 仅 Jackson WRITE_ONLY，不防导出：`SysUser.java:22-25`。

### 重复与事务

- 用户名先查后插 400：`SysUserServiceImpl.java:86-92`；DB 唯一索引 `(tenant_id,username,deleted)`：`V0.2.0__baseline_seed.sql:5325-5326`；竞态 `DuplicateKeyException` 落 500 `GlobalExceptionHandler.java:195-201`。
- 手机号无唯一约束；SSO 多命中拒绝 `SsoAuthService.java:834-841`；通知 AMBIGUOUS `NotifyTargetResolverImpl.java:67-69`、`:87-94`。
- 部门不存在 400：`SysUserServiceImpl.java:385-390`。
- 角色/岗位非法被统一成泛化文案：`GlobalExceptionHandler.java:132-139`。
- 单条事务：`SysUserServiceImpl.java:81-82`、`:99-105`；批量先例 BPM 部分成功 `BpmBatchServiceImpl.java:36-43`、`:50-92`；P32 整批原子 `FormImportExportService.java:377-416`。

### 权限与菜单

- 权限点：`UserController.java:89,110,121,134,148,156,162,170,178`。
- 菜单：用户管理 `id=11`，按钮 `100/101/102`：`V0.2.0__baseline_seed.sql:961-963`、`:313-315`、`:2031-2048`；管理员角色授权 `:2069-2079`。
- P32 权限拆分先例：`FormImportExportController.java:49,83,122`；种子 `V0.2.0__baseline_seed.sql:1924-1937`；补授权 `R__bf20261020_form_data_admin_grants.sql:1-31`。
- 前端 `v-perm`：`UserList.vue:481-484`、`:449-463`；`Web/src/foundation/permission/index.ts:11-13`。

## Q2 P33 打印模板（M03-F06-01）

### 现状

- Web 全仓 `window.print`/`@media print`/`beforeprint`/打印 等 0 命中（排除 node_modules/dist/.git）。
- 表单渲染：`Web/src/modules/form/views/FormRender.vue`，只读模式 `:121-124`，动作区无打印 `:1160-1232`；移动端复用 `MobileFormRender.vue:9-21`。
- 任务详情：`Web/src/modules/workflow/views/TaskDetail.vue:90-99`、`:153-170`、`:1256-1262`，无打印。
- 实例详情：`MyInstances.vue:223-244`；监控抽屉 `ProcessInstanceList.vue:260-309`，不含业务表单与审批意见/部门。
- 审批历史渲染可复用：`InstanceFlowPanel.vue:95`、`:748-750`、`:869-872`。

### 依赖

- Web 依赖列表 `Web/package.json:21-35`，无 jspdf/html2canvas/pdfmake/print-js/pdf-lib/dom-to-image。
- Server 无 iText/OpenPDF/Flying Saucer/OpenHTMLtoPDF/FOP/JasperReports；PDFBox 仅 knowledge 解析 `Server/sw-basic/sw-basic-knowledge/pom.xml:51-54`、`KnowledgeAutoConfiguration.java:8`。
- 前端字体：`Web/src/assets/fonts/noto-sans-sc/`（101 个 woff2，约 4.6MB），`Web/src/styles/fonts.css:1-11`，`Web/src/styles/tokens.css:24-26`；服务端 .ttf/.otf/.ttc/.woff 0 个，无 Dockerfile，`Server/start.sh:1-15`。

### 数据可得性

- 表单定义：`GET /form/def/by-key/{formKey}/definition` `FormDefinitionController.java:286-295`；历史版本 `:302-313`；前端 `Web/src/modules/form/api/form.ts:32-54`。
- 记录详情：`GET /form/data/{formKey}/{recordId}` `FormDataController.java:47-53`；`FormDataQueryService.getRecordDetail` `:738-876`（主字段 `:826`，TABLE `:828-875`，viewDenied `:780-788`，数据范围 `:790-797`）。
- 列表查询不返回 TABLE：`FormDataQueryService.java:1374`、`:1408`。
- 任务详情：`BpmTodoController.java:251`、`:294-300`、`:326-333`、`:355-421`，`ApprovalHistoryEnricher.enrich` `:418-420`。
- 我发起的实例详情：`BpmMyInstanceController.java:260-303`、`:426-428`；关系接口 `:462-539`（`approvalHistory` `:536`、`formData` `:538`）。
- DTO：`ApprovalHistoryItemDTO.java:32-33`（assigneeDept）、`:56-62`（opinionFields）；前端契约 `Web/src/contracts/bpm.ts:57-78`。
- 监控实例详情：`BpmInstanceController.java:124-178`，`InstanceDetailDTO.java:20-33`，不含审批历史。
- 实例无 formVersion：`BpmInstance.java:24-64`；流程变量只有 approver/formKey/recordId/submitter/tenantId/formData：`ProcessStartService.java:191-201`；流程定义版本行有 formVersion：`BpmProcessDefVersion.java:41-43`。
- 内部全量读取 Facade：`FormRecordReadFacade.java:16-34`、`FormRecordReadFacadeImpl.java:46-86`；明确不做权限投影：`FormDataQueryService.java:952-961`。

### 版本化与模板落点

- 表单：`sw_form_def.form_version` `V0.2.0__baseline_seed.sql:574-601`；快照 `sw_form_snapshot` `:622-641`；发布递增 `FormDefServiceImpl.java:485-499`；快照列表/详情 `FormDefinitionController.java:326-329`、`:341-344`。
- 发布快照保留额外根键、只补 listConfig：`FormDefServiceImpl.java:418-431`。
- 前端解析/构造白名单：`Web/src/adapters/form-designer/index.ts:286-323`、`Web/src/modules/form/designer/definition-convert.ts:27-45`。
- 流程定义版本：`sw_bpm_process_def.def_version/published_version` `BpmProcessDef.java:39-43`、`:97-101`；版本表 `V0.2.0__baseline_seed.sql:3327-3353`；冻结 `BpmProcessDefServiceImpl.java:388-419`。
- 流程模板中心是 graph_json：`BpmProcessTemplate.java:18-55`、`TemplateCenter.vue:5-8`；消息模板 `NotifyTemplate.java:24-55`、`NotifyTemplateVersion.java:16-45`；都不是打印模板。
- 应用整包导出 form config `FormAppBundleService.java:234-290`，当前无打印模板项。

### 多库与测试

- 9 方言目录 `Server/sw-bootstrap/src/main/resources/db/migration/{dm,h2,kingbase,mariadb,mysql,opengauss,oracle,postgresql,sqlserver}`；`application.yml:69-88`。
- DM/Kingbase/openGauss 走 `SwVendorMigrationRunner`：`FlywayConfiguration.java:44-52`、`SwVendorMigrationRunner.java:174-180`。
- SQL Server 终态基线：`sqlserver/README.md:3-10`；校验和清单 `pg-repeatable-checksums.properties:1-4`；`SqlServerRepeatableSyncTest.java:44-59`。
- 硬断言：`FlywayFullChainH2Test.java:82-89`、`FlywayFullChainPostgresTest.java:118-126`。

## Q3 P40 日志查询（M10-F02-01）

### 现有审计表与写入点

- `sw_form_lifecycle_audit`：`V0.2.0__baseline_seed.sql:3292`；`FormLifecycleAuditEntity.java:16`；`FormDefServiceImpl.java:911`。
- `sw_bpm_ext_sql_execution_audit`：`:368`；`SqlExecutor.java:114/124`、`SqlExecutionAuditServiceImpl.java:20/36`。
- `sw_bpm_node_function_audit`：`:3693`；`NodeFunctionService.java:258`。
- `sw_bpm_approval_action`：`:2400`；`TaskActionService.java:729`、`ApprovalLifecycleServiceImpl.java:753/1104/1123`。
- `sw_openapi_callback_log`：`:3904`；`OpenApiCallbackDeliveryService.java:189`。
- `sw_job_log`：`:1113`；`SwJobBean.java:152`。
- `sys_sso_audit_record`（LOGIN_SUCCESS/LOGIN_FAILED）：`:4098`；`SsoAuthService.java:1195`、`:1214`、`:1261-1270`、`:703`、`:823`。
- `sys_tenant_status_audit`：`:5623`；`TenantAdminService.java:450`、`TenantStatusAuditJob.java:55-60`。
- `sw_iot_audit_record`：`:3093`；`IotAuditService.java:64`。
- `sw_form_trace`（IP/UA/设备指纹）：`:643`；`FormSubmitService.java:556-573`；`FormSubmitController.java:45-48`。
- `sw_agent_tool_call_log`：`:1358`；`AgentOrchestrationServiceImpl.java:240`。
- `sw_agent_graph_execution(_node/_event)`：`:1479`、`:1522`、`V0.2.7__agent_execution_lifecycle.sql:27`；`AgentGraphExecutionServiceImpl.java:171/353`、`AgentGraphExecutionLifecycleServiceImpl.java:293`。
- `sw_notify_send_attempt`：`:2578`；`NotifyFacadeImpl.java:464`、`NotifyDeliveryRecoveryServiceImpl.java:207`。
- `sw_iot_message_log`：`:2872`。

### 拦截点

- 登录 `AuthController.java:114-116`（无 HttpServletRequest）；失败 10 个 return `:124,135,143,152,155,160,167,170,177,185`；成功 `:197`；刷新 `:207-256`；登出 `:264-282`；改密 `:293-310`。
- 登录锁策略空接口：`LoginLockoutStrategy.java:4-19`。
- 管理操作无审计：`UserController.java:120-149,161,177`、`RoleController.java:54-101`、`MenuManageController.java:29-36`、`DeptController.java:98-121`、`PostController.java:51-71`、`DictController.java:45-145`（0 个 `@PreAuthorize`）、`TenantController.java:99-141`、`BpmProcessDefController.java:107-521`。
- 自动填充仅 create_by/update_by：`CommonMetaObjectHandler.java:39-47`、`:57`。
- 访问日志：`AccessLoggingFilter.java:23`、`:45-47`；注册 `WebSecurityAutoConfiguration.java:109-111`。
- 无 `@Aspect`/HandlerInterceptor；AOP 依赖未声明 `sw-common/pom.xml:35-83`。
- 事件机制：`DomainEventPublisher.java:9-30`；同步登记 `OpenApiCallbackIntentRecorder.java:48`；AFTER_COMMIT `BpmNotifyListener.java:55`；现有事件类型无 Login/Logout/OperLog。
- 异常：`GlobalExceptionHandler.java:50-63`、`:195-206`；`EventRef.java:26-58`。

### 迁移与方言

- 每方言 30 个文件（10 V + 20 R），命名 `V<semver>__<snake>.sql`、`R__<version>_<name>.sql`。
- 排序：`SwVendorMigrationRunner.java:200-216`；正则 `:41-42`。
- SQL Server：`sqlserver/README.md:3-10`；后续版本正常增量。
- 工具：`scripts/db-compat/generate_sqlserver.py:1-10`、`check-reserved-words.py:1-20`；无 9 方言一键生成。
- 测试硬断言：`FlywayFullChainH2Test.java:84-89`、`FlywayFullChainPostgresTest.java:97/113`、`FlywayFullChainMySqlTest.java:66`、`FlywayFullChainOracleTest.java:78`、`SeedBaseMigrationTest.java:29`、`DmOracleScriptParityTest.java:37`、`KingbasePostgresParityTest.java:35`、`SqlServerScriptStaticTest.java:37`、`SqlServerRepeatableSyncTest.java:57`。
- MySQL 5.7 无窗口函数，动态 ID 用 `SET @sw_role_menu_id`：`mysql/R__u020_user_group_menu.sql:20-42`。

### 保留与前端

- `sw.job.log-retention-days:30`：`application.yml:139-142`；`JobProperties.java:22-23`；无读取/清理实现。
- 高量表索引：`sw_agent_tool_call_log` 仅 `(session_id,deleted)` `V0.2.0__baseline_seed.sql:1374`；`sw_openapi_callback_log` `:3922`；`sw_job_log` `:1157-1158`。
- 前端：`StandardListTemplate.vue:1-80`、`ListFilterBar.vue:1-30`、`ListFilterItem.vue:1-15`；`NotifyRecordList.vue:162-210`；`InstanceMonitor.vue:219-262`；`UserList.vue:470-512`；`JobLog.vue:1-60`；`SsoConfig.vue:182-195`、`:424-453`。
- 用户候选：`UserController.java:47-55`、`Web/src/modules/system/api/user.ts:130-146`。
- 菜单：`sys_menu` 全局表 `V0.2.0__baseline_seed.sql:149`、`:433-447`；系统管理 id=1 `:303`；新页面候选 9115、`parent_id=1`、`component=system/views/LogList`；`sys_role_menu` 动态授权 `R__u020_user_group_menu.sql:20-29`；P24 结论 `search_fallback/p24-admin-role-seed-semantics.md:5/9/15/23/43`。
- 路由白名单 `Web/src/foundation/menu/index.ts:72-78`。

## Q4 小尾巴

- 存储 0：`Server/sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/listener/IotProcessTriggerListener.java:323`（`instance.setInitiatorId(0L)`，注释「受控租户系统身份」）。
- 展示回落：`Web/src/modules/workflow/views/ProcessInstanceList.vue:438`、`:483`；`MyInstances.vue:506` 用 `|| dash`；`TodoList.vue:374` 同理。
- 系统名常量：`ProcessThemeService.java:43`（`SYSTEM_INITIATOR_NAME="系统"`）、`:231-237`。
- 名称富化：`BpmInstanceController.java:262-276`（`resolveUserNames`，0 查不到名字）；`BpmMyInstanceController.java:177-192`。
- P69 统计：UAT `/opt/smart-workflow/server/logs/`；`server.log-20261110` 362,776,772 B；标准行 DEBUG 1,849,394、ERROR 24,699、WARN 664、INFO 652；`DataSourceUtils` 1,703,570 行（`Fetching JDBC Connection` 1,741,985 次）；`JdbcTransactionManager` 76,761；`server.log-20261109.gz` 18,720,199 B（11-08 数据）DEBUG 3,228,958、`DataSourceUtils` 2,944,646。当前 `server.log` INFO 1,177/WARN 96/ERROR 3。logrotate：`daily`、`maxsize 100M`、`rotate 14`、`compress`、`copytruncate`。
- README 图注：根 `README.md:50-51`；`Server/README.md:34-35`；`Web/README.md:40-41`。
- 本机清理：`product/approval-record-patch/receipts/evidence/uat-profile-041/`、`captcha.txt` 已删；`docker exec postgres psql -c "DROP DATABASE smart_workflow_041"` 返回 `DROP DATABASE`，复查计数 0。

## Q5 1.0.0 版本

- Server 版本源：`Server/pom.xml:48`（`0.4.1-SNAPSHOT`）、`:9`、`:44-45`；34 个 POM 只有这一处字面值。
- CI：`Server/.github/workflows/build-release.yml:3-7`（无 tag 触发）、`:64-81`（`:72-73` 硬断言）、`:75`、`:87`、`:120-124`、`:141`（`build-${GITHUB_SHA}`）、`:154-157`（`--latest=false`）。
- 脚本：`check-version-identity.sh:12`、`:38`、`:140-141`、`:158-159`、`:59/114/204`（34/32 POM 数）；`build-prod.sh:27-30`、`:40/44/50`；`check-prod-artifact.sh:89`（迁移正则接受 V1.0.0）、`:115-130`；`generate_sqlserver.py:189,193`。
- Web：`Web/package.json:4`；`Web/.github/workflows/build-release.yml:35-38`、`:49`、`:62-63`（无断言）；README `:7/:16/:121`。
- 根：`version.json:4,10,12,20-22,28,29-33,37,42-48,53-54`；`CHANGELOG.md:3`；`README.md:5,15,145`。
- Flyway 排序：`SwVendorMigrationRunner.java:41-42`、`:200-216`；`application.yml:85-88`。
- 测试硬断言（迁移条数/终点）：`FlywayFullChainH2Test.java:84/88/96/122`、`FlywayFullChainPostgresTest.java:97/113/125/140/159`、`FlywayFullChainMySqlTest.java:66/68`、`FlywayFullChainOracleTest.java:78/80`、`I6G7UpgradeDrillH2Test.java:50/52/143`、`I6G7bOldBaselineUpgradePostgresTest.java:102/110/187`、`FlywayUpgradeFrom032Test.java:66-67/126/130`、`ApplicationCenterLegacyUpgradeTest.java:297/302/314`、`ApplicationCenterUpgradeContinuityTest.java:201`、`MySqlBootSmokeTest.java:143/147`、`OracleBootSmokeTest.java:106/111`、`SqlServerBootSmokeTest.java:130/134`、`OpenGaussBootSmokeTest.java:130/133`、`SeedBaseMigrationTest.java:29`、`MariaDbSeedMigrationTest.java:53`、`MySqlSeedMigrationTest.java:53`、`OpenGaussSeedMigrationTest.java:50`、`SqlServerSeedMigrationTest.java:47`、`DmOracleScriptParityTest.java:37`、`KingbasePostgresParityTest.java:35`、`SqlServerScriptStaticTest.java:37`、`SqlServerRepeatableSyncTest.java:57-58`。
- SQL Server 文档：`Server/docs/deployment/multi-database.md:1`、`:72-81`；`production-ops.md:277` 仍写 `V<yyyyMMddHHmmss>__`，与 1.0.0 命名冲突，需一并改。
- 过期现状：`Server/功能清单.md:56` 仍写 0.4.0-SNAPSHOT/0.3.6。
