# P61 执行回执：R2b 失败态与空态

> 执行角色：执行（Executor）
> 日期：2026-09-16
> 对应原子项：R2b（一级执行提示 01 §2）
> 证据目录：receipts/evidence/p61-r2b-01/

## 1. 完成条件对照

| 完成条件 | 实际结果 | 证据层级 |
|---|---|---|
| 网络、超时、401/403/404/409/5xx、业务错误、客户端异常有正确错误态/恢复动作 | 新增 `p61-failure-state-audit.mjs` 三类判定全部归零；8 个 IoT 列表页补上错误态 + 重试 | 源码结构审计（工具判定） |
| 空数据只用于成功空结果 | 失败伪装空态 10 → 0；空态条件必须含「本次加载成功」维度 | 同上 |
| 失败操作不无反馈、不猜测单一成因 | 请求静默吞错 33 → 0；猜测单一成因 1 → 0 | 同上 |
| 请求层已锁定分类能力可引用 | 修复沿用 `ApiError.msg` + `common.loadFailed` 兜底的既有口径 | 源码 |

## 2. 缺口ID → 原始文件/位置 → 实际结果 → 边界

1. **`load()` 只有 try/finally**：`src/modules/iot/views/` 下 8 个列表页（Connection/Device/FlowActions/Product/Rule/RuntimeLogs/Script/Topic）的 `load()` 没有 catch。请求抛错成为未处理拒绝，列表保持为空，页面显示「暂无连接」等空态文案。统一补丁（`p61-load-error-codemod.mjs`）：新增 `loadError` 状态、catch 转可读文案、`isEmpty` 增加 `!loadError.value` 维度、表格上方渲染错误提示与重试按钮。
   **边界**：重试按钮的真实点击行为属 R7 可见浏览器验证范围。

2. **请求静默吞错 33 处**：`p61-feedback-codemod.mjs` 依审计 JSON 注入 `ElMessage.error(t('common.loadFailed'))`（17 处），另 6 处手工改写（DatasourceControl、两个 FormSelect Dialog、RelatedProcessesPanel、NotifyBatchSend 初始加载、UserList 部门树）。
   **关键事实**：请求层（`foundation/request/index.ts`）只抛 `ApiError`，**没有**全局错误提示；`RelatedProcessesPanel` 原注释「错误信息已经统一请求层提示」是不实陈述，已更正。

3. **猜测单一成因 1 处**：`MobileWorkspace.vue` 深链引用加载的非 ApiError 分支原写作 `t('common.noAccessToObject')`——网络/超时会被说成"无权限访问该对象"。改为中性 `common.loadFailed`。

4. **已复核豁免 10 条**：`scripts/p61-failure-allowlist.json` 逐条写明依据。包括：`publishDefinition` 内部已 `ElMessage.error`（再提示会双重报错）、FormRender 轮询重试循环（中途报错属预期，打断重试反而制造错误结论）、逐字段引用回显（失败显示原始 ID 而非编造名称，逐字段 toast 是噪音）、可选持久化列配置降级。
   **豁免键由审计的 catch 体首段程序化生成**，不是手抄；无依据的豁免条目视为缺键。

## 3. 新增常驻门禁

`node scripts/p61-failure-state-audit.mjs`：请求静默吞错 / catch 内猜测单一成因 / 失败伪装空态，三类必须为 0，否则退出码 1。当前退出码 0。

## 4. 门禁原始流

`evidence/p61-r2b-01/raw-gates.txt`：typecheck / lint / test / build / failure-audit / term-audit / key-coverage / dictionary-validate / locale-single-source / hardcode-gate 共 10 项退出码均 0；测试 1207 passed / 3 skipped / 0 failed。审计明细见同目录 `failure-audit.json`。

## 5. 状态与边界

R2b 的三类结构性缺陷已由工具判定归零。**边界**：本项验证是源码结构审计 + 单测；「真实 HTTP 下页面渲染出错误态而非空态」的行为证据归 R6b/R7（需真实服务进程与可见浏览器），本回执不声称已完成该部分。
