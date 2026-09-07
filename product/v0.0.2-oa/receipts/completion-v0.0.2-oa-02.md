# v0.0.2 OA 完善 — 执行回执 02（验收修正轮，自验通过，待规划验收）

2026-09-07；执行角色。唯一入口：`../ready/direction-v0.0.2-oa.md`；差异入口：`planning-review-v0.0.2-oa-01.md`（G0—G8）。本回执只报告该审查记录剩余缺口的修正与补证结果，逐 ID 对照；不覆盖 01 号回执，已锁定子项不重复提交。**不自判 PASSED/COMPLETED，不核销 P 编号；A8 按方向 §6.7 保持后置。**

## 0. 候选与证据身份（G0）

| 项 | 值 |
|---|---|
| Server 候选 | 本地 `develop`：`ef0fb12`（round1 实现）+ `69ad744`（本轮修正，8 文件 +389/−38） |
| Web 候选 | 本地 `develop`：`a427621`（round1 实现）+ `0875d8a`（本轮修正，4 文件） |
| 运行环境 | 本地起服 `sw-bootstrap` dev profile（H2 内存、Flyway 全链 V1—V58），`SW_DEBUG_AUTH_ENABLED=true` + 回环来源 + 每请求正式角色链回查（`DebugAuthenticationFilter`，回查失败记 `USER_NOT_FOUND_OR_INACTIVE` 拒绝） |
| 采集方式 | 原始 HTTP：方法/路径/HTTP status/响应体逐条追加留档；证据 = 本轮提交 `receipts/evidence/gap-round/api-r2.txt`（唯一生效索引）+ `ui-r2-*.png` 8 张真实浏览器截图 |
| 时间线说明 | 修正过程中服务携修复分批重启共 5 次，产生 `api-r2-pre-fix / timeline2 / timeline3 / timeline5-prelock / timeline4-invalid-ids` 归档（保留追溯，**不作完成证据**；timeline4 因夹具 ID 跨实例错位已标注无效）；最终生效时间线为当前构建上的 `api-r2.txt` 单一连续链 |
| 夹具（round2，生效） | 用户 MGR=2096791763046612994（mgr002，admin 角色）/ EMP=2096791763528957954（emp003，无角色）/ APP=2096791764032274433（appr002，无角色）；表单 `v002r2_leave`（a2c8441a…，四新控件+默认值+显隐规则）、`v002r2_expense`（bafc7c09…）；流程 PKA=`bpm_3b1a1f7c241b4cf0`（START→APPROVAL[1]→COPY[APP]→END，绑定有效）/ PKB=`bpm_1f9939af9fc74f2f`（无分类）；分类 行政办公=CID 2096791766678880258、人事类；实例 FI=`2f5bd749-aa66-11f1-b6ca-66ff24301f3c`（记录 492…记录载荷见 G5b）；失败通知 NID=2096791999877988354（bizId=实例） |
| 与 01 号夹具关系 | 01 号（`fixture-ids*.txt`、H2 实例已随重启消亡）全部由上表 round2 夹具替代生效；旧证据文件保留原样，仅作 01 号已锁定子项追溯 |

## 1. 缺口逐项结果

**G1（A1 身份与权限）— 补齐。** 三类正式用户（超管 admin、普通管理员 mgr002、普通用户 emp003；另有 appr002 作抄送接收人）走完既定路径：EMP 调管理目录/管理分类接口 →403（`G1-emp-admin-catalog` 等）；mgr 授予 320—325 菜单前 403、授予后 200（权限具体生效）；撤权（roles=[]）后管理目录立即 403、恢复后 200（`G1-mgr-revoke/restore`）；浏览器：EMP 深链 `/workflow/catalog-admin` → 守卫重定向 `/403`（ui-r2-deeplink-403.png），三类身份登录落地 `/workspace`（ui-r2-workspace-*.png）。调试认证口径：仅 dev profile + 回环 + 显式开关；不注入权限、每请求回查正式用户/角色/权限；未提交任何 token/凭据。**边界**：浏览器链使用调试身份而非验证码真实登录（与 01 号同口径），验证码登录链由 P45 既有验收承担。

**G2a（A2 分类与聚合）— 修复 + 补齐。** 同屏计数异常根因=后端 `portalCategoryCounts()` 丢弃 `categoryId=null` → 修复为未分类归入 key 0；已删除断言旧行为的测试、新增 `BpmCatalogServiceTest`（H2 集成，含未分类计数与 `categoryId=0` 筛选 2 项）。运行实证：员工视角 `category-counts` = `{"0":"1","行政办公":"1"}`，页面同屏「全部（2）/行政办公（1）/未分类（1）/人事类（0）」与两张卡片完全一致（ui-r2-catalog-emp.png）。分类维护完整路径：创建/编辑（重命名+排序）/有归属删除 400 拒绝/解除归属后删除成功，全部真实调用留档。搜索/筛选：关键词命中与未命中、分类筛选、未分类筛选（员工视角全部 200 且零泄漏）。**过程中发现并修复第 5 个缺陷**：`assignCategory(null)` 因 updateById 忽略 null 无法解除归属（阻断「解除归属后删除」主线）→ 改 LambdaUpdate 显式 set null + H2 回归测试；运行实证解除后 `category_id` 为空、删除成功。

**G2b（A2/A7 发起入口）— 补齐。** 以绑定有效（`bindingActive=true`）、已发布、员工可见的事项（PKA）走通：目录卡片 → 事项详情（服务端解析 formKey）→ 表单填报 → 草稿提交 → `DRAFT_SUBMIT` COMPLETED + `flowStart=STARTED`（命令 2096791980472363010 区段）→ 同一实例 RUNNING → 审批 → APPROVED（`G2b-*` 全链留档）。已发布定义只读、分类调整不改历史绑定：绑定关系在分类归属调整前后保持（`bindingActive` 不因 `C-assign` 变化）。

**G3a（A3 抄送）— 补齐。** 真实流程 COPY 节点产生接收记录（APP，`deliveryStatus=SUCCESS`）：本人查询 1 条、他人（EMP）查询 0 条；接收人详情贯通（记录+流程信息，403 反向：`仅接收人可查看该抄送`）；实例筛选命中、时间窗内 1 条/窗外 0 条、pageSize=1 分页 page1/page2 稳定无重复；接收人待办为空（抄送身份无审批权，`G3a-app-todo-empty`）。**边界**：同一抄送事件重复投递去重由投递层幂等键 `processInstance:node:recipient`（`CopyNodeDelegate`→`NotifyFacadeImpl` 幂等重放，P58）+ `NotifyFacadeAdapterIdempotencyTest` 承担；引擎不会对已执行 COPY 节点自发展开二次投递，故无「同事件重复处理」的独立行为复现路径，如实记录为测试+实现锁定。

**G3b（A3 催办）— 修复 + 补齐。** 运行实例上 5 路真实并发催办：**恰 1 个 ACCEPTED（通知待办人 [1]）+ 4 个受控 400「该实例正在催办中，请勿重复提交」，零 500**。过程中发现并修复第 6 个缺陷：并发失败方原在 `FOR UPDATE` 行锁等待上超时直接 500（H2 `JdbcSQLTimeoutException`）→ 进程内按实例 `ReentrantLock` 串行（单节点单体语义）+ 有界行锁重试兜底。冷却复核（~599s）、非发起人 403、实例结束 REJECTED 均留档；催办记录（recordId、操作者、目标、结果）逐条落库可回读。

**G4（A4 工作台）— 补实现 + 补齐。** 按 G4 完成条件补「布局调整」实现：组件新增 `span`（1=半宽/2=整行），前后端贯通持久化，后端校验非法值（`span=3`→400、未知组件→400）；两用户各自保存不同组件集合/顺序/宽度/常用事项（EMP：todo 整行+收藏 PKA；MGR：favoriteItems 置顶整行+收藏 PKB），回读一致；浏览器实测保存→**刷新后整行布局与常用事项入口恢复**（ui-r2-workspace-layout.png）；恢复默认后回落默认布局（`custom=false`）；撤权后 mgr 管理目录 403（组件数据源收敛）、布局配置本身保留（回落语义不破坏）。

**G5a（A5 文件）— 补齐。** 真实附件闭环：EMP 经 `/workflow/attachments/upload` 真实 multipart 上传（storageKey=2026/09/07/813fd9e5….txt，39 字节非占位内容）→ 关联进表单 proof 字段提交 → 落库保留（见 G5b 记录）→ 发起人以记录身份下载 200（`G5a-initiator-download`）；反向：无关用户下载 403、伪造存储键（`../etc/passwd`）404 不存在、普通用户走管理通道 `/storage/files/upload` 403（权限边界成立）。

**G5b（A5 规则与草稿）— 补齐。** 真实提交对照（同一表单、服务端复算）：①`tags=[年假]`（规则条件满足→proof 可见）+ 载荷携带 proof + 省略 reason → 落库 **proof 保留、reason=默认值「加班调休」**；②`tags=[出差]`（条件不满足→隐藏）+ 载荷夹带 proof + reason 显式填写 → 落库 **proof=null（服务端过滤）**、reason 保留原值（默认值不覆盖已有值）。草稿：创建读回保留原输入、更新已有值不被默认值覆盖（`G5b-draft-*`）。规则矩阵（EQ/NE/EMPTY/NOT_EMPTY×ALL/ANY、无环拒绝、隐藏必填不阻断、跨字段组合）由 `FormVisibilityRulesTest`（7 项单测）+ 本轮两端点对行为承担；浏览器代表性闭环=ui-r2-form-linkage.png（选出差→证明材料消失，选年假→出现+上传附件按钮）。**口径修正**：规则语义为「条件满足时可见」（01 号回执表述「隐藏」为反向描述，方向 §3.1 原文语义一致）。

**G6（A6 通知）— 补齐。** FEISHU 单发绑定真实业务对象（bizId=实例 FI）→ FAILED + 失败原因「未配置生产渠道适配器」留档；`/notify/records` 管理查询（状态筛选 FAILED 命中）、单条详情含尝试流水；重发受理 → attempt=2、仍 FAILED、流水累积（`G6-record-detail-final`）；**并发重发 5 路：节流窗口内 0 受理、全部受控 400「重发过于频繁」**（为此补最小 10s 重发间隔节流——同步重发完成后记录回 FAILED，原状态门防不住背靠背重复投递，属第 7 项修复）；低权限用户管理详情/重发均 403；批量发送（2 接收人）成功、员工收件箱可见；通知失败前后实例状态保持 APPROVED（`G6-inst-status-unchanged`）。浏览器：失败记录筛选+日志/重发按钮真实渲染（ui-r2-notify-records.png）。**边界**：失败注入层级为「渠道适配器未配置」（dev 无外部厂商），可控且与生产隔离；批量失败子记录——批量通道为站内 SUCCESS 通道，失败子记录语义由单发 FAILED 记录+`sw_notify_send_attempt` 流水承担，批量通道本身无失败子记录可产生，如实记录。

**G7（A7 工程与回归）— 补齐。** 最终构建全量门禁（本轮全部改动之上）：后端 `MAVEN_OPTS=-Xmx2g mvn -q test` **退出码 0，179 份 Surefire 报告 / 1150 tests / 0 failures / 0 errors / 0 skipped**（01 号基线 178/1145 之上净增：BpmCatalogServiceTest 2 项 + unassign 回归 1 项 + NotifyRecordServiceTest 4→2 增 2 项）；前端（`NODE_OPTIONS=--max-old-space-size=2048`）typecheck 0 / lint 0 / **test 123 files+1 skipped、1164 tests+3 skipped、退出码 0** / build 0。改动文件清单=两仓提交 diff（`69ad744` 8 文件、`0875d8a` 4 文件）；断言调整：NotifyRecordServiceTest 重写为在途流水/接管/异常回写 4 用例（旧 2 用例断言「投递后插入成功流水」与新先落在途流水语义不符，强度未弱化）。迁移：无新增迁移（V56—V58 不变），H2 全链启动迁移在每次起服日志与全量测试承担；**边界**：PG 侧本轮未起本地 PG 实例实测，沿 01 号双方言迁移测试结果（`mvn test` 含双方言迁移用例）承担。编译互斥：全程单端串行执行；工作区遗留 vite 进程按「不强杀」约束处理，最终由本轮自行起停的两个 vite dev server（5174 调试身份）替代，重型命令均串行。

**G8（已披露问题）— 处理结论。** ①**RESENDING 滞留**：已修复——投递前先落 `DELIVERING` 在途流水（滞留可观察）、投递异常回写 FAILED 不滞留、崩溃滞留记录可接管重发（`NotifyRecordServiceTest` 4 用例覆盖受理/接管/异常回写/拒绝）；单测锁定接管路径，进程内崩溃时点无法在行为链中人为制造，如实记录。②**user/page 500**：本轮实测 `POST /system/user/page`（超管、管理员身份）均 200、普通用户 403 权限收敛——原披露 500 在当前构建不可复现，判为「不可复现，附当前行为证据留池观察」；过程另观察到 `PUT /system/user` 传重复/非法 username 时 500 而非 400（更新路径校验健壮性，与本轮主线无关，留原池不动）。③**by-key 偶发异常**：连续 5 次调用全部 200 且响应一致，夹具已改分页查找，判为「不可复现，留池观察」。

## 2. 本轮修复缺陷清单（全部有运行/测试证据）

| # | 缺陷 | 修复 | 证据 |
|---|---|---|---|
| 1 | 未分类目录计数恒 0，与卡片同屏矛盾（G2a 审查点名） | `portalCategoryCounts` 未分类归 key 0 | api-r2 `G2a-counts`、ui-r2-catalog-emp.png、BpmCatalogServiceTest |
| 2 | `assignCategory(null)` 无法解除归属（阻断受约束删除） | LambdaUpdate 显式 set null | `G2a-unassign/del-free`、unassign 回归测试 |
| 3 | 工作台无布局调整（G4 审查点名） | span 半宽/整行 前后端贯通 | `G4-*`、ui-r2-workspace-layout.png |
| 4 | 重发中断滞留 RESENDING 无恢复路径（G8） | 在途流水+异常回写+接管 | NotifyRecordServiceTest 4 用例 |
| 5 | 并发催办失败方 500（行锁超时） | 进程内实例锁串行+有界重试 | `G3b-concurrent-urge-x5`：1 受理+4 受控 |
| 6 | 普通用户流程中心整页加载失败（页面 Promise.all 依赖管理分类接口 403） | 新增登录即可用 `GET /workflow/catalog/categories`，前端改用 | 浏览器实证：修复前「无权限+全部(0)」→修复后计数/卡片一致 |
| 7 | 并发重发背靠背重复投递（状态门防不住同步完成后的快速重发） | 最小 10s 重发间隔节流 | `G6-concurrent-resend-x5`：窗口内 0 受理 |

## 3. 偏差与剩余边界

- **偏差**：①验收修正过程中后端携修复重启 5 次，H2 夹具随之重建，最终生效证据统一为当前构建上的 `api-r2.txt` 连续时间线（历史时间线归档保留）；②「进入后台」按钮在 mgr 身份下跳转 `/404`（后台菜单组与深链可用），属 UI 路由缺陷，与本轮 G1 后台准入语义无关，登记为已知观察不阻断；③G3a 去重、G8-RESENDING 接管两条以单测+实现锁定，行为链不可复现点已如实标注。
- **未实施（保持后置）**：A8 README/版本收口、两仓推送/合并 main、v0.0.2 标签与发布（方向 §6.7 顺序）；转办/委托/加签/撤回/完整版本管理、P34/P35、P2 剩余、P53/P21/Agent 等候选。
- **调试认证声明**：浏览器与 API 证据统一使用 `SW_DEBUG_AUTH_ENABLED`（dev+回环+每请求正式角色链回查）调试身份；未提交认证存储/Token，未用注入标志绕过角色链。

## 4. Git

本地 `develop` 提交（不推送、不触 Release）：Server `69ad744`、Web `0875d8a`（主题见 §0）。远程合并、推送与 v0.0.2 标签未执行，待 Owner 授权。

## 5. 自验结论

A1—A7 各缺口按最新审查记录逐项补齐或修复，全量工程门禁绿；自验通过，**提交 VERIFYING / EXECUTION_SUBMITTED，待规划独立验收**。
