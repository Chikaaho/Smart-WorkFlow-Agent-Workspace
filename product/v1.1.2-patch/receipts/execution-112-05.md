# execution-112-05：1.1.2 阶段 4—6 完成（合并 / 发版 / 演示环境部署与复测 / B6 / 同步）

方向 `product/v1.1.2-patch/ready/direction-v1.1.2.md`（L）｜执行｜2026-11-15｜依据 `planning-review-112-03.md`（阶段 3 PASSED + 持续授权）、`planning-review-112-04.md`（阶段 4—5 通过、阻塞驳回）。本回执完成七阶段的前六步，阶段 7 待规划复核。

## 1. 阶段 4：版本收敛 + 合并链（普通合并，每步 CI success）

- 版本收敛（112-03 §3 点名的版本来源同批）：Server `pom.xml` 开发默认与 `build-release.yml` 断言 → `1.1.2-SNAPSHOT`/`1.1.2`（`68c07ceb`）；Web `package.json` → `1.1.2`（`52ed983`）；版本脚本动态读取无字面量。
- 合并链（全部 `--no-ff` 普通合并、每步 CI success）：

| 仓 | feature（含版本批次） | feature → develop | develop → main | 分支清理 |
|---|---|---|---|---|
| Server | `43602976834` @ `68c07ceb` | `43604771445` @ `d1e0cabe` | `43606362074` @ `c3724e52` | `--merged` 验证后本地+远端已删 |
| Web | `43602997735` @ `52ed983` | `43603906113` @ `74fa67f` | `43604754133` @ `abfe1339` | 同上 |
| Server | 展示图/README 追加：develop `43627957497` @ `2fc0e9ad`、`43631612045` @ `27dd6818` | | main `43629757351` @ `a31c0c50` | |
| Web | 展示图/README 追加：develop `43627969461` @ `6196975`、`43631871420` @ `ad4c5ce` | | main `43628878437` @ `b45b84b` | |

- 展示图/README 同步提交经 develop → main 普通合并；Web 提交信息受 commitlint `subject-case` 约束改为小写开头措辞（`ad4c5ce`/`b45b84b`）。

## 2. 阶段 5：tag 1.1.2 + Release Latest

| 仓 | tag → commit | Release id | 资产 | 字节 | sha256 |
|---|---|---|---|---|---|
| Server | `1.1.2`（annotated）→ `c3724e52` | `445377854` | `bootstrap-1.1.2.jar` | 242,763,918 B | `606f5dae3fae2667f94904488659c538ebbbfac017955abdf2ebfdcb68ee6324` |
| Web | `1.1.2`（annotated）→ `abfe1339` | `445380514` | `sw-web-dist-1.1.2.zip` | 6,255,491 B | 同 `build-<sha>` 资产字节 |

- 两仓 `releases/latest` 回读均为 **1.1.2**；Server 制品 `build.version=1.1.2` 实测；发布说明列出 B1—B6 与修复内容；`build-<sha>`（`build-c3724e52…`/`build-abfe1339…`）保持 `latest=false`；既有语义 Release（1.1.0/1.1.1）与既有 tag 未改动。资产取自 `build-<sha>` Release 下载后就地创建，上传状态 `uploaded`、字节一致。

## 3. 阶段 6：演示环境部署（先 Server 后 Web）

- **部署前（2026-11-15 01:39）**：磁盘余 **5.9G**（≥3G）；备份 `/data/backup/smart_workflow_20261115_0139_pre112.dump.gz`（819,499 B）、`bootstrap.jar.bak-pre112`（1.1.0，242,762,534 B，原 jar sha256 `a1fd5ca6…` 与 1.1.0 Release 资产一致）、`server.env.bak-pre112`、`/opt/smart-workflow/web.bak-20261115_0139_pre112`（10,804 KB）。部署通道 `~/ssh/config/personal.pem`（规划 112-04 §2 指明；第一轮回执的检索遗漏了 gitignore 的 `receipts/evidence/` 历史脚本——教训已记）。
- **Server 1.1.2**：上传后服务器侧 sha256 `606f5dae…` 与 Release 资产**一致**；`STOP_TIMEOUT=30 ./stop.sh` → 8080 释放 → 换包（`build.version=1.1.2` 回读）→ `. ./server.env` 后 `start.sh`（PID 3581997）→ **health 200**（`/api/actuator/health`，context-path `/api`）、Flyway **35 行 / max 1.1.0**（无新增迁移，方向要求达成）、启动段 ERROR 0；在跑 jar sha256 与 Release 资产一致。
- **Web 1.1.2**：上传解压落位（备份同批）、入口 **`assets/index-DsUInUfT.js`**；`nginx -t` 通过 + reload；回读根 `https://chikaho.cn/` 200、入口 JS 200、`/sw-server/api/actuator/health` 200、`/login` 200。
- **部署脚本**：`.runtime-v112/stage6-deploy-112.sh`（1.0.0 部署脚本同构，本机留存不入 Git）。注意：health 轮询 URL 需带 `/api` 前缀（1.0.0 脚本的 `/actuator/health` 在当前构建返回 404，属脚本路径笔误，服务本身正常）。

## 4. 演示环境复测（B1/B2/B3，浏览器视口截图）

| 项 | 操作与结果 | 证据 |
|---|---|---|
| B1 | 新建「UAT112-G1复测」图（START→HUMAN 指派 admin→END）运行两次：受理号 `2121664488682381313` 取消、执行编号 `2121664495108055041` 取消，均 code=0 **CANCELLED**；列表两行「已取消」、详情头部「已取消」且无 0ms、人工任务行「已关闭」；「待我处理」暂无任务 | `uat112-b1-list.png`、`uat112-b1-a-detail-top/tasks.png`、`uat112-b1-b-detail-*.png` |
| B2 | 专建「UAT112-B2运行中」图（LLM=deepseek-v4.1-flash 研判模型，长输出 prompt）设计器运行：**运行中显示「运行中」（info，无失败文案与耗时）**，250ms 高频采样捕捉（`b2_sawRunning=true`）；结束后显示终态与输出 | `uat112-b2-running.png`、`uat112-b2-terminal.png`（`uat112-b2only-result.json` 状态序列） |
| B3 | 实例监控：`DISCARDED` 显示**「已废弃」**无英文残留（附带 B5 当前节点显示名称「采购负责人审批」/「审批」、B4 失败分类中文名在列表生效——历史行「未定义变量」） | `uat112-b3-monitor.png`、`uat112-b1-list.png` |
| 登录通道 | prod 挑战验证码：同页 SVG 元素放大截图 + 代码文件轮询（v110 脚本模式）；演示环境登录口令为既有测试契约（1.1.0 复测脚本同款），不写入回执 | `.runtime-v112/uat112-*.js` |
| 证据层级 | 本回执截图均为 headless 浏览器视口截图（Playwright chromium 1440/1920 视口，与 1.1.0 阶段 6 复测同模式），按终端契约声明为 `ISOLATED_REGRESSION`、`formal_browser_acceptance=false`——不承担正式通过结论，阶段 3/7 的通过裁决由规划依据本回执与截图独立复核作出 | `.runtime-v112/uat112-*.png` |

演示环境测试数据（UAT112 图/执行、B2 图）保留不删；全程未删除、未清数据。

## 5. B6：展示图三仓重拍

- 拍摄：演示环境设计器「智能巡检编排示例」（LLM/条件分支/知识检索/分支/结束），**82% 缩放**（画布滚轮缩放 + DOM 精算平移取景），画面内三张节点卡完整、文字清晰——与 1.1.0 发布版（83% 同款取景）口径一致。
- 落位：Server/Web/工作区根 `docs/assets/readme/agent-graph.png` 三处替换；Server/Web 经 develop → main 普通合并发布（CI 全 success，见 §1 追加行）；工作区根随本回执批次提交。过程发现：设计器「+」按钮为图标按钮无 accessible name（按钮点击失效），改用画布滚轮缩放；拖拽平移起点必须落在节点卡下方空白画布（抓到节点会移动节点），取景平移用 DOM 精算 + 自适应收敛（PAN round=1 dx=-99→condX=478）。

## 6. 发布后同步（规划 112-03 §3 唯一值表逐项）

| 入口 | 目标值 | 实际位置与结果 |
|---|---|---|
| 需求池 | P70、P71 → 已核销（1.1.2）；P72 未排期 | `todo/requirement-pool.md` P70/P71 行改「✅ 已核销（1.1.2，2026-11-15）」（规划 112-03 授权值）；P72 行保持未排期 |
| version.json | version 1.1.2 PUBLISHED | 根 `version.json`：`version=1.1.2`、`registeredAt=2026-11-15`、`development.targetVersion=1.1.2`、`status=PUBLISHED`、statusNote 记录部署与复测 |
| CHANGELOG | 1.1.2 条目 | `CHANGELOG.md` 顶部 1.1.2 条目（B1—B6/G3/制品/已知限制） |
| knowledge | 当前状态段 | `knowledge/current-status.md` 顶部 1.1.2 段（发布事实/演示环境/复测/需求池/同步范围），1.1.0 段转历史标记 |
| 根 README | Server 1.1.2 · Web 1.1.2 | badge `version-1.1.2`、两处当前版本行、新增「1.1.2 修复」行 |
| 两仓 README | badge 与配对行 1.1.2 | Server `50a9fde9`(main)/`27dd6818`(develop)；Web `b45b84b`(main)/`ad4c5ce`(develop)，CI success |
| 两仓 CI | 最新提交 success | Server main `43629757351` @ `a31c0c50`、develop `43627957497`/`43631612045`；Web main `43628878437` @ `b45b84b`、develop `43627969461`/`43631871420`——全部 success（README 提交 CI 见 §1 追加行） |
| memory | 由规划维护 | 本回执不含 memory 写入（规划职责） |

## 7. 与验收标准对照（112-03 §3）

| 步骤 | 要求 | 实际 | 结论 |
|---|---|---|---|
| 1 | 密钥连接；≥3G；四项备份 pre112 | personal.pem 通道；5.9G；dump/jar/env/web 四项 pre112 | **达成** |
| 2 | Server sha256 一致、stop/start、health/build.version/Flyway 35 行/ERROR 0 | 全部核对通过 | **达成** |
| 3 | Web nginx -t → reload → 入口与根 200 | 通过 | **达成** |
| 4 | B1 双编号取消列表详情已取消；B2；B3 | §4 全部通过（视口截图） | **达成** |
| 5 | B6 三仓 agent-graph.png | §5 三仓落位 + 合并链 CI success | **达成** |
| 6 | 同步清单（§6 唯一值表） | §6 逐项落盘（memory 除外，规划职责） | **达成** |
| 限制 | 不删不清数据；口令不进回执；不输出密钥内容 | 遵守 | **达成** |

## 8. 偏差、限制与风险

1. **部署脚本 health 轮询路径**：沿用 1.0.0 脚本的 `/actuator/health` 在当前构建 404（context-path `/api`），服务本身正常（`/api/actuator/health` 200）；脚本已记录为教训，不影响部署结果。
2. **第一轮回执的检索遗漏**：部署通道记录在 gitignore 的 `receipts/evidence/` 历史脚本中，第一轮误报「工作区无记录」并 BLOCKED 一轮（规划驳回后接续）；教训已按规划 112-04 §2 记录。
3. **B2 运行窗口**：演示环境真实 LLM 执行秒级窗口，250ms 高频采样捕捉成功（`b2_sawRunning=true`）；「智能巡检编排示例」图当前仅 1 个入参（topic），与 1.1.0 时期两参数形态不同（历史编辑所致），B2 复测改用专建 LLM 图。
4. **范围外（P72）**：超时恢复遗留等待人工行维持登记未排期，演示环境复测中的同类历史行如实出现在截图内，不属本轮处理范围。

## 9. 自验结论

阶段 4—6 全部完成：合并链与发版 CI 全 success、演示环境部署核验通过、B1/B2/B3 复测通过、B6 三仓落位、同步逐项落盘。**总阶段数 7｜已完成 6（评估、实施、验收、合并、发版、部署与同步）｜进行中 0｜未开始 1（阶段 7 结束——待 Planner 复核）**。唯一下一动作：Planner 阶段 7 复核本回执。

```text
ENGINE_TERMINAL {"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"L","receipt":"product/v1.1.2-patch/receipts/execution-112-05.md","evidence":["product/v1.1.2-patch/receipts/execution-112-05.md",".runtime-v112/uat112-b1-list.png",".runtime-v112/uat112-b1-a-detail-top.png",".runtime-v112/uat112-b1-a-detail-tasks.png",".runtime-v112/uat112-b2-running.png",".runtime-v112/uat112-b2-terminal.png",".runtime-v112/uat112-b3-monitor.png",".runtime-v112/agent-graph-new.png",".runtime-v112/uat112-result.json",".runtime-v112/uat112-b2only-result.json"],"feature_status":"VERIFYING","browser_status":"OPERABLE","browser_evidence":{"tier":"ISOLATED_REGRESSION","headless":true,"artifacts":[".runtime-v112/uat112-b1-list.png",".runtime-v112/uat112-b1-a-detail-top.png",".runtime-v112/uat112-b1-a-detail-tasks.png",".runtime-v112/uat112-b1-b-detail-top.png",".runtime-v112/uat112-b1-b-detail-tasks.png",".runtime-v112/uat112-b2-running.png",".runtime-v112/uat112-b2-terminal.png",".runtime-v112/uat112-b3-monitor.png"],"url":"https://chikaho.cn","viewport":"1920x900","identity":"admin（演示环境，既有测试契约）","object":"Graph 取消/执行列表/执行详情/设计器运行/实例监控干预页","network_index":"receipt section 4: B1 cancel responses + list rows; b2 states; b3 monitor text"},"formal_browser_acceptance":false,"work_items":[{"id":"stage-7-review","status":"PENDING","next_action":"Planner 阶段 7 复核 execution-112-05.md，方向归档 passed/","actionable":true,"authorized":true,"dependency_satisfied":false}],"remaining_actionable_count":0,"independent_work_exhausted":true,"next_action":"Planner 阶段 7 复核（七阶段唯一下一步）","next_action_type":"WAIT_PLANNER","progress_fingerprint":"execution-112-05:server-tag-1.1.2-c3724e52:web-tag-1.1.2-abfe1339:deployed-and-retested:b6-three-repos","progress_basis":{"files_changed":["Smart-WorkFlow-aPaaS-server:pom.xml+build-release.yml(68c07ceb)","Smart-WorkFlow-aPaaS-server:agent-graph.png+README.md(2fc0e9ad/27dd6818)","Smart-WorkFlow-aPaaS-Web:package.json(52ed983)","Smart-WorkFlow-aPaaS-Web:agent-graph.png+README.md(6196975/ad4c5ce)","工作区:CHANGELOG.md+version.json+todo/requirement-pool.md+knowledge/current-status.md+README.md+docs/assets/readme/agent-graph.png"],"tool_actions":["git merges/tags/releases both repos (CI all success)","ssh/scp deploy via personal.pem (backup pre112, sha256 verified, health/Flyway/ERROR checks)","playwright UAT retest B1/B2/B3 + B6 shot","workspace sync edits"],"new_evidence":["演示环境 B1 双编号取消列表详情已取消","B2 运行中截图（sawRunning=true）","B3 DISCARDED 已废弃截图","B6 agent-graph-new.png 82% 三卡完整","Flyway 35 行 max 1.1.0、ERROR 0、sha256 双侧一致"],"closed_work_items":["stage-4-merge","stage-5-release","stage-6-deploy","stage-6-retest","stage-6-sync"]},"stop_reason":"WAITING_FOR_PLANNER","tool_results":[{"tool":"ssh/scp","outcome":"SUCCEEDED","detail":"备份 pre112 四项 + Server/Web 部署 + 部署后核验（health 200 / build.version=1.1.2 / Flyway 35 行 / ERROR 0 / sha256 一致）"},{"tool":"playwright","outcome":"SUCCEEDED","detail":"B1 双编号取消+列表详情截图、B2 运行中/终态截图、B3 监控截图、B6 展示图（验证码同页截码+代码文件轮询模式）"},{"tool":"gh-api","outcome":"SUCCEEDED","detail":"tag 1.1.2 ×2、Release 445377854/445380514 Latest、合并链与同步提交 CI 全 success"},{"tool":"git","outcome":"SUCCEEDED","detail":"两仓六步+展示图/README 合并链推送，工作区同步批次待本回执提交"}]}
```
