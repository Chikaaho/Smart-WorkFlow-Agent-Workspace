# I4 追加补证证据 manifest（evidence/i4-02）

> 生成：2026-09-12（Executor）
> 追加回执：`product/v0.1.0-oa-completion/receipts/stage-i4-v0.0.3-oa-iteration-02.md`

## 候选身份

| 项 | 值 |
|---|---|
| 工作区 HEAD | `f10d6a9714aaf4694be18a18f65b767825fe84ff`（develop-sw） |
| Server 仓 HEAD | `c18d074f4c9f85c5baf65af222e159437fb1e509`（I3 锁定候选；I4 改动为工作树未提交，文件清单 `worktree-server-files.txt` 64 项） |
| Web 仓 HEAD | `192e0647a8f1b1e2b270d4ea13e87854b247fcc7`（I2/I3 候选线；I4 改动为工作树未提交，文件清单 `worktree-web-files.txt` 14 项） |
| 迁移链 | H2/PostgreSQL 同一迁移身份 V1—V82（I4 新增 bpm V76—V79 + V82 运营菜单种子；openapi V80/V81） |

## 目录索引

- `http/` — 真实后端 HTTP 行为链原始响应（dev H2 实例，真实挑战登录，脚本 `i4-login.mjs`、`i4-e2e.mjs`、`i4-e2e2.mjs`、`i4-e2e3.mjs`、`i4-e2e4.mjs`、接收器 `i4-receiver.mjs`）
- `h5/` — 浏览器真实交互截图（`pc-workspace-6cards.png` 统一工作台六卡；`login-leader1-mobile.png` 375px 移动登录）
- `mvn-full-fae-raw.log` — 全 reactor `mvn test -fae` 原始输出（唯一失败=IoT 沙箱 6 例既有基线；BPM Process/Bootstrap 因 fae 下游跳过，由下一条日志独立覆盖）
- `mvn-bpm-bootstrap-raw.log` — `mvn -pl sw-bpm-process,sw-bootstrap test` BUILD SUCCESS 原始输出（198/0/0/0 + 44/0/0/0；含 FlywayFullChain H2 15/15、PG 12/12、I4TenantIsolationPostgres 2/2、H7 无本机 PG 时 assume 跳过）
- `frontend-gates-final.txt` — 前端四连最终记录（typecheck/lint/test/build 退出码 + vitest 计数）
- `server-dev.log` — dev 后端运行日志（含 Flyway 82 迁移、IoT 空集合命令失败原因、回调重试记录）

## G 缺口 → 关键证据文件对照

| 缺口 | 证据 |
|---|---|
| I4-G1 动态并行真实链 | `dyn-submit.json`、`verify` 系列（`dyn-todo-leader1/2.json`、`dyn-branches(-after).json`、`dyn-instance-detail(-after).json`：3 部门→2 冻结分支去重勾稽、ALL 汇聚 APPROVED）、`fz-*`（冻结后改 leaderId：before/after leader 一致）、`dyn-my-instances-after`、空集合负向=server-dev.log FLOW_START 命令以 DYNAMIC_BRANCH_EMPTY 失败（退避重试后 FAILED 终态） |
| I4-G2 模板/监控/分析 | `tpl-create/copy/copy-disabled`（复制 0、停用后复制 400）、`tpl-outsider-list-fresh`/`mon-outsider-fresh` 原始 403、`mon-suspend/resume/transfer/interventions`（3 条审计、前后状态勾稽）、`analytics-summary`（真实实例 launched 2/completed 1/running 1、工作量分布） |
| I4-G3 批量/交接 | `batch-result.json`（同批 1 成功 + 403 越权失败，逐项呈现；另有 2400 已终态任务失败变体）、`batch-summary.json` 实例状态一致、`hv-result/hv-items/hv-retry`（迁移 2、清单逐项、重试 0 重复） |
| I4-G4 工作台/H5 | `h5/pc-workspace-6cards.png`（默认工作台六组件）、`h5/login-leader1-mobile.png`（375px）、移动办理链（DOM 证据：办理对话框→「已办理」alert→待办清空）；实例状态经 `dyn-branches-after`：分支 1 APPROVE（H5 办理）、分支 2 START（未办理）→ RUNNING 正确 |
| I4-G5 OpenAPI HTTP | `openapi-*.json`（发起 0、幂等重放 true、无签名 3002、越租户/不存在 3007、nonce 重放 3004）、`oa-status.json`、`oa-complete.json`、`openapi-callback-received.json`（真实 HTTP 对端收到的签名回调：X-Callback-Signature + PROCESS_APPROVED 白名单载荷）、server-dev.log 回调失败重试与最终失败记录（失败可查不回滚） |
| I4-G6 库/租户/候选 | 本 manifest + 两条 mvn 原始日志 + `I4TenantIsolationPostgresTest`（zonky 真实 PG + V1—V82 全链 + 四象限租户隔离 2/2）+ Agent 排序修复（3 连跑 13/13 且全 reactor 中 Agent 346/0） |
| I4-G7 回执一致性 | 回执 02 的 work_items 与本 manifest 对照；`remaining_actionable_count=0` |
