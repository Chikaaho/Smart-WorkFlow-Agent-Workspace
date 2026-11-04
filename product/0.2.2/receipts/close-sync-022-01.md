# 0.2.2 第 3 阶段同步回执（close-sync-022-01）

- 方向：`product/0.2.2/ready/direction-022-close-release.md`（revision 13，FINISH）；承接角色 Executor。
- 回归起点：Server `feature/0.2.2-bundle` @ `d61dceca`（工作树 clean）、Web @ `c8a2eb1`（仅 `vite.config.ts` 在途改动，未入任何提交）。操作说明提交：Web `4bfb87d`（`c8a2eb1..4bfb87d`，docs 1 文件 +14，仅 markdown，不触及门禁代码路径）。
- 结论：第 3 阶段三件事（回归、操作说明、同步）全部执行完毕；**回归发现 7 例 sw-bootstrap 测试侧确定性失败（阻塞合并门禁），按方向边界「新缺陷报告规划」上报处置，本回执不修测、不进入第 4 阶段**。

## 一、门禁

| 项 | 结果 |
|---|---|
| Web typecheck / lint / vitest / build | **全绿**：0 错误 / 0 错误 / **2017 passed + 3 skipped**（231 文件）/ ✓ built in 5.18s，exit=0（`assets/close-022-gates-web.log`） |
| Server `MAVEN_OPTS=-Xmx2g mvn -q compile` | **绿**（宪法合并门前置） |
| Server `MAVEN_OPTS=-Xmx2g mvn -q test`（全工程） | **exit=1——7 例失败，全部集中在 sw-bootstrap 模块 PG 升级门测试**（`assets/close-022-gates-server.log`，其余模块同轮全绿）： |

**失败明细与定性（全部为测试侧确定性缺陷，非产品缺陷；产品迁移链由冒烟实测正常）：**

| 测试 | 例数 | 失败内容 | 定性 |
|---|---|---|---|
| `P62NonEmptyUpgradePgTest` | 3 | 断言「升级/衔接后终点应为 **0.2.0**」，实际 **0.2.6** | 断言写死基线终点，F1/F2 追加 0.2.2～0.2.6 版本化迁移后过期。该「0.2.0」系 0.2.0 种子压缩时代的最新版写死，0.2.1 期 versioned 终点仍为 V0.2.0 故 CI（run 41608817497）绿；F1 起再无全量/CI 运行，欠账沉淀 |
| `P64AppendMigrationUpgradePostgresTest` | 1 | 「基线终点应为最新迁移」expected 0.2.0 was 0.2.6 | 同上（写死字面量） |
| `P64RollbackBoundaryPostgresTest` | 1 | 「在役基线应为最新迁移」expected 0.2.0 was 0.2.6 | 同上 |
| `F1ProviderModelMigrationPostgresTest` | 2 | `不良的类型值 int : t/f`——`rs.getInt("enabled")` 读 PG boolean 列 | 测试自身类型缺陷：V0.2.2 建 `enabled` 为 boolean（t/f），getInt 恒错。该测试自 F1 stage1 建立起在 PG 上从未绿（H2 变体可过；0.2.1 后无 CI 全量故未暴露） |

- 佐证：产品迁移链冒烟正常（见二，f1v4b 0.2.5→**v0.2.6** 全链升级成功）；F2 轮迁移门禁 33/33 覆盖的是 FlywayFullChainH2/Postgres 全链新建，不含本批存量升级门测试，故逐轮门禁未暴露。
- **处置边界引用**：方向「新缺陷：不再写功能代码。回归或发布中发现阻塞发布的真实缺陷时，报告规划，由规划判断是否在本版修」。修法涉及口径选择（字面追新 0.2.6／改为「最新版常量」／与第 4 阶段「发布要求的种子压缩」联动重设计），属规划裁量，本回执不代决。

## 二、冒烟（本地库 `smart_workflow_f1v4b`，保留不清库）

- **迁移版本**：启动前 Flyway 终点 **0.2.5**（f1 stage3 knowledge rag）→ 启动即迁移 **applied 2 migrations → v0.2.6**（server 日志 `server_f1v4b_close.log` 本机留存；`flyway_schema_history` 回读一致）。jar 为 d61dceca 构建。
- **浏览器**：ZCode 应用内浏览器（IAB），**headless=false**，1440×900；登录默认租户 admin（口令按 `f1-stage3-1.md` 第 53 行既有先例：本地库临时重置为既有测试口令，仅本地验证；冒烟后未回滚，如实记录）。
- **F1**：智能体 → 已发布 `rag-openrouter-graph`（v2）单步调试执行 → **已完成**、**快照版本：v2**、trace 4、33.86s；节点轨迹 知识检索成功（blue-whale.md/mars-base.md/word-probe.docx 三段真实内容+相似度）→ LLM 调用成功（输入 235 / 输出 66 token、3.14s）→ 真实输出「不知道。」（问题与知识库内容无关，模型如实回答，行为符合 F1 验收口径）。截图 `assets/close-022-f1-graph-execution.png`（执行记录页整页，快照版本/节点轨迹/Token/结果同框）。
- **F2**：同一环境同一身份——新建「回归冒烟应用」+1 表单（文本输入字段，保存）→ 卡片「更多 → 导出应用」（837B 包，页内拦截 Blob 存档）→ 「导入应用」上传同包 → **预检**（0 目录 · 1 业务表单；「目标租户已有同名应用，导入时自动加后缀」提示；可见范围 USER 置空）→ 确认导入 → **报告**（导入成功；新建应用：回归冒烟应用-导入；「1 表单 · 0 流程 · 0 意见表单 · 字典 新建 0 · 复用 0 · 0 交易动作 · 0 查询契约」；置空区 USER）。截图 `assets/close-022-f2-import-preview.png`、`assets/close-022-f2-import-report.png`。
- **整版结论**：F1 与 F2 在同一提交、同一环境、同一会话内合跑正常；冒烟产物留存于 f1v4b（库按方向保留）。

## 三、操作说明（应用导入导出）

- 入口：Web 仓既有用户文档 `docs/user-guide/operation-manual.md`，新增「**应用导入导出**」一节（置于「应用管理与排列」之后），覆盖方向要求的全部六要点：①导出包里有什么（应用/目录/表单/意见表单/流程/交易动作/查询契约/字典类型与项；不含数据记录与环境级配置）②导入两步流程（预检→确认；整体成功或回滚）③意见表单 key 冲突处理（冲突项逐个填新标识、租户内唯一才能确认、拒绝时对应输入项下提示）④导入报告怎么看（顶部「新建 N · 复用 M」双口径、字典区、置空区、可下载且与记录一致）⑤导入后全部草稿需逐个发布（发布校验外部引用）⑥同名数据源先授权（未授权发布被拒；无同名数据源则绑定置空留痕）。
- 提交：随 Web 仓 `feature/0.2.2-bundle` 提交推送（docs 纯文档改动，不触及门禁代码路径）。

## 四、同步（覆盖矩阵）

| 入口 | 写入内容 | 回读结果 |
|---|---|---|
| `knowledge/current-status.md` | 头部「当前状态/唯一终态值」更新为 0.2.2 第 3 阶段完成后事实（PASSED、功能数 50、迁移终点 V0.2.6 实测、起点提交）；新增 2026-11-05 第 3 阶段条目（含 7 例门禁失败上报）；0.2.1 段降为历史 | 已回读（编辑生效，随根仓提交） |
| `knowledge/features/0.2.2-integrated-release.md` | 新建：第 50 个正式功能注册（D022-16，F1+F2 两部分，PASSED） | 已回读 |
| `knowledge/feature-reconciliation-index.md` | §0 权威值「正式功能数」49→**50**（含历史链保留） | 已回读 |
| `memory/state.md` | 第 3 阶段完成事实＋7 例上报＋剩余阶段链 | 已回读（1,987 B） |
| `memory/handoff.md` | 按 13 节模板改写为 0.2.2 交接（未完成内容含处置依赖） | 已回读（约 3.2KB） |
| `memory/features.md` / `memory/README.md` | 功能数 50 落地（登记文件指引）；唯一下一动作改第 4—6 阶段 | 已回读 |
| `todo/requirement-pool.md` | 0.2.2 段更新：第 3 阶段完成、剩余阶段、候选保留 | 已回读 |
| 两仓 README/AGENTS（项目声明） | **未改动**——两仓 README「当前发布版本 0.2.1」描述的是已发布事实，0.2.2 尚未发布；版本声明按第 4 阶段版本收敛（develop）与第 6 阶段发布后同步更新 | 核对依据见五.4 |

memory 体量：8 件合计约 16.4KB，每件 <5KB（合规）。P 编号无新增核销、90 明细零行状态升降、里程碑/明细 ID 无新增、正式验证基线集合 []。

## 五、如实报告

1. **7 例门禁失败为本轮最重要发现**：全部为 sw-bootstrap 测试侧确定性缺陷（写死版本字面量×5、PG boolean 读法×2），自 F1 起沉淀（0.2.1 后无 CI 全量、逐轮门禁为模块范围故未暴露）；产品侧无缺陷证据（冒烟迁移链+全链 25 迁移两轮实测）。**未修测、未改范围**，按边界上报规划；第 4 阶段在其处置前不启动。
2. **admin 口令本地重置**：按 f1-stage3-1 既有先例将默认租户 admin 口令重置为既有测试口令（本地验证用，未回滚，库保留）；未触碰任何真实凭据，无 Key 入文件/回执/截图。
3. **冒烟产物留存**：「回归冒烟应用」及导入副本、graph 执行记录留存于 `smart_workflow_f1v4b`（方向明确保留该库）；server 8080 仍指向 f1v4b（Executor 自启进程，后续阶段按需切换）。
4. **两仓 README 版本声明未改**的理由：其语义为「当前发布版本」（0.2.1 仍为已发布事实）；0.2.2 版本声明属第 4 阶段 develop 版本收敛与第 6 阶段发布后同步的范围，避免发布前出现不实声明。
5. **Server 门禁日志 14MB**（-q 模式仍含大量测试期 Spring DEBUG）：按要求全量存 `assets/close-022-gates-server.log` 未裁剪。
6. 全部进程为本轮自启（server 8080/vite 5174）；未按端口或名称停他人服务；迁移历史未改。

## 六、唯一下一动作

等待规划对 7 例失败处置裁决（本版修/延期/口径）；裁决后按同一方向连续推进第 4—6 阶段（合并→发布→发布后同步）。
