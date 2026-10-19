# BF20261019-04 定位与修复回执：worker 预热预算（UAT 0.1.9 复验发现）

- 日期：2026-10-19
- 承接：`receipts/release-019-01.md`（0.1.9 发布与 UAT 部署）、`receipts/bf20261019-script-worker-01.md`（BF20261019-01/02/03 本地闭环）
- 修复提交：Server 分支 `fix/bpm-script-warmup-budget` `9aaf726` → develop 合并 `8f6020e`（已推送，远端 SHA 回读一致）
- 状态：**修复已实现并单测全绿；发布未执行**（版本号需 Owner 确认：新版本 vs 0.1.9 同版本覆盖）

## 1. UAT 复验事实（0.1.9 制品 + 流程 v5）

以 0.1.9 制品复验 BF20261019-01/02/03 的业务链（表单选部门 → 脚本算分管领导 → EXPRESSION 参与人）：

1. **BF20261019-01 在 UAT 已修复**：worker 自动经 `PropertiesLauncher` 在 fat jar 内拉起（`launch: source=fat-jar`），旧绕行（解包 211 MB＋`SW_BPM_SCRIPT_WORKER_CLASSPATH`）已从 UAT 移除。
2. **BF20261019-04 暴露**：提交实例 `20261019-013`（`2112204643734511618`，发起人 李强 91103，参与部门 `["91002","91005"]`）后，触发器执行记录 **FAILED**：

```
触发器评估异常: 判断 worker 进程启动失败: worker 启动握手失败:
{"id":"__ready__","ready":false,
 "errorMessage":"worker 预热失败（TIMEOUT）: 脚本执行超时被强制中断: Context execution was cancelled.",
 "maxHeapBytes":518979584}
durationMs=26848
snapshot: {"variables":{"var_drill_depts":["91002","91005"]}}
```

即：**表单部门已正确进入变量快照**（业务链路的数据面正常），失败点在 worker 拉起阶段。

## 2. 根因定位（UAT 主机实测，非推断）

UAT 主机：2 vCPU / 1.6 GB 内存（Java 常驻 RSS 574 MB、swap 已用 545 MB、可用约 325 MB）。

| 探针 | 结果 |
|---|---|
| 宿主日志时间线 | worker 启动 `23:30:06.368` → 预热超时告警 `23:30:29.077`（**预热求值在 5s 预算到期被强制中断**，Engine 初始化耗时约 18 s）→ 宿主在 26.8 s 判定启动失败 |
| 手工复跑 worker（继承 `_JAVA_OPTIONS=-Xmx512m`，`maxHeapBytes=518979584`） | 握手 `ready=false`（预热超时）；**同进程紧随其后的真实求值 `return 1;` 成功、耗时 837 ms**；进程总耗时 21.65 s、CPU 72% |
| 手工复跑 worker（`env -u _JAVA_OPTIONS`，`maxHeapBytes=129761280`） | 同上：握手 `ready=false`，后续求值成功 984 ms；总耗时 21.10 s |

结论：**与堆上限/`_JAVA_OPTIONS` 覆盖无关**（真实 128 m 堆下同样失败）；根因是 `BpmScriptRunner.warmUp()` 复用了单次判断预算 `DEFAULT_TIMEOUT_MS = 5000 ms`（硬编码）。预热本身就是要支付 GraalJS 首次语言初始化，在慢宿主上该初始化超过 5 s，于是**每次拉起都必然失败**——预热机制在慢宿主上自我否定。预热被中断后语言已完成初始化，故紧随其后的求值只需约 1 s，反证「预热只需更大预算即可成功」。

## 3. 修复（`9aaf726`，Server 4 文件，+97/−4）

| 文件 | 修改 |
|---|---|
| `BpmScriptRunner.java` | 新增 `warmUp(long timeoutMs)`；`warmUp()` 委托缺省值。预热预算由调用方给定，不再复用单次判断预算 |
| `ScriptWorkerMain.java` | 读取 `sw.bpm.script.warmup-timeout-ms`（系统属性优先，其次 `SW_BPM_SCRIPT_WARMUP_TIMEOUT_MS`），缺省 `DEFAULT_WARMUP_TIMEOUT_MS = 30_000`；非法值回退缺省、过小值钳制 1 s；握手自报 `warmUpTimeoutMs` 便于现场核对 |
| `ScriptWorkerPool.java` | 新增 `@Value("${sw.bpm.script.warmup-timeout-ms:30000}")`；spawn 时向 worker 下发 `-Dsw.bpm.script.warmup-timeout-ms=…`；**握手等待取 `max(启动上限, 预热预算 + 20 s)`**，避免预热预算调大后被握手缺口提前截断 |
| `ScriptWorkerMainTest.java`（新增） | 预算解析：属性合法值生效、非法值回退缺省、过小值钳制 1 s、未配置用缺省 |

测试（本机，`mvn -pl sw-biz/sw-bpm/sw-bpm-engine -am -Dtest=… test`）：

- `ScriptWorkerMainTest` 2/0/0/0、`BpmScriptRunnerTest` 13/0/0/0、`WorkerLaunchPlanTest` 5/0/0/0、`ScriptWorkerPoolTest` 9/0/0/0（真实 worker 进程拉起，验证新增启动参数不破坏隔离池）。

UAT 侧配套配置（待发布后执行，不改代码）：`SW_BPM_SCRIPT_WORKER_STARTUP_TIMEOUT_MS=120000`（宿主握手等待）＋ `SW_BPM_SCRIPT_WARMUP_TIMEOUT_MS=100000`（worker 预热预算），以覆盖该主机「JVM 启动约 16 s ＋ 预热约 6 s」的冷启动成本；预热完成后常驻 worker 复用共享 `Engine`，单次判断仍在 1 s 内。

## 4. 未完成项

- **发布未执行**：版本号（新版本如 0.1.10 vs 0.1.9 同版本覆盖）需 Owner 确认后按 §3.0 第四—六步走完。
- **UAT 端到端复验未完成**：待含本修复的构建部署后重跑——提交（参与部门 `["91002","91005"]`）→ 触发器 MATCHED → node_1 李强/赵磊 → node_2 脚本解析的分管领导 张伟 91101＋陈静 91105 → 审批意见表单语义 → APPROVED → 抄送。
- **残留实例**：`20261019-013` 因触发器 HALT 停在失败态（与既有 `20261019-009` 同类，保留作事实记录）。
- 本机复验脚本（不入仓库）：`sw-scriptfix-e2e-20261019/uat-v5-config.mjs`（v5 配置/发布）、`uat-e2e-v5.mjs`（提交/审批/状态/待办）。
