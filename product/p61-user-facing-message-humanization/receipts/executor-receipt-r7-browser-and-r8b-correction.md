# P61 执行回执：R8b 更正 + R7 可见浏览器与混语缺陷

> 执行角色：执行（Executor）
> 日期：2026-09-16
> 涉及原子项：R8b（更正重开）、R7（进行中，含真实缺陷发现）
> 证据目录：receipts/evidence/p61-r8b-01/、receipts/evidence/p61-r7-01/

## 1. 必须更正的自身证据缺陷：R8b 此前结论是空集

**事实**：`executor-receipt-r4a-r8b-support-and-seed.md` 中「迁移 DML 中文命中 0」是**无效结论**。该扫描复用了只收集 `.ts/.vue` 的 `walkDir`，`.sql` 文件从未进入扫描集合——0 命中是空集，不是"没有"。

**更正后（正确遍历全部 .sql）**：扫描 1xx 个 SQL 文件，**含中文注释 1645 行；DML/字符串中文命中 365 处**（完整清单见 `evidence/p61-r8b-01/r8b-full-scan.txt`）。分布：

| 来源 | 性质 | 例 |
|---|---|---|
| `V2__init_data.sql`（h2/postgresql 各 39） | 字典标签种子（用户可见，随字典展示） | 性别/用户状态等 label |
| `V6__m_seam_menu_seed.sql`、`V61/V82/V90` 等菜单种子 | **菜单名（真实页面可见）** | 流程引擎 / 通知 / 智能体 / 物联网 / 开放接口 / 已办任务 / 我的草稿 / 收件箱 |
| `V47/V73/V31` 权限种子 | 权限项名称（授权界面可见） | 流程修改 / 流程发布 / 任务转办 / 授权代理规则 |
| `V85` 租户种子 | 租户名（管理界面可见） | 默认租户 |
| `devseed/*`、`*/test/resources/*` | dev/test 夹具（不进生产面） | I5 测试租户 / 限时租户管理员 |

R8b 因此**重新打开**：365 处中的生产可达部分（菜单/权限/字典/租户名）是用户可见文案，必须分类治理；dev/test 夹具按路径可证非生产面。

## 2. R7 真实浏览器证据（可见会话，headless=false）

**环境**：ZCode 内置浏览器（可见、可交互）；前端 vite dev（localhost:5173，代理 → 真实 Server 8080，`VITE_USE_MOCK=false`）；身份 admin（本地测试账号，验证码按 Owner 说明为固定 1234）；视口 1280×720；产物见 `evidence/p61-r7-01/*.png` 与 `probe-*.json`。

**成对结果**：

| 时点 | htmlLang | 卡片标题 | 残留中文 |
|---|---|---|---|
| zh-CN 基线 | zh-CN | 工作台/我的待办/… | 全部中文（预期） |
| 切 English（修复前） | en-US | Workspace + **我的待办/我的已办/我发起的/抄送/常用事项/草稿/消息** | 流程引擎、通知、系统管理员 |
| 切 English（修复后，reload 复验） | en-US | Workspace / **My to-dos / My processed / Started by me / CC / Favorites / Draft / Message** | 流程引擎、通知、系统管理员 |

两次均**无横向溢出**；`localStorage['sw.locale']=en-US`、`<html lang>` 与 Element Plus 同步。

## 3. 由此发现的真实缺陷（R7 的价值）

### （a）模块加载期求值导致切换语言失效【已修并复验】

`WorkspaceHome.vue` 的 `COMPONENT_TITLES` 在**模块顶层**调用 `t()`，导入时按当时语言求值一次并固化；切到 en-US 后卡片标题仍是中文，与同页已英文化的其他文案形成**同屏混语**（浏览器实拍证据）。

修复：改为 `COMPONENT_TITLE_KEYS`（键映射）+ `componentTitle()` 渲染期解析。复验后卡片标题全部英文化。

同类缺陷此前已修 4 处（workbench、graphAdapter、node-panel-registry、process-graph）；本轮新增 `scripts/p61-frozen-locale-audit.mjs` 系统扫描，命中 97 处候选（含 `computed(() => t(...))` 等误报需人工甄别），**其中 `foundation/request/error-code-map.ts` 的 `ERROR_CODE_MAP` 是同类真实实例**（导入期固化，语言切换后兜底文案不变，直到整页刷新）。

### （b）菜单文案来自数据库种子，en-US 下不翻译【未修，属范围决策】

顶栏/侧栏菜单（流程引擎、通知、收件箱、已办任务、我的草稿、抄送我的…）由 `sys_menu` 表种子提供，只有中文。两种治理路径：

1. **Server 侧**：菜单接口按 `Accept-Language` 或在返回中携带 `titleKey`，由服务端目录本地化；
2. **Web 侧**：以菜单 `code` 映射到 Web 语义键（`menu.workflow` 等），DB 文案仅作回退。

两者都会改变文案权威归属与既有接口形状（可能涉及契约），**超出执行角色可自行裁定的范围**，需 Planner 在方向中明确。本回执不擅自选定。

## 4. 边界与诚实声明

- 本会话模型**不支持图像输入**：我可以保存并回读视觉制品（PNG 已落证据目录，可人工复核），但**不能声称"我看到了渲染效果"**。上表所有断言均来自 DOM/`localStorage`/页面上下文探针与网络层，而非目视；"无溢出""无混语"是程序化判定（`scrollWidth > clientWidth+1`、CJK 行扫描）。
- 覆盖页面：`/workspace`（工作台/应用壳）。方向 §8 指定的其他页面族尚未成对采集。
- 菜单文案（DB 种子）在英文下的混语仍存在，属上文 3(b) 的范围决策。
