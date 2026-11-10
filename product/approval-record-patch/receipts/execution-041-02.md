# Server 0.4.1 + Web 0.3.8 · 阶段 4—6 合并、发布、部署与同步（execution-041-02）

日期：2026-11-10｜执行（Executor）｜方向：`product/approval-record-patch/ready/direction-server-041-web-038.md`｜等级：L

## 1. 概要

阶段 4—6 完成：两仓 fix 分支 → develop → main 普通合入并 CI success；发布 Server **0.4.1** / Web **0.3.8** 并设为 Latest；UAT 先 Server 后 Web 部署；完成 W-c、W-a2（含 A1）、W-b2、W-e 复测与 R1a/R1b/R3b 拍图；三仓 README 图片与版本同步并回读。**七阶段 6/0/1，阶段 7 结束待 Planner 复核。**

- Server：`fix/0.4.1-approval-history` `f65bdeeb` → develop `99e7dad6` → main `09549a49`；tag `0.4.1`，Release `440170555`
- Web：`fix/0.3.8-approval-record` `1eeb716` → develop `46fdac1` → main `6e9b7313`；tag `0.3.8`，Release `440173998`
- UAT：Server `build.version=0.4.1`、health UP、Flyway 33 行/max 0.4.0；Web `assets/index-Cr8LY45m.js`、根/登录/健康 200

## 2. 阶段 4：合并与 CI

### 2.1 合入链

| 仓库 | 合并前分支 | develop | main（发布源） |
|---|---|---|---|
| Server | `fix/0.4.1-approval-history` `f65bdeeb` | `a74f8480`（合入）→ `7b20deae`（0.4.1-SNAPSHOT）→ `99e7dad6`（版本断言修复） | `09549a49`（merge） |
| Web | `fix/0.3.8-approval-record` `1eeb716` | `3967740`（合入）→ `46fdac1`（0.3.8） | `6e9b7313`（merge） |

### 2.2 Server CI 首跑失败与修复（如实记录）

首轮 Server CI develop `42788647121`、main `42788741242` 均在 **Resolve CI-friendly version** 步失败：发版工作流硬编码断言仍为 `0.4.0-SNAPSHOT`，而 pom 已收敛到 `0.4.1-SNAPSHOT`（`::error::develop 默认版本必须为 0.4.0-SNAPSHOT，实际 0.4.1-SNAPSHOT`）。修复 `99e7dad6` 同批更新四处：`pom.xml` 注释、`.github/workflows/build-release.yml` 注释/断言/`-Drevision`、`scripts/check-version-identity.sh` 断言/注释、`scripts/build-prod.sh` 注释；本机 `bash scripts/check-version-identity.sh workflow` PASS。修复后：

| CI | run | 结论 |
|---|---|---|
| Server develop `99e7dad6` | `42789327773` | **success** |
| Server main `09549a49` | `42789343743` | **success** |
| Web develop `46fdac1` | `42788699711` | **success** |
| Web main `6e9b731` | `42788760585` | **success** |

Server 全量测试 2,482 / 0 failures / 0 errors / 45 skipped（CI 与本地一致；含新增 `ApprovalHistoryDeptPostgresTest`）。CI 日志中 `P62ReceiptBoundaryPgTest` 启动后约 5 分钟无新行，最终 5/0/0 通过、run success，属该测试启动/收尾耗时，非失败。

### 2.3 已合入分支删除

`merge-base --is-ancestor` 对 main/develop 均为 TRUE 后删除：Server `fix/0.4.1-approval-history`（tip `f65bdeeb`）、Web `fix/0.3.8-approval-record`（tip `1eeb716`），本地与远端同步删除；回读两仓只剩 `main`、`develop` 与未完成分支。

## 3. 阶段 5：tag 与 Release

| 仓库 | tag → commit | tag 对象 | Release | 资产 | sha256 |
|---|---|---|---|---|---|
| Server | `0.4.1` → `09549a49` | `addce449` | `440170555` | `bootstrap-0.4.1.jar` 236,251,001 B | `fe6ad3ede4a6511ac716b31eff515606ff826f196752bcf7a220b842f29ca3e4` |
| Web | `0.3.8` → `6e9b7313` | `4f1d380f` | `440173998` | `sw-web-dist-0.3.8.zip` 6,198,159 B | `c61e06179898a3558c0af365e1994453ce90d05f589f17601d10f16afd9ff1b4` |

- 两仓 `releases/latest` 回读分别为 `0.4.1`、`0.3.8`（`make_latest=true`）；既有语义 Release（0.4.0/0.3.7 及更早）与 tag 未改动。
- 资产取自对应 `build-<sha>` Release（Server `440167575`、Web `440151139`），上传后状态 `uploaded`、字节一致。
- 创建前确认 `0.4.1`/`0.3.8` tag 不存在；tag 为 annotated，已推送。

## 4. 阶段 6：UAT 部署

### 4.1 部署前检查与备份

- 根分区余 **6.3G**（≥3G）；DB 28 MB；UAT 原 Server 0.4.0（jar sha256 `188be963…`），Flyway 33 行/max 0.4.0。
- 备份：`/data/backup/smart_workflow_20261110_1746_pre041.dump`（1.3M）、`bootstrap.jar.bak-pre041`（sha256 `188be963…`）、`server.env.bak-pre041`、`web.bak-20261110_1751_038pre`。

### 4.2 Server

- 上传 `bootstrap-0.4.1.jar` → `bootstrap.jar.new`，服务器侧 sha256 `fe6ad3ed…` 与 Release 一致；`STOP_TIMEOUT=30 ./stop.sh` 停止 PID 3361126，8080 释放；替换后启动 PID 3382210。
- **health 200（160s）**；`META-INF/production-build.properties` `build.version=0.4.1`；`flyway_schema_history` **33 行、max(version)=0.4.0**（无新增行）。
- 启动后日志无新 ERROR；3 条 `REPLAY DETECTED` 均为旧 PID 3361126 在 09:17/11:45/12:53 的记录，非本次启动。

### 4.3 Web

- 上传 `sw-web-dist-0.3.8.zip`，备份原 `/opt/smart-workflow/web` 后解压 `dist` 落位；入口 `assets/index-jYV2b5yF.js` → **`assets/index-Cr8LY45m.js`**；`nginx -t` 通过并 reload。
- 回读：根 `/` 200、入口 JS 200、`/sw-server/api/actuator/health` 200、`/login` 200，根 HTML 引用新入口。

## 5. UAT 复测与拍图

### 5.1 W-c 会签意见与部门（R1b）

`admin` 的「我发起的」实例 `YJ-20261108-009`（task `f14da4a5-db50-11f1-8842-00163e0d142f`）任务详情 9 行历史，均返回 `opinionFields` 与 `assigneeDept`；「分公司技术委员会会签」3 行：

| 审批人 | 部门 | 意见摘要 |
|---|---|---|
| 冯雪 | 运维保障部 | 风险评级：中 · 影响系统清单：办公系统、营销系统 · 预计停机时长（分钟）：300 |
| 杨帆 | 基础设施部 | 风险评级：中 · 影响系统清单：通信系统 · 预计停机时长（分钟）：240 |
| 刘洋 | 网络与信息安全部 | 风险评级：中 · 影响系统清单：调度自动化、通信系统 · 预计停机时长（分钟）：300 |

- 会签记录弹窗（`task 77f721a2…`）3 行，「所属部门」与「动作/意见」摘要完整；截图为 2880×1800（1440×900@2x），482,332 B。
- R1b 视角与 `sample-a.png` 不同（弹窗覆盖在审批详情之上，背景可见会签记录列表）。

### 5.2 W-a2 + A1（R1a）

`/agent/graph-designer/2118772551352672258`（MES 温度偏离智能研判 v8，1440×900）：

- 节点 7、连线 6；**source 右侧 handle 7/7、target 左侧 handle 7/7**；fit 缩放 **0.616822**。
- 节点与连线标签 CSS 20px → **渲染 12.34px（≥12px）**；连线标签 `RAPID_RISE` 同口径。
- 图横向宽度 **1070px / 画布 726px → 0.909（≥60%）**；节点类型 `vf-node-start/knowledge/llm/condition/end` 均保留，无 `default` 回退。
- 截图 2880×1800（286,945 B），属性面板打开到 LLM 节点，节点文字清楚。

### 5.3 W-b2 长表单

只读打开 `YJ-20261108-009` 的已完成 task `f14da4a5-db50-11f1-8842-00163e0d142f`：

| 视口 | 表单高度 | `.instance-flow-panel` | 页签内容区 | scrollWidth/clientWidth | 页签 |
|---|---:|---:|---:|---|---|
| 1440×900 | **1218px** | **447px** | 399px | 1440/1440 | 流转记录/流程图/审批详情 |
| 1920×1080 | 1218px | **445px** | 397px | 1920/1920 | 同上 |

面板未被压缩、页签可切换、无横向溢出；截图为 1440×900@2x 与 1920×1080@2x。

### 5.4 W-e 实例列表时间

`/workflow/instances` 前 8 行「发起时间」：`2026-11-08 16:35`、`16:13`、`16:12`、`13:23`、`13:20`、`13:18`、`05:05`、`05:05`；`hasT=false`，无微秒。截图 2880×1800。

### 5.5 R3b 示例 b

- 入口：`/workspace/my-instances` 搜索/翻页定位 `XY-20261108-015`（task `0d62d825…`，实例 `2119298884948250625`），侧栏高亮 **我发起的**；入口截图 `r3b-entry.png`（2880×1800，328,582 B）。
- 打开「查看」→「流程图」：画布 1408×740、内容宽 1202 → **占宽 0.854（≥80%）**；**topClipped=false、bottomClipped=false**；缩放 56%（fit 47% 后放大一次并向下平移 100px）。
- 图内截图 `r3b-sample-b.png` 3840×2160（215,190 B）。因详情弹窗为 100vw，图内截图无法同时显示侧栏；同轮 `r3b-entry.png` 与 DOM 断言（弹窗前/后均「我发起的」）共同证明入口与高亮一致。

## 6. README 与仓库同步

- 三仓 `docs/assets/readme/`：`agent-graph.png`（R1a）、`approval-detail.png`（R1b，新建）、`sample-b.png`（R3b）全部替换；三份 README 新增「会签记录」预览并更新版本为 Server 0.4.1 / Web 0.3.8。
- 提交：Server `cffce87d`（develop）→ `e2beb027`（main）；Web `c5b1b87`（develop）→ `65594c0`（main）；根 `952ec5fa`（develop-sw）。
- GitHub raw 三仓三图均 200 且字节一致（286,945 / 482,332 / 215,190 B）；远端 README 均含 1 处 `approval-detail.png` 引用与 0.4.1/0.3.8 版本行。
- 禁用词（Owner/Planner/Executor/UAT/MVP/回执/门禁/终态/验收/返修/补丁/列车/口径/收敛/防腐/实例编号/sha256/Release id/已完成）三份 README 均 **0**；本地图片路径全部存在；外链 14 条（去重）均 200（两条 404 为提取时相邻链接拼接伪影，非实际链接）。
- README 同步提交触发的 CI（仅文档）：Server develop `42800650508`、main `42800661326`，Web develop `42800707632`、main `42800724109`；写本回执时 in progress，结果由阶段 7 复核前回读（预期 success）。

## 7. 门禁汇总

| 项 | 结果 |
|---|---|
| Server 全量 `mvn test` | 2,482 / 0 / 0 / 45 skipped |
| 真实 PG `ApprovalHistoryDeptPostgresTest` | 1 / 0 / 0 |
| 受影响单测（BpmTodo/BpmMyInstance） | 43 / 0 / 0 |
| Web typecheck / lint / unit / build | 通过 / 0 errors / 2,054 passed + 3 skipped / 4.96s |
| Server CI（代码合并） | develop `42789327773`、main `42789343743` success |
| Web CI（代码合并） | develop `42788699711`、main `42788760585` success |
| 版本一致性 workflow 自检 | PASS（`check-version-identity workflow`） |

## 8. 证据文件（`receipts/evidence/`，本地、不入 Git）

`r1a-agent-graph.png`、`r1b-approval-detail.png`、`r3b-sample-b.png`、`r3b-entry.png`、`w-b2-uat-1440.png`、`w-b2-uat-1920.png`、`w-e-uat-list.png`；测量 `uat041-measures.json`（W-a2/W-e）、`uat041-final.json`（W-c/W-b2）、`uat041-shots2.json`（R1b/R3b）、`uat041-entry.log`；工具 `uat041-*.mjs`、`ocr-cap.py`、`stage5-release.sh`；Release notes 底稿 `release-notes-*.md`。

## 9. 偏差与说明

1. **UAT 对象编号差异**：UAT 管理员的 YJ 实例为 `YJ-20261108-009`（隔离克隆库中的 008 在 UAT 不存在），选用 009 同流程同会签链；XY 任务/实例与 0.3.7 一致（`XY-20261108-015`）。
2. **R3b 侧栏**：详情弹窗 100vw，图内截图无法同框侧栏；以入口图 + DOM 断言证明「我发起的」高亮一致，图为 85.4% 宽、上下不裁。
3. **W-b2 高度**：UAT 表单 1218px（隔离环境 1128px），均 ≥1000px；面板 447/445px、页签可切换。
4. **R1b 侧栏**：直接打开任务详情页时侧栏高亮为「待办任务」；R1b 未要求侧栏，证据以会签弹窗内容为准。
5. **README CI**：写回执时四个文档 CI 仍在跑；不改变代码/制品与 tag，Latest 不会被子构建顶替（工作流 `--latest=false`）。
6. **本机隔离环境清理**：`18092`（Java，PID 4548）与 `5274`（Node，PID 43184）已按精确 PID 停止，端口无监听（`Get-Process` 两 PID 均不存在）；`smart_workflow_041` 数据库暂留至阶段 7 后清理，不影响本机其他库。

## 10. 下一步

Planner 复核阶段 4—6、UAT 证据与 README 回读；通过后进入阶段 7 结束。若需调整 R3b 呈现方式或补拍，请指出具体口径。
