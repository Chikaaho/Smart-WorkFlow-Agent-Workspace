# Phase 6B · IoT 生产装配与最终制品补证回执（evidence-supplement-01）

> 执行角色：执行（Executor）
> 权威输入：`planning-execution-prompt-phase6b-iot-production-assembly-supplement-01.md`（唯一执行入口）
> 上游裁决：`planning-review-completion-phase6b-01-verifying.md`（采纳解除条件 (a)，授权窄幅生产装配修正）
> 主体回执：`completion-phase6b-production-artifact-isolation-01.md`（旧回执与旧证据不改写，仅引用）
> 主方向：`../ready/direction-phase6b-production-artifact-isolation.md`
> 日期：2026-09-25
> 状态：`EXECUTION_SUBMITTED`（G1—G3 全部关闭；Phase 6B 保持 `VERIFYING`，等待规划复核）

## 1. 缺口关闭对照（唯一剩余缺口矩阵）

| ID | 完成条件 | 结果 | 关键证据 |
|---|---|---|---|
| G1 | mock 实现只存在于 dev/test/mock 源与配置；正式编译/Jar 计数 0；dev 入口仍可用 | **达成** | `6b-supp-source-boundary.txt`（main 源码 `MockCloudProvider` 标识符 0、`new`/import/反射串 0、`"mock"` 字面量 0；默认构建 `target/classes` 计数 0、`-Pdev` 计数 3）；正式 Jar 门禁负向清单 `MockCloudProvider`=0；dev 烟测日志出现「使用 dev 模拟 IoT Provider」装配行且 health 200（`6b-supp-dev-smoke-result.txt`） |
| G2 | `sw.iot.enabled=false` 的 prod 上下文启动；provider/mock Bean 均为 0；代表性设备操作按既有异常体系 fail closed；启用但缺凭据继续 fail closed | **达成** | 定向测试（条件生效后的真实装配）：`IotAutoConfigurationTest` 6 项、`IotFeatureToggleContextTest` 3 项（启用无 provider → 上下文启动、provider Bean 0、控制调用 503、无入队副作用）、`DeferredControlUtilTest` 5 项、`OnlineConfirmControlUtilTest` 7 项；正式 Jar 实测：(A) 出厂配置 health 200、(B) `--sw.iot.enabled=false` health 200、(C) `provider-mode=tencent` 缺凭证启动期 `IllegalStateException` 非零退出（`6b-supp-pg-smoke-result.txt`） |
| G3 | `scripts/build-prod.sh` exit 0；门禁全通过；正式 Jar 以 prod + IoT disabled + 真实 PG 隔离启动并 health 200，Flyway/驱动/关闭可回读 | **达成** | 入口整体 exit 0（`6b-supp-build-prod-entry.txt`，门禁 PASS：负向 10 项全 0、正向 6 项齐备、`build.profile=prod` 标记 OK）；真实 PostgreSQL 三向启动 PASS（`6b-supp-pg-smoke-result.txt`：server_version=14.24、驱动 org.postgresql.Driver、全链 95 迁移至 v96、health 200、临时库用后删除并回读 0）；全量 1570/0/0/0（`6b-supp-full-test-extract.txt`）；哈希回读 16/16（`6b-supp-readback.txt`） |

反向断言遵守情况：未全局放宽 Bean 缺失（仅对 `DeviceControlProvider` 做 IoT-local 的 `ObjectProvider` 可选获取，与既有 `CommandCompensationJob` 对 `DeferredControlUtil` 的既有模式一致）；未伪造腾讯凭据；未吞异常（调用点抛既有 `BaseException` 体系 503）；未返回模拟成功；未新增任何 Jar 精确排除。

## 2. 实施内容（窄幅装配修正，最小改动）

| 文件 | 变更 | 语义 |
|---|---|---|
| `sw-basic/sw-basic-iot/src/dev/java/com/sw/ck/iot/provider/MockCloudProvider.java` | 迁移 | 模拟实现自 `src/main/java` 迁入 `src/dev/java`（`-Pdev` 才进 `target/classes`） |
| `sw-basic/sw-basic-iot/src/dev/java/com/sw/ck/iot/config/MockDeviceControlProviderConfiguration.java` | 新增 | dev/mock 入口的 provider 装配（`enabled=true` 且 `provider-mode=mock`；与生产 tencent 分支互斥） |
| `.../config/IotAutoConfiguration.java` | 改写 | 生产选择器只装配 `provider-mode=tencent` 且凭证完整的 `TencentCloudProvider`；零 mock 引用 |
| `.../config/IotPropertiesAutoConfiguration.java` | 新增 | IoT 属性绑定恒生效（修复 IoT 关闭时 `IotCipherProperties`/`TencentCloudProperties` 缺 Bean 即无法启动的根因） |
| `.../config/TencentCloudProperties.java` | 修改 | `providerMode` 默认 `mock` → `none`（未配置即不装配 provider，缺省即 fail closed） |
| `.../util/DeferredControlUtil.java`、`.../util/OnlineConfirmControlUtil.java` | 修改 | provider 改 `ObjectProvider` 可选获取；入队前/调用前/发送前显式失败（`BaseException` 503；发送路径 `markFailed`、绝不 `markSent`） |
| `sw-basic/sw-basic-iot/pom.xml` | 修改 | `dev` profile 将 `src/dev/java` 作为 main 源根；默认构建将其作为 **test** 源根（仅入 `target/test-classes`，不进 jar，供本模块测试引用 dev 归属类） |
| `sw-basic/sw-basic-iot/src/main/resources/META-INF/spring/...AutoConfiguration.imports` | 修改 | 注册 `IotPropertiesAutoConfiguration` |
| `sw-bootstrap/src/main/resources/application-prod.yml` | 修改 | 移除 `provider-mode: mock`（生产不预设 provider；启用真实设备控制须显式配置 tencent + 凭证） |
| 4 个 IoT 测试类 | 改写/新增 | 装配断言改为条件生效后的上下文断言；新增 fail-closed 与 dev 装配用例（+7） |
| `scripts/build-prod.sh` | 修改 | 第一步 `test` → `clean test`（见 §4 缺陷修复） |

完整清单（含每文件 sha256 与回滚语义）：`6b-supp-change-inventory.tsv`。

公开 API/HTTP 成功失败模型/数据库/迁移/groupId/artifactId/真实腾讯调用逻辑均未改动；`provider-mode` 条件用 kebab 形式（`name="provider-mode"`），经探针矩阵实测同时命中 yml（kebab）、环境变量与 camel 测试属性三种来源。

## 3. 验证执行记录

1. **定向测试**（`-pl sw-basic/sw-basic-iot -am`，离线）：IoT 五个相关测试类 27 项全部通过（6+3+5+7+6）。
2. **全量回归**：`MAVEN_OPTS="-Xmx2g" mvn -B -o test` → BUILD SUCCESS / exit 0 / **1570 / 0 / 0 / 0**（14 模块，基线 1563 → +7，逐项解释见 `6b-supp-full-test-extract.txt`，无删除）。入口内 `clean test` 步独立聚合同为 1570/0/0/0。
3. **dev/local H2 烟测**（`-Pdev` 制品 `bootstrap-dev.jar`，隔离端口 18081）：health 200，Started，dev 模拟 provider 装配行=1，终止干净，运行时生成值回扫 0 → **RESULT=PASS**。
4. **生产入口**：`MVN_FLAGS=-o bash scripts/build-prod.sh` → **exit 0**；门禁 PASS（负向 10 项全 0 / 正向 6 项 / marker OK）；制品 `sw-bootstrap/target/bootstrap.jar` 216903755 bytes，sha256 `9703bba35d2f36f75b1757dff17d4d6a4c50d13e3322a5b636e7ad29c85fb7e0`。
5. **负向探针**（独立重跑）：向临时副本注入 `BOOT-INF/classes/application-dev.yml` → 门禁非零失败（恰 1 项不满足）；正式制品 sha256 前后一致。门禁脚本 `check-prod-artifact.sh` 本轮未修改（5790 bytes，sha256 `b596f290…`，mtime 为 Phase 6B 落地时间）。
6. **真实 PostgreSQL 三向启动**（同一正式制品、唯一临时库、隔离端口 18111/18112/18113；连接值只经既有 `PG_*` 环境变量）：
   - (A) prod 出厂配置原样（IoT 启用、未预设 provider）→ health 200，Started 15.7s；
   - (B) `--sw.iot.enabled=false` → 空库全链迁移 95 条至 **v96**（41.2s），Tomcat 于隔离端口启动，health 200，Started 103.0s；
   - (C) `--sw.iot.tencent.provider-mode=tencent` 缺凭证 → 启动期 fail closed，非零退出，首因文案「…未配置 SecretId/SecretKey…本制品不提供模拟实现…」；
   - 数据源产品/驱动、Flyway 终点、表数可回读（144 表）；临时库用后 DROP 并回读 0；三份运行日志中现场生成值回扫 0。
7. **哈希回读**：证据目录 16/16 校验通过（`6b-supp-readback.txt`）。**秘密扫描**：高信号模式命中 0（1 处为 Phase 5 既有测试占位假值 `AKIDtest123456`，已单列说明，`6b-supp-secret-scan.txt`）。

## 4. 本轮发现并修复的缺陷（入口首跑 exit 1）

`scripts/build-prod.sh` 首跑 **exit 1**：门禁负向清单 `application-dev.yml` / `application-local.yml` / `devseed/**` 三项不满足（制品 216915246 bytes，sha256 `026ae20a…`）。

- 根因：`maven-resources-plugin` 只做拷贝、不清理上一次构建残留。此前以 `-Pdev clean package` 产出 dev 制品后，`src/dev/resources`（dev/local 配置与 devseed）残留在 `sw-bootstrap/target/classes`，随后**不带 clean** 的 `-Pprod package` 将残留物带进正式 Boot Jar——即入口此前隐含依赖"上一次构建恰好是 prod"。
- 修复：入口第一步改为 `clean test`，保证无论本地先前构建过什么 profile，正式制品的输入都只来自当前源码快照（首跑与修复后日志均在 `/tmp/6b-supp/` 留存并记录 sha256，见 `6b-supp-build-prod-entry.txt`）。
- 该缺陷由本轮门禁如实拦截，未流入任何发布动作。

## 5. 环境异常与处置（如实记录）

远端 PostgreSQL（server 14.24，非本机进程）在空库全链迁移期间会随机中途复位连接（JDBC EOF，服务侧行为；本机磁盘/内存正常、无本地锁竞争）。处置：

- JDBC URL 增加 `tcpKeepAlive=true`（中间网络不再回收长连接，最终一轮三向全部一次成功）；
- 前两轮中断采用**同一临时库就地重试**：Flyway 按版本提交、可断点续跑（实测由 v18/v51 续跑至 v96 完成），每次失败先以只读 `pg_stat_activity`/`pg_locks` 记录真实等待事件再终止失败实例；
- 上述现象与本仓库代码、IoT 装配修正无关（同一制品在已迁移库上三次启动均 ~16-105s 内 health 200），已按"穷尽非破坏性诊断、不以绿色替代"的要求如实记录。

## 6. 边界与已锁定项

- 遵守 §3 禁止项：未改公开 API/HTTP 模型/数据库/迁移/真实腾讯调用逻辑/非 IoT 业务；未 commit/push/merge/tag/Release/部署；未停止常驻服务（8080 常驻实例全程未动）；验证进程均用隔离端口并在证据冻结后清理。
- Phase 6B 主体锁定项继续有效：H2 生产 runtime 0（本轮未变更任何依赖声明，唯一 POM 变更为 build/profiles 段；制品级 H2=0 已由门禁独立复核）、五个验证适配器物理隔离、生产正向清单、身份 marker、Release workflow 接入、CI 主体（本轮仅入口脚本加 clean，CI 调用的命令与路径未变）。
- 无 H2 替代生产证据：生产启动证据全部来自真实 PostgreSQL；H2 仅用于 §5.7 dev 烟测。

## 7. 剩余事项

无未关闭缺口。Phase 6B 保持 `VERIFYING`：不归档主方向、不写 `PASSED/COMPLETED`、不启动 Phase 6C 或最终仓库展示收口，等待规划（Planner）复核本补正回执。

## 8. 证据清单（`evidence/phase6b-supplement-01/`，16 文件哈希回读全部通过）

`6b-supp-gap-ledger.tsv`、`6b-supp-prechange-facts.txt`、`6b-supp-source-boundary.txt`、`6b-supp-change-inventory.tsv`、`6b-supp-worktree-identity.txt`、`6b-supp-full-test-extract.txt`、`6b-supp-dev-smoke.log`、`6b-supp-dev-smoke-result.txt`、`6b-supp-build-prod-entry.txt`、`6b-supp-gate-negative-probe.txt`、`6b-supp-pg-smoke-result.txt`、`6b-supp-prod-log-keylines.txt`、`6b-supp-artifact-identity.txt`、`6b-supp-secret-scan.txt`、`6b-supp-hashes.sha256`、`6b-supp-readback.txt`，及 `scripts/run-dev-h2-smoke.sh`、`scripts/run-prod-pg-smoke.sh`（复跑入口，不含任何秘密值）。

ENGINE_TERMINAL {"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"XL","receipt":"product/backend-architecture-optimization/receipts/completion-phase6b-production-artifact-isolation-evidence-supplement-01.md","feature_status":"VERIFYING","evidence":["product/backend-architecture-optimization/receipts/evidence/phase6b-supplement-01/（16 文件，16/16 sha256 回读通过；秘密扫描 CLEAN）","6b-supp-source-boundary.txt：MockCloudProvider 迁入 src/dev/java，生产主源码与主编译输入计数 0、-Pdev 计数 3，生产选择器零 mock import/new/反射串、零 Jar 精确排除","6b-supp-full-test-extract.txt：mvn -B -o test 1570/0/0/0 BUILD SUCCESS（基线 1563 → +7，增删逐项解释，无删除）；入口内 clean test 独立聚合同为 1570/0/0/0","6b-supp-dev-smoke-result.txt + 6b-supp-dev-smoke.log：dev(H2) 隔离端口启动 RESULT=PASS（health 200，dev 模拟 provider 装配行=1）→ dev 入口仍可用","6b-supp-build-prod-entry.txt：scripts/build-prod.sh 首跑 exit 1（门禁拦截 dev 资源残留，根因与修复如实记录）→ 修复后整体 exit 0，门禁 PASS（负向 10 项全 0、正向 6 项、marker OK），制品 216903755 bytes / sha256 9703bba3…","6b-supp-gate-negative-probe.txt：负向探针独立重跑非零失败（恰 1 项不满足），正式制品 sha256 未被污染；门禁脚本本轮未修改（hash/mtime 记录在案）","6b-supp-pg-smoke-result.txt：正式 Jar 真实 PostgreSQL 三向启动 PASS——(A) 出厂 prod 配置 health 200、(B) --sw.iot.enabled=false health 200（空库全链 95 迁移至 v96、驱动 org.postgresql.Driver、144 表）、(C) provider-mode=tencent 缺凭证启动期 fail closed 非零退出；临时库唯一名、用后 DROP 回读 0；连接值只经既有 PG_* 变量","6b-supp-artifact-identity.txt：prod/dev 制品身份与 marker 计数（prod marker=1、Mock 类=0、dev yml=0、h2=0；dev 制品以行为证据证明 mock 装配）","6b-supp-secret-scan.txt：高信号模式命中 0（1 处 Phase 5 既有测试占位假值已单列说明）"],"work_items":[{"id":"G1-mock-source-boundary","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"模拟实现与其 dev 装配类归属 src/dev/java；生产主编译输入与正式 Jar 计数 0；dev 入口烟测与定向测试证明 mock 装配仍可用"},{"id":"G2-iot-disabled-failclosed","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"属性绑定独立成恒生效自动配置修复关闭路径缺 Bean；provider 改 ObjectProvider 可选获取，调用点按既有异常体系 503 fail closed，发送路径 markFailed 绝不 markSent；缺凭证仍启动期 IllegalStateException fail closed"},{"id":"G3-entry-and-pg","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"入口整体 exit 0 且门禁 PASS；正式 Jar 以 prod + IoT disabled + 真实 PG 隔离端口启动 health 200，Flyway/驱动/关闭可回读"},{"id":"defect-entry-clean","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"入口首跑 exit 1 暴露 stale dev 资源残留缺陷，修复为 clean test；首跑与修复后日志均留存并记录 sha256"},{"id":"evidence-freeze","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"16/16 哈希回读通过；秘密扫描 CLEAN；机器末行由 validate-terminal.sh 校验"}],"remaining_actionable_count":0,"independent_work_exhausted":true,"next_action":"等待规划（Planner）复核 Phase 6B 补正回执：G1—G3 均以行为证据关闭（正式制品无 mock 且门禁 PASS、IoT 关闭与出厂配置均以真实 PG 启动 health 200、缺凭证启动期 fail closed、全量 1570/0/0/0）。Phase 6B 保持 VERIFYING，不归档主方向、不启动 Phase 6C 或最终展示收口","next_action_type":"WAIT_PLANNER","progress_fingerprint":"phase6b-evidence-supplement-01-20260925","progress_basis":{"files_changed":["sw-basic/sw-basic-iot/src/dev/java/com/sw/ck/iot/provider/MockCloudProvider.java","sw-basic/sw-basic-iot/src/dev/java/com/sw/ck/iot/config/MockDeviceControlProviderConfiguration.java","sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/config/IotAutoConfiguration.java","sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/config/IotPropertiesAutoConfiguration.java","sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/config/TencentCloudProperties.java","sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/util/DeferredControlUtil.java","sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/util/OnlineConfirmControlUtil.java","sw-basic/sw-basic-iot/src/main/resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports","sw-basic/sw-basic-iot/pom.xml","sw-basic/sw-basic-iot/src/test/java/com/sw/ck/iot/config/IotAutoConfigurationTest.java","sw-basic/sw-basic-iot/src/test/java/com/sw/ck/iot/config/IotFeatureToggleContextTest.java","sw-basic/sw-basic-iot/src/test/java/com/sw/ck/iot/util/DeferredControlUtilTest.java","sw-basic/sw-basic-iot/src/test/java/com/sw/ck/iot/util/OnlineConfirmControlUtilTest.java","sw-bootstrap/src/main/resources/application-prod.yml","scripts/build-prod.sh"],"tool_actions":["mvn -B -o -pl sw-basic/sw-basic-iot -am test（定向：装配/fail-closed/dev-mock 三向，27 项全绿）","MAVEN_OPTS=-Xmx2g mvn -B -o test（全量 1570/0/0/0，BUILD SUCCESS exit 0）","mvn -B -o -Pdev clean package -DskipTests + java -jar bootstrap-dev.jar（dev H2 隔离烟测 health 200 + mock 装配行）","MVN_FLAGS=-o bash scripts/build-prod.sh（首跑 exit 1 → 修复 clean test → exit 0，门禁 PASS）","bash scripts/check-prod-artifact.sh（正式制品 PASS + 注入临时副本负向探针非零失败）","bash run-prod-pg-smoke.sh（正式 Jar × 真实 PG × 隔离端口三向：A/B health 200、C fail closed 非零退出；临时库 DROP 回读 0）","shasum -a 256 -c（证据 16/16 回读）+ 高信号秘密扫描（CLEAN）"],"new_evidence":["正式 Jar 负向清单 10 项全部为 0（MockCloudProvider 归零，无需任何 Jar 精确排除）","IoT 关闭与出厂 prod 配置均以真实 PostgreSQL 启动至 health 200（此前为不可启动状态）","缺凭证的启用路径在正式制品上启动期 fail closed（黑盒实测，非夹具结论）","全量 1570/0/0/0（+7 全部为 IoT 装配语义用例并逐项解释）","入口 stale dev 资源残留缺陷被发现、修复并复验（首跑 exit 1 → exit 0）"],"closed_work_items":["G1-mock-source-boundary","G2-iot-disabled-failclosed","G3-entry-and-pg","defect-entry-clean","evidence-freeze"]},"stop_reason":"WAITING_FOR_PLANNER","tool_results":[{"tool":"Bash/mvn","outcome":"SUCCEEDED","detail":"定向 27 项、全量 1570/0/0/0、入口内 clean test 独立聚合 1570/0/0/0，全部 BUILD SUCCESS"},{"tool":"Bash/mvn","outcome":"SUCCEEDED","detail":"-Pdev clean package 产出 dev 制品并以隔离端口启动 health 200，日志含 dev 模拟 provider 装配行"},{"tool":"Bash/script","outcome":"FAILED","detail":"scripts/build-prod.sh 首跑 exit 1：门禁负向 3 项不满足（dev 资源残留）；已修复为 clean test"},{"tool":"Bash/script","outcome":"SUCCEEDED","detail":"修复后入口 exit 0，门禁 PASS；独立负向探针非零失败且正式制品 sha256 未变"},{"tool":"Bash/java","outcome":"SUCCEEDED","detail":"正式 Jar × 真实 PG 三向：A/B health 200（隔离端口），C 缺凭证非零退出；临时库 DROP 回读 0；秘密回扫 0"},{"tool":"Bash/file","outcome":"SUCCEEDED","detail":"证据 16 文件哈希现场回读全部 OK；秘密扫描高信号命中 0（1 处既有测试假值单列）"}],"browser_status":"NOT_APPLICABLE"}
