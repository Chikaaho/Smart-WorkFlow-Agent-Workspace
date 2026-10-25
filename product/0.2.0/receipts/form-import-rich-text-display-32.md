# 表单导入真实链、富文本导入清洗与列表可见文本

2026-10-26｜Executor｜批次32，对应 A06—A10 导入/持久结果与 F020 富文本展示边界；同时验证账户菜单/修改密码入口。

## 变更

- Web `5b16911..363fecd`（`codex/0.2.0-ui-tenant-form-flow`，已推送）：
  - `FormDataList.formatCellValue` 增加 `RICH_TEXT` 分支，使用 `richTextVisibleText` 只显示可见文本；不再把 `<!--sw-rt:1-->` 前缀和 `<p>/<span>` 标签当正文显示。
  - 旧无前缀纯文本仍原样返回（按文字显示），不猜 HTML、不把字面标签当元素渲染。
- 服务端本批零改动；导入继续走既有 `FormSubmitService` 校验与 `FormFieldValidator` 的 RICH_TEXT 清洗。

## 真实链（PG 18.4，t100admin@租户100，node 直连 8080）

1. **普通表单导入**：下载 `a09_pg_probe` 模板（2 列：开放字段/受控字段），第 3 行填 `import-open-20261026|import-ctrl-20261026`，POST `/api/form/data/a09_pg_probe/import` → `totalRows=1, successCount=1, errorCount=0, processing=0`，`successIds=[c4e65a07-...]`；随后查询 total=2，导入行两字段值实际持久化。
2. **RICH_TEXT 无前缀导入（旧纯文本语义）**：`form_mvo5n2wg` 导入 `<p onclick="alert(1)">导入<b>富文本</b><script>alert(2)</script></p>` → 导入成功；查询返回原字符串（无 `<!--sw-rt:1-->` 前缀，按旧纯文本保存）。列表与详情均按文字显示，DOM 中 `p[onclick]` 与对话框内 `script` 数量均为 0，未执行。
3. **RICH_TEXT 必填负向**：同一模板提交空富文本 → `successCount=0, errorCount=1, errors=[{rowNum:3, message:"必填字段「富文本正文」缺失"}]`，整批回滚；查询 total 未增加。
4. **RICH_TEXT 带前缀脏值（服务端权威清洗）**：导入 `<!--sw-rt:1--><p onclick="alert(1)">导入富文本<script>alert(2)</script></p>` → 导入成功；查询实际存为 `<!--sw-rt:1--><p>导入富文本</p>`，`onclick`、`script` 均被移除，只保留合法标签与可见文本。
5. **列表展示修复前/后**：修复前列表直接显示 `<!--sw-rt:1--><p>安全<span...>文字</span>链接</p>`；修复后显示“安全文字链接”“你好世界”“导入富文本”，页面不再出现前缀；旧值 `<b>旧文本</b>` 仍按字面显示。
6. **账户菜单/修改密码**：管理端头像菜单真实展开（操作手册/账号绑定/修改密码/返回前台/退出登录）；点击“修改密码”弹出当前密码/新密码/确认新密码三字段及取消/保存，关闭后无残留。未实际修改密码。

## 门禁

- Web 四连 exit=0：typecheck 0、eslint 0/0、vitest **215 文件通过/1 跳过，1871 通过/3 跳过**、build 4.20s（`/tmp/web-fourgate-32.log`）；`AppFormData.spec.ts` 7/0。
- 服务端沿用 `83f58d0` 首节点触发器修复后的运行包；本批未改服务端，未重跑全后端。

## 未验证/边界

- 导入通过 node 直连 8080 的 multipart 请求完成；IAB 文件选择器不支持上传，未在浏览器内点选文件，但导入接口、服务端校验、PG 持久化与前端列表展示均真实。
- 未测导出回读/模板签名不匹配/子表导入；本批只覆盖主表普通字段与 RICH_TEXT。
- 无前缀 HTML 文本按旧纯文本保存并转义展示，不当作富文本清洗；这是既有兼容口径，不是漏清洗。
- 修复后截图仍受宿主 surface/rAF/OS 捕获限制，无 PNG；A03—A05 正式像素未通过。
- 0.2.0 IN_PROGRESS，未核销 P、未晋级基线；等待 Planner 独立复核。
