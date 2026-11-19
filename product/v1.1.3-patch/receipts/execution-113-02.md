# execution-113-02：1.1.3 阶段 3 返修（E1—E3 补证 + B4）

方向 `product/v1.1.3-patch/ready/direction-v1.1.3.md`（L，已含 B4）｜执行（返修轮 1）｜2026-11-19｜依据 `planning-review-113-01.md` 与补充提示 `planning-execution-prompt-113-01.md`｜Web `feature/1.1.3` 新增提交 `97a33b6`，Server 无改动。已锁定项（开工三问、B1 列表与跨重启、B1 详情可打开、G1、G2、Web 门禁基线）未改动、未重新验证。

第 1 轮缺证的原因：详情/列表截图误用整页截图（`fullPage: true`），画面停在 Token 区，轨迹与时间列没有进入画面。本轮全部改为**视口截图**——先 `scrollIntoView` 滚动目标区，再用 `getBoundingClientRect` 对「节点轨迹」标题和轨迹末行做几何校验（标题与末行均落在 0–900px 视口内才算数），然后截图。下文每张截图的画面内容都以该校验加当页 DOM 快照为准。

## 1. E1：B2 三次取消的节点轨迹（补证）

同一批执行（未新造），滚动到节点轨迹后的视口截图：

| 截图 | 执行 | 画面内容（DOM 与几何校验一致） |
|---|---|---|
| `113-B2-request-cancel-child-trajectory.png` | 子行 `#2123370528919531521`（受理号取消） | 轨迹 `#1 开始→成功`、`#2 人工处理→已取消`；轨迹末行 y=786（视口 900 内），页面无「等待人工」 |
| `113-B2-request-cancel-parent-trajectory.png` | 父行 `#2123370528898560002`（受理号取消） | 轨迹 `#1 开始→成功`、`#2 子图→已取消`，同上几何校验 |
| `113-B2-execid-cancel-child-trajectory.png` | 子行 `#2123370735610638338`（执行编号取消） | 同第一张口径 |

补充提示里第三个目标写作 `#212337073561061338`，比对 DB 与第 1 轮回执为 `2123370735610638338`（执行编号取消的子行）少了一位数字，按实际执行编号取证。三张页面均无「等待人工」文案（逐页 DOM 全文断言）。

## 2. E2：B1 详情轨迹与父子关系（补证）

| 截图 | 执行 | 画面内容 |
|---|---|---|
| `113-B1-parent-detail-trajectory.png` | 父行 `#2123362877913444354` | 轨迹 `#2 子图→成功` 带「查看子执行 `#2123362877942804482`」按钮；轨迹整段 480→786px 在视口内 |
| `113-B1-parent-view-child-opened.png` | 点击「查看子执行」后 | 打开子执行详情，URL 变为 `/agent/executions/detail/2123362877942804482`，头部「受理号 `#2123362877854724097`」 |
| `113-B1-child-detail-trajectory.png` | 子行 `#2123362877942804482` | 轨迹 `开始→人工处理→结束` 全部「成功」（人工任务超时自动恢复后收口），几何校验同上 |

## 3. E3：B3 发生时间列（补证）

`113-B3-time-column-viewport.png`：执行列表横向滚动到「发生时间」列（列头 `scrollIntoView(inline:center)`）后的视口截图，画面内时间单元格为 `2026-11-19 19:02:58` 等 `yyyy-MM-dd HH:mm:ss` 格式，无 `T` 与微秒。

## 4. B4：graphDefId 精度丢失（新增项）

### 修复（Web `97a33b6`）

- `ExecutionList.vue`：`graphDefId` 从 `Number(route.query.graphDefId || 0)` 改为**字符串透传**（非空字符串即过滤条件，原样传入请求）；`loadList` 的条件 `> 0` 改为 `!== ''`。
- `api/index.ts`：`pageGraphExecutions`、`pageGraphExecutionsInternal`、`pageDebugSessions` 三处 `graphDefId?: number` 放宽为 `graphDefId?: EntityId`（`number | string`，该类型文件内已有）。
- **同文件 Number() 排查**：`ExecutionList.vue` 仅剩 `toTokenNumber`（第 235 行，Token 计数求和用，值域小整数，与 ID 无关），无其他 ID 走 `Number()` 转换。
- **后端核查**：`graphDefId` 查询参数由 Spring 按 String→Long 精确绑定（无 double 中转），后端不存在同型数字化问题，Server 不改（符合补充提示 §3 的前置说明要求）。

### 单测

- 新增 `113-B4: graphDefId 超 2^53 时按字符串透传，不丢精度`：路由 query 放 `'2123356778938249217'`，断言 API 收到**原样字符串**，并前置自证 `String(Number(id)) !== id`（Number 确实丢精度）。
- 既有 `D126-02-a` 对齐真实路由语义：vue-router 的 query 值恒为字符串，测试桩里的 `graphDefId: 1`（数字）改为 `'1'`。

### 门禁（四项全部重跑）

typecheck 0 错、lint 0 错 0 警、test **2121 通过 +3 跳过**（较第 1 轮 +1，即 B4 用例）、build 通过。

### 隔离环境复测

Vite 5275 热更新加载新代码后，从图定义列表「更多 → 执行历史」（父图 `2123356778938249217`）进入：列表 **9 行，全部为「113父图-子图人工等待」**（该图的执行，过滤生效；修复前同入口 0 行）。URL `…/agent/executions/list?graphDefId=2123356778938249217`（由工具读取记录；页面截图为视口内容，地址栏不在画面内）。截图 `113-B4-entry-fixed.png`。

## 5. 本轮新增证据清单（`.iso113/evidence/`，不入 Git）

`113-B2-request-cancel-child-trajectory.png`、`113-B2-request-cancel-parent-trajectory.png`、`113-B2-execid-cancel-child-trajectory.png`、`113-B1-parent-detail-trajectory.png`、`113-B1-parent-view-child-opened.png`、`113-B1-child-detail-trajectory.png`、`113-B3-time-column-viewport.png`、`113-B4-entry-fixed.png`，共 8 张视口截图。

## 6. 其余

- CI：按裁定阶段 3 不附功能分支 run 号，阶段 4 合并 main 后补记（须 success）。
- 阶段 4—7 待办不变（合并 → tag `1.1.3`，发布说明列 B1—B4 并注明 `583f1a38` 修启动回归 → 部署与演示环境复测 B1—B4、按裁决口径处理旧数据行 → 文档同步）。
