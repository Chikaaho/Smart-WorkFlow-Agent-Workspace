# 管理端收起目录入口打开态对比色修复

2026-10-26｜Executor｜批次22，对应 planning-review-sidebar-navigation-020-02 唯一未过项与 planning-execution-prompt-sidebar-navigation-020-02（Owner 明确授权继续窄修），并纳入 planning-execution-prompt-unified-020-02 连续交付。

## 变更（唯一代码改动）

- Web `f0a72a1..f386d95`（codex/0.2.0-ui-tenant-form-flow，已推送）：
  - `AppSidebarNode.vue`：管理端收起入口新增 `.sb-node__icon-btn.is-open` 前景映射（深色 `#303a55`）；`is-open.is-active` / `is-open.is-ancestor` 仍优先品牌蓝，选中与包含当前页不被打开态覆盖。
  - `AppSidebar.vue`：浮层 teleport 到 body 后新增 `app-sidebar-flyout--<area>` 与 `app-sidebar--admin` 类，使浮层内容沿用管理端浅色主题前景；浮层尺寸/位置/单实例语义未变。
- 服务端零改动（仍 `a8fff47`）；`vite.config.ts` 在途改动未提交、未触碰。

根因：收起入口原 `.sb-node__icon-btn.is-open` 只设深色主题浅字 `#e8ecf6`，管理端浅底上打开目录即变白；浮层因 teleport 丢失 `.app-sidebar--admin` 祖先，子行回落到前台次级灰。两处均按管理端令牌修复，未改前台深色侧栏规则。

## 环境与身份

- PG dev：bootstrap-dev.jar@Server `a8fff47`（8080）；Web dev 5175（`f386d95` 修复经 Vite HMR 生效）；PG/Redis 容器外部保持。
- 身份 t100admin@租户 `i5-tenant-100`（验证码 1234，正常 RSA 登录，未开调试认证）；视口经 IAB `setViewportSize` 真实 1920×1080 与 1366×768，非缩放 1280。

## 行为结果（截图 C:/Users/hjxch/.codex/evidence-020/real-joint/，逐张目视核验）

1. **1920 字典目录打开**（sidebar-22-admin-dict-flyout-1920.png）：`/system/tenant` 管理端收起态，点击“字典管理”后入口“字”前景 `rgb(48,58,85)`（不再变白），浮层 x=72/w=256/h=133/top=321，标题与“字典类型/字典数据管理”两项完整；浮层行前景 `rgb(48,58,85)`。关闭后入口仍为深色。
2. **1920 包含当前页＋打开**（sidebar-22-admin-dict-active-flyout-1920.png）：浮层内点击“字典类型”真实导航至 `/system/dict` 并关闭浮层；入口保持 `is-ancestor` 品牌蓝 `rgb(37,99,235)`。再次打开目录：入口为 `is-ancestor is-open`、前景仍品牌蓝；浮层激活行“字典类型”品牌蓝＋浅品牌底 `color(srgb 0.897412 0.926588 0.990588)`，非激活行深色；层级与页面选中态均保留。再次点击入口关闭后，入口仍为品牌蓝、浮层消失。
3. **1366 定时任务打开**（sidebar-22-admin-job-flyout-1366.png）：`/system/dict` 收起态，点击“定时任务”后时钟图标前景 `rgb(48,58,85)`，浮层 x=72/w=256/h=133/bottom=557（<768，未裁切），行“任务管理/执行日志”前景 `rgb(48,58,85)`；底部条 y=719/h=49 常驻。关闭后入口仍为深色、浮层消失。
4. **可读性判定**：两个真实目录（无图标首字“字典管理”、有图标“定时任务”）在未打开/打开/关闭三种状态均清楚可辨，目录指示点保持；未以 DOM 存在或组件测试代替目视。

## 门禁（本次修复后实际执行）

- typecheck `vue-tsc --noEmit` exit=0；eslint exit=0；vitest 211 文件通过/1 跳过，1848 通过/3 跳过；`vite build` exit=0，3.69s。
- 原始输出：`/tmp/web-fourgate-22-trio.log`（typecheck/lint/vitest）与 `/tmp/web-fourgate-22.log`（build，含 `BUILD_EXIT=0`）。首轮包装命令因 `vite` 未走 npx 报 127，已用 `npx vite build` 复跑并如实记录，不把包装退出码当四连通过。

## 未验证边界

- A03—A05 正式像素仍需 Owner 相符参考；新侧栏独立像素基准未闭合，本项不冒充像素通过。
- 本轮选择器均限定 `.app-sidebar--admin`，前台深色侧栏规则未改；前台门户的浮层/侧栏回归将在批次23 企业门户真实 1920 复验中一并核对，不以此回执宣称门户已验。
- 侧栏整体仍 VERIFYING，本项待 Planner 独立复核；0.2.0 IN_PROGRESS，未核销 P、未晋级正式基线。21 已锁定的尺寸、箭头、浮层导航、键盘与底部常驻结果不重做。
