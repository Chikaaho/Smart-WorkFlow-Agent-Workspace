# P62 资源保障与多租户公平 · 执行回执 01（resource-assurance-01）

日期 2026-10-03；执行（Executor）；runId 集合 `p62ra01r01-fixed` / `p62ra01r02-recovery` / `p62ra01r03-downgrade` / `p62ra01r04-gate` / `p62ra01r05-swap`。唯一执行入口 `ready/direction-p62-resource-assurance.md`；决策依据 ADR-P62-003。**自验结论：RG01/RG02/RG04/RG05/RG07 行为链自验通过；RG03 结果/公平/收敛层通过、受保护时效层存在实测差异（见 §7）；RG06 界面交付+组件验证、正式浏览器验收未执行；RG08 正式窗口未执行。提交 `EXECUTION_SUBMITTED`，待规划验收与 RG03 时效差异裁决。**

## 1. 功能与内部 Step 概要

Server 批次A `7a28b70`（准入/会计/公平/画像/运维接口）、批次C `395515e`（死锁消除/取证修复/Harness）；Web 批次B `28a2805`（策略/积压控制台）。内部 Step：A1 迁移与模型 → A2 准入额度 → A3 公平调度 → A4 并发闸与画像 → A5 模块测试 → B1 Web 页面 → C1 测量 Harness 五段实跑。

## 2—3. 实际读取与修改文件（摘要）

**Server `7a28b70`+`395515e`（36 文件）**：
- 迁移：`V0.1.4__resource_assurance.sql`（PG/H2 逐字节一致；策略/占用计数/拒绝审计三表 + 命令资源冻结字段 + 全局计数种子）+ `R__p62_resource_ops_menu.sql`（菜单 9106/9107/9108，授权 9315—9317）+ 模块测试链镜像 `V104`；锚测试 `FlywayFullChainH2/PostgresTest` 机械修正（10 条、终点 0.1.4）。
- 模型：`BpmResourcePolicy/BpmResourceUsage/BpmResourceRejectLog/ResourceClassEnum/ResourceSegmentEnum` + `BpmCommand/CommandEnvelope` 资源冻结字段 + 三 Mapper（`BpmResourceUsageMapper` 含原子 `incrementWithinCap`/`decrement`/`casRepair`/`lockInOrder` 全序预锁）。
- 准入/会计：`ResourceAdmissionService`（停受理→速率桶→容量段+全局+租户原子占位；段优先序 PROD:SHARED→PROD→OA、OA:SHARED→OA→PROD、BULK 仅 SHARED；REQUIRES_NEW 拒绝审计与计数行建立；**usage 行全序预锁防死锁**）、`ResourceReleaseService`（终态释放判定：BULK 按项、TARGET_ACTION_DONE 不因 SUCCEEDED 释放、FAILED/EXPIRED 释放、requeueFailed 再占用）、`ResourceAssuranceReconcileJob`（轻流程目标按引擎事实释放 + 计数漂移 CAS 修复 + TOTAL=Σ段）、`ResourceFactView`（占用事实唯一口径）、`TenantRateBuckets`（令牌桶 50/s/突发500）、`LightProcessClassifier`（已发布图 TXN_ACTION 判定→完成点冻结）。
- 接缝改造：`CommandAcceptService`（幂等回查后准入；P0=PROD/NORMAL=OA）、`FlowStartPortImpl`（先回查后准入；完成点 TARGET_ACTION_DONE/FLOW_STARTED）、`TxnBatchServiceImpl`（整笔按项数准入）、`BatchInvokeCommandHandler`（逐项结算回收+切片让出 `CommandContinuationSignal`）、`PersistentBpmCommandQueue`（公平领取按活跃租户切片、批量每轮限量、资源字段持久化、终态/过期释放、续跑重入队）、`CommandDispatcher`（续跑信号不写终态）。
- 启用检查/画像/运维：`ResourcePolicyService(Impl)`（保留份额自洽/额度下限/消费者可用/池相容四查；DynamicRoutingDataSource→realDataSource 解包读真实池值）、`BpmResourceOpsService/Controller`（profile/backlog/commands/rejects；租户隔离+独立管理权限）、`TxnActionRealtimeGuard`（实时并发闸 16/8，仅 HTTP 实时入口）+ `TxnActionRuntimePort`。
- 错误码：Bpm 2427—2431、Form 1614；yml 忽略表 +3。
- Harness：`P62ResourceAssurancePgTest`（五段，分段系统属性门控）。

**Web `28a2805`（5 文件）**：`api/resource-ops.ts` + `ResourcePolicyConsole.vue/.spec.ts`（版本化创建/预检/启用/停用/停受理）+ `ResourceBacklogConsole.vue/.spec.ts`（分层汇总/勾稽标签/明细分页过滤/拒绝审计）。

## 4. 实际命令与原始结果摘要

| 验证 | 命令（关键参数） | 结果 |
|---|---|---|
| bpm-process 全量 | `mvn test -pl sw-biz/sw-bpm/sw-bpm-process -o` | **255/0/0/0**（含资源保障 H2 12 例：并发不破额度/幂等不重复占用/段保护/公平切片/批量切片让出/停受理/启用检查/轻流程释放） |
| form-biz 全量 | `mvn test -pl sw-biz/sw-biz-form/sw-biz-form-biz -o` | **173/0/0/0**（含实时并发闸控制器授权） |
| bootstrap 迁移锚 | `mvn test -pl sw-bootstrap -o -Dtest=FlywayFullChain{H2,Postgres}Test` | **29/0/0/0**（全新库 10 条、终点 0.1.4、篡改与重复校验） |
| RG02/RG03 固定+突发 | `P62ResourceAssurancePgTest#fixedAssuranceWindowProfile`（warmup20s+formal90s，shortVerify=true） | 受保护四路径零失败（524/486/216/110）；轻流程受理 P99=1971.4ms≤2s；收敛 openAfter=0、counterTotal=factTotal=0；拒绝全部记突发（2427×1973/2428×2）；**实时 P99=976.2ms>300ms（差异，§7）** |
| RG03 租户互换 | `#burstTenantSwapProfile` | 受保护零失败（521/476/216/109）、拒绝记突发（2427×1847）、收敛勾稽一致；实时 P99=1111.5ms（同差异） |
| RG07 恢复 | `#recoveryRestartContract`（实例关闭→新实例） | 100/100 收敛 **elapsedMs=2016≤120s**、invocations=100 重复效果=0、配额恢复不双计（counterTotal=factTotal=0） |
| RG07 停受理/降配 | `#stopAcceptanceDowngrade` | 停后新受理 2429 明确拒绝、占用零新增；停用回退后受理恢复、无策略行为 |
| RG04 启用门禁 | `#invalidEnablementGate` | 有效画像启用+回读（actualMaxActive=64、异步 ON、批量消费者注册）；池5+异步OFF 隔离上下文启用检查双违规明确拒绝（消费者×2 + 池 5<34），证据 `enablement-invalid-pool5-async-off.txt` |
| Web 四连 | `pnpm typecheck && lint && test && build` | 全 exit 0；vitest **1321 passed+3 skipped**（新增 8）、lint 0 errors、build 成功 |

死锁回归：批次C 前固定窗口出现 PG `deadlock detected`（受理 vs 完成 usage 行锁交叉）；全序预锁后同负载 **0 次**。

## 5. 与方向的偏差

1. **测量窗口缩短**：方向固定 60s 预热+600s 正式×多窗与 2h 持续；本会话实跑 20s+90s 短验证轮（`shortVerify=true` 逐文件标注）。原因：会话工具单命令 10 分钟上限且禁后台长任务（Owner 明确指令）；正式窗口命令固定于 §8 待执行。
2. **审批种子独立表单**：Harness 初版审批流复用轻流程表单，被表单级单有效绑定不变式（publish 激活即停旧）拦截，改用独立 `p62_ra_todo_t*` 表单（与 r04 seedOaBusiness 同口径），属实现修正非方向偏差。
3. 计量实现选择（方向授权 Executor）：进程内令牌桶（单应用进程画像下成立，多进程需外置共享桶——已声明）；轻流程目标占用释放采用「引擎队列事实近似」（job+死信=占用，节点推进毫秒级窗口偏保守安全方向）。

## 6. 遇到的问题与修复（真实缺陷 3 项，均批次C修复）

1. **PG 死锁**（受理持 usage 锁写命令行 vs 完成持命令行锁等 usage 锁）→ usage 行全序预锁（`lockInOrder`：GLOBAL 按 segment 字典序+租户行），修复后同负载 0 死锁。
2. **PG 事务毒化**（唯一键冲突中止当前事务后续语句，H2 宽松掩盖）→ 计数行建立改 REQUIRES_NEW 独立短事务。
3. **对账调度线程租户 fail-closed**（无登录态时 `releaseLightProcessTarget` 命令行更新被拦截器拒绝）→ 与 reclaimStale 同口径挂起。

## 7. 与验收标准逐项对照（RG01—RG08）

| RG | 对照结果 | 证据 |
|---|---|---|
| RG01 | **通过**：策略非法额度（保留份额不自洽/租户越全局）启用检查拒绝；启用经真实入口（服务）保存生效；启用拒绝与准入拒绝独立审计（reject_scope/reason_code） | H2 `enablementRejectsInvalidBudget/enableValidPolicy/stopAcceptanceRejectsNewOnly`；PG `enablement-invalid-pool5-async-off.txt` |
| RG02 | **通过**：24 线程×50 单位竞争 600 上限恰 600；幂等重放/同键异载荷不重复占用且原效果不变；批量 5 项整笔计 5 单位、逐项回收、对账不双计；过期/完成/拒绝释放；requeue 再占用 | H2 12 例；PG fixed 窗口 quota-samples（占用≤上限）+ convergence counterTotal=factTotal |
| RG03 | **部分通过**：保留段保护（BULK 不进保留段、PROD/OA 各得保留）、租户公平切片（两租户 2/2）、批量切片让出（5 项批 2 项/轮）、突发交换对称、零失败、120s 收敛——全过；**受保护时效差异**：实时 P99 976.2/1111.5ms（预算 300ms）、OA 读 1955.9/2054.8ms（1s）、审批 2290.7/2728.4ms（1s）；轻流程受理 1971.4ms≤2s 压线过。p50 61.9—404.6ms 正常，尾尖集中于突发整笔准入后的连接竞争峰；**按方向§3 回传实测差异供 Planner 裁决（预算/画像/实现三选一的调整方向）** | `p62ra01-fixed/fixed-burst-report.txt`、`p62ra01-swap/*-report.txt` |
| RG04 | **通过**：有效画像启用+运行画像回读（真实池 64/异步 ON×8/dispatcher 100ms×50/消费者注册/实时闸 16-8/计数勾稽）；池5+异步OFF 无效启用在开启新受理前明确拒绝；默认 prod 池5/异步OFF 风险在隔离环境定性，不改生产配置 | `p62ra01-gate/enablement-valid-profile.txt`、`enablement-invalid-pool5-async-off.txt` |
| RG05 | **通过**：命令积压/引擎目标（act_ru_job+死信）/批量未完项分层汇总；全部状态/类别/段/租户聚合可查；占用计数与事实勾稽字段（countersConsistentWithFacts）；命令明细含受理→领取→终态→释放全时间戳与效果权威/拒绝审计/目标动作关联；不以 SUCCEEDED 掩盖目标未决（TARGET_DONE 单列） | `BpmResourceOpsService` + Web backlog 页组件测试；PG recovery 证据 invocationSamples |
| RG06 | **部分完成**：两页面经现有流程运维菜单承载（9106/9107，不新增外部路由）；四连全绿+8 组件测试；权限分流（view/manage）与租户隔离服务端强制。**正式浏览器验收（headless=false 四视口留证）未执行**——依赖 Planner 对 RG03 差异裁决后与正式窗口一并安排 | Web `28a2805`；菜单 SQL |
| RG07 | **通过**：停新受理明确拒绝+在途结算+停用回退不丢查询；100 条恢复 2016ms≤120s、invocations=100 零重复、配额不双计；在途冻结（受理冻结段/版本）、跨版本共享计数、旧无字段对象不参与会计；P4/C1/批量/UNKNOWN 边界未触碰（既有测试全绿） | `p62ra01-recovery/recovery-restart.txt`、`p62ra01-downgrade/stop-acceptance-downgrade.txt` |
| RG08 | **未执行**：正式 10min 窗口×2h 持续受会话工具上限限制未跑；短验证轮已覆盖对应断言结构（每窗时效/计数/资源/收敛），正式轮待执行 | §8 |

## 8. Git 与剩余动作

**Git**：Server `7a28b70`→`395515e`（develop，远端 ls-remote 回读一致）；Web `28a2805`（回读一致）；Workspace 本批次随回执提交。环境指纹：M1 8 核/8GiB、JDK21、zonky PG 17.5、Druid 64、异步 ON×8、dispatcher 100ms×50、堆 2GiB（`env-frozen.txt` 各 run；buildCommit `7a28b70` 批次A/`395515e` 批次C）。证据 36 文件 SHA256 清单 `evidence/resource-assurance-01/SHA256SUMS.txt`。

**剩余动作（依赖 Planner，非本授权内可继续项）**：
1. RG03 时效差异裁决：方向预算（300ms/1s）× 突发 200 单位/s × 单池 64 连接画像实测不可全窗兑现——由 Planner 三择一：调整预算 / 调整突发画像 / 授权实现级强化（如池外分相、批量限流加深）。裁决前正式窗口无判定基线。
2. RG08 正式窗口（60s+600s×多窗、2h 持续）与 RG06 正式浏览器验收：受会话工具单命令 10min 上限限制，需跨会话或 Owner 另行安排运行方式。
