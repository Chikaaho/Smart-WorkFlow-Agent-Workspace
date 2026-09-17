# P53 执行补证回执 03

> 执行角色：Executor  
> 日期：2026-09-17  
> 唯一执行入口：`planning-execution-prompt-p53-global-ui-component-layout-02.md`  
> 范围：`P53-EV-02a-F`、`P53-EV-02b-F`、`P53-EV-02c-F`、`P53-EV-03a-F`、`P53-EV-04a-F`  
> 功能状态：`VERIFYING`  
> 结论：五个剩余子项的 UI 修复、最终快照 PNG、对象 facts、网络/像素核验和全量视觉回归均已闭合，提交 Planner 复核。本回执不宣告 P53 通过或完成。

## 1. 本轮修复与边界

- `src/modules/workflow/views/TaskDetail.vue` 补入 `ProcessGraphView` 导入，恢复任务详情流程图组件；视觉断言现在要求流程图 SVG 和 `.pg-node` 实际节点，防止空 SVG 通过。
- `e2e/visual/smoke.spec.ts` 的键盘检查最多前进 8 个 Tab 停靠点并确认用户名输入框获得焦点，消除视口布局导致的固定两次 Tab 假设。
- `src/adapters/form-designer/setup.ts` 为隔离的 FormPreview app 注册 `ElRow`、`ElCol`、`ElOptionGroup`，并引入对应 Element Plus 样式，修复运行时动态组件解析缺失。
- 最新全量视觉更新和验证完成后才生成最终 before 指纹并采集截图。采集前后 Web 树均为 447 个文件，排序路径及逐文件 SHA-256 清单相同。
- `P53-EV-01a` 仍按审查03锁定，不重跑 lint。执行范围未扩展到 Server、数据库/API 契约、认证租户或 P61。

## 2. 五个验收原子

| 原子 | 最终事实与判定 | 证据 |
|---|---|---|
| `P53-EV-02a-F` | admin / 系统管理员 / T0 在 `/form/form-def-list` 展开菜单为“账号绑定、返回前台、退出登录”；portal `/workspace` 为“账号绑定、进入后台、退出登录”。两端禁止项均不存在。 | 两张展开态 PNG、菜单 DOM facts、逐图哈希见 §5；`facts/ev2a-admin-menu-expanded.json`、`facts/ev2a-portal-menu-expanded.json`。 |
| `P53-EV-02b-F` | 真实定义 `2100424929376403458`、流程 `bpm_ea1731b3ae1e4f38`、节点“节点一-管理员审批”从候选弹窗选择系统管理员 `id=1`；正式字段回填为 `{"type":"DESIGNATED","value":["1"]}`。草稿保存成功，校验提示 0 条可判定错误；未发布。候选 GET 200、图保存 PUT 200（2次）、校验 POST 200。 | 候选弹窗、回填、保存/校验三张 PNG；facts `ev2b-picker-candidates.json`、`ev2b-picker-selected-backfilled.json`、`ev2b-save-validate.json`；网络索引 `capture-network-index.json`。 |
| `P53-EV-02c-F` | 真实已完成任务 `af63f9ac-b248-11f1-9b6a-00ffa7734675`、实例 `6f46dbc8-b248-11f1-9b6a-00ffa7734675`、业务键 `941bf7a3-513e-4329-a15e-705f1a86a934` 打开“审批意见详情”，显示节点、审批人、时间 `2026-09-17T11:34:27.514`、表单版本 `v1` 和意见“P53ev2 节点一审批意见：同意，转入节点二”。Escape 关闭弹窗且焦点回到“查看详情”按钮。 | 展开前及意见弹窗 PNG；facts `ev2c-taskdetail-before.json`、`ev2c-opinion-dialog-open.json`、`ev2c-opinion-dialog-escape.json`。同一真实任务的流程图另见 `ev2c-taskdetail-processgraph.png`。 |
| `P53-EV-03a-F` | 四个 1440×1024 壳截图覆盖 workspace、catalog、task detail、admin form list；header 均为 `(0,0,1440,64)`，brand `(16,0,224,64)`，nav `(240,0,864,64)`，actions `(1104,0,336,64)`。Portal 顶栏 `rgb(64,54,154)`，Admin 顶栏 `rgb(17,27,59)`；均无横向滚动。任务流程图截图另外核实 4 个节点。 | 四张桌面壳 PNG 和额外任务流程图 PNG；对应 `facts/ev3-shell-*.json`、`facts/ev2c-taskdetail-processgraph.json`。 |
| `P53-EV-04a-F` | login、移动表单、移动工作台、通知四页均为 375×812，无横向滚动；主要操作触控目标至少 40px。11 个普通文本对比度样本全部 ≥4.5:1，最低 4.78:1。16 张 PNG 共 192 个角点、边缘和中心 alpha 样本全部为 255。 | 四张移动 PNG；`facts/ev4-mobile-*.json`、`contrast-verify.json`、`alpha-verify.json`。 |

## 3. 受影响视觉回归

全量单 worker 更新和随后全量单 worker验证均 exit 0，各为 **71 passed / 17 skipped / 0 failed**（88 项集合）；两次运行均未使用 `--grep`。验证原始输出见 `visual-verify.log`，更新见 `visual-update.log`。上一轮 10 个失败逐项闭环如下，行号来自原始日志并由 `visual-failure-closure-map.json` 机器映射：

| 上轮失败项 | 上轮原始行 | 本轮结果 | 本轮原始行 |
|---|---:|---|---:|
| 管理端壳三区基线（进入后台） | `review-02/executor-02/visual-update.log:865` | 通过 | `visual-verify.log:24` |
| 管理端壳：深色顶栏结构、主导航可达与存档 | `review-02/executor-02/visual-update.log:900` | 通过 | `visual-verify.log:39` |
| 流程中心：分类默认态、搜索空态与存档 | `review-02/executor-02/visual-update.log:936` | 通过 | `visual-verify.log:45` |
| 数据列表：默认态、筛选空态与详情弹窗 | `review-02/executor-02/visual-update.log:969` | 通过 | `visual-verify.log:52` |
| 任务详情：流转记录、流程图与审批列表三 tab | `review-02/executor-02/visual-update.log:1004` | 通过 | `visual-verify.log:58` |
| 发起流程：默认双栏、未知 formKey 错误态 | `review-02/executor-02/visual-update.log:1032` | 通过 | `visual-verify.log:72` |
| 表单设计器 @ chrome-1440 | `review-02/executor-02/visual-update.log:1065` | 通过 | `visual-verify.log:86` |
| 流程设计器 @ chrome-1440 | `review-02/executor-02/visual-update.log:1098` | 通过 | `visual-verify.log:92` |
| 表单设计器 @ chrome-1920 | `review-02/executor-02/visual-update.log:1131` | 通过 | `visual-verify.log:201` |
| 表单设计器 @ chrome-1280 | `review-02/executor-02/visual-update.log:1164` | 通过 | `visual-verify.log:316` |

历史失败运行原始计数为 61 passed / 17 skipped / 10 failed / exit 1。本轮最终验证失败数为 0；十项结果及原始行均保留于 `visual-failure-closure-map.json`。

## 4. 工程门禁与快照绑定

- `pnpm typecheck`：exit 0，`gate-typecheck-formpreview-fix.log`。
- Vitest：exit 0；134 files passed、1 skipped；1217 tests passed、3 skipped，`gate-vitest-formpreview-fix.log`。
- `pnpm build`：exit 0，1876 modules built，`gate-build-formpreview-fix.log`。
- 全量视觉更新：exit 0，71 / 17 / 0；全量视觉验证：exit 0，71 / 17 / 0。原始 stdout/stderr 和退出码分别见 `visual-update.log`、`visual-update.exit`、`visual-verify.log`、`visual-verify.exit`。
- Web HEAD：`381ef74e81f1c289890503c3be3debc55adf5fac`。
- `source_fingerprint_before`：`c34cbdc77c6cb1be4c7a25959e05be2a51ee793da2e3656dfe1e6ac384276290`；`source_fingerprint_after`：`c34cbdc77c6cb1be4c7a25959e05be2a51ee793da2e3656dfe1e6ac384276290`；`source_files_count`：447；`zero_source_change`：true。前后排序文件清单与逐文件 SHA-256 完全相同，详见 `capture-source-fingerprint-before.json`、`capture-source-fingerprint-after.json`、`zero-source-change-recheck.txt`。
- 最终采集器为可见 `Playwright Chromium` headed 会话（`headless=false`）；Codex 内置浏览器同时复核了真实流程设计器页面及四个节点。正式图像、facts、网络与清单具有同一来源指纹；采集运行无 page errors。

## 5. 最终 PNG 与 SHA-256

`capture-manifest.json` 共 16 条，PNG 尺寸、身份、URL、对象 ID、facts 引用和源码指纹逐条回读一致。哈希核验 `sha256-check.json` 通过 16/16，alpha 核验 `alpha-verify.json` 通过 16/16。完整清单及索引见 `capture-manifest.json`、`evidence-index.md`。

| 原子 | PNG | SHA-256 |
|---|---|---|
| `P53-EV-04a-F` | `ev4-mobile-login-375.png` | `f3ac37b912a0bcd9e8b5914d3d72645cbee31ab66d3defcc943dbb3c5091c854` |
| `P53-EV-02a-F` | `ev2a-admin-menu-expanded.png` | `8e23f067646c05a52e611b999087bfa16a564b00ee41110bd292f4c49048f9f5` |
| `P53-EV-02a-F` | `ev2a-portal-menu-expanded.png` | `c7053d56439bfca8f09b28f00cf2dbf02180acc8802d8b47df2e7b3f5f9c590a` |
| `P53-EV-03a-F` | `ev3-shell-workspace-1440.png` | `6c4c6af9ac06299baa6e16d7f9f95c60fc7267ff60c6cf82364ab4525bac1385` |
| `P53-EV-03a-F` | `ev3-shell-catalog-1440.png` | `b1502840be418c7489e4a23cf34bbcb4341b143024264a1ccd26d95bd1dc0adc` |
| `P53-EV-03a-F` | `ev3-shell-taskdetail-1440.png` | `7afda24a157a0b0e1941959f3ad4a75a3075c1a2adbab3f9ab0acdaadcffa12c` |
| `P53-EV-03a-F` | `ev3-shell-admin-formdeflist-1440.png` | `e7a3f5118afba4aca38f7c32a8d1dc83049dbe5a0efecd2003858795b1f9a0ca` |
| `P53-EV-02b-F` | `ev2b-picker-candidates.png` | `2b48cad41a8d6bb0004577e5a9447edc9506da8bf9ff1b9c24c0530567053831` |
| `P53-EV-02b-F` | `ev2b-picker-selected-backfilled.png` | `bd7edd7987db9af60527052a829511874a848aebd5396f2cba89aeeff5ce9edf` |
| `P53-EV-02b-F` | `ev2b-save-validate.png` | `bc59b9392d9b11cfe665f312353ee6fa5cd5b3e32d42db7bb2a711e492239f0a` |
| `P53-EV-02c-F` | `ev2c-taskdetail-before.png` | `40bf6064af7e9dfdfdff8ea192a865f464eba869ab8ad2a010eb4f958582f92b` |
| `P53-EV-03a-F` | `ev2c-taskdetail-processgraph.png` | `89a970297f3bb32f1c2127e2385285d369cc88e27921e0621040c0d8c3e5860d` |
| `P53-EV-02c-F` | `ev2c-opinion-dialog-open.png` | `3418f4092a11fe2ed27982dcda39751bc8c035b7f999b2e68de219c38dc8a3ed` |
| `P53-EV-04a-F` | `ev4-mobile-form-375.png` | `c68426c2934da9fffee8912909723aef785998c006ea17b52fa4ae8035b13fa6` |
| `P53-EV-04a-F` | `ev4-mobile-workflow-375.png` | `f918dbd6d4d24cf8d971f58d93179ac4aa8172f89a2fd1bb27d56ac4e731adc0` |
| `P53-EV-04a-F` | `ev4-mobile-notify-375.png` | `9848ffd30d2cf44763ad2a3c96713859809d712f065e508d9e069dc91f2941c7` |

`formal_png_count=16`；`manifest_entry_count=16`；`sha256_check_exit=0`；`alpha_check_exit=0`；`formal_browser_acceptance=true`。验收摘要见 `verify-capture.log`：16 PNG、16/16 hash/facts、16/16 alpha、192 个 alpha 样本、11 个对比度样本（最低 4.78:1）、移动横向滚动 false、主要触控目标 ≥40px、网络检查通过、failureCount 0。

## 6. 最终提交

五个 `-F` 子项均完成；`remaining_actionable_count=0`；等待 Planner 复核。维持 P53 `VERIFYING`，不自行晋级功能状态。

本目录的证据索引为 `evidence/p53-review-03/evidence-index.md`；五原子逐项 facts 位于 `evidence/p53-review-03/facts/`。旧版失败运行和中间截图尝试保存在 `evidence/p53-review-03/pre-correction-process-graph/` 与 `evidence/p53-review-03/failed-attempts/`，未混入当前 16 张正式 PNG 清单。

终态文件 `evidence/p53-review-03/terminal-payload.json` 已由 `.codex/governance/validate-terminal.ps1` 校验，exit 0；原始 stdout/stderr 为空，见 `terminal-validation.stdout.log`、`terminal-validation.stderr.log`、`terminal-validation.exit`。
