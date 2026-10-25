# 侧栏原尺寸可见性与代表操作补证

2026-10-26（跨夜，自10-25 23:47 起）｜Executor｜批次21，对应 planning-review-sidebar-navigation-020-01「唯一剩余范围」第1/2项

## 变更（唯一代码改动）

- Web `c9b3b2a..f0a72a1`（codex/0.2.0-ui-tenant-form-flow，已推送）：BasicLayout 底栏折叠图标 `Expand/Fold` → `ArrowLeft/ArrowRight`（展开态"←收起"、收起态居中"→"）。修复审查指出的"1280 横线式小图标不能辨认左右方向"。
- 服务端零改动（仍 a8fff47）；vite.config.ts 在途改动未提交未触碰。

## 环境与身份

- PG dev：bootstrap-dev.jar@Server a8fff47（8080）；Web dev 5175（f0a72a1）；PG/Redis 容器外部保持。
- 身份 t100admin@租户100（验证码1234）；视口经 IAB `setViewportSize` 真实 1920×1080 与 1366×768，非缩放 1280。

## 行为结果（截图 C:/Users/hjxch/.codex/evidence-020/real-joint/，均逐张目视核验）

1. **管理端展开 1920**（sidebar-21-admin-expanded-1920.png）：浅底深字树形完整（弱标题系统管理＋租户/用户/部门/角色/菜单/字典/SSO/文件/开放接口/定时任务等 11 入口）；当前页租户管理品牌蓝 rgb(37,99,235)＋浅蓝底＋左侧标；底部"← 收起"方向可辨。
2. **管理端收起 1920**（sidebar-21-admin-collapsed-1920.png）：64px 列 12 个 icon-btn（租/用/部/角/菜/字/S/仓/开/定/监/X），目录指示点=字/开/定/监/X 五项；当前页"租"选中态；底部箭头居中（列内中心 x=32、y=1055，SVG path=M340.864… 即 ArrowRight）。
3. **管理端目录浮层 1920**（sidebar-21-admin-flyout-1920.png）：字典管理浮层 x=72（64列+8间距）/w=256/h=133，标题完整、字典类型＋字典数据管理两项完整无遮挡；点击字典类型导航 /system/dict 且浮层关闭。
4. **再展开 1920**（DOM 结果）：aside 236px；深链祖先自动展开（字典管理 aria-expanded=true）；字典类型激活蓝字＋33px（13+20）缩进，两子项可见。
5. **顶栏稳定**：折叠前后主导航首项 x=268/w=112 完全不变（aside 236→64）。
6. **长菜单 1366**（sidebar-21-admin-longmenu-1366.png）：系统管理区全目录展开共 15 行，菜单区 scrollHeight=clientHeight=655px 恰好满屏不触发滚动；底部条 y=719/h=49 常驻视口内；末项"执行日志"完整可见、与底部条无重叠。真实各分区计数：系统管理15、流程管理8、物联网8、通知4、智能体3、表单1（真实导航逐区统计）——现存真实菜单在 1366×768 无一溢出；未虚构长菜单制造滚动。
7. **收起浮层 1366**（sidebar-21-admin-flyout-1366.png）：低处"定时任务"浮层 y=424/h=133/bottom=557＜768 完整未裁切；浮层内"执行日志"导航 /job/log 后浮层清理；再展开后状态保留（定时任务展开、执行日志激活）。
8. **前台底部两尺寸**（sidebar-21-portal-bottom-1366.png / -1920.png / sidebar-21-portal-collapsed-1920.png）：深底 rgb(17,27,59)＋"收起" rgb(126,137,161)，1366 y=720/h=46、1920 同构；收起窄列图标/首字可见、底部居中"→"深底上对比清晰、无裁切。
9. **键盘代表操作**（真实键）：聚焦顶栏末位（租户100管理员）后真实 Tab 一次进入侧栏首个入口（"租"，is-active）；聚焦目录按钮 Enter 打开浮层 ✓；Esc 关闭浮层且回焦原入口 ✓。offsetParent 对 fixed 元素恒 null 曾致首测误报，改 getBoundingClientRect 复验为过。
10. **门禁**：全量四连 exit=0——typecheck 0、eslint 0/0、vitest 211 文件 1848 通过/3 跳过、build 3.78s（/tmp/web-fourgate-21.log）。计数与 8/9 原始日志 1848/3 一致。
11. **网络索引**：sidebar-21-network-index.json——自实际会话标签页 performance API 提取（/system/tenant、navType=navigate、205 资源、6 条 /api 请求），佐证真实后端链路。

## 未验证边界（如实）

- A03—A05 正式像素：侧栏新区域无 Owner 相符参考（交互示意与运行截图均非基准），99%/98%/≤1px 对照未做，记未验证；其余原稿区域待原参考，本轮未扩大像素范围。
- "仅菜单区滚动"的真实溢出场景不存在（真实最长菜单恰好满屏）；独立滚动容器与底部条隔离机制经 DOM 量测具备（menu flex:1 overflow-y:auto＋bottom 固定 48px），不以虚构菜单凑证据。
- 前台收起窄列仅 1920 截图；1366 前台收起未单独成图（同构 DOM，底部条几何已量测）。
- A12 函数目录、富文本、通知、节点高级、A16 同对象跨租户、A15 多人顺序、A13/A14 绑定版本等剩余账本不变，继续独立推进。

## 状态

侧栏整体仍 VERIFYING（本轮为补证，待规划复核）；0.2.0 IN_PROGRESS；已锁定结果未重做。净停：8080/5175 按本批进程停止，PG/Redis 容器保持。
