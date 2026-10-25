# RICH_TEXT 富文本编辑、只读/历史兼容与服务端权威约束

2026-10-26｜Executor｜批次24，对应 F020/A09—A12 的富文本部分与 direction-ui-semantics-020「富文本」最小充分结果。

## 变更

- Server `a8fff47..63bd2e5`（codex/0.2.0-tenant-form-flow，已推送）：
  - 新增 `RichTextSanitizer`：新值前缀 `<!--sw-rt:1-->`；只允许 p/div/br/span/b/strong/i/em/u/ul/ol/li；span 只允许 `data-rt-font`（default/song/hei/yahei/arial/times）、`data-rt-size`（12/14/16/18/20/24/28）、`data-rt-color`（#RRGGBB）；脚本/样式/事件属性/链接/图片/iframe/外部内容移除；空格式值归一为空串；旧无前缀值原样保留。
  - `FormFieldValidator`：所有提交/更新（含导入经 `submitForm`）先按同一规则清洗并写回；必填/长度/正则按用户可见文本（br/块级边界计换行，末尾不补）计数；子表 RICH_TEXT 同口径。
  - `FormDataWritebackFacadeImpl`：脚本/受控集成回写 RICH_TEXT 也经同一清洗。
  - `sw-biz-form-biz/pom.xml` 增加 jsoup（版本由 sw-dependencies 管理）。
- Web `c5a07f4..050e517`（codex/0.2.0-ui-tenant-form-flow，已推送）：
  - 新增 `rich-text.ts`：前缀识别、受控标签/令牌清洗、可见文本、只读渲染、旧纯文本转义；`SafeHtml` 增加 `richText` 专用清洗分支，保持全仓仅 SafeHtml 使用 v-html。
  - `RichTextControl`：contenteditable + 字体/字号/颜色工具栏 + 加粗/斜体/下划线；粘贴 HTML 先清洗；execCommand 产物归一为 data-rt-* 令牌；只读渲染带令牌内联样式；旧纯文本按文字展示，失焦不主动升级格式。
  - `FormRender`：RICH_TEXT 必填/长度/正则改用可见文本；`DynamicField` 注册控件与测试同步；语言键补 `fieldTypeRichText=富文本` 与工具栏文案。
- `vite.config.ts` 在途改动未提交未触碰。

## 设计输入（实际打开）

- `images/core/495-18648__富文本 · 字体.png`：默认字体/宋体/黑体/微软雅黑/Arial/Times New Roman（6 项，已按同集合实现）。
- `images/core/495-18663__富文本 · 字号.png`：12/14/16/18/20/24/28 px（7 项，已按同集合实现）。
- `images/core/495-18680__富文本 · 颜色.png`：8 个预设色 + HEX 输入（实现 8 预设 + 合法 #RRGGBB；色相条以原生取色/HEX 承载）。
- `images/components/families/379-7965__CH _ 表单控件 · 填写与只读.png`：工具栏含字体/字号/B/I/U/S/颜色/对齐/缩进/列表/链接/图片/表格。本批实现字体、字号、颜色、B/I/U；S/对齐/列表未纳入，链接/图片/表格按方向「不扩展图片上传、远程嵌入或另一套文档系统」不实现（见未验证边界）。

## 真实链（PG 18.4，t100admin@租户100）

新建并发布真实表单 `form_mvo5n2wg`「F020 富文本复验」（设计器新建、拖入 RICH_TEXT 字段、标题富文本正文、必填、发布成功 v1；物理表 `sw_form_eqy8s3lmd4`），后续记录均来自该发布表单：

1. **格式保存/回读**：新增页输入“你好世界”，全选后经真实工具栏依次应用宋体、18px、#6F2DFF；编辑器 HTML 为三层 `data-rt-font/size/color` span；提交成功后数据库存 `<!--sw-rt:1--><span data-rt-font="song"><span data-rt-size="18"><span data-rt-color="#6F2DFF">你好世界</span></span></span>`。只读 URL（recordId `d185a5b9-b427-4fbf-a40b-4a1303f0bd17`, mode=view）无编辑器/工具栏，渲染为 `font-family: SimSun, 宋体, serif; font-size: 18px; color: rgb(111,45,255)`，文本“你好世界”。
2. **服务端权威（直写危险值）**：在表单实例上直接写 `formData.field_1` 为含 `onclick/script/onerror/style/href=javascript:` 的带前缀值并提交；服务器存储为 `<!--sw-rt:1--><p>安全<span data-rt-size="18" data-rt-font="song" data-rt-color="#6F2DFF">文字</span>链接</p>`（recordId `9586cabf-e6bb-4df7-b68d-19531b13dea9`），脚本/事件/样式/链接全部消失，合法令牌保留。只读渲染 dangerous DOM 数=0，仅允许 span 内联样式。
3. **旧纯文本兼容**：直接写入 `<b>旧文本</b>`（无前缀）提交，数据库原样保存 `<b>旧文本</b>`（recordId `76e6f03d-017a-445c-9299-fd850665df59`）；只读渲染 `readonlyRich=false`、`bold` 元素数=0，页面显示字面 `<b>旧文本</b>`，未按 HTML 执行。
4. **危险粘贴**：向编辑器派发含 `onclick/script/onerror/style/href` 的 HTML 粘贴事件；编辑器与 formData 均为 `<p>粘贴<span data-rt-font="hei" data-rt-size="20" data-rt-color="#DC2626">危险</span>链接</p>`，危险正则=不命中，合法令牌保留。
5. **必填/长度按可见文本**：Web 3 条 FormRender 用例通过（仅格式无正文必填失败；长标签+2 可见字不超长；4 可见字超 3 拒绝）；Server 校验器用例通过（格式标记不计长度、提交时写回清洗值、超长拒绝）。
6. **只读/历史入口**：表单详情 `mode=view` 使用同一 DynamicField/RichTextControl 只读分支，无 contenteditable、无工具栏；TaskDetail 复用同一 DynamicField readonly 路径（本表单无流程，未产生任务历史）。

## 门禁

- Web 全量四连 exit=0：typecheck 0、eslint 0/0、vitest **212 文件通过/1 跳过，1860 通过/3 跳过**、build 3.61s（`/tmp/web-fourgate-24.log`）。
- Server 全量 form 包测试：**249 通过/0 失败/0 错误/0 跳过，BUILD SUCCESS**（`/tmp/server-form-tests.log`）；聚焦 sanitizer+validator 10 项全过（`/tmp/server-richtext-test.log`）。
- 后端以 `-Pdev` 重新打包 `bootstrap-dev.jar` 并以 PG 18.4 启动，运行实例含本次服务端代码；未声称整个后端全绿。

## 未验证边界（如实）

- 修复后截图仍受宿主限制：IAB `tab.screenshot()` surface preparation 超时、rAF 600ms 不触发、OS `CopyFromScreen` 句柄无效；本批无修复后 PNG，视觉结论仅基于真实浏览器 DOM/computed style。A03—A05 正式像素未通过。
- 设计工具栏的删除线/对齐/缩进/有序无序列表/链接/图片/表格未全部实现：本批按最小充分结果交付字体/字号/颜色/加粗/斜体/下划线；链接/图片/表格明确不纳入本版，S/对齐/列表为剩余视觉/功能差异，待规划决定是否补。
- 自定义颜色接受合法 #RRGGBB（8 预设之外），服务端按格式白名单校验；不是“仅 8 色”硬限制，设计原稿本身含 HEX/取色器。
- 导入/导出未用真实 Excel 富文本样本单独跑；导入经 `FormSubmitService.submitForm` 同一校验，代码路径已覆盖，脚本回写清洗有实现与单元测试但未做真实脚本调用。
- 新表单 `form_mvo5n2wg` 与 3 条记录保留在 dev PG 供复核，未删除；不构成生产数据。
- F020/A09—A12 的富文本部分待 Planner 独立复核；0.2.0 IN_PROGRESS，未核销 P、未晋级基线。
