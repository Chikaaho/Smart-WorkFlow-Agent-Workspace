# P53 补证回执 01（对应审查记录 P53-EV-01—06）

> 执行：Executor · 日期 2026-09-17
> 审查对象：`planning-review-p53-completion-01-not-passed.md`（功能级验收审查 01，未通过，唯一入口）
> 前序回执：`receipt-p53-stage-a-b.md`、`receipt-p53-stage-c-d.md`、`receipt-p53-completion.md`（未改动、未覆盖）
> 证据目录：`receipts/evidence/p53-review-01/`（对象账本 `object-ledger.md`）
> **结论：P53-EV-01—06 逐项补齐完毕；其中修复 1 处真实视觉缺陷（登录页 375 横向滚动）并按影响重跑全部受影响门禁。自验通过，提交规划复核；自验通过不等于功能级 PASSED。**

## 0. 执行摘要

本轮只处理最新审查记录的六个缺口账本，未重新探索、未改动已锁定项（32 组设计输入、产品范围、非目标、32 节点处置矩阵、品牌主色、动态分类、不新增 Server 契约、P61 暂缓边界、Playwright 唯一工具链均保持锁定）。正式浏览器证据来自用户可见、可交互会话（ZCode IAB，`headless=false`）+ 真实后端 8080 + 授权 dev/test 身份（固定验证码契约），逐页保存可回读截图、URL、视口、身份、关键 DOM 断言与 `/api/*` 网络索引。

## 1. EV-01 最终实现与门禁身份包

- **缺口**：无最终 HEAD/工作树指纹、无门禁原始输出附件、无采集后零变化校验。
- **位置**：`evidence/p53-review-01/ev1-identity-web.md`（采集开始指纹，65 行文件哈希）、`ev1-identity-final.md`（采集结束重算，157 行）、`ev1-zero-change-recheck-final.txt`（关键文件 45 秒窗口零变化复核）、`gate-typecheck.log`/`gate-lint.log`/`gate-test.log`/`gate-build.log`/`gate-visual.log`（五门原始输出，含命令、起止时间、退出码）。
- **实际结果**：最终实现上 typecheck exit 0；lint exit 0（0 error/0 warning）；vitest 134 files / **1217 passed + 3 skipped / 0 failed**（exit 0）；build exit 0；Playwright 视觉套件 **71 passed / 17 skipped / 0 failed**（exit 0，含 375 有意跳过 17 项：375 不承担桌面页面族与管理端完整导航，方向 §4.5）。设计资产 64/64 SHA-256 与 G1 锁定值一致（本轮重算，未变化）。
- **边界**：Web 实现保持工作树未提交态（HEAD `381ef74` 不变）；提交/推送未获授权，不在本轮执行。运行期仅存在 bootstrap.jar 服务进程，无 mvn 编译并行（对象账本 §3）。

## 2. EV-02 正式用户可见真实浏览器链

- **缺口**：标准 3、5、6、8—11、17 缺真实服务端、真实身份、可见会话证据。
- **位置**：`evidence/p53-review-01/browser-artifacts/ev2-01…ev2-33`（每页 PNG + `*-facts.json`：URL、视口、身份、DOM 断言、网络索引）；夹具脚本 `scripts/ev2-fixture-setup.js` 与 `fixture-result.json`；对象绑定见 `object-ledger.md` §2。
- **实际结果**（全部为真实后端数据、真实操作）：
  1. **登录真实链**（ev2-01）：挑战→真实验证码位图→RSA-OAEP 提交→会话建立落地 `/workspace`；界面无租户输入/记住登录/忘记密码/修改密码（DOM 断言）。
  2. **用户端壳与工作台**（ev2-02）：问候头（真实 displayName）、4 统计卡=真实分页 total（待办 1/发起 5/已办 3/草稿 0）、待办卡显示真实任务 ID。
  3. **企业门户**（ev2-03）：hero 统计=真实（1 业务流程/5 本月实例）、我的关注=真实（待办 1/通知 12）、服务卡按服务端菜单可见集（流程中心/设备中心）；无公告/知识/搜索伪造区块。
  4. **流程中心分类动态性**（ev2-04/ev2-14）：经真实管理 API 建立两个分类并把两个已发布定义分别归入后，页面 chip/计数/卡片全部来自服务端（行政办公-p53ev、人事财务-p53ev、未分类；计数随服务端可见集实时变化）；权限底注可见；设计稿五分类未写死。
  5. **数据列表**（ev2-05）：真实 5 行（含本轮新建实例），状态标签、条件操作（仅「进行中」行出现催办/撤回）与真实业务单号/时间。
  6. **实例详情弹窗**（ev2-05b/ev2-18）：真实实例字段+当前进度；审批完成后同弹窗回读**真实审批历史行**（节点/办理人/动作/结果/意见/到达与办理时间，意见为本轮可见会话提交的真实文本）。
  7. **任务详情与真实审批操作**（ev2-06/07/08/12/12b）：真实待办任务详情（数据表单值、流程变量、操作卡）；确认弹窗→`POST /workflow/commands/tasks/{id}/complete` 200→命令轮询 200→「已通过」回执；审批意见持久化（网络索引绑定）。
  8. **流程设计器**（ev2-09/10/11）：真实定义画布（START→END）、服务端能力契约节点面板（审批/条件分支/会签/抄送/动态并行/通知/开始/结束——无 IoT/Agent/监听器越权入口）；拖入审批节点→保存草稿成功→**服务端真实校验**返回 3 条错误（2202 缺 approver 配置/2004 连线规则/2005 孤儿节点，含定位与节点红框）→删除节点恢复原状（`ev2-11-designer-restored.json`）。
  9. **表单发起**（ev2-15/16）：双栏表单页（真实表单名/标识/模式说明）→提交按钮 loading 等待态→「提交成功，流程已发起」→实例落库（列表计数 5→7→8 真实增长）。
  10. **审批人候选接口**（`ev2-candidates-api.json`）：`GET /workflow/defs/approver-candidates?keyword=系统` 真实 200，返回真实候选（admin/系统管理员）。
  11. **表单设计器**（ev2-20/21/22）：真实已发布表单（V2，冻结提示可见）三栏工作台；字段清单弹窗展示**真实 schema**（理由/reason/TEXT/栅格 12/24）并诚实声明「导出与发布兼容性校验暂无契约，不提供」。
  12. **个人菜单**（ev2-24）：用户端=账号绑定/进入后台/退出登录；管理端=账号绑定/返回前台/退出登录；两区均无未授权项。
  13. **权限与撤权负向链**（ev2-32/33、`ev2-34-t100-revoke-chain.json`）：无角色用户 `p53ev_u0` 登录后侧栏为空、主导航收敛为 2 项、统计全 0 诚实空态；直达 `/workflow/my-instances` 被守卫收敛到 `/404`；T100 用户角色 ["9001"]→经真实 API 撤销→重登录后菜单接口返回空集。
- **边界**：意见详情弹窗（TaskDetail 审批详情列表内「查看详情」）的正向行渲染需要「存在已完成节点且仍有在办任务」的多节点实例；当前真实定义库中不存在满足该条件的对象（单节点流程审批完成后任务即转已办，`/workflow/tasks/{id}` 对已完成任务返回不存在），且经 API 以两种参与人配置构造双审批实例时运行时未生成任务（服务端行为，已如实记录，见 §7 观察项）。因此该弹窗正向视觉留待具备多节点真实实例时补采；真实意见数据已在实例详情弹窗（ev2-18）以真实记录呈现，组件本身的 Escape/焦点回返行为以真实弹窗验证（ev2-23）。

## 3. EV-03 桌面视觉与状态矩阵

- **缺口**：管理端顶栏像素基线缺失（且不得以 transition flake 永久排除）；数据/流程页、设计器、弹窗与适用状态未覆盖；1920/1280 缺视觉结果。
- **位置**：`Smart-WorkFlow-aPaaS-Web/e2e/visual/families.spec.ts`（新增页面族矩阵）、`baselines.spec.ts`（管理端壳三区基线）、`gate-visual-families-baseline.log`/`gate-visual-families-verify.log`/`gate-visual.log`；真实会话补充截图见 browser-artifacts（1440 全页面族 + 状态态）。
- **实际结果**：
  - 按实现页面族建立节点→页面→状态→视口矩阵：01 工作台、02 数据列表、03/10/19/20 任务详情（三 tab）、04 管理端壳、05 门户、07/11 表单设计器+字段清单、09/12 流程设计器、15/16 意见弹窗（mock 层条件跳过，理由见 EV-02 边界）、21-26 流程中心、27 发起流程、28/29/30/32 个人菜单，逐项可读截图（`e2e/.artifacts/fam-*` 与真实会话 `browser-artifacts/`）。
  - 像素区域基线：1440/1920/1280 逐 project 覆盖登录页、用户端壳三区、**管理端壳三区（本次首次建立；采集时点=下拉关闭过渡结束+几何/样式就绪门+400ms settle，不再以 flake 排除）**、工作台/门户/流程中心/数据列表/任务详情/发起流程主区；`expectRegionMatches` 全局 `animations:'disabled'`，独立阻断条件（越界≤1px、遮挡>4px²、偏移≤2px）在全部页面族执行并通过。
  - 状态适用项：默认（全页面族）、空态（流程中心搜索无结果、实例筛选无结果、待办空态）、错误（表单记录不存在「记录已被删除」提示）、禁用（行操作随状态禁用）、弹窗/浮层（详情/字段清单/候选组件/个人菜单）；**加载态以真实会话采证**（发起流程提交等待期按钮 loading，ev2-15b）——dev:mock 调度器在 axios 层短路、无延迟注入能力（真实工具事实），不虚构 mock 加载截图。
  - 反向断言：无整页 SVG/PNG 嵌入、无截图背景、无假按钮/虚构统计/硬编码分类（页面数据全部来自服务端响应，网络索引可回读）。
- **边界**：稳定化期间按方向 §4.7 执行了**一次有说明的校准**：登录页基线因盒模型缺陷修复（卡片 444→380，见 EV-04）随修复归位一次；管理端顶栏基线属首次建立，不占校准额度。

## 4. EV-04 375×812 移动边界

- **缺口**：三个 H5 页面专项证据缺失；登录页 375 证据不完整。
- **位置**：`browser-artifacts/ev2-29…ev2-31d`（截图+facts）。
- **实际结果**：
  - `/m/form/p61r10_batch_form`、`/m/workflow`、`/m/notify` 于 375×812 全部无横向滚动、无遮挡、主要操作可达且为真实数据（通知页显示本轮真实审批产生的未读通知与真实时间；工作台页待办为诚实空态）。
  - 复杂桌面页（工作台）在 375 呈现诚实单列退化：侧栏隐藏、无横向滚动，不是缩放画布。
  - **发现并修复真实缺陷**：登录页在 375 存在横向滚动（表单卡 `width:380px`+32px 内边距在 content-box 下溢出，flex min-content 抬高面板至 412px）。修复：`.login-page__form` 改 `width:100%;max-width:380px;box-sizing:border-box`、`.login-page__panel` 加 `min-width:0`、≤767px 顶行换行（顺带修复标题逐字竖排）。修复后实测 `scrollWidth=360<375`、提交按钮命中可达（ev2-31d）。
  - 触控目标尺寸实测记录于 `ev2-31…31d` facts（提交按钮 42px 高、输入 40px 高等，主要操作≥40px；语言选择器 input 20px 高为其内部 input，命中区为整个 EP select 控件）。
- **边界**：修复涉及产品代码（`src/views/LoginPage.vue`），已按审查 §6 重跑全部受影响门禁（五门全绿），桌面登录基线按 §4.7 做一次有说明的校准；其余基线未动。

## 5. EV-05 双语与可访问性行为

- **缺口**：en-US 长文本、键盘可达、焦点进入/回返、Escape、Tab 顺序、错误关联、触控尺寸缺行为证据。
- **位置**：`browser-artifacts/ev2-23`（弹窗 a11y）、`ev2-25`（en-US 登录）、`ev2-26`（错误关联）、`ev2-27`（Tab 序）、`ev2-28`（en-US 工作台）、`ev2-31d`（触控/可达）。
- **实际结果**：
  - en-US：登录页整页英文（Welcome back/Sign in/SSO single sign-on；`html:lang=en-US`）、长英文 hero 不溢出；工作台整页英文（Workspace/My portal、Assigned to me 等 4 统计卡、英文空态长句）不破坏导航/表格/卡片。
  - 键盘：登录页 Tab 序实测为 Username→Password→Verification code→Sign in→Choose provider→Tenant ID→Continue（语义顺序，全部可达）。
  - 弹窗：打开时焦点进入弹窗（activeElement 位于 .el-dialog 内）→Escape 关闭（overlay display:none）→**焦点回返触发按钮「字段清单」**（实测记录）。
  - 错误关联：登录空表单提交触发原生 required 校验，焦点回到首个未通过字段并与字段绑定（截图）；表单记录不存在时页面 `role="alert"` 提示（ev2-19 alert role 记录）。
  - 对比度与焦点环：沿用阶段 E 已锁定实现（tokens.css 注释内 4.55:1 计算与全局 :focus-visible 主色环），本轮以真实会话复核未见回退。
- **边界**：焦点圈定（focus trap 循环）由 Element Plus 弹窗语义承载，实测验证了进入/Escape/回返三环节；完整逐键 trap 循环矩阵未另行脚本化。

## 6. EV-06 回执口径纠正

- **缺口**：完成回执「界面无租户输入」与阶段回执「SSO 保留租户输入」冲突。
- **位置**：本回执为唯一口径；佐证=`browser-artifacts/ev2-01-login-page-1440.png`（中文）、`ev2-25-login-enus.png`（英文）、`Smart-WorkFlow-aPaaS-Web/src/views/LoginPage.vue`（源码）。
- **实际结果**：统一口径为——**普通账号登录未新增租户选择：登录表单仅用户名/密码/验证码，无租户输入；既有 SSO 契约按方向 §4.4 原样保留：SSO 区块含 Provider 选择与租户 ID 输入，并以双语提示「SSO 授权需要租户标识；账号登录无需填写」（en-US: "SSO authorization needs a tenant ID; password sign-in does not."）**。前序回执不再修订，以本回执为准。
- **边界**：SSO 授权发起的真实外跳依赖外部 Provider（Owner 延期免验范围），本轮只固化界面与契约表述，不新增 Provider 侧验证。

## 7. 如实记录的观察项（不构成 EV 缺口，提请规划裁决）

1. **mock 与真实服务端能力契约漂移（P53 之前已存在）**：dev:mock 节点能力契约把审批人定义为结构化 `type:'APPROVER'` 字段（`src/foundation/mock/workflow-node-capabilities.ts:48-53`），而真实服务端 `GET /workflow/defs/node-capabilities` 返回审批人为兼容 `object` 字段（无结构化 APPROVER 类型）。因此「查看候选」入口仅在 dev:mock 面板出现，真实面板按真实契约不出现该入口（候选接口本身真实存在并已验证，`ev2-candidates-api.json`）。是否对齐属 Server 契约变更，超出 P53 授权（方向 §7 停止条件），未顺手修改。
2. **graphJson 为空的定义**：任务详情「流程图」tab 对无图定义不发起请求、不渲染假图（诚实空白）；P61 遗留定义即此形态。
3. **参与人解析为空时实例直接通过**：经 API 建立的双审批定义（兼容 approver 与 participant FIXED_USER 两种配置）在运行时未生成任务、实例直接 APPROVED（`ev2-graph-setup*.json`）；属服务端运行行为，建议规划侧评估是否为 P61 范围内既定语义。
4. **管理端区域壳 headerTop=8px**：真实会话实测管理端顶栏距视口顶 8px（portal 为 0，隔离下 3/3 稳定、字节稳定），已如实进入管理端顶栏基线；来源未定位，不影响可用性，提请规划知悉。
5. **I6 动态身份不复现**：`u1_100` 等 I6 临时用户随 H2 内存库重启消失，本轮改用 devseed 固定身份（admin/t100admin）+ 本轮新建用户，未复现 I6 对象。

## 8. 与十八项验收标准的对照（仅列状态变化项）

- #1（设计身份）：维持锁定通过，本轮重算 64/64 一致。
- #3/#9/#11（区域、真实行为链、路由/深链）：真实后端+可见会话证据补齐（ev2-01…ev2-12、ev2-32/33/34）。
- #5（无假能力）：真实请求索引+诚实空态截图补齐（ev2-03/04/18/19/22）。
- #6（登录契约+口径统一）：EV-06 统一口径并实证（ev2-01/25）。
- #8（设计器正式节点与候选）：真实契约面板+候选接口真实请求证明（ev2-09/10/11、candidates-api）；mock/真实契约漂移如实上报（§7.1）。
- #12（桌面视口）：1920/1280 数据/流程/设计器/管理端顶栏视觉结果补齐（families 矩阵+真实会话截图）；管理端顶栏像素基线建立。
- #13（375 可用性）：三 H5+登录页专项证据补齐；登录页横向滚动缺陷已修复并复测（ev2-29…31d）。
- #14（双语）：en-US 长文本视觉证据补齐（ev2-25/28）。
- #15（可访问性）：Tab 序/焦点回返/Escape/错误关联/触控尺寸行为证据补齐（ev2-23/26/27/31d）。
- #16（视觉回归状态覆盖）：页面族矩阵+管理端顶栏基线+适用状态覆盖建立（families/baselines 全绿）。
- #17（门禁与正式证据）：五门原始输出归档；正式浏览器证据来自用户可见会话并可回读（本回执 §0-2）。
- #2/#4/#7/#10/#18：实现与隔离层证据沿用前序回执，本轮未发现反证；#18 的最终实现身份由 EV-01 包支撑。

## 9. 自验结论

- P53-EV-01—06 补齐完毕，全部证据可回读并绑定最终实现指纹（`ev1-identity-final.md` + 零变化复核）。
- 实现变更仅为：登录页真实视觉缺陷修复（含桌面卡片盒模型修正）+ dev-only mock 基建修复 + 补证测试资产；已重跑全部受影响门禁且全绿。
- **Executor 自验通过，提交规划复核；自验通过不等于功能级 PASSED。** P53 不核销、主方向不移出 `ready/`、验证基线不晋级、P61 不恢复，等待规划对 P53-EV-01—06 的复核裁决。

```
ENGINE_TERMINAL {"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"XL","receipt":"product/p53-global-ui-component-layout/receipts/receipt-p53-supplement-01.md","evidence":["product/p53-global-ui-component-layout/receipts/evidence/p53-review-01/object-ledger.md","product/p53-global-ui-component-layout/receipts/evidence/p53-review-01/ev1-identity-final.md","product/p53-global-ui-component-layout/receipts/evidence/p53-review-01/browser-artifacts","product/p53-global-ui-component-layout/receipts/evidence/p53-review-01/gate-visual.log"],"feature_status":"VERIFYING","work_items":[{"id":"P53-EV-01","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"无——身份包与零变化复核已归档"},{"id":"P53-EV-02","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"无——正式浏览器链已采集；多节点实例的意见弹窗正向视觉待真实对象出现后补采"},{"id":"P53-EV-03","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"无——页面族矩阵与管理端顶栏基线已建立"},{"id":"P53-EV-04","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"无——375 边界证据补齐且登录页横向滚动缺陷已修复"},{"id":"P53-EV-05","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"无——双语与可访问性行为证据已采集"},{"id":"P53-EV-06","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"无——租户输入口径已统一并实证"}],"remaining_actionable_count":0,"independent_work_exhausted":true,"next_action":"等待规划按 planning-review-p53-completion-01-not-passed.md §6 只复核 P53-EV-01—06：receipt-p53-supplement-01.md 与 evidence/p53-review-01/","next_action_type":"WAIT_PLANNER","progress_fingerprint":"web:381ef74+dirty(ev1-identity-final.md);server:f55300b;jar:2026-09-16T21:52","progress_basis":{"files_changed":["src/views/LoginPage.vue","src/foundation/mock/index.ts","src/foundation/mock/handlers.ts","e2e/visual/auth.ts","e2e/visual/regions.ts","e2e/visual/baselines.spec.ts","e2e/visual/families.spec.ts"],"tool_actions":["pnpm typecheck/lint/test/build/test:visual 五门重跑全绿","ZCode IAB headless=false 真实后端浏览器链","真实 API 夹具铺设与撤权链","设计资产 64/64 哈希重算"],"new_evidence":["product/p53-global-ui-component-layout/receipts/evidence/p53-review-01/browser-artifacts（77 件）","product/p53-global-ui-component-layout/receipts/evidence/p53-review-01/ev2-candidates-api.json","product/p53-global-ui-component-layout/receipts/evidence/p53-review-01/ev2-34-t100-revoke-chain.json"],"closed_work_items":["P53-EV-01","P53-EV-02","P53-EV-03","P53-EV-04","P53-EV-05","P53-EV-06"]},"stop_reason":"WAITING_FOR_PLANNER","tool_results":[{"tool":"pnpm typecheck","outcome":"SUCCEEDED","detail":"exit 0（最终实现，原始输出 evidence/p53-review-01/gate-typecheck.log）"},{"tool":"pnpm lint","outcome":"SUCCEEDED","detail":"exit 0，0 error/0 warning"},{"tool":"pnpm test","outcome":"SUCCEEDED","detail":"134 files，1217 passed + 3 skipped，0 failed"},{"tool":"pnpm build","outcome":"SUCCEEDED","detail":"exit 0（vue-tsc -b + vite build）"},{"tool":"pnpm test:visual","outcome":"SUCCEEDED","detail":"71 passed + 17 skipped，exit 0；登录页基线按缺陷修复做一次有说明校准"},{"tool":"ZCode IAB browser (headless=false)","outcome":"SUCCEEDED","detail":"真实后端 8080 + 授权测试身份；登录/壳/门户/流程中心/数据页/任务详情/审批/发起/设计器/个人菜单/深链拒绝/375 全套，77 件可回读制品"},{"tool":"node ev2-fixture-setup.js","outcome":"SUCCEEDED","detail":"分类×2、定义发布、表单提交、用户建立经真实 API 落库"},{"tool":"cua.drag","outcome":"FAILED","detail":"两次宿主连接中断，已弃用；改用合成 DragEvent 与 API 链完成同等取证"}],"browser_status":"OPERABLE","browser_evidence":{"tier":"FORMAL_FLOW","headless":false,"artifacts":["product/p53-global-ui-component-layout/receipts/evidence/p53-review-01/browser-artifacts/ev2-01-login-page-1440.png","product/p53-global-ui-component-layout/receipts/evidence/p53-review-01/browser-artifacts/ev2-02-workspace-1440.png","product/p53-global-ui-component-layout/receipts/evidence/p53-review-01/browser-artifacts/ev2-18-approved-instance-real-history.png","product/p53-global-ui-component-layout/receipts/evidence/p53-review-01/browser-artifacts/ev2-31d-login-375-final.png"],"url":"http://localhost:5173/login → /workspace → /portal → /workflow/catalog → /workflow/my-instances → /workflow/task/{id} → /form/form-render/p61r10_batch_form → /form/designer/{id} → /workflow/defs/{id}/design","viewport":"1440×1024（桌面）/ 375×812（移动系列）","identity":"T0 admin（系统管理员，dev/test 契约）；p53ev_u0（无角色对照）；T100 t100admin/p53ev_t100_u1（撤权链）","object":"分类 行政办公-p53ev/人事财务-p53ev；定义 bpm_ef5a3a2d9a8842de 等；实例 1b27023d（真实审批+意见回读）；表单 p61r10_batch_form","network_index":"browser-artifacts/*-facts.json 内 /api/* performance resource 索引"},"formal_browser_acceptance":true}
```
