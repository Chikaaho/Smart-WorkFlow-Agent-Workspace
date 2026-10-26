# 0.2.0 工作台配置审查差异修复（W66-UI / W66-SHELL / W66-QUICK）

2026-10-26｜Executor｜消费 `planning-receipt-read-workspace-config-020-01.md`，任务 03 继续

## 范围与结论

按规划审查指出的三项实际差异完成修复，并用同一身份、同一保存对象在真实 PG + headless 运行会话中复验：

1. **W66-UI 配置页布局与可读性**：组件库恢复 224px（原运行约 252px 的根因是 `content-box` 叠加左右内边距），中部 1360px、属性区 336px；工具栏 y64/h56，工作区 y120；画布标题 68px 区、卡片画布 1296px、12 列/16px 间距。图表 SVG 改为与容器像素 1:1 的动态 viewBox，刻度/分类文字由缩放后的约 6px 恢复为 12px 字号（实测渲染高 17px）；卡片标题栏 44px、卡片 423×322，图形填满卡片。属性区标题行与页签同排，首组 y184（相对工作区 y64）、组高 62px、控件高 32px，与源稿分组密度一致。
2. **W66-SHELL 上下文与入口**：`/workspace/config` 纳入前台区域，配置页顶栏保持「工作台 / 我的门户 / 流程中心 / 应用中心」同一工作台导航，不渲染管理端侧栏；首页入口显示「配置工作台」并进入全屏配置，返回 `工作台`。未改账号权限。
3. **W66-QUICK 快捷发起一致性**：移除「未选择时用目录候选兜底」的实现，候选与已选严格区分。属性区新增常用流程勾选（最多 20 项），勾选进入草稿、可撤销；预览与首页同源读取；保存后刷新/重进/首页一致。未选择时首页与配置预览均为明确空态，已选项可合法发起。

## 文件

- Web：`src/foundation/area.ts`、`src/modules/workflow/views/WorkspaceStudio.vue`、`src/modules/workflow/components/WorkspaceStudioCard.vue`、`WorkspaceInspector.vue`、`WorkspaceChart.vue`、`WorkspaceSystemCard.vue`、`src/locales/{zh-CN,en-US}.ts`。
- 测试：`WorkspaceSystemCard.spec.ts`（新增 2 例候选/已选一致性）、`area.spec.ts`、`WorkspaceStudio.spec.ts`。
- 未改 Server；未改 `vite.config.ts`（保留既有 `allowedHosts` 未提交改动）。

## 实际验证

### 几何与字体（1920×1080，DPR1）

`ws-fix-66-final.json`：

| 项 | 实测 |
| --- | --- |
| 全局导航 | 0,0 1920×64 |
| 工具栏 | 0,64 1920×56 |
| 组件库 | 0,120 224×960 |
| 中部主区 | 224,120 1360×960 |
| 属性区 | 1584,120 336×960 |
| 画布标题区 | 224,120 1360×68 |
| 卡片画布 | 248,188 1296 |
| 属性首组 | 1609,184 287×62 |
| 属性输入 | 1609,212 287×34 |
| 图表卡片 | 423×322，标题栏 44 |
| 图表画布 | 389×236，viewBox `0 0 389 236`（1:1） |
| 轴文字 | 12px，渲染高 17px |

### 导航与入口

`ws-fix-66-final.json`：首页导航为工作台四栏，入口文本「配置工作台」；进入配置后导航仍为工作台四栏、`#app-sidebar` 数量 0；返回首页成功。`ws-fix-66.json` 另含入口→配置→返回完整路径。

### 快捷发起

- `ws-fix-66.json`：初始候选 3 项、已选 0，卡片与首页均为空态；勾选 A16 后预览出现该流程；保存提示成功；刷新配置与返回首页均显示 A16。
- `ws-fix-66-chart.json`：随后取消勾选并保存，配置与首页恢复明确空态。
- `ws-fix-66-undo.json`：勾选后点「撤销」回到 0 选中且卡片回空态，未落库。

### 工程门禁

- `pnpm typecheck`、`pnpm lint` exit 0。
- `pnpm test`：224 文件通过 / 1 跳过；1938 测试通过 / 3 跳过（较上批 +1 文件、+2 测试）。
- `pnpm build`：5.09s 成功。

## 证据

- `C:/Users/hjxch/.codex/evidence-020/real-joint/ws-fix-66.json`
- `C:/Users/hjxch/.codex/evidence-020/real-joint/ws-fix-66-chart.json`
- `C:/Users/hjxch/.codex/evidence-020/real-joint/ws-fix-66-final.json`
- `C:/Users/hjxch/.codex/evidence-020/real-joint/ws-fix-66-undo.json`
- 截图：`ws-fix-66-home.png`、`ws-fix-66-config.png`、`ws-fix-66-preview.png`、`ws-fix-66-home-quick.png`、`ws-fix-66-chart.png`、`ws-fix-66-home-restored.png`、`ws-fix-66-final-config.png`、`ws-fix-66-final-chart.png`

## 证据层级与限制

- 本轮仍为 headless Playwright，按 `ISOLATED_REGRESSION` 登记，不是正式可见会话/像素通过；`browser_status=UNAVAILABLE`，`formal_browser_acceptance=false`。
- 当前 `/workspace` 个人布局是上批复验后恢复的默认布局（含遗留「统计概览」空卡），本批未改写用户显式布局；新数据的 10 卡布局证据沿 `ws-config-e2e-66.json`。
- 本地 dev PG 中存在与当前 `SW_CIPHER_KEY` 不匹配的已启用 SSO Provider 密文，导致后端启动 fail-fast；按服务端既有「先停用再修复」安全下线路径在 dev 库停用三条 Provider 记录后启动。未改代码、未改生产数据。
- 正式像素 A03—A05、258 帧/25 族、新侧栏独立参考、A17 合并发布仍等待规划/Owner 输入。

## 自检

- 三项审查差异均有修复前后可解释根因（content-box、area 归属、目录兜底）与实际复验结果。
- 保存/刷新/预览/首页/撤销均覆盖快捷发起；配置几何与图表 1:1 用实测值而非目测。
- 未把 headless 截图升级为正式像素，未删除或改写历史失败记录。
- 未提交 `vite.config.ts`；未触碰他人治理改动。
