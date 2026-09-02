# S1 · 结果与断言

## 正向目标断言

| 断言 | 结果 |
|---|---|
| 无 `form:design` 查看权限的真实账号对真实存在表单直接读取身份 | 403「无权限」（`GET /form/def/b2b2cbdc…`，HTTP 200 + code 403） |
| 同上直接读取 definition | 403「无权限」 |
| 同上直接读取 snapshots | 403「无权限」 |
| 同上直接读取表单列表（page） | 403「无权限」 |
| 无权账号真实浏览器深链 | 显示「无权访问该表单 / 无权限」明确拒绝页（`deeplink-403-rejected-panel.png`） |
| 工作台主体/画布/保存/发布/历史/关联流程操作区零渲染 | `.designer__workbench`、`.designer__body`、关联流程面板均不存在；页面按钮仅「返回表单列表」（组件测试 `FormDesigner.spec` S1 用例同断言） |
| 管理员对同一对象相同读取 | 身份 200（含 formKey/status/版本）、definition 107 字节、snapshots 1 条（V2）、列表 total=1 含目标 |
| 修改后质量门 | 后端 1002/0/0/0；前端四连门通过，Tests 1092 passed / 3 skipped（含新增请求层归一 3 例 + FormDesigner 403 拒绝态 1 例） |

## 反向零残留断言

| 断言 | 结果 |
|---|---|
| 无权账号四类响应体零泄露（表单 ID/名称/字段/快照版本） | containsFormId/containsFormName/containsField/containsSnapshotVersion 全 false |
| 无权账号页面零数据泄露 | 拒绝页不含 formKey、名称、字段或任何操作入口 |
| 跨租户读取零泄露（tenant_id=1 克隆对象 `aaaa0000…`） | 租户 0 已认证主体：身份/快照 1000「表单不存在」、definition 1300「表单配置未找到」、列表不含克隆对象；泄露扫描（克隆 ID/KEY/名称/definition）全 false |
| 跨租户主体无法进入系统（附加） | 租户 2 用户登录返回 2104：sys_user 查询被租户拦截器过滤，隔离在认证上游生效 |

## 结论

S1 缺口闭合：表单工作台身份链（身份/definition/snapshots/列表）已由 `form:design` 方法级鉴权保护，页面深链呈现明确无权限拒绝态且操作区零渲染；合法路径（admin）未被误伤；跨租户按既有隔离拒绝且零数据泄露。

## 范围说明（非缺口）

- `GET /form/def/by-key/{formKey}` 与 `/by-key/{formKey}/definition` 未加 `form:design`：两端点为表单填报运行时链路（无设计权限的填单用户按 key 渲染已发布表单），S1 口径四类读取（身份/definition/snapshots/列表）不包含 by-key 链路；若对其加设计权限码将破坏既有填报功能，属方向外范围，未改动。
