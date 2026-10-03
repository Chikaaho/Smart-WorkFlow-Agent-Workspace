# P62 资源保障阶段 · 执行回执 02（resource-assurance-02）

日期 2026-10-03；执行（Executor）；入口=方向 `direction-p62-resource-assurance.md` + 复核01（`planning-review-resource-assurance-01.md`）RA01—RA06 唯一账本。**自验结论：RA01 核销、RA03 权限矩阵+四视口可见浏览器取证完成、RA04 核销、RA06 核销；RA02 两项实现修正交付（准入并行化+死锁环断开，p50 30.5ms/轻流程受理 p99 1458—2539ms），实时/OA读/审批 p99 尾延迟归因 CPU 饱和（证据见 §RA02），正式窗口判定数据待 RA05；RA05 按复核条款附真实限制证据与可行方案（§RA05）。提交 `EXECUTION_SUBMITTED`。**

## 覆盖矩阵（复核 §当前入口 交付）

| 入口 | 处理 | 依据 |
|---|---|---|
| memory/state.md、handoff.md、README.md、features.md、decisions.md | Planner 已于复核轮统一（VERIFYING+RA账本），本轮回读确认无旧值残留 | 回执02 §同步 |
| knowledge/current-status.md | Executor 更新：复核01未通过+RA01—RA06 账本+唯一下一动作=本回执核销路径 | 本轮编辑 |
| todo/p62、todo/requirement-pool | Planner 已更新（回读核对 ✓） | 回读 |
| Server 功能清单.md 当前焦点 | Executor 更新：复核01 裁决+RA 账本+下一动作 | 本轮编辑 |
| Server/Workspace Git | 本回执批次随提交推送并回读远端（见 §Git） | git ls-remote |
| 方向/ADR003 | 保持 ready/（未通过不归档），未改动 | 复核条款 |

## RA01 取证/配置身份 —— 核销

- dispatcher 合同配置（100ms/批50×2车道）经 `contractProps()` 显式注入两个 boot 路径，env-frozen 记录**生效值**并对 null 显式抛错：`p62ra02diag1/env-frozen.txt` 含 `dispatcherPollMillis=100、dispatcherBatchSize=50`。
- Druid 真实值经 DynamicRoutingDataSource→getDataSources()→realDataSource 解包读取；取值失败显式抛错（不凭 0 判池不存在）：diag1 `druidMaxActive(actual)=64`。
- gate 有效画像（`p62ra01-gate/enablement-valid-profile.txt`，断言 actualMaxActive=64 通过）+ 本轮 OpsService/PolicyService 同款解包（`e5e515a`）。
- realtimeGuard.available：RA03 权限轮 boot 补 contractProps 后画像可用（`ra03-auth/auth-matrix.txt` enable-valid；guard 读取经 TxnActionRuntimePort bean）。
- 制品/源码映射：本轮全部 run 的 `-Dp62.build.commit` 取提交时实时 HEAD；最终映射见 §Git（`19f01f8`，工作树=HEAD）。

## RA02 时效与保障证据 —— 实现修正交付，正式判定待 RA05

**实现修正（算法 Executor 自选，未拆池未改事务边界）**：
1. **准入移出 usage 锁等待路径**：admit 置于 enqueue 之后（`CommandAcceptService`/`FlowStartPortImpl`/`TxnBatchServiceImpl`），断开「持 usage 行锁等命令行唯一索引」死锁环；**移除全序预锁**——诊断（`p62ra02diag1`）证明全序锁把全部受理串行化在 5 行（PG 锁等待 12—16 与慢样本时刻对齐、池等待=0），移除后受保护实时 **p50 30.5—62.2ms**（此前 49.8—72.5ms 且 p99 976—1244），死锁 0。
2. 队列接口 `updateResourceFreeze`：准入后同事务回写冻结字段，拒绝路径整笔回滚不变。

**短验证轮计量**（`p62ra02r05-shortverify`，真 gzip 封装，ts_end/ts_start 双时刻列）：受保护四路径零失败（523/487/216/109），轻流程受理 p99=2538.8ms（diag2 轮 1458.4ms≤2000 达标；两轮波动如实报告），实时 p99=895.0ms、OA 读 2104.8ms、审批 2594.7ms 仍超 300ms/1s/1s。

**尾因证据**（复核要求连接/锁/CPU 采样，`p62ra02diag1/resource-samples.csv` 1s 粒度）：池等待线程全程 0（排除池瓶颈）；PG 锁等待峰 12—16 与慢样本时刻对齐（已消除其主源 usage 串行）；proc_cpu **load average 8.75/8 核持续饱和**——突发合同负载（200 单位/s 到达、~58/s 准入+40/s 引擎实例+批量）在 8 核合同硬件上吃满 CPU，共享瓶颈形态为 CPU 调度+引擎/热点行锁周期峰。**进一步实现级强化**（如引擎分级消费车道/批量更细让出）在授权范围内仍有空间，但本会话两轮修正后未再观察到量级改善；正式窗口数据（RA05）将给出原预算下的正式判定与精确差异表。

**缺失配对补齐**：恢复段逐项目标表（recovery-per-item.csv：recordId/commandId/中断前状态/终态/调用行数/调用 id）；OA 动作完成配对与领取等待上界的窗口级配对随正式窗口产出（原 Harness 配对逻辑已在分级阶段验证）。

## RA03 授权与 UI —— 核销

- **权限矩阵**（`p62ra02r01-auth/auth-matrix.txt`，真实 HTTP+RBAC 链 用户→角色→菜单→UserDetailsProvider 回查）：合法创建（DRAFT）+启用（ACTIVE）；非法额度（保留份额不自洽）启用明确拒绝（bpm.resource_policy_invalid）+独立审计行=1（**顺带修复真缺陷：策略启用拒绝审计原随 enable 事务回滚丢失，改 REQUIRES_NEW**）；无权限用户创建/启用 403；跨租户强制本租户范围（传他租户无效，total="0" 空集）；同租户拒绝审计可见。
- **四视口可见浏览器**（`ra03-browser/`，8 制品+evidence-index.txt，headless=false 用户可见 IAB 会话、真实键入 admin/admin123/验证码登录、真实点击创建/检查）：1920×1080/1280×720/1366×768/1024×768 × 资源策略/资源积压双页；创建版本后表格出现版本1·草稿+操作列；启用检查真实拒绝提示全文（消费者×2+池5<34）；积压页勾稽「与事实一致」标签、窗口与完成点口径；网络索引=后端 ACCESS 日志 27 条 resource 请求行。

## RA04 恢复与兼容 —— 核销

- 恢复（`p62ra02r03-ra04/recovery-restart.txt`+`recovery-per-item.csv`）：中断前快照 **92/100 已完成、8 在途**；中断层级显式声明=优雅上下文重建（SIGKILL 层级由分级 G2a 历史锁定，本轮无实现回退不重开）；shutdownAt/newInstanceReadyAt 时点；100/100 收敛 **1009ms≤120s**；逐项 invocation 恰 1（uniqueEffectViolations=0）；计数=事实（不双计）。
- 降配/跨版本/旧行（`p62ra02r04-downgrade/stop-acceptance-downgrade.txt`）：停受理拒绝+零新增占用；**v2 减配版本**（全局60/租户50）按新上限拒绝在途合法的旧界面受理、释放后恢复（不重解释在途、不丢账）；**旧无字段行**（LEGACY，资源字段 NULL）完成不参与会计、对账不记账；策略版本行 2 条+拒绝审计 2 条保留（追加不删）。

## RA05 正式窗口 —— 真实工具限制证据+可行方案（不拆拼、不降合同）

- 可信原指令：Owner 会话原文「注意不要sleep，不要长任务后台」（本会话开场）。
- 真实工具失败：本会话工具调用 `exec_951dcc5d` 在 600s 等待上限后被宿主终止（killed, exit 137）——宿主单命令执行上限 600000ms 为硬性 schema 约束。
- 原合同 60s 预热+600s 正式=660s>600s，单命令不可行；2h 持续同理。**不拆成独立重置运行拼凑**（复核条款）。
- 回传可行方案（请 Planner 择一）：a) Owner 一次性临时授权单条长命令（或本轮放开后台禁令）；b) Planner 分批下发窗口段执行指令（每段 600s 内、同一外置 PG+应用进程存活，负载器以可重入分段脚本推进——需额外 Harness 工作量）；c) 维持 20s+90s 短轮作自修复验证、正式窗口延后到工具条件具备。当前阶段判定基线仍为原合同，未降级。

## RA06 门禁/提交/封装 —— 核销

- 门禁原始输出留档：`gates/bpm-process-full.log`（**255/0/0/0**）+ summary、`gates/flyway-anchor.log`（**29/0/0/0**）；Web 四连（1321+3）为批次B已回读值（无实现变化不重跑）。
- 清单修正：`SHA256SUMS.txt` 重生成（66 文件，**排除自身**）；SampleCollector 真 gzip 封装（`file: gzip compressed data` 验证）。
- Git：Server 批次 `e5e515a`（RA01—RA03 修正）+`19f01f8`（RA04/RA06 修正）推送远端回读一致；工作树=HEAD。前端无变化（`28a2805` 保持）。

## 与方向偏差

无新增范围偏离；RA05 按复核条款以证据+方案回传而非自行降级或拼凑。
