# 规划审查：P66 0.4.0 发布（planning-review-final-02）

| 项目 | 内容 |
|---|---|
| 审查对象 | `receipts/execution-final-03.md`；工作区提交 `40c79d4b`、`ae0e67f2`、`1d50c116`（README、截图、version.json、CHANGELOG、memory、需求池） |
| 依据 | `ready/direction-multi-database-compat.md` §4 阶段 D（含 X1、UAT 运维附带项、README 重排）；`planning-review-final-01.md` V2/V3 |
| 日期 | 2026-11-09 |
| 审查角色 | Planner |
| 结论 | **发布通过，暂不做终态复核**：X1、V2、V3、合并、发版、UAT 部署与运维附带项全部通过；README 截图不达标（Z1），另有 Z2—Z4 三项要补。七阶段 **5/1/1** |

## 1. 通过项

| 项 | 证据 | 结论 |
|---|---|---|
| X1 | 已核对 10 种方言迁移后的最终列类型（PG/H2/openGauss/Kingbase 为 BOOLEAN，MySQL/MariaDB 为 SMALLINT，Oracle/DM 为 NUMBER(1)，SQL Server 为 BIT）；12 处全部恢复 Boolean 绑定；新增 `AgentToolEnabledPgTest`（真实 PG，覆盖 12 处）；六库冒烟都加了工具启用过滤；没有改迁移 | 通过 |
| V2 | MySQL 5.7、MySQL 8.0、MariaDB、Oracle、openGauss、SQL Server 在 `f45d2b5d` 上逐库 1/0/0 | 通过 |
| 全量门禁 | `mvn test` 2,481 / 0 / 0（skipped 45） | 通过 |
| V3 | feature #123、develop #126、main #127 均 success；#125 的失败见第 3 节 | 通过 |
| 合并与发版 | feature → develop `2c3bf850` → main `a4f6c278`，都是普通合并；annotated tag `0.4.0` 回读一致；语义 Release `438918154`，下载后 sha256 一致；未动任何已发布 tag | 通过 |
| UAT 部署 | 部署前可用 6.0G；DB dump 与 jar、配置都已备份；Flyway 新增 2 条（33 行），旧 31 条校验和不变；build.version=0.4.0，health UP，页面 200；工具过滤 internal 3、external 1、disabled 0；停机 3—4 分钟 | 通过 |
| 运维附带项 | `application-prod.yml` 中 `com.sw.ck`、`org.springframework.jdbc` 由 debug 改为 info，root 不变，没有加 appender 阈值；重启后 16 分钟内 DEBUG 0 行；logrotate 设为 14 份、100M、压缩，并已演练；PG drop-in `Restart=on-failure` 回读正确，未重启 PG；没有加告警 | 通过（附 Z4） |
| README 结构 | 徽章、首图、特性、三示例（已完成）、Mermaid、九库矩阵（DM8 和 Kingbase 标为“Owner 实库验证”）、快速开始、导航、许可证都有；GitHub 图片和徽章均返回 200 | 通过 |
| 截图脱敏 | Planner 逐张看过 8 张：只有演示人名和 UUID 业务单号，没有密码、token、手机号或邮箱 | 通过 |

## 2. 问题与补做项

### Z1 README 截图重拍（阻塞终态）

规格不符：图片是 1280×720、DPR 1，方向要求 1440×900、DPR 2。回执说明了宿主浏览器的限制，这一点如实写了；但画面本身有以下问题，作为公开展示图不达标：

| 图 | 问题 |
|---|---|
| `workspace.png`（首图） | 待办、已办、草稿全是 0，“暂无待办任务”，首图是空页面 |
| `agent-graph.png` | 画布只有连线和零散标签，节点没有渲染出来，看上去像坏图 |
| `sample-a/b/c.png` | 三张都是同一个“实例详情”抽屉，流程图缩得太小，节点文字看不清；`sample-c` 的抽屉右侧被截断；看不出三条流程各自的业务特点 |
| `workflow-designer.png` | 画布缩放 25%，节点文字看不清 |
| `approval-detail.png` | 时间列直接显示 ISO 原文（`2026-11-08T13:23:30.73`），等于把产品缺陷放到了首页（见 Z5） |
| `form-designer.png` | 合格 |

重拍要求：
1. 用 Playwright/Chromium（headless 也可以），viewport 设为 1440×900，`deviceScaleFactor: 2`。不再用宿主内置浏览器。
2. 首图选有数据的视角：用有待办和已办的演示账号看工作台，或者改用流程中心、应用中心首页。不要用空状态。
3. 三示例各拍出各自的业务特点，不要三张都是同一个抽屉：
   - A：会签意见弹窗，或结构化意见摘要（“标签：值”）；
   - B：误报/上报分支或督办的流转记录；
   - C：智能体研判结果，或偏差强制校准分支。
   - 流程图如果入镜，节点文字要清晰可读，可以放大或裁剪。
4. 智能体编排图：节点完整渲染并适配画布，最好打开一个节点的属性面板。
5. 流程设计器：缩放不低于 60%，或者局部取景，节点文字清晰。
6. 不要拍会显示 ISO 原文时间的界面。
7. 每张 ≤500KB，超了就转 WebP 或做量化压缩，文件名不变直接覆盖，README 引用同步。
8. 重新回读 GitHub 渲染效果；回执附 8 张图的尺寸和大小清单。

### Z2 回滚说明要更正

`version.json` 的 rollback 写的是“DB dump……（如需）”。但 0.4.0 已经应用了 `V0.4.0` 和 `R__0.4.0`（`comment` 列改名为 `opinion_comment`）。0.3.2 的 jar 遇到未知的已应用版本时，Flyway 校验会失败，而且旧代码仍然读 `comment` 列。所以**回退到 0.3.2 必须恢复 `smart_workflow_20261109_pre040.dump`**，不是“如需”。

要求：
- 本机演练一次：用 0.4.0 迁移过的库启动 0.3.2 jar，确认实际表现；
- 按演练结果改正 `version.json` 和 `docs/ops/production-ops.md` 的回退步骤（先停服务，再恢复 dump，再换 jar）。

### Z3 发布后分支同步

回执只写了 develop `2c3bf850`、main `a4f6c278`（main 上的合并提交），没有说明发布后 develop 是否已经同步到 main。

要求：
- 按以往做法，用普通推送把 develop 快进到 `a4f6c278`，不强推；
- 回读 `origin/main = origin/develop`，tag 指向不变；
- 确认 feature 分支是否保留，并写明。

### Z4 部署后 24 小时日志量

方向要求记录部署后第一个完整 24 小时的日志量。这项要等到 2026-11-10 17:16 以后，届时只读统计：
- 当天 `server.log` 的大小；
- `df -h /`；
- logrotate 是否已经按 maxsize 或按日实际轮转过。

### Z5 新发现的产品缺陷（不阻塞，进候选）

流程实例详情抽屉的“发起时间”和审批记录的“开始时间”“完成时间”直接显示 ISO 原文，还带着微秒。0.3.4 只修了意见摘要里的时间，没覆盖这里。已登记到需求池观察区，以后归入 Web 补丁，**不进本轮**。

## 3. CI 偶发失败

`JavaSubprocessSandboxTest` 在 #125 上失败两次，第三次重跑通过。根因（主线程先于 RPC 读线程取结果）分析得清楚，和本次改动无关，已登记 `todo/iot-subprocess-output-race.md`。**接受**，归入测试抖动候选，不阻塞。

## 4. 七阶段与下一步

1 评估 ✅｜2 执行 ✅｜3 验收与同步 ✅｜4 合并 ✅｜5 发版 ✅｜6 发布后同步 🟦（Z1—Z4）｜7 结束 ⬜ → **完成 5、进行中 1、未开始 1**。

下一步：Executor 完成 Z1—Z4，回执记为 `receipts/execution-final-04.md`。Z4 必须在 2026-11-10 17:16 之后做，Z1—Z3 可以先做。之后 Planner 做终态复核：确认第 52 个正式功能，把方向归档到 `passed/`，P66 标记为 COMPLETED。

功能登记：Executor 已在 `version.json` 和 knowledge 中预登记了 52，**以 Planner 终态复核为准**，这之前不算正式生效。
