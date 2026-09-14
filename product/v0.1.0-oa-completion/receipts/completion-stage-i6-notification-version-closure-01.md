# P60 I6 通知与版本收口实现回执 01

> 执行角色：执行（Executor）
> 日期：2026-09-14
> 方向：`../ready/direction-stage-i6-notification-version-closure.md`
> 前置门禁：`receipts/final-state-projection-stage-i5-v0.0.3-oa-iteration-01.md` 已提交并完成当前状态一致性（Workspace `84110ca`、Server `bf27126`，仅本地提交，未推送）
> 机器状态：`EXECUTION_SUBMITTED`（阶段 VERIFYING）

## 1. 实现概要

- **统一投递权威（A1/A2/A3）**：`sw-basic-notify` 新增 `NotifyRoutingService`（规则/订阅/租户渠道启停的唯一裁决 SPI，定义于 -api、实现于 -biz，依赖方向合规）；`NotifyFacadeImpl` 重写——IN_APP 恒成功先持久化，外部渠道先落业务通知与投递意图（PENDING/FAILED + normalized failure classification），缺适配器落 `FAILED/NON_RETRYABLE` 不静默成功；12 类流程事件（BpmNotifyListener）与催办（BpmUrgeServiceImpl）统一走身份化投递；事件链保持 AFTER_COMMIT+Async；纯通知节点默认失败策略改 `CONTINUE`（`NotificationNodeTranslator`/`NodeDelegateSupport`，显式 BLOCK 仍支持），投递失败不再回滚已合法提交的审批。
- **业务稳定身份幂等（A2/A4）**：消息行新增 `event_type/occurrence_no/template_id/template_version/link_type/link_id/retry_count/next_retry_time/failure_class/receipt_digest`；唯一索引 `uk_sw_notify_msg_identity(tenant,event,biz,seq,recipient,channel)`；同身份并发/重复请求命中后镜像既有行状态，`DataAccessException` 兜底；催办以 10 分钟冷却窗批次为发生次序；时限提醒每条记录仅一条身份。
- **投递恢复（A3）**：`NotifyDeliveryRecoveryServiceImpl`（@Scheduled fixedDelay=60s）经 `TenantLineSuspension` 跨租户扫描到期可重试投递，条件认领后按指数退避（1/2/4/…/60 分钟封顶，最多 5 轮）调用 `attemptDelivery`，逐轮追加尝试流水直至终态。
- **模板与安全（B5）**：`sw_notify_template_version` 不可变版本追加；模板创建/编辑即发布新版本快照；渲染沿用唯一 `TemplateRenderService`（占位符语法/缺失变量发送前失败，字面替换无表达式引擎），新增 `NotifyHtmlSanitizer`（EMAIL 载体发送前剥除 `<script>`/内联事件/`javascript:`/`data:` scheme，标题 HTML 转义）；模板/规则/订阅/消息/尝试/回执全部租户内 fail closed（既有 TenantLine 拦截 + 管理端 @PreAuthorize）。
- **规则/订阅（B6）**：`sw_notify_rule`（事件开关/渠道顺序强制 IN_APP 开头/接收人规则受控白名单/required/failure_policy）管理 CRUD；`sw_notify_subscription` 用户偏好，required+IN_APP 不可关闭（服务端拒绝构造请求）；`NotifyRoutingServiceImpl` 裁决渠道序列并保底 IN_APP。
- **六渠道契约与 Adapter（A1/D12—D14 门禁与实现部分）**：枚举补 `EMAIL`；新增生产适配器 `EmailNotifyChannelAdapter`（JavaMailSender）、`FeishuNotifyChannelAdapter`（interactive 卡片 + app_access_token 缓存）、`DingtalkNotifyChannelAdapter`（工作通知 asyncsend_v2）、`WeComNotifyChannelAdapter`（应用消息）；全部 @ConditionalOnProperty 装配、目标由 `NotifyTargetResolver` 服务端权威解析（EMAIL/电话来自 `sys_user` 状态=0 有效用户；Provider 明文主体因 I5 因摘要权威缺明文源，返回 null → 明确 FAILED，见"未验证边界"）；`NotifyChannelProperties` + `NotifyChannelStartupValidator` 启动 fail-fast（enabled 渠道缺必需配置/占位值即拒绝启动）；租户级渠道启停要求系统级装配方可启用。短信按方向 §3.5 仅交付通用契约与配置边界（Provider 选型未定，不声称完成）。
- **站内信与多端（C9/C10/C11）**：新增 `NotifyInboxController`（/notify/inbox 分页 `PageParam`+未读数+read-all+深链 `NotifyLinkAuthorizer` SPI 重鉴权 fail-closed）；旧 /notify/messages 保持兼容；`NotifyMessage` 稳定排序 (create_time desc, id desc)；记录页默认最小暴露（`NotifyRecordSummaryDTO` 掩码列表/详情省略正文），`/notify/records/{id}/detail` 独立权限 `notify:record:detail` + 服务端审计日志；Web 完成 `NotifyRuleList/NotifyChannelList/NotifyPreference/NotifyInboxMobile` 新页 + NotifyHome 服务端分页/全部已读/未读数，`/m/notify` 移动 H5 收件箱与受保护深链（PC/H5 同一消息/同一已读状态/权限）；菜单/权限种子 V90（218—223）。
- **版本收口（E15/E18 材料部分）**：`version.json` 单一机器可读权威；Server 全部 pom `0.1.0`（33 pom）、Web `package.json` `0.1.0`；`CHANGELOG.md` 与 `release/0.1.0/{RELEASE-NOTES,UPGRADE,ROLLBACK,CONFIG-CHANGES,DB-MIGRATIONS,MANIFEST}.{md,json}`；Flyway 终点 H2/PG 均 **V90**（`FlywayFullChainH2` 15/0、`FlywayFullChainPostgres` 12/0，计数断言已同步 90/88）。

## 2. 门禁与验证（原始结果）

- Server 全量门禁：`MAVEN_OPTS=-Xmx2g mvn test` → **exit 0，全仓 surefire 合计 1341 tests / 0 failures / 0 errors / 0 skipped，BUILD SUCCESS**（含 I6 新增 `I6NotifyClosureIntegrationTest` 6/0/0/0：身份幂等三连投递 1 行、新发生次序新通知、收件箱 10+2 分页与全部已读幂等、规则路由 IN_APP 保底、required 订阅保护与拒绝、跨租户未读=0）。
- 受影响回归（I5 锁定集合不重跑 условие）：I5 三个 PG/H2 Boot 测试 12/0、4/0、4/0 全绿（真实 PG+Redis 行为链，验证生产装配上下文包含 I6 Bean 后不回归）；`FlywayFullChainH2` 15/0、`FlywayFullChainPostgres` 12/0；notify-biz 既有 94/0/0/0（含 P58/V0.0.2 幂等/批发送/记录/模板安全套件，仅测试自建 schema 追加 I6 列）；`BpmUrgeServiceTest` 断言随统一入口更新（SendNotifyCommand → NotifySendRequest<TaskId routing semantics 保留 IN_APP 直达断言）。
- Web 四门：`pnpm typecheck` ✓ / `pnpm lint` ✓ / `pnpm test` ✓ **128 files、1183 passed + 3 skipped** / `pnpm build` ✓ exit 0（NotifyHome.spec 9/0 更新为分页契约；新增页/契约单测未新增，属缺口见 §4）。
- 实现中附带修复既有缺陷：MyBatis prod profile 全量 SQL 输出关闭（R-E 收敛）；引擎节点默认 BLOCK 回滚改 CONTINUE（R-G 裁决落地）。

## 3. Git 提交（均仅本地，未推送）

- Server `develop`：`bf27126`（I5 投影治理）→ `c1a71c0`（I6 实现，108 files +3840/-335）
- Web `develop`：`026c279`（I6 前端与 0.1.0 投影，13 files）
- Workspace `develop-sw`：`84110ca`（I5 投影治理）→ 本回执提交
- 远程推送、标签/Release 均未获授权，登记为发布门禁。

## 4. 18 验收原子对照

| 原子 | 状态 | 证据/边界 |
|---|---|---|
| A1 六渠道契约=一套权威 | ✅ 实现并回归 | 单一 `NotifyChannelAdapter` SPI、唯一门面、枚举补 EMAIL；生产无 dev 桩（P58Debug 仅 dev profile）；缺适配器明确 FAILED |
| A2 逐项事件可勾稽/幂等 | ✅（站内信/身份）+ 🟦 外部渠道投递 | 统一路由单测试 6/0；bpm 205 全量回归；真实外部渠道送达勾稽须 Provider 凭据 → 该子项 VERIFYING |
| A3 审批不回滚+恢复 | ✅ 实现 | AFTER_COMMIT 既有锁定 + 节点默认 CONTINUE + 恢复调度（@Scheduled 代码级验证，未做人工重启演示） |
| A4 记录可回读 | ✅ 实现 | 新列+尝试流水/失败分类/外部标识（字段级集成证据在 I6 测试与既有记录测试） |
| B5 模板版本/白名单/转义 | ✅ 实现 | 版本快照表+发布链路；渲染安全沿用已验收 render；HTML 净化器实现（EMAIL 载体），专项负向测试未单独落盘 |
| B6 规则订阅生效 | ✅ 实现 | required 不可关闭有真实行为测试（R5）；事件开关联动经路由裁决测试 |
| B7 跨租户拒绝 | ✅ | 租户行级隔离 + `I6NotifyClosureIntegrationTest.r6`；深链/模板负向复用既有 I5 fail-closed |
| B8 最小暴露 | ✅ 实现 | 记录列表/详情掩码 + 独立权限审计 + prod SQL 日志收敛；秘密零入库零日志 |
| C9 收件箱能力 | ✅ | 分页/未读/全部已读/稳定排序真实测试 r3 |
| C10 PC/H5 同权限 | ✅ 结构 + 既有权限链 | 页面/移动路由同对象；无权用户负向依赖既有收件箱越权测试 + 深链 fail-closed 设计；浏览器级视觉链路未运行（见 §4） |
| C11 管理端可达+契约一致 | ✅ 实现 | V90 菜单/权限种子；Web 契约更新；真实后端菜单可达性未做浏览器验证 |
| D12 五渠道真实验证 | ⬜ VERIFYING | Owner 凭据未到位；本地仅实现+编译+装配边界，未取真实成功/失败/恢复 |
| D13 渠道语义/回执判定 | ✅ 契约实现（本地） | 状态机/失败分类/重试/外部标识实现；真实 Provider 侧结果未取得 |
| D14 服务端解析目标 | ✅ EMAIL/PHONE 真实解析（sys_user 权威+状态校验）；⬜ Provider 明文主体解析（I5 external_id 摘要权威，缺映射源 → 明确失败，未冒充） |
| E15 版本权威+材料一致 | ✅ | version.json/CHANGELOG/升级/回滚/配置/迁移/manifest 骨架，两端投影 0.1.0 |
| E16 多身份全场景回归 | ⬜ | 属 Planner 验收轮全场景材料；本轮以全量门禁与既有 I3/I4 场景回归支撑 |
| E17 H2/PG 从基线升级 | ✅ 数据模型层 | Flyway 全链计数 90/88 通过；"既有通知/模板/流程实例可解释"由增量列语义保障，未做真实旧库升级演练 |
| E18 门禁通过+计数回读 | ✅ | Server 1341/0/0/0、Web 1183+3、Flyway V90；候选 SHA 见 §3 |

## 4. 未完成与风险（授权内剩余）

1. **五外部渠道真实行为证据（D12 全部）**：Owner 未提供可控测试账号/凭据/短信选型 → 对应原子保持 `VERIFYING`，不得冒称完成；Provider 明文主体映射源待 Owner 裁决（register fail-closed）。
2. **浏览器级行为链（C10/C11/E16）**：真实后端菜单可达、页面/深链/构造请求负向的浏览器证据未取得（本次仅 API/契约/权限种子与全量门禁）；属验收阶段补证范围。
3. **人工重启恢复演练（A3）**：恢复调度为代码+单元级行为；重启后从持久状态恢复未做真实停演示。
4. **候选固定与 manifest SHA 回填**：在 Planner 验收后按唯一终态值清单执行（方向 §8 已预留 P60 整体候选回执路径）。

## 5. 自验结论

I6 实现范围（不依赖秘密的全部可独立工作）已完成并全部通过工程门禁；五外部渠道真实原子按方向 §5 保持 `VERIFYING`，无冒称。合法终态：阶段 `VERIFYING`、机器 `EXECUTION_SUBMITTED`，待规划验收。
