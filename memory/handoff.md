# 交接

2026-11-11｜规划｜1.0.0 阶段 3 验收通过（`planning-review-100-04.md`），执行方按 §3 做阶段 4—6，回执 `execution-100-05.md`。

## 当前

**1.0.0 阶段 3（XL）**：两仓 `feature/1.0.0`——Server `9fe3f11c`（已推送）、Web `3c5b5ec`（推送重试中，见下）；工作区 `develop-sw` 回执 `execution-100-04.md`。

- **U1**：根因是 `/form/data` 把 `timestamp` 列序列化为 UTC ISO（`2026-11-10T01:30:00.000+00:00`），`PrintSheet` 字符串分支字面截取成 `01:30`；context 接口无关。修复后 `PrintSheet` 与页面共用 `normalizeFormDateValue`，R1 三入口打印申请日期/到货时间/验收时间 `10:00/09:30/10:00` 与 PDF、页面逐字段一致；单测按评审口径（09:30→09:30）3/3。
- **U2**：PDF/Excel 日期按字段 `format`：datetime→`yyyy-MM-dd HH:mm`，缺省→`yyyy-MM-dd`。R3 到货时间/验收时间（纯日期）页面/打印/PDF/Excel 四处均为 `2026-11-12`；申请日期（datetime）四处 `yyyy-MM-dd HH:mm`。字段配置截图 + 定义 JSON 摘录入证。
- **U3**：明细表只读多选 1.0.0 前遗留缺陷（单元格未归一化）；`TableControl.cellValue` 过 `normalizeFormFieldValue` 后，三处页面「标签」列按勾选状态回显实际选中（✓蓝色 ✓绿色，红色未选）。单选/下拉核查正常。
- **门禁**：sw-biz-form-biz 280/0/0/0、sw-bpm-process 528/0/0/0 BUILD SUCCESS；Web typecheck 0 / lint 0 错（55 条既有警告）/ test 2060+3 / build 通过。未重跑多库、未重跑全量（评审豁免）。

## 隔离环境（供 Planner 复核）

- 克隆库 `smart_workflow_100` 不变；jar 19:35 重建（含 U2 服务端修复），Server 18093 19:37:23 重启（同参数 + 本机 `SW_CIPHER_KEY`）；Web 5275 直接服务最新源码。证据 19:41—19:42 生成。
- 克隆库 admin 口令已重置为仓库种子迁移 `R__0.1.10` 口径（本机会话丢失上轮口令；明文见仓库种子注释，不入回执/Git）。R1/R2/R3 数据未动。
- 证据：`product/v1.0.0-release/receipts/evidence/`（gitignore），`u1_*`/`u2_*`/`u3_*` 系列文件及时间戳见回执 A 节。

## 待办（下一回合确认）

- Web `3c5b5ec` 与工作区提交推送：GitHub 于 19:44 后短暂不可达（SSL_ERROR_SYSCALL，curl 000），Server `9fe3f11c` 已在网络中断前推成功；恢复后补推 Web 与工作区，回执 D 节以 Git 回读为准。

## 保留与保护

不变：不改写历史、不强推；不碰 Web `vite.config.ts` 未提交改动、`feature/ui-figma-align-20261027`、Server `feature/p62-perf-bounded-20261011`；不碰用户 8080/5173、`smart_workflow_f1v4b`、`smart_workflow_030`；保留 `.runtime-*`、凭据密文与 Server 隔离 worktree。隔离项（`smart_workflow_100`、18093/5275、sw100 账号、六库容器）验收后清理；UAT 仅 pg_dump 只读。

## 更早历史

0.4.1/0.3.8 PUBLISHED；0.4.0/P66 COMPLETED。
