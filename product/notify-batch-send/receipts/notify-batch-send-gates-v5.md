# M05 通知批量发送闭环 — 三级提示 03 门禁与计数回执 v5

- 日期：2026-08-27
- 执行角色：执行
- 方向：`product/notify-batch-send/ready/direction-notify-batch-send.md`
- 审查依据：`product/notify-batch-send/receipts/planning-rereview-v4-20260827.md`
- 执行提示：`product/notify-batch-send/receipts/planning-execution-prompt-notify-batch-send-03.md`
- 本轮范围：仅核销 T1 互斥、T2 计数勾稽、T3 原始门禁包与新回执终态。
- S1-S5 已锁定通过，本轮未重跑；未修改业务实现、业务测试、迁移、Mock、方向、既有回执、知识/记忆、列表、需求池或基线。
- 本轮除本回执外未通过 `apply_patch` 修改任何业务文件；未执行发布或推送。
- 功能状态：`VERIFYING`，等待规划层复验。

## T1/T3：P1 后端全量门禁包

开始时间：`2026-08-27T16:32:44+08:00`

前端互斥快照命令（原命令）：

```sh
ps -ef | grep -E '[p]npm|[n]pm|[v]ite|[v]itest|[v]ue-tsc|[e]slint
```

快照原始输出：空（无匹配行）。

快照退出码：`1`（grep 无匹配；正向断言为前端编译/测试进程数 `0`）。

后端门禁命令：

```sh
MAVEN_OPTS="-Xmx2g" mvn test
```

Maven 原始 runner 结尾：

```text
[INFO] Reactor Summary for Smart-WorkFlow 1.0.0-SNAPSHOT:
[INFO] Smart-WorkFlow :: Bootstrap ........................ SUCCESS [  5.330 s]
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  54.860 s
[INFO] Finished at: 2026-08-27T16:33:40+08:00
[INFO] ------------------------------------------------------------------------
P1_MAVEN_EXIT=0
```

P1 退出码：`0`。

P1 Surefire 原始汇总：`124` 个 XML 报告，`tests=915, failures=0, errors=0, skipped=0`。

P1 反向断言：前端 pnpm/npm/vite/vitest/vue-tsc/eslint 编译测试进程数为 `0`。

## P2：前端 typecheck 独立门禁包

开始时间：`2026-08-27T16:34:27+08:00`

后端互斥快照命令（本门开始前原命令）：

```sh
ps -ef | grep -E '[m]vn|[s]urefire|[j]ava'
```

快照原始匹配行：

```text
PID 5745  ... Launcher -q spring-boot:run -pl sw-bootstrap -Dspring-boot.run.profiles=dev
PID 5765  ... com.sw.ck.bootstrap.StarterApplication --spring.profiles.active=dev
```

逐行分类：

- PID 5745：Maven `spring-boot:run` 开发启动器，不是 Maven test/Surefire 测试进程。
- PID 5765：`StarterApplication --spring.profiles.active=dev` 常驻开发服务器，不是 Maven/Surefire/测试 Java 进程。

互斥决策：`clear`；Maven/Surefire/测试 Java 进程数为 `0`。

门禁命令：

```sh
NODE_OPTIONS="--max-old-space-size=2048" pnpm typecheck
```

runner 原始结尾：

```text
$ vue-tsc -b --noEmit
P2_EXIT=0
```

P2 正向断言：typecheck exit=`0`。

## P3：前端 lint 独立门禁包

开始时间：`2026-08-27T16:34:59+08:00`

后端互斥快照命令（本门开始前原命令）：

```sh
ps -ef | grep -E '[m]vn|[s]urefire|[j]ava'
```

快照原始匹配行：

```text
PID 5745  ... Launcher -q spring-boot:run -pl sw-bootstrap -Dspring-boot.run.profiles=dev
PID 5765  ... com.sw.ck.bootstrap.StarterApplication --spring.profiles.active=dev
```

逐行分类：

- PID 5745：已确认是 Maven `spring-boot:run` 开发启动器，不是测试。
- PID 5765：已确认是 `StarterApplication` 开发服务器，不是 Maven/Surefire/测试 Java。

互斥决策：`clear`；Maven/Surefire/测试 Java 进程数为 `0`。

门禁命令：

```sh
NODE_OPTIONS="--max-old-space-size=2048" pnpm lint
```

runner 原始结尾：

```text
$ eslint .
P3_EXIT=0
```

P3 正向断言：lint exit=`0`，error=`0`，warning=`0`。

## P4：前端 test 独立门禁包

开始时间：`2026-08-27T16:35:23+08:00`

后端互斥快照命令（本门开始前原命令）：

```sh
ps -ef | grep -E '[m]vn|[s]urefire|[j]ava'
```

快照原始匹配行：

```text
PID 5745  ... Launcher -q spring-boot:run -pl sw-bootstrap -Dspring-boot.run.profiles=dev
PID 5765  ... com.sw.ck.bootstrap.StarterApplication --spring.profiles.active=dev
```

逐行分类：

- PID 5745：已确认是 Maven `spring-boot:run` 开发启动器，不是 Maven test/Surefire。
- PID 5765：已确认是 `StarterApplication` 开发服务器，不是测试 Java。

互斥决策：`clear`；Maven/Surefire/测试 Java 进程数为 `0`。

门禁命令：

```sh
NODE_OPTIONS="--max-old-space-size=2048" pnpm test
```

runner 原始结尾：

```text
 Test Files  108 passed (108)
      Tests  1039 passed (1039)
   Start at  16:35:23
   Duration  29.47s (transform 11.62s, setup 0ms, import 67.39s, tests 25.13s, environment 87.33s)
P4_EXIT=0
```

P4 正向断言：test exit=`0`，文件=`108/108 passed`，测试=`1039/1039 passed`，失败=`0`。

## P5：前端 build 独立门禁包

开始时间：`2026-08-27T16:36:06+08:00`

后端互斥快照命令（本门开始前原命令）：

```sh
ps -ef | grep -E '[m]vn|[s]urefire|[j]ava'
```

快照原始匹配行：

```text
PID 5745  ... Launcher -q spring-boot:run -pl sw-bootstrap -Dspring-boot.run.profiles=dev
PID 5765  ... com.sw.ck.bootstrap.StarterApplication --spring.profiles.active=dev
```

逐行分类：

- PID 5745：已确认是 Maven `spring-boot:run` 开发启动器，不是 Maven test/Surefire。
- PID 5765：已确认是 `StarterApplication` 开发服务器，不是测试 Java。

互斥决策：`clear`；Maven/Surefire/测试 Java 进程数为 `0`。

门禁命令：

```sh
NODE_OPTIONS="--max-old-space-size=2048" pnpm build
```

runner 原始结尾：

```text
✓ built in 1.14s
P5_EXIT=0
```

P5 正向断言：build exit=`0`；构建转换 `1812` 个模块。构建日志中的 `@vueuse/core` Rolldown `INVALID_ANNOTATION` 为依赖包非阻断警告，不影响 exit=`0`。

## T2：Surefire 计数逐测试类勾稽

本轮仅使用 P1 结束后生成的 Surefire 报告。报告文件数=`124`；测试总数=`915`；failures=`0`；errors=`0`；skipped=`0`；重复类=`0`。

正式旧基线：`870`。

自正式旧基线后新增或新增计数的每个测试类：

| 测试类 | 旧数 | 当前数 | 增量 |
|---|---:|---:|---:|
| `com.sw.ck.notify.controller.NotifyBatchSendIntegrationTest` | 0 | 13 | +13 |
| `com.sw.ck.notify.controller.NotifyBatchSendEvidenceTest` | 0 | 31 | +31 |
| `com.sw.ck.bootstrap.FlywayFullChainPostgresTest` | 10 | 11 | +1 |
| 合计 |  |  | +45 |

正式旧基线算式：`870 + 13 + 31 + 1 = 915`，等式成立。

此前 v3 的 `903` 到当前 `915` 的每条增量来源：

| 来源测试类 | v3 旧数 | 当前数 | 增量 | 具体来源 |
|---|---:|---:|---:|---|
| `com.sw.ck.notify.controller.NotifyBatchSendEvidenceTest` | 20 | 31 | +11 | v4 后补充的 S1/S2/S5 真实行为证据用例 |
| `com.sw.ck.bootstrap.FlywayFullChainPostgresTest` | 10 | 11 | +1 | 新增 `notifyBatchPermissionResource_shouldBeQueryableAndBindable`，验证 PostgreSQL 生产权限资源可查询并由普通角色绑定 |
| 合计 |  |  | +12 |  |

v3 增量算式：`903 + 11 + 1 = 915`，等式成立。

此前缺失的 `+1` 已明确归属：`FlywayFullChainPostgresTest` 的 `10 → 11`，不是 H2，也不是未归属报告。

反向断言：`124` 个报告类名唯一；所有报告的 failures/errors/skipped 均为 `0`；报告总和与两条算式均为 `915`；无未归属、重复计数、失败、错误或跳过项。

## T3：终态前自检矩阵

| 检查项 | 结论 |
|---|---|
| P1 前端互斥快照为 0，后端全量成功 | 是 |
| P2 独立后端快照为 0，typecheck 成功 | 是 |
| P3 独立后端快照为 0，lint 成功且零告警 | 是 |
| P4 独立后端快照为 0，test 成功且计数明确 | 是 |
| P5 独立后端快照为 0，build 成功 | 是 |
| 870→当前总数算式闭合 | 是 |
| 903→当前总数算式闭合且缺失 1 条已解释 | 是 |
| Validator 最终 exit=0 | 是；候选终态预检 exit=0，最终复验见下 |
| `tail -n 1` 等于物理最后一行唯一终态 | 是；最终复验见下 |
| 工作区除 v5 回执外零修改（本轮） | 是；本轮未修改业务文件 |

## T3：Validator 原始记录与物理末行复验

候选终态预检已先执行，原始命令、退出码和输出如下：

```sh
tail -n 1 product/notify-batch-send/receipts/notify-batch-send-gates-v5.md | sed 's/^SWF_TERMINAL //' | sh .codex/governance/validate-terminal.sh
```

```text
（无标准输出）
VALIDATOR_EXIT=0
```

按提示将上述 Validator 命令、退出码和原始输出插入终态行之前后，最终复验命令为：

```sh
tail -n 1 product/notify-batch-send/receipts/notify-batch-send-gates-v5.md | sed 's/^SWF_TERMINAL //' | sh .codex/governance/validate-terminal.sh
```

最终 Validator 原始输出：

```text
（无标准输出）
VALIDATOR_EXIT=0
```

最终物理末行命令：

```sh
tail -n 1 product/notify-batch-send/receipts/notify-batch-send-gates-v5.md
```

最终 `tail -n 1` 输出等于本文件末行唯一终态：

SWF_TERMINAL {"schema":"smart-workflow.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","receipt":"product/notify-batch-send/receipts/notify-batch-send-gates-v5.md","evidence":["P1-P5原始门禁证据","870→915与903→915计数勾稽"],"feature_status":"VERIFYING"}
