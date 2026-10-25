# 0.2.0 统一执行·批次 15（侧栏底部折叠条＋收起图标/首字列——Owner 最新口径）

2026-10-25｜Executor｜承接 `planning-ui-sidebar-bottom-feedback-020.md`（替代批次 14 的交界悬浮柄位置要求）；Web `9378358..691833c`

## 整改（6 文件 +112/−61）

- **BasicLayout**：移除批次 14 的交界悬浮柄；aside 改为「菜单区（独立滚动）＋底部折叠条（独立空间，不随菜单滚走）」。展开态「← 收起」，收起态仅「→」居中，点击恢复；底部只保留这一个入口，不进顶栏布局。
- **AppSidebarItem**：无有效图标（无 design:* 且 ICON_MAP 未命中）的菜单项，以**当前语言展示名称第一个可见字**回退（首字取 `Array.from` 码点首位，非路由/权限码）；有图标照常。首字作为 el-icon **文本节点**渲染——Element Plus 折叠态隐藏 span，文本节点不受影响。
- **AppSidebar**：收起态 `el-menu-tooltip__trigger` 显式恢复 flex 居中（EP 默认 display:none 吞掉收起内容——实测定位并覆盖），图标/首字列得以呈现；workspace 既有收起宽度规则保留。
- **locales**：`nav.collapseSidebar`（收起）/`nav.expandSidebar`（展开）双语。

## 验证（真实浏览器 1280 视口，t100admin 管理端 /system/tenant・/system/user）

- **展开**：aside 236；底部条贴底（barAtBottom true）；label「收起」；菜单长列表独立滚动（scrollHeight>clientHeight）而底部条不滚走；15 项＝10 图标＋5 首字（租/部/字/字/S/文…），**无空白行**；顶栏零按钮（navFirstX 268 延续批次 14）。
- **收起**：aside 64；菜单收窄为图标/首字列，**可见项 11/11 全部有图标或首字**（chars 租/部/字/S/文）；选中态蓝色保留；底部条仅「→」箭头居中、aria-expanded=false。
- **悬停完整名称**：hover 收起项 → EP 原生 tooltip「租户管理」。
- **点击导航**：收起态点击首字项 → 路由至 `/system/tenant`（能力不丢失）。
- **再展开**：aside 恢复 236、label「收起」、aria-expanded=true。
- 截图 `sidebar-bottom-collapsed-1280.png`（收起态整页，底部箭头＋首字列可见）。
- 四连全绿：typecheck 0、lint **0 error 0 warning**（修掉本批 prettier 格式告警后复跑）、**1849 通过/3 跳过**、build 4.22s。

## 排障记录（如实）

- 收起列初测大面积空白：①首字放 span 内被 EP 折叠 span 隐藏规则吞掉 → 改文本节点；②tooltip trigger 默认 display:none → 显式恢复 flex；③中间一轮 HMR 陈旧层造成 236px 假象，硬刷新排除。三次定位均记录于过程与最终修复。

## 边界与剩余

- 1920/1366 两态的正式同态像素对照归 A03—A05 批次；长菜单滚动在展开态实测（收起态 11 项未溢出）。
- 剩余账本：A12 函数目录、富文本、通知、节点高级、A03—A05。

## 服务收尾

- 后端（8080）与前端（5175）净停、端口回读不可达；PG/Redis 容器保持。

总 7 阶段：已完成 1 需求评估；进行中 1 分支实施；未开始 5 验收同步、合并、0.2.0 发布、发布后同步、结束。
