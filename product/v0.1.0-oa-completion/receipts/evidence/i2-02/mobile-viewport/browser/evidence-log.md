# 移动视口（375×812）真实浏览器全链取证日志

> 会话：I2 验收修复（回执 02 补证）；日期：2026-09-09/10（UTC+8）
> 视口：`tab.setViewportSize({width:375, height:812})`（IAB 真实视口控制，非桌面截图缩放）
> 浏览器：ZCode In-app Browser（Chromium 146 / Electron 41）；UA 见 `layout-facts`
> 前端：`pnpm dev`（Vite，localhost:5173，/api 代理 → localhost:8080）
> 后端：dev profile（H2 内存 + Redis；`ch.dev.test-mock=true` → 验证码固定 1234）
> 登录：admin/admin123（真实 UI 登录链，含 challenge/RSA/验证码）

## 对象（api-setup2/object-map.txt）

- DATASOURCE_ID = `2097718868794077186`（**字符串处理**；外部真实库 = H2 文件 `/tmp/sw-i2-ext-mobile`，3 行部门数据）
- FORM_ID = `2f67da30-96a7-4850-a6b6-86760060c275`；FORM_KEY = `i2_live_20260909b`（PUBLISHED，15 字段）
- TARGET_FORM = `i2-live-target`（PUBLISHED）；TARGET_RECORD_ID = `df9dc8dc-9723-4947-8440-9845de3975ed`
- DRAFT_ID = `2097719588343705602`
- RECORD_ID（正式提交）= `ee8d1cd7-2cc0-4aaa-9f66-8031e3a389fb`

## 时间线与证据文件

| # | 动作 | 结果 | 证据 |
|---|---|---|---|
| 1 | 375×812 打开登录页 | 单列布局；验证码图显示 1234（dev 固定验证码） | `01-login-page-375x812.png` |
| 2 | 首次路由检查（修复前） | **发现缺口**：/m/form 挂在桌面 BasicLayout 下，侧边栏挤压内容区至 139px，页面横向滚动（scrollWidth 521 > 375） | `02-mobile-form-route-375x812.png`、`03-mobile-form-settled-375x812.png` |
| 3 | 修复：路由提为顶层独立路由（`src/router/index.ts`） | 重排生效：无横向滚动（scrollWidth=375）、单列满宽（359px）、15 字段全部可达 | `04-mobile-form-after-fix-top.png` |
| 4 | UI 登录（admin + 1234）→ workspace → 移动路由 | 登录成功，直达移动填报页 | 同上 |
| 5 | 全字段填写（TEXT/NUMBER/TIME/USER/DEPT/DATASOURCE/REFERENCE/TABLE 增删行/RICH_TEXT/DICT radio） | 外部部门下拉展示真实外部库 3 行（dept-a 研发一部等）；引用弹窗展示目标记录 | `05-mobile-form-filled-viewport.png`、`05-mobile-form-filled-fullpage.png` |
| 6 | 保存草稿 | 提示「草稿已创建」；`POST /api/workflow/drafts` 200；draftId=2097719588343705602 | `api-setup2/16-draft-created.json` |
| 7 | 关页重开（`?mode=draft&draftId=…`）恢复草稿 | 全部字段反填成功；**发现缺口**：引用记录显示原始 UUID 而非「目标记录甲」 | `06-mobile-draft-restored.png`、`06b-mobile-draft-restored-refdisplay.png` |
| 8 | 修复 1：`FormRender.vue loadDraftPayload` 对 REFERENCE 补 `resolveReferenceDisplay` | 恢复后显示「目标记录甲」 | `07-mobile-draft-restored-fixed.png` |
| 9 | 负向：键盘清空必填标题 → 提交草稿 | 前端拦截：顶部横幅「请完善必填项后再提交」+ 标题字段内联「此字段为必填项」 | `08-mobile-submit-blocked-required.png`、`08b-mobile-required-inline-error.png` |
| 10 | 恢复标题 → 提交草稿 | 服务端正确拒绝：「表单尚未关联唯一已发布流程，暂不能发起审批」（表单未绑定流程时禁止发起，符合 I2/I3 边界） | `09-mobile-draft-submit-flow-unbound-rejected.png` |
| 11 | 直接模式填写 → 提交 | 提示「提交成功，记录 ID：ee8d1cd7-2cc0-4aaa-9f66-8031e3a389fb」 | 快照 alert；`api-setup2/17-submit-detail-readback.json` |
| 12 | 服务端持久化回读（API） | quantity=3.0、unit_price=10.125、**total=30.38（服务端公式重算，客户端值剥离）**、external_dept=`{"value":"dept-a","display":"研发一部","queryKey":"i2_dept_source_exact","version":1}`（冻结摘要）、`ref_reference_record_id=df9dc8dc-…`（存 id）、lines 子表 1 行（parent_record_id 正确）、category=0、note/visit_time 一致 | `api-setup2/17-submit-detail-readback.json` |
| 13 | 只读回看（`?recordId=…&mode=view`） | （查看）模式贯穿只读；合计=30.38；引用=目标记录甲；无横向滚动 | `10-mobile-readonly-view.png`、`11-mobile-readonly-fullpage.png`（fullPage 截图存在上下拼接伪影，以视口截图为准） |

## 本轮新增/修改代码（浏览器取证驱动）

1. `Smart-WorkFlow-Web/src/router/index.ts`：`/m/form/:formKey` 从桌面 BasicLayout 子路由提为顶层独立路由（375px 单列满宽，修复桌面空壳挤压）。
2. `Smart-WorkFlow-Web/src/modules/form/components/ReferenceSelector.vue`：`watch(visible)` 加 `immediate: true`（修复 v-if 挂载时弹窗永不自动加载定义/数据）。
3. `Smart-WorkFlow-Web/src/modules/form/views/FormRender.vue`：`loadDraftPayload` 对 REFERENCE 补显示名解析（修复草稿恢复显示原始 id）。
4. `Smart-WorkFlow-Server/.../FormDataQueryService.java`：系统主键 `id` 仅放行 EQ 过滤（修复引用显示名解析被 1501 拒绝）；记录数据范围仍强制并入 WHERE。
5. `Smart-WorkFlow-Server/.../FormDataQueryServiceTest.java`：新增 id EQ 正/反用例。

## 布局事实（375×812，只读与填报一致）

- `innerWidth=375`；填报页与只读页 `hasHorizontalScroll=false`、`scrollWidth=375`
- 表单容器单列满宽（359px = 375 − 2×8 padding）
- UA：`Mozilla/5.0 … ZCode/3.11.2 Chrome/146.0.7680.80 Electron/41.0.3 Safari/537.36`

## 已知限制（如实）

1. 附件/图片的二进制上传交互未在本视口会话驱动（IAB 无 file chooser 能力）；字段控件渲染可达（上传按钮可见），服务端附件权限链沿用 v0.0.2 A5 锁定与 runtime-final-3 API 证据。
2. 「标签」MULTISELECT 无可选项（本轮表单定义未配置 options）；「分类」DICT radio 已用 `sys_common_status`（正常/停用）完成选择与回显。
3. 只读模式下 DATASOURCE 字段显示冻结摘要 JSON 原文（`{"value":"dept-a","display":"研发一部",…}`）——符合「历史回看不重新请求外部源」，但展示形式可读性欠佳，登记为展示层改进项，不构成冻结语义违反。
4. fullPage 截图（05/11）存在 IAB 拼接伪影（同一页面重复出现）；以对应视口截图（05-viewport/10）为准。
