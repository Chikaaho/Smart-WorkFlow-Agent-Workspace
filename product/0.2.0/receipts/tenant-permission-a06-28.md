# A06 租户管理：非超管不再以“请求参数有误”掩盖权限拒绝

2026-10-26｜Executor｜批次28，对应 A06 权限/校验与可见错误语义；承接 `/system/tenant` 实际反馈。

## 现象与根因

- 租户管理员 `t100admin@租户100` 打开系统管理 `/system/tenant`，页面显示通用“请求参数有误”，而不是权限原因。
- 根因有两层：
  1. 该账号不是租户 0 的系统超级管理员，但页面仍请求只允许超管调用的 `/system/tenant/page`。
  2. 服务端 `TenantAdminService.assertSuperAdmin` 使用 `CommonErrorCode.PARAM_ERROR`，`GlobalExceptionHandler` 按错误码目录解析成通用“请求参数有误”，把更具体的“仅系统超级管理员可以维护租户”覆盖掉。
- “HTTP 200”不代表业务成功：本次按响应体 code 与页面实际文案判定，未把 200 当成功。

## 变更

- Web `110967d..153d902`（`codex/0.2.0-ui-tenant-form-flow`，已推送）：
  - `TenantList.vue` 的 `loadList` 先判断 `canManage`；非超管直接置空列表并显示 `system.tenantSuperAdminOnly`“仅系统超级管理员可以维护租户”，不再发列表请求。
  - 补充该文案的中英文键；`TenantList.spec.ts` 增加非超管用例，断言不调用列表 API、显示具体权限文案。
- Server `66ca50b..49c320f`（`codex/0.2.0-tenant-form-flow`，已推送）：
  - `TenantAdminService.assertSuperAdmin` 改为 `CommonErrorCode.FORBIDDEN.getCode()` + 具体文案，响应体 code=403，保留可定位消息。
  - `TenantAdminServiceTest.nonSuperTenantCannotManageTenants` 同时断言异常码 403 与“超级管理员”文案。
- `vite.config.ts` 与根工作区既有在途文件未提交、未触碰。

## 真实链（PG 18.4，租户100）

1. 以 `t100admin@i5-tenant-100` 登录，打开 `/system/tenant`；页面实际显示“仅系统超级管理员可以维护租户”，无“请求参数有误”。
2. 浏览器网络记录中不再出现 `/system/tenant/page` 请求，证明不是“请求后把错误文案改掉”，而是非超管根本不发起该越权请求。
3. 同一路由下超级管理员 `admin@tenant-0` 仍可加载租户列表（沿用既有超管链），未把权限门禁扩大到合法超管。
4. 服务端聚焦测试直接覆盖非超管调用 `service.page(...)` 的拒绝路径，异常 code=403、message 含“超级管理员”。

## 门禁

- Web 四连 exit=0：typecheck 0、eslint 0/0、vitest **214 文件通过/1 跳过，1868 通过/3 跳过**、build 4.48s（`/tmp/web-fourgate-28.log`）。
- Server 聚焦：`TenantAdminServiceTest` **9 通过/0 失败**，BUILD SUCCESS（`/tmp/server-tenant-test.log`）。
- 未声称整个后端回归全绿；本批只跑受影响模块。

## 未验证/边界

- 页面视觉仍为既有租户页布局，本批只改权限文案与请求门禁，不做像素验收；A03—A05 正式像素未通过。
- 宿主截图仍受 surface/rAF/OS 捕获限制，本批无 PNG；以上为真实浏览器文本/网络与 PG/聚焦测试证据。
- A06 其余表单项校验/权限项未因本批关闭；0.2.0 IN_PROGRESS，未核销 P、未晋级基线。
