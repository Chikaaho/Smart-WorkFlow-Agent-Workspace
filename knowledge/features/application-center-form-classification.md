# 功能追踪：应用中心与表单分类统一（应用中心与应用管理）

> 工作区统一知识库 — 单功能追踪；当前状态 **COMPLETED（规划功能验收通过，终态同步待复核，2026-10-16）**；正式功能第 49 个。
> 可信度标记：CONFIRMED / REPORTED / ASSUMED / SUPERSEDED

---

## 1. 功能信息

| 字段 | 值 |
|------|-----|
| 功能编号 | 未分配正式 P 编号（方向明示）；终态同步登记为**正式功能第 49 个**（=旧48+本功能1，同一登记ID只计一次），不核销编号 |
| 功能名称 | 应用中心与表单分类统一（应用中心与应用管理） |
| 功能目标 | 后台应用管理（应用=表单一级分类，应用内二级目录与表单，表单内提供表单设计/流程设计入口）；用户端应用中心（可见应用→目录/表单导航，表单进入受权限约束的数据列表）；复用既有授权并保持存量兼容 |
| 创建日期 | 2026-10-15（Owner 需求 → Planner 定稿 READY → 执行承接） |
| 当前状态 | **COMPLETED（规划功能验收通过，终态同步待复核）**：功能验收 PASSED（`receipts/planning-review-03-passed.md`，AC01—AC07 通过、G1—G4 关闭）；终态同步回执 `receipts/terminal-sync-01.md` 已提交待 Planner 终审。总4阶段（现状探索、方向定稿、实施与验收、终态同步）= **4/0/0**（最后一阶段待复核确认）；两仓开发分支 `feature/application-center`；执行回执链 `execution-01.md`→`execution-02.md`→`execution-03.md` |
| 等级 / 优先级 | L |
| 涉及模块 | Server（应用/目录归属、授权与迁移兼容，实施中）；Web（后台应用管理、用户端应用中心、表单数据列表） |
| 方向与回执 | 主方向（已归档）`product/application-center-form-classification/passed/direction-application-center.md`；终态方向 `ready/direction-terminal-sync.md`（待 Planner 复核后归档）；承接回执 `receipts/execution-intake-01.md`；执行回执 `receipts/execution-01.md`、`execution-02.md`（G1—G4 与原件交接）、`execution-03.md`（G2 剩余入口，AC01—AC07 逐项对照）；验收与终态回执 `receipts/planning-review-03-passed.md`、`receipts/terminal-sync-01.md` |
| 计数归属 | 终态同步后正式功能数 **49**（=旧48+本功能1）；90 项清单 46/22/22=90 零升降；不新增/不核销 P 编号 |

---

## 2. 说明

- 验收标准 AC01—AC07 见方向 §5；证据格式与边界以方向为准（正式浏览器证据须为可见会话、headless=false）。
- 存量歧义（跨分类共用表单、多归属、孤立引用、跨租户异常）按方向 §4 形成逐对象冲突清单；需改变业务归属的歧义先交 Planner 裁决。
- 定稿记录 `product/application-center-form-classification/receipts/planning-readiness-review-01.md`；探索回执 `search_fallback/application-center-form-classification-readiness-20261015.md`。
- 实施摘要（执行回执 execution-01）：Server 应用/目录/用户三表 + 表单归属列 + 存量承接迁移（分类→应用、唯一分类/未分类归属、多归属歧义不自动转换保持 NULL）+ `/form/app/manage`（form:app:manage）与 `/form/app/center`；Web 后台应用管理/应用工作区/表单上下文与用户端应用中心/数据列表；FormDefList 分类树改为应用/目录唯一归属。过程发现并修复：新建表单未落空 definition（设计器不可打开）。限制：本地 PG 为 0.1.2 前旧链未迁移，承接行为由 H2/PG 全链与承接迁移测试承载；UAT 存量分布待获授权环境清点。

## 3. 终态同步（2026-10-16）

- 唯一终态值清单见 `ready/direction-terminal-sync.md`；同步回执 `receipts/terminal-sync-01.md`（覆盖矩阵、逐字段目标/实际值、memory 压缩字节、Git 回读）。
- 正式验证集合 AC-VB01—AC-VB04（Server form-biz 209/0/0/0 含 G2 一致性 7 项子集；Web `74d4be3` 四检沿用；H2/PG/承接迁移链；本地 dev 可见浏览器历史证据），定义与边界以终态方向为准，不与旧全仓失败相加；execution-03 服务层入口验证归 AC-VB01，不冒称浏览器新增结果。
- 发布/部署：**已随 0.1.6 发布并部署到 UAT（2026-10-16）**——annotated tag 与公开 Release `0.1.6`（Server 资产 `bootstrap-0.1.6.jar`、Web 资产 `sw-web-dist-0.1.6.zip`）；UAT 由 0.1.5 就地升级（DB versioned 终点单条 0.1.6、零 versioned 重放、健康 200）并完成可见最小业务链（应用中心承接应用 → 表单数据列表 → 发起 → 审批 → Approved）；回执 `product/0.1.6-release/receipts/release-016-02.md`。技术验收通过（规划 PASSED）与 Owner 正常产品体验验收分开表述，不写 Owner 已体验通过。此前的"本功能未发布、未部署；0.1.5 保持、无 tag/Release"为终态同步时点的历史口径（见本文件历史行与终态回执）。
- 功能不因同步文件存在自动成为最终 COMPLETED 确认；唯一下一动作=Planner 复核 `terminal-sync-01.md`。

## 4. 用户端入口修复（2026-10-16，Owner 验收退回后）

- Owner 验收不通过：/workspace 顶栏无「应用中心」（本功能原 AC02 用户端导航覆盖不足）。根因＝用户端主导航默认派生清单缺项（服务端不下发顶栏投影；非权限、非缓存、非部署版本）；侧栏入口只在管理端「表单管理」下出现，且菜单行默认只授予管理角色。
- 修复（Web `feature/application-center-user-entry`，从 develop 新建）：顶栏常驻「应用中心」（与工作台/我的门户/流程中心同级，不要求后台表单管理权限，应用可见范围与表单/数据权限仍由服务端过滤）；并按 Owner 原型实现列表页（搜索应用、每行应用数量设置）与应用内页（左侧目录/表单导航＋右侧内联数据列表＋表头设置＋分页，选中表单写入路由 query 刷新保持）。
- 复验：本地隔离环境（临时普通用户，仅本人数据范围、无后台管理权限）与最终交付环境 chikaho.cn（系统管理员，真实数据）实测四项条件；回执 `product/0.1.6-release/receipts/user-entry-fix-01.md`。
- **正式发布与部署（2026-10-16 同版本覆盖）**：Owner 授权将本修复纳入 0.1.6——Web 0.1.6 语义标签与同名 Release 覆盖到 `e5aa357`（旧目标 `f91e8bf`），正式资产替换为本次 CI 制品（sha256 `21687e55…`）；UAT 前端由修复候选收敛到该正式制品（线上 `index.html` `858ffc22…`，备份可回滚）；Server 保持既有 0.1.6 身份与制品。回执 `product/0.1.6-release/receipts/release-016-03.md`。
- 未决：UAT 普通身份对照需授权建受限测试账号（隔离环境已通过）；表头设置与每行数量为本机个人偏好（不落服务端）。版本裁定已由 Owner 给出＝同版本覆盖 0.1.6（不新增 0.1.7）。
