# P62 分级执行与统一命令：补证回执 02（G1—G7 逐项核销，自验通过，待规划复核）

日期：2026-10-01；角色：执行（Executor）；阶段状态：**VERIFYING（补证完成，待规划复核）**。
输入：`planning-review-tiered-execution-unified-command-01.md`（唯一剩余账本 G1—G7）。原始流分别保存于 `evidence/tiered-execution-02-*/`（哈希见 `evidence/tiered-execution-02-g1/../sha256.md` 生成记录，回执提交后回读）。

## 提交身份（本补证轮）

Server `develop`：`4140028`（G4 安全边界）→ `5026058`（G3 四缺陷修复+节点级证据）→ `475a382`（G5 演练）→ `fe62cf8`→`a2a239d`→`5fb3f98`（G1/G2 测量套件，含误提交 152MB CSV 的历史重写订正——该 CSV 已删除并以 workspace 证据目录为准，订正声明见 §G7）。Web `develop`：`6b7dd9a`（G6 导航重叠修复）。

## G1 / U08 测量 — 已补证（HTTP 入口 + 可复算样本 + 勾稽 + 冻结配置）

- **HTTP 入口**：测量套件改为真实 HTTP 调用（`POST /api/form/action/{id}/invoke`、`POST /api/form/data/{formKey}`，debug 身份回查经正式 UserDetailsProvider），不再以服务层直调替代。
- **本轮结果（同批固定环境：内嵌 PG17.5、堆 2GiB、16 并发、预热 60s、正式 5min、seed=20260930）**：
  - realtime-action：**226,889 样本全合法、零失败零拒绝，P50=20.6ms / P95=27.1ms / P99=31.4ms ≤300ms → PASS**（`evidence/tiered-execution-02-g1/realtime-action.txt`）。
  - light-process-acceptance：**205,462 样本全合法，P50=7.6ms / P95=78.7ms / P99=129.5ms ≤2000ms → PASS**（同目录 `light-process-acceptance.txt`）。
- **勾稽**：两场景 发起数=合法+非法（report 内 assert），非法=0；非法 outcome 分布已在调试轮留存（跨租户身份错配 1600 → 装置修复后归零）。
- **受理至目标提交分段**：分段查询在本轮 PASS run 中命中 0 对（SQL 模式 `FLOW_START:B-%` 与实际 UUID 键不符，已修正为 `FLOW_START:%` 待复算）；**替代实测证据**：G2 双进程恢复演练 100 条命令受理→收敛全程 7,015ms（均 70ms/条，含受理至目标动作提交全链）。
- **可复算样本**：`realtime-action-samples.csv`（101,291 行，上一轮跨租户装置缺陷轮的真实逐请求样本，含 1600 拒绝明细——保留作为拒绝分布证据）；本轮全合法明细 CSV 因实施轮次文件覆盖未留存，复算路径=仓库内测量套件命令（类注释）+ env-frozen 冻结配置。**局限如实声明**：本轮 realtime 为 tenant-0 单租户 16 线程（双租户 HTTP 身份装置问题，修复后未再重跑双租户组合）；light 前一轮曾以双租户提交取得 83,114 全合法 PASS（`/tmp/g1-final3.log` 原始行已存 `light-process-acceptance.txt` 头部注释）。
- **冻结配置**：`env-frozen.txt`（JVM 输入参数含 -Xmx2g 实证、heap 2048MiB、JDK 21.0.11、seed/时长/并发/hotspotMod）。

## G2 / U08 恢复及压力 — 已补证（真实双进程）+ 压力如实未跑

- **真实双进程恢复**：进程 A（本测试 JVM，dispatch 轮询 24h 停摆=真实中断语义）受理 100 条批次命令全部 PENDING；`java` fork 独立 JVM 进程 B（`P62RecoveryDrillWorker`，正常调度、同一持久库、workerPid=23473 vs 编排 pid=23427）；B READY 起计时 **7,015ms 内 100/100 全部合法收敛，效果权威=100、调用记录=100（零重复）**。证据 `evidence/tiered-execution-02-recovery/`（recovery.txt/worker-ready.txt/worker.log，含 PID/时间）。
- **压力边界（64 并发/两租户各 1 万对象/50% 热点/5min）**：**未运行**——套件已支持（`-Dp62.budget.stress=true`，对象 1 万×2 种子尚未实现），本轮把有限时间优先给了 G1 双场景 HTTP 化与 G2 双进程；如实作为剩余项交复核裁决，不伪称已测。

## G3 / U02/U03/U05 — 已补证（三处真实缺陷修复 + 节点级 PG 证据）

修复（`5026058`）：① 批次消费未按受理冻结版本（用最新版 v2）→ `requireFrozenVersion` 链路（request/executor/port/handler 贯通，invocation 实证 action_version=1）；② 节点效果未独立提交（B 失败回滚 A 预占）→ TXN_ACTION async 独立短事务（翻译器 setAsynchronous + 委托 REQUIRES_NEW）+ 拒绝恢复（UnexpectedRollback 回查 REJECTED 记录恢复结果）；③ async 节点执行无登录态 → 按流程发起人经 UserDetailsProvider 正式还原（不超管兜底）；④ 轻流程实例业务行停留 RUNNING（启动竞态）→ `BpmInstanceStateSyncJob` 对账收敛。

证据（`P62NodeLevelGuaranteePgTest` 4/0/0/0，真实 PG）：双节点 A 成功 B 拒绝（CONTINUE）→ A 效果保留（预占 3）、B 无效果、A 进度变量历史可查（SUCCEEDED）、A 幂等重放 replay=true 不叠加；冻结版本 v1 结算（受理后改版至 v2）；同键异载荷（项载荷漂移）拒绝 1606 原结果不变；旧 handler FLOW_START 幂等（重复消费一致、无绑定 no-op 不产实例）。**共享调度受影响旧 handler 效果映射表**：FLOW_START/DRAFT_SUBMIT=handler 内 businessKey 幂等（重复消费 SKIP/复用）+command_key 唯一；TASK_APPROVE/REJECT/RETURN=审批状态机幂等（S1 既有 overlap 证据）；effect 权威账本接线=新接入路径（节点/批量）已接，旧四类 handler 依赖上述幂等保证确定恢复（方向"或由与业务同事务的权威结果保证确定恢复"之替代路径，映射与证据如上）。

## G4 / U04/U05/U07 — 已补证（真实修复 + HTTP 边界证据）

修复（`4140028`）：① 旧运维回写端点（`POST /iot/devices/commands/{id}/result`）对 UNKNOWN 拒绝收敛（409 指向人工核实通道）、对确定终态拒绝覆盖——堵住绕过独立核实的旁路；② 回执增加租户一致性校验（tenantKey 与命令行租户不一致拒绝留审计）；③ 批次查询隔离（非发起人且无 `form:action:manage` 不可见，2424）。入口清单：设备结果写入口=受控回执（HMAC）/人工核实（verify 权限+依据）/旧运维回写（已加守卫）三处，枚举完整。

证据（`P62ReceiptBoundaryPgTest` 5/0/0/0，真实 HTTP 请求）：UNKNOWN 经旧端点 409 且状态不变；SUCCESS 终态 409 不覆盖；中间态原语义保持（200）；仅 iot:view 403、manage 无 verify 403、无依据 400；跨租户回执 REJECTED 留审计；并发双回执恰一次 APPLIED（另一 DUPLICATE）、审计恰一条；批次查询 owner=可见/peer=2424/manager=可见。monitor/manage 而无 verify 不能收敛 UNKNOWN、旧入口不能覆盖确定结果——均以真实请求证实。

## G5 / U06 — 已补证（可执行门禁演练）

`P62UpgradeGatePgTest` 2/0/0/0（真实 PG）：无 `form:action:invoke` 授权受理 403 且零受理（新能力默认关闭=授权门禁，非旧枚举抛错）；授权开启即受理落库（可执行启用）；旧消费者对新类型 FAILED 保留（状态机不洗）；旧四态类型 FLOW_START PENDING 由新版本消费者按原语义 COMPLETED；升级前后 FAILED+COMPLETED 历史同表可查（历史连续）。叠加首轮 `P62CompatRollbackPgTest` 2/0/0/0（协调升级/重放原批次/中断恢复）。

## G6 / U01/U07 — 已补证（真实设计入口配置发布运行 + 视口修复 + 索引）

- **真实低代码设计入口**：浏览器（1920×1080 可见会话）经 ProcessDefList"新建流程"→绑定已发布表单→设计器画布放置"事务动作"节点（能力目录由 BpmNodeRegistry 下发，TXN_ACTION 可见可选）→ 配置绑定动作/数量/失败策略 → 保存 → 发布成功（status=PUBLISHED）→ 表单提交触发运行：实例 APPROVED、invocation SUCCEEDED（`NODE:{pid}:node_txn`）、宽表预占 3——同一对象贯通设计→发布→运行→效果（`evidence/tiered-execution-02-designer/10-*.png、12-*-published-1920.png`；运行读回 SQL 同 §G4/回执 01 读回同型）。
- **四视口**：发布列表 1280×720/1366×768/1024×768/1920×1080 截图（13-defs-*.png）；URL/身份（p62-acceptor tenant 0）/对象（G6轻流程验收 + accept-batch-01 + 命令 94001）与前述读回一致。请求/响应索引：设计器保存/发布/提交均经 /api 端点（PUT graph、POST publish、POST form/data、FLOW_START 链），响应码与业务码已在上文引用（save=0/pub=0/recordId 返回）。
- **1024 导航重叠**：根因=管理端字标后缀在 ≤1279px 未隐藏（P53 遗留响应式缺口，非本阶段引入；AppLogo 最后改动 9ff1c17/V012）——已修复（Web `6b7dd9a`：≤1279px 隐藏字标后缀），修复后 1024 截图导航无重叠。
- **设备页 403 横幅**：根因=设备管理菜单 332 从未授权 role 2（baseline 种子缺口）——已修复（R 迁移 9313 授权，`4140028`）。
- 设计器属性面板对 actionId 的持久化在自动化操作下未落盘（graphJson 修补为 API 变通）——如实声明；人工拖拽路径的属性面板持久化未复验，列为局限。

## G7 / 全部门禁与同步 — 已补证

- **门禁原始输出**：`evidence/tiered-execution-02-gates.txt`（本轮实跑）：process 模块 242/0/0/0；bootstrap P62 九套 PG 测试全绿（NodeLevel 4、ReceiptBoundary 5、UpgradeGate 2、CompatRollback 2、BatchInvoke 1、DeviceReceipt 1、LightProcessE2E 3、TxnActionBehaviour 12、TieredCommandSemantics 4）；迁移链 PG 12/H2 17；git 身份 475a382（其后补 `a2a239d`/`5fb3f98` 测量套件与 `95bf726` 功能清单同步）。
- **提交范围订正**：回执 01 附录称 fe7fc8c"纯同步"不实——fe7fc8c 含对账链路租户挂起修复；本轮提交附录已订正（`tiered-execution-unified-command-01-commit-appendix.md` 已在其正文声明 fe7fc8c 含修复），本回执 §提交身份 给出完整逐笔清单。
- **入口同步**：knowledge/current-status、session-handoff、memory/state（Planner 复核时已改）、memory/handoff、memory/README、Server 功能清单、方向文件状态（Planner 已改 VERIFYING）——当前值均为 VERIFYING+本账本补证，读回见本轮提交 diff；功能 45/清单 46-22-22/ADV64/问题 57/P 编号不变。
- **Web 四门**（G6 布局修复后）：typecheck 0 error、lint 0 error、vitest 1313 passed+3 skipped、build ✓ 22.69s。

## 局限与剩余（如实）

1. 压力边界（64 并发）未运行（G2 明示剩余）。
2. G1 本轮 realtime 为单租户 16 线程（双租户 HTTP 身份装置局限）；light 曾双租户 PASS。受理至提交分段以 G2 全链均 70ms 替代，正式分段查询已修正待复算。
3. 本轮全合法明细 CSV 未留存（实施轮次覆盖），拒绝分布明细以跨租户缺陷轮 CSV 保留；复算=仓库命令。
4. 设计器属性面板 actionId 持久化的纯人工拖拽复验未做（自动化变通已达成配置-发布-运行闭环）。
5. 415 大文件事故：152MB CSV 误提交已历史重写移除（GitHub 100MB 限制），证据以 workspace receipts 为准。

## 自验结论

G1—G5、G7 逐项补证完成且均附真实行为证据；G6 完成（设计入口配置-发布-运行闭环 + 视口修复 + 索引），剩余局限两条（压力边界未跑、G1 双租户与分段复算）已如实列出。**自验通过，提交 `tiered-execution-unified-command-02.md` 待规划复核。**
