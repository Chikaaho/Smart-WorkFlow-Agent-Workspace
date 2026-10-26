# 0.2.0 全局蓝色主色与偏好兼容（批次58，任务03继续）

2026-10-26｜Executor｜消费 direction-blue-primary-020.md 与 design-blue-20261026 参考包；承接批次57

## 范围与实现

Owner 明确全局统一蓝色主色，紫色内置预设退出。参考值：默认主色 #2563EB、浅主题底 #EFF6FF、门户顶栏 #1D4ED8、门户激活 #1E40AF、导航浅文字 #E2E8F0；管理端深色导航 #111B3B 保留；图表系列/节点状态语义色独立不改。改造前运行态为紫色默认主色（THEME_COLORS.purple=#7e306b 四预设）——登记缺口后实施，纯前端批次（Server 无改动）。

- **前端**（`codex/0.2.0-ui-tenant-form-flow` `b4e1e1d..ebf382f`）：
  - `src/foundation/theme.ts` 重写：`THEME_COLORS = { blue: '#2563eb', teal: '#087f8c' }`；`ThemeName = 'blue' | 'teal' | 'custom'`（purple 移出合法域）；新增 `BLUE_REFERENCE`（softBg/portalTop/portalActive/navLightText 四值）；`themeCssVariables` 在 blue 分支固定下发浅底 #eff6ff 与门户 #1d4ed8/#1e40af/#e2e8f0，teal/custom 沿用 color-mix 派生公式；`normalizeTheme` 将历史 `purple` 偏好承接为默认蓝色（不要求清理本地数据），显式自定义 HEX 按 `custom` 原样保留。
  - `src/layouts/components/ThemeDialog.vue`：预设四项收敛为三项（默认蓝色/青色/自定义），grid `repeat(3)`；删除 purpleIcon 引用；恢复默认/完成/自定义校验（HEX 格式 + 4.5:1 对比度）交互不变。
  - `src/views/LoginPage.vue`：删除 `html[data-theme='purple'] .login-page__brand` 专属背景块（P53 紫色设计稿残留），登录背景回归品牌令牌派生。
  - `src/assets/theme/purple.svg` 删除；`src/locales/zh-CN.ts`/`en-US.ts` 删 `appearance.purple`，blue 标签改「默认蓝色/Default blue」。
  - 残余 'purple' 字样仅为流程图节点图标 tone（ProcessCatalog/ProcessDefList），属节点状态语义色，按方向「独立不改」保留。
- **测试**：`theme.spec.ts` 新增 purple→DEFAULT_THEME 迁移断言与蓝 token（#eff6ff/#1d4ed8/#e2e8f0）断言；`ThemeDialog.spec.ts` 选项索引随三项收敛调整（custom [3]→[2]）。

## 验证

- **前端四连（提交态）**：typecheck 0、lint 0、**226 文件通过/1 跳过（227）**、build 3.93s，exit 0（日志 `/tmp/web-fourgate-58-final.log`；首跑 prettier 对 theme.ts 两处三元换行告警，修复后重跑全绿）。聚焦 spec（theme+ThemeDialog）10/10。
- **真实可见会话（FORMAL_FLOW，headless=false）**：dev jar + 本地 PG（SW_DEV_DB_DRIVER/URL/USERNAME/PASSWORD + SW_CIPHER_KEY/SW_LOGIN_RSA_PRIVATE_KEY/SW_LOGIN_DIGEST_SECRET/JWT_SECRET 注入；PG 密码经 docker 容器环境变量直取不回显，四密钥为本地 dev 一次性值不入 Git）；IAB 1920×1080 会话颜色全部以 computedStyle/内联变量计算值验收：
  - 默认态：`--sw-color-primary=#2563eb`、`--sw-color-primary-soft=#eff6ff`、`--sw-nav-topbar-portal-bg=#1d4ed8`、`--sw-nav-topbar-portal-active-bg=#1e40af`、`--sw-nav-topbar-text=#e2e8f0`、`data-theme=blue`、存储无键。
  - 门户渲染：顶栏背景 rgb(29,78,216)=#1D4ED8、激活项 rgb(30,64,175)=#1E40AF、导航文字 rgb(226,232,240)=#E2E8F0（含非激活项）。
  - 主题面板三项「默认蓝色/青色/自定义」+ 恢复默认（紫色项不存在）。
  - **紫偏好迁移**：localStorage 注入 `{"name":"purple","customColor":"#7e306b"}` 后刷新，渲染完整蓝色参考值，存储保留不要求清理。
  - **青色**：面板选青→完成 → `data-theme=teal`、`#087f8c`、soft/portal 走混色公式；刷新后持久。
  - **自定义**：HEX `#7c2d12`（对比度 9.3:1）→ 修改→完成 → `data-theme=custom`、`#7c2d12` 持久化。
  - **恢复默认**：恢复默认→完成 → 键清除（stored=null）回蓝。
- **证据边界（如实登记）**：本会话 IAB 截图管线故障——全页/clip/重试/新标签共 6 次 `surface preparation timed out after 3000ms`，未能产出 formal-58-* 截图；颜色验收全部由计算值完成（RGB 通道精确判定强于像素采样），面板三项与迁移/切换/持久化以 DOM+存储状态验证。按任务03约定仅登记对应未验证范围：本批无正式视觉像素对照（本来就属 A03—A05 全量同态像素批次），不冒充正式视觉通过。
- **环境收尾**：验后 dev 双服务净停（见下），PG/Redis 用户既有设施保持。

## 边界与剩余

- 表单设计器 490:16867 等「旧青色主题示例改预设名称」为设计侧节点改名，运行侧无代码改动，随后续受影响页面批次顺带核对。
- 治理残留（供 Admin/规划）：Web 工程宪法 §5.1 品牌色仍写紫莓 #7e306b，与蓝色方向不一致，属治理文件非本批授权范围。
- 剩余账本不变：门户 7:2、25 族其余状态、A03—A05 全量同态像素、66 状态不同语义补证、DR06；A17 合并/0.2.0 发布依赖整版验收。计数 49、46/22/22=90、ADV64/问题57、P 核销空保持。

总 7 阶段 1/1/5。常规决定：purple 迁移走读取路径兼容（normalizeTheme），不回写存储不强制清理；未发其他会话消息。
