# 批次 7 回执 — V012-BUG-019 全局选择、填充优化（优先项）

- 日期：2026-09-28；任务 `v0.1.2-bugfix`（L）；依据 `direction-full-repair-20260927.md` §3-019（最高优先）与 Owner 登录页反例。
- 结论：**执行自验通过（含 headed 浏览器行为证据），待 Owner 验收 / 规划子项核销。**
- 提交：Server `0.1.2-bugfix@85915b7`、Web `0.1.2-bugfix@be071b7`（均推送回读一致）。

## 原文子项映射（bug2.0.md V012-BUG-019）

| 原文要求 | 子项 | 结果 |
| --- | --- | --- |
| 包括登录页，不要出现任何让用户填 id、key 一类莫名其妙的东西 | 019-a 登录页租户输入 | ✅ SSO 区「租户 ID」手填框 → 「租户名称」精确匹配（019-a-1）；流程交接 来源/目标用户 数字框 → 用户选择器（019-a-2）；流程范围 processDefKey 手填 → 流程定义多选（019-a-3）；定时任务 FLOW 流程标识手填 → 流程定义下拉（019-a-4）；任务详情 转办/委托/沟通接收人/加签参与人/补签确认人 ID 输入 → 用户选择器（019-a-5，共 4 类输入点）；表单发起范围 用户 ID CSV 手填 → 用户多选（019-a-6）；流程设计器节点审批人手填 ID 兜底框移除，保留真实选择器（019-a-7） |
| 租户就填租户名称去精确匹配 | 019-b 服务端名称解析 | ✅ `SsoAuthService.resolveTenantIdByNameExact`：名称完全一致且唯一才放行 |
| 用户 id 部门 id 就弹选择器去选，字典 key 同样弹选择器 | 019-c 选择器基础设施 | ✅ `GET /system/user/options`（登录即可，租户内启用用户最小字段）；`UserRemoteSelect` 组件（远程搜索/回显/Long→数值归一）；字典 key 已为选择器（表单设计器 DictConfig 走 `listDictTypes`，本轮核验无需改动） |

## 修改范围

**Server（`85915b7`，9 文件）**：
- `SsoAuthService`：+`resolveTenantIdByNameExact`（空→`sso_tenant_required`、零命中→`sso_tenant_not_found`、多行→`sso_tenant_ambiguous`，歧义不任意选中；免认证路径挂起租户拦截器）；`startAuthorizeLogin` 重载为名称入口，既有 Long 链与有效性校验（存在/启用/未过期 + Provider 启用）原样保留。
- `SsoAuthController`：`/auth/sso/{provider}/authorize-login` 参数 `tenant:Long` → `tenantName:String`；fail-closed 返回可判定 errorKey（不 500、不泄漏）。
- `SystemErrorKeys` + `messages_zh_CN/en_US.properties`：新增 `sso_tenant_not_found`/`sso_tenant_ambiguous` 双语消息（P61 错误键体系）。
- `UserController`：+`GET /system/user/options`（keyword/limit≤200，经 `UserQueryFacade.searchActiveUsers` 租户内解析，仅 id/username/realName）。
- 测试：`SsoAuthServiceTest` +5 例（空白/唯一命中带 trim/零命中不签发 state/多行歧义/命中但停用拒绝）；`UserControllerTest` +2 例（命中最小字段+limit 封顶/门面 empty 回退空列表）。

**Web（`be071b7`，12 文件）**：
- `LoginPage.vue`：SSO 租户输入 type=number → 名称文本框（`auth.tenantName` 键），校验改非空；`sso.ts` 契约 `tenant:number` → `tenantName:string`；死键 `tenantId/tenantIdInvalid` 移除（move-not-copy）。
- `UserRemoteSelect.vue`（新）：远程搜索用户选择器（显示 realName（username），存 id）；`user.ts` +`searchUserOptions`。
- `TaskHandover.vue`：来源/目标用户 el-input-number → UserRemoteSelect；流程范围 CSV 输入 → 流程定义多选（label=名称（key），提交仍 scopeDefKeys）。
- `TaskDetail.vue`：生命周期弹窗 4 处 ID 输入 → UserRemoteSelect（CSV 字符串桥接，提交契约零改）。
- `FormDefList.vue`：发起范围 CSV 输入 → 用户多选（回显/保存数组化）。
- `JobList.vue`：FLOW flowDefKey 输入 → 流程定义下拉。
- `ProcessDesigner.vue`：节点审批人未解析态的手填 ID 输入框移除（选择器入口保留）。
- locale：新增 pickSourceUser/pickTargetUser/pickReceivers/pickParticipants/processScopeAll/tenantName 等双语键；ID 类提示文案去 ID 化。

## 验证与证据（evidence/batch-07/）

- 后端聚焦：`SsoAuthServiceTest` 27 例 + `UserControllerTest` 11 例全绿（含新增 7 例）；全仓套件见批次 8 汇总（同分支门禁）。
- 前端四连：typecheck 0 / lint 0 error / vitest 1298+3 / build 0。
- headed 浏览器（admin + English/中文，1440×900 与 1366×768，`screens/`、`api/`）：
  - 登录页反例整改：SSO 区为「Organization name」名称框（`login-tenant-name-input.png`），无 ID 手填残留。
  - 名称解析三路径（真实请求捕获）：`演示租户`（V97 改名前）/`默认租户` 命中歧义 → `sso_tenant_ambiguous`（歧义不任意选中）；`不存在企业XYZ` → `sso_tenant_not_found`；`演示租户`（V98 改名后唯一）→ 解析成功推进到 Provider 未配置的下一道门 `sso_login_not_completed`（属真实外部凭据边界，不虚报云端链路）。制品 `../batch-08/api/sso-tenant-name-resolution.json`。
  - 交接页：用户下拉展开显示「系统管理员（admin）」，选中值为 id；`GET /system/user/options` 200 真实响应（`handover-user-select-open.png` + 会话捕获）。
  - 发起范围：用户多选选中后保存 → `PUT /form/def/{id}/visibility` 请求体 `{"userIds":[1]}`（数值化生效）→ 200；随后清空保存 `{"userIds":[]}` 还原（净零）；占位文案同步去 ID 化（`visibility-dialog-user-select.png`）。
  - 定时任务：FLOW 类型下流程定义下拉展示「测试1（bpm_80e44959dfc94ee0）」（`job-flow-def-select.png`）。

## 边界与如实说明

- SSO 云端回调链（真实 Provider 授权/回调）保持 I5 既有 `Owner延期/未验证` 口径，本轮只验证本地名称解析与授权发起门，不宣称整链通过。
- 后端 JacksonLongToStringConfig 将 id 序列化为字符串：选择器统一 Number 归一化，写路径请求体已实证为数值。
- 部门 id/字典 key 输入点核验：字典 key 在设计器已为下拉（DictConfig→listDictTypes）；部门 id 无面向用户的直填入口（组织选择走既有部门树），核验记录于本回执不虚构造点。

## 剩余项

- 无执行侧剩余。验收口径：Owner 以原表三张截图对应入口回归；名称歧义/不存在/停用的服务端行为已由测试与真实请求双重覆盖。
