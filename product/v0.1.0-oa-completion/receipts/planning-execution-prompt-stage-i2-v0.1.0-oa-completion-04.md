# v0.1.0 OA Completion · Stage I2 · 执行补充提示 04

- 日期：2026-09-10
- 当前唯一依据：`planning-review-stage-i2-v0.1.0-oa-completion-05.md`
- 替代关系：本提示替代提示 03，成为唯一当前执行入口；提示 01—03、回执 01—05只作追溯和锁定证据，不同时作为待办。
- 范围：只处理 E0b4 终态封装；不改变 I2 方向、业务实现或授权边界。

## 1. 诊断与唯一剩余账本

E0b4 属于**快照过期/纯报告封装错误**：回执 05 的候选文件晚于 terminal Validator 和回执正文，导致已验证 input 与 manifest 最终候选不是同一冻结时点。五个业务包、受影响门禁、terminal 内容、回执末行 cmp 和 manifest 内容本身均已通过。

父子映射：E0b3 → E0b3a（内容正确，已锁定）+ E0b4（冻结顺序待修复）。

| 原子 | 正向断言 | 反向断言 | 对象身份 | 最小证据 | 合法停止条件 |
|---|---|---|---|---|---|
| E0b4 | 三仓最终候选先生成；其后生成并验证 receipt06 terminal；再完成末行 cmp 与 manifest 回读；所有退出码 0 | terminal 生成后不得重写候选文件；不得修改代码、业务证据或门禁输出 | 回执 05 的三仓 HEAD/branch 与 `i2-05` 五个业务 verdict、门禁输出 | `evidence/i2-06/e0b4/` 的候选元数据、时间账本、terminal 四件套、末行 cmp、manifest/verify、verdict | 仅正式 Git/Validator 工具真实失败且已保存 stderr/exit；不得把可重新封装写成 BLOCKED |

## 2. 锁定项与禁止重验

- 锁定 `evidence/i2-05/e2c3/`、`e5b3/`、`e6b3a/`、`e6b3b/`、`e7b3/` 全部原始文件与 verdict。
- 锁定 `evidence/i2-05/e0b3/affected-gates-*` 的 compile、package、Server full test 结果。
- 不读取或修改业务代码，不启动服务，不运行任何编译、测试、构建、迁移或浏览器行为，不改写 `evidence/i2-05/`。
- 若发现任何代码或上述锁定附件已被改写，停止本封装并如实提交精确差异；不得自行扩张为业务返工。

## 3. 新封装包与顺序

只新增：

- `product/v0.1.0-oa-completion/receipts/evidence/i2-06/e0b4/`
- `product/v0.1.0-oa-completion/receipts/evidence/i2-06/manifest.sha256`
- `product/v0.1.0-oa-completion/receipts/evidence/i2-06/manifest-verify.txt`
- `product/v0.1.0-oa-completion/receipts/evidence/i2-06/manifest-verify-exit.txt`
- `product/v0.1.0-oa-completion/receipts/stage-i2-v0.1.0-oa-completion-06.md`

严格按以下单调顺序执行：

1. 回读 `i2-05` manifest；确认 102 项仍全部通过，保存 raw/exit。
2. 生成三仓最终 `head/branch/status/diff-stat` 与 task-owned crosscheck。此后把这些候选文件视为只读，不再覆盖。
3. 保存候选文件的最大 mtime/epoch 到 `candidate-max-epoch.txt`；从此不得再覆盖任何候选文件。
4. 生成唯一 `terminal-input.json`：receipt 指向回执 06；work_items 只保留 E0b4 且 completed/actionable=false；remaining=0；业务与门禁通过项只作为锁定 evidence 引用，不重新展开为待办。
5. 运行正式 Validator，保存 stdout/stderr/exit；exit 必须为 0。
6. 写回执 06，末行逐字附加 `ENGINE_TERMINAL <terminal-input 单行原文>`；实际比较最终回执末行与 input，保存 cmp exit=0。回执写完后不得再改。
7. 生成 `freeze-order.txt`，实际回读并记录旧业务 verdict、旧门禁、候选最大时间、terminal input、Validator exit、回执和 cmp 的 mtime/epoch；随后写 `verdict.json`，仅含 `priorManifestStillPass`、`candidateFrozenBeforeTerminal`、`terminalValidatorPass`、`terminalEmbeddedVerbatim`、`manifestPass`、`noLockedArtifactChanged`，最终状态全部为 `true`。
8. 最后生成新 manifest（排除自身及 verify 输出）并实际回读，保存 stdout/exit=0。完成后不得再修改 manifest 所列任何文件。

`freeze-order.txt` 与最终文件元数据必须满足：候选文件最大 mtime < terminal input mtime ≤ Validator exit mtime ≤ 回执/cmp mtime ≤ `freeze-order.txt`/verdict mtime ≤ manifest mtime；且 manifest 回读后所有已列文件哈希不变。

## 4. 相对提示 03 的方法变化

- **删除**：删除五个业务包、实现修复和全部门禁重跑，只保留封装。
- **原子化**：E0b3 拆成已锁定内容 E0b3a 与唯一剩余顺序 E0b4。
- **替代路径**：不再用先 terminal、后覆盖候选的方式；候选一次生成后只读，所有终态产物沿单向时间链追加。
- **可判定提交条件**：六个 verdict 字段全 true、旧 manifest 102 项仍通过、新 manifest 回读 0、最终回执末行 cmp 0，并且候选最大 mtime 严格早于 terminal input。

## 5. 合法终态与回执

只在 §4 条件全部成立时提交 `stage-i2-v0.1.0-oa-completion-06.md`，状态仍为 `VERIFYING / EXECUTION_SUBMITTED`。Executor 不得写 I2 `PASSED/COMPLETED`、进入阶段三、提交/推送 Git、移动方向、核销 P 编号或发布版本。
