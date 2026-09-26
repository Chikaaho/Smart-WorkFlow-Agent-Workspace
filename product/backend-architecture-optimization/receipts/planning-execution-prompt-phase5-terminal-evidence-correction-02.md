# Phase 5 · 证据冻结与机器标记机械补正执行单 02

> 下发角色：规划（Planner）  
> 指定角色：执行（Executor）  
> 日期：2026-09-25  
> 状态：READY  
> 性质：纯证据补正；禁止重跑工程测试或修改代码

## 1. 修复证据冻结顺序

1. 先完成并稳定生成 `secrets-scan.txt`；确认其内容不再被后续步骤改写。
2. 若冻结脚本当前按“先哈希、后秘密扫描”执行，可只修正证据脚本顺序；不得修改生产代码、测试代码、POM 或已通过的原始日志。
3. 在所有 20 项证据均稳定后重新生成 `evidence.sha256`，再执行现场 `sha256sum -c`；结果必须为 20/20 OK、exit 0。
4. 回读 `behavior-input.sha256`，保持 30/30 OK、exit 0。行为输入若发生变化，立即停止并如实回传，不得以本执行单为由接受代码漂移。
5. 秘密扫描最终结论仍须为 CLEAN，且不得输出任何凭据值。

不要求重新运行 Maven；`raw/g1-bootstrap-assembly-test.log` 与 `raw/full-server-gate-after-g1.log` 是已通过且受清单保护的功能证据。

## 2. 新增补正回执 03

新增：

`product/backend-architecture-optimization/receipts/completion-phase5-iot-api-boundary-extraction-03.md`

回执引用 01/02 与两份规划复核，不改写旧回执。只记录：

- G1 与 1559/0/0/0 沿用且未重跑；
- 证据漂移原因和冻结顺序修正；
- behavior-input 30/30、evidence 20/20 的现场回读命令与 exit 0；
- 代码/POM/测试/原始功能日志零修改；
- 秘密扫描 CLEAN。

## 3. 物理末行格式

最后一个非空物理行必须严格为单行：

`ENGINE_TERMINAL {"schema":"agent-coding-engine.executor-terminal.v2",...}`

要求：

1. 必须有字面前缀 `ENGINE_TERMINAL `，不能只写裸 JSON，也不能放入代码围栏；
2. 前缀后 JSON 可由 `jq` 解析，`receipt` 指向回执 03；
3. `state=EXECUTION_SUBMITTED`、`feature_status=VERIFYING`、`remaining_actionable_count=0`、`next_action_type=WAIT_PLANNER`；
4. 该行之后不得再有正文或第二个 marker；
5. 提交前同时验证 marker、JSON 和物理末行三项，不得以正文声明代替实际格式。

不得写 `PASSED`/`COMPLETED`，不得归档方向、执行 Git 写操作、推进其他 BAO 或执行最终仓库展示收口。
