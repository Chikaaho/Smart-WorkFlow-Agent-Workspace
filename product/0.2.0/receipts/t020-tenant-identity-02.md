# T020 稳定管理员关联、创建幂等与真实登录

2026-10-22｜Executor｜XL｜IN_PROGRESS

总七阶段：需求评估已完成；分支实施进行中；验收同步、合并、发布、发布后同步、结束未开始。本文记录 DR02 及其直接关联缺陷的实施与自验，整版和 T020 均未提交完成验收。

## 实施

服务端 `SysTenant.adminUserId` 持久保存首任管理员的稳定用户 ID，列表按该 ID 读取同租户有效用户的当前账号。`V0.1.9__tenant_admin_identity.sql`（H2/PG）只回填唯一、同租户、启用用户与有效管理员角色的明确关系；零个、多个或跨租户关系保持未配置。改账号、增加第二名管理员不会改变关联。

创建请求携带稳定 requestId，数据库唯一键与事务保存点处理并发重复；同一请求返回同一租户。租户、根部门、首任管理员、管理员角色及模板菜单副本、用户角色与稳定关联在同一事务内完成，末端失败整体回滚。复制规则，不复制人员、业务记录或秘密；根部门负责人关联新管理员。

管理员维护入口只提供同租户有效管理员候选、选择已有管理员、为未配置的存量租户创建首任管理员。持久行锁保护首次创建；已有稳定关联时禁止再创建首任管理员。租户 0 在页面只读，服务端拒绝改名、停用和管理员维护；普通租户及跨租户选择均被拒绝。

新增真实租户管理菜单，仅绑定租户 0 的 superadmin，不进入普通管理员模板；Web 删除临时静态路由，复用菜单白名单解析。真实浏览器发现菜单叶路径必须是布局根下完整路径，已将迁移路径修正为 `system/tenant`，顺序为 60。没有新增第二个入口。

Web 新增窗口每次生成 requestId，失败重试沿用，重新打开更换；提交中阻止重复提交及关闭。维护窗口清除密码及陈旧候选响应，管理员账号与姓名相同时只显示一次，列表时间按秒显示。真实链另发现登录页已收集 tenantCode，但认证适配器未发出该字段；已补可选编码序列化，空编码保持旧请求形态，密码仍走原 RSA 链。

## 数据库与回归

使用正式 Flyway 全链、真实 Mapper/租户拦截器、事务代理和实际 H2/隔离 PostgreSQL，10 个用例覆盖稳定关联、并发幂等、末端失败零半成品与同键重试、存量初始化、错误归属与普通身份/租户 0 拒绝、唯一/歧义回填、真实菜单路径和仅超管授权。最终 `tenant-menu-canonical`：10/0/0/0，62.13 秒，Maven exit 0。

`TenantAdminServiceTest` 8 个用例通过。受影响迁移测试将主链终点及追加数量更新到 0.1.9 / 17 条。历史升级继续保留 0.1.7 种子及校验和，并核对两条租户增量；追加演练核对种子、两条增量与时间戳各一条。`P62NonEmptyUpgradePgTest` 三个用例通过，`P64AppendMigrationUpgradePostgresTest` 修正后 1/0/0/0，Maven exit 0。

全工程命令 `mvn -q test` 第二次执行到 900 秒上限，exit 124；已完成用例出现 MQTT 调度竞争及新增迁移的历史条数断言失败，均保留原文后修正。按未完成类继续执行 26 类，60 个用例中追加迁移断言 1 failure；该断言随后目标复跑通过。未把超时命令或失败命令写成 BUILD SUCCESS。MQTT 修复及独立提交见 `regression-mqtt-dispatch-07.md`。

汇总本轮实际生成的 370 份 Surefire XML：2123 tests，0 failure / 0 error。初次汇总有 32 skipped；其中受影响的 Phase4 迁移 3 个用例通过自建隔离 PG 补齐（10.35 秒，exit 0，PG 正常关闭），剩余 29 个跳过包含既有环境/专项演练，不能当成通过。应用中心备份恢复演练缺 pg_dump/pg_restore，仍跳过，未补造恢复结果。

完整原文均在 `C:/Users/hjxch/.codex/evidence-020/tenant-identity/`：`focused-02.log`、`database.log`、`tenant-menu-and-regression.log`、`full-test-02.log` / `full-test-02-reports/`、`bootstrap-remaining.log`、`p64-current-chain.log`、`tenant-menu-canonical.log`、`phase4-isolated.log` 及各 `-result.txt`；`backend-current-reports.json` 为第一次汇总快照，`backend-final-reports.json` 为补齐 Phase4 后的 370 份 XML / 2123 tests / 0 failure / 0 error / 29 skipped 汇总。Phase4 自有 PG 生命周期位于 `phase4-isolated-migration/`。所有 Maven 使用 MAVEN_OPTS=-Xmx2g，前后端重任务串行。

Web 最终四连：typecheck 0；lint 0（2 条既有 warning，格式修正后的独立 lint 亦 0）；189 文件通过、1 跳过，1693 passed / 3 skipped，122.69 秒；build 0，3.28 秒。原文 `web/typecheck.log`、`lint.log`、`test.log`、`build.log`、`checks-result.txt` 与 `checks-result-lint.txt`，NODE_OPTIONS=--max-old-space-size=2048。

## 真实可见链

证据层级 FORMAL_BROWSER，headless=false。使用可见 IAB、生产 Web dist、正常开发认证及真实 Java 服务、隔离 H2 与任务自有 Redis。固定测试验证码来自明确 dev fixture，调试登录未开启；不是生产部署证明。网络索引只记录路径、状态和请求标识，不记录密码、令牌或请求正文。

`real-browser-03/`（URL `http://127.0.0.1:64406`）：系统超管正常登录后创建“T020真实链验证”，账号与根租户同名 admin；新租户 code=`t46aa027305`，ID=`2113272591996239874`。管理员维护显示该租户账号，保存关联成功。为既有租户 1 创建 legacy020_admin 后列表回显。正常退出并以新租户编码登录同名 admin 成功；用户页仅有本租户一个管理员，部门页仅有该租户根部门及负责人。直接导航租户管理被前端权限守卫导向 /403；此项不冒称 HTTP 403，服务端拒绝另由真实 H2/PG 用例证明。

可读图像：`administrator-maintenance-native-1920.png`、`tenant-created-and-legacy-admin-native-1920.png`、`first-admin-own-users-native-1920.png`、`first-admin-own-dept-native-1920.png`、`tenant-admin-denied-native-1920.png`；URL/对象/请求见同目录 `http-index.jsonl` 与状态原文。创建、维护、登录和根部门查询的请求标识均在该索引中。

`real-browser-04/` 揭示真实菜单路径 /tenant 与完整路径约定不符，随后已修正迁移。早期仅 CDP 仿真尺寸的截图出现图面重复，保留作无效诊断；后改用浏览器原生 viewport 能力，`tenant-create-browser-1366.png` 完整显示窗口与操作按钮。旧诊断图不用于像素验收。最终 `real-browser-05/`（URL `http://127.0.0.1:50345`）正常登录、进入后台、点击真实菜单，落到 `/system/tenant`；后台默认用户页仍可达。再次创建“T020菜单链验证”，code=`t61f3e7cc23`，ID=`2113285377233043457`；维护回显 admin、禁止重复首任创建，保存后明确提示更新成功。租户 0 只提供查看与关闭。正常退出后，新租户 admin 带编码登录成功，用户页共 1 条，部门页共 1 条且根负责人为 admin；普通管理员菜单不含租户管理，直接导航该动态路径落到 /404（无授权路由），不冒称 HTTP 拒绝。

05 图像均由浏览器原生 viewport 在 1920×1080 / 1366×768 获取，已读取原始尺寸并肉眼确认：`tenant-menu-native-1920.png`、`tenant-create-native-1920.png`、`administrator-maintenance-native-1920.png`、`administrator-maintenance-native-1366.png`、`root-tenant-readonly-native-1366.png`、`first-admin-own-users-native-1920.png`、`first-admin-own-dept-native-1920.png`、`first-admin-global-menu-unavailable-native-1920.png`。请求索引 `http-index.jsonl`：创建 `web-0f93f34f-f32d-46da-a34f-84bf1a599c2e`，维护 `web-8da5a11e-a97d-4952-9ed7-3dcb4584963d`，新管理员登录 `web-ace8de8a-59d3-4a92-a3a3-2ae023759754`。HTTP 状态与实际页面成功共同判断，不只凭 HTTP 200。

任务自有运行栈均有输入、PID、900 秒上限、请求完成控制及退出结果；03、04、05 已通过自有控制端点关闭 Java/Redis，未操作用户 Redis 服务。证据不包含初始密码。图像和原始日志仅本机保存，不入 Git。

## 验收边界与后续实施

A06 的原子创建、并发重复/失败及管理员实际登录已有自验证据；A07 只覆盖稳定关联、保留对象与上述拒绝，用户/部门明确创建目标、归属筛选及关联校验仍在实施；A08 会话与后台认领准入尚未完成。A03 整体仍未通过，本轮没有整页同态像素通过结论。后续继续 DR03，再进入 F020/J020/W020 及全局 U020；不核销 P、不改功能数或正式验证基线。

## 提交与回读

Server `9704047e70753a309e507fd77602895d051ccf40`（19 文件，691 insertions / 130 deletions）；Web `27b1916c1417b30c51251eba62814fc3379205aa`（14 文件，577 insertions / 26 deletions），均普通推送本版任务分支并回读 origin 同点、工作树干净。Web 提交 Hook 的 eslint/prettier 已执行，提交后核对范围与相关内容。根仓只同步本回执、MQTT 回执、当前状态、会话交接与两子仓 gitlink；原工作区 develop-sw 的 0.1.10 在途修改保持原状。
