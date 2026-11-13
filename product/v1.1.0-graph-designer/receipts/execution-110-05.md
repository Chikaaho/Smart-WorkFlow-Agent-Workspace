# execution-110-05：1.1.0 阶段 4—6 完成（合并 / 发版 / 演示环境部署与复测）

方向 `product/v1.1.0-graph-designer/ready/direction-v1.1.0.md`（XL）｜执行｜2026-11-13｜阶段 3 经 `planning-review-110-05.md` 通过后执行阶段 4—6。本回执记录合并链与 CI、两仓 tag/Release、演示环境（UAT 8.166.112.85）部署与 G1/G3/G4 复测、同步与数据处置；**演示环境全程只做发布与复测，不删不重建，未碰用户 8080/5173、`smart_workflow_f1v4b`、`smart_workflow_030`**。

## 1. 阶段 4 合并与 CI

两仓 `feature/1.1.0` → `develop` → `main` 普通合并（`--no-ff`，不改写历史、不强推）。**合并前发现并修复两处 CI 红因**（此前分支 CI 一直红）：

1. **源文件被本地 exclude 吞掉**：`.git/info/exclude` 的 `config/` 规则为宽匹配，`AgentHumanTaskSchedulingConfig.java`（`AutoConfiguration.imports` 引用）从未入库，CI clean 构建缺类 → 多个 Boot 集成测试上下文加载失败；同类被吞的还有 `NotifyChannelPropertiesBindingTest`、`SwVendorMigrationRunnerTest`、`SwVendorMigrationRunnerDmProxyTest`。修复：exclude 改为 `/config/`（仅根目录），4 个源文件补提交（`35ef2571`）。
2. **生命周期测试闩锁竞态**：`AgentHumanTaskLifecycleTest` 的闩锁挂在 `runLifecycle` 返回处，异步线程尚未执行 `finish` 就 verify，慢 runner 上必现失败；改为闩锁挂在 `finish` 上（`95b3af66`）。

| 仓 | feature | develop | main |
|---|---|---|---|
| Server | `43372303893` success（`95b3af66`） | `43374153229` success（`131bc4da`） | `43377261626` success（`6d6bd666`） |
| Web | `6c8f936` → run success（`43371886255` 为 develop 前最后一跑） | `43371886255` success（`3ab13f31`） | `43372675822` success（`bf84989d`） |

两仓 feature 分支 merge-base 验证后本地与远端均已删除。Server 全量测试沿用阶段 3 门禁结果（2515/0/0/45，CI 同源构建再次全绿）。

## 2. 阶段 5 发版（tag + Release Latest + 制品）

| 仓 | tag → commit | Release | 制品 | 字节 | sha256 |
|---|---|---|---|---|---|
| Server | `1.1.0` → `6d6bd666`（annotated） | `443946002`「CH-aPaaS Server 1.1.0」Latest | `bootstrap-1.1.0.jar` | 242,762,534 | `a1fd5ca6275895a48b55fe8f3de9b9ae23f199aff0b5cb927914ffcb7c8ac40c` |
| Web | `1.1.0` → `bf84989d`（annotated） | `443883862`「CH-aPaaS Web 1.1.0」 | `sw-web-dist-1.1.0.zip` | 6,254,854 | `b1e8fe4fe774e9c41cb7a3b54dcd99268e5a243d68c241019df3487df7015573` |
| Web | `1.1.1` → `3cc05844`（annotated） | `444137262`「CH-aPaaS Web 1.1.1」Latest | `sw-web-dist-1.1.1.zip` | 6,255,031 | `fb42a52b8de2f3c050e456758fb9c1d19c1898b79fb8854a2d19f32fd6d3e47e` |

- 两仓 Release 资产均取自同提交的 CI `build-<sha>` Release（同一次构建产物，下载→sha256→重传），发布说明含四项已知限制：子图超时不按父执行剩余时间计算；人工超时扫描为单实例 `@Scheduled`；DM8/KingbaseES 仅迁移脚本静态核对；处理人角色保存的是角色编码。
- 其他 tag 与 Release 未改动；`build-<sha>` 自动产物保留。
- **Web 1.1.1 为发布当日补丁**：UAT 复测发现设计器运行状态角标 bug（执行事件序号在服务端 Long→String 序列化后，运行中刷新用字符串比较 `"10" <= "9"` 为真，序号 ≥10 的 NODE_* 事件被整体丢弃，终态把已成功节点误标「跳过」）。修复 `GraphDesigner.vue` 先转数值再比较（`8eaefbd`），版本升至 1.1.1（`8881ca1`），补丁链 `feature/1.1.1-event-seq-fix` → develop（`f322440`）→ main（`3cc0584`），CI `43413013083`/`43413772266`/`43414744604` 全 success，1.1.1 Release 设为 Latest。

## 3. 阶段 6 演示环境部署（先 Server 后 Web）

**部署前（2026-11-13 15:38）**：磁盘可用 5.9G（≥3G）；备份数据库 `/data/backup/smart_workflow_20261113_1538_pre110.dump`（1,321,696 B）、后端 `bootstrap.jar.bak-pre110`（242,697,784 B，1.0.0）、`server.env.bak-pre110`（2,888 B）、前端 `web.bak-20261113_1538_pre110`（11M）。

**Server**：上传 1.1.0 jar → 远端 sha256 `a1fd5ca6…` 与 Release 资产一致、`build.version=1.1.0` → `stop.sh` → 换包 → 加载 `server.env` 后 `start.sh`（PID 3497126）→ **启动 15:51:45（Started）、health 200、Flyway 34→35 行（max version 1.1.0，+1）、启动段 ERROR 0**；在跑 jar 回读 `build.version=1.1.0`。

**Web**：1.1.0 zip 部署（入口 `index-Ky3UEkaW.js`）后，因 1.1.1 补丁同日发布，再替换为 1.1.1（入口 **`assets/index-tFylQPt8.js`**）；`nginx -t` 通过、`nginx -s reload`；根 `https://chikaho.cn/` 200（2,045 B）、入口 JS 200、`/sw-server/api/actuator/health` 经 nginx 200、旧入口 `/sw/` 301 到根路径。

## 4. 演示环境复测（G1/G3/G4，各一组）

| 项 | 结果 | 证据 |
|---|---|---|
| G1 新建图（LLM + 条件分支 + 知识检索）试运行 | 图 `智能巡检编排示例`（LLM=deepseek-v4.1-flash 研判模型、知识检索=MES 工艺温度样本知识库、条件输入 topic/关键词「设备」）；试运行成功，输出为知识库检索结果（温度控制要求 3 条 + 样本判定），**逐节点状态：开始/LLM/条件/知识检索/结束 全部「成功」**（1.1.1 修复后） | `uat110-g1-run.png`（终态全成功）、`uat110-g1-midrun.png`（运行中 LLM「运行中」） |
| G3 人工节点处理一次 + 子图调用一次 | 父图 `UAT110-G3父图-*`：START→HUMAN（指派 admin）→SUBGRAPH→END；待办提交「通过」+ 意见后续跑 **SUCCESS 887ms**（执行 `2121183224724520961`；此前 `WAITING_HUMAN`），DB 核验子图子执行 `2121183306790273026` SUCCESS（parent=父执行 id），节点行 START/HUMAN/SUBGRAPH/END 均 SUCCESS | `uat110-g3-todo.png`（待办两条含本次任务）、`uat110-g3-detail.png`（执行详情成功 + 执行编号/受理号） |
| G4 明细表任务详情 / 发起人选择器 / 监控页 | 新建「UAT110 采购审批」表单（6 主表字段 + 4 列明细表 10 行）+ 审批流；任务详情滚到底：明细最后一行「路由器」完整可见、操作区钉在视口底部不遮内容（X1 修复在演示环境成立）；实例监控发起人筛选「系统（IoT）」命中 2 条（MES 设备温度偏离研判与安全处置，状态「已通过」/`DISCARDED`，时间 `2026-11-07 02:58:29`，流程定义列显示流程名） | `uat110-g4-task-top.png`、`uat110-g4-task-bottom.png`、`uat110-g4-monitor.png`、`uat110-g4-monitor-iot.png` |

**UAT 复测发现的产品缺陷（已修复并随 1.1.1 部署）**：设计器事件序号字符串比较（见 §2）。修复后在 UAT 复跑同一图，全节点状态正确（`uat110-g1-run.png`）。

## 5. 测试数据处置

- 复用 `admin`（默认租户超管），**未新建任何账号**，故无账号需停用；未改造/停用既有演示账号。
- 新建测试数据保留不删：图 `UAT110-G1*`、`UAT110-G3子图/父图`、表单 `UAT110 采购审批`、流程 `UAT110审批流`、执行与实例（含历史遗留 1 条 WAITING_HUMAN 测试执行 `2121178715751251970`，按「测试数据不删除」留置）。
- 演示环境自身数据（MES/校园知识库、既有实例）未改动。

## 6. 同步

- `version.json` → `1.1.0` / PUBLISHED（featureCount 58，Server 1.1.0 + Web 1.1.1，含 CI 修复与 UAT bug 记录）。
- `CHANGELOG.md` → 1.1.0 条目（G1/G3/G4、统一执行编号、Web 1.1.1 补丁、制品与已知限制）。
- `knowledge/current-status.md` → 1.1.0 状态段；`knowledge/feature-reconciliation-index.md` → 正式功能数 58（G1/G3/G4 第 56—58 个）；`knowledge/features/v1.1.0-graph-designer.md` 登记。
- 需求池 `todo/requirement-pool.md`：1.1.0 段改为「已发布…待阶段 7 复核」；P70（显示小修）保持未排期。
- README 三仓：版本徽标/文内版本更新（Workspace 1.1.0、Server 1.1.0、Web 1.1.1）、`agent-graph.png` 用新设计器在 UAT 重拍并裁去含测试图名的顶栏（脱敏），三仓 `docs/assets/readme/agent-graph.png` 同步。文档提交：Server `0c5834cf`→`fc20813c`（develop）→`91b20861`（main），CI `43417045898`/`43419522101`/`43419547108`；Web `438e3cf9`（develop）→`136a9581`（main），CI `43417111211`/`43417148615`。其中 `fc20813c` 首次 CI 因既有 I6 通知用例时序抖动失败（`I6G1aNotifyFailureBootTest` 断言 "FAILED" but was "RESENDING" 等 2F/1E，与本轮改动无关），同提交 rerun 后 success。

## 7. 已知限制（随发布说明公开）

1. 子图超时不按父执行的剩余时间计算（父级总时限兜底）。
2. 人工超时扫描为单实例 `@Scheduled`，多实例部署需注意。
3. DM8、KingbaseES 只做了迁移脚本静态核对，没有实际运行。
4. 人工节点处理人角色保存的是角色编码。

## 8. 下一步

阶段 7：Planner 复核演示环境证据与同步后结束（1.1.0）。隔离容器（`iso-pg5433` 等）按约定留待阶段 7 结束后清理。
