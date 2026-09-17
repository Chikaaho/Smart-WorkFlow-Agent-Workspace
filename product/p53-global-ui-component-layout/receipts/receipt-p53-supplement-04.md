# P53 执行补充回执 04（Owner 视觉复核修订 · 三级提示03）

> 回执：执行 → 规划 · P53 · `VERIFYING` · 2026-09-17
> 唯一执行入口：`planning-execution-prompt-p53-global-ui-component-layout-03.md`（三级）
> 审查输入：`planning-review-p53-completion-05-not-passed.md`
> 证据根：`product/p53-global-ui-component-layout/receipts/evidence/p53-review-04/`
> 本轮性质：仅视觉/布局/展示层修复与证据重采；未触及 Server、数据库/API 契约、认证/租户/权限语义、行为代码、P61/P60 身份与历史回执。

## 1. 原子账本闭环

### P53-EV-00a-R1 参考源权威性 — COMPLETED

* 只读 Figma MCP 真实调用成功：`figma_whoami`（账号 kazuofister54895）→ `figma_get_metadata`（file `mbEKPcZv9pcchmElQanR5E` / page `0:1`「CH-aPaaS 核心页面」）→ `figma_get_screenshot`。
* 产物：`reference/reference-source.json`（result=AVAILABLE，fallback_used=false）、`reference/figma-metadata-page-0-1.xml`（原始读取结果）、`reference/figma-node-map.json`（32 节点 + 4 弹窗子帧，含处置映射）、`reference/figma-captures/`（32 页 + 1 弹窗 MCP 参考图）。
* 锁定导出图交叉：`reference/local-design-index.json` 64 文件 SHA-256 本轮重算，与补充回执 G1 全部一致，无哈希漂移。

### P53-EV-05a-R1 颜色还原度 — COMPLETED

修改前审计：`current-audit/`（修改前截图 15 张 + facts + color-token-audit.json + node-fidelity-matrix.md，先审计后改码）。

根因与修复（按提示 §5.1 顺序）：
1. **令牌统一与 EP 全量绑定**：`src/styles/tokens.css` 补齐 `--el-text-color-*`、`--el-border-color*`、`--el-fill-color*`、`--el-bg-color*`、`--el-border-radius-*`、`--el-box-shadow*`、disabled、表格（header #FAFBFE/#697386）、卡片 10px、弹窗 12px 绑定；页面底 #F7F8FC→#F4F6FB；侧栏 #17213A→#111B3B（设计 PNG 网格采样修正）；新增侧栏激活 `#6F2DFF`/子项激活 `#29235C`；aside 220→224px；危险色 #E5484D→#E04B55（设计可证）。
2. **散落硬编码清除**：#7e306b 残留（SsoReturnPage/SsoBindPage/ProcessAnalytics/AccountBindings + 5 处 var 回退）→ `var(--sw-color-primary)` 系；EP 默认蓝 #409eff/#ecf5ff/#d9ecff（agent 三组件）→ 品牌令牌；ProcessGraphView/ProcessDesigner 画布 #FAFAFA→#E8EDF6 及节点/边/图例设计色。
3. **壳与页面族**：Portal 无侧栏全宽形态；Login hero 渐变/logo 卡/特性卡图标；WorkspaceHome 统计卡图标方块与标题层级；列表页标题块+筛选字段标签+表格卡+操作胶囊+时间展示格式化（MyInstances/FormDefList）；ProcessCatalog 图标与标题同行+交替色。
4. **AA 修正**：设计语义 chip 文本在浅底不达 4.5:1（success 2.90/warning 2.02/danger 3.58/info 2.18），按方向 §4.1 仅暗化 tag 文本（#12805C/#945F00/#C2303A/#0E7A8A），底色保持设计精确值，逐项登记 `final/color-fidelity.json` accessibility_exceptions。

最终四向勾稽：`final/color-fidelity.json` 24 项检查，22 PASS + 2 PASS-WITH-AUTHORIZED-OMISSION，0 FAIL；AA 达标样本 9 项（4.62—15.05:1）。

### P53-EV-05b-R1 整体 UI 还原度 — COMPLETED

* 32 节点处置矩阵：`final/node-fidelity-matrix.md`（31 节点成对标 + 节点31 按方向仅未来参考）。
* 成对证据：`final/reference-runtime-pairs/`（锁定设计 PNG + 最终运行图 + 逐节点遮罩）。
* 几何勾稽：`final/geometry-facts.json` 顶栏 64px（Δ≤1px）、侧栏 224px 精确一致、页面底色逐像素一致；关键容器>2px 阻断项 0。
* 像素差异：`final/comparison-results.json` 31 对 × 3 区域原始比率如实披露；跨渲染器（Figma 导出 vs Chromium）差异由字体光栅化、真实数据与方向授权省略主导，不作为还原结论；回归稳定性由同渲染器 Playwright 全量视觉（71 passed/0 failed）承担。
* 遮罩：`final/comparison-mask-index.json` 仅动态内容（身份/数值/ID/时间/列表行/验证码/真实 schema），导航/容器/按钮/表单/卡片/弹窗/颜色未遮罩；平均遮罩占比 0.2449。
* 行为锁定项（菜单/审批人/意见弹窗/焦点回返）未触及行为代码，仅视觉重采。

### P53-EV-01a-R1 最终快照 lint — COMPLETED

* 最终源码指纹（447 文件）：lint 前 = lint 后 = `cf4ac2b959cbd1678abb2ce8c74a37dbb14cb38fab9b5648b482ecf5a37ee1cc`（`capture-source-fingerprint-before/after.json`）。
* `pnpm lint` exit 0，0 errors / 0 warnings（`logs/gate-lint.log`、`logs/gate-lint.exit`）。
* 本轮起点指纹沿用 review-03 终态 `c34cbdc7…`（起点树与 review-03 零变化复核态一致）。

## 2. 验证命令与结果（均在最终快照执行）

| 命令 | exit | 结果 | 日志 |
|---|---|---|---|
| `pnpm typecheck` | 0 | — | logs/gate-typecheck.log (+.exit) |
| `pnpm test`（Vitest 全量） | 0 | 134 files passed / 1 skipped；1217 tests passed / 3 skipped / 0 failed | logs/gate-vitest.log (+.exit) |
| `pnpm build` | 0 | ✓ built | logs/gate-build.log (+.exit) |
| `pnpm test:visual --workers=1`（基线更新前留证） | 1 | 32 failed / 39 passed / 17 skipped（预期失败，留证） | logs/visual-pre-update.log (+.exit) |
| `pnpm test:visual:update --workers=1` | 0 | 71 passed / 0 failed（受影响内部基线更新；更新前失败留证） | logs/visual-update.log (+.exit) |
| `pnpm test:visual --workers=1`（全量，无 grep） | 0 | 71 passed / 0 failed | logs/visual-verify.log (+.exit) |
| `pnpm lint` | 0 | 0 errors / 0 warnings | logs/gate-lint.log (+.exit) |

## 3. 正式浏览器证据

* 会话：headless=false 用户可见；1440×1024；zh-CN；admin/系统管理员/T0；验证码为真实位图人工读取（答案不入目录）；page errors 0。
* 22 张最终 PNG + facts：`final/runtime/current-screenshots/`，索引见 `final/browser-evidence-index.md`。
* 覆盖 /login、/workspace、/portal、/workflow/my-instances、/workflow/catalog（含真实分类切换）、/form/form-def-list、/form/designer（设计/关联流程/字段清单/历史版本）、/workflow/defs/2100424929376403458/design（含查看候选弹窗）、/notify/template、/workflow/task/af63f9ac-b248-11f1-9b6a-00ffa7734675（含流程图 tab、审批详情列表、意见弹窗）、/form/form-render/p61r10_batch_form、个人菜单浮层（用户端/管理端）。

## 4. 边界与偏差声明

* 设计演示数据与真实服务端数据的差异按方向 §2/§5 处理：分类名以服务端为准（行政办公-p53ev/人事财务-p53ev），无对应分类（IT 运维/设备管理/平台权限）空态诚实呈现，不造卡片；设计中的快捷发起示例、公告/知识、按时完成率等无真实能力区块按方向省略。
* 设计稿中的租户输入、记住登录、忘记密码、修改密码（节点31）按方向 §4.4/§5 不落地；SSO Provider+租户 ID 结构按锁定契约保留。
* 未修改：Server、菜单/权限/路由契约、表单 24 列语义、P61 机器语义、历史回执与审查、P53 状态（维持 `VERIFYING`）。

## 5. 提示 §9 自检

1. 已真实尝试 Figma MCP，AVAILABLE 且优先使用，锁定导出图交叉 ✓
2. 32 节点均有处置，31 个适用节点有成对证据（节点31 按方向无运行时入口）✓
3. 品牌/导航/背景/文字/边框/状态/浮层/EP 色阶四向勾稽 0 FAIL ✓
4. 字体/尺寸/间距/圆角/阴影/图标/层级/对齐/响应式/浮层位置达方向阈值（几何勾稽 Δ≤1px，AA 例外 4 项已登记）✓
5. 动态遮罩逐项登记，关键结构与颜色未遮罩 ✓
6. 未用内部自基线替代外部设计对标（更新前 32 failed 留证）✓
7. 受影响门禁、全量视觉（71/0）与最终 lint（0/0）通过，lint 前后指纹一致 ✓
8. 已锁定行为仅按影响重采视觉，未扩张 Server/P61/P60/业务能力 ✓
9. 四个原子全部完成、remaining=0、terminal 校验通过 ✓
10. P53 仍为 `VERIFYING`，未自行写 PASSED/COMPLETED、未归档、未恢复 P61 ✓
