# U020 共用脚本工作区实施记录

2026-10-22｜Executor｜0.2.0｜实施中

总 7 阶段：已完成 1「需求评估」；进行中 1「分支实施」；未开始 5「验收同步、合并、发布、发布后同步、结束」。U020、J020 及整版验收尚未完成。

## 实施与兼容

Web `1a9278963574ac5ba6562133f7fbc6b3810f9bd8` 已普通推送至 `origin/codex/0.2.0-ui-tenant-form-flow`，远端回读一致、工作树 clean。改动 11 文件，700 insertions / 108 deletions。

- 复用 ScriptDialog、JsCodeEditor 和 DetailDialog，承接 Figma `352:8881` 的四区工作台：函数目录与搜索、代码、函数说明、独立预览结果。流程与表单保留各自目录及执行适配器。
- 函数按名称、分类、说明和示例检索；点击在当前光标或选区插入示例，问号选择说明。清空先确认；取消保留已应用配置，应用只回传草稿，仍沿定义保存/发布链生效。
- 预览结果明确标为预览；成功、失败、尚未运行与运行中分别显示。打开即初始化，重开清除旧结果；编辑、关闭、卸载会取消当前预览并忽略迟到响应。重复点击运行只发起一次；服务端预览最长 15 秒，并将 AbortSignal 传至工作流 API 的统一请求层，原 HTTP 超时继续有效。本项是编辑预览预算，不替代 DR05 的表单事件运行预算。
- 表单本地预览继续使用原有有界解释器与样例宿主，流程预览继续使用服务端。受限模式补全只推荐实际支持的语法与基础函数，修复中文目录函数补全重复 `##`。未扩展真实表单事件与函数能力，不能据此判 A11/A12 通过。
- 编辑器新增工作区外观与行号，修复 code 子元素默认等宽字体导致高亮层与输入层度量不同的问题，横向滚动不侵入行号。语义色使用共享 token。
- 新文案同步中英文和手工单源；操作手册补充搜索、插入、清空、应用、取消、预览范围及错误处理。

## 用户可见浏览器

原始证据目录 `C:/Users/hjxch/.codex/evidence-020/script-workspace/`。可见 IAB、headless=false、Mock 超管租户 0，层级 ISOLATED_REGRESSION；不作为正式授权、数据库持久化或流程运行通过依据。

- 流程对象：`http://127.0.0.1:5173/workflow/defs/1/design`，单节点审批流程的「部门经理审批」节点，节点开始前脚本。搜索「上级部门」，在 `return ` 后插入 `#获取上级部门(1001)`；清空确认取消后仍可编辑。调用流程预览时本地后端未启动，实际显示失败「系统暂时无法处理该请求，请稍后重试」，没有伪造成功。截图 `process-preview-error-native-1920.png`，错误记录 `browser-errors.json`。
- 表单对象：`http://127.0.0.1:5173/form/designer`，本轮未保存表单的单行文本字段。本地 `return true;` 预览返回 true；应用后重开回显，旧预览清除；改成 `return window.location;` 时显示不支持字符错误，取消后重开仍是已应用的 `return true;`。截图 `form-preview-success-fixed-native-1920.png`、`form-preview-error-native-1920.png`，回显状态 `browser-final-state.txt`。未将这个临时表单保存/发布到后端。
- 1920×1080：弹窗 (220,140,1480,800)，正文 (245,213,1430,650)，目录 280×650；右侧代码 (541,213,1134,420)，说明 (541,645,1134,98)，结果 (541,755,1134,108)，与设计结构几何一致。原图 `process-script-native-1920.png`；字体修正前图 `form-preview-success-native-1920.png` 保留。
- 1366×768：弹窗 (16,16,1334,736)，底栏 y=691、bottom=727，document.scrollWidth=1366。编辑、结果和操作位于视口内；图 `process-script-native-1366.png`。
- Vite 首次懒加载多个页面时发生依赖优化和重载，日志保留于 `visual.log`；优化完成后进入真实组件入口继续验证，没有把过渡页当作完成。

## 像素诊断与限制

get_design_context 的截图被默认缩小为 1024×554，首次比较分辨率不符，该输出以 `invalid-resolution-*` 保留并废弃。随后 get_screenshot 指定 maxDimension=1480，取得未经缩放的 1480×800 参考 `reference-script-dialog-native.png`。运行图来自原生 CDP PNG，未锐化、模糊、缩放或加遮罩。

`dialog-pixel-results.json`：任一 RGB 通道差 >8 为不同；窗口 98.3637%，代码区 99.8637%，说明区 96.3071%，结果区 98.8765%。参考为流程目录、标题「脚本」，运行图为表单字段目录、标题「编辑字段脚本」，说明文字和「预览结果」也不同；这些数值仅用于定位公共代码区和组件差异，不能作为整窗同态 A03 通过结论。diff 与 runtime-dialog-crop.png 均留存。本版 A03 仍未通过。

## 工程门禁与生命周期

最终源码四连日志 `typecheck.log`、`lint.log`、`test.log`、`build.log`、`checks-result.txt`：NODE_OPTIONS=--max-old-space-size=2048，顺序执行、每步 300 秒上限、取消只清理自身进程树。

- typecheck exit 0；lint exit 0，2 条既有 StandardListTemplate 默认值 warning。
- test：189 文件通过 / 1 跳过，1686 passed / 3 skipped，158.70 秒，exit 0。新增 9 个用例覆盖初开、搜索、选区插入、取消与回显、清空确认、成功/错误、迟到响应、并发点击、取消与预览超时、补全。
- build exit 0，3.27 秒；VueUse 两条 INVALID_ANNOTATION 与插件耗时提示保留。
- 初轮类型检查的 MessageBoxData 测试桩类型、lint 浏览器全局声明已修复；字体修正前四连通过日志保留 `before-font-fix-*`。最终提交 Hook 的 lint-staged 通过，回读为相同实现，仅格式整理；git diff --check 通过。
- 可见验证服务 PID 32160、session 57122，900 秒上限；本轮主动 Ctrl+C 结束，工具 exit 1，随后 Win32_Process 按精确 PID 回读不存在。前端检查任务全部 exit 0，没有代理服务遗留。

继续实施 T020 稳定管理员关联、创建幂等、维护入口及明确目标租户，再补停用认领和真实库链；U020 其他页面、全局像素差异、F020/J020/W020 与整版联调仍保留。功能状态、计数、P 编号和正式基线未变。常规决定：保留两种原执行适配器，预览生命周期由共用窗口统一管理。
