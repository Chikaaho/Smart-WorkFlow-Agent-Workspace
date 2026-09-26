# Phase 6A 第三方版本集中化与 Enforcer 依赖收敛 · 规划验收

> 复核角色：规划（Planner）  
> 日期：2026-09-25  
> 审查对象：主体回执 01、补正回执 01、`evidence/phase6a-01/` 与 `evidence/phase6a-supplement-01/`  
> 结论：**功能级 `PASSED`（8/8；待终态同步，不等于 `COMPLETED`）**

## 1. 验收裁决

| # | 门禁 | 规划结论 |
|---|---|---|
| 1 | 五项业务/实现 POM 显式 version 为 0；Step A 解析集合 2845 行逐项恒等 | PASSED |
| 2 | 32/32 模块在 `build/plugins` 继承同一 Enforcer execution | PASSED |
| 3 | 在线、离线 `validate` 均成功，32 模块逐一执行 `dependencyConvergence` | PASSED |
| 4 | 临时副本最小分叉使默认 `validate` 按预期非零失败，未污染正式工作树 | PASSED |
| 5 | 探索 14 项及 Enforcer 新发现的 `checker-qual` 均收敛，最终分叉 0/0；无 scope/exclusion 规避 | PASSED |
| 6 | Form、IoT、Storage、Knowledge/Agent、BPM 调用域回归成立；Tika/PDFBox/Spring AI 有离线行为锚点 | PASSED |
| 7 | 最终全量 32 模块、1563/0/0/0，较 1559 新增 4 项均可归因 | PASSED |
| 8 | 主证据 24/24、补证 10/10 现场回读通过，秘密扫描 CLEAN，机器终态合法 | PASSED |

## 2. 补证核销

- **G1 通过**：新在线日志实测 `mvn -B validate` exit 0、32 次 execution、32 条 `DependencyConvergence passed`、`BUILD SUCCESS`，分叉错误与 `BUILD FAILURE` 均为 0；旧首次失败日志保留。
- **G2 通过**：Knowledge 以 PDFBox 生成 768-byte 内存 PDF，经 Tika 识别为 `application/pdf` 并抽取哨兵文本；Agent 实际覆盖 Spring AI Prompt 装配、`ChatModel.call` 响应提取及 `EmptyUsage` 未知语义。定向 4/0/0/0，全量 1563/0/0/0。
- **G3 通过**：补正回执最后一个非空物理行以唯一 `ENGINE_TERMINAL ` marker 开始；JSON 可解析，`state=EXECUTION_SUBMITTED`、`feature_status=VERIFYING`、G1—G3 均不可操作、`remaining_actionable_count=0`、`next_action_type=WAIT_PLANNER`。
- Planner 现场重放补证清单 10/10 OK；`/tmp/bao6/full-test2.txt` sha256 为 `ad54172a6dbf45435d0ef7f79ce7c1970e4216f7009fa4927cabfc03a7b377be`，字节数/行数及 `BUILD SUCCESS` 与正式摘录一致。

## 3. 偏差与转录裁决

- POI 从 Step A 移至 Step B 的规划纠正继续有效：Step A 保持严格版本中性，Step B 将 POI 家族收敛为 5.4.0，不计执行失败。
- `checker-qual` 是 Enforcer 对介导前依赖图的真实补充发现，纳入本阶段收敛结果。
- 补正回执 G1 正文把旧失败日志 sha256 写成 `d82f440f…`；Planner 现场值和旧哈希清单均为 `c0b891fa3fcaccf92d54875868d6868dcf785e10a64b8dacfc1dce628e637770`，且当前文件回读匹配。该处是非权威叙述转录错误，不影响旧文件未改写结论；本复核以工具回读值更正，不再追加补证。

## 4. 已锁定结果与边界

1. `sw-dependencies` 是本阶段第三方版本的唯一所有者；默认 Maven 生命周期已真实启用依赖收敛守门。
2. 当前收敛图为 0 分叉；负向探针证明守门具备失败能力，不是空转配置。
3. 最终后端基线为 1563 tests / 0 failures / 0 errors / 0 skipped；新增 4 项仅为兼容性测试，生产代码零改动、生产依赖零新增。
4. 本阶段不证明 MinIO/Qiniu/COS、腾讯云或真实模型服务的外部送达；现有结果是离线库/类路径兼容与调用域回归。
5. H2 生产制品隔离、P58Debug/dev-only 边界留给 Phase 6B；版本身份留给 Phase 6C；GitHub About/POM URL 继续排在最终收口。
6. 当前通过不授权 commit、push、merge、tag、Release、部署或提前启动下一阶段实现。

## 5. 状态裁决

Phase 6A 由 `VERIFYING` 进入功能级 **`PASSED（2026-09-25）`**。总体任务 `backend-architecture-optimization` 继续 `IN_PROGRESS`。

主方向归档：

`product/backend-architecture-optimization/passed/direction-phase6a-dependency-version-enforcement.md`

终态同步唯一入口：

`product/backend-architecture-optimization/ready/direction-phase6a-dependency-version-enforcement-terminal-sync.md`

终态同步复核通过前不得写 Phase 6A `COMPLETED`，不得启动 Phase 6B/6C 或最终仓库展示收口。
