# P62 分级执行与统一命令：S5 Web 界面进度回执 01

日期：2026-09-30；角色：执行（Executor）；阶段状态：**IN_PROGRESS**（正式完成回执 `tiered-execution-unified-command-01.md` 在 U01—U08 全部完成后提交）。
依据：`../ready/direction-p62-tiered-execution-unified-command.md`（Web 配置/执行回查/批量项/核实界面）。前置：S1—S4 进度回执。

## 1. S5 交付范围

| 项 | 实现 | 位置（Web `c87a394`） |
|---|---|---|
| 后台批量调用控制台 | `TxnBatchConsole.vue`：批量受理（批次键/动作标识/1—500 项编辑，项键唯一前端校验，无 `form:action:invoke` 权限禁用）→ 受理成功自动回查该批次；批次回查（状态可读文案/成功失败总数/动作版本/命令标识/重放标记）；逐项结果表（状态/调用记录/错误码+原因可定位/尝试次数）；重放命中原批次时明确提示"已返回原批次，未重复执行" | `modules/workflow/views/TxnBatchConsole.vue`、`modules/workflow/api/txn-batch.ts` |
| 设备命令回查与人工核实入口 | 设备列表行"命令"操作 → 命令抽屉（按 productId+deviceName 回查全部命令：状态可读文案/结果/失败原因/关联流程实例）；UNKNOWN 命令对 `iot:command:verify` 权限者显示"人工核实"→ 弹窗（结果方向 + 可信依据必填，提示审计口径）→ 提交后刷新并显示前后状态；无权限者显示"待独立授权核实"（仅监控视角不可改结果） | `modules/iot/views/IotDeviceList.vue`、`modules/iot/api/index.ts`（listDeviceCommands/manualVerifyCommand） |
| mock 验收台 | 批量受理/回查（含部分失败演示与重放幂等）、设备命令回查/人工核实（含依据缺失拒绝）handlers（标注临时） | `foundation/mock/handlers.ts` |
| 菜单与授权（Server） | 批量控制台菜单 9105（父级表单目录 2，component=workflow/views/TxnBatchConsole，权限 `form:action:invoke`）+ role 2 授权 9311；迁移链锚点同步（8 条） | Server `d5f60b2`：`R__p62_txn_batch_menu.sql`（PG/H2） |

## 2. 验证（本轮实跑，L/XL 四连门）

| 门 | 结果 |
|---|---|
| `pnpm typecheck` | exit 0（0 error） |
| `pnpm lint` | exit 0（0 error / 3 既有 warning：ListActionsColumn/StandardListTemplate require-default-prop，本批未引入新 warning） |
| `pnpm test` | exit 0；**1313 passed + 3 skipped**（基线 1309+3 → +4＝新增 `TxnBatchConsole.spec`：受理后自动回查与逐项定位/重放提示不重复执行/项键重复前端拒绝/无权限禁用） |
| `pnpm build` | exit 0（`✓ built in 2.67s`） |
| Server 迁移链 | `FlywayFullChainPostgresTest` 12、`FlywayFullChainH2Test` 17 全绿（R__ 4 条锚点） |

## 3. 身份与提交

- Web（develop，已推送远端并回读一致）：`19e1c47` → `c87a394`；Server（develop）：`fabf7a7` → `d5f60b2`（菜单种子）。Workspace gitlink 双仓同步（Server `d5f60b2`、Web `c87a394`）。
- 呈现原则（对齐首阶段）：状态用可读文案；不暴露队列、租约、调度等内部概念；批次/命令标识仅在业务回查确需处出现。

## 4. 剩余与边界

- 剩余切片：S6 兼容回滚演练（U06）+ 300ms/2s 预算实测（U08）+ 正式回执 `tiered-execution-unified-command-01.md`（EXECUTION_SUBMITTED）。
- 边界：正式可见浏览器验收（1920×1080/1280×720/1366×768/1024×768 四分辨率、真实后端链路截图）在 S6 阶段验收证据中统一收集；本批以四连 + 常驻回归测试 + mock 验收台可用为门禁。
