# R2b-H 页面级失败分类矩阵（真实可见浏览器，受控传输注入）

> 采集环境：ZCode 内置可见浏览器（headless=false），视口 1280×720，en-US，身份 admin(test_1)
> 被测页面：`/iot/connections`（列表页）与 `/workspace`（工作台）
> 服务：dev profile + H2 内存库，端口 8080，同一进程
> 注入方式：页面上下文覆盖 `XMLHttpRequest.prototype.send`，只拦 `/api/` 请求，按类别构造
> 传输失败（`error`/`timeout` 事件）或指定 HTTP 状态的响应体。属提示 02 §5
> 「网络受控注入」允许的命令。

## 1. 九类失败在页面上的实际反馈（原始 DOM 回读）

| 类别 | 错误态出现 | 渲染为空态 | 恢复动作文案 | 重试入口 | 页面去向 |
|---|---|---|---|---|---|
| 网络中断 | 是 | 否 | Try again later | 有 | 停留 |
| 超时 | 是 | 否 | Try again later | 有 | 停留 |
| 401 | 否 | 否 | —（会话失效处理） | — | 跳转 `/login` |
| 403 | 是 | 否 | Ask an administrator for access | **无** | 停留 |
| 404 | 是 | 否 | Back to the list and refresh | **无** | 停留 |
| 409 | 是 | 否 | Refresh and try again | 有 | 停留 |
| 500 | 是 | 否 | Try again later | 有 | 停留 |
| 503 | 是 | 否 | Try again later | 有 | 停留 |
| 客户端异常 | 与 500 同类（`classifyTransportFailure` 未知传输码 → `SYSTEM_FAULT`） | — | — | — | — |

反向断言成立：

- **失败不渲染成空数据**：全部 8 类的 `el-empty` 均为 `false`（`empty:false`），即失败态与成功空态在页面上互斥。
- **不静默吞错**：每类都产生可见错误态，无一例只留空白。
- **不可重试错误不诱导重复操作**：403 与 404 明确**不提供**重试按钮（权限与对象不存在重试无意义），
  只有 409/5xx/传输类给重试；恢复文案按类别分化，未统一写成「稍后重试」。
- **401 走会话失效路径**：不渲染页面级错误态，而是清会话并跳转登录页——这是正确的会话语义，
  与 403 在页内呈现拒绝态形成区分。

原始度量：`evidence/p61-r10-01/.tmp/r2b-matrix.json`、`r2b-matrix-http.json`。

## 2. 重试真实发出新请求并恢复（关键正向断言）

固定对象：`/iot/connections`，注入类别 500。

| 阶段 | 原始观测 |
|---|---|
| 注入后 | `err=true`，注入态请求计数 2，重试按钮可见 |
| 清除注入并点击重试 | 请求日志新增一条**非注入**的 `GET /api/iot/connections`（总 API 调用 2 → 3） |
| 重试后 | `errGone=true`，错误态消失，页面恢复为正常加载态（列表为空 → 空态） |

即：重试不是视觉安慰，而是真的重新发起了请求并让页面从失败态恢复到成功态。

原始度量：`evidence/p61-r10-01/.tmp/r2b-retry-recovery.json`。

## 3. 与 HTTP 分类矩阵的关系

页面上的「结论」与「恢复动作」来自请求层 `classifyHttpStatus` / `classifyTransportFailure`
（`src/foundation/request/failure-category.ts`）；服务端在 `runtime-http.txt` B1—B6 已证明
401/403/对象不存在/请求体不可解析/业务参数各自产出**互异**的稳定 `errorKey`
（6 行输入 → 5 个不同 errorKey），因此页面分类不是前端凭空猜测。

当非 2xx 响应带有可解析的 R 体时，页面展示的是服务端 `msg`（服务端文案为权威，方向 §3.4），
恢复动作仍按分类给出——本轮注入体的 `msg` 为探针字符串，故表格中的「结论」列显示注入值。

## 4. 边界

- **客户端异常**未单独构造页面探针：按现有分类实现它与 5xx 同归 `SYSTEM_FAULT`，
  页面表现与 500 行一致；未单列一行实测。
- 本轮矩阵在**实现冻结前的构建**上采集。按提示 02 §5，最终快照需在实现冻结、
  生成 manifest、重启服务后整体重采，本文件不构成最终快照证据。
