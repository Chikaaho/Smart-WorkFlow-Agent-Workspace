# Phase 6C · 版本身份门禁与可消费 POM 补证指令 01

> 下发角色：规划（Planner）  
> 指定实施角色：执行（Executor）  
> 日期：2026-09-26  
> 状态：READY  
> 前置复核：`planning-review-completion-phase6c-01-verifying.md`

## 1. 目标与锁定项

只关闭两个缺口：

- G1：单模块 parent version 分叉必须被 POM 门禁非零拒绝；
- G2：以非空原始日志和仓外最小消费者证明 release install 的 POM 可被解析。

已锁定且不重开：34/34 正向 POM 表达式、develop/release 32/32 版本矩阵、workflow 同源结构、Phase 6B 正式制品门禁、1570/0/0/0、ref 零修改与秘密扫描。若本补证不改 POM、workflow、`build-prod.sh`、制品门禁或业务代码，不重跑全量测试和生产构建。

## 2. G1 · 修复并证明父版本分叉门禁

1. 先查明旧探针为何在成功注入后仍 exit 0，记录是根目录错位、路径集合错误、计数逻辑缺陷还是其它原因。
2. `check-version-identity.sh pom` 必须对调用者指定/脚本确定的同一仓库根工作，逐项枚举 34 个 POM：
   - 根 POM 工程 version 恰为 `${revision}`；
   - 33 个子 POM 的 `com.sw.ck` parent version 各自恰为 `${revision}`；
   - 输出每个不合规文件的相对路径与实际值；
   - 不得只靠全仓总命中数，也不得静默回到正式工作树扫描。
3. 在唯一临时完整副本中运行探针：复制 gate 与 34 个 POM 所需目录结构，记录临时根绝对路径；只把 `sw-framework/sw-common/pom.xml` 的 parent version 改为 `0.1.0`。
4. 探针前置断言必须回读注入文件路径、精确行和值，并证明正式工作树对应 POM hash 未变。
5. 在该临时根运行同一 gate，必须 exit 非 0，输出必须点名 `sw-framework/sw-common/pom.xml` 和 `0.1.0`；随后正式工作树 `pom` 模式仍须 PASS。
6. 重跑其它三个有效探针，确保未解析 revision、release SNAPSHOT、Release 元数据不一致继续非零失败。旧首次 BSD `sed` 注入失败日志保留为历史，不得计入通过数。

## 3. G2 · install 与仓外消费行为

1. 使用新的唯一临时 Maven local repository，以 `-Drevision=0.2.0` 执行离线 install；保存非空原始日志、完整命令、exit code、BUILD SUCCESS、reactor/project 数与临时仓路径。
2. 重跑 installed 门禁，证明 32 个安装 POM 的工程/父版本为 `0.2.0`，版本字段无 SNAPSHOT，`${revision}` 命中 0；说明 34 POM 与 32 reactor/install 项的关系。
3. 在源码仓外创建最小 consumer POM，至少依赖一个已安装的叶子模块；使用该唯一临时仓、离线模式且不引用源码 relativePath，执行 Maven 模型/依赖解析。
4. consumer 必须 exit 0，并记录其解析到的 `com.sw.ck` 坐标与版本；若解析依赖需要的外部构件，仍只能来自该临时仓。不得回退默认 `~/.m2`。
5. 记录默认 `~/.m2/com/sw/ck` 未新增 `0.2.0`，并在完成后保留临时仓到规划复核结束。

## 4. 补证门禁

全部满足才可提交：

1. 正式 POM gate PASS；有效父版本分叉探针 exit 非 0，并点名文件和值；
2. 四类探针各有一次有效注入和非零失败，不能以注入命令自身失败代替 gate 失败；
3. release install 原始日志非空、exit 0、BUILD SUCCESS，installed gate PASS；
4. 仓外 consumer 只用临时仓离线解析成功；
5. 正式工作树、最终生产制品 hash、Git refs 未被探针污染；
6. 新证据目录哈希清单现场回读全部通过，物理文件数与被哈希载荷数分别陈述；秘密扫描真实命中 0；
7. 最后一个非空物理行是合法 `ENGINE_TERMINAL`，状态仍为 `EXECUTION_SUBMITTED / VERIFYING / WAIT_PLANNER`。

## 5. 允许修改与停止条件

允许修改 `scripts/check-version-identity.sh` 及补证脚本/证据。只有在定位证明必要时才可修改与版本门禁直接相关的脚本；不得改 34 个 POM、workflow、生产构建/制品门禁、业务代码、数据库或测试来规避探针。

若仓外 consumer 暴露真实 POM 消费缺口，保留原始失败并在 Phase 6C 范围内做最小修正；此时受影响的 POM/install/version gate 必须重跑，是否重跑全量测试和生产构建按实际修改面决定，不得用静态扫描代替。

不 commit/push/merge/tag/Release/deploy，不执行 Final。

## 6. 补证回执

提交：

`product/backend-architecture-optimization/receipts/completion-phase6c-ci-friendly-version-identity-evidence-supplement-01.md`

证据放入新的 `receipts/evidence/phase6c-supplement-01/`；不得改写 `phase6c-01/`。回执最后一行必须是合法 `ENGINE_TERMINAL {json}`。
