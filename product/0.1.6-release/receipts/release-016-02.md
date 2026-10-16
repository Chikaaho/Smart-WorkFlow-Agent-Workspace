# 0.1.6 发布阻塞修复与续发执行回执（release-016-02）

2026-10-16｜Executor｜L｜发布任务补充执行（新增业务功能 0）

- 入口方向：`product/0.1.6-release/ready/direction-release-016-unblock.md`（Owner 已批准下发；主方向 `direction-release-016.md` 持续有效）
- 前态回执：`product/0.1.6-release/receipts/release-016-01.md`（①—③完成、④两仓阻塞、⑤同步已落；本回执**更正**其对后端失败主因的归因，见 §2）
- 证据目录（本机留存，gitignored）：`product/0.1.6-release/receipts/evidence/ci-fix/`
- 总阶段（本发布任务 5 阶段）：完成 **3**（①②③）／进行中 **2**（④发版：阻塞已修复、续发与发布执行中；⑤发布后终审同步）／未开始 **0**

## 1. 本轮做了什么（一句话）

按 Owner 已批准方案，两侧 CI 阻塞在各自会话职责内**真实修复**：后端以测试源承载受控 broker／对端／传输设施并接入测试生命周期（不跳过、不放宽断言、不关闭门禁），前端 32 项跨模块违规按现行工程约束允许的 `src/adapters/*` 接缝整改（不改 ESLint 配置、不放宽规则）；两项定向测试实跑通过后，本回执记录修复批次与续发（修复分支→develop→main→CI 发布→成对 tag→UAT 交付→发布后同步）。

## 2. U016-A 后端：CI 测试设施补齐

### 2.1 失败因果核实（含对前态归因的更正）

- 复现：`mvn -B -pl sw-bootstrap test -Dtest=P63ReservationUnknownPgTest` —— 命令未到 SENT 而直接 FAILED。
- 实测日志原文（证据 `evidence/ci-fix/targeted-2.log`）：
  `命令已标记为失败: ... error=发送通道未装配：无设备控制 provider（IoT 未启用或 provider-mode 非 tencent）`。
- 结论：`P63ReservationUnknownPgTest` 的**主因**是——其依赖的 loopback 传输 provider（`LoopbackPeerProvider` 及其 dev 装配类）位于 `sw-basic-iot/src/dev/java`，默认/发布构建（`mvn clean test`）只把该源根编译进本模块 test-classes，**不在 sw-bootstrap 测试类路径**，因此 provider 缺失、命令必然 FAILED；受控 broker（18830）与对端（9778）本就**不是仓内设施**，属并因。`release-016-01.md` 中"两项外部受控资产缺失既有失败"的表述据此更正（历史保留）。
- 环境事实：`P63ImmediateMqttBrokerPgTest` 失败于 `setUp:93 受控 broker 已就绪（任务启动）`，即 18830 无监听；`P63ReservationUnknownPgTest` 失败于 `awaitCommandStatus`（60s 内未到 SENT）。

### 2.2 设施与生命周期（测试源承载，随测试类自启动自清理）

| 设施 | 文件 | 职责与生命周期 |
|---|---|---|
| 受控 MQTT broker | `sw-bootstrap/src/test/java/com/sw/ck/bootstrap/p63/P63ControlledMqttBroker.java` | 仅监听 127.0.0.1:18830；最小 MQTT 3.1.1 子集（CONNECT/CONNACK、SUBSCRIBE/SUBACK、UNSUBSCRIBE/UNSUBACK、PUBLISH QoS0/1/2 确认流程、PINGREQ/RESP、DISCONNECT）；**协议就绪探测＝真实 CONNECT 往返取 CONNACK(0)**；每条 PUBLISH 追加接收记录 jsonl（`/tmp/p63ev/mqtt-received.jsonl`，键 `ts/topic/qos/retain/payload`）；`close()` 关监听与全部连接、有界等待接受线程退出 |
| 受控设备对端 | `.../p63/P63ControlledDevicePeer.java` | JDK HttpServer 仅监听 127.0.0.1:9778；`POST /device` → 200 受理＋接收记录 jsonl（含 mode/requestId/请求原文）、`GET /healthz` 仅就绪探测不记录；noreceipt 模式＝受理但不回发回执；`close()` 停服务＋有界等待执行器退出 |
| 受控对端传输 | `.../p63/P63LoopbackPeerTransport.java` | 实现 `DeviceControlProvider`，真实 HTTP POST 到受控对端，200 即受理成功；以 **bean 定义**注册进测试上下文（`registerBean`），使 dev 装配条件互斥、默认/CI 构建可用 |

- 接入方式：两测试 `@BeforeAll` 启动设施（**端口占用/探测失败即显式抛出**，测试不静默未执行），`@AfterAll` 有界清理；测试业务断言、计数与检查口径未改动（仅新增设施启动/清理与 provider 注册）。
- 依据：方向 §3"在 CI 任务生命周期内提供隔离 broker 及相应模式模拟对端……缺设施应明确失败，不让测试静默未执行……不能通过跳过两项、放宽断言或关闭发布门禁交付"。

### 2.3 定向验证（实跑）

```
MVN_EXIT=0
[INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0 -- P63ImmediateMqttBrokerPgTest
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0 -- P63ReservationUnknownPgTest
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```
- 关键证据行（原文见 `evidence/ci-fix/targeted-2.log`）：
  - `[P63-EV] mqtt.received topic=p63/p63-mqtt-device/cmd qos=1 bytes=11`
  - `g10a.immediate-received ... status=BROKER_ACK ... received={"ts":...,"topic":"p63/p63-mqtt-device/cmd","qos":1,"retain":false,"payload":"{\"level\":1}"} reservations=0 audits=1`
  - `g07b.unknown ... peer=0->1 sent-no-receipt->UNKNOWN no-resend=true verify=neg(permbasismissing)pos(SUCCESS+audit)-reterr`
  - 清理回读：`[P63-EV] mqtt terminated ... acceptAlive=false`、`[P63-EV] peer terminated ... mode=noreceipt`

### 2.4 模块级全量回归（default 构建）

```
MAVEN_OPTS="-Xmx2g" mvn -B -pl sw-bootstrap clean test   →  MVN_EXIT=1
[ERROR] Tests run: 304, Failures: 3, Errors: 0, Skipped: 27   （25:03 min）
```
- 与上轮基线对比（`evidence/sw-bootstrap-module-2.log`，301/4/0/27）：**304 = 301 + 3**，差额已逐类核对——`ApplicationCenterLegacyUpgradeTest` 6→7 与 `P62NonEmptyUpgradePgTest` 2→3（②阶段新增的 S2 接续方法，各自定向已绿）、`P63ImmediateMqttBrokerPgTest` 1→2（此前 setUp 中断只计 1，现两方法均实际执行）。
- 原两项门禁失败**已转绿**：`P63ImmediateMqttBrokerPgTest` 2/0/0/0、`P63ReservationUnknownPgTest` 1/0/0/0；`P63FlowAdmissionRecoveryPgTest` 本轮回绿 1/0/0/0。
- 剩余 3 项失败均为**负载/平台时序族**（非本次改动路径，失败对象与断言未改）：
  1. `P63ReservationBoundaryPgTest.softDeleteActualTargetFailsAtDue:312`、`concurrentCancelVsClaimHasExactlyOneWinner:487`（同轮 2 项）——该类用 2 秒级预约窗口（`Duration.ofSeconds(2)` + 3.5s 有界等待），重载下意图在断言前到期（PENDING→EXPIRED）。**单独复跑该类：11/0/0/0**（`evidence/ci-fix/isolated-rerun.log`）→ 负载时序抖动。
  2. `Phase4PgStartWindowCrashTest.scheduledFlowWindowCrashRecoversToExactlyOnce:149`——已登记既有失败 REG-P63-Phase4CrashTest（自连接 `pg_terminate_backend` 装置时序），单独复跑仍失败（本机平台装置差异）；等强度替代 `P63FlowAdmissionRecoveryPgTest` 本轮 1/0/0/0 通过；上一轮 CI 该测试为通过。
- 结论口径：本次改动未引入新失败；剩余 3 项按真实计数与分类记录，**不写"全绿"**；正式门禁以 CI 全量结果为准（见 §2.5）。

### 2.5 发布门禁（CI）

main 推送触发既有发布通道 `Build & Release (main)` run **38849696705**（headSha `e115857…`）→ **success**（`gh run watch --exit-status` 退出 0）。关键实测（日志见下）：

```
sw-bootstrap 模块：Tests run: 256, Failures: 0, Errors: 0, Skipped: 34      ← 上轮 255/2/0/34，两项失败已转绿
全仓（各模块汇总）：tests=2046, failures=0, errors=0, skipped=34
制品门禁：OK 不含 H2/MockCloudProvider/dev 资源…；OK 存在 production 迁移/正式 IoT provider…
          OK 生产身份标记 build.profile=prod；OK build.version 已解析: 0.1.6；
          OK build.version 与期望发布版本一致: 0.1.6
生产构建摘要：生效版本 0.1.6；输出 sw-bootstrap/target/bootstrap.jar；
             字节 217870418；sha256 d32b4752039f7faad581345b8e6b69691679df31bfe8d1aaeaf03540cfaf8145
```
- 说明：本仓历史"全仓 2072/3/0/27"为**本机**全量口径；本轮 CI（Linux/干净 runner）为 2046/0/0/34（跳过数含环境相关用例）。两项原门禁失败的实际解决结果见 §2.3；不再需要"外部资产缺失"豁免。
- 原始输出：`gh run view 38849696705 --log`（本机留存 `evidence/ci-fix/ci-server-watch.log` 为 watch 记录）。

## 3. U016-B 前端：跨模块依赖整改

### 3.1 现行规则下的实际清单（实测）

`NODE_OPTIONS="--max-old-space-size=2048" pnpm lint` → **32 errors（`import/no-restricted-paths`）/ 13 文件**（含本轮 `AppFormDetail.vue`；与旧 CI 数字一致，未以旧数字限定范围）：

| 方向 | 文件（行） | 违规导入 |
|---|---|---|
| form→system | `form/api/i2-choices.ts` | `system/api/dept`、`system/types/dept` |
| form→workflow | `form/designer/RelatedProcessesPanel.vue` | `workflow/api`、`workflow/utils/theme-rule`、`workflow/views/ThemeRuleDialog.vue` |
| form→workflow | `form/views/AppFormDetail.vue` | `workflow/api` |
| form→workflow | `form/views/FormDesigner.vue` | `workflow/api/oa` |
| form→workflow | `form/views/FormRender.vue`（3 处）、`FormRender.spec.ts` | `workflow/api` |
| job→workflow | `job/views/JobList.vue` | `workflow/api` |
| workflow→form | `workflow/views/ApprovalFormList.vue` | `form/api/form-def`、`form/api/i2-choices`、`form/utils/form-def-status` |
| workflow→form | `workflow/views/FormSelectDialog.vue`、`__tests__/FormSelectDialog.spec.ts` | `form/api/form-def`、`form/utils/form-def-status` |
| workflow→form | `workflow/views/MobileWorkspace.vue` | `form/api/form`、`form/utils/resolve-reference-display` |
| workflow→form | `workflow/views/ProcessDesigner.vue` | `form/api/form-def`、`form/api/form` |
| workflow→form | `workflow/views/TaskDetail.vue` | `form/utils/field-scripts`、`form/utils/resolve-reference-display`、`form/api/form`、`form/utils/user-dept-display` |

### 3.2 整改口径（最小影响；符合现行工程约束）

- 采用**现行工程约束允许的跨模块公开入口＝`src/adapters/*` 接缝**（工程宪法 §8 明列 `adapters/*` 为 `modules/*` 唯一允许的跨模块依赖层；先例 `adapters/iot-reservation.ts`），不新建 facade、不改 ESLint 配置、不放宽等级、不批量 disable、不删模块清单、不扩大 ignore。
- 新增 7 个接缝（均带契约注释，说明"模块公开入口"语义与懒加载理由）：

| 接缝 | 面 | 内容 |
|---|---|---|
| `src/adapters/process-catalog.ts` | form/job→workflow | `pageProcessDefs`、`createProcessDef`、`deleteProcessDef`、`themeRuleDisplay`（同步纯函数）、`themeRuleDialogLoader`（异步组件加载器） |
| `src/adapters/process-runtime.ts` | form→workflow | `getProcessDefDefinitionByKey`、`countProcessInstancesByBusinessKey`（收窄为计数语义） |
| `src/adapters/process-draft.ts` | form→workflow | `getDraft`、`createDraft`、`updateDraft`、`submitDraft`、`pollCommandStatus` |
| `src/adapters/form-catalog.ts` | workflow→form | `pageFormDefs`、`createFormDef`、`saveFormConfig`、`getFormDefinitionById`、`enable/disableFormDef`、`getFormDefStatusLabel/Type` |
| `src/adapters/form-runtime.ts` | workflow→form | `getFormData`、`getFormDefinition`、`resolveReferenceDisplay`、`buildUserDeptDisplays`、`createFieldScripts` |
| `src/adapters/oa-catalog.ts` | form→workflow | `findCategoryNameByFormKey`（跨模块 join 收敛在接缝内） |
| `src/adapters/org-dept.ts` | form→system | `listDeptTree` |

- 实现约定：**运行时值一律动态 `import()`**（保持懒加载、不建立静态跨模块依赖；与先例一致）；**同步纯函数与类型按具名契约转出**，不做整包 `export *`；跨模块组件（`ThemeRuleDialog`）经 `defineAsyncComponent(loader)` 接入，避免把该组件静态拖入无关消费方 chunk。
- 业务行为不变：仅导入路径与加载方式调整；`FormRender` 的实例等待循环、`FormDesigner` 面包屑、`TaskDetail/MobileWorkspace` 回显与脚本、`RelatedProcessesPanel` 关联流程工作台逻辑均保持。
- 测试同步（仅换 mock 目标、不弱化断言）：`FormRender.spec.ts` 改 mock `@/adapters/process-draft`、`@/adapters/process-runtime`；`FormSelectDialog.spec.ts` 改 mock `@/adapters/form-catalog`；其余既有 mock（`@/modules/workflow/api` 等）因接缝内部动态 import 同路径而继续生效。

### 3.3 边界有效性验证（"合法可用、非法仍被拦"）

```
# 探针A（模块内直引 modules/workflow/api）→ 应被检出
  1:33  error  Unexpected path "@/modules/workflow/api" imported in restricted zone …  import/no-restricted-paths
✖ 1 problem (1 error, 0 warnings)        PROBE_A_EXIT=1
# 探针B（模块内经 @/adapters 接缝导入）→ 应通过
                                          PROBE_B_EXIT=0
```
（`eslint --stdin --stdin-filename src/modules/form/__boundary_probe__.ts`，不落盘、不新增文件；原始输出 `evidence/ci-fix/boundary-probe.log`）

### 3.4 四检（提交后 HEAD 复核）

```
TYPECHECK_EXIT=0
LINT_EXIT=0        ✖ 3 problems (0 errors, 3 warnings)   ← 仅既有 vue/require-default-prop 警告
TEST_EXIT=0        Test Files 169 passed | 1 skipped (170)；Tests 1549 passed | 3 skipped (1552)
BUILD_EXIT=0
```
（原始输出 `evidence/ci-fix/web-four-1.log`；提交前同一内容另有一轮四检 `web-{typecheck,lint,test,build}.log`，两轮一致）

## 4. U016-C 集成与发布

### 4.1 修复批次与合并（普通提交/推送，逐仓）

| 仓库 | 分支（从 develop 建） | 修复提交 | develop→main | 远端回读 |
|---|---|---|---|---|
| Server | `feature/release-016-ci-fix`（基线 `e1aa67d`） | `e115857`（test(p63)：受控设施 5 文件 +660） | 快进合并并推送；后续文档同步提交 `f6e1d2b`（README/功能清单→0.1.6）同样合入 develop 与 main | `git ls-remote origin develop main` = `f6e1d2b353dc6c5b3d5e58ac4eb591117c100c70`（两者一致） |
| Web | `feature/release-016-ci-fix`（基线 `3faaabd`） | `f91e8bf`（fix(boundary)：13 文件改接 + 7 接缝） | 快进合并并推送；后续文档同步提交 `55c3d39`（README→0.1.6）同样合入 develop 与 main | `git ls-remote origin develop main` = `55c3d3933a58f4cd1941bf22220a24dc7d69a2c5`（两者一致） |

- 未强推、未改写历史、未覆盖/移动既有标签；工作树已核实无遗留未提交项（本批之后）。
- 提交信息遵循 Conventional Commits（中文主题），不含模型署名；Web 仓 pre-commit（lint-staged）与 commit-msg（commitlint）门禁通过。

### 4.2 CI 发布结果

**Web（已完成）**：main 推送触发 `Build & Release (main)` run **38849736987**（headSha `f91e8bf…`）→ **success**（`gh run watch --exit-status` 退出 0）。四检在内实跑通过；自动 Release 与制品：
- tag/Release `build-f91e8bf2307a02f2aad95234df52627ab2d23735`，标题 `CH-aPaaS-Web 0.1.6 build f91e8bf…`（**工作流采用版本 = 0.1.6**，取自 `package.json`）；
- 制品 `dist-f91e8bf2307a02f2aad95234df52627ab2d23735.zip`（1,331,541 B，sha256 `c6f17308…10dd6e`，本地下载复核一致）；压缩包内为 `dist/**`。
- 原始输出：`evidence/ci-fix/ci-web-watch.log`。

**Server（已完成）**：run **38849696705**（headSha `e115857…`）→ **success**；测试与制品门禁结果见 §2.5。自动 Release 与制品：
- tag/Release `build-e1158571bc3e75f96c1c4d2b9751ca98e8330a0f`，标题 `CH-aPaaS-Server 0.1.6 build e115857…`；
- 制品 asset `bootstrap.jar`（label `bootstrap-0.1.6.jar`，217,870,418 B，sha256 `d32b4752…af8145`；本地下载复核一致）—— 说明：<code>gh release create file#label</code> 的 <code>#</code> 段设置的是 asset **label**，asset **name** 仍为文件名，属工具语义而非版本失配（版本身份由 label、Release 标题与制品内 `build.version=0.1.6` 三重可回读）。
- 原始输出：`evidence/ci-fix/ci-server-watch.log`。

### 4.3 同版本 tag/Release 核实与成对语义 tag

- **发布前核实**：`git ls-remote --tags` 两仓语义标签集合 = `{0.1.0, 0.1.2, 0.1.3}`——**此前无 `0.1.6`**（亦无 `0.1.5`：该轮 UAT 直接部署、未建 tag/Release）；无同名 Release。据此新建，不重复、不覆盖。
- **成对创建**（annotated tag 指向本次 main 提交）：

| 仓库 | tag | tag 对象 | 指向提交 | Release | 资产 |
|---|---|---|---|---|---|
| Server | `0.1.6` | `10ce7194b996048b8248f1770f7c296896118398` | `e115857` | `CH-aPaaS Server 0.1.6` | `bootstrap-0.1.6.jar`（217,870,418 B，源=本次 CI 制品） |
| Web | `0.1.6` | `6b09d66ddc03228b3e4e0a0d1657ac80ae7ff99f` | `f91e8bf` | `CH-aPaaS Web 0.1.6` | `sw-web-dist-0.1.6.zip`（1,331,541 B，源=本次 CI 制品） |

- 命名与 `0.1.3` 既有语义 tag/Release 模式一致；既有 `0.1.0/0.1.2/0.1.3` 标签与 Release 未被移动、未被重建。

## 5. U016-D 环境交付与发布后同步

### 5.1 发布前只读核验（发布窗口前，2026-10-16 12:17—12:21，未做任何变更）

| 项 | 实际值 | 证据 |
|---|---|---|
| 后端进程 | `java -jar /opt/smart-workflow/server/bootstrap.jar`（PID 2186909）在跑 | `evidence/ci-fix/uat-precheck.log` |
| 健康 | `http://127.0.0.1:8080/api/actuator/health` → **HTTP 200** | 同上 |
| 服务端 jar | `bootstrap.jar` 217,676,892 B（2026-10-15 16:30），内嵌 `BOOT-INF/lib/sw-common-0.1.5.jar` → **0.1.5 构建** | `evidence/ci-fix/uat-precheck2.log` |
| 备份件 | `bootstrap.jar.bak`（216,837,921 B）、`bootstrap.jar.bak2` | 同上 |
| 数据库 | `flyway_schema_history` versioned 终点 = **单条 `0.1.5`**（checksum `-454928747`，success=t）→ **S1 形态**；`R__` 记录 10 条 | 同上 |
| 磁盘 | `/` 20G，已用 14G，可用 5.0G | 同上 |
| 前端 | `/opt/smart-workflow/web`（2026-10-15 16:47 部署） | 同上 |
| 业务数据（升级前） | `sw_form_app` 不存在（应用中心增量未应用）；`sw_form_def`=3、`sw_bpm_category`=0、`sw_bpm_process_def`=2（deleted=0） | 同上 |
| 升级脚本 | `upgrade-to-0.1.6-from-0.1.5.postgresql.sql` 已传 `/tmp/up016/`，sha256 `7f17bdde…1c2b8b` 与服务端回读一致 | 同上 |

→ 按 0.1.6 升级通道 README 的状态表，**S1 入口**（单条 0.1.5 → 应用中心增量 + 历史衔接）适用；备份/停服/升级/部署/启动按 `docs/ops/production-ops.md` §8—§9。

### 5.2 UAT 交付执行（停服窗口，2026-10-16 12:36—12:41）

| 步骤 | 实际结果 | 证据 |
|---|---|---|
| 备份 | DB `/data/backup/smart_workflow_20261016_1236_pre016.dump`（493K）；jar 轮换 `bootstrap.jar.bak`=0.1.5（217,676,892 B）、`.bak2`=旧件；前端 `web.bak-20261016_1236` | `evidence/ci-fix/uat-backup.log` |
| 上传 | jar → `bootstrap.jar.new` sha256 `d32b4752…`＝CI 制品；Web zip → `/tmp/sw-web-new.zip` sha256 `c6f17308…`＝CI 制品；S1 脚本 → `/tmp/up016/` sha256 `7f17bdde…` | `evidence/ci-fix/uat-upload.log` |
| 停服 | `STOP_TIMEOUT=30 ./stop.sh`（PID 2186909 已停，8080 释放） | `evidence/ci-fix/uat-upgrade.log` |
| DB 升级（S1） | `upgrade-to-0.1.6-from-0.1.5.postgresql.sql`：`ALTER TABLE/CREATE INDEX/COMMENT/INSERT 0 1（未分类承接应用）/UPDATE 3（3 表单归属）//BEGIN/DELETE 1/INSERT 0 1/COMMIT`，无错误 | 同上 |
| 升级后历史 | versioned = 单条 `0.1.6`（checksum `-1768731444`，success=t）；`R__` 记录 10 条不变 | 同上 |
| 换包与部署 | `bootstrap.jar` = CI 制品（sha256 一致）；前端 = `dist/**`（`index.html` 引用 `assets/index-Don_Gmgo.js`，`chown root:root`）；nginx 无需改（前端仍挂根路径） | `evidence/ci-fix/uat-deploy.log` |
| 启动 | `set -a; . ./server.env; set +a; ./start.sh` → 服务启动成功 PID 2222600 | 同上 |
| 启动与迁移行为 | 健康 `/api/actuator/health` = **200**；`Started StarterApplication in 190.418s`；启动段 **ERROR=0**；primary Flyway 校验 12 条、**仅应用 1 条**＝新增可重复迁移 `application center menu`（单次），**零 versioned 重放**；prod-update 实例 `Schema public is up to date`；DB 终点单条 0.1.6 | `evidence/ci-fix/uat-start.log`、`uat-flyway.log` |
| 升级后数据 | `sw_form_app` = 单行 `uncat-t0`（未分类，租户 0）；`sw_form_def` 3 行全部 `app_id='uncat-t0'`；public 表数 171 | `evidence/ci-fix/uat-start.log` |
| 对外连通 | `https://chikaho.cn/`=200、`/assets/index-Don_Gmgo.js`=200、深路由 `/form/app-center`=200、`/sw`→301 根路径、`/sw-server/api/actuator/health`=200（后端就绪后） | `evidence/ci-fix/uat-start.log` |
| **回滚入口** | jar：`stop.sh && mv bootstrap.jar.bak bootstrap.jar && ./start.sh`（**需先回填 DB**，见下）；DB：`sudo -u postgres pg_restore -p 5433 -d smart_workflow --clean --if-exists /data/backup/smart_workflow_20261016_1236_pre016.dump`；前端：`rm -rf /opt/smart-workflow/web && mv /opt/smart-workflow/web.bak-20261016_1236 /opt/smart-workflow/web`。注意：升级脚本已把历史收敛为单条 0.1.6，**仅回滚 jar 会导致旧版 validate 失败（0.1.6 已应用未解析），jar 回滚必须同时回填 DB dump** | 同上 |

### 5.3 可见浏览器最小业务链（UAT，0.1.6 运行中）

- 会话：ZCode 内置浏览器（可见窗格，`headless=false`），视口 **1280×720**，目标 `https://chikaho.cn/`；身份=**系统管理员**（会话为 0.1.5 轮登录态经 refresh 续期，全程未回登录页）；截图 6 张：`evidence/ci-fix/uat-browser/`。
- **应用中心入口**：`/form/app-center` 显示承接应用 `未分类 2 form(s)` → 进入 `/form/app-center/uncat-t0`：应用详情含「Forms directly under the application」2 个业务表单（`未命名表单`、`请假申请`；`0.1.5验收审批意见表单` 为 APPROVAL_COMMENT 类型按设计不进入用户端）→ 与迁移承接结果（3 表单归属 `uncat-t0`、其中 1 为审批意见表单）一致。
- **数据读取/数据权限路径**：进入 `/form/app-form/form_mv9cra10?appId=uncat-t0`（请假申请数据列表）→ "Total 1 records"，表格显示既有记录（2026-10-14→2026-10-29、原因「回家，886」），读取经 `form:data:query` 权限口径的服务端路径。
- **提交→审批→结果链**：应用内表单发起 → `/form/form-render/form_mv9avi56`（0.1.5验收审批意见表单）填写并「Start process」→ 页面提示 **"Submitted successfully. Record ID: 6af86ef6-681e-4a39-b591-74255e4b88eb"** ＋ toast **"Submitted successfully. Process started."**（同时验证 0.1.6 前端"提交后等待实例创建"路径——该路径本次经 `countProcessInstancesByBusinessKey` 接缝改造）→ 待办 `/workspace/todo` 出现 `20261016-002 / 0.1.5验收流程 / Pending review / 业务号=记录ID / 申请人=系统管理员` → 「Approve」→ 确认弹窗「Confirm approval」→Approved → 待办清零（Total 0）→ `/workflow/my-instances`（我发起的）显示该实例 **Approved**（10-16 12:45）。
- **库内回读**：`sw_bpm_instance`：`process_instance_id 61117ffe-c91c-11f1-a743-00163e0d142f`、`business_key 6af86ef6-…`、**status=APPROVED**；`act_hi_taskinst`：审批任务 assignee=1、已办结。
- **限知（如实登记）**：本轮 UAT 仅持系统管理员身份，**非超管受限视角的数据权限对照（受限可见范围/受限数据行）未做**；数据权限按服务端可见性过滤与数据范围口径在管理员视角下核验。UAT 新增验收数据：1 条表单记录 + 1 条已办结实例（实例 61117ffe…），连同 0.1.5 轮遗留的表单/流程定义，留待 Owner 处置。

## 6. R016-04／R016-06 覆盖矩阵（受影响工程配置与当前入口）

### 6.1 生效发布配置与真实版本来源（R016-04）

| 入口 | 应有值 | 实际值 | 生效验证 |
|---|---|---|---|
| `Smart-WorkFlow-aPaaS-server/pom.xml`（`revision`） | `0.1.6-SNAPSHOT` | `0.1.6-SNAPSHOT` | CI step "Resolve CI-friendly version (Maven effective)" 断言通过；dev 默认由 Maven 求值 |
| `.github/workflows/build-release.yml`（版本断言） | 断言 `0.1.6-SNAPSHOT` | 一致 | run `38849696705` 观测到该 step 成功、随后以 `-Drevision=0.1.6` 驱动构建 |
| `scripts/build-prod.sh` / `check-prod-artifact.sh` / 制品身份标记 | `build.version=0.1.6` | 一致 | CI 门禁：`OK build.version 已解析: 0.1.6`、`OK build.version 与期望发布版本一致: 0.1.6` |
| CI Release 标题/资产 label（Server） | 含 0.1.6 | `CH-aPaaS-Server 0.1.6 build e115857…`、label `bootstrap-0.1.6.jar` | `gh release view`/`gh api` 回读 |
| `Smart-WorkFlow-aPaaS-Web/package.json`（version） | `0.1.6` | `0.1.6` | CI Release 标题 `CH-aPaaS-Web 0.1.6 build f91e8bf…` |
| `eslint.config.js`（模块清单/导入边界） | 覆盖当前 `src/modules`（含 form/job/storage）且违规可被检出 | 由治理提交 `341b9a5` 修正；本轮未改配置 | 合规实测：见 §3.1/§3.3（32 errors→0，非法探针仍被检出） |
| `db/migration/**`（versioned 主迁移） | 每方言一个 `V0.1.6__baseline_seed.sql` | 一致（h2 311,144 B／pg 334,275 B，含于正式制品） | 制品清单回读（`unzip -l bootstrap.jar`）+ 本地/CI 全链测试 |
| `db/upgrade/0.1.6/**`（独立升级通道） | 不在 Flyway 扫描路径；单事务、恰好一次 | 一致 | UAT 实跑 §5.2；本地 P62/P64/应用中心衔接测试沿用 |

### 6.2 当前入口覆盖（R016-06；knowledge 优先，后 memory/todo/README/运维/开发声明）

| 入口 | 是否受影响 | 处理结果 | 回读证据 |
|---|---|---|---|
| `knowledge/current-status.md` | 是 | 新增"0.1.6 发布与部署完成"当前条目；原修复在途条目转历史 | 提交后全文回读；本轮提交（§7 Git 事实） |
| `knowledge/session-handoff.md` | 是 | 同上（压缩条目） | 同上 |
| `knowledge/known-issues.md` | 是 | P63 两项设施修复条目补 CI 全绿结果与既有保留项口径 | 同上 |
| `knowledge/features/p63-mes-workflow-foundations.md` | 是 | 历史行后追加"当前状态指针"（不动历史原文） | 同上 |
| `knowledge/features/application-center-form-classification.md` | 是 | 发布/部署行由"未发布未部署"更新为"已随 0.1.6 发布并部署（UAT 链）" | 同上 |
| `memory/README.md`、`state.md`、`handoff.md`、`decisions.md`、`features.md` | 是 | 当前条目更新为发布完成事实；**每文件 <5KB（最大 4,317 B）、总量 19,916 B <20KB** | 字节数实测 + 条目回读 |
| `todo/requirement-pool.md` | 是 | 当前路由更新为"发布完成（待终审）" | 条目回读 |
| `todo/frontend-eslint-module-boundaries.md` | 是 | 标记"已处置"（模块清单修正 + 32 项接缝整改 + 探针验证） | 条目回读 |
| 根 `README.md` | 否 | 无版本/发布现状段落，无需改动 | 全文检索 0.1.5/0.1.6 |
| 根 `CHANGELOG.md` | 是 | 新增 `0.1.6` 条目（版本发布事实/门禁/功能内容/迁移与在役库/边界）；0.1.5 补一行历史说明避免缺环 | 条目回读 |
| `docs/ops/production-ops.md` | 是 | §8.3 增加 0.1.6 主迁移形态与 `db/upgrade/0.1.6/` 衔接步骤（含 S1/S2 选择与顺序） | 条目回读 |
| Server `README.md` | 是 | "当前可体验…"与"当前版本"两处更新为 0.1.6（含 tag/Release 与升级通道） | 条目回读 |
| Web `README.md` | 是 | 同上（含适配接缝一句） | 条目回读 |
| Server `功能清单.md` | 是 | 当前焦点行更新为 0.1.6 发布与终审路由；原焦点行转历史 | 条目回读 |
| `product/0.1.6-release/**`（方向/回执） | 是 | 主方向与 unblock 方向在 `ready/`；回执 `release-016-01.md`（前态）与本回执 | 文件存在与内容 |
| `search_task/release-016-final-result-readback.md` | 是 | 已按请求回传 `search_fallback/release-016-final-result-readback.md`（或本回执代替） | 文件存在 |
| `product/bugfix-20261013/ready/development-declaration.md`（开发声明） | 否（历史） | 该声明为 0.1.5 轮口径；0.1.6 沿用同一命名/收敛规则（由 `direction-release-016.md` §2 授权），不重写历史声明 | 语义核对 |
| `product/delivery-lifecycle/ready/direction-owner-delivery-lifecycle.md` | 否 | 治理流程入口，无版本值 | — |
| `knowledge/feature-reconciliation-index.md` | 否 | 全量对账索引，无版本/发布事实 | 全文检索 0.1.5/0.1.6 |
| Server/Web `docs/governance/engineering-constitution.md` | 否（本轮未改） | 本轮未改工程宪法；`adapters/*` 已在其中列为允许层；**建议 Admin 可选**将"接缝即模块公开入口"口径写入工程宪法（现行配置已可执行，不阻塞本次发布） | 语义核对 |

### 6.3 Git 与工作树事实（三仓，本回执时点）

| 仓库/工作区 | 分支 | HEAD | 远端回读 | 工作树 |
|---|---|---|---|---|
| Server | `main` = `develop` | `f6e1d2b`（= 发布提交 `e115857` + README/功能清单同步） | `git ls-remote origin develop main` 一致（均 `f6e1d2b`） | 干净；`feature/release-016-ci-fix` 已推送（`e115857`，发布前态） |
| Web | `main` = `develop` | `55c3d39`（= 发布提交 `f91e8bf` + README 同步） | 一致（均 `55c3d39`） | 干净；feature 分支已推送（`f91e8bf`） |
| 根（develop-sw） | `develop-sw` | 本批提交（见下"Git 回读"） | 推送后 `git ls-remote` 一致 | 仅本地 evidence（gitignored）与既有 `changed-files/` 未跟踪遗留（非本批产物） |

说明：语义 tag `0.1.6` 与发布制品对应**发布提交** `e115857`／`f91e8bf`；其后的文档同步提交（`f6e1d2b`／`55c3d39`）按既有通道同样触发 main CI（产生 `build-<sha>` 自动 Release），不影响 0.1.6 发布身份。

## 7. 未完成项、组织与风险

1. **Planner 终审（唯一剩余项，非执行侧动作）**：Planner 需复核本回执与发布/部署事实，并按实际发布验证集合下发唯一终态值清单；执行侧**不预填最终 COMPLETED**、不核销 P 编号、不新增功能数。
2. **限知（如实登记）**：UAT 仅持系统管理员身份，非超管受限视角的数据权限对照未做（§5.3）；如需该对照，需 Owner 提供受限测试身份或授权在 UAT 建临时用户。
3. **UAT 新增验收数据**：1 条表单记录 + 1 条已办结实例（`61117ffe…`）＋0.1.5 轮遗留定义，默认保留，处置由 Owner 决定。
4. **本机模块级回归的 3 项时序失败**：均为既有负载/平台时序族（边界类单独复跑 11/0；Phase4 登记 REG-P63-Phase4CrashTest），未改断言；CI 全仓 2046/0/0/34 为正式门禁结果。**不写"全绿"**，按真实计数与分类记录。
5. **制品命名细节**：Server CI Release 资产 `name=bootstrap.jar`、`label=bootstrap-0.1.6.jar`（`gh release create file#label` 语义如此），语义 Release `0.1.6` 资产名为 `bootstrap-0.1.6.jar`；版本身份由 label/标题/`build.version` 三重回读，无版本失配。
6. **未跟踪遗留（非本批）**：工作区根 `changed-files/p63/LoopbackPeerProviderDevTest.java`（早期轮次遗留草稿，未跟踪）；本轮未使用、未删除，处置可另行裁决。
7. 未强推、未改写公开历史、未覆盖/移动任何既有 tag/Release；未删除/清空任何数据；UAT 变更均在备份保护下完成。

## 8. 自验结论与合法 Executor terminal

- 自验结论：U016-A（CI 设施可用、两项测试实际通过、发布门禁通过）、U016-B（32 项违规整改完毕、模块边界仍有效、四检通过）、U016-C（两仓经 develop→main 实际发布成功、工作流与产物版本均 0.1.6、tag/Release 一致）、U016-D（既有通道交付与发布后同步完成、发布与部署事实分列）**均已按方向完成并留有可回读证据**；本回执提交待 **Planner 验收（VERIFYING）**，执行侧不宣称最终完成。
- 总阶段（本发布任务 5 阶段）：完成 **5**（①合入develop②种子压缩与版本收敛③合入main④0.1.6发版〔含 UAT 交付〕⑤当前信息同步）／进行中 **0**（终审属 Planner 复核，不计为执行阶段）／未开始 **0**。
