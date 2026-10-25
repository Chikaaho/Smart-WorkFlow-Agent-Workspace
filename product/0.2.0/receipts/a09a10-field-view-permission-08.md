# 0.2.0 统一执行·批次 07（A09 续段：字段查看权渲染层缺口实锤＋修复＋实证；A10 真实提交链）

2026-10-25｜Executor｜tier=FORMAL_FLOW（真实后端 dev 环境复建，浏览器可见会话）

## 环境复建（按 a09-real-joint-07.md 记录口径）

- 后端 `bootstrap-dev.jar --spring.profiles.active=dev`（H2）@18080，四外部密钥（SW_CIPHER_KEY / SW_LOGIN_RSA_PRIVATE_KEY(PEM) / SW_LOGIN_DIGEST_SECRET / JWT_SECRET）注入，日志 /tmp/sw-backend-dev.log；前端 `pnpm dev --port 5175` 代理 18080。devseed：t100admin（userId 9001，租户100管理员）、t100nobody（userId 9101，无角色），固定验证码 1234。
- 批次结束两服务按 PID/端口净停（见 §服务收尾）。

## 缺口实锤（负向测试暴露，修复前）

- 表单 `form_mvnlsifw`（id `cb863c49-6fff-414a-8a7c-91f3da939e38`）字段「2」（单行文本）配置可查看主体 `user:9001`。t100nobody（9101，无角色）打开填写页，该字段**仍然渲染**——「权限在 UI 一致」不成立。
- 诊断：服务端 `GET /api/form/def/by-key/{formKey}/definition` 原样下发定义串（仅做 isCurrentUserVisible 可见性判定，无按用户字段裁剪）；前端 `FormRender.vue` 从未消费 `fieldPermissions[].view`。

## 现场修复（Web `src/modules/form/views/FormRender.vue`）

- 新增 `viewDeniedFields` computed：按登录态归集主体（`user:<id>` / `role:<code>` / `dept:<deptId>`），`fieldPermissions` 中 view 主体非空且无交集的字段判为无查看权；view 空/缺省＝不设限。
- 新增 `visibleSchemaFields`：渲染列表同时过滤隐藏字段与无查看权字段；LABEL 说明文字不在此列照常渲染。数据查询与提交校验仍以服务端为权威（本过滤只影响界面呈现）。

## 验证

- **单测**：`FormRender.spec.ts` 新增 3 例（无匹配主体隐藏其余照常 / 命中 user: 主体渲染 / 命中 role:、dept: 与空 view 均渲染），该文件 29/29 通过。
- **真实浏览器双向实证**（form_mvnlsifw 填写页）：
  - t100nobody（9101，无角色）：「2」不渲染，仅多行文本＋明细表（物品名称）。截图 `a09-field-view-nobody-hidden-1920.png`。
  - t100admin（9001）：「2」照常渲染。截图 `a09-field-view-admin-visible-1920.png`。
  - 证据目录 `C:/Users/hjxch/.codex/evidence-020/real-joint/`；登录身份经页面右上角用户菜单与 DOM 快照确认。
- **A10 真实链（后端日志 /tmp/sw-backend-dev.log）**：17:10:50–17:17:17 四次配置保存（含字段权限配置）；17:17:18 真实发布 `form_mvnlsifw`：物理主表 `sw_form_zu5ouezo54`＋子表 `sw_form_table_m3lkbvtghk`（TABLE 字段 field_3）version=2；17:19:22 真实提交成功 `recordId=f040d72e-5c4e-4217-9e0d-d24c55c2d075`（submitter=9001）。校验正则（DR04）违规输入在填写页被内联校验拦截（客户端阻断，无服务端请求记录），修正后提交成功。
- **服务端测试日志澄清**：上轮遗留 exit=1 日志（122 例 2 失败 1 错误）经重跑定位为修复完成前的陈旧产物；当前 `sw-basic-notify-biz` 模块（-am）**BUILD SUCCESS exit=0**，服务端已推送 HEAD `fa51395` 干净。

## 边界与剩余

- 服务端查询/提交侧的按用户字段裁剪（FieldPermissionService 查询路径）未验证；本次修复只保证渲染层一致，服务端仍是权威防线（口径已写入代码注释）。
- 受控数据源真实配置仍未做（dev 无已登记数据源，`workflow/external-datasource/page` 报 no resource）。
- A11—A16 真实链、A03 像素对照整批、富文本与定义级通知配置（Planner 裁决中）未动。

## 服务收尾

- 已按监听进程树终止：后端 PID 2828、前端 PID 12120（taskkill /T /F）；回读 18080/5175 netstat 无监听、HTTP 000 不可达，残留 0。

## 提交

- Web `codex/0.2.0-ui-tenant-form-flow` `e18b31e..b450ef8` 已推送（2 文件 +123/−2：FormRender.vue 过滤实现、FormRender.spec.ts 3 例）。完整四连：typecheck 0、lint 0、**1851 通过/3 跳过**（净增 3）、build 4.11s exit=0。

总 7 阶段：已完成 1 需求评估；进行中 1 分支实施；未开始 5 验收同步、合并、0.2.0 发布、发布后同步、结束。
