# 批次 9 回执 — V012-BUG-009 流程中心改版（分类树/收藏置顶/常用/最近使用/分类维护）

- 日期：2026-09-28；任务 `v0.1.2-bugfix`（L）；依据 `direction-full-repair-20260927.md` §3-009。
- 结论：**执行自验通过（含 headed 浏览器行为证据与持久化回读），待 Owner 验收 / 规划子项核销。**
- 提交：Server 与 Web 本批提交（SHA 见 git-readback；与批次 8/10 同分支连续批次）。

## 原文子项映射

| 原文要求 | 结果 |
| --- | --- |
| 参考蓝凌，应为一个分类树和流程列表 | ✅ 目录页改双栏：左侧分类树（全部/各分类/未分类，带服务端可见计数）+ 右侧流程列表（原搜索/卡片/发起零回退，卡片改两列） |
| 现在没有找到维护分类的地方，功能缺失 | ✅ 分类维护对话框（列表/新建/重命名/删除，管理端 CRUD 经既有 `/workflow/categories`），入口按 `workflow:catalog:manage` 权限呈现 |
| 可以收藏流程，收藏置顶 | ✅ 卡片星标收藏/取消（幂等端点，用户级租户内隔离）；列表收藏项置顶并带 ★ 标记 |
| 把发起流程数总量最多的流程置为「常用流程」，最多 5 个 | ✅ 「常用流程」区：租户内未删除实例总数 Top5（发起人聚合），带序号 |
| 把最多 5 个「最近使用」流程拿出来 | ✅ 「最近使用」区：本人最近发起去重 Top5（口径=复用既有「我发起的」契约：本人发起实例时间倒序；执行口径已在服务 javadoc 与本回执声明，提请规划确认） |

## 口径声明（方向 §3-009 要求）

- 常用 = 发起次数总量（租户聚合，含全部发起人）——按 Owner 原文「发起流程数总量最多」字面口径。
- 最近使用事件定义原文未明确；既无独立「使用」事件契约，选择复用既有「我发起的」列表契约（本人发起实例 max(create_time) 去重）作为拟用口径。若 Owner 期望「本人办理」（含他人发起单据的审批），需规划改口径重算（数据具备：task assignee 可查）。
- 统计窗口：全量累计（原文「总量」），无滚动窗口。

## 修改范围

**Server**：
- `V99__v012_bug009_process_favorite.sql`（PG+H2 同文）：`sw_bpm_process_favorite`（唯一键 tenant+user+process_key；名称快照；update_time 索引）。
- `BpmProcessFavorite` 实体 + `BpmProcessFavoriteMapper` + `BpmProcessFavoriteService`（收藏幂等 upsert/取消幂等/常用聚合 `selectMaps` group by/最近使用 `max(create_time)` 聚合 + 定义名解析回退）+ `BpmProcessFavoriteController`（GET 列表 / POST /{key} / DELETE /{key} / GET frequently-started / GET recently-used；登录即可，数据用户级隔离，LIMIT 封顶 20）。

**Web**：
- `oa.ts`：+listMyFavorites/favoriteProcess/unfavoriteProcess/frequentlyStarted/recentlyUsed。
- `ProcessCatalog.vue`：双栏改版 + 三个新区 + 星标 + 分类维护对话框（含删除确认）+ `openByKey`（经 `/workflow/catalog/items/{key}` 解析 formKey 后进入；不可见条目提示）。

## 验证与证据（evidence/batch-09/）

- 后端：全仓套件（三批次联合门禁，见批次 10 汇总行）+ 本批编译。
- 前端四连：typecheck 0 / lint 0 error / vitest 1298+3 / build 0。
- headed 浏览器（admin，1440×900）：
  - 分类树渲染与切换过滤（`screens/catalog-tree.png`）；
  - 收藏星标：点星 → `POST /workflow/favorites/{key}` 200 → 列表置顶 ★；再点取消 → `DELETE` 200 → 恢复（净零，`screens/catalog-favorite-toggle.png` + 会话请求捕获）；
  - 常用流程区展示发起总量 Top5（当前测试库 1 实例 → 测试1）；最近使用区同源验证；
  - 分类维护：新建「演示分类」→ 列表出现并可重命名/删除（净零清场，`screens/catalog-category-manage.png`）。

## 剩余项

- 无执行侧剩余。最近使用口径提请规划确认（见口径声明）；空态/不足 5 个/重复收藏边界由幂等端点与 v-if 空区保证。
