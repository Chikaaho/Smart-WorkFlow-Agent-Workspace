# Phase 6C · 消费者证据冻结与最终制品纠正指令 02

> 下发角色：规划（Planner）  
> 指定实施角色：执行（Executor）  
> 日期：2026-09-26  
> 状态：READY  
> 前置复核：`planning-review-completion-phase6c-02-verifying.md`

## 1. 目标

只完成两项收尾：

1. 冻结仓外 consumer 的真实输入、命令和输出，纠正物理文件/哈希载荷计数；
2. 在所有 install/consumer 操作完成后，通过唯一生产入口重建最终 Boot Jar，保证当前磁盘制品就是通过门禁的正式 `0.2.0` 制品。

G1/G2 行为、34/34 POM、双版本矩阵和版本门禁均已锁定，不再修改实现。不得改写 `phase6c-01/` 或 `phase6c-supplement-01/`。

## 2. 消费者证据冻结

1. 新建 `receipts/evidence/phase6c-supplement-02/`。
2. 将实际执行使用的 consumer POM 冻结为 `6cs2-consumer-pom.xml`；必须能回读：源码仓外身份、无 `<parent>`/`relativePath`、唯一 `com.sw.ck` 依赖为 `sw-basic-iot-api:0.2.0`。
3. 以该冻结 POM 的副本或内容恒等文件重跑：
   - `mvn -B -o -f <consumer-pom> -Dmaven.repo.local=/tmp/6cs-m2-install dependency:tree`；
   - 保存精确命令、临时仓路径、POM sha256、exit code和非空原始日志；
   - 输出必须为 BUILD SUCCESS，并解析到 `com.sw.ck:sw-basic-iot-api:jar:0.2.0:compile`。
4. 回读临时仓中被消费的 jar/POM 均存在并记录 sha256；默认 `~/.m2/com/sw/ck` 仍无 `0.2.0`。
5. 新证据正文不得继续声称旧目录存在 `6cs-consumer-pom.xml`；准确区分旧目录 12 个物理文件/10 个哈希载荷与新目录实际计数。

## 3. 最终正式制品恢复

1. 完成所有 install、consumer、探针动作后，最后执行：

   `REVISION=0.2.0 MVN_FLAGS=-o scripts/build-prod.sh`

2. 该入口必须整体 exit 0；入口内测试保持 1570/0/0/0；Phase 6B 负向 10 项全 0、正向 6 项齐备；`build.profile=prod`、`build.version=0.2.0` 与期望一致。
3. 冻结最终 `sw-bootstrap/target/bootstrap.jar` 的路径、大小、sha256 和门禁原始摘要；回执提交前再次现场计算当前磁盘 hash，必须与冻结值一致。
4. 正式入口之后不得再运行会覆盖 `target/bootstrap.jar` 的 Maven install/package 或探针。若必须重跑其它动作，正式入口必须重新成为最后一步。

## 4. 证据与机器终态

- 新目录单独建立哈希清单和回读文件；准确写明“被哈希载荷 N + 清单/回读 2 = 物理文件 N+2”，并现场全部 OK。
- 秘密扫描覆盖本轮冻结输入、命令、日志和回执，真实秘密命中 0。
- 记录本轮未改 34 POM、workflow、版本门禁、业务代码、数据库、测试与 refs；若只执行证据冻结和正式入口，不新增实现修改。
- 新增回执：

  `product/backend-architecture-optimization/receipts/completion-phase6c-ci-friendly-version-identity-evidence-correction-02.md`

- 最后一行必须是合法 `ENGINE_TERMINAL`，保持 `EXECUTION_SUBMITTED / VERIFYING / WAIT_PLANNER`。

不 commit/push/merge/tag/Release/deploy，不执行 Final。
