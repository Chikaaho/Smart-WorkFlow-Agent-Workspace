# P53 节点保真度矩阵（最终对标 · 2026-09-17）

参考源：Figma file `mbEKPcZv9pcchmElQanR5E` page `0:1`（MCP AVAILABLE，节点身份见 ../reference/figma-node-map.json；33 张 MCP 参考截图见 ../reference/figma-captures/）；锁定导出图 `docs/ui/png`/`svg`（64/64 SHA-256 与 G1 一致，本轮重算）作主像素参考。
最终运行证据：1440×1024、zh-CN、admin/系统管理员/T0、真实后端、headless=false 有头会话（runtime/current-screenshots/ + facts/ + facts-supplement/）。
成对证据：reference-runtime-pairs/（NN-reference.png = 锁定设计 PNG；NN-runtime.png = 最终运行图）。

## 结论

* 颜色四向勾稽（color-fidelity.json）：24 项检查 22 项 PASS、2 项 PASS-WITH-AUTHORIZED-OMISSION（无真实数据源的演示区块按方向省略），0 FAIL。设计色→令牌→computed style→截图采样对固定纯色精确一致（页面底色 #F4F6FB、边框 #CCD5E5、表头 #FAFBFE/#697386、品牌 #6F2DFF 等）。
* 关键几何（geometry-facts.json）：顶栏高度 64px（Δ≤1px）、侧栏 224px 精确一致、页面底色逐像素一致；方向 §4.7 关键容器>2px 阻断项为 0。
* 无障碍：AA 达标样本 9 项（4.62—15.05:1）；设计语义 chip 文本不达 AA 的 4 项按方向 §4.1 最小必要调整（仅 tag 文本暗化，底色保持设计值），逐项登记于 color-fidelity.json accessibility_exceptions。
* 像素差异率（comparison-results.json）：跨渲染器（Figma 导出 vs Chromium 截图）原始像素差异受字体光栅化与真实数据差异主导，顶栏/侧栏区域 12%—100% 不等；该指标不能作为跨渲染还原结论，区域级结论以四向颜色勾稽、几何勾稽与成对图人工复核为准。方向 §4.7 的 0.5%/2% 阈值由同渲染器 Playwright 视觉回归（visual-verify 全量 failed=0）承担回归稳定性证明。
* 行为锁定项（菜单/审批人/意见弹窗/焦点回返）未触及行为代码，仅重采视觉；本轮新增/修改全部为样式、布局与展示层格式化，无契约变化。

| # | 节点 | 成对证据 | 颜色 | 几何/结构 | 结论 |
|---:|---|---|---|---|---|
| 01 | 工作台 | 01-reference/runtime.png | PASS | 顶栏/侧栏/底色精确一致；统计卡图标+数值、卡片标题层级、快速入口按真实能力呈现 | PASS（数据与能力差异按方向） |
| 02 | 数据列表 | 02-reference/runtime.png | PASS | 页标题块+描述、筛选字段标签、表格卡外壳、行高 50、操作胶囊、tooltip | PASS |
| 03 | 数据详情 | 03-reference/runtime.png | PASS | 卡片圆角 10、阴影令牌、状态 chip 语义 | PASS |
| 04 | 管理后台 | 04-reference/runtime.png | PASS | 同全局；侧栏子项激活 #29235C | PASS |
| 05 | 企业门户 | 05-reference/runtime.png | PASS | 无侧栏全宽形态、hero 渐变、统计块 #202F63/#6F2DFF | PASS（第三块无真实数据源省略） |
| 06 | 登录页 | 06-reference/runtime.png | PASS | hero 渐变、logo 卡、特性卡图标、表单字阶；SSO 结构按锁定契约；租户/记住/忘记密码按方向省略 | PASS |
| 07 | 表单设计器 | 07-reference/runtime.png | PASS | 令牌化面板/画布/工具栏 | PASS |
| 08 | 关联流程列表 | 08-reference/runtime.png | PASS | 关联流程 tab 真实表格 | PASS |
| 09 | 流程设计器 | 09-reference/runtime.png | PASS | 画布 #E8EDF6、节点文案真实定义 | PASS |
| 10 | 完整流程图 | 10-reference/runtime.png | PASS | 节点/边/图例设计色（#16A77B/#6F2DFF/#A4ADBE） | PASS |
| 11 | 字段属性列表 | 11-reference/runtime.png | PASS | 字段清单真实 schema 只读弹窗 | PASS |
| 12 | 审批人选择 | 12-reference/runtime.png | PASS | 弹窗圆角 12、表格令牌 | PASS |
| 13 | 流程高级配置 | 13-reference/runtime.png | PASS | 受限映射：现有通知模板真实能力页；无契约能力无入口 | PASS（受限映射） |
| 14 | 草稿历史版本 | 14-reference/runtime.png | PASS | 真实定义设计器历史版本弹窗 | PASS |
| 15 | 审批意见详情 | 15-reference/runtime.png | PASS | 弹窗圆角 12、字段排布 | PASS |
| 16 | 会签列表详情 | 15 组件复用（16-runtime=15 同组件） | PASS | 状态变体复用同一组件，无平行实现 | PASS（按组件） |
| 17 | 部门负责人审批意见 | 15 组件复用 | PASS | 同 16 | PASS（按组件） |
| 18 | 李宁会签审批意见 | 15 组件复用 | PASS | 同 16 | PASS（按组件） |
| 19 | 数据详情·流程图 | 19-reference/runtime.png | PASS | 长图滚动与定位（行为锁定项视觉重采） | PASS |
| 20 | 数据详情·审批列表 | 20-reference/runtime.png | PASS | 审批列表 tab + 查看详情 | PASS |
| 21 | 流程中心 | 21-reference/runtime.png | PASS | 分类 pill、卡片栅格、图标交替色 | PASS |
| 22 | 行政办公 | 22-reference/runtime.png | PASS | 真实分类「行政办公-p53ev」（0 事项空态） | PASS（分类名以服务端为准） |
| 23 | 财务管理 | 23-reference/runtime.png | PASS | 真实分类「人事财务-p53ev」 | PASS（命名差异按方向） |
| 24 | IT 运维 | 22-reference/runtime.png（空态） | PASS | 服务端无对应分类，空态诚实呈现 | PASS（数据状态变体） |
| 25 | 设备管理 | 23-reference/runtime.png（空态） | PASS | 同 24 | PASS（数据状态变体） |
| 26 | 平台权限 | 23-reference/runtime.png（空态） | PASS | 同 24 | PASS（数据状态变体） |
| 27 | 发起流程 | 27-reference/runtime.png | PASS | 表单卡/说明卡/令牌 | PASS |
| 28 | 用户端个人菜单 | 28-reference/runtime.png | PASS | 下拉令牌化；菜单项=真实能力契约 | PASS |
| 29 | 管理端个人菜单 | 29-reference/runtime.png | PASS | 同 28 共用组件 | PASS |
| 30 | 用户头像菜单原型 | 28 浮层状态 | PASS | 组件视觉基准，无独立路由 | PASS（按 28） |
| 31 | 修改密码原型 | 无运行时入口 | — | 仅保留未来参考，不计缺口 | N/A（方向 §5） |
| 32 | 管理端头像菜单原型 | 29 浮层状态 | PASS | 组件视觉基准，无独立路由 | PASS（按 29） |
