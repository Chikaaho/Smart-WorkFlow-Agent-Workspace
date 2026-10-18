# CH-aPaaS 发布说明 / Release Notes

## 0.1.7（2026-10-18 发布并 UAT 由 0.1.6 就地升级部署；成对公开 Release 0.1.7 已发布；收尾回执 release-017-02.md，终态待规划复核）

- **版本发布事实**：0.1.7 Bug 修复列车（43 项，Owner 整体收口）沿 开发分支→develop→main 合入（Server `5af1329`、Web `4e89249`）；main 推送触发既有 CI 通道，两仓自动 Release `build-<sha>`（Web run `39067698896` success，制品 `dist-4e892497….zip` 1,347,131 B；Server run `23` success，制品 `bootstrap.jar` 218,033,508 B sha256 `309e9e1e…`，label `bootstrap-0.1.7.jar`），CI 采用版本与制品内 `build.version` 均为 **0.1.7**；**成对 annotated tag `0.1.7`**（Server `5af1329`、Web `4e89249`；发布前核实两仓均无 0.1.7 标签，未覆盖/移动任何既有标签）。回执 `product/0.1.7-bugfix/receipts/release-017-01.md`。语义 Release 资产（对齐 0.1.6 的「成对语义 Release」形态）已发布：**公开 Release `0.1.7`**——Server [`CH-aPaaS Server 0.1.7`](https://github.com/Chikaaho/Smart-WorkFlow-aPaaS-server/releases/tag/0.1.7) 资产 `bootstrap-0.1.7.jar` 218,033,508 B sha256 `309e9e1e…`、Web [`CH-aPaaS Web 0.1.7`](https://github.com/Chikaaho/Smart-WorkFlow-aPaaS-Web/releases/tag/0.1.7) 资产 `sw-web-dist-0.1.7.zip` 1,347,131 B sha256 `493dbaac…`；两资产取自对应 `build-<sha>` Release 的同一次 CI 构建产物，经既有 git 凭据通道创建，下载回读 200（latest 指向 0.1.7）。
- **版本与迁移收敛**：Server 工程默认 `0.1.7-SNAPSHOT`（`pom.xml` `<revision>`，34 POM 唯一来源）＋CI 断言与脚本同步（`check-version-identity.sh` pom/workflow/develop 三模式 PASS）；Web 包版本 `0.1.7`。迁移收敛为每方言单一 `V0.1.7__baseline_seed.sql`（＝0.1.6 基线＋0.1.7 增量逐字节拼接；checksum h2 `-1195786777`／postgresql `2016046975`）＋12 支 `R__`（含 `R__0.1.7_catalog_menu_first.sql`、`R__0.1.7_org_demo_seed.sql`）；新增独立升级通道 `db/upgrade/0.1.7/`（`transition-history-to-0.1.7`／`upgrade-to-0.1.7-from-0.1.6` 二选一，单事务、恰好一次），原文件归档 `legacy-0.1.6/`。
- **功能内容（0.1.6→0.1.7，修复列车不新增业务功能数）**：应用可见范围五维度（USER/DEPT/ROLE/POST/TENANT，`sw_form_app_scope`）、后台菜单调整（定时任务并入系统管理、应用管理上提）、应用中心/应用工作区与设计器交互与版式收敛（网格应用列表、应用专属侧栏、字段清单页签化、属性面板尺寸统一、流程编号要素编排器、流程图默认上下走向与视觉重做）、详情与填写/发起/数据表单统一（单一控制面、无噪音画布、提交成功确认）、待办/已办与全局列表降噪、表头设置抽屉化、全局搜索 bar 12 格栅格、按钮文案≤4 字、流程中心版式三项与组织架构演示种子（双租户 9001/9002）。
- **UAT 实测（0.1.6→0.1.7 就地升级）**：备份 `smart_workflow_20261018_0655_pre017.dump`＋`bootstrap.jar.bak`＋`web.bak-20261018_0655` → 停服 → 执行 `upgrade-to-0.1.7-from-0.1.6.postgresql.sql`（菜单定点 UPDATE、`sw_form_app_scope` 建表建索引、历史收敛为单条 0.1.7）→ 换包（sha256 一致）＋部署前端 → 显式加载 `server.env` 启动；健康 200、`Started StarterApplication in 168.305 seconds`、启动段 ERROR 0、DB versioned 终点单条 **0.1.7**（checksum `2016046975`）、`R__` 应用 2 支单次执行、零 versioned 重放；可见会话（demo 租户管理员）核验流程中心侧栏置顶、集合区纯白背景、我发起的筛选字段等宽与按钮≤4 字、应用中心渲染正常（截图面工具超时未取得视觉制品，不主张正式视觉验收）。
- **边界**：发布任务不新增业务功能数、不核销 P 编号；正式功能 49、清单 46/22/22=90、ADV64/问题57、P62 性能延期/OFF 保持；P65 独立待排期。修复轮遗留的测试门禁红（`sw-biz-form-biz` 上下文/夹具/G1 守门、`P62NodeLevelGuaranteePgTest` 与演示种子撞号）已在发布前修复并实跑全绿（本地全量 `mvn clean test` BUILD SUCCESS，`sw-bootstrap` 259/0/0/32）。**0.1.6** 为历史发布（同版本覆盖纳入验收修复）。

## 0.1.6（2026-10-16 发布并 UAT 就地升级部署；同版本覆盖纳入验收修复；发布复核 PASSED、终态同步 COMPLETED〔规划已确认，2026-10-16〕）

- **版本发布事实**：两仓 `feature/release-016-ci-fix`→`develop`→`main` 快进合并并推送（Server `e115857`、Web `f91e8bf`）；main 推送触发既有 CI 通道，两仓自动 Release `build-<sha>`（Server 制品 `bootstrap.jar`、label `bootstrap-0.1.6.jar`；Web `dist-f91e8bf….zip`），CI 采用的版本与制品内 `build.version` 均为 **0.1.6**；**成对 annotated tag 与公开 Release `0.1.6`**（Server 资产 `bootstrap-0.1.6.jar`、Web 资产 `sw-web-dist-0.1.6.zip`；发布前核实此前无 0.1.6 标签，未覆盖/移动任何既有标签）。回执 `product/0.1.6-release/receipts/release-016-02.md`。
- **验收修复同版本覆盖（2026-10-16，Owner 授权“还是 0.1.6，版本号覆盖”）**：用户端应用中心入口与布局修复（Web `feature/application-center-user-entry`：`c3cd686` 顶栏常驻应用中心、`f9798cd` 原型化应用中心、`e5aa357` 去全局侧栏＋白底目录栏）按 feature→develop→main 集成（develop=main=`e5aa357`），**Web 0.1.6 语义标签与同名 Release 同版本覆盖**（旧目标 `f91e8bf` → 新目标 `e5aa357`；正式资产 `sw-web-dist-0.1.6.zip` 替换为本次 CI 制品 sha256 `21687e55…`，CI run `38862870660` success）；UAT 前端由修复候选收敛到该正式制品并完成入口点击复验；Server 保持既有 0.1.6 身份与制品（前端修复，不重建无变化的后端）。回执 `product/0.1.6-release/receipts/release-016-03.md`；覆盖前身份恢复点 `product/0.1.6-release/receipts/evidence/republish-016/`。
- **发布门禁（CI 实测）**：Server sw-bootstrap **256/0/0/34**、全仓各模块汇总 **2046/0/0/34**、制品门禁全绿（`build.version=0.1.6`＝期望发布版本）；Web 四检（typecheck/lint/test/build）通过（169 文件通过+1 跳过、1549 用例通过+3 跳过）。本地模块级回归 304/3/0/27，3 项均为既有负载/平台时序族（已按真实结果分类记录，未写"全绿"）。
- **功能内容（0.1.5→0.1.6）**：应用中心与表单分类统一（`application-center-form-classification`，**COMPLETED（规划已确认，2026-10-16）**，正式功能 **第 49 个**）：应用（一级）→目录（二级）→表单归属、用户端应用中心、表单管理与应用工作区、存量分类/表单承接与冲突留账；两项 P63 发布门禁测试补齐仓内受控设施（broker/对端/传输随测试生命周期自管，缺设施显式失败）；前端跨模块依赖经 `src/adapters/*` 接缝整改（32 项 `import/no-restricted-paths` 清零，ESLint 配置未改、规则未放宽）。
- **迁移与在役库**：每支持方言单一 `V0.1.6__baseline_seed.sql`（=0.1.5 种子 + 应用中心增量逐字节拼接）+ 10 支 `R__`；新增独立升级通道 `db/upgrade/0.1.6/`（`transition-history-to-0.1.6`／`upgrade-to-0.1.6-from-0.1.5` 二选一，单事务、恰好一次）。**UAT 实测**（chikaho.cn 单机，S1 入口）：备份 `smart_workflow_20261016_1236_pre016.dump`＋jar/web 备份 → 停服 → 执行脚本 → 换包与部署前端 → 启动；健康 200、启动段 ERROR 0、DB versioned 终点单条 **0.1.6**（checksum `-1768731444`）、**零 versioned 重放**、`R__` 新增 1 支单次执行；可见最小业务链（应用中心 `未分类` 承接 2 业务表单 → 表单数据列表 → 发起 → 待办 → Approve → 我发起的 Approved）。
- **边界**：发布任务不新增业务功能数、不核销 P 编号；正式功能 49、清单 46/22/22=90、ADV64/问题57、P62 性能延期/OFF 保持。发布验收 PASSED（`product/0.1.6-release/receipts/planning-review-release-016-03-passed.md`）；终态同步回执 `product/0.1.6-release/receipts/terminal-sync-01.md`，终态最终确认 `planning-final-review-terminal-sync-01-completed.md`（COMPLETED，2026-10-16），五份方向全部归档 `product/0.1.6-release/passed/`。**0.1.5** 为历史发布（持续修复发布列车，UAT 直接部署、未建 tag/Release）。

## 0.1.3（2026-09-30 发布并 UAT 删库重建部署；Owner已验收，2026-09-30，依据 product/v0.1.3-release/receipts/owner-accepted-20260930.md）

- **版本发布事实**：两仓 `develop` 快进合入 `main`（Server `8e23a2d`、Web `e3ae316`）；annotated tag 与公开 Release `0.1.3`（双仓 Latest）；Flyway 种子合并为单一基线 `V0.1.0__baseline_seed.sql`（PG 102/H2 104 唯一版本，全新建库终态与原链逐字段等价），**0.1.3 起仅支持全新建库**，≤0.1.2 原地升级被 validate 显式拒绝；UAT（chikaho.cn 单机）删库重建上线，Flyway 2 条至 v0.1.0、健康 200。材料 `release/0.1.3/`；回执 `product/v0.1.3-release/receipts/release-20260930.md`、`deployment-20260930.md`。
- **功能内容（0.1.2→0.1.3）**：后台 SSO 配置管理与 B 端手机号准入页面（`sso-admin-config`，COMPLETED（规划已确认，2026-09-29））；`SW_SSO_CIPHER_KEY` 契约收紧为 Base64 解码后 ≤32 字节（0.1.3 fail-fast 拒绝超长旧值）。
- **边界**：本版本不新增业务功能数、不核销 P 编号；1629/0/0/0 为执行报告基线（未锁定为 Planner 基线）。

## 0.1.2（2026-09-28 发布并部署生产（历史时点，该机现按 0.1.3 部署回执为 UAT 身份）；规划发布复核 PASSED）

- **版本发布事实**：两仓 `develop` 快进合入 `main`（Server `fd704ff`、Web `5368e6c`）；annotated tag 与公开 Release `0.1.2`；Flyway 自动增量 V94—V102（0.1.1 无独立 tag/Release，其修复随链路发布）；2026-09-28 生产部署（历史时点）。材料 `release/0.1.2/`；回执 `product/v0.1.2-release/receipts/`。
- **功能内容（0.1.0→0.1.2）**：`v0.1.1-bugfix` 与 `v0.1.2-bugfix` 两轮缺陷修复列车（25+23 项）；`backend-architecture-optimization` Phase 1—6C 与 Final 架构治理（动态宽表唯一受控入口 `DynamicTableSql`、可靠业务事件、IoT API 边界、依赖版本治理、生产制品隔离、CI-friendly 版本身份）。
- **边界**：无新增业务功能数。

## 0.1.0（2026-09-15 发布；2026-09-21 重建发布身份并入 P53/P61）

0.1.0 全功能收口版本（P60 路线：`v0.1.0-oa-completion`，交付办公审批场景能力）。2026-09-15 首次发布（Server main `c15428f0002f6bb0ceeff05c7cbcf842bd3d3148`、Web main `963df360ed18bc1c604652a13edb2a7ed0be8963`）；2026-09-21 按 `v0.1.0-p53-p61-production-release` 正式方向将 P53/P61 补丁并入并重建发布身份：两仓 `develop` 普通合并至 `main`，annotated tag 与公开 Release `0.1.0` 重建于合并后 main（权威 SHA 与 CI 资产摘要见 `release/0.1.0/MANIFEST.json`），迁移终点 V93。

### 新增（I6 通知与版本收口，P0）

- **统一通知底座**：站内信、短信、飞书卡片、钉钉通知、企业微信卡片、邮件六类渠道共用一套投递权威；流程事件、抄送、催办、通知节点统一汇入持久化投递意图与投递记录。
- **投递可靠性**：一次业务通知按（租户 + 事件类型 + 业务对象 + 发生次序 + 接收人 + 渠道）形成稳定身份幂等；每次投递单独尝试流水；可重试失败按指数退避自动恢复，服务重启后从持久状态恢复未完成投递；通知失败不回滚已合法提交的审批动作（纯通知节点入队即推进）。
- **模板与安全**：模板按事件与渠道版本化发布（追加不可改写，历史投递固定引用版本快照）；变量白名单与发送前校验；HTML/卡片渲染按目标格式转义并禁止脚本/任意跳转；通知规则（事件开关、接收人规则、渠道顺序、失败策略）与用户订阅偏好（必须送达事件不可关闭）。
- **渠道配置与 fail-fast**：系统级渠道启用须配置完整（缺配置/占位值启动即失败）；租户级渠道启停需装配与校验通过；秘密只进安全配置。
- **站内信增强**：收件箱服务端真分页、未读数、全部已读、稳定排序；PC 与移动 H5（`/m/notify`）同一消息、同一已读状态、同一对象权限；受保护深链（打开时服务端重新鉴权）。
- **管理端**：通知规则、渠道配置、订阅偏好新页面与权限；发送记录默认最小暴露，必要详情须独立权限并审计。
- **敏感收敛**：生产环境关闭全量 SQL 参数日志；接收人信息脱敏。
- **版本收口**：单一机器可读版本权威 `version.json`；Server Maven 与 Web 包版本投影 `0.1.0`；Flyway 迁移终点 V93（H2/PostgreSQL 同一迁移身份，含通知主体绑定与布尔标志收口）。

### P53/P61 补丁并入（2026-09-21 重建发布身份）

- **P53 全局 UI 与组件布局优化（XL，规划已确认 2026-09-21）**：全局设计 token 与页型规范落地，导航壳层、表单/列表/流程等关键界面布局与交互统一优化。
- **P61 用户可见提示语人性化治理（L，规划已确认 2026-09-20）**：全系统用户可见错误码与提示语统一为可读业务文案，关键认证/表单/流程提示支持中英文切换，不泄漏原始诊断信息。
- 合并范围：Server 105 files（无数据库迁移变更）、Web 330 files；候选 Server `develop=d18e9a39c552918615be8b158dfe0cc278cb309f`、Web `develop=039f987437ed6369c3c131631bd7622c6ae482e7`；不新增业务功能，P 编号与功能明细计数零变化。五类外部渠道与三方 SSO 的 Owner 延期/未验证边界不变。

### 五类外部渠道边界（Owner 延期 / 未验证）

短信、飞书、钉钉、企业微信、邮件的生产适配器、配置契约与失败语义已实现并在本地受控验证；各渠道的"真实一次成功 / 一次可控失败 / 一次恢复重试"行为证据仍待 Owner 提供可控测试账号与凭据后逐一取得，当前固定记录为 Owner 延期 / 未验证，并转 P2 待办 `todo/i6-external-notification-channels-real-verification.md`（详见 `release/0.1.0/RELEASE-NOTES.md` 边界登记）。

### 升级 / 回滚

升级步骤、数据库迁移清单、配置变化、回滚与恢复：见 `release/0.1.0/UPGRADE.md`、`DB-MIGRATIONS.md`、`CONFIG-CHANGES.md`、`ROLLBACK.md`。

---

## 0.0.2（2026-09-07，历史）

OA 完善（A1—A8 锁定），发布终态 Server `20fffc1` / Web `0bf6e89`。详见历史存档。
