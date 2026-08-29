# 三仓 README 重构与现状同步回执

> 角色：执行（Executor）
> 日期：2026-08-29
> 依据：`product/minimal-closure-first-acceptance/ready/direction-three-repository-readme-refresh.md`（READY）
> 性质：独立文档同步任务，仅重构三份 README；不修改业务代码/迁移/工程宪法，不提交推送 Git

## 一、修改前问题矩阵

| 文件 | 过期项 | 冲突项 | 变更记录式内容 | 缺失入口信息 |
|------|--------|--------|---------------|-------------|
| 根 `README.md` | 已完成功能「32」、后端「827 tests」、前端「100f/988t」（数月前的旧基线）；「git submodule 或独立 clone」表述混淆 | 项目状态节与 `knowledge/current-status.md`（36/955/1060/V44）冲突；「已完成功能 32 COMPLETED ✅」已随新功能落地过时 | 顶部「工作区演变轨迹」1-10 步为按时间/决策点堆叠的变更记录 | 缺第一轮最小闭环验收审计结论、权威状态唯一入口、三角色导航、编译互斥说明 |
| 后端 `Smart-WorkFlow/README.md` | 测试基线「465 tests（CONFIRMED 2026-07-28）」；Flyway「V1–V17、17 个版本」（实际 V44）；模块完成度用 Java 文件数（31/23/49/47/78）作为状态；sw-bpm「🟦 开发中」（实际核心闭环）；技术栈列 Spring AI/LangGraph4j 等未就绪蓝图 | 与当前事实不符：`[system.md](.claude/system.md)` 链接失效（实际工程宪法在 `docs/governance/engineering-constitution.md`）；sw-biz 模块漏 `sw-biz-form` 位置、漏 `sw-biz-notify`；命令缺少 2G 内存约束 | 无逐功能流水账，但模块完成度与测试基线为陈旧快照 | 缺 2G 内存硬约束、前后端编译互斥、双方言迁移规则、当前迁移终点 V44、权威文档导航 |
| 前端 `Smart-WorkFlow-Web/README.md` | `pnpm test` 注释「60 spec files / 521 tests」（实际 110f/1060t）；superAdmin「对齐后端 userId==1」（已 SUPERSEDED，现按角色 code 含 superadmin）；「已真接 vs seam」节部分 seam 描述与当前后端实况不符 | 测试计数标注与当前正式基线冲突；superAdmin 判定口径与 knowledge/shared-constraints 冲突 | 主体「已实现功能/项目状态」为按模块堆叠的当前状态描述，但无日期式变更日志 | 缺 Node 2G 内存约束、前后端编译互斥、当前测试基线、权威文档导航 |

## 二、目标读者、职责边界与最终栏目

### 1. 根 README（目标读者：新成员 / Owner / 跨仓协作者）
职责：三仓统一入口。
最终栏目：项目定位 → 三仓关系 → 快速开始 → 目录结构 → 核心架构 → 会话角色导航 → 当前状态快照 → 通用校验命令 → 权威文档导航。

### 2. 后端 README（目标读者：后端开发者 / 后端执行会话）
职责：后端开发入口。
最终栏目：技术栈 → 四层模块架构 → 依赖方向 → 模块边界（当前完成度）→ 环境要求 → 本地启动 → 构建/测试/迁移校验命令 → Flyway 双方言迁移 → 核心设计要点 → 权威文档导航。

### 3. 前端 README（目标读者：前端开发者 / 前端执行会话）
职责：前端开发入口。
最终栏目：技术栈 → 目录分层 → 启动与运行模式 → 校验命令 → 鉴权/菜单/路由/边界 → 已验证闭环 → 权威文档导航。

## 三、实际修改文件清单

| 文件 | 状态 |
|------|------|
| `README.md`（知识仓根） | 重构完成 |
| `Smart-WorkFlow/README.md` | 重构完成 |
| `Smart-WorkFlow-Web/README.md` | 重构完成 |

**仅此三份文件**；未修改任何业务代码、测试、迁移、构建配置、`system.md`、`roles/` 或工程宪法。

> 说明：工作区根仓 `memory/state.md` 与 `memory/handoff.md` 的工作区改动为**规划角色**在规划层会话为登记本 READY 同步方向而写入的状态记录（非执行层触碰）；执行层本任务未读写 memory。三份 README 之外的任何文件均未由执行层修改。

## 四、命令/路径/端口/模块/环境/链接/基线逐项核对

| 项 | 目标值 | 核对结果 | 证据 |
|----|--------|---------|------|
| 后端端口 | 8080，context `/api` | ✅ 一致 | `application.yml` / `application-dev.yml` / `application-local.yml` 均 `server.port: 8080`；`context-path: /api` |
| 前端代理 | `/api` → `http://localhost:8080` | ✅ 一致 | `vite.config.ts` proxy 块 |
| 后端启动 profile | `dev`(H2) / `local`(PG) | ✅ 一致 | `sw-bootstrap/src/main/resources/` 存在 `application-dev.yml` / `application-local.yml` / `application.yml` |
| 后端启动命令 | `mvn spring-boot:run -Dspring-boot.run.profiles=dev` 与 `-DskipTests` 打包 + jar | ✅ 一致 | Maven 标准插件；bootstrap 有 `StarterApplication.java` |
| 四个模块层级 | framework/basic/biz/bootstrap | ✅ 一致 | 根 `pom.xml` module 列表 |
| sw-biz 业务模块 | system/form/notify/bpm/openapi | ✅ 一致 | `sw-biz/pom.xml` module 列表 + 目录 |
| 后端测试基线 | 955/0/0/0 agent346 | ✅ 一致 | 根 README「955」、后端 README「955 项」 |
| 前端测试基线 | 110 spec files / 1060 tests / 0 skipped | ✅ 一致 | 根 README、前端 README 均「110 spec files / 1060 tests」 |
| 迁移终点 | H2 V44（44）/ PG V44（43） | ✅ 一致 | `db/migration/h2/V44__workflow_child_menus.sql`、`postgresql/V44__...sql`；根 README/后端 README 均「V44」 |
| 功能数 / 清单 | 36，✅32/🟦25/⬜33 | ✅ 一致 | 根 README「36」「✅32 / 🟦25 / ⬜33」与 `knowledge/current-status.md` 一致 |
| mvn 2G | 所有 mvn 命令带 `MAVEN_OPTS="-Xmx2g"` | ✅ 一致 | 根 README 校验命令、后端 README「构建/测试/迁移校验命令」节 |
| node 2G | 所有 pnpm/node 命令带 `NODE_OPTIONS` | ✅ 一致 | 根 README、前端 README「校验命令」节 |
| 后端工程宪法链接 | `docs/governance/engineering-constitution.md` | ✅ 可达 | 文件存在 |
| 前端工程宪法链接 | `docs/governance/engineering-constitution.md` | ✅ 可达 | 文件存在 |
| 角色定义 | `roles/planner.md` | ✅ 可达 | 根 README 导航引用 |
| superAdmin | role code 含 `superadmin`（不写旧 userId==1） | ✅ 一致 | 前端 README「鉴权/菜单/路由/边界」节；`UserDetailsProviderImpl` roleCodes 判定 |

## 五、相对链接有效性 + 残留检查

### 相对链接（全部真实可达）
- 根 README：`system.md`、`memory/README.md`、`knowledge/current-status.md`、`knowledge/architecture.md`、`knowledge/shared-constraints.md`、`roles/planner.md`、`Smart-WorkFlow/README.md`、`Smart-WorkFlow-Web/README.md` — 全部存在。
- 后端 README：`docs/governance/engineering-constitution.md`、`../system.md`、`功能清单.md` — 全部存在。
- 前端 README：`docs/governance/engineering-constitution.md`、`../system.md`、`eslint.config.js`、`vite.config.ts` — 全部存在。

### 残留检查（三份 README 全文）
| 关键词 | 结果 |
|--------|------|
| `947` / `1057` / `V43` | ✅ 零残留 |
| 旧测试计数（`465`、`827`、`988`、`60 spec`、`521`） | ✅ 零残留 |
| 旧启动命令（裸 `mvn -q` 无 2G） | ✅ 零残留 |
| `userId==1` | 仅出现一次且标注「**已废弃**」（前端 README 鉴权节），为正确口径澄清，非旧值残留 |
| 日期式变更标题（如「工作区演变轨迹」「本轮完成」） | ✅ 零残留 |
| 模块文件数作为状态（31 个 Java 等） | ✅ 已清理 |
| `V1–V17` / `17 个版本`（旧 Flyway） | ✅ 已清理 |

## 六、非变更记录 / 未复制治理条款 / 未建第二状态库证明

- 三份 README 全部改为**稳定栏目**（定位/技术栈/目录/启动/校验/导航），无按日期或需求编号堆叠的标题。
- 三份 README 对治理仅做**一句话导航**并链接 `system.md` / `roles/` / 工程宪法（后端 README 引用 `system.md §0.3` 为指向权威的引用，非复制条款；前端 README 链接工程宪法）。均未复制 `system.md`/角色文件的规则正文、未复制终态协议、未出现终态 marker 或 terminal-contract 等实现细节。
- 当前状态只在根 README 保留**精简快照**（维度表 + 一句话权威路径指向 `knowledge/current-status.md`），未复制完整功能清单、known-issues、决策历史或会话交接；后端 README 只列模块边界一行摘要并指向 `功能清单.md`。

## 七、终态

本回执物理末行为唯一合法终态 marker 行，已通过 `.codex/governance/validate-terminal.sh`。

SWF_TERMINAL {"schema":"smart-workflow.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","receipt":"product/minimal-closure-first-acceptance/receipts/receipt-three-repository-readme-refresh-20260829.md","evidence":["README.md","Smart-WorkFlow/README.md","Smart-WorkFlow-Web/README.md"],"feature_status":"IN_PROGRESS"}