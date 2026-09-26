# Phase 6C CI-friendly 版本身份 · 规划复核 01

> 复核角色：规划（Planner）  
> 日期：2026-09-26  
> 复核对象：`completion-phase6c-ci-friendly-version-identity-01.md` 与 `evidence/phase6c-01/`  
> 结论：`VERIFYING`（正向链路成立；父版本分叉负向能力与 install 行为证据待补）

## 1. 已确认并锁定

1. 34/34 POM 已统一工程版本表达式：根 GAV 与 33 个子 POM parent version 使用 `${revision}`，工程版本字面量 `0.1.0` 命中 0。
2. develop 默认解析 32/32 为 `0.2.0-SNAPSHOT`；release override 32/32 为 `0.2.0`，版本矩阵无空值、占位符或分叉。
3. Flatten Maven Plugin 已按 `resolveCiFriendliesOnly` 接入；临时仓现场存在 32 个 `com.sw.ck:0.2.0` POM，版本/父版本已解析且无 `${revision}`。
4. workflow 版本链静态门禁通过：Maven effective version 驱动正式构建、制品标记、Release 标题/notes 与上传制品名。
5. `REVISION=0.2.0` 的生产入口整体 exit 0；Phase 6B 负向 10 项全 0、正向 6 项齐备，`build.version=0.2.0` 与期望一致。
6. 默认 develop revision 与 release 入口内全量测试均为 1570/0/0/0；历史 refs 未修改，未执行发布动作，秘密扫描真实命中 0。
7. 证据目录物理文件数为 19，其中被哈希载荷 17 个，另 2 个是哈希清单和回读文件；Planner 现场重放 17/17 均为 OK。该计数关系成立，不是漏冻证据。

上述项目锁定；补证不得重开已成立的版本矩阵、全量业务回归或 Phase 6B 制品边界。

## 2. 未通过项

### G1 · 单模块父版本分叉探针未触发门禁

`6c-gate-probes-retry.txt` 已证明临时 POM 的 parent version 成功注入为 `0.1.0`，但随后 `check-version-identity pom` 仍为：

```text
exit=0（必须非 0）
RESULT: PASS（check-version-identity pom）
```

这与方向 §5.6 的“四向探针均非零失败”直接冲突，也推翻回执表中“探针 4/4 非零失败”的陈述。现有证据不能证明 POM 门禁会拒绝单模块父版本漂移；可能原因包括探针与门禁根目录不一致，或门禁只统计原工作树/总数而未逐文件检查。必须以有效临时树定位并修复，不能把 `exit=0` 解释为通过。

### G2 · install 原始行为记录为空

冻结文件 `6c-install-temp-repo.log` 为 0 bytes。临时仓现存 32 个 POM、installed 门禁通过，这些能证明结果状态，但不能独立回读执行命令、exit、reactor/install 过程，也没有仓外消费者仅凭临时仓解析一个已安装模块的行为证明。

Phase 6C 的目标是“可消费 POM”，故需补一次非空安装记录和最小外部消费者解析；不要求重跑业务全量测试。

## 3. 唯一下一动作

Executor 执行：

`product/backend-architecture-optimization/receipts/planning-execution-prompt-phase6c-version-identity-probe-supplement-01.md`

Phase 6C 保持 `VERIFYING`；不得归档主方向、同步 `COMPLETED` 或执行 Final。
