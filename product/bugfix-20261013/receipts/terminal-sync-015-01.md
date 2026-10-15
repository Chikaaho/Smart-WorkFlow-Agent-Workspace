# 0.1.5 终态同步（回执）

2026-10-15｜Executor｜终态同步已执行（提交规划复核）。唯一输入裁决：`planning-review-release-015-01-passed.md`；入口：`../ready/direction-terminal-sync-015.md`。本轮**只做信息/文档/授权 Git 收尾**：未运行迁移、未重新部署、未重复业务测试、未追加哈希计算。

## 1. 唯一终态值落地核对（与方向 §唯一终态值清单逐项一致）

| 字段 | 目标值 | 落地位置与结果 |
|---|---|---|
| 功能状态 | bugfix-20261013 **COMPLETED（规划验收通过，终态同步待复核）** | knowledge 当前状态/交接、memory 四入口、台账终态节、需求池路由 |
| 功能登记数 | 48（本列车新增 0） | 同上（未新增/未核销 P 编号） |
| 清单/P 计数 | 46/22/22=90；P64 既有核销保持；ADV64、问题57 保持 | 同上 |
| 修复范围 | BF001—053 Owner 关闭；R015-01/02 规划 PASSED | 台账补充表 + 台账「终态」节 |
| 阶段 | 5/0/0 | 同上（原“4/1/0、UAT 收尾进行中”已纠正） |
| 版本 | 0.1.5；开发默认 0.1.5-SNAPSHOT、正式构建 `-Drevision=0.1.5` | memory/knowledge/台账/两仓 README |
| 主迁移 | 每支持方言一个 `V0.1.5__baseline_seed.sql`；repeatable 边界按发布结果 | memory/knowledge/台账/运维手册 §8.3 |
| 活动功能 | 无；应用中心仅下轮候选；P62 延期/OFF 保持 | 需求池路由、memory |
| 唯一下一动作 | Planner 复核 `terminal-sync-015-01.md` | knowledge 当前状态/交接、memory、台账、需求池 |
| 方向目录 | 主方向 `passed/direction.md`、发布方向 `passed/direction-release-015.md`（Planner 已归档）；终态同步方向 `ready/direction-terminal-sync-015.md`（复核后归档） | 目录实测 |
| 验证基线 | BF015-VB01—VB04（值见方向 §；P64 等历史集合不覆盖） | memory 四入口、knowledge 顶部条目、台账 |

## 2. 同步覆盖矩阵（入口 / 实际值 / 来源 / 核实时点）

| 入口 | 实际同步内容 | 来源 | 核实时点 |
|---|---|---|---|
| `knowledge/current-status.md` | 顶部“当前值”条目重写为 0.1.5 终态（COMPLETED 待复核、5/0/0、48/46/22/22、0.1.5、BF015-VB01—04、下一动作 Planner 复核）；删除执行方此前重复的阶段Ⅳ/Ⅴ条目 | 本批编辑 | 2026-10-15 终态同步 |
| `knowledge/session-handoff.md` | 同上 | 本批编辑 | 同上 |
| 任务台账 `product/bugfix-20261013/bug-ledger.md` | 新增「终态（0.1.5）」节（状态/阶段/版本与迁移/计数/基线/Git/下一动作）；R015-01/02 行=已通过（规划验收 2026-10-15） | 本批编辑 + Planner 前序修正 | 同上 |
| 方向链接 | `passed/direction.md`、`passed/direction-release-015.md` 已归档；`ready/direction-terminal-sync-015.md` 为当前唯一执行入口 | 目录实测 | 同上 |
| 需求池 `todo/requirement-pool.md` | 新增「当前路由（2026-10-15 本轮）」= 0.1.5 列车终态；原 P64 路由降为历史行；应用中心保持下轮候选 | 本批编辑 | 同上 |
| memory 四入口（README/features/state/handoff） | 统一为：COMPLETED（规划验收通过，待终态同步复核）、5/0/0、48/46/22/22、0.1.5、BF015-VB01—04、下一动作 Planner 复核；压缩为状态/限制/证据指针，删除重复长段与例行哈希/校验值 | 本批编辑 | 同上；体积 19,749 B（<20KB），单文件最大 4,004 B（<5KB） |
| 根项目入口 `README.md` | **无发布/版本/目录条目**（不适用，如实记录；未改动） | 全文检索 | 同上 |
| 代码仓 README/版本入口 | Server `README.md`：当前发布版本 0.1.3→**0.1.5**、「当前版本」节同步（提交 `d7d376f`）；Web `README.md`：同（提交 `3687d04`），并写明根路径 `/`、旧 `/sw` 301、API `/sw-server/api` | 本批编辑 + 子仓提交 | 同上 |
| 工程版本文档 | Server `pom.xml` revision=0.1.5-SNAPSHOT（`8c25932` 批次）、Web `package.json` 0.1.5（`02807fc` 批次）——前批已提交，本批未改 | 子仓回读 | 同上 |
| 运维手册 `docs/ops/production-ops.md` | §1 拓扑、§4 入口表、§6.3 健康检查、§8.2 前端升级验证、§8.3 迁移边界、§9.1 备份与恢复入口 → 根路径 `/` 挂前端、旧 `/sw*` 301（保留子路径）、`/sw-server/` 与认证回调保留、0.1.5 单一种子 + `db/upgrade/0.1.5/` 两个一次性脚本（备份→停服→执行→启动核对）与整体备份/恢复模式 | 本批编辑 | 同上 |
| 开发声明 | `ready/development-declaration.md` **继续适用、未改动**（不因归档重新引入旧种子链；旧链仅作 `db/upgrade/0.1.5/legacy-0.1.x` 档案） | 未改动 | 同上 |
| 任务登记 | `knowledge/features/` 下**不存在**本任务登记文件（本任务为修复发布列车，非业务功能登记）；实际登记面即 current-status/session-handoff 与台账，已同步 | 全仓检索 | 同上 |

## 3. 已纠正的当前表述

1. **备案/根路径“待执行”** → 台账 R015-01/R015-02 = 已通过（规划验收 2026-10-15）；登录页备案号与域名根路径均已上线并有浏览器验收证据。
2. **旧“未合并发布”** → 已合并并发布：Server `8c25932`、Web（发布时点 `b069620`，终态同步文档批 `3687d04`）进入各自修复分支/develop/main 并推送回读；UAT 实际运行 0.1.5。
3. **“全仓 290”计数口径** → 更正为：本次 Server 全 reactor **351 个测试类合计 2051/3/0/27、BUILD FAILURE**；`290/3/0/27` 是 **bootstrap 模块子集**汇总，不与全量相加、不称全仓全绿；3 项失败为 `P63ImmediateMqttBrokerPgTest`、`P63ReservationUnknownPgTest`、`Phase4PgStartWindowCrashTest`（既有环境/时序限制，按规划审查记录保留）。
4. **“未修改迁移历史”** → 更正为**受控、备份后的历史衔接**：先备份（DB dump 与配置/制品副本），再执行仓库内一次性脚本（`transition-history-to-0.1.5.*` / `upgrade-to-0.1.5-from-0.1.1.*`），审计记录保留（未删除 `flyway_schema_history` 之外任何记录，历史行替换本身即脚本行为且有回读与备份可恢复）。
5. **应用中心/表单分类统一** → 仍为下轮候选（本条路由不改其候选状态）；原站点服务（reasonix）保留未停未删；**UAT 验收表单/流程/已办实例保留**，不在本任务清理。

## 4. Git 结果（回执核实时点，非实时 HEAD）

| 仓 | 本批动作 | 结果 |
|---|---|---|
| Smart-WorkFlow-aPaaS-Server | `README.md` 发布入口同步（docs(release)） | `d7d376f`：`codex/bugfix-20261013` = `develop` = `main`，`git ls-remote` 回读一致 |
| Smart-WorkFlow-aPaaS-Web | `README.md` 发布入口同步（docs(readme)） | `3687d04`：三 ref 回读一致（`b069620` 为前一时点） |
| 根（Smart-WorkFlow-Agent-Workspace） | 本终态同步文档批：台账/需求池/运维手册/memory/knowledge/本回执 + 子仓 gitlink 更新 | 分支 `develop-sw`；提交与推送回读见交付说明（本回执不自引自身提交） |

约束遵守：只提交本批文件、保留无关工作（`changed-files/` 未动）；普通提交推送、根保持规划分支、子仓引用已核实（gitlink 指向上述已推送提交）；**未强推、未修改任何历史提交信息**（此前 `d56ffdae` 的信息污染以补记提交 `a15de643` 说明，原提交保持原样）。

## 5. 未覆盖/如实登记

- 性能类验证、三方 SSO（企微/飞书/钉钉）回归不在本次证明范围；1280×720 极矮视口备案行需少量滚动（规划已裁决为可接受）；UAT 验收对象留作已知残留。
- `release/` 工作区目录仅到 `0.1.3`：0.1.5 未放置独立发布包（发布通道为运维手册直接部署），两仓 README 已指向实际材料位置（工作区 `docs/ops/production-ops.md`、仓库 `db/upgrade/0.1.5/`、工作区 `product/bugfix-20261013/receipts/`）；未新建 tag/Release。
- 本回执为终态同步交付，达到“入口一致、计数不变、归档路径正确、Git 结果可读”后提交规划复核；**整体 COMPLETED 由规划确认**，执行方不自行宣告。
