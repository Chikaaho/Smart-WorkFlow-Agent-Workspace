# U020 外壳首批：管理端侧栏浅色主题

2026-10-22｜Executor｜XL｜IN_PROGRESS

## 范围

按新稿先改全局外壳的第一处差异：管理端侧栏由深色导航阶改为浅色表面。设计依据为 Figma 节点 `458:12660`（系统管理 · 租户管理）与侧栏实例 `458:12701` 的元数据、变量定义：侧栏 236px 宽、条目 204×40、白底、正文色 `#303a55`、激活底 `#ece9ff`、激活字 `#6f2dff`。

## 变更（Web `baa1b7a`）

- `styles/tokens.css`：新增 6 个管理端浅色侧栏变量（背景、描边、正文、悬浮底、激活底、激活字）。
- `layouts/BasicLayout.vue`：`.basic-layout__aside--admin` 改用浅色背景与右侧描边；用户端侧栏仍为深色。
- `layouts/components/AppSidebar.vue`：`.app-sidebar--admin` 覆盖 Element 菜单文字、悬浮与激活色。

## 验证

| 检查 | 结果 |
| --- | --- |
| `pnpm typecheck` | exit 0 |
| `pnpm lint` | 0 error，2 条既有 warning |
| `pnpm test` | 180 文件通过、1 跳过；1657 通过、3 跳过 |
| `pnpm build` | ✓ built in 2.25s |

## 未完成

- 未取得管理端运行截图与设计对照：本轮只完成代码层主题切换，没有 reference/runtime/diff，不计入 A03/A04 通过。
- 用户端顶栏在 Figma 变量中是 `#40369a`，与现有 token 一致，未改动；若实际渲染仍有渐变差异，需要重新取样确认。
- 258 个画框的承接矩阵、租户页几何对齐、登录页新增租户编码字段的视觉检查均待后续批次。

## 下一动作

启动前端可见会话，取 1920×1080 管理端租户页截图，对照 `458:12660` 量筛选栏、表格列宽、分页与弹窗几何，再修差异。

