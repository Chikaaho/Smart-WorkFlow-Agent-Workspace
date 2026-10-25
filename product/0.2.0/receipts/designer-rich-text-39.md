# 表单设计器/预览复用真实富文本控件

2026-10-26｜Executor｜批次39，对应 42:2 与 272:1883 的富文本画布/预览缺口；不扩工具栏命令、不改服务端白名单。

## 变更

- Web `8cfd444..683e116`（`codex/0.2.0-ui-tenant-form-flow`，已推送）：
  - `adapters/form-designer/setup.ts` 在 form-create 子 app 注册 `RichTextControl`，并安装同一 `i18n` 实例（自定义控件经 `useI18n()` 取文案，子 app 未装会渲染为空）。
  - `adapters/form-designer/index.ts` 将 RICH_TEXT（主表与子表）从降级 textarea 改为 `RichTextControl`，传字段定义与初始值；表单填写页仍走动态控件注册表，两处同源。
  - 适配器单测更新为断言 `RichTextControl` 规则与字段 prop；原有 8 类型全量断言同步。

## 真实链（1920×1080，t100admin@租户100）

1. 打开 `form_mvo5n2wg`（F020 富文本复验）设计器 → 表单设计画布；`.field-shell` 内 `.fc-host` 不再为空，实际渲染 `data-test="rich-text-editor"`。
2. 工具栏真实含字体/字号/颜色下拉与 A/B/I/U 按钮；画布设计态仍 `pointer-events:none`，不会误输入。
3. 点击“预览”打开弹窗，弹窗内富文本再次渲染工具栏（字体/字号/颜色/B/I/U），与画布同源。
4. 未改服务端清洗/白名单；保存/发布仍按既有 RICH_TEXT 契约。

## 覆盖矩阵回填

- 42:2 表单设计器：富文本画布/预览已复用真实控件；TABLE 占位与表单描述仍待补
- 272:1883 表单预览：富文本已真实渲染；表单描述/TABLE 真表格仍待补

## 门禁

- Web 四连 exit=0：typecheck 0、eslint 0/0、vitest **215 文件通过/1 跳过，1872 通过/3 跳过**、build 4.56s（`/tmp/web-fourgate-40.log`）；`adapters/form-designer/index.spec.ts` 45/0。
- 服务端零改动。

## 未验证/边界

- 只验证工具栏/控件可见；未在预览内真实输入并提交，form-create 自定义组件 v-model 的填写回传未单独断言。
- 设计稿的删除线/对齐/列表/链接/图片/表格等命令仍超出受控白名单，未扩。
- TABLE 仍是占位块、表单描述未在画布/预览渲染；这两项未因本批关闭。
- 无修复后截图（宿主 surface/rAF/OS 捕获限制），同态像素未通过。
- 0.2.0 IN_PROGRESS，未核销 P、未晋级基线；等待 Planner 独立复核。
