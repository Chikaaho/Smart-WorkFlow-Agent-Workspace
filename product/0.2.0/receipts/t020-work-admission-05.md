# T020 后台持久认领的租户边界

2026-10-23｜Executor｜XL｜IN_PROGRESS

七阶段：需求评估完成；分支实施进行中；验收同步、合并、发布、发布后同步、结束未开始。本回执承接会话准入修复，记录后台认领正在实施的实际证据。A08 尚未完成。

## 采用的实现

在 sw-common 定义 TenantWorkAdmission 纯接口，提供租户与有界数据库条件认领回调；System 层实现权威校验。basic 和其他业务模块依赖下层契约，不能查询 System 业务表或依赖其实现。

实现以独立短事务锁定目标租户行，读取启用状态与有效期；有效才执行持久 CAS，返回前提交。停用更新和该行锁串行，形成可证明的先后关系。回调只允许有界数据库认领，不执行外部发送或完整业务；认领事务 10 秒上限。失效或缺失租户返回 0，原对象保持待执行；基础设施故障抛出。已经持久认领的动作沿原结果写回，不在停用时强制改历史终态。

BPM 队列在 PENDING→PROCESSING 的 CAS 边界调用该契约，条件显式保留原租户。失效租户不取租约；恢复后领取原 commandId，终态不会重复领取。批量预算只在成功认领后计数，失效租户不会消耗本轮批量额度。旧隔离队列测试显式提供测试认领契约，不能据此声称生产租户有效性已通过。

## 已取得的证据

实际 H2/隔离 PG 的 `tenant-work-admission-boundary` 两用例通过，15.01 秒，Maven exit 0。控制回调已进入后持有租户行锁，另一连接停用写入明确等待；释放认领后停用提交成功。停用后的下一对象不执行回调、状态仍 PENDING，已认领对象可记录真实 DONE；过期拒绝，回调写入后失败整体回滚，恢复后仍领取同一行，缺失归属拒绝，主线程操作者保持租户 0。用 CountDownLatch 和有界 Future 等待协调真实并发，无固定 sleep。

`tenant-work-queue-02`：队列单测/真实 H2 队列/租约交接/分级语义 25 用例通过，H2/PG 的真实 BPM 队列新增 2 用例通过（20.46 秒），BUILD SUCCESS。真实队列用正式迁移表、Mapper 与租户拦截器：停用后命令保持 PENDING 且 claim_token 为空；启用后原 commandId 取得租约；再次停用后原租约可完成；恢复不重领终态、记录数为 1。没有发送实际审批副作用，该用例证明持久队列边界。首次命令在 bootstrap 测试编译阶段发现旧 OverlapH2 子类构造未适配，保留原文并补齐显式测试契约后通过。

原文位于 `C:/Users/hjxch/.codex/evidence-020/tenant-identity/tenant-work-admission-boundary.log`、`tenant-work-queue.log`、`tenant-work-queue-02.log` 与对应结果文件。MAVEN_OPTS=-Xmx2g；自有 PostgreSQL 由 fixture 正常关闭，用户 Redis 服务未动。

扩大回归 `tenant-work-queue-final`：IoT 队列 5、System 装配 3、BPM 命令/队列/资源保障/分级/批量 99、bootstrap 28，共 135 用例，零失败、零错误、零跳过，BUILD SUCCESS。bootstrap 包含真实引擎租约交接 4、PG 分级语义 4、TenantAdministrationDatabaseTest 完整 20（107.6 秒）。Phase5 边界类本次报告 0 tests，未计入通过数。原文 `tenant-work-queue-final.log` 和对应结果文件。

Server `a23bae58486493c82ddc1b041016c09ea85395d4`，8 文件、186 insertions / 8 deletions，普通推送任务分支；范围为 common 认领契约、System 权威实现与 Mapper 注释、BPM 队列及其隔离测试配置、bootstrap 数据库与旧租约夹具。Web 保持 `dd29316`。这些证据没有把其他尚未接入的后台模块计为通过。

## 继续实施

IoT 预约/发送/补偿和触发恢复、通知意图与恢复、OpenAPI 回调、BPM 时限的认领仍需接入并取正反行为证据；启停/过期审计也待补齐。检查发现 IoT 补偿预认领后又进入普通发送认领、通知既有意图外发先于认领，需在本版准入收敛时修正其边界并验证零重复。这里仅记录代码事实，不将未跑的链路计为通过。A03 整体、A08、T020 及整版未完成，F020/J020/W020/U020 和后续验收发布阶段继续承接。

BPM 消费者恢复身份还调用普通登录装载，停用恰好发生在认领后、身份恢复前时可能把已认领命令直接拒绝；队列层测试不证明该窗口已解决。下一实施须在有效持久租约前提下保留已认领动作的租户语义，同时继续实时检查用户停用、归属和 P0 撤权，不能以“已认领”为由扩大权限。
