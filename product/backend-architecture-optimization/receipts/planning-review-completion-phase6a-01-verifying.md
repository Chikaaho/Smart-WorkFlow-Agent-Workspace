# Phase 6A 第三方版本集中化与 Enforcer 依赖收敛 · 规划复核 01

> 复核角色：规划（Planner）  
> 复核对象：`completion-phase6a-dependency-version-enforcement-01.md` 与 `evidence/phase6a-01/`  
> 日期：2026-09-25  
> 结论：`VERIFYING`（主体实现成立；补齐 3 项后再作功能级裁决）

## 1. 已确认并锁定

1. 五类业务/实现 POM 显式版本已归零，`sw-dependencies` 成为本阶段唯一版本所有者；Step A 的 2845 行解析集合前后逐项恒等。
2. Enforcer execution 已进入根 `build/plugins` 并由 32/32 模块继承；离线 `validate` 实际执行 32 次并 `BUILD SUCCESS`。
3. 临时副本负向探针因 `commons-io` 分叉按预期 `BUILD FAILURE`，错误来自 `dependencyConvergence`；未污染正式工作树。
4. 最终分叉从 14 构件/4 模块降为 0/0；新增 `exclusion` 为 0、生产依赖 scope 改写为 0。Enforcer 实跑额外发现并收敛 `checker-qual`，接受为探索枚举口径补全。
5. 当前全量快照为 32 模块、1559 tests / 0 failures / 0 errors / 0 skipped、`BUILD SUCCESS`。Planner 现场回读 `/tmp/bao6/full-test.txt`，其 sha256 与回执登记的 `9a19af…03a` 一致。
6. 24 项正式证据哈希现场回读全部 OK；秘密扫描 CLEAN。POI Excel 往返、IoT 命令与腾讯状态钩子、Storage 三类 Provider 初始化、BPM/Flowable 均在全量日志中出现对应行为锚点。

上述项目不因本轮补证重复验证；只有新增测试资产导致快照变化时，按工程门禁重跑受影响定向测试与后端全量。

## 2. 方向偏差裁决

- **POI 从 Step A 移至 Step B：接受。** 原方向同时要求“Step A 由 dependencyManagement 托管 POI”和“全反应堆解析值保持 5.2.5 不变”，但 Tika 3.1.0 的编译基线为 POI 5.4.0，二者在当前反应堆内不可同时成立。执行侧先回退会改变 6 行解析结果的方案，使 Step A 严格中性，再在 Step B 将 POI 家族收敛为 5.4.0；这属于对规划内部互斥条件的最小纠正，不计执行失败。
- **第 15 项 `checker-qual`：接受。** 它由 Enforcer 介导前依赖图真实发现，按 PostgreSQL JDBC 较高基线 3.48.3 收敛，未删除依赖边。
- **真实云网络往返未执行：接受为残余边界。** 本阶段验收的是版本/类路径兼容，不要求真实第三方账号送达；不得把现有单测和上下文初始化描述为真实云调用。

## 3. 暂不通过项

### G1 · 在线 `validate` 成功证据对象不匹配

回执把 `phase6a-validate-online.txt` 列为最终在线成功证据，但该文件实际以 `BUILD FAILURE` 结束，记录的是 Enforcer 首次发现 `checker-qual 3.43.0/3.48.3` 分叉的失败运行。当前只有最终离线 `validate` 成功日志，不能由命令台账中的文字替代方向 §4.3 要求的在线成功原始结果。

### G2 · Knowledge/Agent 的 Tika/PDFBox/Spring AI 行为覆盖不足

回执明确承认 `sw-basic-knowledge` 没有测试；全量原始日志中也没有 Tika/PDFBox 行为锚点。Agent 346 项绿色和依赖版本分析不能替代方向 §4.6 指定的 Tika/PDFBox/Spring AI 调用域回归。需补最小、离线、内存内兼容性测试，不要求外网或真实模型服务。

### G3 · 缺少合法机器终态

完成回执最后一个非空物理行是秘密扫描说明，不是 `ENGINE_TERMINAL {json}`。因此当前只有人类可读的 `EXECUTION_SUBMITTED`，没有符合治理契约的机器终态。

## 4. 唯一下一动作

Executor 执行：

`product/backend-architecture-optimization/receipts/planning-execution-prompt-phase6a-evidence-supplement-01.md`

Phase 6A 保持 `VERIFYING`；不得归档主方向、同步 `COMPLETED`、启动 Phase 6B/6C、执行 Git 写操作或最终仓库展示收口。
