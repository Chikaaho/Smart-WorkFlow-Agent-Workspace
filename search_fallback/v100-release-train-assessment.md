# 1.0.0 评估回执（P27/P33/P40 + 小尾巴）

只读探索，未改代码/配置/迁移，未跑构建测试。范围：两仓 HEAD（Server `e2beb027` 0.4.1-SNAPSHOT、Web `65594c0` 0.3.8）、knowledge、UAT 只读日志。file:line 见 `v100-release-train-assessment-appendix.md`。

## Q1 P27

- P32 模式可复用：POI 5.4.0 xlsx、双行表头+模板签名、行级错误、整批原子、500 行/5MB；实现在 form 模块，system-biz 无 POI 依赖。
- 最小字段 `username+password`（超管加 tenantId）。部门/角色/岗位均为 id；角色岗位编码租户内唯一，部门名称/编码都不唯一，建议按 code 匹配并对 0/多命中报错。用户无直属负责人字段。
- 密码无规则、无强制首次改密、无重置，空串可建；BCrypt(10)。导出须排除 password，手机/邮箱无脱敏工具。
- 用户名重复 400；手机号无唯一约束（SSO/通知会多命中）；部门不存在 400；无批量接口/上限；单条有事务、整批无。
- 权限 `system:user:*`；建议新增 import/export，9 方言菜单种子+admin 授权（P24）。风险：负责人无落点、手机号唯一性、密码策略、长度不一致、status 语义相反。

## Q2 P33

- 无打印/PDF 入口、无 `@media print`、无 PDF 依赖（PDFBox 仅解析）；前端有 Noto woff2，服务端 0 字体。
- 数据分 3 类接口：definition、record（含明细）、审批历史（`opinionFields`/`assigneeDept`）；监控实例详情缺意见/部门；实例未存 formVersion，历史打印可能用错版本。
- 模板：表单 definition 已版本化，但前端解析/构造白名单会丢新根键；独立表/快照加列需 9 方言迁移。
- 路线 A 浏览器打印（复用渲染，无新依赖）；B 服务端 PDF（需引擎+中文 TTF+权限复用，避开无权限过滤的 `FormRecordReadFacade`）。推荐 A 先行。

## Q3 P40

- 无通用操作/登录/异常日志表；只有域内审计（SSO、审批、IoT、SQL、通知、任务），口径不一。登录/登出/管理操作无埋点；登录失败 10 个 return 点、无 HttpServletRequest，取不到 IP/UA。
- 可复用 `DomainEventPublisher`、`EventRef`、`AccessLoggingFilter`、`DiagnosticText`、`TenantLineSuspension` 与前端列表/筛选组件。
- 新表 9 方言 V1.0.0，SQL Server 真实增量；测试硬断言 30 条/V0.4.0 同批改；菜单挂系统管理 id=1（候选 9115），role_menu 动态授权。
- 保留仅 `sw.job.log-retention-days=30` 且未实现；高量表多缺时间索引。第一版建议登录+管理操作+异常，不双写全量。

## Q4 小尾巴

- IoT 发起人：存储就是 `0L`；监控列表/详情 `initiatorName ?? initiatorId` 回落 0，「我发起的」显示 —。已有 `SYSTEM_INITIATOR_NAME="系统"` 仅主题用。建议服务端特判 0（IoT 按 `iot-` 前缀显示「系统（IoT）」），前端不再回落数字。
- P69：11-09 362,776,772 B，DEBUG 1,849,394 行；`DataSourceUtils` 1,703,570 行约占 96%；11-08 正常日 3,228,958 DEBUG。当前 11-10 仅 INFO 1,177/WARN 96/ERROR 3，0.4.0 改 INFO 已生效；hourly 只切分不减量，`maxsize` 每日只判定一次，P69 无需改 logrotate。
- README 图注三处：根 `README.md:50-51`、Server `README.md:34-35`、Web `README.md:40-41`（表头+alt），改写放到下次 README 修改。
- 本机清理：已删 `evidence/uat-profile-041/`、`captcha.txt`；`smart_workflow_041` 已 DROP（0 连接），`smart_workflow_030`/`f1v4b` 未动。

## Q5 1.0.0

- 必改四处：`pom.xml:48`、`build-release.yml:72`、`check-version-identity.sh:158`、Web `package.json:4`；同步根 `version.json`/`CHANGELOG.md`/`README.md` 与两仓 README。0.4.1 失败即漏改工作流断言。
- `1.0.0` 排序无坑；`V1.0.0` 与 `R__` 不冲突；测试夹具 V101—V107 不与主链同历史。
- 新增迁移同批改测试断言（30→31、0.4.0→1.0.0），SQL Server 真实增量+校验和清单；R__ 新增时 20→21。
- 工作流只产 `build-<sha>` 且 `--latest=false`，语义 tag/Release/Latest 人工。

## 需要 Owner/Planner 决定

1. 打印路线 A（推荐）/B；模板归属（推荐表单 definition）。
2. 导入密码：模板是否带密码；是否新增强制首次改密（9 方言迁移，至少 L）。
3. 导入事务：整批回滚（推荐，同 P32）/部分成功；仅新增/upsert（推荐仅新增）。
4. 日志范围与保留：第一版登录+管理+异常；保留天数（建议 90）与清理载体。
5. IoT 文案（推荐「系统（IoT）」）与三处显示统一。
6. 示例 b 图注（推荐「校园门岗异常（流程结构总览）」）。
7. 功能计数：P27/P33/P40 是否登记 3 个新功能（52→55）。
