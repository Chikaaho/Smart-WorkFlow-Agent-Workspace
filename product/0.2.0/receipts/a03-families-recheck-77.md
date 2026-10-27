# 0.2.0 批次77：4:2/3:2 差异复查与 25 组件族覆盖矩阵

2026-10-27｜Executor｜任务03（唯一入口）｜0.2.0 IN_PROGRESS（1/1/5）

## 一、4:2 / 3:2 剩余固定项复查（关闭判断）

### 4:2 /workspace/my-instances（当前报告 88.839%，排除 0）

- 已实测关闭：列头文字起点 273/639/921/1296/1383/1515/1827 对参考 273/638/920/1296/1383/1515/1827（≤1px）；状态标签 24 高/10 内距（背景约 1281–1334 对参考 1281–1334）；日期控件去前置日历图标、文字左起约 x850；未选中页码去底色；用户端底部「|← 收起」贴左（图标 x16、文字 x44）与参考一致；选中项内缩 12（x12–222/223 对参考 x12–223）。
- 剩余且不属静态缺陷：参考 12 行示例（36 条记录）vs 真实 10 条/页（42 条）；单元格文本、状态、发起人、时间为真实数据；「查看＋更多」为合法动作超集（参考仅示例「查看」）。
- 判断：固定项关闭；数据/合法超集保留，不伪造 12 行、不删除「更多」。

### 3:2 /workspace（当前报告 97.892%，采集动态排除 38.96% 不合规，不作通过依据）

- 已实测关闭：hero 64/问候 24（统计卡顶边 149）；面板 261–744/485–744/763–1020 与参考逐带一致；面板内距 16/20/20、标题 16px/24（字形宽 64/63）、tabs 固定 100＋间距 16＋上距 16＋未选中主色蓝（激活底 277–376、文字 420/539/655 对参考 ≤1px）；四统计卡统一文档图标；效能「按时完成率」与标签/页脚位置（差 ≤3px）。
- 剩余：待办行首仍为实例主题（参考首行为流程名，TodoTask 无当前节点字段，保留真实字段组合）；快捷发起为真实空态（参考示例按钮不可伪造）；欢迎/统计/动态数值为真实数据；动态排除集超出 1% 上限。
- 判断：固定项关闭；真实数据与排除口径问题保持未通过，已如实登记。

## 二、规范页 25 组件族覆盖矩阵（design-blue-20261026 / 258:2）

> 口径：按 visual-acceptance-020.md §1/§5 登记「承接/共用/残余」；共用须注明消费者；残余为尚未取得对应视觉结果的状态，不结转为本轮通过。

| # | 组件族（设计对象） | 承接/消费者 | 现有有效结果 | 状态 |
| --- | --- | --- | --- | --- |
| 1 | ApplicationCard (258:104) | 应用中心 AppCenter/应用卡 | AppCenter.spec；无同态像素图 | 残余：视觉未采 |
| 2 | Brand / Logo (258:111) | AppLogo、登录品牌、顶栏 | 32:2 参考 97.98%；各页顶栏截图 | 视觉已验证（登录/顶栏） |
| 3 | Button (275:1247) | Element Plus 主题按钮全站 | 97/4/6/7 等页 runtime 对照 | 共用已验证 |
| 4 | Input (275:1248) | 全站输入/选择器 | 97/4/6/7 等页 runtime 对照 | 共用已验证 |
| 5 | Tag (275:1249) | 状态徽标（列表/详情） | 4:2、6:2 runtime 对照 | 共用已验证 |
| 6 | Navigation (275:1250) | AppMainNav 顶栏页签 | 3/4/6/7/97 runtime 对照 | 共用已验证 |
| 7 | FlowNode (275:1251) | ProcessGraphView、NodeIcon | 组件测试、设置页流程预览 | 残余：图形像素未采 |
| 8 | ListFilterBar / ListFilterItem (317:2056/2060) | page-layout/ListFilterBar | 4:2、6:2 runtime 对照 | 共用已验证 |
| 9 | FormField / FormText / FormSection (317:2063/2067、328:6438) | FormRender、DynamicField | 101 壳层实测；FormRender 32 例 | 部分：字段排版残余 |
| 10 | ListTable / ListPagination (317:2069/2085) | page-layout/ListTable、ListPagination | 4:2、6:2 runtime 对照 | 共用已验证 |
| 11 | AppSidebar 族（317:2073、343:6586、401:8637、706:41669/41690、725:44540） | AppSidebar/AppSidebarNode/图标 | 3/4/6 侧栏实测；收起态未复采 | 部分：收起态残余 |
| 12 | BusinessRecordLayout / RecordTopbar (317:2075、332:6487) | 5:2 详情布局、FormRender 填写顶栏 | 101 顶栏实测 | 部分：详情布局残余 |
| 13 | DetailDialog (322:5571) | BusinessDetailDialog | 组件测试 | 残余：弹窗视觉未采 |
| 14 | NodeProperties (351:6581) | 流程设计器节点属性 | 设计器测试 | 残余：视觉未采 |
| 15 | ScriptWorkspace (351:6584) | 脚本工作台 | 脚本相关测试 | 残余：视觉未采 |
| 16 | ThemeEntry (351:6590) | ThemeDialog/顶栏入口 | 58 计算值证据 | 部分：视觉未采 |
| 17 | FormControl 族（376:7330–7526，Select/Choice/Entity/Switch/Upload/RichText/Subtable/Date/Number） | DynamicField/适配器 | FormRender 32 例、25 控件盘点 | 部分：逐控件像素残余 |
| 18 | ProcessShortcut (376:7541) | 门户快捷服务卡 | 7:2 runtime（4 卡对 5 示例，智能助手不可用） | 已验证（合法超集差异） |
| 19 | WorkflowSettingsLayout (379:7962) | ProcessSettings | 设置页测试 | 残余：视觉未采 |
| 20 | FormPalette / FormProperties / FormTextProperties（401:8653/8751、489:16586） | 表单设计器三栏 | 设计器测试 | 残余：视觉未采 |
| 21 | NumberRuleBuilder (404:9320) | ThemeRuleDialog | ProcessDefList 规则编辑器用例 | 部分：弹窗视觉未采 |
| 22 | BusinessForm (425:10410) | 表单设计器画布/FormPreview | 设计器/预览测试 | 残余：视觉未采 |
| 23 | Checklist / ProcessCatalogRow (443:10154/10170) | ProcessCatalog 行结构 | 97 runtime 对照 | 共用已验证 |
| 24 | TenantScope / ApplicationMenu / IconPicker / ColorPicker / MenuPermissionTree / ActionMenu / MenuItem（457/467/471/474/526） | 应用管理/顶栏菜单/权限树 | 97 用户菜单、6:2 工具栏/列表；选择器与权限树未采 | 部分：选择器/权限树残余 |
| 25 | NodeFieldPermissions / WorkflowGrid / ApproverSource / WorkbenchCard / StatisticsChart（548、570、643、674） | 设计器权限、画布、工作台配置与 12 图表 | 66 图表/配置隔离回归；权限面板部分 | 部分：逐族视觉残余 |

统计：共用/视觉已验证 10 族；部分验证 9 族；残余待视觉 6 族。25 族均已有承接项与消费者登记，残余状态逐条列明，未以其他页首采冒作通过。

## 三、本轮结论与交接

- 4:2/3:2 固定项复查完成；真实数据/权限/合法超集与动态排除口径问题保持未通过，不伪造。
- 25 族完成「一画框一承接」登记；6 族残余（ApplicationCard、FlowNode、DetailDialog、NodeProperties、ScriptWorkspace、WorkflowSettingsLayout、FormPalette/Properties、BusinessForm 中的未采项）与 9 族部分验证的具体状态需要逐族交互编排与独立采集，列为下一轮视觉承接清单；本轮不以数量或总分宣称 25 族完成。
- 0.2.0 IN_PROGRESS（1/1/5）。A17 合并/发布/同步继续依赖整版验收。
