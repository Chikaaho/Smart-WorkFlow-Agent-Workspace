# execution-100-01（第二批）：阶段 3 隔离环境证据

接第一批（阶段 2 实施 + 门禁）。本批在隔离环境（本机分支 + 克隆库）取得 F1—F4 的浏览器/API 证据与升级迁移证据。隔离环境：本地 Docker PG 新库 `smart_workflow_100`、Server `bootstrap.jar`（feature/1.0.0，本地端口 **18093**，未触碰用户 8080/5173）、Web dev（本地端口 **5275**，`VITE_PROXY_TARGET=http://localhost:18093`）；dev profile 固定验证码仅隔离环境使用。测试账号：克隆库内置改密文（admin=超管、yangfan=staff 对照、sw100_imp_* 为 UI 导入产物）；初始/测试口令不入 Git 与回执。

## A 升级迁移（F1-4 列 + §2）

- UAT 全库 pg_dump → 本地恢复 `smart_workflow_100`：`flyway_schema_history` **33 行 / max 0.4.0**（与 UAT 一致）。
- feature/1.0.0 启动自动迁移：**"Successfully applied 1 migration … now at version v1.0.0"，34 行 / max 1.0.0**（重启后复核）。真实存量库升级路径实证，未改写历史。
- 多库：H2/PG 全链 31 条（第一批测试）；MySQL 5.7 容器实测失败——容器内 `SELECT 1` 正常但宿主 13306 端口映射握手超时（Windows Docker proxy 环境问题，三次尝试含初始化等待），按 P66 口径如实记录为环境原因；Oracle 21c XE / SQL Server / openGauss / DM8 / KingbaseES 无本地镜像或需 Owner 实库，本批未跑（脚本与断言已就位，`-Dmysql.url` 等）；SQL Server 终态基线 + 真实增量脚本经静态门禁（31 脚本、无 PG 专属语法）。

## B F1 人员导入导出

- 模板：UI「导入人员→下载模板」下载 `f1_user_import_template.xlsx`；自定义签名属性 = `sys-user-import@v1|…`（openpyxl 读证）；表头 8 列、无密码列。
- 整批原子：错误批（含 `no-such-dept` 行）导入 → 结果弹窗「导入失败：1 行有错，整批未入库（0 行落库）」+ 行级原因（行 3 部门编码未命中）；查库 `sw100_imp_b1/b2` **0 行**。
- 成功批 3 行（部门 demo-a-hq/demo-a-br1、岗位 demo_user/demo_admin、角色 demo_user/demo_admin）：弹窗「导入成功：共 3 个账号」；查库 3 行 `must_change_password=1`、dept/role/post 关联正确。
- 只新增：同一成功批重复导入 →「账号已存在 ×3、整批未入库（0 行落库）」。
- F1-6 超管跨租户：未选目标租户直接导入 → toast「请求参数有误」（`createTarget` 拒绝）；选「演示集团A」后成功——明确指定目标租户语义实证。
- 导出：UI 下载 `f1_users_export.xlsx`（列=模板 + 部门名称等可读列，无密码）。
- F1-4 强制改密（服务端闭环）：`sw100_imp_a1` 登录 → 前端守卫收敛 **/change-password**（截图）→ 同会话带 token 调 `/system/user/page` → **403 + `system.must_change_password`**（服务端拦截，非仅前端）→ UI 改密（≥8 位、≠初始）→ 进 /workspace 正常 → 查库该账号 `must_change_password=0`。既有账号（admin）与流程不受影响。
- F1-5 权限点：yangfan（staff，无 import/export）用户管理页 **导入/导出按钮 0/0 隐藏**（v-perm），带 token 调 `/system/user/import-template` → **403 `common.forbidden`**。

## C F2 打印模板与 PDF

- 三处入口：我发起的详情弹窗（截图：**打印 + 下载 PDF 双按钮 + 完整表单渲染**）；任务详情页头（PrintActions，截图 f2_task_detail.png 为待办空列表态——克隆库当前无待办任务，任务详情按钮证据见实现与单测，列为缺口）；流程监控详情（PrintActions 同组件）。
- 服务端 PDF：UI「下载 PDF」真实产物 `f2_my_instance_detail.pdf`（66,932 B，PDFBox 渲染、OFL 字体子集嵌入）；生成链路走权限过滤门面（第一批冒烟 2/2 绿）。
- 历史版本与页脚说明：`versionPinned`（快照时间命中）/ 回退页脚已实现并单测覆盖；本批 UI 未截到多版本实例 PDF 页脚可视图（缺口如实列出）。
- 字段隐藏对照：未在克隆库预置 VIEW 受限字段账号（缺口如实列出；权限过滤链单测覆盖）。

## D F3 日志查询

- 页面三页签（截图：登录/操作/异常），真实数据：LOGIN 47（SUCCESS 45 / FAIL 2，含验证码失败原因 + IP 127.0.0.1 + UA）、OPERATION 43（SUCCESS 35 / FAIL 8，含 `业务码 400` 失败原因）、EXCEPTION 1（真实 5xx 记录）；CHANGE_PASSWORD/LOGOUT 动作齐全；租户列 0/9001 分明。
- 筛选：结果=失败 → 2 行（截图 f3_log_filtered_fail.png，行内含失败原因与 IP）。
- 无密码检查：`log_type='OPERATION' AND target NOT LIKE '%password%' AND (pass/token 命中)` = **0 行**；含 password 的行仅为 /auth/password 路径记录（不含任何口令值）。
- 租户隔离：admin（超管）可见 0 与 9001 两租户行（截图租户列）；yangfan 为租户 0 用户、其视角按 TenantLineHandler 常规隔离（实现口径 + 审计表在 ignore 名单外，未单独截图，缺口如实列出）。
- 保留 90 天：`sw.audit-log.retention-days:90` + 每日 03:30 清理任务已实现；有界验证（调小保留天数观察删除）因任务无手动触发入口未在本批执行（缺口如实列出）。

## E F4 IoT 发起人

- 流程监控列表（截图 f4_flow_monitor_list.png）：两行 IoT 实例（业务号 `iot-2118777882178838530` / `iot-2118780073471991810`）发起人列 = **系统（IoT）**；详情 DTO 同口径（`InitiatorDisplay`，服务端三处统一）。监控列表/详情截图完成；「我发起的」（语义上不含他人/IoT 实例，发起人恒为本人）与待办列表的 IoT 行在克隆库数据中不存在，三处一致性以服务端统一出口 + 列表证据为据（缺口如实列出）。
- README 回读：三份 README 图注「流程结构总览」、版本 1.0.0、根 README 新能力段（develop-sw `9a39303a`）+ Server README `14057da5`。

## F 发现并修复的实现缺陷（测试期间）

1. `MustChangePasswordFilter` 白名单缺 `/system/auth/me|menus` 双映射 → 首登会话装配 403（已修 + clean 重打包 + 复测通过）。
2. UserList 导入/导出误用 `filter.tenantId`（恒空）而非 `filterTenant.value?.id` → 超管导入必 400（已修，typecheck 绿，复测通过）。
3. 上述修复随 feature/1.0.0 提交推送（见 H）。

## G 缺口清单（如实，待后续批次或 Planner 裁决）

1. 任务详情打印按钮的实存截图（依赖克隆库存在待办任务）。
2. 历史版本实例 PDF 页脚说明的 UI 视图。
3. 字段隐藏账号的打印/PDF 对照。
4. yangfan 视角日志租户隔离截图。
5. 清理任务有界验证。
6. MySQL 实库迁移（环境原因）；Oracle/SQL Server/openGauss/DM/Kingbase 实库。

## H 提交

- Server `feature/1.0.0`：`2baf48ad`（惰性修复）→ `14057da5`（README）→ `f1bf5d8b`（功能清单）+ 本批修复（白名单 + 前端 tenantId 修正在 Web 仓）。
- Web `feature/1.0.0`：本批修复 tenantId 引用（typecheck 0 错）。
- 证据文件 37 份在 `product/v1.0.0-release/receipts/evidence/`（gitignore，本地留存；清单如上 A—E）。
- 隔离环境保持运行：Server 18093 / Web 5275 / PG 库 smart_workflow_100（34 行 V1.0.0），供 Planner 复核。
