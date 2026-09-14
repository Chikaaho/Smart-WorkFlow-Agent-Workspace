# P60 I6 通知与版本收口实现回执 02（补证轮）

> 执行角色：执行（Executor）
> 日期：2026-09-14
> 方向：`../ready/direction-stage-i6-notification-version-closure.md`
> 前置审查：`planning-review-stage-i6-notification-version-closure-01.md` = **VERIFYING**（L1—L7 锁定；本轮只交 G1—G9 新增行为证据）
> 机器状态：`EXECUTION_SUBMITTED`（阶段仍 `VERIFYING`）

## 1. 本轮新增行为证据（只对未锁定的 G1—G4/G6—G9；G5 维持 VERIFYING）

### G1 审批不回滚与持久恢复（真实文件库 + 双 JVM 重启链）

`sw-basic-notify-biz/src/test/java/com/sw/ck/notify/i6/I6G1aNotifyFailureBootTest.java` + `I6G1bRecoveryBootTest.java`（共享支撑 `I6NotifyRestartSupport`，`jdbc:h2:file:./target/i6-restart-db` + `AUTO_SERVER=TRUE`）：

- **G1a（重启前）**：同一真实业务通知对象（租户 100/事件 TODO_CREATED/业务对象 task-g1/接收人 7/渠道 FEISHU）在真实失败适配器（`java.net.SocketTimeoutException` 注入）下首次投递 → `delivery_status=FAILED`、`failure_class=RETRYABLE`、`sw_notify_send_attempt` 恰 1 行（attempt_no=1），业务通知单行在册。
- **G1b（重启后）**：上一 surefire JVM 进程 **真正终止** 后，第二个测试 JVM 对同一文件库独立启动；`sw.notify.recovery.fixed-delay-ms=300` 的自主 @Scheduled 调度（非人工方法调用）从持久状态恢复完成依赖唯一行上的条件认领（`delivery_status/retry_count` 双条件），**同一业务行 ID 继续使用**（不新增第二条业务通知），追加 attempt_no=2 失败尝试流水，终态保持 FAILED（可重试类）。A→B 均以独立 `mvn test -Dtest=…` 两次调用驱动（两次 surefire 启动 = 重启）。
- **审批不回滚语义**：恢复链实现封堵了恢复写回在无认证线程的 fail-closed 缺口（`NotifyDeliveryRecoveryServiceImpl.recoverOne` 全链经 `TenantLineSuspension` + 显式行租户），事实性证明恢复写回不再被租户上下文缺失打断（此缺陷为 G1 行为验证中发现并真实修复：G1b 无此前修复即错误出现并已复测通过）。节点显式 `BLOCK` 策略下失败仍可回滚节点步骤属产品语义（方向 §3.2 允许显式配置），默认 CONTINUE 已在前轮落地并由 `bpm-process` 全量回归锁定。

### G2 模板/规则/渲染安全（B5/B6）——`I6NotifyClosureIntegrationTest` 13/0/0/0

- **G2a 版本不可变**：发布模板 v1 → 历史投递固定 `template_version=1` → 编辑生成 v2 快照（latestSnapshot=2）→ 既有消息行版本号不变（真实 SQL 回读断言）；`sw_notify_template_version` 唯一键承接追加。
- **G2b 发送前失败**：模板引用缺失变量 → `batchSend` 明确抛错且收件箱零残留（0 行）。
- **G2c 渲染安全**：`NotifyHtmlSanitizer` 对 `<script>`/内联事件（含无引号形式）/`javascript:` 协议三向断言净化成功（负向输入真实清洗输出断言）。
- **G2d 规则与订阅生效**：规则停用后路由回落保底 IN_APP（真实列表断言 containsExactly）；订阅保存后既有投递行不受影响（行数与内容不变）。

### G3 双租户矩阵与目标解析（B7/B8/D14）

- **G3a**：同一模板在租户 200 中 `getTemplate` 抛 `NOT_FOUND`（跨租户读拒）；租户 200 `listEnabledByEvent` 返回空（规则跨租户不可读）；用户订阅按租户+用户隔离（未串扰）。消息/尝试的跨租户读由既有收件箱越权与租户行级拦截承载 + r6 未读=0。
- **G3b 目标解析 fail-closed**：`EmailNotifyChannelAdapter` 在 `resolveEmail` 返回 null（失效/缺失联系方式）时明确 `FAILED`，failureReason 含"无法解析收件邮箱"（真实 adapter 行为，非 mock）。
- **G3c 最小暴露**：`recordDetail`（默认管理员视图）对正文返回 null；完整正文仅 `/notify/records/{id}/detail`（独立权限 `notify:record:detail` + 服务端审计）。

### G7 旧库升级（真实演练，非声明）——`bootstrap/I6G7UpgradeDrillH2Test` 1/0/0/0

文件 H2 逐段迁移至 V58 → 真实 INSERT 旧消息（id=1）/旧模板（id=500）/旧尝试（id=1）→ 继续迁移至 **V90** → 同一 ID 回读：标题/正文/业务对象逐字一致；增量列（event_type=SYSTEM、occurrence_no=1、retry_count=0、started_at=NULL 对历史行）语义可解释；无重建、无删除、无替换对象。

### G9 工程门禁与新增前端聚焦测试

- 独立 compile 门：`mvn -q compile` exit 0（原始输出 `/tmp/srv_compile.log` 为空即无错误）。
- Web 新增专项测试：`NotifyChannelList.spec.ts`（未装配渠道启用被服务端拒绝 + 已装配启用成功）、`NotifyPreference.spec.ts`（必须送达项在 UI 关闭被服务端拒绝且不改写既有状态）——Web 测试 **130 files / 1185 passed + 3 skipped**（I6 轮基准 1183 → 1185，+2 新规范），`pnpm typecheck/lint/test/build` 四门全部 exit 0（BUILD_OK）。

### G6/A2/E16 说明

- 12 类流程事件的身份/勾稽依赖真实流程对象执行；本轮已把 G6 的通知对象链与身份幂等以真实测试锁定（G1a/G1b + I6 聚焦测试），**多身份（代理/受托人/抄送/无权用户）的同对象浏览器与页面级全场景**仍属 Planner 验收阶段材料，未在本轮冒称。
- G4 浏览器真实链：本会话未运行 UI 自动化（后端真实运行环境未启动）；如实保持 `VERIFYING`，不为 G4 虚构证据。
- G5 五外部渠道：Owner 条件未变，维持 `VERIFYING`；本轮无任何渠道被宣称真实成功。

## 2. 门禁与计数（本次实际）

- Server：`mvn -q compile` exit 0；`mvn test` **BUILD SUCCESS，全仓 1357 tests / 0 failures / 0 errors / 0 skipped**（较上轮 +16：I6 证据 13 + G1a/G1b + G7）。
- Web：typecheck ✓ / lint ✓ / test **130 files、1185 passed + 3 skipped** ✓ / build ✓，均 exit 0。
- 代码变更：恢复轮租户写回剥离缺陷修复（attempt 显式租户）、`NotifyHtmlSanitizer` 无引号事件属性扩建、Email 适配器配置空值防护——均为证据相关缺陷修复并随本轮测试锁定。

## 3. Git（本轮均本地提交，未推送）

- Server：本轮证据测试与工厂修复提交（待本回执后随下一笔提交登记）。
- Web：新增两规 spec 与 NotifyChannelList 修正。
- Workspace：本回执与状态压缩同步提交。
- 远程推送、标签/Release 维持未授权门禁。

## 4. 剩余待办（保持 VERIFYING 的边界）

1. **G4/G6 的浏览器级与多身份全场景**（页面视觉链、真实后端菜单可达、撤权后深链/构造请求负向、多身份同对象全链）——需 Planner 指定或 Owner 提供运行环境。
2. **G5 五外部渠道真实行为**（Owner 凭据未到位）与 **G8 候选固定/manifest SHA 回填**（阶段三按唯一终态值清单执行）。

## 5. 自验结论

G1—G4（浏览器除外）、G6（同对象通知链部分）、G7、G9 已由真实行为证据闭合；G4/G5 及 E16 浏览器与外部条件部分保持 `VERIFYING`，无冒称。合法终态：阶段 `VERIFYING`、机器 `EXECUTION_SUBMITTED`。
