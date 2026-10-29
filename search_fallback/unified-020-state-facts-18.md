# 0.2.0 四项既有状态有限事实（提示18回传）

2026-10-29｜执行回传｜只核既有消费者/能力，不新增产品范围、不改代码数据权限。证据：`E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint/u020-18-facts.json` 与同名 PNG。

## 1. 278:1591 分类清单

- 入口：`/workflow/catalog-admin`（权限 `workflow:catalog:manage`，admin@tenant-0 实测）。
- 800 宽分类清单：**不存在独立 800 宽清单页**。现有消费者是页面底部内联「分类列表」卡片：整页宽（x0..1920）、表头 名称/排序/事项数/操作、真实 5 条分类（行政办公/IT运维/财务管理等）、行高 32、行内 编辑/删除。
- 420 新增/编辑框：即「新建分类」或行内「编辑」打开的 el-dialog，**420 宽**（实测 x750..1170），字段 名称/排序，按钮 取消/保存。
- 已核能力：分类读取（列表）、新增、编辑、删除、排序号、事项归属调整（420 弹窗，给事项选分类）；事项列表含分类列。
- 缺口判断：缺的是 800 分类清单的 **UI/触发与布局**，分类消费者与 CRUD 能力本身已存在。

## 2. 273:1642 查询受限

- 既有 A09 无查询权证据根：`E:/code/Smart-WorkFlow-Agent-Evidence/0.2.0/real-joint`（A09 行为已过，未重跑隔离/拒绝链）。
- 当前查询受限表面消费者：`src/modules/form/components/FormDataList.vue` 的 `.form-data-list__forbidden` / `data-forbidden` 区——无 `form:data:query` 时同一路由展示受限标题/说明，并保留已授权的填写/发起入口（`canSubmit` 时「新增」）。

## 3. 712:43454 收起入口完整名提示

- 入口：`/system/post` 系统侧栏收起态「岗位管理」图标按钮（`.sb-node__icon-btn[aria-label="岗位管理"]`，admin@tenant-0，一次有界观察）。
- 实际：`aria-label="岗位管理"`、`title="岗位管理"` 均在；hover 2s 后**无**可见自定义提示浮层（无 el-popper/role=tooltip 节点）。
- 结论：当前完整名机制为浏览器原生 `title`（实现见 `src/layouts/components/AppSidebarNode.vue:85` `:title="nodeTitle(node)"`），非原稿 x72 深色提示浮层。

## 4. 101:2 日期宽度

- 入口：`/form/form-render/form_a03_drill_87`（灾备演练申请-87，formKey `form_a03_drill_87`，状态 PUBLISHED，直接渲染正常）。
- 日期字段：`drillTime`，type=DATE、format=datetime、`data-col-span=12`（24 栅格右半列）；字段盒 x968/y196/**w598**/h60；控件盒 x968/y224/**220×32**。
- 宽度来源：控件 220 来自 Element Plus `--el-date-editor-width: 220px`（computed 220px）；父字段盒 598 未限制控件宽度。
- 既有配置边界：表单布局只暴露列 span（半列/整列），不暴露控件宽度；因此**不能仅靠既有正常配置**让日期控件吃满半列，需 Planner 裁决是否新增控件宽度规则。原 Date 规范资产与 1440/48/64 框架未改。
