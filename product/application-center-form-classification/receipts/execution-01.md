# 应用中心与表单分类统一：执行回执（execution-01）

2026-10-15｜Executor｜L（应用中心与表单分类统一）｜总4阶段：2/1/1（实施与验收完成，待规划验收）

> 自验通过，待规划独立验收。功能状态仍为 IN_PROGRESS；未核销 P 编号、未增加功能数、未写功能 PASSED/COMPLETED。

## 0. 一句话结论

两仓实现完成并自验通过：后台「应用管理」（应用=一级分类 / 目录=二级分类 / 表单唯一归属、可见范围、引用保护、停用恢复）+ 用户端「应用中心」（应用→目录→表单→真实数据列表，含受限态与填写发起）+ 存量承接迁移（分类→应用、唯一分类/未分类归属、多归属歧义不自动转换）。Server 定向与全链测试、Web 四连、本机 dev 可见浏览器全链验收均通过；期间发现并修复 1 项缺陷（应用内新建表单未落空 definition 导致设计器打不开）。

## 1. 内部 Step 概要

- Step1 数据模型与迁移：新增 `sw_form_app` / `sw_form_app_dir` / `sw_form_app_user` 三表，`sw_form_def` 增 `app_id`/`dir_id` 归属列与索引；存量承接（确定性规则，不做歧义转换）；菜单与授权 R__（幂等）。H2/PostgreSQL 双份迁移，完整迁移测试锚更新（12 条）。
- Step2 服务与 API：应用/目录 CRUD、可见范围（ALL / SPECIFIED，空集=无人可见）、表单归属调整（目标须为租户内启用应用、目录须属于该应用）、引用保护（非空拒删）、停用/恢复；用户端按应用范围 + 既有表单发布/可见性过滤；权限码 `form:app:manage`；错误码 1700—1706。
- Step3 前端：后台应用管理列表/应用工作区（目录与表单、归属调整）/表单管理上下文（表单设计、流程设计、数据列表入口与关联流程列表）；用户端应用中心与应用内容、表单数据列表（`form:data:query` 口径、受限态、填写入口）；FormDefList 分类树改为应用/目录唯一归属（未归属单列）；设计器保存/返回回到应用表单上下文；契约/API/mock/i18n/组件测试。
- Step4 验证与证据：定向测试、H2/PG 全链与承接迁移测试、Web 四连、本机 dev 可见浏览器验收（AC01—AC06 主要行为）、截图证据。

## 2. 实际读取与修改文件

### Server（Smart-WorkFlow-aPaaS-server）

迁移（新增）：
- `sw-bootstrap/src/main/resources/db/migration/h2/V20261015190000__application_center.sql`
- `sw-bootstrap/src/main/resources/db/migration/postgresql/V20261015190000__application_center.sql`
- `sw-bootstrap/src/main/resources/db/migration/h2/R__application_center_menu.sql`
- `sw-bootstrap/src/main/resources/db/migration/postgresql/R__application_center_menu.sql`（与 H2 逐字节一致）

实体/Mapper/DTO/服务/控制器（新增）：
- `form-biz`：`entity/FormAppEntity.java`、`entity/FormAppDirEntity.java`、`entity/FormAppUserEntity.java`、`mapper/FormAppMapper.java`、`mapper/FormAppDirMapper.java`、`mapper/FormAppUserMapper.java`（含物理删除重建）、`service/FormAppService.java`、`service/FormAppMembershipValidator.java`、`service/impl/FormAppServiceImpl.java`、`controller/FormAppManageController.java`、`controller/FormAppCenterController.java`
- `form-api`：`dto/FormAppDTO.java`、`FormAppSaveReq.java`、`FormAppDirDTO.java`、`FormAppDirSaveReq.java`、`FormAppFormItemDTO.java`、`FormAppContentDTO.java`、`FormAppMembershipReq.java`

修改：
- `entity/FormDefEntity.java`（appId/dirId，updateStrategy.ALWAYS）
- `service/FormDefService.java` / `service/impl/FormDefServiceImpl.java`（createDraft 带归属重载 + 归属校验 fail-closed、filterVisibleFormKeys、toDTO 带归属）
- `controller/FormDefinitionController.java`（createDraft 传归属）
- `api/dto/FormCreateReq.java`、`api/dto/FormDefDTO.java`
- `api/exception/FormErrorCode.java`（1700—1706）
- `sw-common`：`i18n/messages_zh_CN.properties`、`i18n/messages_en_US.properties`（7 组双语）
- `docs/governance/error-code-catalog.md`（187 常量/182 唯一码）
- 测试：`FormAppServiceTest`（新）、`FormAppControllerAuthorizationTest`（新）、`ApplicationCenterLegacyUpgradeTest`（新）、`ErrorCodeCatalogTest`、`FlywayFullChainH2Test`、`FlywayFullChainPostgresTest`（锚更新）、及 11 个既有 form 测试类的建表夹具补归属列（实体列变更同步）

### Web（Smart-WorkFlow-aPaaS-Web）

新增：`contracts/app-center.ts`、`modules/form/api/app-center.ts`、`modules/form/components/AppIcon.vue`、`modules/form/utils/app-icons.ts`、`modules/form/views/AppManageList.vue`、`AppWorkspace.vue`、`AppFormDetail.vue`、`AppCenter.vue`、`AppCenterDetail.vue`、`AppFormData.vue` 及对应 4 个 `*.spec.ts`

修改：`router/index.ts`（6 条静态路由）、`foundation/area.ts`（portal 分区与深链前缀）、`foundation/mock/handlers.ts`、`foundation/mock/seeds.ts`、`locales/zh-CN.ts`、`locales/en-US.ts`、`modules/form/api/form-def.ts`（FormCreateReq/FormDefDTO/FormDefListItem 带归属）、`modules/form/views/FormDefList.vue`（分类树=应用/目录/未归属；新建表单可选归属）、`modules/form/views/FormDesigner.vue`、`modules/workflow/views/ProcessDesigner.vue`（从应用表单上下文进入时保存/返回同一上下文）

## 3. 每个文件修改摘要

- **迁移 V20261015190000**：建三表 + 表单归属列；承接规则：①每个有效分类→应用（id=`lc<categoryId>`，`legacy_category_id` 追溯，可见范围 ALL）；②formKey 的全部有效事项分类去重后恰一个→归该分类应用；③零个（分类缺失，含他租户事项导致的同租户零分类）→本租户「未分类」承接应用（id=`uncat-t<tenantId>`，仅按需创建）；④多于一个（跨分类共用=多归属歧义）→不转换，`app_id` 保持 NULL（保留原可用路径，交冲突清单裁决）；⑤已删表单不承接。全新/空库执行零副作用。
- **R__application_center_menu**：菜单 9130（后台应用管理，`form:app:manage`）、9131（用户端应用中心）；授权 9330/9331（role 2）、9332/9333（role 1）；幂等 `WHERE NOT EXISTS`。
- **FormAppServiceImpl**：管理列表（含停用/承接/计数/指定用户集合）、创建/更新（重名校验；SPECIFIED 集合空=无人可见；切 ALL 清空集合；重配走物理删除重建，避免唯一键占用）、停用/恢复（停用阻止新建目录与归属调整，保留数据）、删除（有目录或表单引用时拒绝并报引用数）、目录 CRUD（同应用内重名拒绝、目录下有表单拒删）、归属调整（目标应用须启用、目录须属于目标应用，失败保持原归属）、用户端列表/内容（可见范围命中 + 已发布 + 既有表单可见性；不可见或停用按不存在处理，不暴露受限对象）。
- **FormDefServiceImpl**：createDraft 新增带归属重载（APPROVAL_COMMENT 表单不参与归属；归属校验组件缺失时 fail-closed 抛错）；新增 `filterVisibleFormKeys` 批量可见性；toDTO 输出归属。
- **前端页面**：AppManageList（应用列表/新建/编辑/停用/删除；新建默认「指定用户」并预选创建者）；AppWorkspace（应用上下文：目录卡片+表单表、新建目录/表单、归属调整、目录引用保护提示）；AppFormDetail（表单设计/流程设计/数据列表入口 + 面包屑 + 关联流程列表）；AppCenter/AppCenterDetail（用户端应用→目录/直接归属表单，空态/失败态/空目录提示）；AppFormData（分页/筛选/加载/空态/失败态；无 `form:data:query` 时明确受限态并保留填写入口；查看/编辑跳既有渲染页）；FormDefList（分类树改应用/目录/未归属；新建表单带归属选择）。

## 4. 实际命令与结果（原始输出位置）

| 命令 | 结果摘要 | 原始输出位置 |
|---|---|---|
| `MAVEN_OPTS="-Xmx2g" mvn -q compile`（全工程） | 退出 0 | 本机终端 |
| `mvn -q test -pl sw-biz/.../sw-biz-form-biz -am` | **Tests run: 195, Failures: 0, Errors: 0, Skipped: 0** | `sw-biz/sw-biz-form/sw-biz-form-biz/target/surefire-reports/` |
| `-Dtest=FormAppServiceTest` | **10/0/0/0**（应用/目录/归属/可见性/跨租户/停用/createDraft 归属） | 同上 `com.sw.ck.form.service.FormAppServiceTest.txt` |
| `-Dtest=FormAppControllerAuthorizationTest` | **5/0/0/0**（管理端 403/放行、用户端登录可达、未认证 401） | `.../controller/FormAppControllerAuthorizationTest.txt` |
| `-Dtest=ApplicationCenterLegacyUpgradeTest` | **6/0/0/0**（承接规则：唯一分类/未分类/歧义不清洗/跨租户/菜单就位/幂等） | `sw-bootstrap/target/surefire-reports/com.sw.ck.bootstrap.ApplicationCenterLegacyUpgradeTest.txt` |
| `-Dtest=FlywayFullChainH2Test` | **17/0/0/0**（全新库 12 条：V0.1.5 + V20261015190000 + 10 R__；终点版本 20261015190000） | `.../com.sw.ck.bootstrap.FlywayFullChainH2Test.txt` |
| `-Dtest=FlywayFullChainPostgresTest` | **12/0/0/0**（zonky 内嵌 PostgreSQL 全链同断言） | `.../com.sw.ck.bootstrap.FlywayFullChainPostgresTest.txt` |
| `-Dtest=ErrorCodeCatalogTest,BilingualMessageContractTest` | **8/0/0/0 / 9/0/0/0**（新错误码唯一、双语成对、catalog 计数同步） | `.../com.sw.ck.bootstrap.ErrorCodeCatalogTest.txt`、`BilingualMessageContractTest.txt` |
| `MAVEN_OPTS="-Xmx2g" mvn test`（全工程，L 级完整校验门） | 全工程 **354 测试类 / 2072 用例 / 3 失败 / 0 错误 / 27 跳过 / BUILD FAILURE**——与 0.1.5 基线同因：`P63ImmediateMqttBrokerPgTest`（受控 broker 未就绪，外部依赖）、`P63ReservationUnknownPgTest`（同因，命令未到 SENT）、`Phase4PgStartWindowCrashTest`（启动窗口时序）；用例 2051→2072（+21=本轮新增 FormAppServiceTest 10 + 授权 5 + 承接迁移 6），失败/错误/跳过零漂移；原始 `/tmp/app-center-server-fulltest2.log` | `/tmp/app-center-server-fulltest.log`（完整原文，本机） |
| `NODE_OPTIONS=... pnpm typecheck` | 退出 0 | 本机终端 |
| `NODE_OPTIONS=... pnpm lint` | **0 errors / 3 warnings**（警告=既有两组件的 `vue/require-default-prop`，与 0.1.5 基线持平） | 本机终端 |
| `NODE_OPTIONS=... pnpm test` | **1549 passed / 3 skipped**（基线 1534 → 本次 +15，与新增 4 个 spec 的 15 用例一一对应） | 本机终端 |
| `NODE_OPTIONS=... pnpm build` | 通过（built in 2.47s；INVALID_ANNOTATION 为 @vueuse 既有第三方提示，非错误） | 本机终端 |

## 5. 与方向的偏差

1. **本地存量库未执行真实迁移**：本地 PostgreSQL `sw_apaas_local` 的 versioned 终点为 V94（0.1.2 前旧链），按 `db/upgrade/0.1.5/README.md` 的受支持入口表属「≤0.1.2 旧链，不支持升级」，且方向未授权对其做结构升级。存量承接行为改由 `ApplicationCenterLegacyUpgradeTest`（0.1.5 基线 + 存量夹具 + 增量迁移）与 H2/PG 全链测试承载；未对任何存量库执行迁移，UAT 存量结构清点仍为未知（沿探索回执边界）。本地只读清点结果：分类 0、事项 16、表单 20，其中 20 个表单的 formKey 有效分类数均为 0（无冲突对象）。该旧链库数据不代表 0.1.5 存量结构，仅作环境事实记录。
2. **超管在用户端不短路应用可见范围**：按方向 §3「管理员进入用户端时按用户端规则处理」实现（应用可见性对超管同样按范围判定，不按用户身份豁免）；数据读取权限仍走既有超管短路。
3. **空指定集合的浏览器复验改用等价证据**：无「有用户端入口但无 `form:data:query`」的现成账号，受限态由服务端授权测试与前端组件测试覆盖；浏览器侧以「全部用户 → 指定 1 人 → 停用/恢复 → 跨租户」验证范围语义。
4. **dev 本机启动注入了 4 项密钥**（`sw.agent.cipher-key` 用仓库 dev 开发密钥；`sw.security.login.rsa-private-key`、`sw.security.jwt.secret`、`sw.security.login.digest-secret` 为本机现场生成的 dev 专用值，仅命令行注入，未改任何配置文件、未入库）。这是本机 dev 启动的既有安全前置（fail-fast 设计），不是本次实现变更。

## 6. 遇到的问题、未完成内容与风险

- **已修复**：应用内新建表单未落空 definition → 设计器 `GET /definition` 返回 1300（设计器提示「无法打开该表单」）。修复=创建后写入空 definition（`saveFormConfig`），修复后重走全链通过；修复轮次 1，无同类复发。
- **已修复（支持性）**：既有 11 个 form 测试类的手工建表夹具在实体加列后报 BadSqlGrammar → 同步补 `app_id`/`dir_id` 两列（195/0 全绿）。
- **风险/限制（如实）**：
  - 存量承接的实际存量分布（各租户分类/多归属歧义数量）仍未知，需在获授权的存量环境用随迁移交付的确定性判定做只读清点；多归属歧义对象（app_id=NULL）按方向保留原路径、未转换，待裁决。
  - 应用「未分类」承接应用为普通应用行（可被改名/编辑），未做系统级保护标记；若需更强保护需方向补裁决。
  - 前端表单归属调整对话框按应用加载目录（逐个 `content` 请求），应用数量大时目标目录下拉有额外请求；当前规模可接受。
- **未完成（授权外）**：发布分支合并、tag/Release、部署、UAT 变更；未对 UAT/生产做任何操作。

## 7. Git diff 摘要

- Web（`feature/application-center`）：`3687d04` → **`74d4be3`**（24 文件，+新增页面/契约/测试），`git push origin feature/application-center` 后远端回读一致（HEAD=origin/HEAD=`74d4be3`）。
- Server（`feature/application-center`）：`d7d376f` → **`72822bc`**（49 文件：迁移双份 4、后端实现与错误码/i18n/catalog、测试 3 新增+13 同步），`git push origin feature/application-center` 后远端回读一致（HEAD=origin/HEAD=`72822bc`）
- 根工作区：本回执与 knowledge 顶部条目同步（根工作区 `develop-sw` 本批次（执行回执 + knowledge 三入口 + 两仓 gitlink 更新）提交并普通推送，提交后回读见本节末）。

## 8. 验收标准逐项对照（AC01—AC07）

| 编号 | 行为标准 | 自验证据与结论 |
|---|---|---|
| AC01 | 后台新建应用、配置属性及范围，进入应用创建目录/表单，在该表单内完成表单及流程设计并保存发布 | **通过（可见浏览器）**：新建「报销中心」（名称/颜色/排序/可见范围=指定用户+预选创建者）→ 进入应用 → 建目录「差旅」→ 建表单「差旅报销单」→ 表单设计（单行文本+数字两字段、保存、发布成功）→ 流程设计（表单内新建关联流程「差旅报销审批」、保存、发布成功「图、节点配置、表单与函数版本已冻结」）。同一应用/目录/表单/流程标识全程一致（URL 与面包屑「报销中心 / 差旅 / 差旅报销单」）。截图 `ac01-ac06-app-manage-list.png` |
| AC02 | 用户端应用中心按权限显示应用；进入后显示目录、目录内及应用内直接归属表单；后台调整刷新后生效 | **通过（可见浏览器）**：用户端应用中心显示应用卡片（图标/颜色/表单数）；进入显示目录「差旅」及表单、空目录与空内容提示；后台把「空集合应用」由指定用户改为「全部用户」→ 用户端刷新生效；停用应用→用户端不可见、恢复→重新展示。截图 `ac02-app-center.png` |
| AC03 | 点击表单得到真实数据列表，分页/详情归属正确；填写并发起、审批待办、审批结果及列表记录对应 | **通过（可见浏览器）**：应用中心点表单进入数据列表（空态「暂无数据」）；「新增/填写」填写并提交发起流程（提交成功，流程已发起）→ 返回列表出现 1 条真实记录（值=提交值、创建时间真实）；「查看」详情只读回显；分页与筛选栏按 definition 派生；刷新/分页只取当前 formKey。截图 `ac03-form-data-list.png` |
| AC04 | 指定用户、全租户、空指定集合语义正确；应用/表单/设计/数据/审批权限分开，越权与跨租户被服务端拒绝 | **通过（分层证据）**：浏览器侧——指定用户命中可见（admin 在集合内）、跨租户零串读（租户 100 管理员应用中心为空，截图 `ac04-cross-tenant-empty.png`）、未授权角色访问应用管理 403（截图 `ac04-unauthorized-admin-403.png`，前端守卫+服务端 `@PreAuthorize` 双保险）；服务端测试——`FormAppServiceTest` 覆盖 ALL/SPECIFIED/空集合=无人可见/跨租户查询隔离/停用阻止创建；`FormAppControllerAuthorizationTest` 覆盖管理端无权限 403 与用户端登录可达；「无数据查询权限受限态」由 `AppFormData.spec.ts`（不请求数据+受限态+保留填写入口）与既有 form:data 授权测试覆盖 |
| AC05 | 存量分类和表单映射确定、记录/版本/历史/运行实例兼容；多流程共用表单不错误改绑 | **通过（测试承载）**：`ApplicationCenterLegacyUpgradeTest` 逐对象断言——分类→应用映射（名称/排序/追溯 id/可见范围 ALL）、唯一分类归属、零分类归未分类、**多归属歧义不转换（app_id 保持 NULL）**、跨租户事项不参与判定、已删除表单不承接、重复执行零执行+validate 通过；运行库未变更（承接仅改归属列，不动表单/流程/实例/记录）。本地旧链库只读清点已登记（§5.1）。真实存量分布待获授权环境用同一判定规则清点 |
| AC06 | 引用对象拒删，合法空对象可删；移动失败保持归属；停用/范围收窄不破坏既有待办与历史授权，恢复后可用 | **通过**：浏览器侧——删除非空目录→「目录下仍有表单，须先处理归属再删除」；删除非空应用→「应用下仍有目录或表单，须先处理归属再删除」；停用→阻止新建目录且用户端不可见（既有待办/记录不受影响，未动任何业务数据）、恢复→重新展示；服务端测试——空应用/空目录可删、归属调整失败保持原归属、停用应用拒绝新归属 |
| AC07 | 数据结构变化在支持方言可升级、已有对象不重复转换，失败可恢复到已声明边界 | **通过**：H2 全链 17/0（12 条迁移、重复 migrate 幂等、校验和篡改显式失败）与 PostgreSQL 全链 12/0（zonky 真实 PG）；承接语句为确定性 UPDATE/INSERT，重复执行适用性已验证（迁移登记后零执行）；回退=新代码回滚后旧代码不读写新表/列，存量数据原表原义不变（迁移头部声明，无破坏性 DDL） |

## 9. 自验结论

- 自验通过，待规划独立验收；本轮未核销 P 编号、未增加功能数、未写功能 PASSED/COMPLETED。
- 总4阶段：现状探索完成、方向定稿完成、**实施与验收完成（待规划验收）**、终态同步未开始 → **2/1/1**。
- 计数与基线保持：正式功能 48、清单 46/22/22=90、ADV64、问题57；P62 性能延期/OFF 保持。
- 证据位置（本机，不入 Git）：服务日志 `/tmp/app-center-server.log`、Web 日志 `/tmp/app-center-web.log`、全量测试 `/tmp/app-center-server-fulltest.log`、验收截图 `/tmp/app-center-evidence/`；Git 证据见 §7。
- 浏览器验收会话：用户可见可交互（headless=false），视口 1280×720，身份 admin（系统管理员）/ t100admin（租户 100 管理员），URL/对象见 §8。

## 10. 唯一下一动作

Planner 按方向 §5 与 `planning-readiness-review-01.md` 独立验收本回执（重点：AC05 存量承接判定与冲突保留口径、AC04 超管不短路语义）。
