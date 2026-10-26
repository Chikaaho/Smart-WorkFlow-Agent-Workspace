# 44—47 页面结构与基础控件补齐

2026-10-26｜Executor｜局部实现结果，整版仍 IN_PROGRESS

## 范围与提交

消费 `planning-receipt-read-unified-020-22-43.md`、`../ready/direction-ui-completion-020.md`，按已扣除局部继续。本批四包：

| 包 | 内容 | Web 提交 | Server 提交 |
| --- | --- | --- | --- |
| 44 富文本基础排版 | 删除线/对齐/缩进/有序无序列表 + 服务端白名单 + 导出可见文本 + 预览 v-model 回传 | `70fcf77` | `0020160` |
| 45 TABLE 真表格 | 画布/预览真实表头与行、设计态示例空行、预览增删行与单元格值回传 | `ecd82c7` | — |
| 46 快照右属性外壳 | 表单设计右侧冻结字段属性面板 + 点选切换 + 只读不写入断言 | `0fffb00` | — |
| 47 工作台配置弹窗 | 首页齿轮改开居中「配置工作台」弹窗；旧全屏路由 `/workspace/edit` 保持可达 | `6c218ef` | — |

## 44 富文本基础排版

- 受控编码契约扩展：标签集合加入 `s`；`p/div` 允许 `data-rt-align`(left|center|right) 与 `data-rt-indent`(0|1|2)；默认值 left/0 不落库；`del/strike` 统一归一为 `s`（粘贴容错）。
- 服务端 `RichTextSanitizer` 同白名单复核，输出改为紧凑 HTML（`prettyPrint(false)`），并新增 5 条测试（删除线、历史 del/strike、对齐缩进保留与非法丢弃、列表与可见文本）。服务端 11/0。
- 工具栏补齐（不用 execCommand 行内样式）：删除线、左/中/右对齐、增减缩进、无序/有序列表；对齐/缩进直接写块级受控令牌，避免后端剥离。编辑器只读渲染把令牌转固定内联样式。
- 导出：`FormImportExportService` 的 RICH_TEXT 分支改导出可见文本，不把版本前缀/受控标签写进 xlsx。
- 预览回传：`FormPreview` 增加组件级 `modelValue`/`update:modelValue`（form-create v-model），新增真实挂载测试：RICH_TEXT 编辑 → 回传值含前缀与删除线；TABLE 增行/单元格编辑 → 回传数组；设计态示例空行且无增删按钮。
- 测试：`script-hosts` 无关；`rich-text.spec` 12/0、`RichTextControl.spec` 2/0、`FormPreview.spec` 3/0、`DynamicField.spec` 40/0。

## 45 TABLE 真表格

- 适配层 TABLE 由 `group` 改为共享 `TableControl`（`field/subFields` 直传，`value` 取默认值数组）；`setupFcApp` 注册 `TableControl`；删除废弃的子字段规则映射。
- 设计态：`TableControl` 新增 `design` 属性；空数据渲染 2 行示例空行、隐藏行操作与「添加行」；指针交互由 `fc-host--design` 统一禁用（只读不写入）。
- 画布：TABLE 外壳保留标签/子字段数/「编辑子表」入口，其下渲染真实设计表格，不再用占位块替代。
- 测试：`index.spec` 39/0、`DesignerCanvas.spec` 16/0、`FormPreview.spec` 3/0。

## 46 快照右属性外壳

- 表单设计区改为「设计网格 + 右侧冻结字段属性」双栏：属性含名称/标签/类型/必填/长度/默认值/字典/子字段数/行标识；点选网格字段切换，只读、无保存入口。
- 只读不写入：设计态容器 `fc-host--design` + 无增删按钮断言；FORM_SHAPE 数据不被控件写回。
- `PublishedSnapshotViewer.vue` 顺带按 prettier 修正（原四连日志的 1 条格式警告消除）。
- 测试：`PublishedSnapshotViewer.spec` 16/0。

## 47 工作台配置弹窗

- 新增 `WorkspaceConfigDialog`：el-dialog（960px 居中）标题「配置工作台」，内嵌 `WorkspaceBoard editable embedded`，页脚恢复默认/取消/确定；确定仅在 `dirty` 归零（保存成功）后关闭，取消经 `destroy-on-close` 丢弃未保存修改。
- `WorkspaceBoard` 增加 `embedded`（隐藏自身工具栏动作）与 `configViaDialog`（首页齿轮发 `configure` 事件）；`WorkspaceHome` 打开弹窗；`/workspace/edit` 与 `WorkspaceEditor` 原样可用。
- 测试：`WorkspaceConfigDialog.spec` 3/0、`WorkspaceHome.spec` 6/0（含齿轮开弹窗断言）、`WorkspaceEditor.spec` 6/0。

## 未在此批声称

- 未取得新截图：本批所有视觉结论仅为组件结构/DOM 断言，正式像素与 A03—A05 门槛不变。
- TABLE 子表内嵌预览的视觉密度、快照右属性面板宽度与原稿一致性未做像素对比。
- 富文本导出仅验证服务端分支委派到已测可见文本函数；未运行真实导出文件。
- 工作台弹窗未做 273:1600 的逐像素比对。
