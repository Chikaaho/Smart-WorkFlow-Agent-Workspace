# P56 执行补充回执：G3/G6

日期：2026-09-02  
执行角色：Executor  
功能状态：`VERIFYING`  
补充范围：仅补齐规划验收审查02锁定的 G3、G6 缺口；G1/G2/G4/G5/G7 本轮不重复取证。

本回执为新增补充回执，保留既有执行回执与两次规划审查记录，不覆盖历史结论。

## G3-dynamic-height.md

### 验收环境

- 真实前端：`http://127.0.0.1:5173`，Vite 代理真实后端 `http://127.0.0.1:8080`，未启用 Mock。
- 真实后端：Spring Boot `dev` profile，H2 + Redis，健康检查返回 `200`、`status=UP`。
- 真实表单：`P56 G3动态行高验收`，formKey=`p56_g3动态行高验收`，formId=`05ddc6fe-1a2c-4d6e-97d0-634e486589c3`；真实发布后填写页可打开。
- 设计器侧真实子表配置回读：主表显示 `1 个子字段`；后端发布后主表与子表配置均可读取。

### G3-A：必填校验提示推动下一行下移

操作：打开真实填写页，保持 `field_1`（TEXT，必填）为空，点击真实 `提交` 按钮。

提交前 `.form-render-page__field` 矩形：

```json
[
  {"index":0,"name":"field_1","type":"TEXT","top":204.5,"left":318,"width":432,"height":62,"bottom":266.5},
  {"index":1,"name":"field_2","type":"TABLE","top":288.5,"left":318,"width":864,"height":87.3671875,"bottom":375.8671875},
  {"index":2,"name":"field_3","type":"TEXT","top":397.8671875,"left":318,"width":432,"height":62,"bottom":459.8671875}
]
```

提交后真实页面结果：

```json
{
  "error": {"for":"field_1","role":"alert","text":"此字段为必填项"},
  "topMessage": "请完善必填项后再提交",
  "submitRequest": "not called",
  "fields": [
    {"index":0,"name":"field_1","type":"TEXT","top":244.5,"width":432,"height":84,"bottom":328.5},
    {"index":1,"name":"field_2","type":"TABLE","top":350.5,"width":864,"height":87.3671875,"bottom":437.8671875},
    {"index":2,"name":"field_3","type":"TEXT","top":459.8671875,"width":432,"height":62,"bottom":521.8671875}
  ]
}
```

事实判定：

- 校验提示真实出现在字段内，且 `role=alert`、文本为 `此字段为必填项`。
- `field_1` 高度由 `62` 增至 `84`，错误提示参与 CSS Grid 行高计算。
- 后续 `field_2` 的 top 从 `288.5` 移至 `350.5`，没有固定占位覆盖。
- 提交后各行仍保持 `field_1.bottom=328.5 < field_2.top=350.5`、`field_2.bottom=437.8671875 < field_3.top=459.8671875`，无重叠、遮挡或截断。

### G3-B：TABLE 增行后的复杂组件高度变化

操作：刷新真实填写页，填入首字段 `已填写`，采集布局后点击真实 `+ 添加行` 按钮。

增行前：

```json
[
  {"index":0,"name":"field_1","type":"TEXT","top":204.5,"left":318,"width":432,"height":62,"bottom":266.5},
  {"index":1,"name":"field_2","type":"TABLE","top":288.5,"left":318,"width":864,"height":87.3671875,"bottom":375.8671875},
  {"index":2,"name":"field_3","type":"TEXT","top":397.8671875,"left":318,"width":432,"height":62,"bottom":459.8671875}
]
```

增行后：

```json
[
  {"index":0,"name":"field_1","type":"TEXT","top":200.5,"left":318,"width":432,"height":62,"bottom":262.5},
  {"index":1,"name":"field_2","type":"TABLE","top":284.5,"left":318,"width":864,"height":130.3671875,"bottom":414.8671875},
  {"index":2,"name":"field_3","type":"TEXT","top":436.8671875,"left":318,"width":432,"height":62,"bottom":498.8671875}
]
```

真实 DOM 同时回读：TABLE 的子表 `tbody` 行数由 `0` 变为 `1`，新增行包含真实 textbox 与删除按钮。

事实判定：

- TABLE 高度由 `87.3671875` 增至 `130.3671875`，真实新增一行。
- 下一行 `field_3` 的 top 从 `397.8671875` 移至 `436.8671875`，跟随真实组件高度变化。
- 增行后 `field_2.bottom=414.8671875 < field_3.top=436.8671875`，无跨行重叠、遮挡、截断或固定高度占位。

### G3 实现补充

- `FormRender.vue` 增加必填值校验、字段内 `role=alert` 校验提示和错误提示样式，使提示进入 CSS Grid 行高。
- `SubFieldDesigner.vue` 为子表独立控件库接通 `add` 事件，真实点击 `单行文本` 能写入子表字段上下文。
- `FormDefServiceImpl.java` 的主表配置读取限定 `parent_table IS NULL`，发布含 TABLE 的表单后不会把主表与子表配置混为单条结果。

## G6-save-permission.md

### G6-A：保存五态、持久化与受控失败恢复

真实可编辑草稿：`P56 G6保存权限验收`，formKey=`p56_g6保存权限验收`，formId=`a025f4b7-4777-473f-9ab4-b46a46c9e292`。

真实页面状态序列：

```text
未修改 → 未保存 → 保存中 → 保存成功 → 未修改
```

证据事实：

- 初次真实保存完成后页面为 `未修改`。
- 真实修改字段显示名为 `G6持久化字段` 后页面为 `未保存`。
- 在可恢复的受控网络等待环境中点击真实 `保存`，页面显示 `保存中`；此时保存按钮与发布按钮均为 disabled。
- 恢复真实 API 代理后重新点击真实 `保存`，页面显示 `保存成功`。
- 等待成功提示结束后页面回到 `未修改`；刷新设计器后仍为 `未修改`，字段内容仍保留，证明成功持久化。

受控失败证据：

- 对同一已保存草稿修改字段为 `G6受控失败保留`，真实点击 `保存`。
- 页面显示 `保存失败`，并出现真实请求错误提示；编辑器仍保留 `G6受控失败保留`，未丢失编辑内容。
- 恢复 API 代理后再次真实保存，页面显示 `保存成功`；刷新后该字段仍为 `G6受控失败保留`。
- 失败阶段没有后端写入失败内容；恢复后的成功保存是唯一产生持久化变更的请求。

### G6-B：已登录低权限用户的 403 与零副作用

测试用户通过真实用户管理页面创建：`p56_limited_0902`，真实登录成功，角色/权限为空数组 `[]`，与管理员处于同一开发租户。

真实浏览器深链：

```text
GET /form/designer/a025f4b7-4777-473f-9ab4-b46a46c9e292
```

页面真实结果：

```text
无权访问该表单
无权限
```

该页面没有渲染设计器画布、字段配置、保存、发布或历史版本操作。

同一已登录低权限会话的直接 HTTP 结果：

```json
{
  "loginCode": 0,
  "user": "p56_limited_0902",
  "permissions": [],
  "requests": [
    {"endpoint":"GET /api/form/def/{id}","status":403,"message":"无权限"},
    {"endpoint":"GET /api/form/def/{id}/definition","status":403,"message":"无权限"},
    {"endpoint":"POST /api/form/def/{id}/config","status":403,"message":"无权限"}
  ]
}
```

管理员同对象对照与零副作用回读：

```json
{
  "adminReadBefore": {"metadata":200,"definition":200,"status":"DRAFT"},
  "lowPrivilege": {"metadata":403,"definition":403,"save":403,"permissions":[]},
  "adminReadAfterUnauthorized": {
    "metadata":200,
    "definition":200,
    "status":"DRAFT",
    "metadataSha256":"8e96c845d6e4e83e31c0f63dec633181e7c51f7a90cd47fe3cc96793556341e2",
    "definitionSha256":"5012c2089ce8ef5632975a5fedc1d9548b5a62a5edb9b38e46633f114e7e8136",
    "zeroSideEffect":true
  },
  "adminLegalSave": {"status":200,"message":"success"}
}
```

管理员回读前后的 metadata 与 definition SHA-256 完全一致，状态保持 `DRAFT`；低权限用户的读取与保存请求均为 `403`，未用未登录 `401` 替代。管理员随后对同一对象执行一次合法保存，返回 `200 success`，作为正向权限对照。

### G6 实现与测试补充

- `FormDesigner.vue` 保持 `未修改/未保存/保存中/保存成功/保存失败` 状态机；保存失败保留编辑态与当前内容，成功后回读持久化结果。
- `FormDefinitionController` 的表单读取、definition 读取与 config 保存继续由 `form:design` / `form:design:save` 门禁保护。
- 前端聚焦测试：`FormRender.spec.ts`、`SubFieldDesigner.spec.ts`、`workbench.spec.ts`，3 个测试文件、23 项测试全部通过。
- 后端聚焦测试：`FormDefinitionControllerAuthorizationTest` 与 `FormDefinitionServiceTest`，23 项测试全部通过，Failures/Errors/Skipped 均为 0。

## 执行结论

- G3：校验提示、必填错误导致的行高变化、TABLE 增行后的复杂组件高度变化与下一行下移均已由真实页面矩形与 DOM 证据闭合。
- G6：保存五态、真实持久化、可恢复受控失败保留编辑内容、已登录低权限用户的读取/保存 `403` 与管理员对照、零副作用均已补齐。
- 未修改既有审查记录，不改变 G1/G2/G4/G5/G7 的历史结论，不改变功能状态；待 Planner 复核本补充回执。
