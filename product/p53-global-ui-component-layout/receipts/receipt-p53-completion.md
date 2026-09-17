# P53 功能级完成回执（阶段 A—E 整体）

> 执行：Executor · 日期 2026-09-17
> 方向：`../ready/direction-p53-global-ui-component-layout.md`（XL · A—E 五阶段）
> 阶段回执：`receipt-p53-stage-a-b.md`、`receipt-p53-stage-c-d.md`
> **结论：A—E 全部执行完毕，Executor 自验通过，提交规划功能级验收；自验通过不等于功能级 PASSED。**

## 1. 验证基线（最终全量，本次实际输出）

| 门禁 | 命令（均带 `NODE_OPTIONS=--max-old-space-size=2048`） | 结果 |
|---|---|---|
| typecheck | `pnpm typecheck` | 通过（vue-tsc -b 0 错误） |
| lint | `pnpm lint` | 通过（0 error / 0 warning） |
| test | `pnpm test` | 134 files / **1217 passed + 3 skipped / 0 failed** |
| build | `pnpm build` | 通过（vue-tsc -b + vite build） |
| visual | `pnpm test:visual`（4 视口 projects） | **38 passed + 2 skipped（有意视口裁剪）/ 0 failed**，截图基线已建立并自洽 |

前后端互斥检查：运行期仅存在 bootstrap.jar 服务进程，无 mvn 编译进程并行。

## 2. 功能级验收标准逐条对照（方向 §9）

| # | 标准 | 结论与证据 |
|---|---|---|
| 1 | 设计文件身份一致 | 32 组 64 文件 SHA-256 以补充回执 G1 为基线；实施期间重采一致，未发生哈希变化 |
| 2 | 单一令牌体系 | `src/styles/tokens.css` 唯一品牌源（#6f2dff/导航深色阶/语义色/字体链/圆角/阴影/密度）；EP 绑定 `html:root` 防按需注入回退；`tokens.spec.ts` 14 项锁定；未发现第二品牌变量源 |
| 3 | 区域身份与导航 | 壳 spec 断言：portal 主色顶栏/admin 深色顶栏切换、主导航项数、深色侧栏、个人菜单项；菜单=服务端单源（visibleMenuForArea 派生）；撤权一致性由服务端过滤+既有守卫回归测试承载（未新增专项撤权用例，如实注明） |
| 4 | 32 节点处置结果 | A/B 回执（01/04/05/06/28/29/30/32）+ C/D 回执（02/03/07–20/21–27/11/12）逐节点矩阵；13 按处置仅作设计参考不加入口；31 修改密码无实现无入口 |
| 5 | 无假能力 | 统计全部来自真实分页 total；门户服务卡按菜单可见集；版本号/最近使用/监听器/动态规则等无契约字段一律不显示；空态/表单记录缺失诚实可见（截图） |
| 6 | 登录契约保持 | challenge/RSA-OAEP/一次性挑战消费/SSO 租户授权代码逐行未动；登录冒烟通过；界面无租户输入/记住登录/忘记密码/修改密码（断言） |
| 7 | 表单 24 列语义 | FormRender 24 列栅格与字段契约未动；form 模块 173 测试全绿；字段清单弹窗只读消费真实 schema |
| 8 | 流程设计器正式节点 | 未新增节点类型（能力契约仍为 APPROVAL/CONSENSUS/CONDITION/COPY/NOTIFICATION）；审批人选择=真实候选接口点选回填 ID（与手输语义一致）；无监听器/动态规则入口 |
| 9 | 真实行为证明 | Playwright 已登录链路走真实 mock API 链（会话→菜单→目录→待办→详情）；**正式用户可见会话证据需真实身份**：真实后端验证码为位图、测试凭据属用户秘密类，Executor 无法自采——见 §4 移交 |
| 10 | 分类来自服务端 | ProcessCatalog 数据链路未动；断言「分类/计数基于服务端可见集」；五类设计分类未写死 |
| 11 | 路由/深链无失效 | 守卫冒烟（未认证收敛）、壳 spec、全量单测（守卫/404-last/rebuild 幂等回归）全绿；动态/双注册路由未受视觉改造影响 |
| 12 | 桌面视口质量 | 1440 基线像素 diff=0（顶栏/侧栏/主区三区，区域阈值生效）；1920/1280 跑结构断言；阻断条件（越界≤1px/遮挡/偏移≤2px）辅助函数就绪并曾实际抓出 375 顶栏遮挡缺陷 |
| 13 | 375 可用性 | 登录页 375 基线+断言（品牌区隐藏、表单可用）；三个 H5 页未在 P53 改动（无回归面），未补 H5 专项截图（如实注明）；复杂桌面页窄屏单列退化不留裁切（TaskDetail/FormRender/门户响应式） |
| 14 | 双语完整 | 新键全部经单源生成（zh/en 同步，`--check` 一致）；en-US 冒烟断言英文渲染；既有键集一致性测试全绿；P61 机器语义未触碰 |
| 15 | 可访问性 | 全局 `:focus-visible` 主色焦点环；Tab 键盘路径冒烟；侧栏次级字对比度 4.55:1 ≥ AA（计算记录于 tokens.css 注释）；表单错误 `role="alert"`；弹窗焦点管理由 EP 组件语义承载 |
| 16 | 视觉回归状态覆盖 | 基线：登录页整页（验证码动态位图受控隐藏）+ 已登录壳三区；阈值按方向 §4.7（0.5%/0.5%/2%/3%）；独立阻断辅助（越界/遮挡/错位）落地；结构断言覆盖空态/错误/无权限/禁用 |
| 17 | 门禁与正式证据 | 受影响 Web 门禁全绿（§1）；正式可见会话证据的采集安排见 §4（同 #9） |
| 18 | P60/P61 边界 | P60 0.1.0 标签/Release/基线未触碰；P61 Server 机器契约（errorKey/eventRef/双语目录）与其测试全绿未改；P61 Web 视觉证据按计划登记为 P53 后重采，未重跑未伪造 |

## 3. 交付物清单（阶段累计）

- 令牌/资产：`tokens.css`（整篇）、`tokens.spec.ts`、`assets/brand/logo-mark.png`（新增）、`assets/logo.png`（删除）。
- 壳：`BasicLayout.vue`（重构）、`AppMainNav.vue`（新）、`AppTopbar.vue`（重构）、`AppSidebar.vue`（深色化）、`AppLogo.vue`。
- 入口页：`LoginPage.vue`（分栏）、`WorkspaceHome.vue`（统计头）、`PortalHome.vue`（新）+ `/portal` 路由 + `area.ts` portal 清单。
- 数据/流程页：`TaskDetail.vue`（重组+三 tab+意见/会签弹窗+流程图内嵌）、`ProcessCatalog.vue`（chip/卡片/计数）、`MyInstances.vue`（状态色）、`FormRender.vue`（双栏说明）。
- 设计器：`FormDesigner.vue`（字段清单弹窗）、`ApproverCandidatesDialog.vue`（新）+ `ProcessDesigner.vue`（APPROVER 候选入口）。
- 回归底座：`playwright.config.ts`、`e2e/visual/*`（regions/auth/smoke/shell/baselines + 基线截图）、`vitest.config.ts`/`eslint.config.js`/`tsconfig.node.json`/`.gitignore`/`package.json` 接入。
- locale：`scripts/p61-locales-manual.json` 新增 nav/login/workspace/portal/catalog/taskDetailUi/formSide/fieldList/approverPicker 九段（zh+en）+ 生成产物。

## 4. 如实保留的边界与移交项

1. **正式用户可见浏览器证据**：当前浏览器证据层级=ISOLATED_REGRESSION/COMPONENT_TEST（dev:mock 受控会话）。功能级正式证据需真实身份登录真实后端（验证码为服务端位图、测试凭据属用户秘密），超出 Executor 可自采范围，请 Planner 安排正式验收会话或提供授权测试身份后按 §4.7 采集。
2. 设计差异（按方向允许的省略/诚实呈现，均已记录）：登录页 SSO 保留租户输入（真实契约）；面包屑移除；流程中心卡片无版本/最近使用字段；企业门户无公告/知识/搜索/趋势区块；13 无监听器入口；12 无部门/角色/动态规则 tab。
3. 视觉基线不含管理端顶栏像素基线（dropdown 过渡 flake，结构断言已覆盖深色形态，原因记录于 baselines.spec.ts）。
4. 一次校准额度未消耗，保留给验收后的真实视觉微调。

## 5. 下一动作（归 Planner）

按 §10 组织功能级验收（人工复核点：新壳首屏、登录页、设计器画布、对比度、en-US 长文本）；P61 恢复安排依方向 §12。
