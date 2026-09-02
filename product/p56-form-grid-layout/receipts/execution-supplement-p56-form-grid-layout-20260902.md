# P56 表单 24 列网格布局执行补充回执

> 执行角色：Executor  
> 执行日期：2026-09-02  
> 输入方向：`product/p56-form-grid-layout/ready/direction-p56-form-grid-layout.md`  
> 补证范围：规划审查 G1—G7  
> 当前功能状态：`VERIFYING`（本回执不替代 Planner 复核）

## 1. 本轮补证摘要

本轮在当前工作树完成了 P56 缺口补强，并连接真实前后端完成设计器、发布页、填写页和历史页操作：

- 控件库保留拖入，同时提供同一默认装配逻辑的可访问点击添加入口；画布和控件库启用鼠标回退拖拽及占位反馈。
- 设计器字段暴露类型、列名和列跨度，真实新增 8 类受支持控件后均获得合法默认跨度。
- 可选日期未填写时提交 `null`，避免空字符串写入动态 `TIMESTAMP` 列导致提交异常。
- 真实保存、刷新重开、发布、历史只读预览、填写提交、长文本自然增高和双标签深链均已执行。

## 2. 实现变更

### 前端

- `Smart-WorkFlow-Web/src/modules/form/designer/FieldPalette.vue`
  - 将控件条目改为可访问按钮，点击与拖入共用 `DesignerItem` 默认生成逻辑。
  - SortableJS 启用 `forceFallback`、`fallbackOnBody` 和 `fallbackTolerance`。
- `Smart-WorkFlow-Web/src/modules/form/views/FormDesigner.vue`
  - 接收控件库添加事件，写入画布并立即选中新字段。
- `Smart-WorkFlow-Web/src/modules/form/designer/DesignerCanvas.vue`
  - 画布启用同一套回退拖拽参数。
  - 真实字段节点提供 `data-field-type`、`data-field-name`、`data-col-span`。
- `Smart-WorkFlow-Web/src/modules/form/api/form.ts`
  - `DATE` 空值归一为 `null`，非空日期仍按字符串提交。
- `Smart-WorkFlow-Web/src/modules/form/api/form.spec.ts`
  - 增加可选日期空值归一回归断言。

### 后端

P56 后端列跨度校验与定义/快照持久化实现保持在当前工作树，未扩大到 P57/P58/P53。

## 3. G1—G7 行为证据

### G1：组件全覆盖、默认列宽、保存/预览/填写

真实登录身份：`admin`，页面显示“系统管理员”；真实页面为 `http://127.0.0.1:5173/form/designer`。

在真实设计器依次点击控件库 8 个按钮，画布回读 8 个字段：

```json
{
  "paletteCount": 8,
  "shellCount": 8,
  "types": [
    {"type":"TEXT","name":"field_1","span":"12"},
    {"type":"RICH_TEXT","name":"field_2","span":"24"},
    {"type":"NUMBER","name":"field_3","span":"12"},
    {"type":"DATE","name":"field_4","span":"12"},
    {"type":"BOOL","name":"field_5","span":"12"},
    {"type":"DICT","name":"field_6","span":"12"},
    {"type":"REFERENCE","name":"field_7","span":"12"},
    {"type":"TABLE","name":"field_8","span":"24"}
  ],
  "saveState": "未保存"
}
```

该表单使用真实“保存”按钮创建草稿 `fb42fd6a-d1e5-4126-a6a1-1cbae4f72974`，随后点击真实“预览”，预览对话框展示 8 类控件；刷新设计器后仍回读 8 类字段及上述跨度。

### G2：同行/跨行/前后拖动、跨度调整、删除收拢、保存回读

真实画布拖拽使用字段 `.field-shell__handle`：

1. `field_3` 从中间位置拖到首位，顺序由 `field_1,field_2,field_3,...` 变为 `field_3,field_1,field_2,...`。
2. `field_1` 跨行拖到后续位置，顺序变为 `field_3,field_2,field_1,field_4,...`。
3. 清理为 4 个字段后，同排拖动 `field_3` 与 `field_4`，顺序由 `field_2,field_1,field_3,field_4` 变为 `field_2,field_1,field_4,field_3`。
4. 选中 `field_1`，在真实“列宽”控件输入 `24`，画布即时回读 `data-col-span="24"`，宽度为 `410px`。
5. 点击真实删除按钮，删除按钮数量由 `9` 变为 `8`；随后保存并刷新，顺序和跨度仍保持一致。

最终保存回读（同一草稿深链）：

```json
{
  "url": "http://127.0.0.1:5173/form/designer/fb42fd6a-d1e5-4126-a6a1-1cbae4f72974",
  "saveState": "未修改",
  "order": [
    {"name":"field_2","type":"RICH_TEXT","span":"24"},
    {"name":"field_1","type":"TEXT","span":"24"},
    {"name":"field_4","type":"DATE","span":"12"},
    {"name":"field_3","type":"NUMBER","span":"12"}
  ]
}
```

### G3：动态高度、填写提交、无重叠

真实发布表单 `p56动态高度表`（设计器 ID `43e9fbcd-afc0-4141-8357-76adf37d6c2f`，V2）含 `RICH_TEXT=24` 与 `TEXT=12`。真实填写页输入 `600` 次“长内容-”（4200 字符），页面实测：

```json
{
  "fieldRects": [
    {"x":318,"y":189,"w":864,"h":122,"bottom":311},
    {"x":318,"y":333,"w":432,"h":62,"bottom":395}
  ],
  "textarea": {"x":326,"y":217,"w":848,"h":94,"bottom":311},
  "overlap": false
}
```

填写并点击真实“提交”后返回：`提交成功，记录 ID：c4429dc7-3354-48e0-a54b-abef3d8c94b9`。

### G4：保存/刷新/历史/发布前后预览/实际填写

- `p56动态高度表` 真实设计器显示 `已发布 V2`，字段顺序为 `RICH_TEXT(24) → TEXT(12)`。
- 刷新后真实填写页回读同一顺序与跨度：`RICH_TEXT(24)` 位于 `x=318,y=205,w=864,h=122`，`TEXT(12)` 位于 `x=318,y=349,w=432,h=62`。
- 真实“历史版本”显示 `V2 已发布`，点击“只读预览”打开 `P56动态高度表` 对话框并显示 `历史版本 V2 · 只读`；设计器编辑和保存按钮保持禁用。
- 真实“预览”已在含 8 类控件草稿中打开，发布表单的实际填写页也已完成成功提交。
- 另建真实发布表单 `p56真实验收表`（设计器 ID `7256d828-585f-4b57-83d6-5e0bd50ef8c3`，V2），真实填写单行文本并保持可选日期为空，提交返回：`提交成功，记录 ID：07735e52-3f9e-4437-a771-471fdc447508`。

### G5：双表单深链/多标签隔离

同时保留两个真实页面标签：

- 标签 A：`/form/designer/43e9fbcd-afc0-4141-8357-76adf37d6c2f`，回读 `RICH_TEXT(24) → TEXT(12)`。
- 标签 B：`/form/designer/fb42fd6a-d1e5-4126-a6a1-1cbae4f72974`，回读独立的 `RICH_TEXT(24) → TEXT(24) → DATE(12) → NUMBER(12)`。

两标签 URL、表单身份、字段类型和跨度分别保持独立，切换/刷新没有串位。

### G6：P52 主链与权限回归

- 真实 admin 身份已完成设计器菜单进入、保存、发布、历史只读预览、预览和填写提交；发布后表名输入框、保存、发布和控件编辑入口均按已发布状态禁用。
- 真实未认证请求直接访问设计端点：

```text
GET /api/form/def/fb42fd6a-d1e5-4126-a6a1-1cbae4f72974
HTTP/1.1 401
{"code":401,"msg":"未认证","data":null}

POST /api/form/def
HTTP/1.1 401
{"code":401,"msg":"未认证","data":null}
```

- 真实填写页提交链路复测通过，包含可选日期空值和长文本内容；字段校验与布局渲染均沿用既有 FormRender 链路。

### G7：门禁命令、退出码与计数

以下命令均绑定本次当前工作树：

| 范围 | 命令 | 结果 |
|---|---|---|
| 前端聚焦 | `pnpm exec vitest run src/modules/form/designer/DesignerCanvas.spec.ts src/modules/form/designer/PreviewModal.spec.ts src/modules/form/designer/definition-convert.spec.ts src/modules/form/utils/form-layout.spec.ts --reporter=dot` | exit `0`；4 files passed；31 tests passed |
| 前端全量 | `pnpm test -- --reporter=dot` | exit `0`；115 files passed、1 skipped；1097 tests passed、3 skipped |
| 前端类型/构建 | `NODE_OPTIONS="--max-old-space-size=2048" pnpm build` | exit `0`；`vue-tsc -b` 与 Vite build 完成，1831 modules transformed |
| 前端静态检查 | `pnpm exec eslint src/modules/form/designer/FieldPalette.vue src/modules/form/designer/DesignerCanvas.vue src/modules/form/views/FormDesigner.vue` | exit `0` |
| 后端全量 | `mvn test`（`Smart-WorkFlow-Server`） | exit `0`；reactor summary 全部 `SUCCESS`、`BUILD SUCCESS` |

后端本次 Surefire 报告目录共 `143` 个 `TEST-*.xml`，汇总为：

```text
tests=1004 failures=0 errors=0 skipped=0
```

P56 直接相关报告原始 tests 属性包括：`FormDefinitionServiceTest=15`、`FormSubmitServiceTest=5`、`FormSubmitControllerTest=4`、`FormDefinitionControllerAuthorizationTest=7`、`FormDataIsolationIntegrationTest=4`、`FormDataQueryServiceTest=22`、`FormDataUpdateServiceTest=9`、`FormDataDeleteServiceTest=7`、`FormSnapshotQueryTest$GetSnapshot=4`、`FormSnapshotQueryTest$ListSnapshots=4`，均为 `failures=0 errors=0 skipped=0`。

全量后端命令原始结尾：

```text
[INFO] Smart-WorkFlow :: Bootstrap ........................ SUCCESS [  7.136 s]
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
[INFO] Total time:  02:29 min
[INFO] Finished at: 2026-09-02T16:05:41+08:00
[INFO] ------------------------------------------------------------------------
```

## 4. 约束与状态

- 已锁定的验收标准 1、4 未重新展开；本回执只补 G1—G7。
- 未修改 P56 产品目标、24 列语义、纵向自动排布、无存量迁移和 P57/P58/P53 边界。
- 原规划审查记录保持不变；本回执只提供新增实现与行为事实，等待 Planner 复核后决定是否核销。
- 本轮未执行 Git commit 或 push。
