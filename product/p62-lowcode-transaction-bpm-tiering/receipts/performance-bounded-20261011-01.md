# P62 新机有限性能验证·首轮回执 01

2026-10-11，执行。方向=`../ready/direction-p62-performance-bounded-20261011.md`（唯一下一动作=完成装置处置及三画像有限验证，提交首轮回执）。**口径=有界验证（到达窗 30s+收敛上限 120s，shortVerify），非正式 60+600s 判定**；策略保持默认 OFF，未启用、未发布、未晋级。

## 1. 运行身份

| 项 | 值 |
|---|---|
| 分支/基点 | `feature/p62-perf-bounded-20261011`（=develop-sw `c0cbe60` + 本轮 6 提交 `1105361→351c93e`，见 §6） |
| 被测二进制 | 权威轮 `-am` 反应堆构建（worktree=仅 logs/ 未跟踪）；指纹 `sha256-16:f15bb3a6929bb435`（全部 target/classes+test-classes） |
| 机器/环境 | i5-12400 6C12T / 16GB / Win11 26200 / JDK21 / `MAVEN_OPTS=-Xmx2g`；zonky 隔离 PG17.5（每画像独立实例+独立端口）；**Redis 未使用**（仅 Spring Data 扫描 0 接口，无连接）；MQTT 无；Owner 既有服务/旧库零触碰 |
| 窗口 | 每画像 `-Dp62.resource.warmup=10 -Dp62.resource.formal=30`；串行执行、不并行、每画像一次权威正式采集 |

## 2. 装置处置（NP01+平台适配）

| 项 | 处置 | 验证 |
|---|---|---|
| maxItemWaitMs 缺陷（RA08§3.1） | SQL 前向修复：`MAX(inv.update_time - c.create_time)`（invocation 行结算时刻有终态写者；item 表 update_time 无写者≡插入时刻），列名改 `maxItemAcceptToSettleMs`；未结算项不进 MAX | pairing.csv 三画像逐批回读，权威轮值见 §4 |
| invocation_key 索引 | 新增 `V0.1.10__p62_invocation_key_lookup_index`（PG+H2 双源；V0.1.1 复合唯一索引不覆盖裸键查找）；六锚点测试链尾滚动 17→18/0.1.10 | FlywayFullChain H2+PG：18 条、终点 0.1.10，`EXIT=0` |
| convergence/occupancy 口径 | occupancy 全清单移除 `resource_released_at` 谓词（列无生产写者、入队恒置 NULL），[6] 明示事实口径=status+resource_units；EXPIRED 分类改按 units 记账 | occupancy-responsibility.txt 权威轮复读一致 |
| openapi 回调监听器 | onEvent 包 `TenantLineSuspension.suspended()`（RA06b 454 次/窗异常根因）+ 投递日志显式 `tenant_id=event.tenantId` | 权威轮 `租户上下文缺失`=**0**（首轮 200/400 次，见 §6） |
| Windows cmd 适配（新机） | `log_line_prefix` 管道符→短横线（pg_ctl 经 cmd /c 拉起 postgres，`|` 为元字符致「命令语法不正确」启动失败，旧机 macOS 无此约束） | P1 第 3 次尝试起启动成功 |
| RA01b 身份参数 | 启动命令显式传 `p62.worktree.status`+`p62.artifact.fingerprint`（env-frozen 回读） | 三画像 env-frozen 均含三件套 |

## 3. 三画像权威轮结果（-am，正式采集各一次）

预算判定=发起入组 nearest-rank P99（与装置报告同法独立复算一致，§5）。受保护租户全部 `意外失败/业务拒绝=0`。

| 画像 | runId | 实时→提交 | 轻流程→受理 | OA 读 | 审批受理 | 小批受理 | 突发租户行为 | 配额峰值 g/t0/t100 | 自动收敛 |
|---|---|---|---|---|---|---|---|---|---|
| P1 固定保障+突发 | `...p1-fixed-burst-am` | **85.9ms**(≤300) | **253.9ms**(≤2s) | **219.6ms**(≤1s) | **84.7ms**(≤1s) | 164.5ms | 2843 尝试：1912 受理 + **889×BIZ2427**(额度满)+42×2428(速率)=拒绝 32.7%；拒绝 P99 141ms(≤1s)；500 项整批 6/6 拒(2428) P99 566.9ms | 999/180/**800** | 16.0s(≤120s) |
| P2 突发互换 | `...p2-fixed-burst-swap-am` | **62.8ms** | **94.8ms** | **175.6ms** | **79.3ms** | 86.5ms | 2771 尝试：2679 受理 + 92×2427=3.3%；500 项整批 6/6 拒 P99 500.5ms | 1004/**800**/204 | 26.1s |
| P3 双租户保障（新画像） | `...p3-both-protected-am` | 71.3/55.4ms | 68.0/72.6ms | 194.5/173.7ms | 72.6/62.3ms | 92.4/83.3ms | 无突发（两租户同受保护谱 5/5/2/1+小批5项/s） | 178/89/89 | 4.0s |

- 三画像 `counter=fact=0`、`openAfter=0`、死信=0、无 DB 超时/OOM/崩溃；占用对账收敛后残余=合法未完责任口径（P1-am 唯一 `expired_charged_unreleased=1`=突发租户 500 项批命令在额度耗尽下超 30s 截止 EXPIRED，逐对象 id/key/deadline 已列示，属过期合法语义）。
- 每画像任务总时长：139s/152s/133s（≤8min）；资源采样：poolActiveMax 13/64，cpuMax 67.4%（单核百分比折算整机），freeMemMin 1187MiB。

## 4. NP01—NP06 映射

| NP | 判定 | 原值 |
|---|---|---|
| NP01 测量可信度 | **完成**（§2 六项处置；权威轮二进制含全部修复） | 独立复算=装置报告逐值一致 |
| NP02 受保护预算 | **全过**（P1/P2/P3 实时≤300ms、轻≤2s、读≤1s、审批≤1s，零意外失败） | §3 加粗列 |
| NP03 领取等待 | 批量项领取≤30s **全过**（3348/22868/572ms；窗口批次 36/36/60 笔，零样本≠通过成立）；**OA 审批领取≤5s：P1-am 1603ms✓、P3-am 1060ms✓、P2-am 5039ms 超 39ms（0.8%）如实披露为未达** | pairing-summary.txt |
| NP04 拒绝与配额 | 拒绝响应 P99≤1s 全过；**拒绝率全披露**（P1 32.7%/P2 3.3%/P3 无突发，误差键 2427/2428 分列）；配额无突破（租户恰触 800 上限未越）无丢失无重复；500 项整批明确拒绝不部分受理 | §3 + -samples-outcomes.txt |
| NP05 收敛与资源 | 16.0/26.1/4.0s≤120s 自动收敛（含时间线）；DB 超时/OOM/崩溃=0；资源序列+机器余量列落盘 | *-report.txt + resource-samples.csv |
| NP06 证据可复算 | 原始 csv.gz 双时戳落盘；本回执§3 由执行侧脚本独立复算（nearest-rank、发起入组）与装置报告一致；到达账本 paced-arrivals.txt 按角色计划vs实际vs停止后补发（P3-r2 曾披露 deferredAfterStop=1） | evidence 目录 + §5 |

## 5. 独立复算口径

Python 脚本直读 `*-samples.csv.gz`（不经过装置代码）：按 `ts_start∈[formalBegin,formalEnd)` 发起入组、合法结果=`SUCCEEDED/ACCEPTED/OK`、nearest-rank 第 ceil(q·n) 位。三画像九~十采集器全部与报告一致（例：P1-am protected-realtime n=149 p99=85.9ms；P3-am second-realtime n=149 p99=55.4ms）。

## 6. 尝试台账（全披露，不删原值）

| 轮 | runId | 结果 | 处置 |
|---|---|---|---|
| P1 尝试0/1 | 同名目录 failed-boot-attempt0/1 | zonky 10s 启动超时（cmd 管道符根因） | 修复 log_line_prefix → §2 |
| P1 尝试2 | 同名目录 | PG 启动成功但缺 RA01b 参数 | 补传身份三件套 |
| **P1 权威** | `p1-fixed-burst-am` | PASSED 139s | `-am` 反应堆构建 |
| P2 权威 | `p2-fixed-burst-swap-am` | PASSED 152s | 同上 |
| P3 尝试1 | `p3-both-protected`（attempt1-defective-resource-series/ 存档） | 预算全过但资源采样 40/40 sample-error（burstLoad 判空缺失） | 修复 351c93e；以 r2 完整重跑一次（`...-r2`，PASSED 117s，deferredAfterStop=1 披露） |
| **P3 权威** | `p3-both-protected-am` | PASSED 133s | `-am` |
| **首轮（非权威）** | `p1/p2-fixed-*`、`p3-both-protected` 三目录全档 | PASSED 但**被测二进制取自 ~/.m2 旧快照**（`-pl` 无 `-am`），openapi 修复未生效（租户异常 200/400 次） | 全档保留；装置教训=`-pl sw-bootstrap` 跑画像必须 `-am` |

原始证据（本地不入 Git，`product/**/evidence/`）：`receipts/evidence/performance-bounded-20261011/<runId>/`。

## 7. 诚实边界与未决

1. **P2-am 受保护审批领取 5039ms 超 5s 预算 39ms**：突发互换画像下受保护租户审批命令领取的窗口最大值；装置仅报告未断言该上界，本回执如实判未达；是否需收紧装置断言或归因（受保护租户与突发租户共享 SHARED 池时的领取排队）交 Planner 裁决。
2. **突发拒绝不对称（P1 32.7% vs P2 3.3%）**：同速率突发（实时60/s+轻40/s）在不同租户身份下 2427 额度满拒绝量级差 10 倍，两向均未突破租户上限且受保护租户零损伤；机理归因（种子分布/共享池结算次序）未在本轮展开。
3. shortVerify 口径：30s 到达窗样本量（受保护路径 n=30/路径）仅供方向性判定；正式 60+600s 窗口命令仍待 Planner 固定。
4. 停止后补发（deferredAfterStop）与窗口边界样本：P3-r2 出现 1 次实时派发越过 formalEnd，已由到达账本单列，不进入窗口入组。

## 8. Git 与同步

- Server 隔离任务分支 `feature/p62-perf-bounded-20261011`：`1105361`（V0.1.10+六锚点）→`08ed4c4`（openapi 监听器）→`120bdbc`（装置修复+三画像适配）→`b13b952`（Windows cmd 适配）→`351c93e`（burstLoad 判空）；工作区回执与 knowledge-first 同步另行批次提交推送。
- 功能台账：P62 已批准功能=COMPLETED（保持）；本回执=执行提交，待 Planner 审查；策略默认 OFF 未变；P64 阶段Ⅲ未动。
