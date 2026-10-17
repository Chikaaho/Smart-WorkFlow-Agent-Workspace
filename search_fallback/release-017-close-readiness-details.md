# 0.1.7 收口及历史清理范围核实 · 明细附表

对应摘要：`search_fallback/release-017-close-readiness.md`。核实时点 2026-10-18，全部为本地只读命令结果（`git`/`grep`/`ls`/`ls-remote`）；未构建、未迁移、未部署、未改任何引用。

## §1 三仓 Git 事实

### 1.1 引用与工作树（下表为**执行侧推进后**当前值；推进前状态见 §1.6）

| 仓 | 远程 URL | 当前分支 | HEAD | 跟踪 | 领先/落后 | 工作树 |
|---|---|---|---|---|---|---|
| 根 | `Chikaaho/Smart-WorkFlow-Agent-Workspace` | `develop-sw` | `054bc3b9`（核实时点；后含本次回传提交） | `origin/develop-sw` | 0/0 | 9 项改动（见 1.2） |
| Server | `Chikaaho/Smart-WorkFlow-aPaaS-server` | `develop` | `700559e` | `origin/develop` | 0/0 | 仅未跟踪 `logs/` |
| Web | `Chikaaho/Smart-WorkFlow-aPaaS-Web` | `develop` | `4e89249` | `origin/develop` | 0/0 | 干净 |

远端回读（`git ls-remote`，非本地跟踪引用）：

- 根：`HEAD`/`main`＝`51732b1e`、`develop-sw`＝`054bc3b9`；无 tag、无 PR 引用。
- Server：`main`＝`04a8e1a3`（2026-10-16 15:13「功能清单焦点同步 0.1.6 发布复核与终态同步」）、`develop`＝`eca43b7`、`bugfix/0.1.7`＝`2d776ef`；tag `0.1.6`→`e115857`；**无 0.1.7 tag**。
- Web：`main`＝`develop`＝`a60a819`、`bugfix/0.1.7`＝`fe1712b`；tag `0.1.6`→`e5aa357`；**无 0.1.7 tag**。

注：本地 `main` 跟踪引用为陈旧值（Server `d18e9a3`、Web `039f987`），与远端实际不同；本表以 `ls-remote` 为准。

### 1.2 根仓未提交/未跟踪

已修改：`memory/README.md`、`memory/constraints.md`、`memory/features.md`、`memory/handoff.md`、`memory/state.md`、`product/0.1.7-bugfix/0.1.7bug.md`、`product/0.1.7-bugfix/ready/direction-bugfix-017.md`、`todo/requirement-pool.md`、gitlink `Smart-WorkFlow-aPaaS-Web`。

未跟踪：`product/0.1.7-bugfix/ready/direction-release-handoff-017.md`、`product/0.1.7-bugfix/receipts/planning-close-017.md`、`search_task/release-017-close-readiness.md`、`todo/p65-form-javascript-events-api.md`。

gitlink 明细：根 HEAD/index 记录 Web `61c61ba1`、Server `2d776ef`；Web 实际 HEAD `fe1712b`（差 3 提交：`49d775f` 回归20、`6fe9805` 回归21、`fe1712b` 回归22）＝「new commits」；Server 记录＝HEAD，仅「untracked content」。该目录无 `.gitmodules` 映射。

### 1.3 本轮修复提交范围

Server `develop..bugfix/0.1.7`（8 提交，基线 `eca43b7`）：

```
2d776ef 2026-10-18 回归19服务端——#41组织架构演示种子与流程中心菜单置顶,修正迁移链测试计数
ee78d2d 2026-10-18 回归17服务端——#38字段定义补description
b9ba667 2026-10-17 回归16服务端——#37编号文法扩展({DATE}/{TIME}/{EXPR})
f33322b 2026-10-17 回归08——新流程初始图默认走向改自上而下(TB)
d8f1a8d 2026-10-17 回归06——relations端点补外挂流程信息与当前节点键
e3cf597 2026-10-17 回归05——30统一详情关系端点(APPROVER/PARTICIPANT/NONE fail-closed)
2a9d8ce 2026-10-17 回归02——21流程定义禁删端点移除，表单任意状态软删
fab3d5e 2026-10-17 台账#1/#6/#4——应用可见范围五维度、后台菜单调整、表单仅改名端点
```

Web `develop..bugfix/0.1.7`（31 提交，基线 `a60a819`；首 `442ba79` 台账#5/#7/#8/#9/#10，末 `fe1712b` 回归22 #43）。逐条标题见 `git log --oneline develop..bugfix/0.1.7`。

合并关系（均为快进）：Server `0.1.6^{}..bugfix/0.1.7`＝0/11、`develop..bugfix/0.1.7`＝0/8、`develop..origin/main`＝1/0（仅 `eca43b7` 未入 main）；Web `develop`＝`origin/main`＝`a60a819`、`0.1.6^{}..bugfix/0.1.7`＝0/32。

### 1.4 验证结果与绑定

| 对象 | 提交 | 结果 | 原文位置 |
|---|---|---|---|
| Web 全量前端门禁 | `fe1712b` | vitest 1607 通过/3 skipped；vue-tsc 零错误；eslint 零错误（3 条预存 warning） | `product/0.1.7-bugfix/receipts/bugfix-round-01.md` 增补 26/27 |
| Server 迁移链 | `2d776ef` | `FlywayFullChainH2Test` 17/17、`FlywayFullChainPostgresTest` 12/12（含计数断言 11→14、终点 0.1.6→0.1.7 修正） | 同上 增补 24 |
| 种子与权限（本地 PG） | `2d776ef` | 两租户各 7 节点、每节点 2 用户；`admin`/`demo_a_hq_1`/`demo_a_br2_1`/`demo_b_team1_2` 登录成功；普通用户待办 200、后台用户 403，租户管理员仅见本租户 14 人 | 同上 增补 24/25 |
| 浏览器可见会话（#41R/#42/#43） | `fe1712b` | 集合区纯白背景计算样式、12 格栅格逐页测量、52 路由按钮文案扫描 | 同上 增补 25/26/27 |

证据原件（截图/网络索引）按 `project.md` §3 仅本机留存（`%TEMP%\sw-017\`），不入 Git。

### 1.5 部署事实（2026-10-18 远程只读回读，已核实）

- 连接通道：运维手册 `docs/ops/production-ops.md` §2 声明 SSH 22、用户 `root`、密钥认证，凭据封装在本地脚本；手册所记路径 `~/ssh/ssh/{ssh_personal.sh,scp_personal.sh}` **在本机不存在**，实际位置为 **`E:\code\ssh\ssh\ssh\`**（Owner 指认），密钥 `E:\code\ssh\ssh\config\personal.pem`（1700 B）。脚本内 `HOST=8.166.112.85`、`PORT=22`、`USER=root`；脚本内 `KEY_PATH`/`PEM_PATH` 写作 `~/ssh/config/personal.pem`，在本机需改为实际路径后使用。已验证可用调用：`ssh -i <pem> -p 22 -o BatchMode=yes root@8.166.112.85`（OpenSSH 9.2p1，Windows Git Bash）。
- 回读结果（只读命令：`unzip -p`、`curl`、`ss`、`psql -tAc`、`grep`/`ls`）：

| 项 | 实测 |
|---|---|
| 后端制品版本 | `META-INF/production-build.properties` → `build.version=0.1.6` |
| 制品与备份 | `bootstrap.jar` 217,870,418 B（＝0.1.6 正式制品）、`.bak` 217,676,892 B、`.bak2` 216,837,921 B |
| 运行状态 | PID 2222600 存活、8080 监听 1 条、`/api/actuator/health` → `{"status":"UP"}` |
| DB（smart_workflow@5433） | versioned 终点＝单条 `0.1.6`（`baseline seed`，checksum `-1768731444`，success=t）＝**S1 形态**；`R__` 记录 11 条 |
| 前端 | `/opt/smart-workflow/web/index.html` 入口 `assets/index-BMLiWa_O.js`（＝0.1.6 正式制品入口），assets 419 项 |

- 结论：**UAT＝后端 0.1.6＋前端 0.1.6＋库 0.1.6 单条 versioned**，与 0.1.6 轮回执记录一致；0.1.7 升级应走「0.1.6 存量库」入口（即 `upgrade-to-0.1.7-from-0.1.6.<方言>.sql`，待建）。未执行任何写操作（未备份、未停服、未上传、未执行脚本）。

## §2 清单历史引用范围

### 2.1 路径与提交

| 路径 | 新增 | 删除/改名 | 最后修改 |
|---|---|---|---|
| `product/0.1.7-bugfix/1.0.7bug.md` | `679a0e6f`（2026-10-16「保存0.1.7修复跨设备交接」，16 行，blob `8117647e`） | `6c4b5b2a`（2026-10-17 01:27，同一提交新增新名） | — |
| `product/0.1.7-bugfix/0.1.7bug.md` | `6c4b5b2a`（blob `e3804984`） | — | `054bc3b9`（HEAD，blob `66b6714b`；工作树另有 4 行未提交改动） |

全历史 `--name-only` 扫描（`git log --all`）显示 `product/0.1.7-bugfix/` 下仅出现这两个 `*bug.md` 名称，**无第三别名**；触及两路径的提交共 24 个（`0.1.7bug.md` 23 个＋`1.0.7bug.md` 2 个，其中 `6c4b5b2a` 重复计入）。

### 2.2 受影响引用与重写范围

- 包含清单提交（`679a0e6f`、`6c4b5b2a`）的引用：`refs/heads/develop-sw`、`refs/remotes/origin/develop-sw`（`git for-each-ref --contains` 与 `git branch -a --contains` 一致）。根仓无 tag；`git ls-remote` 仅 `HEAD`/`main`/`develop-sw` 三条，无 PR 引用。
- 根仓 `main`＝`51732b1e` 与 `develop-sw` 非同一谱系（merge-base `8106fd01`，develop-sw 独有 595 提交），**不含清单**。
- 重写范围（含首现提交）：`679a0e6f^..054bc3b9`＝**35 提交**；重写后需强推 `develop-sw`（本地 1 条＋远端 1 条引用）。
- 本地其他引用：`refs/codex/snapshots/865db0e5…`（tree `0812d9d4`）、`refs/codex/snapshots/8c819a91…`（`51732b1e`）、`refs/codex/turn-diffs/checkpoints/{675cc7d3…,8e54db41…}` —— 均不含清单；**`refs/codex/turn-diffs/checkpoints/f9a2260d…/0907a0d5…`（tree `4f89adbb`）含 `product/0.1.7-bugfix/0.1.7bug.md`**（本地隐藏引用，未推送）。无 stash。

### 2.3 其他别名/旧名文本引用（非受跟踪副本，不构成历史改写对象）

| 位置 | 内容性质 |
|---|---|
| Server `sw-bootstrap/src/main/resources/db/migration/{h2,postgresql}/V0.1.7__bugfix017_menu_and_app_scope.sql:2` | 段头注释「0.1.7 Bug 修复列车（1.0.7bug 清单）」——文本引用，属子仓 |
| `product/0.1.7-bugfix/receipts/env-setup-01.md:4,55` | 历史回执中的旧路径引用（保留原始事实） |
| `product/0.1.7-bugfix/receipts/bugfix-round-01.md:29` | §0 记录 Owner 更名与新路径口径 |
| `product/0.1.7-bugfix/ready/direction-release-handoff-017.md:15` | 本次清理范围列出的重命名前路径 |

Web 仓 `grep -rn '1\.0\.7bug'`（ts/vue/md/json，排除 node_modules）＝0 命中。

### 2.4 恢复与验证方案（供授权决策）

- 备份：重写前 `git clone --mirror <本地路径> <备份路径>`（含 `refs/codex/*` 隐藏引用）或 `git bundle create <文件> --all`；另留存三个原 SHA（`679a0e6f`、`6c4b5b2a`、`054bc3b9`）与清单 blob（`8117647e`、`66b6714b`）。
- 执行方式（待授权）：`git filter-repo --path <两路径> --invert-paths`（或 `filter-branch`）后 `git push --force-with-lease origin develop-sw`。
- 验证：①`git log --all --oneline -- <两路径>` 为空；②`git rev-list --all --objects | grep -i '1\.0\.7bug\|0\.1\.7bug\.md'` 无命中；③远端 `git ls-remote origin develop-sw` 回读新 SHA；④另起全新 clone 复核两路径不存在、业务文件与回执完整；⑤本地 `refs/codex/*` 中该 tree 需单独处置（重建或删除对应 checkpoint 引用）才能称本地无残留。
- 边界（不得冒称）：GitHub 侧不可达对象与服务器缓存、其他克隆（`679a0e6f` 提交信息「保存0.1.7修复跨设备交接」提示存在跨设备克隆）、fork/镜像不在本地可清除范围；工作区 `0.1.7bug.md` 本地文件按 Owner 要求保留（改为不跟踪并加入忽略规则），不删除本地副本。

## §3 knowledge / 版本 / 0.1.7 缺口

### 3.1 knowledge 当前入口命中

| 入口 | 0.1.7 命中 | 当前表述 |
|---|---|---|
| `knowledge/current-status.md` | 8（均为「无 0.1.7」/「如 0.1.7 待确认」类历史表述） | 顶部＝2026-10-16 0.1.6 发布终态最终确认 COMPLETED、唯一下一动作＝无 |
| `knowledge/session-handoff.md` | 0 | 未登记 0.1.7 |
| `knowledge/known-issues.md` | 0 | 未登记 0.1.7 边界 |
| `knowledge/architecture.md`、`decisions.md`、`development-workflow.md` | 0 | — |
| `knowledge/features/application-center-form-classification.md` | 1 | 历史提及（0.1.6 功能） |

### 3.2 需同步入口清单（受影响，待规划唯一值）

`knowledge/current-status.md`（必改）、`knowledge/session-handoff.md`、`knowledge/known-issues.md`（如需登记边界）、根 `README.md`（无 0.1.7 字样）、`CHANGELOG.md`（0.1.7 条目待发布后）、Server `README.md:18,62`（当前发布 0.1.6）、Web `README.md:18,59`（当前发布 0.1.6）、`memory/`（五件已按 0.1.7，待终态值复核）、`todo/requirement-pool.md`（P65 已登记「待做、待排期」）、两仓版本来源（见 3.3）、Server 迁移目录与 `db/upgrade/`（见 3.4）。

### 3.3 版本来源（真实配置）

| 仓 | 位置 | 当前值 | 说明 |
|---|---|---|---|
| Server | `pom.xml:37`（注释）、`:40` `<revision>` | `0.1.6-SNAPSHOT` | 34 个 POM 唯一工程版本来源；正式构建 `-Drevision=<值>` 覆盖 |
| Server | `.github/workflows/build-release.yml:35,36,46,47` | 断言 `0.1.6-SNAPSHOT`→剥 `-SNAPSHOT` 得正式值 | 触发条件仅 `push: branches: [main]`；制品标记 `META-INF/production-build.properties` `build.version` 做一致性断言 |
| Server | `scripts/build-prod.sh:24-30,55` | 注释引用 `0.1.6-SNAPSHOT` | `REVISION` 透传 `-Drevision`，`EXPECTED_VERSION` 交制品门禁 |
| Server | `scripts/check-version-identity.sh:12,158-159` | 注释与 grep 断言 `0.1.6-SNAPSHOT` | 版本身份门禁（pom/develop/release/installed 四模式） |
| Server | `sw-dependencies/pom.xml:57` | `<pgvector.version>0.1.6</pgvector.version>` | **依赖版本，不得随产品版本收敛** |
| Web | `package.json:4` | `0.1.6` | CI 读该值作为 Release 标题/资产名来源 |
| Web | `README.md:18,59` | 当前发布 0.1.6 | 文档入口 |

正式/部署/开发分列：正式＝0.1.6（两仓 tag＋Release＋制品在案）；部署＝0.1.6（记录，本次未连远程复核）；开发＝Server `0.1.6-SNAPSHOT`／Web 包 0.1.6；**0.1.7 未发布、无 tag**。

### 3.4 0.1.7 种子与升级准备缺口

1. **种子未收敛**：`db/migration/{h2,postgresql}/` 现为 `V0.1.6__baseline_seed.sql`（311,144 B）＋`V0.1.7__bugfix017_menu_and_app_scope.sql`（2,009 B，含菜单定点 UPDATE 与 `sw_form_app_scope` 建表）＋12 支 `R__`（含本轮新增 `R__0.1.7_catalog_menu_first.sql`、`R__0.1.7_org_demo_seed.sql`）；`FlywayFullChain*Test` 断言迁移数 14（＝V0.1.6 基线＋V0.1.7＋12 `R__`）。0.1.6 先例：收敛为单一 `V0.1.7__baseline_seed.sql`（逐字节拼接＋段头）并把旧文件归档 `db/upgrade/0.1.7/legacy-0.1.6/`，同时同步链测试断言。
2. **无 0.1.7 升级通道**：`db/upgrade/` 仅有 `0.1.5/`（含 `legacy-0.1.x`）与 `0.1.6/`（含 `legacy-0.1.5`），缺 `db/upgrade/0.1.7/{README.md,transition-history-to-0.1.7.*,upgrade-to-0.1.7-from-0.1.6.*}`；0.1.6 存量库（含 UAT）无升级路径。
3. **版本未收敛**：3.3 各来源仍为 0.1.6 系列。
4. **演示种子随版本装载**：`R__0.1.7_org_demo_seed.sql`（租户 9001 `demo-org-a`／9002 `demo-org-b`、7 节点×2 用户×2 租户＝28 用户、`demo_admin`/`demo_user` 角色、BCrypt 口令）位于产品迁移目录，随应用启动自动执行；`admin` 口令更新仅在本机 dev 库执行、未写入迁移（增补 24 口径备注）。是否随 0.1.7 正式发布需规划/Owner 确认。

## §4 回执已披露边界（Q4 明细）

### 4.1 仍在（9 项）

| # | 边界 | 原文位置（`receipts/bugfix-round-01.md`） |
|---|---|---|
| 1 | 含 TABLE 字段表单「发布新版本」被服务端拒绝（既有服务端边界，非本轮引入）；带子表已发布表单只能保存定义 | 增补 21（约 411 行） |
| 2 | 节点字段三态（设计器配置）运行期未消费——按当前节点控字段仅落在 TaskDetail 节点表单与审批人动作，业务记录字段未按节点显隐/可编辑 | 约 243 行 |
| 3 | 字段 `description` 为定义 JSON 纯元数据，填报态未渲染 | 增补 21（约 412 行） |
| 4 | 未纳入的说明性文案：属性面板扩展区空态说明（#36 引入）、编号弹窗各要素说明行（#37 引入） | 约 447 行 |
| 5 | dev:mock 菜单种子（`src/foundation/mock/seeds.ts`）未同步 #6 结构 | §5（约 73 行） |
| 6 | TaskDetail 底部「流转记录/流程图/审批详情列表」页签按 #18 未点名保留 | §5（约 74 行） |
| 7 | 表单级 `visibility_scope` 与应用级可见范围为两套语义，未混用 | §5（约 75 行） |
| 8 | 已发布表单「保存」只更新工作定义，须「发布新版本」生效 | §5（约 76 行） |
| 9 | 流程定义列表四张统计卡属已验收设计元素未动；未纳入：不可达页面、弹窗内小标题/说明、移动端、控制台页内分区标题 | 增补 15 区（约 304 行） |

### 4.2 后续已关闭

- 增补 24 遗留「Docker 停止期种子在 dev 库留下的角色菜单授权行（含 209/210/211 大模型管理菜单）未清理」→ 增补 25 闭环：`delete from sys_role_menu where role_id in (9501,9502,9503,9504)`（`DELETE 290`）＋重启触发 `R__0.1.7_org_demo_seed` 重跑重授（9501/9503＝80、9502/9504＝8、menu 209/210/211 命中 0）。

### 4.3 第 25 项与 Owner 收口（分别记录，不重开）

- 清单原表第 25 行：「是否已修复＝是／回归结果＝N」保持原样（`product/0.1.7-bugfix/0.1.7bug.md:29`）。
- 增补 15 记录该行后续修复（顶部降噪补刀＋关联流程工作区版式：编号设置右上角、查询与新建靠右）与巡检口径。
- Owner 2026-10-18 整体裁决「修复结束」：43 项全部「已修复＝是」，42 项回归 Y、第 25 项原表仍 N；以整体裁决关闭修复阶段，不伪称 43 项均为 Y、不要求补写表格（`receipts/planning-close-017.md`）。

## §5 检查范围与限制

- 命令范围：`git remote -v`、`rev-parse`、`rev-list --left-right --count`、`branch -vv/-a/-r`、`for-each-ref`、`tag`、`ls-remote`、`log --all --name-only/--name-status/--contains`、`ls-tree`、`cat-file`、`merge-base --is-ancestor`、`status --porcelain`、`diff --submodule=short`、`stash list`；文件侧 `grep`/`ls`/`wc`/`head`/`sed`；远程侧 `ssh -i <pem>` 只读命令（`unzip -p`/`curl`/`ss`/`psql -tAc`/`grep`/`ls`）。
- 只读阶段未执行：`add/commit/push/fetch/tag/checkout/merge/filter-repo`；未构建、未迁移、未启动服务、未在远程写任何内容。
- 限制：①本地 `main` 跟踪引用陈旧，主分支事实以 `ls-remote` 为准；②GitHub 侧缓存/其他克隆不可本地观测；③远程回读为 2026-10-18 时点，后续变更需重新核实。

## §6 执行侧已推进的动作（本轮回传提交之后，均推送回读）

| 批次 | 仓 | 提交 | 内容 | 验证 | 远端回读 |
|---|---|---|---|---|---|
| 修复分支→develop | Server | `2d776ef`（快进，无新提交） | `bugfix/0.1.7` 8 提交合入 develop | 分支与 develop 无分叉（fast-forward） | `ls-remote` develop＝`2d776ef` |
| 修复分支→develop | Web | `fe1712b`（快进） | `bugfix/0.1.7` 31 提交合入 develop | 同上 | `ls-remote` develop＝`fe1712b` |
| 版本收敛 | Server | `700559e` | `pom.xml` `<revision>`→`0.1.7-SNAPSHOT`＋注释；`build-release.yml` 断言→`0.1.7-SNAPSHOT`；`build-prod.sh`/`check-version-identity.sh` 注释与断言同步 | `check-version-identity.sh pom`／`workflow`／`develop` 三模式 **PASS**（develop 模式实跑 Maven 求值：32/32 反应堆项目＝`0.1.7-SNAPSHOT`） | develop＝`700559e` |
| 版本收敛 | Web | `4e89249` | `package.json` version→`0.1.7` | `node -p` 回读 `0.1.7`；CI 以该值为 Release 标题/资产名来源 | develop＝`4e89249` |
| 种子收敛＋升级通道 | Server | `7bb2564` | 双方言 `V0.1.7__baseline_seed.sql`（＝V0.1.6 基线＋V0.1.7 增量逐字节拼接，h2 313,901 B／pg 337,040 B）＋原文件归档 `db/upgrade/0.1.7/legacy-0.1.6/`＋新增 `transition-history-to-0.1.7`／`upgrade-to-0.1.7-from-0.1.6`／README（checksum h2 `-1195786777`、pg `2016046975`，按 Flyway `ChecksumCalculator` 字节码口径复算并与已知 0.1.6 值标定一致）＋11 个受影响测试更新（迁移数 14→13、终点 0.1.7、升级路径延伸） | 受影响测试实跑 **50 run／0 failures／0 errors／4 skipped**：FlywayFullChainH2 17/0、FlywayFullChainPostgres 12/0、ApplicationCenterLegacyUpgrade 7/0、ApplicationCenterUpgradeContinuity 4/0、P62NonEmptyUpgradePg 3/0（内嵌 PG）、P64AppendMigrationUpgrade 1/0、P64RollbackBoundary 1/0、I6G7UpgradeDrillH2 1/0；跳过 4＝ApplicationCenterRecoveryDrillPostgres 1（需本机 PG 工具）+ Phase4PgMigrationBehaviour 3（需证据库） | develop＝`7bb2564` |
| develop→main | Server | `7bb2564`（快进，含 11 提交） | main＝develop＝`7bb2564` | `origin/main` 为 develop 祖先，快进无分叉 | `ls-remote` main＝`7bb2564`；CI run `39067678981` |
| develop→main | Web | `4e89249`（快进，含 32 提交） | main＝develop＝`4e89249` | 同上 | `ls-remote` main＝`4e89249`；CI run `39067698896` |

- 推进前状态（供追溯）：Server `bugfix/0.1.7`＝`2d776ef`、develop＝`eca43b7`、origin/main＝`04a8e1a3`；Web `bugfix/0.1.7`＝`fe1712b`、develop＝main＝`a60a819`。
- 未做（待授权/待决策）：历史改写与强推（需 Owner 对精确范围授权）；0.1.7 语义 tag/Release（本机无 `gh` CLI，待确认通道）；UAT 部署（待 CI 制品就绪）。
- 附带发现（如实记录）：0.1.7 修复轮新增 `V0.1.7__bugfix017` 与两支 `R__` 后，`I6G7UpgradeDrillH2Test`／`I6G7bOldBaselineUpgradePostgresTest`（断言 11 条＝V0.1.6＋10 R__）、`P64AppendMigrationUpgradePostgresTest`／`P64RollbackBoundaryPostgresTest`／`Phase4PgMigrationBehaviourTest`（断言终点 0.1.6）、`P62NonEmptyUpgradePgTest`（终点 0.1.6／单条 0.1.6 记录）与三个 `ApplicationCenter*` 升级演练测试的断言仍绑定旧链——按断言值与链实际内容（14 条）判断为修复轮遗留的既存红；本次收敛批次已一并按 0.1.7 口径更新，更新后实跑全绿（见上表）。

## §7 CI 发布事实与门禁拦截（Server）

| 项 | 实测 |
|---|---|
| Web CI（run `39067698896`，head `4e89249`） | **success**（241 s，全部步骤含 `Typecheck, lint, test and build` 与 `Create GitHub Release`）；Release `build-4e892497cd017cc902d3c4ebb36ac181fccd489a`，标题 `CH-aPaaS-Web 0.1.7 build 4e892497…`，资产 `dist-4e892497….zip` 1,347,131 B |
| Server CI（run `39067678981`，head `7bb2564`） | **failure**：步骤 5（Maven effective version＝`0.1.7-SNAPSHOT`）通过，步骤 6 `Production build`（`mvn -B clean test`）在 120 s 处退出 1（同仓库历史成功运行约 950—964 s，故为早失败）；`Locate executable JAR`／`Create GitHub Release` 均 skipped，未产出制品 |
| 定位方式 | 本机无 `gh` CLI 且 GitHub 日志接口需管理员权限（`HTTP 403`）；改用公开 API 读取运行/步骤时间戳与 check-run 注解（仅 `Process completed with exit code 1`），随后**本地复现**：`mvn -B -o clean test` 全量运行停在模块 22/32 `sw-biz-form-biz`，4 个测试类红 |
| 根因（修复轮遗留，非本次收敛引入） | ①`FormG2EntryConsistencyTest`／`FormAppAccessGuardTest`／`FormAppServiceTest` 的测试上下文在 `fab3d5e`（0.1.7 #1）后需要 `FormAppScopeMatcher` bean 但未定义（`UnsatisfiedDependencyException`）；②`DynamicTableSqlGateTest.g1` 报告 `FormAppManageController`／`FormAppScopeMatcher` 直接调用 `JdbcTemplate`，违反模块 G1「dynamic 包之外不得直接调用 JdbcTemplate」；③两个测试的 H2 夹具仍是 `sw_form_app_user`，而 #1 生产口径已改为 `sw_form_app_scope`（`Table "SW_FORM_APP_SCOPE" not found`）。修复轮收尾验证用的是 `-DskipTests` 打包，未覆盖这些用例 |
| 处置（Server `ab5a372`，已推送 develop） | 新增 `com.sw.ck.form.dynamic.FixedTableSql`——固定系统表只读 SQL 的唯一出口（表名/列名固定字面量、参数绑定、显式 `deleted = 0`、只读），`FormAppScopeMatcher`／`FormAppManageController` 改经受控入口（未放宽 G1）；三个测试补 `FormAppScopeMatcher` bean，两个测试夹具迁至 `sw_form_app_scope`（USER 维度） |
| 处置验证 | 4 个受影响类实跑 **31/0/0/0**（`DynamicTableSqlGateTest` 7、`FormAppAccessGuardTest` 7、`FormAppServiceTest` 10、`FormG2EntryConsistencyTest` 7） |
| 仓库历史参照 | 同仓 CI 并非恒绿：run 19（`04a8e1a3`，纯文档）失败于 859 s（已知 `P63ReservationBoundaryPgTest` 时序族），run 16（`e1aa67d5` 版本收敛）失败于 952 s、由 run 17 补齐受控设施后转绿——本次 Server 早失败与之不同，已定位到上述测试门禁 |
