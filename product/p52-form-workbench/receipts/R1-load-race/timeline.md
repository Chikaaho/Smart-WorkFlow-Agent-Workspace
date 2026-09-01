# R1 时间线（UTC，来自页面 performance + 本地时钟）

| 时刻 | 动作/事件 |
|---|---|
| 16:30:34.193Z (T0) | `tab.goto('/form/designer/{A}')` —— A 的身份/definition 请求发出（经延迟代理，挂起） |
| 16:30:36.962Z (Tpush) | A 响应仍在途；页内 `$router.push('/form/designer/{B}')` |
| ≈Tpush+33ms | B 的 `GET /form/def/{B}` 与 `.../definition` 返回（dur=33/34ms），B 页面完整渲染 |
| 16:31:23.026Z | A 的两个迟到响应早已返回（dur=10006ms，即 T0+~10s 释放）；读取 B 页面状态 |

## performance.getEntriesByType('resource')（页面真实网络记录，after-late 读取）

| 请求 | start(ms) | duration(ms) | 说明 |
|---|---|---|---|
| GET /api/form/def/2e73e69e-…（A 身份） | 718 | **10006** | 人为延迟，迟到 |
| GET /api/form/def/2e73e69e-…/definition（A 定义） | 718 | **10006** | 人为延迟，迟到 |
| GET /api/form/def/ef79c4e5-…（B 身份） | 2768 | 33 | B 已在 A 迟到期间完成并渲染 |
| GET /api/form/def/ef79c4e5-…/definition（B 定义） | 2768 | 34 | 同上 |

原始文件：`requests.json`（perf 记录 + before/after DOM 状态）。
