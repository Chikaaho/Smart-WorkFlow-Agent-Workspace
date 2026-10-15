# 0.1.5发布与UAT验收：PASSED

2026-10-15｜Planner。读取release-015-01、uat-015-01、uat015-evidence-summary全文；检查登录页和待办审批截图；读取开发库validate/migrate原文、种子验证报告及本次测试日志汇总/失败段；直接比对双方言新旧终态文件。未读取工程代码，未重跑测试或计算哈希。

## 裁决与锁定结果

**本轮修复及发布目标PASSED，整体待终态同步复核后COMPLETED。** BF001—053沿Owner关闭结论；R015-01、R015-02通过。阶段Ⅳ通过，阶段Ⅴ实际部署和业务验证通过、当前信息收尾进行中；总5阶段为4/1/0。

- 单一种子：PG新旧各142271字节、H2新旧各155220字节，直接内容比较均相等；原件为有效非空终态采集。种子验证5/0/0/0；P62NonEmptyUpgradePgTest 2/0、P64AppendMigrationUpgradePostgresTest 1/0、P64RollbackBoundaryPostgresTest 1/0在本次日志中通过。
- 开发库历史衔接日志明确validate成功→migrationsExecuted=0→再次validate成功。UAT证据记录旧0.1.0/0.1.1历史核对、受控增量及历史衔接、启动validate、7个新增R__与零versioned重放；以该受控方案和验证接受衔接结果，不能表述为“完全未修改迁移历史”。业务库未删库，原始备份及恢复入口已记录。
- Git发布结果接受执行回执：Server 8c25932、Web最新补充b069620分别进入修复分支/develop/main并推送；Web 02807fc是补充前时点。未创建tag/Release，UAT通过手册直接部署。Git结果只代表回执核实时点，不冒称实时HEAD。
- R015-01：截图备案号准确；点击导航、目标URL和多视口结果有记录。1280×720需要少量滚动，原要求为可见可点击且不遮挡登录，并未要求所有视口首屏展示，因此通过，不追加尺寸门槛。
- R015-02：根路径提供系统、子路由直达刷新、静态资源/API返回、旧/sw重定向及原站点入口替换有实测结果；原站点服务保留且配置可恢复，满足替换入口授权。
- UAT业务：可见会话、同一流程bpm_45e3bc65a9784d37、业务号926fe603-99f5-4053-b67b-5221566e7a57、实例46e5ba9b-c877-11f1-bca0-00163e0d142f串联发起/待办/审批/APPROVED回读；续期记录及菜单/设计入口支持发布冒烟结论。验收测试对象保留为已知残留，不自动删除。

## 日志口径纠正及适用边界

原回执290/3/0/27是bootstrap模块汇总，不是整个reactor总数。规划从本次full-suite-after-drift-fix.log提取351个唯一测试类结果，合计**2051/3/0/27**，最终**BUILD FAILURE**。三个失败分别为P63ImmediateMqttBrokerPgTest、P63ReservationUnknownPgTest、Phase4PgStartWindowCrashTest，与P64阶段Ⅲ回执02/03及planning-review-phase-3-05-passed已登记失败/允许替代一致；保持历史限制，不声称全仓全绿，不要求因报告统计修正重复业务测试。

Web补充b069620按UAT回执：typecheck退出0、lint 0错误3警告、vitest 1534通过、build通过；本次回执未明确该次跳过数，不从旧批次补写。性能、三方SSO回归不在本次证明范围。

原回执包含额外哈希计算，本次验收采用直接内容和行为证据，不重复计算，后续同步不得继续套用整包哈希检查。

## 终态同步

memory当前段同时出现“全部完成”“备案/根路径待执行”，旧handoff还写“未合并发布”，与实际结果矛盾。Planner直接修正许可摘要、主方向归档和台账补充状态；knowledge等入口由执行方同步。无需为纯转录错误再补一轮业务证据。

唯一下一动作：执行../ready/direction-terminal-sync-015.md。主方向及发布方向归档passed；开发声明保留规范入口。终态同步前不宣称整体COMPLETED或新增业务功能数。
