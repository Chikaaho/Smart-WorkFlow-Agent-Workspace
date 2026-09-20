# R2b-H 页面级失败矩阵（最终快照重采，R7-F manifest 绑定）

> 快照：`r7-f-snapshot-manifest.json`（Server PID 61384 / vite dev @5173 / bootstrap.jar sha256=290964fc…）。
> 取景页面：`/iot/connections`（共享分类错误态组件 `LoadErrorState`）；受控注入经页面上下文
> XHR 包装器只拦截 `/api/iot/connections`，其余请求不受影响。英文界面（en-US）下采集，
> 中文口径与 `r2b-h-page-failure-matrix.md`（上一轮）一致。

## 1. 八类故障页面级结果

| 类别 | 注入方式 | 页面表现 | 重试按钮 | 恢复动作文案 | 反向断言 |
|---|---|---|---|---|---|
| 网络中断 | fetch/XHR reject(TypeError) | 分类错误态 `load-error-state` | **有** | Try again later | 未显示「暂无数据」；未静默 |
| 超时 | AbortError | 分类错误态 | **有** | Try again later | 同上 |
| 401 会话失效 | 401 响应 | **跳转 `/login?redirect=/iot/connections`** | — | 登录后回来 | 不伪装成业务错误 |
| 403 无权限 | 403 响应 | 分类错误态，msg=服务端结论 | **无**（不可重试不诱导重复操作） | Ask an administrator | 同上 |
| 404 对象不存在 | 404 响应 | 分类错误态 | **无** | Back to the list and refresh | 同上 |
| 409/业务冲突 | 409+业务码 | 分类错误态 | **有** | Refresh and try again | 同上 |
| 5xx 服务异常 | 500 响应 | 分类错误态（截图 `final-en-r2bh-500-error-state.png`） | **有** | Try again later | 同上 |
| 客户端异常（响应解析失败） | 200 + 非 JSON | 分类错误态（不外显解析原文） | **无** | Fix the input as prompted | 同上 |

## 2. 重试真实发出新请求并能恢复

- 注入 500 → 错误态出现 → 清除注入 → 点击 `load-error-retry` → **列表真实恢复**
  （`.el-table__row` 重新渲染 1 行 = 受控探针连接；`errState=false`）。
  证据：`.tmp/r2bh-checks.json`（before/after）。

## 3. 反向断言汇总

- 所有故障类：页面不出现「暂无数据」冒充失败；错误态展示服务端权威 msg + 事件引用（`load-error-eventref`）。
- 不可重试类（403/404/客户端异常）不提供重试按钮，不诱导重复操作。
- DOM 零栈帧/路径/内部包名（与 R4a-S 扫描同一判据）。

## 4. 证据索引

- 截图：`shots/final-en-r2bh-500-error-state.png`（错误态），
  `shots/final-zh-iot_connections.png` / `final-en_iot_connections.png`（正常态，最终快照）。
- 结构化检查：`.tmp/r2bh-checks.json`、`final-capture-checks.json`。
- 上一轮 zh 口径矩阵：`r2b-h-page-failure-matrix.md`（预冻结快照，作追溯）。
