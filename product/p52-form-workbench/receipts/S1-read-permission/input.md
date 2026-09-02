# S1 功能级读取权限与拒绝页 · 输入与环境

- 环境：真实后端 `sw-bootstrap`（dev/H2，context-path `/api`）+ 真实前端 `pnpm dev`（http://localhost:5173，直连后端非 mock）。
- 代码基线：本轮修改后
  - 后端 `FormDefinitionController`：`GET /form/def/page`、`GET /form/def/{id}`、`GET /form/def/{id}/definition` 补齐 `@PreAuthorize("@ss.hasPermi('form:design')")`（`/{id}/snapshots`、`/{id}/snapshots/{formVersion}` 上一轮已有）。
  - 前端 `FormDesigner.vue`：拒绝态下工作台头部（身份输入/tabs/预览/保存/发布/历史）整体 `v-if="!rejected"` 不渲染；403 显示「无权访问该表单」。
  - 前端 `foundation/request/index.ts`：非 2xx 的 R 结构 / HTTP 403 统一归一为 `ApiError`。
- 主体与权限码（经 admin REST 真实创建）：
  - `admin`（superadmin 短路，tenant_id=0）
  - `s1limited` / `S1limited#2026`（角色 `S1无查看权限角色` 仅绑菜单 23 `workflow:def:view`，**无** `form:design`；USER_ID=2094981847234142209、ROLE_ID=2094981846621773826）
- 对象（tenant 0，admin 创建并发布）：
  - FORM_ID=`b2b2cbdc-68bb-43aa-9832-06649180410c`，FORM_KEY=`p52_s1_form_1788317569554`，STATUS=PUBLISHED，V=2，快照 1 条
- 跨租户反例对象（经 H2 console SQL 克隆，TENANT_ID=1）：
  - FORM_ID=`aaaa0000-0000-0000-0000-000000000001`，FORM_KEY=`p52_s1_form_1788317569554_t1clone`
- 预期：
  - s1limited 四类直接读取（身份/definition/snapshots/列表）全部 403，响应体零泄露；
  - s1limited 浏览器深链显示「无权访问该表单」拒绝页，工作台主体/画布/保存/发布/历史/关联流程操作区零渲染；
  - admin 同对象读取全部成功；
  - 跨租户直接读取返回不存在且零泄露。
