# Phase 6C · 消费者证据冻结与最终制品纠正回执 02

> 角色：执行（Executor） ｜ 日期：2026-09-26
> 补证指令：`planning-execution-prompt-phase6c-evidence-freeze-final-artifact-correction-02.md`（唯一执行入口）
> 前置复核：`planning-review-completion-phase6c-02-verifying.md`
> 状态：**`EXECUTION_SUBMITTED` / `feature_status=VERIFYING` / `next_action_type=WAIT_PLANNER`**
> 性质：仅两项收尾——消费者证据冻结与最终正式制品恢复；未改 34 个 POM、workflow、`check-version-identity.sh`、`build-prod.sh`、制品门禁、业务代码、数据库、测试与任何 Git ref。

## 1. 消费者证据冻结（新目录 `evidence/phase6c-supplement-02/`）

| 项 | 内容 |
|---|---|
| 冻结输入 | `6cs2-consumer-pom.xml`（实际执行使用的 consumer POM 内容恒等冻结，来源 `/tmp/6c-consumer/pom.xml`，sha256 `2a92464c…`） |
| 身份回读 | 位于源码仓外（`/tmp/6c-consumer`）；`<parent>` 块 = 0；`relativePath` 字样 = 0；`com.sw.ck` 依赖恰 1 处 = `sw-basic-iot-api:0.2.0` |
| 重跑命令 | `mvn -B -o -f /tmp/6c-consumer/pom.xml -Dmaven.repo.local=/tmp/6cs-m2-install org.apache.maven.plugins:maven-dependency-plugin:2.8:tree`（以冻结 POM 的内容恒等副本落位后执行） |
| 结果 | **exit 0**；原始日志非空（15 行，`6cs2-consumer-tree.log`）；**BUILD SUCCESS**；解析到 **`com.sw.ck:sw-basic-iot-api:jar:0.2.0:compile`** |
| 临时仓 | `/tmp/6cs-m2-install`（唯一 Maven local repository）；被消费构件回读存在并记录 sha256：`sw-basic-iot-api-0.2.0.jar`（5289 B，`01760075…`）、`sw-basic-iot-api-0.2.0.pom`（846 B，`4240571c…`） |
| 默认 `~/.m2` | `~/.m2/com/sw/ck` 仍无 `0.2.0`（命中 0） |

过程说明：冻结 POM 的 XML 注释曾两度包含会被身份回读命中的字样（`relativePath`、`<parent>`），已在冻结前改写并重新执行消费命令——最终冻结文件的回读断言全部为 0/1 目标值。

## 2. 旧目录计数纠正

`phase6c-supplement-01/` 实际为**12 个物理文件 / 10 个哈希载荷**（哈希清单 + 回读文件 2 个未自哈希）；上一份补证回执 §6 曾写"13 个物理文件"，以本数字为准。本新目录（`phase6c-supplement-02/`）计数见 §4，两目录互相独立、旧目录未改写。

## 3. 最终正式制品恢复（唯一生产入口为最后一步）

- 所有 install/consumer/探针动作完成后，最后执行 `REVISION=0.2.0 MVN_FLAGS=-o scripts/build-prod.sh`：**整体 exit 0**。
- 入口内测试步（同版本贯穿）：**1570 / 0 / 0 / 0**（14 模块，BUILD SUCCESS ×2：test 步与 package 步）。
- 制品门禁 PASS：负向 10 项全 0（H2 驱动、五个 dev 验证适配器、mock、dev/local 配置、devseed）、正向 6 项齐备（生产配置、PG 驱动、87 项迁移、Tencent provider、`AgentGraphDebug*` 11 class）、`build.profile=prod`、**`build.version=0.2.0` 已解析且与期望一致**。
- **最终制品冻结**：`sw-bootstrap/target/bootstrap.jar`，216897994 bytes，sha256 **`4fd3174c20a87a88e3a98a7638cb4f999527440030229c1aaeafbd72b0e1b0f1`**；回执提交前再次现场计算磁盘 hash 与冻结值**一致**；正式入口之后未运行任何会覆盖制品的 install/package/探针。

## 4. 证据与机器终态

- 新目录计数口径：**被哈希载荷 6 + 哈希清单/回读 2 = 物理文件 8**，现场回读全部 OK。
- 秘密扫描（`6cs2-secret-scan.txt`）：高信号模式命中 0，CLEAN。
- 本轮未修改 34 POM、workflow、版本门禁、`build-prod.sh`、制品门禁、业务代码、数据库、测试与任何 Git ref；未 commit/push/merge/tag/Release/deploy，未执行 Final；未停止常驻服务。

## 5. 证据清单（`evidence/phase6c-supplement-02/`，6 载荷 + 2 = 8 物理文件，现场回读全部 OK）

`6cs2-consumer-pom.xml`、`6cs2-consumer-freeze.txt`、`6cs2-consumer-tree.log`、`6cs2-consumed-artifacts.txt`、`6cs2-final-artifact.txt`、`6cs2-secret-scan.txt`、`6cs2-hashes.sha256`、`6cs2-readback.txt`。

ENGINE_TERMINAL {"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"XL","receipt":"product/backend-architecture-optimization/receipts/completion-phase6c-ci-friendly-version-identity-evidence-correction-02.md","feature_status":"VERIFYING","evidence":["product/backend-architecture-optimization/receipts/evidence/phase6c-supplement-02/（被哈希载荷 6 + 清单/回读 2 = 物理文件 8，6/6 现场回读 OK；秘密扫描 CLEAN）","6cs2-consumer-pom.xml + 6cs2-consumer-freeze.txt：冻结实际使用的 consumer POM（sha256 2a92464c…），身份回读=源码仓外、无父工程块、无 relativePath 字样、唯一 com.sw.ck 依赖 sw-basic-iot-api:0.2.0","6cs2-consumer-tree.log：以冻结 POM 内容恒等副本重跑 mvn -B -o dependency:tree（唯一临时仓 /tmp/6cs-m2-install）exit 0、BUILD SUCCESS、解析 com.sw.ck:sw-basic-iot-api:jar:0.2.0:compile","6cs2-consumed-artifacts.txt：临时仓内被消费 jar/POM 存在并记录 sha256；默认 ~/.m2/com/sw/ck 仍无 0.2.0","6cs2-final-artifact.txt：REVISION=0.2.0 唯一生产入口最后一步整体 exit 0，入口内测试 1570/0/0/0，门禁 PASS（负向 10 项全 0、正向 6 项、build.profile=prod、build.version=0.2.0 与期望一致）；最终制品 216897994 bytes / sha256 4fd3174c…，回执提交前现场重算磁盘 hash 与冻结值一致","旧目录计数纠正：phase6c-supplement-01 实际为 12 物理文件/10 哈希载荷，新目录 8 物理文件/6 哈希载荷，两目录相互独立且旧目录未改写"],"work_items":[{"id":"freeze-consumer","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"冻结实际使用的 consumer POM 并完成身份回读断言（无父工程块/无 relativePath/唯一依赖 sw-basic-iot-api:0.2.0）"},{"id":"rerun-consumer","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"以冻结 POM 副本离线重跑 dependency:tree：exit 0、BUILD SUCCESS、解析 0.2.0:compile；消费构件与 ~/.m2 状态回读完成"},{"id":"final-artifact","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"正式入口作为最后一步整体 exit 0，门禁 PASS，最终制品 path/bytes/sha256 冻结且磁盘现算一致"},{"id":"counts-and-scan","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"新旧目录计数如实区分；秘密扫描 CLEAN；6 载荷+2 清单/回读=8 物理文件全部现场回读 OK"},{"id":"receipt","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已提交纠正回执 02，等待规划复核"}],"remaining_actionable_count":0,"independent_work_exhausted":true,"next_action":"等待规划（Planner）复核 Phase 6C 纠正回执 02；本轮未修改任何实现文件与 refs，未 commit/push/merge/tag/Release/deploy，未执行 Final，最终仓库展示项继续 QUEUED","next_action_type":"WAIT_PLANNER","progress_fingerprint":"phase6c-correction-02-20260926","progress_basis":{"files_changed":["product/backend-architecture-optimization/receipts/evidence/phase6c-supplement-02/（新建证据目录 8 文件）","product/backend-architecture-optimization/receipts/completion-phase6c-ci-friendly-version-identity-evidence-correction-02.md"],"tool_actions":["冻结实际使用的 consumer POM 并做身份回读断言","以冻结 POM 内容恒等副本离线重跑 dependency:tree（唯一临时仓）","临时仓被消费构件 sha256 回读与 ~/.m2 零 0.2.0 检查","REVISION=0.2.0 唯一生产入口最后一步实跑并冻结制品身份","秘密扫描与 6/6 哈希现场回读"],"new_evidence":["consumer 冻结输入、命令、exit 0、BUILD SUCCESS 与 0.2.0:compile 解析结果全部落盘","被消费 jar/POM 存在且 sha256 记录；~/.m2 无 0.2.0","最终磁盘制品即通过门禁的正式 0.2.0 制品（sha256 4fd3174c…，提交回执前重算一致）","旧目录计数纠正为 12 物理/10 哈希载荷；新目录 6 载荷+2=8 物理"],"closed_work_items":["freeze-consumer","rerun-consumer","final-artifact","counts-and-scan","receipt"]},"stop_reason":"WAITING_FOR_PLANNER","tool_results":[{"tool":"Bash/mvn","outcome":"SUCCEEDED","detail":"以冻结 POM 副本离线重跑 dependency:tree：exit 0、BUILD SUCCESS、解析 com.sw.ck:sw-basic-iot-api:jar:0.2.0:compile"},{"tool":"Bash/mvn","outcome":"SUCCEEDED","detail":"REVISION=0.2.0 scripts/build-prod.sh 作为最后一步整体 exit 0：入口内测试 1570/0/0/0，门禁 PASS（负向 10 项全 0、正向 6 项、marker、build.version=0.2.0 一致）"},{"tool":"Bash/shasum","outcome":"SUCCEEDED","detail":"最终制品冻结 sha256 4fd3174c… 与回执提交前现场重算一致；被消费 jar/POM sha256 记录在案"},{"tool":"Bash/find","outcome":"SUCCEEDED","detail":"旧目录 12 物理/10 哈希载荷如实区分；新目录 6 载荷+2=8 物理文件 6/6 回读 OK；~/.m2/com/sw/ck 无 0.2.0"},{"tool":"Bash/grep","outcome":"SUCCEEDED","detail":"秘密扫描高信号模式命中 0（CLEAN）"}],"browser_status":"NOT_APPLICABLE"}
