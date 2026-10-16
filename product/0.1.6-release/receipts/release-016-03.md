# 0.1.6 验收修复同版本覆盖发布执行回执（release-016-03）

2026-10-16｜Executor｜L｜同版本覆盖发布（新增业务功能 0）

- 入口方向：`product/0.1.6-release/ready/direction-release-016-acceptance-republish.md`（Owner 明确授权“还是 0.1.6，版本号覆盖”）
- 前置：`product/0.1.6-release/receipts/planning-review-user-entry-fix-01-passed.md`（用户端入口与布局修复 PASSED，验收对象 Web `e5aa357`）
- 前态回执：`release-016-02.md`（首次发布，原文保留）、`user-entry-fix-01.md`（修复与设计修正）
- 证据目录（本机留存，gitignored）：`product/0.1.6-release/receipts/evidence/republish-016/`
- 总阶段：①②③历史结果保留；**④同版本修复覆盖发布已执行**；⑤最终同步终审待完成

## 1. 一句话结论

Owner 已验收的用户端应用中心修复（Web `e5aa357`）按 feature→develop→main 集成并经既有 CI 通道产出正式制品，**0.1.6 语义标签与同名 Release 已同版本覆盖**到新发布提交（旧目标 `f91e8bf` → 新目标 `e5aa357`），Web 正式资产替换为本次 CI 制品；UAT 前端已从修复候选**收敛到该正式制品**并完成入口点击复验；Server 侧 0.1.6 身份与制品保持未动（本轮修复仅涉及前端）。

## 2. 已验收修复的包含关系与集成（普通推送）

| 项 | 值 |
|---|---|
| 修复分支 | Web `feature/application-center-user-entry`（从 develop `55c3d39` 新建）：`c3cd686` 顶栏常驻应用中心 → `f9798cd` 原型化应用中心（列表搜索/每行数量、应用内目录树＋内联数据列表＋表头设置）→ `e5aa357` 设计修正（应用中心去全局侧栏、应用内目录栏全白底纹） |
| develop | `55c3d39` → `e5aa357`（`git push origin develop`，回读一致） |
| main | `55c3d39` → `e5aa357`（`git push origin main`，回读一致；触发发布 CI） |
| 版本 | 保持 **0.1.6**（Web `package.json` 0.1.6；未改版本、未新增 0.1.7）；开发版本规则不变 |
| 夹带检查 | 仅上述 3 个已验收提交进入 develop/main；工作树干净，无未验收成果夹带 |

- 远端回读：`refs/heads/develop` = `refs/heads/main` = `e5aa3575bd18ba81b0f749b4ca5d60e34e89a393`；未强推分支、未改写历史。

## 3. 0.1.6 覆盖：标签、Release、资产、恢复点（Web 仓）

| 项 | 覆盖前（恢复点） | 覆盖后（当前正式） |
|---|---|---|
| annotated tag `0.1.6` | tag 对象 `6b09d66ddc03228b3e4e0a0d1657ac80ae7ff99f` → 提交 `f91e8bf` | tag 对象 `dc91b36c5f420d746d7743cdbc53cd92bfaeba4d` → 提交 `e5aa357`（`git push --force origin refs/tags/0.1.6`，远端回读一致） |
| Release | `CH-aPaaS Web 0.1.6`（targetCommitish `main`，非 immutable） | 同名 Release，说明已更新为本次覆盖来源与恢复点指引 |
| 正式资产 | `sw-web-dist-0.1.6.zip` 1,331,541 B，sha256 `c6f17308…10dd6e`（首次发布 CI 制品） | `sw-web-dist-0.1.6.zip` 1,335,126 B，sha256 `21687e55092926bd800a910ce801379d9ca84b5ccb285a907489ada95efad5f2`（本次 CI 制品，同名替换、未旧资产配新标签） |
| 恢复材料 | `evidence/republish-016/old-016-web-tag-object.txt`、`old-016-web-release.json`、`old-016-web-dist.zip`、`RECOVERY.md` | — |
| Server 侧 | 未受影响：tag 对象 `10ce7194…` → `e115857`，Release 与 `bootstrap-0.1.6.jar` 保持；本轮不为成对发布重建无变化的后端 | 同左 |

- 恢复方式（不新建正式版本）：标签用保存的对象原文回写或 `git tag -a -f 0.1.6 f91e8bf -m "CH-aPaaS Web 0.1.6"` 后 `git push --force`；资产用 `gh release upload 0.1.6 old-016-web-dist.zip#sw-web-dist-0.1.6.zip --clobber` 并按 `old-016-web-release.json` 的 body 还原说明；部署回滚用 UAT `/opt/smart-workflow/web.bak-entryfix-20261016_1352`（覆盖前 0.1.6 制品内容）。细节见 `RECOVERY.md`。
- 历史自动 Release（`build-f91e8bf…`、`build-55c3d39…`、`build-e5aa357…`）保留各自历史语义，不与语义 tag `0.1.6` 混作当前正式入口。

## 4. CI 结果与正式产物版本/来源

```
run 38862870660（workflow: Build & Release (main)，headSha e5aa357…）→ conclusion: success（job build: success）
自动 Release build-e5aa3575bd18ba81b0f749b4ca5d60e34e89a393
  标题：CH-aPaaS-Web 0.1.6 build e5aa357…（工作流采用版本 = 0.1.6，取自 package.json）
  制品：dist-e5aa3575bd18ba81b0f749b4ca5d60e34e89a393.zip（1,335,126 B，sha256 21687e55…）
```
- 正式产物身份回读：包版本 **0.1.6**、来源提交 `e5aa357`、分支 main；解包核对 `dist/index.html` sha256 `858ffc22…`、入口资源 `assets/index-BMLiWa_O.js`、419 个资源文件，与已验收候选构建内容一致。
- 原始输出：`evidence/republish-016/ci-web-watch.log`（watch 退出 0）；已知 3 条既有 lint warning 不阻塞。

## 5. 实际部署来源与最小入口验证（UAT）

| 项 | 值 |
|---|---|
| 部署来源 | 本次正式 0.1.6 制品（同名资产 `sw-web-dist-0.1.6.zip`，服务端回读 sha256 `21687e55…`）；替换前在线目录为修复候选（内容与正式制品一致：`index.html` 均 `858ffc22…`） |
| 部署方式 | 运维手册 §8.2 既有通道：上传 → 解包校验 → 暂存 → 目录替换 → `chown` → `nginx -t`（ok）→ `nginx -s reload`（OK） |
| 线上回读 | `/opt/smart-workflow/web/index.html` = `858ffc22…`；域名侧 `https://chikaho.cn/index.html` 同哈希；`https://chikaho.cn/` = 200；后端健康 `/api/actuator/health` = 200 |
| 可恢复备份 | `web.bak-entryfix-20261016_1352`（覆盖前 0.1.6 制品内容）＋历史 `web.bak-*` 保留；本次替换的前一目录与正式制品内容一致，未新增冗余备份 |
| 后端/库 | 未变更：`bootstrap.jar` 仍含 `sw-common-0.1.6`；库内 versioned 终点单条 0.1.6（checksum `-1768731444`）；未重跑迁移或业务全套 |

最小入口验证（可见浏览器，中文、系统管理员，1280×720，从 `/workspace` 点击进入）：

| 步骤 | 结果 |
|---|---|
| `/workspace` | 顶栏 工作台/我的门户/流程中心/应用中心；工作台侧栏保留（回归） |
| 点击「应用中心」 | 进入 `/form/app-center`，顶栏选中态保持；**无全局侧栏**；应用卡片「测试」、搜索与每行数量设置可用 |
| 进入应用 | `/form/app-center/uncat-t0`：**无全局侧栏**；左侧目录/表单导航（未命名表单、请假申请）**全白底纹**（计算样式 `rgb(255,255,255)`）；右侧数据列表显示真实记录（M-001，可用量 70）；顶栏「应用中心」保持选中 |
| 截图 | `evidence/republish-016/uat-01-official-016-app-inner.png` |

## 6. 同步覆盖矩阵（knowledge-first）

| 目标 | 更新内容 |
|---|---|
| `knowledge/current-status.md` | 顶部新条目：0.1.6 同版本覆盖发布完成（旧/新标签目标、资产、部署来源、恢复点、唯一下一动作）；原发布条目降为历史条目 |
| `knowledge/session-handoff.md` | 交接同步同一口径 |
| `knowledge/features/application-center-form-classification.md` | 发布/部署与入口修复条目改为“修复已纳入正式 0.1.6 制品并部署” |
| `memory/{README,state,handoff,features,decisions}.md` | 当前发布块替换为覆盖发布事实（单文件 <5KB、总量 <20KB，实测见回执 §8） |
| `todo/requirement-pool.md` | 顶部 0.1.6 块同步；待办候选收敛（版本裁定已由 Owner 给出=同版本覆盖） |
| `CHANGELOG.md` | 0.1.6 条目新增“验收修复同版本覆盖”事实 |
| Web `README.md` | 当前发布版本行补记本次同版本覆盖来源（`e5aa357`） |
| 运维文档 | `docs/ops/production-ops.md` §8.2 通道未变更，无需修改（部署按原通道执行） |

## 7. 开放项与限知

1. **UAT 普通身份缺口（延续）**：交付环境仅 `admin` 超管身份；普通用户口径在隔离环境已通过，UAT 同口径对照需 Owner 授权建受限测试账号，本轮未做、未以管理员视角冒充。
2. **Server 未重建**：本轮为前端修复，Server 保持既有 0.1.6 身份与制品；平台发布记录已分列两端来源。
3. **历史回执保留时点**：`release-016-01/02.md`、`user-entry-fix-01.md` 原文保留（其中“0.1.6 未含修复/前端为候选”等表述属各自时点口径）。
4. 未做：移动端（≤767px）专项、表头/每行偏好的服务端持久化（仍为本机偏好）。

## 8. 自验与唯一下一动作

- 自验：覆盖操作与远端回读一致（标签目标=main 头=`e5aa357`，资产摘要=CI 制品）；正式制品版本 0.1.6、来源 `e5aa357`；UAT 部署来源=正式制品且入口点击链通过；Server 与库未动；memory 单文件 <5KB、总量 <20KB（实测 19,9xx B）。
- 唯一下一动作：Planner 复核本回执（覆盖结果、两端来源、部署与恢复点）并完成最终同步终审；不要求 Owner 重复验收同一未变成果。
