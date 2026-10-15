# BF20261013-050/051 执行回执：表单管理左列整列面板（去搜索）+ 分类维护移交管理端

2026-10-15｜执行者提交（fix-loop 持续修复批次）。Owner 在 BF048 四项边界上的答复与追加：

- ①「**可以滚动**，因为现在左上角单独一块画布很诡异」；
- ②③「参考①，我说的丑是**单独一块小画布**太丑了」；
- ④「**放到管理**」；
- 追加版式：「1.左上角这块**去掉**；2.**整个这一列，跟右侧一样**（高度撑开留白 / 底部圆角 / 右边）；3.表单管理**搜索框去掉**，但是**流程中心保留搜索**」。

判级：跨仓（Web 视图/文案 + Server 菜单迁移）、涉及前台/后台功能归属 → **L**（非破坏、可逆；库操作仅为幂等菜单行）。

## 一、现状与成因

- **BF050**：BF048 只把分类树卡片封了顶（`max-height` + 内部滚动），它仍然是「左上角一小块孤立卡片」——Owner 的口径是**整个左列要成为一列**（撑开留白、底部圆角、与右侧同面）。另：本页筛选卡（表单名称/标识 + 查询/重置）Owner 要求撤下。
- **BF051**：分类维护（新建/改名/删除）此前由前台流程中心的「管理分类」弹窗承担；管理端 `ProcessCatalogAdmin`（`/workflow/catalog-admin`，本身已具备分类 CRUD + 排序 + **事项归属调整**）**只有静态路由、没有菜单行**，管理端侧栏点不到。Owner 定：分类维护放到管理端。

## 二、已修复

### Web

| 文件 | 修改摘要 |
|---|---|
| `src/modules/form/views/FormDefList.vue` | `.form-def-page`：加 `min-height: 100%` + `box-sizing: border-box` + `padding-bottom: 16px`（底部圆角不贴窗口下沿）；`.form-def-page__tree`：`align-self: start` + `max-height: min(60vh,480px)` → **`align-self: stretch`**（整列面板，去掉上限），保留 `overflow: auto`、描边、圆角与 `--sw-shadow-card`；删除 `#filter` / `#filter-actions` 两槽与 `keyword`/`currentKeyword`/`handleQuery`/`handleReset`，`loadList` 不再传关键字 |
| `src/modules/workflow/views/ProcessCatalog.vue` | 删除「管理分类」按钮、弹窗、维护逻辑与 `.category-manage*` 样式（连带 `canManageCategories`、`useUserStore` 依赖）；前台仅保留只读浏览（分类筛选）+ 收藏/常用/最近 + 搜索 |
| `src/locales/zh-CN.ts` / `en-US.ts` | 删除随入口退场的 10 个 `catalog.*` 文案（zh/en 同步）；`workflow.itemManagementTitle`：「事项管理（流程中心）」→ **「事项归属管理」** / Item assignment management |
| `scripts/p61-copy-dictionary-batch6.json` | 撤销上一批新增的「暂无分类」字典条目（文案随入口退场） |
| `src/modules/workflow/views/__tests__/ProcessCatalog.spec.ts` | 原 BF049 弹窗用例改写为**守卫 3 例**：前台无分类维护入口（超管也不出现、无该文案、弹窗不在 DOM）/ 左树仍按服务端分类渲染并按分类过滤 / 流程中心搜索保留 |

### Server

| 文件 | 修改摘要 |
|---|---|
| `db/migration/postgresql/R__bf20261013_catalog_admin_menu.sql`、`db/migration/h2/…`（同内容） | 幂等迁移：菜单 **9112**（parent 5 流程管理、name `WorkflowCatalogAdmin`、title 事项归属管理、path `workflow/catalog-admin`、component `workflow/views/ProcessCatalogAdmin`、permission `workflow:catalog:manage`、icon `List`、sort 27）+ 角色授权 **9320**（role 2 管理员）。沿用 P62—P64 预留段（9100—9199 / 9300+）与 `NOT EXISTS` 幂等写法；普通角色须经角色菜单管理显式授权 |

## 三、验证

**四门**（Web）：`lint` **0 错 3 警**（既有基线）、`typecheck` exit 0、`vitest run` **165 文件 / 1534 通过 3 跳过**（较上批 −2：BF049 弹窗 5 例 → 本批守卫 3 例）、`build` ✓。

**服务端**：`mvn -q -pl sw-bootstrap -am package -DskipTests` 重建 jar → 停旧实例（精确 pid）→ `java -jar sw-bootstrap/target/bootstrap.jar` 重启 → `/api/actuator/health` 200（4s）。迁移落地实测：`flyway_schema_history` 新增行 `bf20261013 catalog admin menu`（`success = t`，2026-10-15 12:41:32）；`sys_menu` id 9112 与 `sys_role_menu` id 9320 行存在；迁移上线前先在真库事务内 dry-run（两处 INSERT + 回读 + `ROLLBACK`）确认列名与约束。

**实景点验**（应用内浏览器 tab `iab-tab:d2402b32-…`，1440×900，管理员会话）：

| 项 | 动作/对象 | 实测 |
|---|---|---|
| BF050 面板（Owner 数据） | /form/form-def-list | 面板 236..456 × 64..884（高 **820** = 内容区 836 − 16 底部留白）、树内容在顶部、**面板内留白 675px**、底部圆角 + 右缘卡片面（同右侧卡 token）可见；筛选卡 DOM 计数 **0**、无 placeholder 输入（搜索已撤）；右侧列表仍内容高度 |
| BF050 面板（长树反证） | 经管理端建 12 个临时分类 → 树 16 行 | 面板随内容长高（内容 416 < 面板 818 → 不滚动、仍留白），整页滚动——与右侧列表同一行为（"可以滚动"）；随后临时分类全部删除，恢复 0 分类 |
| BF051 管理端入口 | /workflow/defs 侧栏 | 出现 **「事项归属管理」**（序：工作台卡片 → 事项归属管理 → 流程监控 → 流程定义 → …），点入直达 `/workflow/catalog-admin`，页标题「事项归属管理」 |
| BF051 管理端链路 | 事项归属管理页 | 事项列表（事项名称/标识/关联表单/**分类**/流程状态/表单/绑定/操作）与分类总览（名称/排序/事项数/操作）齐全；空名称保存 →「分类名称不能为空」且 **0 请求**；新建 →「分类已创建」；删除 →「分类已删除」；**归属** 弹窗「调整事项归属」打开读到当前归属=未分类（未改数据） |
| BF051 前台 | /workflow/catalog | 无「管理分类」按钮、无弹窗（DOM 计数 0）；**搜索框保留**（`catalog-page__search` 在位）；分类树仍显示 全部 1 / 未分类 1 且可筛选 |

**数据边界（如实登记）**：为构造长树，经管理端建了 12 个临时分类（`临时长树01…12`）与 3 个短周期临时分类（`临时归属分类`、`临时归属分类B` 等），**全部经管理端「删除」逐条清除**，终态 **0 分类**；未改任何流程定义、表单或实例数据（归属弹窗仅打开查看，未保存）。Owner 新增的草稿流程「123」未被触碰。

## 四、观察与边界（未改，供 Owner 定夺）

1. **长树时的滚动归属**：本批实现为「面板随内容长高、整页滚动」（与右侧列表同行为），面板的 `overflow: auto` 仅在面板自身被约束时才生效。如果你要的是「面板固定在当前视口高度内、树在面板内滚动」，改一行（页面行高 `minmax(0, 1fr)`）即可，请点一句。
2. **管理端入口的形态**：做法是给既有页面加菜单行（侧栏二级项「事项归属管理」，位于「工作台卡片」之后）。若你希望它与「流程定义」并列在别的位置、或并入某个页面内部，给个位置即可调整。
3. **普通用户的授予**：菜单只授权给管理员角色（role 2）；普通角色需在角色菜单管理里显式勾选才会看到该页（与该页权限 `workflow:catalog:manage` 一致）。
4. **前台分类筛选**仍可用：流程中心左树按分类浏览不变；分类的**维护**入口现在只在管理端。

## 五、提交

- Web：`codex/bugfix-20261013`（本批：FormDefList.vue / ProcessCatalog.vue / zh-CN.ts / en-US.ts / p61 字典 / 重写 ProcessCatalog.spec.ts）。
- Server：`codex/bugfix-20261013`（本批：`R__bf20261013_catalog_admin_menu.sql` × h2/postgresql 两份）。
- 根仓：台账 BF20261013-050/051 两行 + 本回执 + 证据索引（`evidence/bf023-network-index.md` 050/051 段）+ 两个子仓指针。

## 六、状态

**待 Owner 点验**：①打开「表单管理」看左列是否已成**整列面板**（高度撑开、树在顶部、下方留白、底部圆角、右缘与右侧同面），且**名称搜索已撤**；②打开「流程中心」确认搜索仍在、分类维护入口已不在；③管理端 → 流程管理 → 侧栏「**事项归属管理**」，核对分类维护与事项归属都在这里。
