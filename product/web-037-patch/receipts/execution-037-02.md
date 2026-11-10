# Web 0.3.7 补丁 · 合并、发版、部署与发布后同步（execution-037-02）

日期：2026-11-10｜执行（Executor）｜方向：`product/web-037-patch/ready/direction-web-037-patch.md`｜等级：L

## 1. 概要

阶段 4—6 完成：两仓合入 develop→main，Web 0.3.7 发布并部署 UAT，README 补图与信息同步落盘。W-a、W-b、W-d 已在 UAT 0.3.7 实测通过；W-c 按停止条件停在需 Server 改动，待 Owner 裁决。阶段进度（七阶段）：评估、实施、合并、发版、发布后同步已完成；**验收与同步待 Planner、结束未开始 → 5/1/1**。

## 2. 合并链与 CI

### Web（`Smart-WorkFlow-aPaaS-Web`）

| 项 | 值 |
|---|---|
| 修复分支 | `fix/0.3.7-ui-defects` @ `6031b51`（阶段 2） |
| develop | `bda1b49`（合入）→ `abd282e`（版本收敛 0.3.7）→ `8ca464a`（README 版本）→ `8d43bec`（CI 源覆盖应急）→ `8ed560e`（属性面板回归修复 cherry-pick）→ `faf4b00`（README 截图） |
| main | `b91f833`（首次合并）→ `97bfa14`（CI 源覆盖）→ `a6781c8`（属性面板回归修复，**tag 0.3.7 指向**）→ `d0cdcf5`（README 截图） |
| CI | develop `42749641359` 失败（npmmirror 网络）→ 覆盖后 `42755335137` success；main `42754025620` success（`97bfa14`）；修复提交 main `42755323841` success；README 合并后 develop `42759844784`、main `42759860970` 随本回执提交时在跑（结论见 §9 回读） |
| 版本来源 | `package.json` `version=0.3.7`（CI 产物命名与 `build-<sha>` Release 均取此值） |

### Server（`Smart-WorkFlow-aPaaS-server`）

| 项 | 值 |
|---|---|
| 文档分支 | `docs/license-readme-20261110` @ `d672760` |
| develop | `bca196c2`（合入）→ `f584bd04`（README 截图） |
| main | `eacab652`（合入）→ `9a76314f`（README 截图） |
| CI | develop `42749703133` success、main `42749714010` success；README 合并后 develop `42760022678` 首次失败（`AgentModelManageServiceImplTest.listEnabled_shouldExcludeProviderDisabledModels`，H2 `SMALLINT`/`BOOLEAN` 既有测试，与文档提交无关）→ 重跑；main `42760040390` 在跑 |
| 版本 | 未打 tag、未发语义 Release（按方向 §2.3）；CI 自动 `build-<sha>` Release 属既有工作流行为，未改动其他 Release |

### CI 源覆盖应急（Owner 2026-11-10 批准）

- `registry.npmmirror.com` 从 GitHub runner 持续 502/504/socket timeout，pnpm install 连续失败（Web 主分支 3 次、develop 2 次）。
- 处理：`build-release.yml` 的 Install dependencies 步骤加 `npm_config_registry: https://registry.npmjs.org`，`--frozen-lockfile` 不变；提交 `8d43bec`/`97bfa14`。
- **待还原**：镜像恢复后去掉该 env 并回读（已登记为后续项，不混入本次发布事实）。

## 3. 发布事实（Web 0.3.7）

| 项 | 值 |
|---|---|
| tag | `0.3.7` → `a6781c87ee0839e120141df9ec89dcb3a36dd44a`（lightweight，同 0.3.6 风格） |
| Release | `439939910`，标题 CH-aPaaS-Web 0.3.7（界面缺陷修复与 MIT 许可证），Latest=0.3.7 |
| 资产 | `sw-web-dist-0.3.7.zip` **6,198,405 B**，sha256 `1bb0d03cd120af5cc82156dedb742810148c833ab6c39c442599449cf2b1dabb`（下载回读 200 同字节） |
| CI 构建 Release | `build-a6781c8…` = `439946104`（同字节来源）；首版 `build-97bfa14…` = `439939357` 保留为历史构建 |
| 同版本重发 | Owner 2026-11-10 批准：首版 `97bfa14` 含属性面板类型回归，修复后 tag 移到 `a6781c8`、Release 资产替换；0.3.0—0.3.6 与其他 Release 未改动 |
| 许可证识别 | Web、Server `GET /license` → `spdx_id=MIT`，`path=LICENSE` |

## 4. UAT 部署

| 项 | 值 |
|---|---|
| 部署前磁盘 | `/dev/vda3 20G 12G 6.4G 66%`（≥3G） |
| 上传校验 | 服务器上 `sw-web-dist-0.3.7-v2.zip` sha256 = `1bb0d03c…`（与 Release 资产同字节） |
| 备份 | `web.bak-20261110_037`（首版 0.3.7 前）、`web.bak-20261110_037pre`（首版 0.3.7，含回归） |
| 部署后入口 | `/opt/smart-workflow/web/index.html` → `assets/index-jYV2b5yF.js` |
| 回读 | `https://chikaho.cn/` **200**；`/assets/index-jYV2b5yF.js` **200**；`/sw-server/api/auth/challenge` **200**；磁盘 6.3G 66% |
| 说明 | 两次部署（首版、修复版）均只替换 Web 静态资源，未动 Server、数据库、容器；W-c 验证只读打开既有实例 |

## 5. UAT 行为验证（0.3.7，可见浏览器 1440×900 / DPR2）

| 项 | 实际结果 | 证据（`receipts/evidence/`） |
|---|---|---|
| W-a | 打开「MES 温度偏离智能研判」v1：7 个节点全部有外框与底色，边框/底色按类型区分（START `rgb(24,166,122)`/浅绿、KNOWLEDGE `rgb(124,58,237)`/浅紫、LLM `rgb(37,99,235)`/浅蓝、CONDITION `rgb(229,72,77)`/浅红、END 同 START），连线接点正常；点 LLM 节点属性面板标题为「LLM 调用」并显示供应商/模型配置/系统 Prompt/用户 Prompt 模板/输入输出变量（回归已修复） | `readme-agent-graph.png`、`w-a-node-styles.json`、`uat-graph-list-check.png` |
| W-b | 只读任务详情（已处理列表「详情」）：1440×900 面板 131px、页签内容 83px；1920×1080 面板 137px、内容 89px；`scrollWidth=clientWidth`（两档）；流转记录/流程图/审批详情可切换 | `w-b-task-detail-uat-1440.png`、`w-b-task-detail-uat-approval-tab.png`、`w-b-task-detail-uat-1920.png`、`w-b-uat-1440.json`、`w-b-uat-1920.json` |
| W-c | **未完成**：任务详情 `GET /workflow/tasks/{taskId}` 的历史行没有 `opinionFields`（`BpmTodoController` 未接 `resolveOpinionFields`，仅「我发起的」实例详情接），DTO 无 `assigneeDept` 字段。必须改 Server；按方向停在 W-c，请 Planner 报 Owner 确认是否发 0.4.1 | 回执 037-01 §6 |
| W-d | 流程监控实例详情抽屉：发起时间 `2026-11-08 16:35` 等全部为 `yyyy-MM-dd HH:mm`，抽屉文本无 `T`、无微秒；开始/完成时间同格式 | `w-d-instance-drawer-uat-1440.png`、`w-d-uat-times.json` |

补充：本地 mock 环境的 W-b 复现与对照（修复前裁切、修复后 112/64px）见 `w-b-task-detail-1440.png`、`w-b-task-detail-approval-tab-1440.png`；W-a 的 dev 渲染故障为既有环境问题（stash 对照原代码同为 0 节点），已在阶段 2 回执 §5 说明。

## 6. README 补图与文字

| 项 | 结果 |
|---|---|
| R1 | `agent-graph.png`：2880×1800（1440×900@2x），**284,572 B**，脱敏，LLM 属性面板打开可读。`approval-detail.png`：**暂缓**——R1 要求展示 W-c 修好的意见摘要与部门，W-c 未完成，不拍不带修复内容的替代图 |
| R2 | `agent-graph.png` 已放入三仓 `docs/assets/readme/`（根 README 新增「智能体编排」预览表；Web README 预览表新增一行；Server README 在流程设计器图后新增）；`sample-b.png` 三仓同文件替换。GitHub raw 三处 200（284,572 B） |
| R3 | `sample-b.png` 重拍：校园出入口异常事件分级处置（XY-20261108-015，task `0d62d825-db34-11f1-8842-00163e0d142f` 的流程图视图），顶部节点行完整不再被裁；左侧菜单高亮仍为「待办任务」（与原图一致，进入路径为任务图视图）——是否算“与页面一致”请 Planner 判定 |
| R4 | Server README「临届停机线」→「临界停机线」完成 |
| R5 | 三份 README 版本描述：Web 0.3.7 / Server 0.4.0；禁用词 grep（Owner/UAT/回执/返修/sha256/Release id 等）三份均 0 命中；三份相对链接全部存在、外部链接 14 条全部 200（含两仓 LICENSE） |
| L1—L3 | 两仓 `LICENSE`（MIT，Copyright (c) 2026 Chikaho）；README 徽章/许可证段落；Server `pom.xml` `<licenses>`；Web `package.json license`；GitHub `license.spdx_id=MIT` 两仓回读 |

## 7. 覆盖矩阵（`roles/executor.md` §4.5）

| 入口 | 受影响 | 目标值 | 实际处理 | 回读 |
|---|---|---|---|---|
| `version.json` | 是 | Web 0.3.7、发布与部署事实 | 已更新 development/developmentVersion/projections/rules | 文件通读 |
| `CHANGELOG.md` | 是 | 0.3.7 条目 | 已新增（背景、四项缺陷、许可证、验证、发布事实、回执） | 文件通读 |
| `knowledge/current-status.md` | 是 | 0.3.7 当前段 | 新增当前状态段（修复结果、发布/部署、W-c 待裁决、后续项） | 文件通读 |
| `knowledge/features/multi-database-compat.md` | 否（P66 功能档案） | — | Z4 时点项，17:16 后处理 | 不适用 |
| `memory/state.md`、`handoff.md`、`features.md`、`README.md` | 是 | 当前任务与发布事实 | 4 份已更新（合计 20,561 B） | 文件通读 |
| `todo/web-ui-defects-20261109.md` | 是 | W-a/b/d 修复、W-c 待裁决、补图状态 | 已更新结果段 | 文件通读 |
| `todo/requirement-pool.md` | 是 | 0.3.7 状态 | 改「待验收」并写执行结果与七阶段 5/1/1 | 文件通读 |
| 根 `README.md` | 是 | 许可证说明、智能体编排预览 | 已更新；`docs/assets/readme/agent-graph.png`、`sample-b.png` 入 Git | GitHub raw 200 |
| Web `README.md` / `docs/assets/readme/` | 是 | 0.3.7、许可证、两张图 | 已更新并合入 main `d0cdcf5` | raw 200、链接 200 |
| Server `README.md` / `docs/assets/readme/` | 是 | 许可证、临界、两张图、版本 0.4.0 不变 | 已更新并合入 main `9a76314f` | raw 200、链接 200 |
| Web `package.json` | 是 | version 0.3.7、license MIT | 已更新 | CI 产物命名回读 |
| Server `pom.xml` | 是 | `<licenses>` MIT | 已更新 | GitHub license 识别 |
| CI/CD `build-release.yml` | 是 | 安装步骤临时官方源 | 已提交；镜像恢复后还原（后续项） | 运行记录 |
| 发布/部署事实入口 | 是 | tag/Release/资产/入口 | §3、§4 已记录并回读 | API/HTTP 回读 |
| `docs/ops/production-ops.md` | 否 | 部署方式未变（仅替换 Web 静态资源） | 不适用，未改 | — |

残留检索：三份 README 无 0.3.6 现存版本表述（Web README 版本段、徽章、搭配说明均已 0.3.7；历史版本表保留 0.3.6 历史语义）；knowledge/memory/todo 无“0.3.7 未开始/READY”残留。

## 8. 已知限制与未完成项

1. **W-c 未完成**（需 Server 改 `BpmTodoController` + DTO 增 `assigneeDept`），是否发 Server 0.4.1 待 Owner 裁决；`approval-detail.png` 依赖该项。
2. **sample-b 左菜单高亮**仍为「待办任务」（与原图一致），若规划要求高亮与页面主题（我发起的/流程中心）一致，需要产品口径（当前页面不属于任何侧栏菜单）。
3. **CI 源覆盖为临时措施**，镜像恢复后需还原并回读。
4. Server `AgentModelManageServiceImplTest` 在 develop README 合并提交上失败一次（H2 SMALLINT/BOOLEAN），与文档无关，已重跑；如再次失败按既有 flaky 记录跟进，不阻断本次补丁。
5. 流程实例列表页“发起时间”列仍为 ISO 原文（W-d 按方向只修抽屉），见 037-01 §5。

## 9. 回读与自验结论

- 发布 API 回读：tag `0.3.7`=a6781c8、Release 439939910 Latest、资产 6,198,405 B 下载 200；`releases/latest`=0.3.7；0.3.6 Release 未变。
- 部署回读：入口 `index-jYV2b5yF.js`、根/资产/challenge 均 200。
- 许可证：两仓 `license.spdx_id=MIT`。
- 图片：GitHub raw 三处 200 且字节数一致；README 链接检查 200。
- CI：Web `42755335137`（develop 8ed560e）、`42755323841`（main a6781c8）、`42759844784`（develop faf4b00）、`42759860970`（main d0cdcf5）均 success；Server 功能/文档合入 `42749703133`（develop bca196c2）、`42749714010`（main eacab652）success，README 合并提交 `42760022678`（develop f584bd0）首次因既有 flaky（`AgentModelManageServiceImplTest`，H2 SMALLINT/BOOLEAN）失败、重跑中，`42760040390`（main 9a76314）进行中；文档合并不影响发布事实，结果以回读为准。
- 自验不等同 Planner 验收；本回执提交后等待 Planner 对 0.3.7、W-c 去向与 README 图的裁决。
