> 回执：执行 → 规划 · P53 · `VERIFYING` · 2026-09-17
> 唯一执行入口：`planning-execution-prompt-p53-global-ui-component-layout-04.md`
> 审查输入：`planning-review-p53-completion-06-not-passed.md`
> 证据根：`product/p53-global-ui-component-layout/receipts/evidence/p53-review-05/`
> 本轮性质：按提示04换路径收敛——设计态 fixture + glyph/结构分层比较管线建设与首轮收敛；未触碰 Server、数据库/API 契约、认证/租户/权限语义、P61/P60 身份与历史回执。本回执为**中间态回执**：四个页面族外部门禁尚未全部 exit0，颜色四向账本与移动/正式流证据未提交，见 §3 剩余矩阵。

## 1. 已建成的设计还原管线（本轮核心交付）

* fixture 覆盖层：`Smart-WorkFlow-aPaaS-Web/src/foundation/mock/design-fixtures.ts`（dev-only，随 mock tree-shake）+ `foundation/design-fixture-flag.ts`（轻量标志，布局组件不引 mock）+ `foundation/mock/index.ts` dispatch 钩子。激活：capture 经 addInitScript 写 sessionStorage('sw.design-fixture-id')；生产恒 null。
* 采集器：`evidence/p53-review-05/scripts/capture-nodes.mjs`（节点→路由/交互/fixture 映射 `p53-nodes.mjs`）：1440×1024（节点19 1512 高）runtime PNG + DOM 清单（文字行框/字体/computed/容器几何）。31 节点全部采集完成（节点13 标记 base=real 待真实后端采证）。
* 比较器：`compare-family.mjs` + `p53-image.mjs`（canvas 引擎，零新增依赖）：参考源=`docs/ui/png` 锁定导出图（逐节点 SHA-256 对 local-design-index 校验，无漂移）；glyph 遮罩仅由 DOM 文字行框自动生成（pad 2px，每页覆盖率记录，≤12% 门）；区域阈值顶栏 0.5%/侧栏 0.5%/主区 2%；双侧 AA 吸收；逐节点 comparison.json + diff PNG + masks.json + family 单值 design-compare.exit + compare-runs.jsonl 历史。
* 设计几何权威：`dump-design-geometry.mjs` 从锁定 figma-metadata XML 提取逐帧/文本 bbox（节点01已实测用于 fixture 对齐：内容容器 256,92,1152、摘要卡 274.5×108 间距18、待办行 46px、动态行 43px 等）。

## 2. 实测基线（本轮 compare-runs 记录，单位=区域差异率）

* family-a：01 topbar 1.09%/sidebar 3.41%/main 2.69%（设计态副本已按 XML 几何重建，持续收敛中）；04 3.53/5.53/2.04；05 main 1.97 PASS；06 main 2.77；21 2.38/2.61/3.66；27 2.33/3.05/1.85。
* family-b：02–20 main 2.13–3.93%；22–26 main 1.68–2.05%（五分类 fixture 生效，24/25/26 main 已低于 2%）。壳层为共性缺口。
* family-c：main 1.46–6.00%（08 main 1.46%）；07/11/14 侧栏 9.4% 为设计器右栏差异；13 未采（base=real）。
* family-d：30 topbar 1.30%、32 main 0.99% 接近门槛；28/29 未收敛。
* 结论：fixture 化后 22-26/08/05/30/32 主区已达或接近 2% 门槛，换路径有效；顶栏/侧栏为全节点共性缺口（主导航指示条、侧栏嵌套样式、图标簇几何），已按设计 XML 校准（本轮改动），需下轮重采验证。

## 3. 剩余缺口矩阵（供规划复核后继续）

| 原子 | 状态 | 剩余动作 |
|---|---|---|
| P53-EV-05a-R1 | 未完成 | 重建四向颜色账本：节点属性沿用 review-04 记录 + 锁定 PNG 多点采样、运行时 computed 探针、canvas 采样（p53-image.mjs sample 通道已具备）、机器汇总与单值 exit |
| P53-EV-05b-R1a | 未通过 | 节点01 main 2.69%→≤2%；04/21/27 随壳层收敛重采；06 登录页主区 2.77% 布局对齐 |
| P53-EV-05b-R1b | 未通过 | 壳层收敛后 02/03/19/20 重采；22/23 主区差 <0.05% 微调 |
| P53-EV-05b-R1c | 未通过 | 07-12/14 设计器页族；13 改真实后端采证；15-18 fixture 历史行已生效（16 会签聚合弹窗已采） |
| P53-EV-05b-R1d | 未通过 | 28/29 重采；30/32 需独立状态 fixture 区分 |
| P53-EV-04a-R2 | 未执行 | 375×812 登录+三 H5 页在最终指纹下重采（真实后端，可见会话） |
| P53-EV-01a-R1 | 中间态 | 本轮中间态 lint exit0（0/0）；最终收敛后重跑并前后指纹回读 |

## 4. 门禁与代码改动（本轮回执时点）

| 命令 | exit | 结果 |
|---|---|---|
| `pnpm typecheck` | 0 | 通过（fixture 层类型修正后） |
| `pnpm lint`（先 `lint:fix`） | 0 | 0 errors / 0 warnings |
| `pnpm test`（Vitest） | 0 | 134 files passed / 1 skipped；1217 passed / 3 skipped / 0 failed |
| `pnpm build` | 0 | ✓ built（仅 node_modules PURE annotation 既有告警） |
| `pnpm test:visual --workers=1` | 1 | 62 passed / 9 failed / 17 skipped——失败全部为壳层快照基线（工作台/管理端壳三区），系本轮按设计 XML 的合法壳修复（主导航指示条全宽、侧栏嵌套描边盒、头像 36px、内容内边距 28/32）所致；**未运行 test:visual:update**（外部门禁未过，遵循提示 §5.3 顺序）；机器日志 `final-gates/visual-pre-update.log/.exit` |

修改文件（Web 仓，均属允许范围：fixture/比较器/展示层/视觉配置）：
`src/foundation/mock/design-fixtures.ts`（新增）、`src/foundation/design-fixture-flag.ts`（新增）、`src/foundation/mock/index.ts`（dispatch fixture 钩子）、`src/layouts/AppMainNav.vue`、`src/layouts/components/AppTopbar.vue`、`src/layouts/components/AppSidebar.vue`、`src/layouts/BasicLayout.vue`、`src/modules/workflow/views/WorkspaceHome.vue`、`src/modules/workflow/views/design-fixture/WorkspaceDesignFixture.vue`（新增）；证据脚本 `evidence/p53-review-05/scripts/*`。

## 5. 边界声明

* 未再次调用 Figma MCP；参考源沿用 review-04 锁定身份（逐节点 SHA-256 回读通过）。
* fixture 数据仅存在于 dev:mock + sessionStorage 激活的采集会话；生产构建不加载 mock 模块，展示分支恒不生效。
* 未修改 Server/数据库/API/认证/租户/权限/菜单单源语义；菜单重组仅发生在 fixture 内存响应（复用原叶子节点注册路由，不新增路由事实源）。
* P53 保持 `VERIFYING`；未写 PASSED/COMPLETED、未核销、未归档、未执行 P61。
* 内部视觉基线未更新（顺序门禁）；`test:visual:update` 未运行。
* console warning 与 page error 计数：本轮采集记录于各 `NN-dom.json`（pageErrors/consoleWarnings 字段），未合并转录。
