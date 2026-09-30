# P62 分级执行与统一命令：正式完成回执 01（自验通过，待规划验收）

日期：2026-10-01；角色：执行（Executor）；阶段状态：**自验通过，待规划验收**（功能验收前不改终态值）。
依据：`../ready/direction-p62-tiered-execution-unified-command.md`、ADR-P62-002。过程回执：S1—S5 进度回执 01（`tiered-execution-unified-command-s1…s5-progress-01.md`），证据目录 `evidence/tiered-execution-01/`。

## 1. 交付概要（切片 → 提交）

| 切片 | 交付 | Server 提交（develop，均推送并回读） |
|---|---|---|
| S1 命令语义核心 | 统一逻辑身份/载荷指纹/准入截止（1—300s 默认 30）/效果权威账本/执行权防护/EXPIRED/对账恢复 | `8a5acae` |
| S2a 受控 Port | `FormTxnActionPort`（form-api）+ `FormTxnActionPortImpl`（`form:action:invoke` + 租户，describe fail closed） | `f9866a4` |
| S2b TXN_ACTION 节点 | 翻译器（发布期绑定校验同租户已发布）+ 委托（幂等键 `NODE:{pid}:{aid}`、结果写回变量、BLOCK/CONTINUE） | `27279bc` |
| S2c 轻流程发布门 | `LightProcessGraphValidator`（白名单 START/END/CONDITION/TXN_ACTION、无环、≤16 动作；普通图不受约束）+ 错误码 2421—2423 + i18n + 真实 PG 端到端 | `8c7f0fd`、`39ed182` |
| S3 后台批量 | 迁移 V0.1.3（批次/项表）+ `BATCH_INVOKE` 逐项独立事务（REQUIRES_NEW）+ 稳定项键幂等 `BATCH:{batchKey}:{itemKey}` + 批次重放返回原批次 + 效果权威 + 控制器 | `e4d58c8` |
| S4 设备未知结果 | 回执超时→UNKNOWN 禁止自动重发 + HMAC 回执守卫（迟到收敛/重复幂等/冲突留审计）+ 最小权限 `iot:command:verify` 人工核实（仅 UNKNOWN、依据必填、审计前后状态）+ `findByApprovalBizId` 关联回查 | `fabf7a7` |
| S5 Web 界面 | 批量控制台（受理/回查/逐项定位/重放提示）+ 设备命令回查与人工核实入口 + 批量菜单 9105 | Server `d5f60b2`；Web `c87a394` |
| S6 U06 演练 | 隔离升级/回退演练（旧消费者显式失败保留/协调升级/回退无重复效果/历史可查）+ 修复调度线程无身份写路径（failAndScheduleRetry 读写挂起租户） | `1693d55` |
| S6 U08 测量 | 固定预算测量套件（手动门控 `-Dp62.budget.measurement=true`，可复算 seed=20260930） | `fe62cf8` |
| 对账修复 | 真实启动环境暴露的对账链路无身份查询租户挂起（sweep 异常清零验证） | `fe7fc8c` |

## 2. U01—U08 逐项对照（关键证据）

| 编号 | 结果 | 证据（原始输出/计数/文件） |
|---|---|---|
| U01 四类场景真实入口配置/发布/运行；不支持组合发布拒绝 | 达成 | 轻流程：真实发布门（`P62LightProcessE2ePgTest` 发布成功 + 混 APPROVAL 拒 2421、草稿不变/绑定不激活）；批量：API+界面真实受理（浏览器 `accept-batch-01`）；实时/人工继承首阶段与 P4 既有（普通图回归全绿） |
| U02 统一身份一次效果；同键异载荷拒绝 | 达成 | `TieredCommandSemanticsH2Test` 6/0/0/0（身份唯一/指纹冲突）；`P62LightProcessE2ePgTest` 3/0/0/0（replay=true、同键异载荷 1606）；批次重放返回原批次（H2+PG+浏览器） |
| U03 同成同败/持久受理可恢复/旧执行者无重复效果 | 达成 | 效果权威账本（effect/stale PG 证据）；租约防护；批次逐项独立事务（`P62BatchInvokePgTest` 1/0/0/0）；U06 中断恢复项幂等不叠加 |
| U04 准入截止/等待超时可回查/外部待核实 | 达成 | EXPIRED 仅待执行（deadline PG 证据）；overdue_at 只记不判；S4：回执超时→UNKNOWN 不重发、HMAC 守卫（迟到收敛/重复幂等/冲突留审计/坏签名 401）、人工核实（403/无依据拒绝/依据审计），受控真实 HTTP 传输对端（`P62DeviceReceiptPgTest` 1/0/0/0） |
| U05 越权/跨租户/非法配置拒绝；受理冻结 | 达成 | Port 权限（无权限 403，服务内复校）；跨租户动作不可达（describe empty→2424）；轻流程门 2421—2423；受理冻结 tier/completion_point/deadline（批次 action_version 冻结，DB 读回 `tier=BULK`） |
| U06 旧通道/在途兼容；隔离升级/回退演练 | 达成 | 普通图不受轻流程约束（process 模块 242/0/0/0）；既有设备回写端点原语义（Sanitize 回归绿）；`P62CompatRollbackPgTest` 2/0/0/0：旧消费者 FAILED 保留无效果→协调升级 COMPLETED→重放原批次命令唯一→中断恢复只补 PENDING |
| U07 按权限回查/批量项独立追踪/形态版本截止可查 | 达成 | 命令查询既有端点；批次回查（API+界面逐项状态/调用记录/错误定位/尝试次数）；设备命令抽屉 + `findByApprovalBizId`；DB 读回（`08-db-readback.txt`：批次/项/命令 tier/completion_point/效果权威/调用记录/宽表预占同组对象一致） |
| U08 固定预算实测 | 达成（见 §3） | 证据 `evidence/tiered-execution-01/{realtime-action,light-process-acceptance,recovery-drain}.txt` |

## 3. U08 测量结果（限定环境实测；非生产 SLA）

环境：本机 M1（arm64）单应用进程 + 单隔离 PG17.5（zonky EmbeddedPostgres）、堆 2GiB（MAVEN_OPTS -Xmx2g）、Hikari max 32、JDK 21；两租户（0/100）各 1000 对象、10% 热点、seed=20260930；并发 16（两租户各 8）、预热 60s、正式 5min。

| 场景 | 样本 | 合法失败 | 拒绝率 | P50 | P95 | P99 | 预算 | 裁决 |
|---|---|---|---|---|---|---|---|---|
| 实时动作（服务层入口至事务提交） | 139,698 | 0 | 0.0000 | 30.9ms | 50.3ms | **80.9ms** | ≤300ms | **PASS** |
| 轻流程入口至持久受理 | 124,921 | 0 | 0.0000 | 31.7ms | 101.4ms | **178.7ms** | ≤2000ms | **PASS** |
| 恢复：100 条无外部依赖命令收敛 | 100/100 | — | — | — | — | — | ≤120s | **PASS（7,603ms）**，效果权威=100、调用记录=100（重复效果=0） |

测量边界（如实声明）：入口为服务层事务入口（FormSubmitService/TxnActionExecutor），不含 HTTP 反序列化；进程不重启（恢复段为既有调度消费收敛）；运行期存在 DEBUG 日志磁盘写入背景负载（1.1GB），结果为保守值；压力边界（64 并发/5min）为按需度量项（`-Dp62.budget.stress=true`），本轮未运行，不据此核销 A07，不设生产容量结论。

## 4. 正式浏览器验收（可见会话，headless=false）

环境：自建隔离验收实例（PG16 库 `sw_p62_accept` 全新迁移 + 打包 jar `fe7fc8c` 内容 + 前端 dev 代理），真实链路（登录 → 真实菜单 → 真实 API → PG 落库）。制品 `evidence/tiered-execution-01/browser/`：

- `01-txn-action-1920.png` 事务动作管理（菜单"事务动作"，已发布动作可见）
- `02-batch-result-1920.png` 批量控制台真实受理 `accept-batch-01`：状态"部分失败"、1/1/2、item-1 成功（invocation `eefc5510`）、item-2 已拒绝 `[1604] 可用数量不足`、尝试各 1
- `03-batch-result-{1280x720,1366x768,1024x768}.png` 三分辨率回查视图
- `04-batch-replay-1920.png` 同键重放提示"已返回原批次，未重复执行（已成功项不重做）"
- `05-device-commands-1920.png` 设备命令抽屉（power_on 结果未知待核实、超时原因可见）
- `06-manual-verify-dialog-1920.png` 人工核实弹窗（结果方向 + 依据必填 + 审计口径提示）
- `07-manual-verify-applied-1920.png` 提交后"已核实：UNKNOWN → SUCCESS"，结果含 `MANUAL_VERIFY`/依据/操作者
- `08-db-readback.txt` 同组对象数据库读回：批次 PARTIALLY_FAILED 1/1/2、项 SUCCEEDED/REJECTED(1604)、命令 `BATCH_INVOKE/tier=BULK/completion_point=BATCH_SETTLED/COMPLETED`、效果权威 1 行、调用记录 2 条、宽表 ACCEPT-A1 预占 1（A2/A3 未动）、设备命令 SUCCESS（MANUAL_VERIFY 来源）、审计 `COMMAND_MANUAL_VERIFY before=UNKNOWN,after=SUCCESS,basis=…`

## 5. 验证集合（本轮实跑汇总）

| 层 | 计数 |
|---|---|
| sw-bpm-process 模块全量 | 242/0/0/0 |
| H2 行为测试 | TieredCommand 6、TxnBatch 6、LightProcessValidator 12（合计 24/0/0/0） |
| 真实 PG | LightProcess E2E 3、BatchInvoke 1、DeviceReceipt 1、CompatRollback 2、TieredCommand 4、TxnAction 12（合计 23/0/0/0） |
| 迁移链 | FlywayFullChainPostgresTest 12、FlywayFullChainH2Test 17（V0.1.3 + R__4 锚点） |
| Web 四连 | typecheck 0 error / lint 0 error（3 既有 warning）/ vitest 1313 passed+3 skipped / build ✓ 2.67s |
| 预算测量 | 三场景 PASS（§3） |

## 6. 偏差、风险与边界（如实）

1. **压力边界未运行**：64 并发/两租户各 10000 对象/50% 热点/5min 为"只度量"项且套件支持按需运行，本轮未执行；不据此宣称生产容量，不核销 A07。
2. **批量受理动作标识**：当前受理按动作 id 绑定（界面提示"已发布事务动作的标识"）；按 actionKey 受理为可用性增强，未纳入本阶段（不扩范围）。
3. **测量边界**：服务层入口计时、DEBUG 日志背景负载、进程不重启——均已声明，结果为保守值。
4. **延期项不在完成声明内**：腾讯实网对账、自动厂商对账、物理恰好一次（方向明确延期）；五套既有恢复框架未重构；未引入 Broker/JDK 升级。
5. **轻流程失败语义**：节点失败保留已完成效果（方向口径），整流原子回滚不在合同内。
6. **验收环境临时种子**：`form:data:submit` 权限（菜单 9106）仅为验收库临时 SQL（使 API 预置数据可行），未进迁移文件；批量控制台/核实权限已随 R 迁移交付（9104/9105 + role 2 授权）。
7. **修复披露**：U06 演练暴露调度线程无身份写路径缺陷（failAndScheduleRetry/对账链路租户拦截异常），已在 `1693d55`/`fe7fc8c` 修复并回归。

## 7. Git 与入口身份

- Server `develop`：`27279bc → fe7fc8c`（本阶段 10 个实现/测试/修复提交，均推送并回读一致）；Web `develop`：`19e1c47 → c87a394`（已推送）。
- Workspace：gitlink 随各批次同步（最新 Server `fe7fc8c`、Web `c87a394` 于终态同步批更新）。
- 不变量保持：功能数 45、清单 90=✅46/🟦22/⬜22、ADV64、计数 45/46-22-22/ADV64、P 编号零变化（本阶段不新增完成数）、0.1.3 保持 COMPLETED（Owner 已验收）；P62 整体维持 PLANNING，本阶段通过不代表 P62 整体完成。

## 8. 自验结论

U01—U08 在授权范围内逐项达成并附真实行为证据（真实 PG、真实 HTTP 传输对端、可见浏览器、可复算测量样本）；剩余项均为方向明确延期或按需项，已在 §6 如实列出。**自验通过，提交 Planner 验收；功能验收前不改终态值。**
