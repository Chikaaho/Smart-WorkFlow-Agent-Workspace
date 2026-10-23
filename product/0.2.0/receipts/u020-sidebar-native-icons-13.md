# U020 侧栏原生图标与字体差异定位

2026-10-23｜Executor｜XL｜实施中

总7阶段：已完成1「需求评估」；进行中1「分支实施」；未开始5「验收同步、合并、发布、发布后同步、结束」。当前A03仍未通过。

## 本轮实现

从Figma核心页 `0:1`、画框 `4:2` 的业务导航实例 `321:5110` 只读导出Grid/Document/Clock/Check/Bell/Edit六个原生SVG。产品代码保存于Web `src/assets/navigation/`，来源节点在README登记；保留原始18×18 viewBox、路径及白色填充，未用截图代替UI。AppSidebar继续保留真实路由、状态与可访问名称。

读取源属性后确认图标18×18、左内距12、图标文字间距10；修正Element Plus底层缩进变量，避免13px行内值覆盖页面12px样式。可见正常登录W020审批人1、租户0，URL `http://127.0.0.1:5174/workspace/my-instances`，headless=false、1920×1080/DPR1/zoom1。六图均完成加载、原始宽18，实测x28、y118/168/218/268/318/368、18×18，与源对应；展开缩进12px。

折叠动画完成后实测侧栏/菜单根均64px、图标x23/宽18居中，六项名称仍可访问、可导航；恢复展开。1366×768侧栏224、文档1366，无全局横向溢出，正式视口恢复1920×1080。原图 `e2e/screens/u020-sidebar-native-1920-13.png`、`u020-sidebar-native-collapsed-1920-13-02.png`、`u020-sidebar-native-1366-13-02.png`；网络索引 `e2e/backend-13.log`。动画中的早期截图不替代这组稳定状态原图。

## 原始差异

参考 `e2e/screens/design-my-instances-10.png`，1920×1080原图不缩放、不模糊、不平移、无遮罩，RGB任一通道差大于8。`e2e/screens/sidebar-native-pixel-results-13.json` 与 `diff-sidebar-native-13.png`：侧栏3218/227584差异、一致率98.5860%；菜单内容3218/61056差异、一致率94.7294%；图标所在窄区域95.2322%；顶栏95.0618%。保持未通过，不用背景稀释内容区差异。

## 字体与边缘核实

字体文件检查原文 `e2e/font-metadata-13.json`：101个子集全部包含wght轴，范围100—900、默认100，字体版本2.004-H2；实际声明100—900与资源一致。浏览器对选中四字返回isCustomFont=true、familyName=Noto Sans SC Thin、postScriptName=Noto-Sans-SC-Thin-Medium、glyphCount4，配合CSS500字重；已加载自托管字体。工具依赖fonttools4.67.0/Brotli1.2.1仅安装在证据目录，安装原文 `e2e/font-inspect-setup-13.log`，不进入项目依赖或Git。

在选中项同一最小文字区域[56,216,112,238]，背景[39,52,92]、前景[255,255,255]，逐像素按通道反算覆盖率，仅用于诊断、不参与通过分数。设计图487个非背景像素，通道覆盖率极差大于0.08的为0，最大0.01267；运行图586个非背景像素，其中407个通道极差大于0.08，最大0.84049。原文 `e2e/screens/font-edge-alpha-diagnostic-13.json`。该结果支持进一步核查字体边缘分色渲染差异；不据此忽略全部文字、改字重或放宽阈值。按视觉标准的渲染差异条款保留原图、diff、字形区域与几何事实，待具体复核；其他独立UI与文案工作继续。

## 验证与清理

侧栏聚焦9/9通过（`e2e/web-sidebar-native-13.log`）；完整四连 `e2e/web-{typecheck,lint,test,build}-13.log` 全部exit0，200通过文件/1跳过文件，1770通过/3跳过测试，153.51秒。Web提交 `d7957fd` 已普通推送并回读远端一致，8文件；hooks完成eslint/prettier，工作树仅保留无关vite.config.ts。门禁52809、文档写入38595、提交93397及字体工具安装39169均已退出并回读，原始运行日志保留。SVG使用显式HTML解析器格式化，原生路径不变。自有Java27296、Vite10078已停止，后端父任务49066已退出并回读；既有PostgreSQL/Redis保持运行。Web本轮范围为AppSidebar、6个产品SVG与来源README；无关vite.config.ts保留。原始证据根目录 `C:/Users/hjxch/.codex/evidence-020/`，原图和日志不入Git。
